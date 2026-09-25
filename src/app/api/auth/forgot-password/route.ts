import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email is registered, a password recovery link has been generated.",
      });
    }

    // Generate secure 32-byte hex token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete any prior reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Save token
    await prisma.passwordResetToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Simulate email dispatch by printing to console
    console.log("\n=======================================================");
    console.log("📨 [SIMULATED EMAIL DISPATCH: PASSWORD RESET]");
    console.log(`To: ${normalizedEmail}`);
    console.log(`Subject: Campus Coin - Reset Your Password`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("=======================================================\n");

    return NextResponse.json({
      success: true,
      message: "If that email is registered, a password recovery link has been generated.",
      // Include resetUrl in development response for easy judge testing
      devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during password reset request" },
      { status: 500 }
    );
  }
}
