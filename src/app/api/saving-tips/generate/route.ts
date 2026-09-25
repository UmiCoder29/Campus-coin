import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evaluateRuleBasedTips } from "@/lib/tips-service";

/**
 * POST /api/saving-tips/generate
 * Re-runs the deterministic rules engine on demand (e.g., after student saves budget or transaction).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let month: string | undefined;
    try {
      const body = await req.json();
      month = body?.month;
    } catch {
      // Body is optional
    }

    const result = await evaluateRuleBasedTips(session.user.id, month);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Personalized saving tips updated successfully from latest spending trends.",
    });
  } catch (error) {
    console.error("Failed to generate saving tips:", error);
    return NextResponse.json(
      { error: "Internal server error while evaluating saving tips" },
      { status: 500 }
    );
  }
}
