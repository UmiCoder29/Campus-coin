import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      academicYear,
      monthlyAllowance,
      savingsGoal,
      university,
      studentId,
      currency,
    } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        academicYear: academicYear || "Freshman",
        monthlyAllowance: monthlyAllowance,
        savingsGoal: savingsGoal,
        university: university || "Campus University",
        studentId: studentId || null,
        currency: currency || "USD",
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        academicYear: true,
        monthlyAllowance: true,
        savingsGoal: true,
        university: true,
        currency: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student account created successfully",
        data: user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred during registration" },
      { status: 500 }
    );
  }
}
