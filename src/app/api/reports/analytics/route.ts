import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFinancialReports } from "@/lib/reports-service";

/**
 * GET /api/reports/analytics
 * Query parameters:
 *  - month: "YYYY-MM" (defaults to current month)
 *  - categoryIds: comma-separated list of category IDs
 *  - type: "ALL" | "EXPENSE" | "INCOME"
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const rawCategories = searchParams.get("categoryIds");
    const typeParam = searchParams.get("type");

    const categoryIds = rawCategories
      ? rawCategories.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    let type: "ALL" | "EXPENSE" | "INCOME" = "ALL";
    if (typeParam === "EXPENSE" || typeParam === "INCOME") {
      type = typeParam;
    }

    const reportData = await getFinancialReports(session.user.id, {
      month,
      categoryIds,
      type,
    });

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Failed to generate financial reports:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching reports" },
      { status: 500 }
    );
  }
}
