import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema, formatZodErrors } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/categories/[id]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
            budgets: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Must be either a system default or belong to the current user
    if (!category.isDefault && category.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("GET /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/categories/[id]
 * Updates a custom category.
 * Rules:
 * 1. Default categories cannot be edited by students.
 * 2. Category type cannot be modified once transactions exist.
 * 3. Case-insensitive name uniqueness within user + type.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Guard: Reject editing system defaults from student portal
    if (existingCategory.isDefault) {
      return NextResponse.json(
        { error: "System default categories are read-only and cannot be modified." },
        { status: 403 }
      );
    }

    // Guard: Ensure user owns this category
    if (existingCategory.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Guard: Lock category type once it has transactions attached
    if (type !== existingCategory.type && existingCategory._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Type locked",
          details: {
            type: "Category type cannot be changed because transactions are already attached to it.",
          },
        },
        { status: 400 }
      );
    }

    // Guard: Check name uniqueness within user + type
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        userId: session.user.id,
        type,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Category already exists",
          details: {
            name: `You already have another "${trimmedName}" category of type ${type.toLowerCase()}.`,
          },
        },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        type,
        icon: icon || "Tag",
        color: color || "#6366F1",
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

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

/**
 * DELETE /api/categories/[id]
 * Deletes a custom category.
 * Rules:
 * 1. Default categories cannot be deleted by students.
 * 2. Deletion Guard: If transactions exist, client must specify reassignToCategoryId
 *    or reassignToDefault: true (which moves expenses to Miscellaneous, income to Other Income).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: { where: { deletedAt: null } },
            budgets: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Guard: Prevent deletion of default categories
    if (category.isDefault) {
      return NextResponse.json(
        { error: "System default categories are protected and cannot be deleted." },
        { status: 403 }
      );
    }

    // Guard: Ensure user owns this category
    if (category.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const txCount = category._count.transactions;
    const { searchParams } = new URL(req.url);
    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // Body may be empty if simple DELETE
    }

    const reassignToCategoryId = bodyData.reassignToCategoryId || searchParams.get("reassignToCategoryId");
    const reassignToDefault = bodyData.reassignToDefault === true || searchParams.get("reassignToDefault") === "true";

    // Deletion guard if transactions exist
    if (txCount > 0) {
      let targetCategoryId = reassignToCategoryId;

      if (!targetCategoryId && reassignToDefault) {
        // Find default fallback
        const fallbackName = category.type === "EXPENSE" ? "Miscellaneous" : "Other Income";
        const fallback = await prisma.category.findFirst({
          where: {
            isDefault: true,
            type: category.type,
            name: { equals: fallbackName, mode: "insensitive" },
          },
        });
        if (fallback) {
          targetCategoryId = fallback.id;
        }
      }

      if (!targetCategoryId) {
        // Return 409 Conflict with details for confirmation flow
        const fallbackName = category.type === "EXPENSE" ? "Miscellaneous" : "Other Income";
        const fallback = await prisma.category.findFirst({
          where: {
            isDefault: true,
            type: category.type,
            name: { equals: fallbackName, mode: "insensitive" },
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: "Category has existing transactions",
            txCount,
            budgetCount: category._count.budgets,
            requiresReassignment: true,
            fallbackCategory: fallback
              ? { id: fallback.id, name: fallback.name }
              : null,
            message: `This category has ${txCount} transaction(s). Please choose a replacement category or confirm moving them to "${fallbackName}".`,
          },
          { status: 409 }
        );
      }

      // Validate target category exists and is compatible
      const targetCategory = await prisma.category.findUnique({
        where: { id: targetCategoryId },
      });

      if (!targetCategory || (!targetCategory.isDefault && targetCategory.userId !== session.user.id)) {
        return NextResponse.json(
          { error: "Target reassign category is invalid or inaccessible." },
          { status: 400 }
        );
      }

      if (targetCategory.type !== category.type) {
        return NextResponse.json(
          { error: "Target category must be of the same type (INCOME/EXPENSE)." },
          { status: 400 }
        );
      }

      // Reassign transactions inside a transaction
      await prisma.$transaction([
        prisma.transaction.updateMany({
          where: { categoryId: id },
          data: { categoryId: targetCategoryId },
        }),
        // Delete attached budgets for this category
        prisma.budget.deleteMany({
          where: { categoryId: id },
        }),
        prisma.category.delete({
          where: { id },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Category deleted and ${txCount} transactions reassigned to ${targetCategory.name}.`,
      });
    }

    // No transactions attached: safe to delete directly
    await prisma.$transaction([
      prisma.budget.deleteMany({
        where: { categoryId: id },
      }),
      prisma.category.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
