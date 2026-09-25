import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/stats
 * Aggregates system-wide usage statistics in the database without pulling raw rows into memory.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    // 1. Parallel Database Aggregations
    const [
      totalUsers,
      totalStudents,
      activeUsers,
      disabledUsers,
      totalTransactions,
      volumeAgg,
      expenseAgg,
      incomeAgg,
      totalBudgets,
      totalInsights,
      mostUsedCategoriesGroup,
      paymentMethodGroup,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "DISABLED" } }),
      prisma.transaction.count({ where: { deletedAt: null } }),
      prisma.transaction.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "EXPENSE", deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "INCOME", deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.budget.count(),
      prisma.insight.count(),
      // Top categories by transaction count (Database groupBy)
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 6,
      }),
      // Payment method distribution
      prisma.transaction.groupBy({
        by: ["paymentMethod"],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    // 2. Fetch category details for the top categories
    const categoryIds = mostUsedCategoriesGroup.map((c) => c.categoryId);
    const categoryDetails = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, type: true, color: true, icon: true },
    });

    const categoryMap = new Map(categoryDetails.map((c) => [c.id, c]));

    const topCategories = mostUsedCategoriesGroup.map((c) => {
      const details = categoryMap.get(c.categoryId);
      return {
        categoryId: c.categoryId,
        name: details?.name || "Uncategorized",
        type: details?.type || "EXPENSE",
        color: details?.color || "#6366F1",
        icon: details?.icon || "Tag",
        transactionCount: c._count.id,
        totalVolume: Number(c._sum.amount ?? 0),
      };
    });

    // 3. Format Payment Method Breakdown
    const paymentMethods = paymentMethodGroup.map((pm) => ({
      method: pm.paymentMethod,
      count: pm._count.id,
    }));

    // 4. Monthly Transaction Trend (Aggregated for Recharts)
    // Get transaction counts grouped by type for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        date: { gte: sixMonthsAgo },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    // Group in memory by month (already reduced to only date, type, amount)
    const monthlyMap: Record<string, { month: string; expenses: number; income: number; count: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleString("default", { month: "short" });
      monthlyMap[key] = { month: monthLabel, expenses: 0, income: 0, count: 0 };
    }

    for (const t of recentTransactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].count += 1;
        const val = Number(t.amount);
        if (t.type === "EXPENSE") monthlyMap[key].expenses += val;
        if (t.type === "INCOME") monthlyMap[key].income += val;
      }
    }

    const monthlyTrends = Object.values(monthlyMap);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalStudents,
          activeUsers,
          disabledUsers,
          totalTransactions,
          totalVolume: Number(volumeAgg._sum.amount ?? 0),
          averageTransaction: Number(volumeAgg._avg.amount ?? 0),
          totalExpenses: Number(expenseAgg._sum.amount ?? 0),
          totalIncome: Number(incomeAgg._sum.amount ?? 0),
          totalBudgets,
          totalInsights,
        },
        topCategories,
        paymentMethods,
        monthlyTrends,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to aggregate admin statistics" },
      { status: 500 }
    );
  }
}
