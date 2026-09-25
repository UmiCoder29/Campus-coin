import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema, formatZodErrors } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/transactions/[id]
 * Fetches a single transaction scoped strictly to session.user.id
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            isDefault: true,
          },
        },
      },
    });

    if (!transaction || transaction.deletedAt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/transactions/[id]
 * 
 * Updates a transaction with support for recurring series scope:
 * - "THIS_ONLY": Updates this single occurrence and detaches it from the recurring group.
 * - "THIS_AND_FUTURE": Updates this transaction and all subsequent occurrences in the series.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = transactionSchema.safeParse(body);

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

    const {
      amount,
      type,
      categoryId,
      description,
      date,
      paymentMethod,
      merchant,
      notes,
      receiptUrl,
      isRecurring,
      recurringInterval,
      recurringEndDate,
      recurringScope,
      tags,
    } = parseResult.data;

    // Validate category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category",
          details: { categoryId: "Selected category does not exist." },
        },
        { status: 400 }
      );
    }

    if (!category.isDefault && category.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized category",
          details: { categoryId: "You do not have access to this category." },
        },
        { status: 403 }
      );
    }

    if (category.type !== type) {
      return NextResponse.json(
        {
          success: false,
          error: "Type mismatch",
          details: {
            categoryId: `The selected category "${category.name}" is for ${category.type.toLowerCase()}s, but transaction is ${type.toLowerCase()}.`,
          },
        },
        { status: 400 }
      );
    }

    const finalDescription = description.trim() || merchant || category.name;

    // Recurrence update logic
    if (existing.recurringGroupId && recurringScope === "THIS_AND_FUTURE") {
      // Update this occurrence and all future occurrences in the series
      await prisma.transaction.updateMany({
        where: {
          recurringGroupId: existing.recurringGroupId,
          userId: session.user.id,
          date: { gte: existing.date },
          deletedAt: null,
        },
        data: {
          categoryId,
          amount,
          type,
          description: finalDescription,
          paymentMethod,
          merchant: merchant || null,
          notes: notes || null,
          recurringInterval: recurringInterval || "MONTHLY",
          recurringEndDate: recurringEndDate || null,
          tags: tags || [],
        },
      });

      // Update date for this specific record if it changed
      const updatedThis = await prisma.transaction.update({
        where: { id },
        data: { date },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              type: true,
              icon: true,
              color: true,
              isDefault: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedThis,
        message: "This and all future occurrences updated successfully",
      });
    }

    // Default: "THIS_ONLY" or non-recurring
    // If it was part of a recurring series and user chose "THIS_ONLY", detach from the group
    const detachedGroupId =
      existing.recurringGroupId && recurringScope === "THIS_ONLY"
        ? null
        : existing.recurringGroupId;

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount,
        type,
        categoryId,
        description: finalDescription,
        date,
        paymentMethod,
        merchant: merchant || null,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval || "MONTHLY" : null,
        recurringEndDate: isRecurring ? recurringEndDate || null : null,
        recurringGroupId: detachedGroupId,
        tags: tags || [],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            isDefault: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Transaction updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

/**
 * DELETE /api/transactions/[id]
 * 
 * Soft-deletion implementation (sets deletedAt timestamp).
 * SRS Integrity Note:
 * Soft delete preserves the ledger history for administrative audits and AI pattern
 * analysis while excluding deleted rows from student balance, reports, and pacing widgets.
 * 
 * Query / Body parameter: scope = "THIS_ONLY" | "THIS_AND_FUTURE"
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // Empty body
    }

    const scope = bodyData.scope || searchParams.get("scope") || "THIS_ONLY";

    if (existing.recurringGroupId && scope === "THIS_AND_FUTURE") {
      const deleteResult = await prisma.transaction.updateMany({
        where: {
          recurringGroupId: existing.recurringGroupId,
          userId: session.user.id,
          date: { gte: existing.date },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Soft-deleted this and ${deleteResult.count - 1} future occurrence(s). Full ledger history retained.`,
        affectedCount: deleteResult.count,
      });
    }

    // Soft-delete this single occurrence
    await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully (soft-deleted, audit history retained).",
    });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
