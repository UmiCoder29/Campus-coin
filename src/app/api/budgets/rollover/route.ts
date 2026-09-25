import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { copyBudgetsFromPreviousMonth, getMonthBounds } from "@/lib/budget-service";

/**
 * POST /api/budgets/rollover
 * 
 * Rollover feature: Copies all budget limits from the previous month into
 * the current or specified target month. This eliminates tedious manual entry
 * while giving students the autonomy to approve or modify limits.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetMonth: string | undefined;
    try {
      const body = await req.json();
      targetMonth = body.targetMonth;
    } catch {
      // Empty body is valid (defaults to current month)
    }

    const bounds = getMonthBounds(targetMonth);
    const result = await copyBudgetsFromPreviousMonth(session.user.id, bounds.monthStr);

    return NextResponse.json({
      success: true,
      ...result,
      month: bounds.monthStr,
    });
  } catch (error) {
    console.error("POST /api/budgets/rollover error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to rollover budgets" },
      { status: 500 }
    );
  }
}
