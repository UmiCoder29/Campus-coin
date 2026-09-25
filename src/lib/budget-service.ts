import { prisma } from "@/lib/prisma";

export interface MonthBounds {
  monthStr: string; // "YYYY-MM"
  startDate: Date;
  endDate: Date;
  year: number;
  monthIndex: number; // 0-11
  monthName: string;
  daysRemaining: number;
  previousMonthStr: string;
  nextMonthStr: string;
}

/**
 * TIMEZONE & CALENDAR MONTH BOUNDS STRATEGY:
 * Consistent UTC Calendar Month Boundaries.
 * All financial aggregations, budget limits, and monthly reports evaluate dates
 * between `YYYY-MM-01T00:00:00.000Z` and `YYYY-MM-[lastDay]T23:59:59.999Z`.
 * This avoids edge-of-month timezone skew between server and student devices.
 */
export function getMonthBounds(monthParam?: string | null): MonthBounds {
  let year: number;
  let monthIndex: number;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const parts = monthParam.split("-");
    year = parseInt(parts[0], 10);
    monthIndex = parseInt(parts[1], 10) - 1;
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    monthIndex = now.getUTCMonth();
  }

  const monthStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

  const monthName = startDate.toLocaleString("en-US", { month: "long", timeZone: "UTC" });

  // Calculate days remaining in the month relative to now
  const now = new Date();
  const lastDay = endDate.getUTCDate();
  let daysRemaining = 0;
  if (now.getUTCFullYear() === year && now.getUTCMonth() === monthIndex) {
    daysRemaining = Math.max(0, lastDay - now.getUTCDate());
  } else if (now < startDate) {
    daysRemaining = lastDay;
  } else {
    daysRemaining = 0;
  }

  // Previous month calculation
  const prevDate = new Date(Date.UTC(year, monthIndex - 1, 1));
  const previousMonthStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;

  // Next month calculation
  const nextDate = new Date(Date.UTC(year, monthIndex + 1, 1));
  const nextMonthStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;

  return {
    monthStr,
    startDate,
    endDate,
    year,
    monthIndex,
    monthName,
    daysRemaining,
    previousMonthStr,
    nextMonthStr,
  };
}

export interface BudgetVsActualItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "NORMAL" | "WARNING" | "EXCEEDED";
  isOver: boolean;
  overAmount: number;
}

/**
 * Unified Budget vs. Actual aggregation engine.
 * Pushes summing into PostgreSQL Prisma groupBy queries for maximum scalability.
 * Shared directly by the Budgets page and the Dashboard "Budget vs. Actual" widget.
 */
export async function getBudgetVsActual(userId: string, monthParam?: string | null) {
  const bounds = getMonthBounds(monthParam);

  // 1. Fetch user budgets for this specific month
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month: bounds.monthStr,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
          type: true,
        },
      },
    },
    orderBy: {
      amount: "desc",
    },
  });

  // 2. Aggregate actual spending per category in database using Prisma groupBy
  const spendingAgg = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      deletedAt: null, // Exclude soft-deleted transactions
      date: {
        gte: bounds.startDate,
        lte: bounds.endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const spendMap = new Map<string, number>();
  for (const item of spendingAgg) {
    spendMap.set(item.categoryId, item._sum.amount ? Number(item._sum.amount) : 0);
  }

  // 3. Build Budget vs Actual items and check threshold alerts
  const items: BudgetVsActualItem[] = [];
  let totalBudget = 0;
  let totalSpentOnBudgeted = 0;

  for (const b of budgets) {
    const limit = Number(b.amount);
    const spent = spendMap.get(b.categoryId) || 0;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const remaining = Math.max(0, limit - spent);
    const isOver = spent > limit;
    const overAmount = isOver ? spent - limit : 0;

    let status: "NORMAL" | "WARNING" | "EXCEEDED" = "NORMAL";
    if (percentage > 100) {
      status = "EXCEEDED";
    } else if (percentage >= 80) {
      status = "WARNING";
    }

    totalBudget += limit;
    totalSpentOnBudgeted += spent;

    items.push({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryIcon: b.category.icon,
      categoryColor: b.category.color,
      limit,
      spent,
      remaining,
      percentage: Number(percentage.toFixed(1)),
      status,
      isOver,
      overAmount: Number(overAmount.toFixed(2)),
    });

    // 4. Threshold notification trigger (80% and 100% threshold crossings)
    // Run asynchronously to record once per month per threshold
    checkAndCreateBudgetAlerts(userId, b.categoryId, b.category.name, spent, limit, percentage, bounds.monthStr).catch(
      (err) => console.error("Budget alert creation error:", err)
    );
  }

  // Check if previous month has budgets available to copy forward (for month rollover)
  const previousMonthBudgetCount = await prisma.budget.count({
    where: {
      userId,
      month: bounds.previousMonthStr,
    },
  });

  const overallPercentage = totalBudget > 0 ? (totalSpentOnBudgeted / totalBudget) * 100 : 0;

  return {
    bounds,
    items,
    totalBudget: Number(totalBudget.toFixed(2)),
    totalSpentOnBudgeted: Number(totalSpentOnBudgeted.toFixed(2)),
    overallPercentage: Number(overallPercentage.toFixed(1)),
    hasBudgets: items.length > 0,
    hasPreviousMonthBudgets: previousMonthBudgetCount > 0,
    previousMonthBudgetCount,
  };
}

