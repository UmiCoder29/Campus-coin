import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/budget-service";
import { materializeUserRecurringTransactions } from "@/lib/recurring";

/**
 * GET /api/dashboard/stats?month=YYYY-MM
 * 
 * Computes live, scalable financial KPIs for the student dashboard.
 * - Pushes sums and aggregates into PostgreSQL via Prisma groupBy
 * - Executes on-demand recurring materialization
 * - Returns current-month figures, all-time balance, top expense category,
 *   budget pacing, and recent activity
 * - Gracefully handles zero-data scenarios with structured defaults (no NaN or undefined)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Trigger on-demand recurring materialization silently
    try {
      await materializeUserRecurringTransactions(userId);
    } catch (e) {
      console.warn("Dashboard materialization warning:", e);
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const metrics = await getDashboardMetrics(userId, month);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute dashboard metrics" },
      { status: 500 }
    );
  }
}
