import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, logAdminAction } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

/**
 * PATCH /api/admin/announcements/[id]
 * Updates title, body, category, or toggles active status.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, body: content, category, isActive } = body;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: title?.trim() || existing.title,
        body: content?.trim() || existing.body,
        category: category || existing.category,
        isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
      },
    });

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "ANNOUNCEMENT_UPDATE",
      targetType: "ANNOUNCEMENT",
      targetId: id,
      details: {
        title: updated.title,
        isActive: updated.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Announcement updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/announcements/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Deletes an announcement template.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "ANNOUNCEMENT_DELETE",
      targetType: "ANNOUNCEMENT",
      targetId: id,
      details: { title: existing.title },
    });

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/announcements/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements/[id]
 * Broadcasts this announcement as a notification to all active students.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Find all active students
    const students = await prisma.user.findMany({
      where: { role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });

    await Promise.all(
      students.map((student) =>
        createNotification({
          userId: student.id,
          type: "SYSTEM",
          title: `Announcement: ${announcement.title}`,
          message: announcement.body,
          linkUrl: "/saving-tips",
          relatedEntityId: announcement.id,
          relatedEntityType: "ANNOUNCEMENT",
        })
      )
    );

    // Mark as broadcasted
    await prisma.announcement.update({
      where: { id },
      data: { broadcasted: true },
    });

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "ANNOUNCEMENT_BROADCAST",
      targetType: "ANNOUNCEMENT",
      targetId: id,
      details: {
        title: announcement.title,
        studentsCount: students.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Announcement broadcasted to ${students.length} student account(s)`,
    });
  } catch (error) {
    console.error("POST /api/admin/announcements/[id]/broadcast error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to broadcast announcement" },
      { status: 500 }
    );
  }
}
