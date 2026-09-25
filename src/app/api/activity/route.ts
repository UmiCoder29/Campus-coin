import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecentActivities, getRecentTransactions } from "@/lib/activity-service";

/**
 * GET /api/activity
 * Returns recent activity logs and recently viewed/edited transactions for the logged-in user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const [activities, recentTransactions] = await Promise.all([
      getRecentActivities(userId, 10),
      getRecentTransactions(userId, 6),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user activity" },
      { status: 500 }
    );
  }
}
