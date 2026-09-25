import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, logAdminAction } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/users/[id]
 * Read-only activity summary for an individual user:
 * - Profile data
 * - Financial summary (income, expense, net balance)
 * - Last 10 transactions
 * - Active budgets
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        university: true,
        studentId: true,
        academicYear: true,
        monthlyAllowance: true,
        savingsGoal: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Aggregate user financial statistics
    const [txAgg, recentTransactions, budgets, notifCount] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: id, deletedAt: null },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId: id, deletedAt: null },
        include: {
          category: {
            select: { name: true, color: true, icon: true },
          },
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.budget.findMany({
        where: { userId: id },
        include: {
          category: { select: { name: true, color: true } },
        },
        orderBy: { month: "desc" },
        take: 5,
      }),
      prisma.notification.count({ where: { userId: id } }),
    ]);

    let totalExpense = 0;
    let totalIncome = 0;
    let totalTransactions = 0;

    for (const item of txAgg) {
      const sum = Number(item._sum.amount ?? 0);
      const count = item._count.id;
      totalTransactions += count;
      if (item.type === "EXPENSE") totalExpense += sum;
      if (item.type === "INCOME") totalIncome += sum;
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          totalTransactions,
          totalExpense,
          totalIncome,
          netBalance: totalIncome - totalExpense,
          activeBudgetsCount: budgets.length,
          notificationCount: notifCount,
        },
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          amount: Number(tx.amount),
          type: tx.type,
          description: tx.description,
          merchant: tx.merchant,
          date: tx.date,
          paymentMethod: tx.paymentMethod,
          categoryName: tx.category?.name || "General",
          categoryColor: tx.category?.color || "#6366F1",
        })),
        budgets: budgets.map((b) => ({
          id: b.id,
          amount: Number(b.amount),
          month: b.month,
          period: b.period,
          categoryName: b.category?.name || "General",
          categoryColor: b.category?.color || "#6366F1",
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user activity summary" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Modifies account status (disable/re-enable) or role.
 * Blocked at login when disabled.
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
    const { status, role } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Safety guard: Admin cannot disable their own account
    if (auth.session.user.id === id && status === "DISABLED") {
      return NextResponse.json(
        { success: false, error: "You cannot disable your own administrator account" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status && ["ACTIVE", "DISABLED"].includes(status)) {
      updateData.status = status;
    }
    if (role && ["STUDENT", "ADMIN"].includes(role)) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    // Log administrative action
    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: status === "DISABLED" ? "USER_DISABLE" : status === "ACTIVE" ? "USER_ENABLE" : "USER_UPDATE",
      targetType: "USER",
      targetId: id,
      details: {
        targetEmail: targetUser.email,
        oldStatus: targetUser.status,
        newStatus: updatedUser.status,
        oldRole: targetUser.role,
        newRole: updatedUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `Account status updated to ${updatedUser.status}`,
    });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update account status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]
 * Triggers a password reset for this user:
 * - Generates a secure PasswordResetToken
 * - Also provides a temporary reset pass if requested for immediate evaluator demo
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate standard password reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: targetUser.email,
        expiresAt,
      },
    });

    // Also support resetting to temporary standard password for direct demo
    let tempPassword: string | null = null;
    if (action === "SET_TEMP_PASSWORD") {
      tempPassword = `Campus#${Math.floor(1000 + Math.random() * 9000)}!`;
      const hash = await bcrypt.hash(tempPassword, 10);
      await prisma.user.update({
        where: { id },
        data: { passwordHash: hash },
      });
    }

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "PASSWORD_RESET_TRIGGERED",
      targetType: "USER",
      targetId: id,
      details: {
        targetEmail: targetUser.email,
        tokenGenerated: true,
        temporaryPasswordIssued: Boolean(tempPassword),
      },
    });

    const resetLink = `/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      message: "Password reset initiated successfully",
      data: {
        resetToken: token,
        resetLink,
        tempPassword,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to trigger password reset" },
      { status: 500 }
    );
  }
}
