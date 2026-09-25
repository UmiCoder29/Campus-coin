import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema, formatZodErrors } from "@/lib/validators";

/**
 * GET /api/categories
 * Lists categories accessible to the current user (System Defaults + User's Custom Categories)
 * Supports optional ?type=INCOME | EXPENSE filter.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type")?.toUpperCase();

    const whereClause: any = {
      OR: [
        { isDefault: true },
        { userId: session.user.id },
      ],
    };

    if (typeParam === "INCOME" || typeParam === "EXPENSE") {
      whereClause.type = typeParam;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            transactions: {
              where: { deletedAt: null },
            },
            budgets: true,
          },
        },
      },
      orderBy: [
        { isDefault: "desc" }, // Defaults first
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Creates a custom category scoped strictly to session.user.id
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = categorySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: formatZodErrors(parseResult.error),
        },
        { status: 400 }
      );
    }

    const { name, type, icon, color } = parseResult.data;
    const trimmedName = name.trim();

    // Prevent duplicate category names within the same user + type (case-insensitive)
    const existingUserCategory = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        type,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existingUserCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category already exists",
          details: {
            name: `You already have a "${trimmedName}" ${type.toLowerCase()} category.`,
          },
        },
        { status: 400 }
      );
    }

    // Check if name collides with a system default category of the same type
    const existingDefaultCategory = await prisma.category.findFirst({
      where: {
        isDefault: true,
        type,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existingDefaultCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "System default category collision",
          details: {
            name: `"${trimmedName}" is already an active system default category.`,
          },
        },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
        type,
        icon: icon || "Tag",
        color: color || "#6366F1",
        isDefault: false,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
            budgets: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newCategory,
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create category" },
      { status: 500 }
    );
  }
}
