import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, formatZodErrors } from "@/lib/validators";

/**
 * GET /api/user/profile
 * Returns fresh profile data for the authenticated student
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        academicYear: true,
        monthlyAllowance: true,
        savingsGoal: true,
        image: true,
        studentId: true,
        university: true,
        currency: true,
        theme: true,
        budgetAlertThreshold: true,
        notifyBudgetAlerts: true,
        notifyWeeklySummary: true,
        notifySavingTips: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        monthlyAllowance: user.monthlyAllowance ? Number(user.monthlyAllowance) : 0,
        savingsGoal: user.savingsGoal ? Number(user.savingsGoal) : 0,
      },
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Updates the authenticated student's own account and financial profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Invalid input data",
          errors: formatZodErrors(result.error),
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      academicYear,
      university,
      studentId,
      currency,
      monthlyAllowance,
      savingsGoal,
      image,
      theme,
      budgetAlertThreshold,
      notifyBudgetAlerts,
      notifyWeeklySummary,
      notifySavingTips,
    } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness if email changed
    const existingWithEmail = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: userId },
      },
    });

    if (existingWithEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "This email address is already in use by another account",
          errors: { email: "This email address is already registered" },
        },
        { status: 409 }
      );
    }

    // Persist changes to Neon PostgreSQL via Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: normalizedEmail,
        academicYear,
        university: university || null,
        studentId: studentId || null,
        currency,
        monthlyAllowance,
        savingsGoal,
        image: image || null,
        theme: theme ? theme.toUpperCase() : undefined,
        budgetAlertThreshold: budgetAlertThreshold !== undefined ? Number(budgetAlertThreshold) : undefined,
        notifyBudgetAlerts: notifyBudgetAlerts !== undefined ? notifyBudgetAlerts : undefined,
        notifyWeeklySummary: notifyWeeklySummary !== undefined ? notifyWeeklySummary : undefined,
        notifySavingTips: notifySavingTips !== undefined ? notifySavingTips : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        academicYear: true,
        monthlyAllowance: true,
        savingsGoal: true,
        image: true,
        studentId: true,
        university: true,
        currency: true,
        theme: true,
        budgetAlertThreshold: true,
        notifyBudgetAlerts: true,
        notifyWeeklySummary: true,
        notifySavingTips: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        ...updatedUser,
        monthlyAllowance: updatedUser.monthlyAllowance ? Number(updatedUser.monthlyAllowance) : 0,
        savingsGoal: updatedUser.savingsGoal ? Number(updatedUser.savingsGoal) : 0,
      },
    });
  } catch (error) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }
}
