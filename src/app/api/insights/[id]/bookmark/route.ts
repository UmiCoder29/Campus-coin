import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/insights/[id]/bookmark
 * Toggles or sets bookmark status on a monthly insight.
 * Scoped strictly to session.user.id.
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Insight ID is required" }, { status: 400 });
    }

    const existing = await prisma.insight.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const isBookmarked =
      typeof body.isBookmarked === "boolean"
        ? body.isBookmarked
        : !existing.isBookmarked;

    const updated = await prisma.insight.update({
      where: { id },
      data: { isBookmarked },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: isBookmarked
        ? "Insight bookmarked to your collection."
        : "Insight removed from bookmarks.",
    });
  } catch (error: any) {
    console.error("Failed to toggle insight bookmark:", error);
    return NextResponse.json(
      { error: "Failed to update insight bookmark" },
      { status: 500 }
    );
  }
}
