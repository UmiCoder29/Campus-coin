import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  suggestCategoryWithGemini,
  suggestCategoriesBatchWithGemini,
  isGeminiConfigured,
} from "@/lib/gemini";

/**
 * POST /api/ai/categorize
 * 
 * Supports both single-item and batch categorization:
 * 1. Single item: { description: string, type?: "EXPENSE" | "INCOME" }
 * 2. Batch: { items: Array<{ description: string, type: "EXPENSE" | "INCOME" }> }
 * 
 * Server-only, strictly silent graceful failure if Gemini is unconfigured or unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        success: true,
        isAiAvailable: false,
        suggestion: null,
        message: "AI categorization is currently unavailable or unconfigured.",
      });
    }

    const body = await req.json().catch(() => ({}));

    // Fetch user-accessible categories (only names, types, IDs — no financial history)
    const userCategories = await prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { userId: session.user.id }],
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    // Check if batch request
    if (body.items && Array.isArray(body.items)) {
      const results = await suggestCategoriesBatchWithGemini(
        body.items,
        userCategories
      );
      return NextResponse.json({
        success: true,
        isAiAvailable: true,
        results,
      });
    }

    // Single item categorization
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const type = body.type === "INCOME" ? "INCOME" : "EXPENSE";

    if (!description || description.length < 2) {
      return NextResponse.json({
        success: true,
        isAiAvailable: true,
        suggestion: null,
      });
    }

    const result = await suggestCategoryWithGemini(
      description,
      type,
      userCategories
    );

    return NextResponse.json({
      success: true,
      isAiAvailable: true,
      suggestion: result.suggestedCategoryId
        ? {
            categoryId: result.suggestedCategoryId,
            categoryName: result.suggestedCategoryName,
            confidence: result.confidence,
          }
        : null,
    });
  } catch (error) {
    // Fail gracefully: Never throw 500 error to user
    console.warn("AI Categorization Route encountered silent error:", error);
    return NextResponse.json({
      success: true,
      isAiAvailable: false,
      suggestion: null,
    });
  }
}
