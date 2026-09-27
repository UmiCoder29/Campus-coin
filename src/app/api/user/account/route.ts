import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAccountSchema, formatZodErrors } from "@/lib/validators";

/**
 * DELETE /api/user/account
 * Permanently deletes the authenticated student's account and associated records
 * Requires password confirmation to prevent accidental or unauthorized deletion
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const result = deleteAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Password is required to delete account",
          errors: formatZodErrors(result.error),
        },
        { status: 400 }
      );
    }

    const { password } = result.data;

    // Fetch user password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    // Safety check: Prevent deleting platform administrator account from this endpoint
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Platform administrator accounts cannot be deleted from student settings" },
        { status: 403 }
      );
    }

    // Verify password confirmation
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect password. Account deletion aborted.",
          errors: { password: process.env.PASSWORD },
        },
        { status: 400 }
      );
    }

    // Delete user record (Cascades automatically to transactions, budgets, categories, insights, notifications, logs)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Account and associated data permanently deleted",
    });
  } catch (error) {
    console.error("DELETE /api/user/account error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account. Please try again or contact campus support." },
      { status: 500 }
    );
  }
}
