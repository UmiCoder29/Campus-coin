import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndCreateBudgetAlerts, getMonthBounds } from "@/lib/budget-service";
import { formatZodErrors } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateBudgetSchema = z.object({
  amount: z.coerce
    .number({ message: "Budget limit must be a number" })
    .positive("Budget limit must be greater than zero"),
  alertThreshold: z.coerce.number().min(1).max(100).default(80).optional(),
  rolloverUnused: z.boolean().optional(),
});

/**
 * PUT /api/budgets/[id]
 * Updates amount or preferences for an existing budget
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = updateBudgetSchema.safeParse(body);

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

    const { amount, alertThreshold, rolloverUnused } = parseResult.data;

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        amount,
        ...(alertThreshold !== undefined ? { alertThreshold } : {}),
        ...(rolloverUnused !== undefined ? { rolloverUnused } : {}),
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

    // Re-check spending against the updated limit
    const bounds = getMonthBounds(existing.month);
    const spendAgg = await prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        categoryId: existing.categoryId,
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
      existing.categoryId,
      existing.category.name,
      currentSpent,
      Number(amount),
      currentPercent,
      bounds.monthStr
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Budget updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

/**
 * DELETE /api/budgets/[id]
 * Deletes a budget record scoped to the logged-in user
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
