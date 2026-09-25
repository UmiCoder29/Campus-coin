import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, logAdminAction } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

/**
 * GET /api/admin/announcements
 * Fetches all announcement / saving-tip templates with their status and broadcast details.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("GET /api/admin/announcements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 * Creates a new announcement / tip template.
 * If broadcastImmediately is true, broadcasts a notification to all active students.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { title, body: content, category, isActive = true, broadcastImmediately = false } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title and body are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        body: content.trim(),
        category: category || "GENERAL",
        isActive: Boolean(isActive),
        broadcasted: Boolean(broadcastImmediately),
      },
    });

    let broadcastCount = 0;
    if (broadcastImmediately) {
      // Find all active students
      const students = await prisma.user.findMany({
        where: { role: "STUDENT", status: "ACTIVE" },
        select: { id: true },
      });

      // Broadcast notifications in batches
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
      broadcastCount = students.length;
    }

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "ANNOUNCEMENT_CREATE",
      targetType: "ANNOUNCEMENT",
      targetId: announcement.id,
      details: {
        title: announcement.title,
        category: announcement.category,
        broadcasted: broadcastImmediately,
        studentsNotified: broadcastCount,
      },
    });

    return NextResponse.json({
      success: true,
      data: announcement,
      message: broadcastImmediately
        ? `Announcement created and broadcasted to ${broadcastCount} student(s)`
        : "Announcement template created successfully",
    });
  } catch (error) {
    console.error("POST /api/admin/announcements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
