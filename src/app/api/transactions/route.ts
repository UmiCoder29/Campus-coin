import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema, formatZodErrors } from "@/lib/validators";
import { materializeUserRecurringTransactions } from "@/lib/recurring";
import { evaluateTransactionNotifications } from "@/lib/notification-service";

/**
 * GET /api/transactions
 * 
 * Features:
 * - Scoped strictly to session.user.id
 * - On-demand materialization of recurring transactions up to today
 * - Pagination: page & limit
 * - Filtering: date range (from/to), categoryId, type (INCOME/EXPENSE), search text
 * - Sorting: date or amount, asc or desc
 * - Returns rows, pagination metadata, and aggregate sums for filtered view
 * - Soft-delete aware: excludes any records where deletedAt is not null
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Trigger on-demand recurring materialization silently
    try {
      await materializeUserRecurringTransactions(userId);
    } catch (e) {
      console.warn("Materialization warning on GET /api/transactions:", e);
    }

    const { searchParams } = new URL(req.url);

    // Query parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const categoryId = searchParams.get("categoryId");
    const typeParam = searchParams.get("type")?.toUpperCase();
    const search = searchParams.get("search")?.trim();
    const sortBy = searchParams.get("sortBy") === "amount" ? "amount" : "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build Prisma where clause
    const where: any = {
      userId,
      deletedAt: null, // SRS: Soft deletion filter
    };

    if (typeParam === "INCOME" || typeParam === "EXPENSE") {
      where.type = typeParam;
    }

    if (categoryId && categoryId !== "ALL") {
      // Support comma-separated category IDs for multi-select
      const categoryIds = categoryId.split(",").filter(Boolean);
      if (categoryIds.length === 1) {
        where.categoryId = categoryIds[0];
      } else if (categoryIds.length > 1) {
        where.categoryId = { in: categoryIds };
      }
    }

    if (fromParam || toParam) {
      where.date = {};
      if (fromParam) {
        const fromDate = new Date(fromParam);
        if (!isNaN(fromDate.getTime())) {
          where.date.gte = fromDate;
        }
      }
      if (toParam) {
        const toDate = new Date(toParam);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          where.date.lte = toDate;
        }
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { merchant: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Execute query and total count in parallel
    const [transactions, totalCount, aggregateData] = await Promise.all([
      prisma.transaction.findMany({
        where,
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
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ["type"],
        where,
        _sum: {
          amount: true,
        },
      }),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const agg of aggregateData) {
      const sum = agg._sum.amount ? Number(agg._sum.amount) : 0;
      if (agg.type === "INCOME") totalIncome += sum;
      if (agg.type === "EXPENSE") totalExpense += sum;
    }

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * 
 * Creates a new transaction scoped strictly to session.user.id.
 * Validates Zod constraints, category existence, type compatibility,
 * and sets up recurrence group if marked recurring.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
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
      tags,
      isAiCategorized,
      aiSuggestedCategory,
    } = parseResult.data;

    // Validate category exists and is accessible by this user
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

    if (!category.isDefault && category.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized category",
          details: { categoryId: "You do not have access to this category." },
        },
        { status: 403 }
      );
    }

    // Ensure transaction type matches category type
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

    // If description is empty, default to category name or merchant
    const finalDescription = description.trim() || merchant || category.name;

    // If recurring, generate a recurrence group ID
    const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

    const newTransaction = await prisma.transaction.create({
      data: {
        userId,
        categoryId,
        amount,
        type,
        description: finalDescription,
        date,
        paymentMethod,
        merchant: merchant || null,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval || "MONTHLY" : null,
        recurringEndDate: isRecurring ? recurringEndDate || null : null,
        recurringGroupId,
        tags: tags || [],
        isAiCategorized: Boolean(isAiCategorized),
        aiSuggestedCategory: aiSuggestedCategory || null,
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

    // Evaluate budget threshold alerts and unusual transaction detection asynchronously
    evaluateTransactionNotifications({
      userId,
      transactionId: newTransaction.id,
      amount: Number(newTransaction.amount),
      type: newTransaction.type,
      categoryId: newTransaction.categoryId,
      categoryName: newTransaction.category?.name || category.name,
      merchant: newTransaction.merchant,
      description: newTransaction.description,
      date: newTransaction.date,
    }).catch((err) => console.error("Error evaluating transaction notifications:", err));

    return NextResponse.json(
      {
        success: true,
        data: newTransaction,
        message: "Transaction created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
