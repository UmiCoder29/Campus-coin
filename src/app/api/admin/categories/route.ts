import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, logAdminAction } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";

/**
 * GET /api/admin/categories
 * Returns all system default categories with their active transaction and budget count.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const categories = await prisma.category.findMany({
      where: { isDefault: true, userId: null },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    // Count usage for each category across transactions and budgets
    const categoryUsage = await Promise.all(
      categories.map(async (cat) => {
        const [transactionCount, budgetCount] = await Promise.all([
          prisma.transaction.count({
            where: { categoryId: cat.id, deletedAt: null },
          }),
          prisma.budget.count({
            where: { categoryId: cat.id },
          }),
        ]);

        return {
          ...cat,
          transactionCount,
          budgetCount,
          isInUse: transactionCount > 0 || budgetCount > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoryUsage,
    });
  } catch (error) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch default categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Adds a new system-wide default category.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { name, type, icon, color } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Category type must be INCOME or EXPENSE" },
        { status: 400 }
      );
    }

    // Check if category name already exists in defaults
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        type: type as CategoryType,
        userId: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A default ${type.toLowerCase()} category with name "${name}" already exists` },
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        type: type as CategoryType,
        icon: icon || "Tag",
        color: color || (type === "INCOME" ? "#10B981" : "#6366F1"),
        isDefault: true,
        userId: null,
      },
    });

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "CATEGORY_CREATE",
      targetType: "CATEGORY",
      targetId: newCategory.id,
      details: { name: newCategory.name, type: newCategory.type },
    });

    return NextResponse.json({
      success: true,
      data: newCategory,
      message: "Default category created successfully",
    });
  } catch (error) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create default category" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/categories
 * Edits a system-wide default category. Edits propagate seamlessly without breaking history.
 */
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { id, name, icon, color } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category || !category.isDefault) {
      return NextResponse.json(
        { success: false, error: "Default category not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim() || category.name,
        icon: icon || category.icon,
        color: color || category.color,
      },
    });

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "CATEGORY_UPDATE",
      targetType: "CATEGORY",
      targetId: updated.id,
      details: { oldName: category.name, newName: updated.name, color: updated.color },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Default category updated successfully",
    });
  } catch (error) {
    console.error("PATCH /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update default category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories
 * Deletes a default category with an explicit confirm-and-reassign flow when category is in use.
 * Query or body parameters:
 * - id: category to delete
 * - reassignToId: (required if category has transactions or budgets)
 */
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminRequest();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || body.id;
    const reassignToId = searchParams.get("reassignToId") || body.reassignToId;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category || !category.isDefault) {
      return NextResponse.json(
        { success: false, error: "Default category not found" },
        { status: 404 }
      );
    }

    // Check usage
    const [txCount, budgetCount] = await Promise.all([
      prisma.transaction.count({ where: { categoryId: id, deletedAt: null } }),
      prisma.budget.count({ where: { categoryId: id } }),
    ]);

    const totalUsage = txCount + budgetCount;

    // Guard: If in use and no reassign target provided, reject with 409
    if (totalUsage > 0 && !reassignToId) {
      return NextResponse.json(
        {
          success: false,
          requiresReassignment: true,
          error: `Category "${category.name}" is referenced by ${txCount} transaction(s) and ${budgetCount} budget(s). Please choose a replacement category to safely reassign historical data.`,
          usage: { transactionCount: txCount, budgetCount },
        },
        { status: 409 }
      );
    }

    // If reassign target is provided, validate it
    if (reassignToId) {
      if (reassignToId === id) {
        return NextResponse.json(
          { success: false, error: "Cannot reassign to the category being deleted" },
          { status: 400 }
        );
      }

      const reassignCategory = await prisma.category.findUnique({
        where: { id: reassignToId },
      });

      if (!reassignCategory || reassignCategory.type !== category.type) {
        return NextResponse.json(
          { success: false, error: "Replacement category must exist and have matching type (INCOME/EXPENSE)" },
          { status: 400 }
        );
      }

      // Reassign transactions and budgets in a transaction
      await prisma.$transaction([
        prisma.transaction.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignToId },
        }),
        prisma.budget.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignToId },
        }),
        prisma.category.delete({
          where: { id },
        }),
      ]);

      await logAdminAction({
        adminId: auth.session.user.id,
        adminEmail: auth.session.user.email,
        action: "CATEGORY_DELETE_AND_REASSIGN",
        targetType: "CATEGORY",
        targetId: id,
        details: {
          deletedCategory: category.name,
          reassignedTo: reassignCategory.name,
          reassignedTransactions: txCount,
          reassignedBudgets: budgetCount,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Category "${category.name}" deleted. ${txCount} transaction(s) and ${budgetCount} budget(s) were reassigned to "${reassignCategory.name}".`,
      });
    }

    // Category has 0 usage, delete directly
    await prisma.category.delete({
      where: { id },
    });

    await logAdminAction({
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      action: "CATEGORY_DELETE",
      targetType: "CATEGORY",
      targetId: id,
      details: { deletedCategory: category.name },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete default category" },
      { status: 500 }
    );
  }
}
