import { prisma } from "@/lib/prisma";
import { getMonthBounds } from "@/lib/budget-service";

export interface ReportFilterParams {
  month?: string | null;
  categoryIds?: string[];
  type?: "ALL" | "EXPENSE" | "INCOME";
}

export interface CategoryPieItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TrendMonthItem {
  monthStr: string; // YYYY-MM
  label: string;    // e.g. "Apr", "May"
  fullLabel: string; // "Apr 2026"
  income: number;
  expense: number;
  net: number;
  savingsRate: number; // percentage
  isProjection?: boolean;
  projectedExpense?: number;
  projectedIncome?: number;
}

export interface DailySpendItem {
  dateStr: string; // YYYY-MM-DD
  day: number;
  dayName: string; // Mon, Tue, etc.
  amount: number;
  count: number;
}

export interface WeeklySpendItem {
  week: string; // "Week 1", "Week 2", etc.
  rangeLabel: string; // "Sep 1 - Sep 7"
  amount: number;
  count: number;
}

export interface SavingsSummaryBudget {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "ON_TRACK" | "WARNING" | "EXCEEDED";
}

export interface SavingsSummaryTip {
  id: string;
  title: string;
  content: string;
  category: string;
  estimatedSavings: number | null;
  status: string;
}

export interface SavingsSummaryData {
  budgets: SavingsSummaryBudget[];
  tips: SavingsSummaryTip[];
}


