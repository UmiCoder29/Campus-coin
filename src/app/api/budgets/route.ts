import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBudgetVsActual, getMonthBounds, checkAndCreateBudgetAlerts } from "@/lib/budget-service";
import { formatZodErrors } from "@/lib/validators";

const budgetInputSchema = z.object({
  categoryId: z.string({ message: "Category is required" }).min(1, "Category is required"),
  amount: z.coerce
    .number({ message: "Budget limit must be a valid number" })
    .positive("Budget limit must be greater than zero"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format").optional(),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
  rolloverUnused: z.boolean().default(false),
});

/**
 * GET /api/budgets?month=YYYY-MM
 * Lists all active budgets with computed actual spend, progress percentage,
 * and status (NORMAL, WARNING, EXCEEDED) for the selected month.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const result = await getBudgetVsActual(session.user.id, month);

    return NextResponse.json({
      success: true,
      data: result.items,
      summary: {
        totalBudget: result.totalBudget,
        totalSpentOnBudgeted: result.totalSpentOnBudgeted,
        overallPercentage: result.overallPercentage,
        hasBudgets: result.hasBudgets,
        hasPreviousMonthBudgets: result.hasPreviousMonthBudgets,
        previousMonthBudgetCount: result.previousMonthBudgetCount,
      },
      bounds: result.bounds,
    });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets
 * Creates or updates a budget record for [userId, categoryId, month].
 * Validates category belongs to user or system defaults and is an EXPENSE category.
 * 
 * DESIGN NOTE:
 * In Campus Coin, budgets represent student expense spending caps (e.g. $250 on Dining).
 * Income targets are tracked independently through Monthly Allowance baselines and
 * Savings Goals on the student profile.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = budgetInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: formatZodErrors(parseResult.error),
        },
        { status: 400 }
      );
    }

    const { categoryId, amount, alertThreshold, rolloverUnused } = parseResult.data;
    const bounds = getMonthBounds(parseResult.data.month);

    // Validate category exists and is accessible
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category",
          details: { categoryId: "Selected category does not exist." },
        },
        { status: 400 }
      );
    }

    if (!category.isDefault && category.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          details: { categoryId: "You do not have permission to access this category." },
        },
        { status: 403 }
      );
    }

    // Guard: Budgets are for EXPENSE categories
    if (category.type !== "EXPENSE") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category type",
          details: {
            categoryId: `Budgets are spending caps for expense categories. "${category.name}" is an income category.`,
          },
        },
        { status: 400 }
      );
    }

    // Upsert budget on [userId, categoryId, month]
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: session.user.id,
          categoryId,
          month: bounds.monthStr,
        },
      },
      update: {
        amount,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        alertThreshold,
        rolloverUnused,
      },
      create: {
        userId: session.user.id,
        categoryId,
        amount,
        period: "MONTHLY",
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        alertThreshold,
        rolloverUnused,
        month: bounds.monthStr,
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
    });

    // Check spending immediately and trigger alert if already crossing thresholds
    const spendAgg = await prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        categoryId,
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
    });

    const currentSpent = spendAgg._sum.amount ? Number(spendAgg._sum.amount) : 0;
    const currentPercent = (currentSpent / Number(amount)) * 100;
    await checkAndCreateBudgetAlerts(
      session.user.id,
      categoryId,
      category.name,
      currentSpent,
      Number(amount),
      currentPercent,
      bounds.monthStr
    );

    return NextResponse.json(
      {
        success: true,
        data: budget,
        message: `Budget of $${Number(amount).toFixed(2)} set for ${category.name} in ${bounds.monthName} ${bounds.year}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save budget" },
      { status: 500 }
    );
  }
}
