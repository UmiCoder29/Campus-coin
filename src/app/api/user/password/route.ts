import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema, formatZodErrors } from "@/lib/validators";

/**
 * POST /api/user/password
 * Securely updates the authenticated student's password after verifying the current password
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Invalid password data",
          errors: formatZodErrors(result.error),
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // Fetch user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    // Verify current password with bcrypt
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect",
          errors: { currentPassword: process.env.PASSWORD },
        },
        { status: 400 }
      );
    }

    // Check that new password is not identical to current password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from your current password",
          errors: { newPassword: process.env.PASSWORD },
        },
        { status: 400 }
      );
    }

    // Hash new password using bcryptjs (cost factor 10)
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("POST /api/user/password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while updating password" },
      { status: 500 }
    );
  }
}
