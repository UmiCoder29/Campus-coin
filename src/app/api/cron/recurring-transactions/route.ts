import { NextRequest, NextResponse } from "next/server";
import { materializeAllRecurringTransactions } from "@/lib/recurring";

/**
 * PRODUCTION CRON TRIGGER DOCUMENTATION:
 * 
 * In production environments (e.g. Vercel, Supabase, AWS EventBridge, or Render):
 * 1. Set CRON_SECRET in your production .env environment variables.
 * 2. Configure a daily cron schedule (e.g. at 00:05 UTC every day: "5 0 * * *").
 * 3. In vercel.json:
 *    {
 *      "crons": [
 *        {
 *          "path": "/api/cron/recurring-transactions",
 *          "schedule": "5 0 * * *"
 *        }
 *      ]
 *    }
 * 4. Pass Authorization: Bearer <CRON_SECRET> header in scheduled requests.
 */

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await materializeAllRecurringTransactions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Cron recurring transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to materialize recurring transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
