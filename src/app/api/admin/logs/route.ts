import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/logs
 * Fetches recent administrative action logs with pagination and filtering.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);

    const where: any = {};
    if (targetType) {
      where.targetType = targetType;
    }

    const [logs, totalCount] = await Promise.all([
      prisma.adminActionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.adminActionLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      totalCount,
    });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