/**
 * Triggers alert notifications when spending crosses 80% or 100%.
 * Ensures exactly one notification per threshold crossing per month.
 */
export async function checkAndCreateBudgetAlerts(
  userId: string,
  categoryId: string,
  categoryName: string,
  spent: number,
  limit: number,
  percentage: number,
  monthStr: string
) {
  // Threshold 1: 80% - 100% warning
  if (percentage >= 80 && percentage <= 100) {
    const existingWarning = await prisma.notification.findFirst({
      where: {
        userId,
        type: "BUDGET_WARNING",
        categoryId,
        month: monthStr,
      },
    });

    if (!existingWarning) {
      await prisma.notification.create({
        data: {
          userId,
          type: "BUDGET_WARNING",
          title: `Budget Warning: ${categoryName} at ${percentage.toFixed(0)}%`,
          message: `You have spent $${spent.toFixed(2)} of your $${limit.toFixed(2)} monthly limit for ${categoryName}.`,
          linkUrl: "/budgets",
          categoryId,
          month: monthStr,
        },
      });
    }
  }

  // Threshold 2: >100% exceeded alert
  if (percentage > 100) {
    const existingExceeded = await prisma.notification.findFirst({
      where: {
        userId,
        type: "BUDGET_EXCEEDED",
        categoryId,
        month: monthStr,
      },
    });

    if (!existingExceeded) {
      const over = spent - limit;
      await prisma.notification.create({
        data: {
          userId,
          type: "BUDGET_EXCEEDED",
          title: `Budget Exceeded: ${categoryName}`,
          message: `Alert: You are over budget by $${over.toFixed(2)} for ${categoryName} ($${spent.toFixed(2)} spent / $${limit.toFixed(2)} cap).`,
          linkUrl: "/budgets",
          categoryId,
          month: monthStr,
        },
      });
    }
  }
}

/**
 * Comprehensive Dashboard Aggregation Service.
 * Calculates current month income/expenses, net cashflow, all-time balance,
 * top expense category, and live budget vs. actual pacing.
 */
