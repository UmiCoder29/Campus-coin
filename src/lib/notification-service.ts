import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  categoryId?: string | null;
  relatedEntityId?: string | null;
  relatedEntityType?: "CATEGORY" | "INSIGHT" | "TRANSACTION" | "ANNOUNCEMENT" | "BUDGET" | "SYSTEM" | string | null;
  month?: string | null;
}

/**
 * Creates a notification if a duplicate for the same threshold/month doesn't already exist.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl ?? null,
        categoryId: input.categoryId ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
        relatedEntityType: input.relatedEntityType ?? null,
        month: input.month ?? null,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Fetches notifications for a user, sorted newest first, with unread count.
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }
) {
  const where: any = { userId };
  if (options?.unreadOnly) {
    where.isRead = false;
  }
  if (options?.type) {
    where.type = options.type;
  }

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.notification.count({
      where,
    }),
  ]);

  return { notifications, unreadCount, totalCount };
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(id: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Deletes a single notification.
 */
export async function deleteNotification(id: string, userId: string) {
  return await prisma.notification.deleteMany({
    where: { id, userId },
  });
}

/**
 * Evaluates budget thresholds and unusual transaction anomalies after an expense is logged.
 */
export async function evaluateTransactionNotifications(params: {
  userId: string;
  transactionId: string;
  amount: number;
  type: string;
  categoryId: string;
  categoryName: string;
  merchant?: string | null;
  description: string;
  date: Date;
}) {
  if (params.type !== "EXPENSE") return;

  const d = new Date(params.date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const monthStr = `${year}-${month}`;

  // 1. Check if an active budget exists for this category and month
  const budget = await prisma.budget.findFirst({
    where: {
      userId: params.userId,
      categoryId: params.categoryId,
      month: monthStr,
    },
  });

  if (budget) {
    const budgetCap = Number(budget.amount);
    const thresholdPercent = budget.alertThreshold || 80;

    // Calculate total spend this month in this category
    const startOfMonth = new Date(year, d.getMonth(), 1);
    const endOfMonth = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);

    const spendAgg = await prisma.transaction.aggregate({
      where: {
        userId: params.userId,
        categoryId: params.categoryId,
        type: "EXPENSE",
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const totalSpent = Number(spendAgg._sum.amount ?? 0);
    const percentage = budgetCap > 0 ? (totalSpent / budgetCap) * 100 : 0;

    // Threshold 1: 80% to 100% warning
    if (percentage >= thresholdPercent && percentage <= 100) {
      const existingWarning = await prisma.notification.findFirst({
        where: {
          userId: params.userId,
          type: "BUDGET_WARNING",
          categoryId: params.categoryId,
          month: monthStr,
        },
      });

      if (!existingWarning) {
        await createNotification({
          userId: params.userId,
          type: "BUDGET_WARNING",
          title: `Budget Alert: ${params.categoryName} reached ${percentage.toFixed(0)}%`,
          message: `You've spent $${totalSpent.toFixed(2)} of your $${budgetCap.toFixed(2)} limit for ${params.categoryName} (${(budgetCap - totalSpent).toFixed(2)} remaining).`,
          linkUrl: `/budgets?category=${params.categoryId}`,
          categoryId: params.categoryId,
          relatedEntityId: params.categoryId,
          relatedEntityType: "CATEGORY",
          month: monthStr,
        });
      }
    }

    // Threshold 2: >100% exceeded alert
    if (percentage > 100) {
      const existingExceeded = await prisma.notification.findFirst({
        where: {
          userId: params.userId,
          type: "BUDGET_EXCEEDED",
          categoryId: params.categoryId,
          month: monthStr,
        },
      });

      if (!existingExceeded) {
        const over = totalSpent - budgetCap;
        await createNotification({
          userId: params.userId,
          type: "BUDGET_EXCEEDED",
          title: `Budget Exceeded: ${params.categoryName}!`,
          message: `You have exceeded your ${params.categoryName} budget by $${over.toFixed(2)} ($${totalSpent.toFixed(2)} spent / $${budgetCap.toFixed(2)} cap).`,
          linkUrl: `/budgets?category=${params.categoryId}`,
          categoryId: params.categoryId,
          relatedEntityId: params.categoryId,
          relatedEntityType: "CATEGORY",
          month: monthStr,
        });
      }
    }
  }

  // 2. Anomaly Detection: Unusual Transaction
  // Flag if single student transaction > $250 or > 40% of monthly budget
  const isLargeAmount = params.amount >= 250;
  const isBudgetSpike = budget && budget.amount ? params.amount >= Number(budget.amount) * 0.5 : false;

  if (isLargeAmount || isBudgetSpike) {
    const existingAnomaly = await prisma.notification.findFirst({
      where: {
        userId: params.userId,
        type: "UNUSUAL_TRANSACTION",
        relatedEntityId: params.transactionId,
      },
    });

    if (!existingAnomaly) {
      await createNotification({
        userId: params.userId,
        type: "UNUSUAL_TRANSACTION",
        title: `Unusual Spending Detected: $${params.amount.toFixed(2)}`,
        message: `A transaction of $${params.amount.toFixed(2)} at "${params.merchant || params.description}" in ${params.categoryName} was detected as higher than standard pacing.`,
        linkUrl: `/transactions?highlight=${params.transactionId}`,
        categoryId: params.categoryId,
        relatedEntityId: params.transactionId,
        relatedEntityType: "TRANSACTION",
        month: monthStr,
      });
    }
  }
}

/**
 * Checks and creates budget threshold warnings for an entire category across a month.
 */
export async function checkBudgetAlertsForCategory(
  userId: string,
  categoryId: string,
  targetDate = new Date()
) {
  try {
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const monthStr = `${year}-${month}`;

    const budget = await prisma.budget.findFirst({
      where: { userId, categoryId, month: monthStr },
      include: { category: true },
    });

    if (!budget) return;

    const budgetCap = Number(budget.amount);
    const thresholdPercent = budget.alertThreshold || 80;

    const startOfMonth = new Date(year, targetDate.getMonth(), 1);
    const endOfMonth = new Date(year, targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const spendAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: "EXPENSE",
        deletedAt: null,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const totalSpent = Number(spendAgg._sum.amount ?? 0);
    const percentage = budgetCap > 0 ? (totalSpent / budgetCap) * 100 : 0;

    if (percentage >= 100) {
      const existing = await prisma.notification.findFirst({
        where: { userId, type: "BUDGET_EXCEEDED", categoryId, month: monthStr },
      });
      if (!existing) {
        await createNotification({
          userId,
          type: "BUDGET_EXCEEDED",
          title: `Budget Exceeded: ${budget.category.name}`,
          message: `You've exceeded your $${budgetCap.toFixed(2)} budget for ${budget.category.name} (Total spent: $${totalSpent.toFixed(2)}).`,
          linkUrl: `/budgets?category=${categoryId}`,
          categoryId,
          month: monthStr,
          relatedEntityId: budget.id,
          relatedEntityType: "BUDGET",
        });
      }
    } else if (percentage >= thresholdPercent) {
      const existing = await prisma.notification.findFirst({
        where: { userId, type: "BUDGET_WARNING", categoryId, month: monthStr },
      });
      if (!existing) {
        await createNotification({
          userId,
          type: "BUDGET_WARNING",
          title: `Budget Alert: ${budget.category.name} reached ${percentage.toFixed(0)}%`,
          message: `You've spent $${totalSpent.toFixed(2)} of your $${budgetCap.toFixed(2)} limit for ${budget.category.name}.`,
          linkUrl: `/budgets?category=${categoryId}`,
          categoryId,
          month: monthStr,
          relatedEntityId: budget.id,
          relatedEntityType: "BUDGET",
        });
      }
    }
  } catch (error) {
    console.warn("Failed to check budget alerts for category:", error);
  }
}

