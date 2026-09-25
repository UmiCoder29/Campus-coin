import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateRuleBasedTips } from "@/lib/tips-service";
import { getMonthBounds } from "@/lib/budget-service";

/**
 * GET /api/saving-tips?month=YYYY-MM
 * Fetches personalized rule-based saving tips for the authenticated student.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const bounds = getMonthBounds(month);

    // Evaluate deterministic rules to populate/refresh tips
    const evalResult = await evaluateRuleBasedTips(session.user.id, bounds.monthStr);

    // Fetch all user tips for this month partitioned by status
    const allTips = await prisma.savingTip.findMany({
      where: {
        userId: session.user.id,
        month: bounds.monthStr,
      },
      orderBy: [
        { impactScore: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Fetch active admin announcements and broadcast tips
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const activeTips = allTips.filter((t) => t.status === "ACTIVE");
    const pinnedTips = allTips.filter((t) => t.status === "PINNED");
    const dismissedTips = allTips.filter((t) => t.status === "DISMISSED");

    return NextResponse.json({
      success: true,
      data: {
        isLowData: evalResult.isLowData,
        message: evalResult.isLowData ? evalResult.message : null,
        month: bounds.monthStr,
        monthName: bounds.monthName,
        year: bounds.year,
        counts: {
          active: activeTips.length,
          pinned: pinnedTips.length,
          dismissed: dismissedTips.length,
          total: allTips.length,
          announcements: announcements.length,
        },
        announcements,
        activeTips,
        pinnedTips,
        dismissedTips,
        allTips,
      },
    });
  } catch (error) {
    console.error("Failed to fetch saving tips:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching saving tips" },
      { status: 500 }
    );
  }
}
