import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGeminiConfigured, suggestCategoryWithGemini } from "@/lib/gemini";
import { findBestCategoryMatch } from "@/lib/csv-parser";

/**
 * POST /api/transactions/batch/ai-categorize
 * Batch-categorizes multiple unmapped rows using Gemini AI or intelligent heuristics.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const items = body.items as Array<{
      id: string;
      description: string;
      amount?: number;
      type?: string;
    }>;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      );
    }

    // Limit batch size to 50 items per call to preserve rate limits
    const slice = items.slice(0, 50);

    // Fetch user's categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      select: { id: true, name: true, type: true },
    });

    const suggestions: Record<
      string,
      { categoryId: string; categoryName: string; confidence: number }
    > = {};

    const isAiReady = isGeminiConfigured();

    for (const item of slice) {
      let matchedCat: { id: string; name: string } | null = null;

      // 1. Try Gemini if configured
      if (isAiReady) {
        try {
          const itemType = (item.type === "INCOME" ? "INCOME" : "EXPENSE") as "EXPENSE" | "INCOME";
          const aiResult = await suggestCategoryWithGemini(
            item.description,
            itemType,
            categories.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
            }))
          );

          if (aiResult?.suggestedCategoryId) {
            const found = categories.find((c) => c.id === aiResult.suggestedCategoryId);
            if (found) {
              suggestions[item.id] = {
                categoryId: found.id,
                categoryName: found.name,
                confidence: aiResult.confidence || 0.85,
              };
              continue;
            }
          } else if (aiResult?.suggestedCategoryName) {
            const found = categories.find(
              (c) => c.name.toLowerCase() === aiResult.suggestedCategoryName?.toLowerCase()
            );
            if (found) {
              suggestions[item.id] = {
                categoryId: found.id,
                categoryName: found.name,
                confidence: aiResult.confidence || 0.85,
              };
              continue;
            }
          }
        } catch (aiErr) {
          console.warn("AI categorization single item failed:", aiErr);
        }
      }

      // 2. Fallback heuristic
      matchedCat = findBestCategoryMatch(item.description, categories);
      if (matchedCat) {
        suggestions[item.id] = {
          categoryId: matchedCat.id,
          categoryName: matchedCat.name,
          confidence: 0.7,
        };
      } else {
        // Fallback default: Miscellaneous or first expense category
        const defaultCat =
          categories.find((c) => c.name.toLowerCase().includes("misc")) ||
          categories[0];
        if (defaultCat) {
          suggestions[item.id] = {
            categoryId: defaultCat.id,
            categoryName: defaultCat.name,
            confidence: 0.4,
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      categorizedCount: Object.keys(suggestions).length,
    });
  } catch (error) {
    console.error("POST /api/transactions/batch/ai-categorize error:", error);
    return NextResponse.json(
      { error: "Internal server error during AI batch categorization" },
      { status: 500 }
    );
  }
}