export async function getFinancialReports(userId: string, filters: ReportFilterParams = {}) {
  const bounds = getMonthBounds(filters.month);

  // 1. Prepare Category Filter criteria
  const categoryFilterClause: { categoryId?: { in: string[] } } = {};
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    categoryFilterClause.categoryId = { in: filters.categoryIds };
  }

  // 2. Prepare Transaction Type criteria
  const typeFilterClause: { type?: "INCOME" | "EXPENSE" } = {};
  if (filters.type && filters.type !== "ALL") {
    typeFilterClause.type = filters.type;
  }

  // Base where condition for current month's transactions
  const monthWhere = {
    userId,
    deletedAt: null,
    date: {
      gte: bounds.startDate,
      lte: bounds.endDate,
    },
    ...categoryFilterClause,
    ...typeFilterClause,
  };

  // 3. Category-wise Breakdown for Selected Month
  const categoryAgg = await prisma.transaction.groupBy({
    by: ["categoryId", "type"],
    where: monthWhere,
    _sum: { amount: true },
    _count: { id: true },
  });

  // Fetch category details
  const categoryIds = Array.from(new Set(categoryAgg.map((item) => item.categoryId)));
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  let totalMonthSpend = 0;
  let totalMonthIncome = 0;

  const categoryTotals = new Map<string, number>();

  // Separate expense items for the category breakdown donut
  const rawExpenseCategories: {
    id: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    count: number;
  }[] = [];

  for (const item of categoryAgg) {
    const amt = item._sum.amount ? Number(item._sum.amount) : 0;
    if (item.type === "EXPENSE") {
      totalMonthSpend += amt;
      categoryTotals.set(item.categoryId, amt);
      const cat = catMap.get(item.categoryId);
      if (cat) {
        rawExpenseCategories.push({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          amount: Number(amt.toFixed(2)),
          count: item._count.id,
        });
      }
    } else if (item.type === "INCOME") {
      totalMonthIncome += amt;
    }
  }

  // Sort descending by amount and calculate percentages
  rawExpenseCategories.sort((a, b) => b.amount - a.amount);
  const categoryBreakdown: CategoryPieItem[] = rawExpenseCategories.map((c) => ({
    ...c,
    percentage:
      totalMonthSpend > 0 ? Number(((c.amount / totalMonthSpend) * 100).toFixed(1)) : 0,
  }));

  // 4. Six-Month Trend (Last 6 Months up to selected month)
  const trendMonths: TrendMonthItem[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(bounds.year, bounds.monthIndex - i, 1));
    const mStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const mBounds = getMonthBounds(mStr);

    const mAgg = await prisma.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        deletedAt: null,
        date: {
          gte: mBounds.startDate,
          lte: mBounds.endDate,
        },
        ...categoryFilterClause,
      },
      _sum: { amount: true },
    });

    let inc = 0;
    let exp = 0;
    for (const item of mAgg) {
      const val = item._sum.amount ? Number(item._sum.amount) : 0;
      if (item.type === "INCOME") inc = val;
      if (item.type === "EXPENSE") exp = val;
    }

    const net = inc - exp;
    const savingsRate = inc > 0 ? Math.max(0, Number(((net / inc) * 100).toFixed(1))) : 0;

    trendMonths.push({
      monthStr: mStr,
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      fullLabel: `${d.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`,
      income: Number(inc.toFixed(2)),
      expense: Number(exp.toFixed(2)),
      net: Number(net.toFixed(2)),
      savingsRate,
    });
  }

  // 4b. Next-Month Linear Forecast Projection (Based on last 3 months velocity)
  const last3 = trendMonths.slice(-3);
  const avgExpense = last3.reduce((s, m) => s + m.expense, 0) / Math.max(last3.length, 1);
  const avgIncome = last3.reduce((s, m) => s + m.income, 0) / Math.max(last3.length, 1);
  const nextMonthDate = new Date(Date.UTC(bounds.year, bounds.monthIndex + 1, 1));
  const nextMonthStr = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;

  trendMonths.push({
    monthStr: nextMonthStr,
    label: `${nextMonthDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}*`,
    fullLabel: `${nextMonthDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${nextMonthDate.getUTCFullYear()} (Projected)`,
    income: Number(avgIncome.toFixed(2)),
    expense: Number(avgExpense.toFixed(2)),
    net: Number((avgIncome - avgExpense).toFixed(2)),
    savingsRate: avgIncome > 0 ? Number((((avgIncome - avgExpense) / avgIncome) * 100).toFixed(1)) : 0,
    isProjection: true,
    projectedExpense: Number(avgExpense.toFixed(2)),
    projectedIncome: Number(avgIncome.toFixed(2)),
  });

  // 5. Daily and Weekly Spending Summaries for Selected Month
  const allMonthTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      deletedAt: null,
      date: {
        gte: bounds.startDate,
        lte: bounds.endDate,
      },
      ...categoryFilterClause,
    },
    select: {
      date: true,
      amount: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const lastDay = bounds.endDate.getUTCDate();
  const dailyMap = new Map<number, { amount: number; count: number }>();
  for (let day = 1; day <= lastDay; day++) {
    dailyMap.set(day, { amount: 0, count: 0 });
  }

  for (const tx of allMonthTransactions) {
    const day = tx.date.getUTCDate();
    const curr = dailyMap.get(day) || { amount: 0, count: 0 };
    dailyMap.set(day, {
      amount: curr.amount + Number(tx.amount),
      count: curr.count + 1,
    });
  }

  const dailyBreakdown: DailySpendItem[] = [];
  let highestSpendDay = { day: 0, amount: 0, dateStr: "" };

  for (let day = 1; day <= lastDay; day++) {
    const dObj = new Date(Date.UTC(bounds.year, bounds.monthIndex, day));
    const dayData = dailyMap.get(day)!;
    const dateStr = `${bounds.monthStr}-${String(day).padStart(2, "0")}`;
    const dayName = dObj.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" });

    if (dayData.amount > highestSpendDay.amount) {
      highestSpendDay = { day, amount: dayData.amount, dateStr };
    }

    dailyBreakdown.push({
      dateStr,
      day,
      dayName,
      amount: Number(dayData.amount.toFixed(2)),
      count: dayData.count,
    });
  }

  // 6. Weekly Spending Rollup (Weeks 1 to 5)
  const weeklyBreakdown: WeeklySpendItem[] = [];
  const weekRanges = [
    { week: "Week 1", start: 1, end: 7 },
    { week: "Week 2", start: 8, end: 14 },
    { week: "Week 3", start: 15, end: 21 },
    { week: "Week 4", start: 22, end: 28 },
    { week: "Week 5", start: 29, end: lastDay },
  ];

  for (const wr of weekRanges) {
    if (wr.start > lastDay) continue;
    const actualEnd = Math.min(wr.end, lastDay);
    let weekTotal = 0;
    let weekCount = 0;

    for (let day = wr.start; day <= actualEnd; day++) {
      const data = dailyMap.get(day);
      if (data) {
        weekTotal += data.amount;
        weekCount += data.count;
      }
    }

    weeklyBreakdown.push({
      week: wr.week,
      rangeLabel: `${bounds.monthName.slice(0, 3)} ${wr.start}–${actualEnd}`,
      amount: Number(weekTotal.toFixed(2)),
      count: weekCount,
    });
  }

  // 7. Overall Summary Stats
  const totalNet = totalMonthIncome - totalMonthSpend;
  const savingsRate =
    totalMonthIncome > 0 ? Number(((totalNet / totalMonthIncome) * 100).toFixed(1)) : 0;
  
  // Calculate average daily spend (days elapsed or days with spend)
  const now = new Date();
  let daysDivisor = lastDay;
  if (now.getUTCFullYear() === bounds.year && now.getUTCMonth() === bounds.monthIndex) {
    daysDivisor = Math.max(1, now.getUTCDate());
  }
  const averageDailySpend = Number((totalMonthSpend / daysDivisor).toFixed(2));

  // Count total transactions matching filter
  const totalTransactionsCount = await prisma.transaction.count({
    where: monthWhere,
  });

  // 8. Savings Summary: Budgets Pacing & Monthly Saving Tips
  const [monthBudgets, activeTips] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month: bounds.monthStr },
      include: { category: true },
    }),
    prisma.savingTip.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "PINNED"] },
      },
      take: 4,
      orderBy: [{ status: "desc" }, { impactScore: "desc" }],
    }),
  ]);

  const budgetSummary: SavingsSummaryBudget[] = monthBudgets.map((b) => {
    const limit = Number(b.amount);
    const spent = categoryTotals.get(b.categoryId) || 0;
    const remaining = limit - spent;
    const percentage = limit > 0 ? Number(((spent / limit) * 100).toFixed(1)) : 0;
    let status: "ON_TRACK" | "WARNING" | "EXCEEDED" = "ON_TRACK";
    if (spent > limit) status = "EXCEEDED";
    else if (percentage >= b.alertThreshold) status = "WARNING";

    return {
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryColor: b.category.color,
      budgetLimit: limit,
      spent: Number(spent.toFixed(2)),
      remaining: Number(remaining.toFixed(2)),
      percentage,
      status,
    };
  });

  const tipSummary: SavingsSummaryTip[] = activeTips.map((t) => ({
    id: t.id,
    title: t.title,
    content: t.content,
    category: t.category,
    estimatedSavings: t.estimatedSavings ? Number(t.estimatedSavings) : null,
    status: t.status,
  }));

  // User details for personalized report naming
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, academicYear: true, university: true },
  });

  return {
    bounds,
    user: {
      name: user?.name || "Student",
      email: user?.email || "",
      university: user?.university || "Campus Coin University",
    },
    filters: {
      month: bounds.monthStr,
      categoryIds: filters.categoryIds || [],
      type: filters.type || "ALL",
    },
    summary: {
      totalIncome: Number(totalMonthIncome.toFixed(2)),
      totalExpense: Number(totalMonthSpend.toFixed(2)),
      netSavings: Number(totalNet.toFixed(2)),
      savingsRate,
      averageDailySpend,
      topCategory: categoryBreakdown[0] || null,
      highestSpendDay: highestSpendDay.amount > 0 ? highestSpendDay : null,
      totalTransactionsCount,
      hasData: totalTransactionsCount > 0,
    },
    categoryBreakdown,
    trendMonths,
    dailyBreakdown,
    weeklyBreakdown,
    savingsSummary: {
      budgets: budgetSummary,
      tips: tipSummary,
    },
  };
}
