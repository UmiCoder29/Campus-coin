import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-service";
import { checkBudgetAlertsForCategory } from "@/lib/notification-service";

const batchItemSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  type: z.enum(["EXPENSE", "INCOME"], { message: "Type must be EXPENSE or INCOME" }),
  description: z.string().min(1, { message: "Description is required" }).max(255),
  categoryId: z.string().min(1, { message: "Category is required" }),
  date: z.string().or(z.date()).refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Invalid date format",
  }),
  paymentMethod: z
    .enum(["CASH", "DEBIT_CARD", "CREDIT_CARD", "CAMPUS_CARD", "DIGITAL_WALLET", "BANK_TRANSFER"])
    .default("CASH"),
  merchant: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isAiCategorized: z.boolean().default(false),
});

const batchPayloadSchema = z.object({
  transactions: z.array(batchItemSchema).min(1, "At least one row is required"),
  validateOnly: z.boolean().optional().default(false),
});

/**
 * POST /api/transactions/batch
 * Validates and batch-inserts CSV-imported transactions.
 * Supports validateOnly dry-run and per-row error isolation.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const parsedPayload = batchPayloadSchema.safeParse(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: "Invalid payload format", details: parsedPayload.error.format() },
        { status: 400 }
      );
    }

    const { transactions, validateOnly } = parsedPayload.data;

    // Fetch user's accessible categories (owned or default)
    const validCategories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      select: { id: true, name: true, type: true },
    });

    const categoryMap = new Map(validCategories.map((c) => [c.id, c]));

    // Validate each row
    const rowResults: Array<{
      index: number;
      valid: boolean;
      errors: string[];
      cleanItem?: any;
    }> = [];

    const validRowsToInsert: any[] = [];
    const affectedCategoryIds = new Set<string>();

    for (let i = 0; i < transactions.length; i++) {
      const item = transactions[i];
      const errors: string[] = [];

      // Validate category ownership & compatibility
      const cat = categoryMap.get(item.categoryId);
      if (!cat) {
        errors.push("Selected category does not exist or is inaccessible");
      }

      if (errors.length === 0) {
        const cleanRow = {
          userId,
          categoryId: item.categoryId,
          amount: item.amount,
          type: item.type,
          description: item.description.trim(),
          date: new Date(item.date),
          paymentMethod: item.paymentMethod,
          merchant: item.merchant?.trim() || null,
          notes: item.notes?.trim() || null,
          isAiCategorized: item.isAiCategorized || false,
        };

        rowResults.push({ index: i, valid: true, errors: [], cleanItem: cleanRow });
        validRowsToInsert.push(cleanRow);
        if (item.type === "EXPENSE") {
          affectedCategoryIds.add(item.categoryId);
        }
      } else {
        rowResults.push({ index: i, valid: false, errors });
      }
    }

    // Dry-run mode: return validation results only
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        totalSubmitted: transactions.length,
        validCount: validRowsToInsert.length,
        invalidCount: transactions.length - validRowsToInsert.length,
        rowResults,
      });
    }

    // Execution mode: execute insertion for all valid rows
    if (validRowsToInsert.length === 0) {
      return NextResponse.json(
        {
          error: "No valid rows to import. Please correct row errors and try again.",
          rowResults,
        },
        { status: 400 }
      );
    }

    // Batch insert using createMany
    const insertResult = await prisma.transaction.createMany({
      data: validRowsToInsert,
    });

    // Check budget alerts asynchronously for affected categories
    for (const catId of affectedCategoryIds) {
      checkBudgetAlertsForCategory(userId, catId).catch((err: any) =>
        console.warn("Budget alert check post-import failed:", err)
      );
    }

    // Record audit activity
    await logActivity({
      userId,
      action: "IMPORT",
      entityType: "TRANSACTION",
      title: `Bulk imported ${insertResult.count} transactions via CSV`,
      details: {
        totalRows: transactions.length,
        importedCount: insertResult.count,
        skippedCount: transactions.length - insertResult.count,
      },
    });

    return NextResponse.json({
      success: true,
      insertedCount: insertResult.count,
      totalRows: transactions.length,
      skippedCount: transactions.length - insertResult.count,
      rowResults,
      message: `Successfully imported ${insertResult.count} transactions!`,
    });
  } catch (error: any) {
    console.error("POST /api/transactions/batch error:", error);
    return NextResponse.json(
      { error: "Internal server error during batch transaction import" },
      { status: 500 }
    );
  }
}
