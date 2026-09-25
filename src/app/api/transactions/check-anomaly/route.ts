import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/transactions/check-anomaly
 * Evaluates whether a proposed transaction is unusually large or a potential duplicate.
 * Non-blocking advisory check for students.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { amount, categoryId, type, excludeId } = body;

    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0 || !categoryId) {
      return NextResponse.json({
        isUnusuallyLarge: false,
        isDuplicate: false,
      });
    }

    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Check for Duplicate (same amount + category within 24 hours)
    const duplicateMatch = await prisma.transaction.findFirst({
      where: {
        userId,
        categoryId,
        amount: numAmount,
        type: type || "EXPENSE",
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        createdAt: { gte: past24Hours },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        createdAt: true,
      },
    });

    // 2. Check for Unusually Large Expense (> 2.5x historical category average, min 3 historical records)
    const historicalTxs = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        type: type || "EXPENSE",
        deletedAt: null,
        createdAt: { gte: past90Days },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { amount: true },
    });

    let isUnusuallyLarge = false;
    let categoryAverage = 0;
    let multiple = 0;

    if (historicalTxs.length >= 3) {
      const sum = historicalTxs.reduce((acc, t) => acc + Number(t.amount), 0);
      categoryAverage = sum / historicalTxs.length;

      // Flag if amount is > 2.5x historical average and above $15 threshold
      if (numAmount >= 15 && numAmount > categoryAverage * 2.5) {
        isUnusuallyLarge = true;
        multiple = Number((numAmount / categoryAverage).toFixed(1));
      }
    }

    return NextResponse.json({
      success: true,
      isUnusuallyLarge,
      isDuplicate: Boolean(duplicateMatch),
      details: {
        historicalCount: historicalTxs.length,
        categoryAverage: Number(categoryAverage.toFixed(2)),
        multiple,
        duplicateTransaction: duplicateMatch
          ? {
              id: duplicateMatch.id,
              description: duplicateMatch.description,
              amount: Number(duplicateMatch.amount),
              createdAt: duplicateMatch.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("POST /api/transactions/check-anomaly error:", error);
    return NextResponse.json(
      { error: "Anomaly check failed" },
      { status: 500 }
    );
  }
}
