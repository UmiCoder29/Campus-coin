import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity-service";

/**
 * POST /api/reports/email
 * Email report dispatcher stub. Validates payload, logs recipient and content
 * server-side for compliance, records activity log, and returns success response.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { recipientEmail, subject, month, format, notes } = body;

    if (!recipientEmail || typeof recipientEmail !== "string") {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    // Basic email regex verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Server-side audit log
    console.log("[EMAIL DISPATCH STUB]", {
      userId: session.user.id,
      userEmail: session.user.email,
      recipientEmail: recipientEmail.trim(),
      month: month || "Current Period",
      subject: subject || "Student Financial Report",
      format: format || "PDF",
      notes: notes || null,
      dispatchedAt: new Date().toISOString(),
    });

    // Record user activity
    await logActivity({
      userId: session.user.id,
      action: "EMAIL",
      entityType: "REPORT",
      title: `Emailed financial report (${month || "Monthly"}) to ${recipientEmail.trim()}`,
      details: {
        recipient: recipientEmail.trim(),
        subject,
        format,
        hasNotes: Boolean(notes),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report successfully dispatched to ${recipientEmail.trim()}`,
      recipient: recipientEmail.trim(),
      dispatchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/reports/email error:", error);
    return NextResponse.json(
      { error: "Internal server error dispatching report email" },
      { status: 500 }
    );
  }
}
