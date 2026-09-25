import { prisma } from "@/lib/prisma";

/**
 * RECURRENCE ARCHITECTURE & DESIGN DECISION:
 * 
 * We store recurrence rules directly on the Transaction model using:
 * - isRecurring (boolean)
 * - recurringInterval (string: "MONTHLY")
 * - recurringEndDate (DateTime | null): null means "until cancelled"
 * - recurringGroupId (string | null): UUID/CUID grouping all materialized instances of the recurring series
 * - deletedAt (DateTime | null): Soft deletion flag ensuring audit trails and SRS historical integrity
 * 
 * WHY THIS APPROACH:
 * In a student finance app, recurring items (monthly allowance, hostel rent, subscriptions like Spotify/Netflix,
 * gym membership) occur on a predictable monthly cadence. Attaching the recurrence rule and grouping key
 * directly to the transaction records ensures:
 * 1. Historical immutability: each past occurrence exists as an independent row with its own actual amount and date.
 * 2. Series cohesion: recurringGroupId enables bulk actions ("this and all future occurrences").
 * 3. Simplicity: zero extra relational joins, faster queries on Neon Serverless Postgres.
 * 
 * OCCURRENCE MATERIALIZATION:
 * We support dual materialization:
 * 1. On-Demand Materialization: automatically executed whenever a student loads their transactions or dashboard.
 *    Any missing monthly occurrences between the last recorded occurrence and today are generated on the fly.
 * 2. Scheduled Cron Job Stub: materialized via /api/cron/recurring-transactions for production cron workers
 *    (e.g., Vercel Cron, AWS EventBridge, or GitHub Actions scheduled workflows).
 */

function addMonthsPreservingDay(baseDate: Date, monthsToAdd: number): Date {
  const d = new Date(baseDate.getTime());
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + monthsToAdd);

  // If the target month has fewer days (e.g. Jan 31 -> Feb 28), adjust to the last day of that month
  if (d.getDate() !== originalDay) {
    d.setDate(0);
  }
  return d;
}

/**
 * Generates any missing monthly occurrences for a specific user up to the current day.
 */
export async function materializeUserRecurringTransactions(userId: string): Promise<number> {
  const now = new Date();
  // Strip time for clean date comparisons at start of day
  const todayEndOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Find all active recurring transactions for this user
  const recurringTxList = await prisma.transaction.findMany({
    where: {
      userId,
      isRecurring: true,
      deletedAt: null,
      recurringGroupId: { not: null },
    },
    orderBy: {
      date: "desc",
    },
  });

  if (recurringTxList.length === 0) {
    return 0;
  }

  // Group by recurringGroupId to find the latest occurrence and base template
  const seriesMap = new Map<string, typeof recurringTxList>();
  for (const tx of recurringTxList) {
    if (!tx.recurringGroupId) continue;
    const existing = seriesMap.get(tx.recurringGroupId) || [];
    existing.push(tx);
    seriesMap.set(tx.recurringGroupId, existing);
  }

  let totalMaterialized = 0;

  for (const [groupId, occurrences] of seriesMap.entries()) {
    // occurrences is sorted desc by date, so occurrences[0] is the latest one
    const latestOccurrence = occurrences[0];
    const template = occurrences[occurrences.length - 1]; // earliest occurrence has original metadata

    // Check if the recurring series has expired
    if (template.recurringEndDate && template.recurringEndDate < now) {
      continue;
    }

    const latestDate = new Date(latestOccurrence.date);
    let nextDate = addMonthsPreservingDay(latestDate, 1);

    const newTransactionsToCreate = [];

    while (nextDate <= todayEndOfDay) {
      // Check if past recurrence end date
      if (template.recurringEndDate && nextDate > template.recurringEndDate) {
        break;
      }

      // Avoid creating duplicates on the exact same date
      const alreadyExists = occurrences.some(
        (o) =>
          new Date(o.date).getFullYear() === nextDate.getFullYear() &&
          new Date(o.date).getMonth() === nextDate.getMonth() &&
          new Date(o.date).getDate() === nextDate.getDate()
      );

      if (!alreadyExists) {
        newTransactionsToCreate.push({
          userId: template.userId,
          categoryId: template.categoryId,
          amount: template.amount,
          type: template.type,
          description: template.description,
          date: nextDate,
          paymentMethod: template.paymentMethod,
          merchant: template.merchant,
          notes: template.notes,
          isRecurring: true,
          recurringInterval: template.recurringInterval || "MONTHLY",
          recurringEndDate: template.recurringEndDate,
          recurringGroupId: groupId,
          tags: template.tags,
        });
      }

      nextDate = addMonthsPreservingDay(nextDate, 1);
    }

    if (newTransactionsToCreate.length > 0) {
      await prisma.$transaction(
        newTransactionsToCreate.map((item) => prisma.transaction.create({ data: item }))
      );
      totalMaterialized += newTransactionsToCreate.length;
    }
  }

  return totalMaterialized;
}

/**
 * Materializes recurring transactions across all active students (used by Cron jobs)
 */
export async function materializeAllRecurringTransactions(): Promise<{ usersProcessed: number; transactionsCreated: number }> {
  const usersWithRecurring = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      deletedAt: null,
      recurringGroupId: { not: null },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  let transactionsCreated = 0;
  for (const { userId } of usersWithRecurring) {
    const created = await materializeUserRecurringTransactions(userId);
    transactionsCreated += created;
  }

  return {
    usersProcessed: usersWithRecurring.length,
    transactionsCreated,
  };
}
