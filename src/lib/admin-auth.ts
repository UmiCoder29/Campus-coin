import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AdminSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
  };
}

/**
 * Validates that current request is from an authenticated administrator.
 * Returns the admin session if authorized, or a NextResponse (401 or 403) if unauthorized.
 */
export async function verifyAdminRequest(): Promise<
  { authorized: true; session: AdminSession } | { authorized: false; response: NextResponse }
> {
  const session = (await getServerSession(authOptions)) as AdminSession | null;

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Authentication required to access admin resources" },
        { status: 401 }
      ),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Forbidden: Administrator role required" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Logs an administrative action to the AdminActionLog table for full governance auditing.
 */
export async function logAdminAction(params: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
}) {
  try {
    return await prisma.adminActionLog.create({
      data: {
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        details: params.details || {},
      },
    });
  } catch (err) {
    console.error("Failed to log admin action:", err);
  }
}