export async function getDashboardMetrics(userId: string, monthParam?: string | null) {
  const bounds = getMonthBounds(monthParam);

  // 1. Current Month Income & Expense Totals (Prisma groupBy in DB)
  const currentMonthTotals = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      deletedAt: null,
      date: {
        gte: bounds.startDate,
        lte: bounds.endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  let currentMonthIncome = 0;
  let currentMonthExpense = 0;
  for (const item of currentMonthTotals) {
    const val = item._sum.amount ? Number(item._sum.amount) : 0;
    if (item.type === "INCOME") currentMonthIncome = val;
    if (item.type === "EXPENSE") currentMonthExpense = val;
  }
  const currentMonthNet = currentMonthIncome - currentMonthExpense;

  // 2. All-Time Cumulative Totals (Prisma groupBy in DB)
  const allTimeTotals = await prisma.transaction.groupBy({
    by: ["type"],
    where: {
      userId,
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  });

  let allTimeIncome = 0;
  let allTimeExpense = 0;
  for (const item of allTimeTotals) {
    const val = item._sum.amount ? Number(item._sum.amount) : 0;
    if (item.type === "INCOME") allTimeIncome = val;
    if (item.type === "EXPENSE") allTimeExpense = val;
  }
  const allTimeNetBalance = allTimeIncome - allTimeExpense;

  // 3. This Month's Top Expense Category
  const topCategoriesAgg = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: "EXPENSE",
      deletedAt: null,
      date: {
        gte: bounds.startDate,
        lte: bounds.endDate,
      },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
    take: 1,
  });

  let topCategory: {
    id: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentOfTotal: number;
    trend: string;
    trendUp: boolean;
  } | null = null;

  if (topCategoriesAgg.length > 0 && topCategoriesAgg[0]._sum.amount) {
    const topAgg = topCategoriesAgg[0];
    const topAmount = Number(topAgg._sum.amount);
    const catDetails = await prisma.category.findUnique({
      where: { id: topAgg.categoryId },
    });

    if (catDetails) {
      const percentOfTotal =
        currentMonthExpense > 0 ? Number(((topAmount / currentMonthExpense) * 100).toFixed(1)) : 0;

      // Calculate previous month spend for this same category to determine trend
      const prevMonthBounds = getMonthBounds(bounds.previousMonthStr);
      const prevSpendAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: catDetails.id,
          type: "EXPENSE",
          deletedAt: null,
          date: {
            gte: prevMonthBounds.startDate,
            lte: prevMonthBounds.endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const prevAmount = prevSpendAgg._sum.amount ? Number(prevSpendAgg._sum.amount) : 0;
      let trend = "0%";
      let trendUp = false;

      if (prevAmount > 0) {
        const diff = ((topAmount - prevAmount) / prevAmount) * 100;
        trendUp = diff > 0;
        trend = `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`;
      } else {
        trend = "New this month";
        trendUp = true;
      }

      topCategory = {
        id: catDetails.id,
        name: catDetails.name,
        icon: catDetails.icon,
        color: catDetails.color,
        amount: Number(topAmount.toFixed(2)),
        percentOfTotal,
        trend,
        trendUp,
      };
    }
  }

  // 4. Budget vs. Actual Pacing (Shared Service)
  const budgetVsActualData = await getBudgetVsActual(userId, bounds.monthStr);

  // 5. Recent Transactions (latest 5 with categories)
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 5,
  });

  // 6. User Profile allowance and savings goal
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      monthlyAllowance: true,
      savingsGoal: true,
    },
  });

  const monthlyAllowance = user?.monthlyAllowance ? Number(user.monthlyAllowance) : 0;
  const savingsGoal = user?.savingsGoal ? Number(user.savingsGoal) : 0;

  // Total transaction count across all time
  const totalTransactionCount = await prisma.transaction.count({
    where: { userId, deletedAt: null },
  });

  return {
    month: bounds.monthStr,
    monthName: bounds.monthName,
    year: bounds.year,
    daysRemaining: bounds.daysRemaining,
    isCurrentMonth: bounds.monthStr === getMonthBounds().monthStr,
    totalTransactionCount,
    hasTransactions: totalTransactionCount > 0,

    // Current Month Figures
    monthIncome: Number(currentMonthIncome.toFixed(2)),
    monthExpense: Number(currentMonthExpense.toFixed(2)),
    monthNet: Number(currentMonthNet.toFixed(2)),

    // All-time Cumulative Figures
    allTimeIncome: Number(allTimeIncome.toFixed(2)),
    allTimeExpense: Number(allTimeExpense.toFixed(2)),
    allTimeNetBalance: Number(allTimeNetBalance.toFixed(2)),

    // Budget Pacing
    budgetTotal: budgetVsActualData.totalBudget,
    budgetSpent: budgetVsActualData.totalSpentOnBudgeted,
    budgetUsedPercent: budgetVsActualData.overallPercentage,
    budgetVsActual: budgetVsActualData.items,
    hasBudgets: budgetVsActualData.hasBudgets,
    hasPreviousMonthBudgets: budgetVsActualData.hasPreviousMonthBudgets,

    // Top Category
    topCategory,

    // Student Targets
    monthlyAllowance,
    savingsGoal,

    // Recent Transactions
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx.id,
      merchant: tx.merchant || tx.description,
      description: tx.description,
      category: tx.category?.name || "Uncategorized",
      icon: tx.category?.icon || "Tag",
      color: tx.category?.color || "#6366F1",
      date: tx.date.toISOString(),
      amount: tx.type === "EXPENSE" ? -Math.abs(Number(tx.amount)) : Math.abs(Number(tx.amount)),
      type: tx.type,
    })),
  };
}

/**
 * Copies forward all budget limits from the previous month into targetMonth.
 * Implements the Month Rollover feature so students don't need to re-type limits.
 */
export async function copyBudgetsFromPreviousMonth(userId: string, targetMonth: string) {
  const bounds = getMonthBounds(targetMonth);
  const previousMonthBudgets = await prisma.budget.findMany({
    where: {
      userId,
      month: bounds.previousMonthStr,
    },
  });

  if (previousMonthBudgets.length === 0) {
    return { copiedCount: 0, message: "No budgets found in previous month to copy." };
  }

  let copiedCount = 0;
  for (const prev of previousMonthBudgets) {
    // Upsert into target month
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId,
          categoryId: prev.categoryId,
          month: bounds.monthStr,
        },
      },
      update: {
        amount: prev.amount,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        alertThreshold: prev.alertThreshold,
        rolloverUnused: prev.rolloverUnused,
      },
      create: {
        userId,
        categoryId: prev.categoryId,
        amount: prev.amount,
        period: "MONTHLY",
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        alertThreshold: prev.alertThreshold,
        rolloverUnused: prev.rolloverUnused,
        month: bounds.monthStr,
      },
    });
    copiedCount++;
  }

  return {
    copiedCount,
    message: `Successfully rolled over ${copiedCount} category budget(s) from ${bounds.previousMonthStr} to ${bounds.monthStr}.`,
  };
}
