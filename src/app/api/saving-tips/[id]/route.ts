import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { updateTipStatus } from "@/lib/tips-service";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PINNED", "DISMISSED"], {
    message: "Status must be ACTIVE, PINNED, or DISMISSED",
  }),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/saving-tips/[id]
 * Updates status of a saving tip (PINNED, DISMISSED, ACTIVE).
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
      return NextResponse.json({ error: "Tip ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const updatedTip = await updateTipStatus(
      session.user.id,
      id,
      parsed.data.status
    );

    return NextResponse.json({
      success: true,
      data: updatedTip,
      message: `Tip marked as ${parsed.data.status.toLowerCase()}.`,
    });
  } catch (error: any) {
    console.error("Failed to update saving tip status:", error);
    if (error?.message?.includes("not found")) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error while updating saving tip" },
      { status: 500 }
    );
  }
}
