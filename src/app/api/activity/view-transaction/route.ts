import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordTransactionView, logActivity } from "@/lib/activity-service";

/**
 * POST /api/activity/view-transaction
 * Marks transaction as recently viewed.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { transactionId, description } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    await recordTransactionView(session.user.id, transactionId);
    await logActivity({
      userId: session.user.id,
      action: "VIEW",
      entityType: "TRANSACTION",
      entityId: transactionId,
      title: `Viewed transaction: ${description || "Expense record"}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark transaction viewed:", error);
    return NextResponse.json({ error: "Failed to update view timestamp" }, { status: 500 });
  }
}
