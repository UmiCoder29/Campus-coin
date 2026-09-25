import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
} from "@/lib/notification-service";
import { NotificationType } from "@prisma/client";

/**
 * GET /api/notifications
 * Lists notifications for the authenticated user (newest first) along with unreadCount.
 * Optional query params:
 * - unreadOnly=true
 * - type=BUDGET_WARNING | BUDGET_EXCEEDED | INSIGHT_READY | UNUSUAL_TRANSACTION | SYSTEM
 * - limit=number
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const typeParam = searchParams.get("type");
    const limitParam = searchParams.get("limit");

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100) : 50;
    const type = typeParam && Object.values(NotificationType).includes(typeParam as NotificationType)
      ? (typeParam as NotificationType)
      : undefined;

    const result = await getUserNotifications(session.user.id, {
      unreadOnly,
      type,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      totalCount: result.totalCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Supports bulk operations or single notification update via body:
 * - { action: "MARK_ALL_READ" }
 * - { action: "MARK_READ", id: "..." }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    if (action === "MARK_ALL_READ" || !id) {
      await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (id) {
      await markNotificationAsRead(id, session.user.id);
      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications?id=xxx
 * Deletes a single notification owned by the authenticated user.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    await deleteNotification(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/test
 * Helper endpoint for local demo & testing to trigger sample alerts
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, title, message, linkUrl, categoryId } = body;

    const notif = await createNotification({
      userId: session.user.id,
      type: type || "SYSTEM",
      title: title || "Demo Alert Notification",
      message: message || "This is a test notification verifying end-to-end delivery.",
      linkUrl: linkUrl || "/dashboard",
      categoryId: categoryId || null,
      relatedEntityType: categoryId ? "CATEGORY" : "SYSTEM",
    });

    return NextResponse.json({
      success: true,
      data: notif,
      message: "Notification created",
    });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate test notification" },
      { status: 500 }
    );
  }
}
