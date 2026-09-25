import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bookmarks
 * Returns unified collection of pinned saving tips and bookmarked monthly insights.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [pinnedTips, bookmarkedInsights] = await Promise.all([
      prisma.savingTip.findMany({
        where: {
          userId,
          status: "PINNED",
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.insight.findMany({
        where: {
          userId,
          isBookmarked: true,
        },
        orderBy: { generatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalCount: pinnedTips.length + bookmarkedInsights.length,
        pinnedTips,
        bookmarkedInsights,
      },
    });
  } catch (error) {
    console.error("GET /api/bookmarks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}
