import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * GET /api/admin/users
 * Paginated and searchable list of user accounts with registration date, transaction count, and status.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleParam = searchParams.get("role") || "ALL";
    const statusParam = searchParams.get("status") || "ALL";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { studentId: { contains: search.trim(), mode: "insensitive" } },
        { university: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (roleParam !== "ALL" && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role;
    }

    if (statusParam !== "ALL") {
      where.status = statusParam;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          university: true,
          studentId: true,
          academicYear: true,
          currency: true,
          createdAt: true,
          _count: {
            select: {
              transactions: { where: { deletedAt: null } },
              budgets: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        university: u.university,
        studentId: u.studentId,
        academicYear: u.academicYear,
        currency: u.currency,
        createdAt: u.createdAt,
        transactionCount: u._count.transactions,
        budgetCount: u._count.budgets,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user accounts" },
      { status: 500 }
    );
  }
}
