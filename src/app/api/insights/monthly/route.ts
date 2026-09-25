import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFinancialReports } from "@/lib/reports-service";
import { getMonthBounds } from "@/lib/budget-service";
import { createNotification } from "@/lib/notification-service";
import {
  generateMonthlyInsightWithGemini,
  isGeminiConfigured,
  MonthlyInsightInput,
} from "@/lib/gemini";

// 10-minute cooldown window to cap regeneration cost
const COOLDOWN_MS = 10 * 60 * 1000;

/**
 * GET /api/insights/monthly?month=YYYY-MM
 * Fetches the latest generated AI monthly insight and historical audit trail for this month.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const bounds = getMonthBounds(monthParam);

    const insights = await prisma.insight.findMany({
      where: {
        userId: session.user.id,
        month: bounds.monthStr,
      },
      orderBy: {
        generatedAt: "desc",
      },
    });

    const latest = insights[0] || null;

    // Check if within cooldown
    const isWithinCooldown = latest
      ? Date.now() - new Date(latest.generatedAt).getTime() < COOLDOWN_MS
      : false;

    const remainingCooldownSec = latest && isWithinCooldown
      ? Math.ceil((COOLDOWN_MS - (Date.now() - new Date(latest.generatedAt).getTime())) / 1000)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        month: bounds.monthStr,
        monthName: bounds.monthName,
        year: bounds.year,
        isAiAvailable: isGeminiConfigured(),
        latest,
        history: insights,
        cooldown: {
          isActive: isWithinCooldown,
          remainingSeconds: remainingCooldownSec,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/insights/monthly error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching monthly insights" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights/monthly
 * Generates on-demand narrative analysis via Gemini using strictly compact aggregated data.
 * Persists each generated insight for historical version audit.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const monthParam = body.month;
    const force = Boolean(body.force);
    const bounds = getMonthBounds(monthParam);

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          success: false,
          isUnavailable: true,
          error: "AI Monthly Insights are currently unavailable or unconfigured.",
        },
        { status: 503 }
      );
    }

    // Check cooldown unless user explicitly confirmed "force"
    const latestExisting = await prisma.insight.findFirst({
      where: {
        userId: session.user.id,
        month: bounds.monthStr,
      },
      orderBy: { generatedAt: "desc" },
    });

    if (latestExisting && !force) {
      const elapsed = Date.now() - new Date(latestExisting.generatedAt).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json({
          success: false,
          needsConfirmation: true,
          remainingSeconds,
          message: `An insight was generated ${Math.round(elapsed / 60000)} minutes ago. Confirm to regenerate now.`,
          latest: latestExisting,
        });
      }
    }

    // Gather aggregated reports summary (no PII, no raw rows)
    const reports = await getFinancialReports(session.user.id, {
      month: bounds.monthStr,
    });

    // Check user budget status
    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id, month: bounds.monthStr },
      include: { category: true },
    });

    const budgetStatus = budgets.map((b) => {
      const catSpent = reports.categoryBreakdown.find((c) => c.id === b.categoryId)?.amount || 0;
      const limit = Number(b.amount);
      const percentage = limit > 0 ? (catSpent / limit) * 100 : 0;
      return {
        categoryName: b.category.name,
        limit,
        spent: catSpent,
        percentage: Number(percentage.toFixed(1)),
        isOver: catSpent > limit,
      };
    });

    // Top categories with comparative context
    const topCategories = reports.categoryBreakdown.slice(0, 4).map((c) => ({
      name: c.name,
      amount: c.amount,
      percentage: c.percentage,
      twoMonthAvg: null,
      percentChangeVsAvg: null,
    }));

    const inputSummary: MonthlyInsightInput = {
      monthStr: bounds.monthStr,
      monthName: bounds.monthName,
      year: bounds.year,
      totalIncome: reports.summary.totalIncome,
      totalExpense: reports.summary.totalExpense,
      netSavings: reports.summary.netSavings,
      savingsRate: reports.summary.savingsRate,
      topCategories,
      budgetStatus,
    };

    // Ask Gemini for concise 2-4 sentence narrative + 1 concrete tip
    const aiResult = await generateMonthlyInsightWithGemini(inputSummary);

    if (!aiResult) {
      return NextResponse.json(
        {
          success: false,
          isUnavailable: true,
          error: "AI Insight generation could not complete at this time. Please check back later.",
        },
        { status: 503 }
      );
    }

    // Persist new insight record (Version history model: maintains full audit trail)
    const newInsight = await prisma.insight.create({
      data: {
        userId: session.user.id,
        title: aiResult.title,
        message: aiResult.summaryText,
        summaryText: aiResult.summaryText,
        tipText: aiResult.tipText,
        actionableTip: aiResult.tipText,
        month: bounds.monthStr,
        type: "BUDGET_PACING",
        severity: reports.summary.netSavings < 0 ? "WARNING" : "INFO",
        metadata: {
          model: aiResult.model,
          netSavings: reports.summary.netSavings,
          savingsRate: reports.summary.savingsRate,
        },
      },
    });

    // Fire an INSIGHT_READY notification for the student
    createNotification({
      userId: session.user.id,
      type: "INSIGHT_READY",
      title: `AI Financial Insight: ${aiResult.title}`,
      message: aiResult.summaryText
        ? aiResult.summaryText.length > 130
          ? aiResult.summaryText.substring(0, 127) + "..."
          : aiResult.summaryText
        : "Your AI financial analysis for this month is ready for review.",
      linkUrl: `/dashboard?insight=${newInsight.id}`,
      relatedEntityId: newInsight.id,
      relatedEntityType: "INSIGHT",
      month: bounds.monthStr,
    }).catch((err) => console.error("Error creating insight notification:", err));

    return NextResponse.json({
      success: true,
      data: newInsight,
      message: "AI Monthly Insight generated successfully.",
    });
  } catch (error) {
    console.error("POST /api/insights/monthly error:", error);
    return NextResponse.json(
      {
        success: false,
        isUnavailable: true,
        error: "Failed to generate monthly insight due to internal error.",
      },
      { status: 500 }
    );
  }
}
