"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Pin,
  X,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
  AlertCircle,
  Plus,
  Megaphone,
  Bookmark,
  Calendar,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { TipCard, TipItem } from "@/components/saving-tips/tip-card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface BookmarkedInsight {
  id: string;
  title: string;
  message: string;
  summaryText?: string | null;
  tipText?: string | null;
  month?: string | null;
  generatedAt: string;
  actionableTip?: string | null;
}

export default function SavingTipsPage() {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [data, setData] = useState<{
    isLowData: boolean;
    message: string | null;
    month: string;
    monthName: string;
    year: number;
    counts: {
      active: number;
      pinned: number;
      dismissed: number;
      total: number;
      announcements?: number;
    };
    announcements?: Array<{
      id: string;
      title: string;
      body: string;
      category: string;
      createdAt: string;
    }>;
    activeTips: TipItem[];
    pinnedTips: TipItem[];
    dismissedTips: TipItem[];
    allTips: TipItem[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "ACTIVE" | "PINNED" | "DISMISSED" | "ALL" | "BOOKMARKS"
  >("ACTIVE");
  const [bookmarksData, setBookmarksData] = useState<{
    totalCount: number;
    pinnedTips: TipItem[];
    bookmarkedInsights: BookmarkedInsight[];
  } | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const loadTips = async () => {
    try {
      setLoading(true);
      const [tipsRes, bookmarksRes] = await Promise.all([
        fetch("/api/saving-tips"),
        fetch("/api/bookmarks"),
      ]);

      if (tipsRes.ok) {
        const json = await tipsRes.json();
        setData(json.data);
      }
      if (bookmarksRes.ok) {
        const bJson = await bookmarksRes.json();
        setBookmarksData(bJson.data);
      }
    } catch (err) {
      console.error("Failed to load saving tips & bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTips();
  }, []);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await fetch("/api/saving-tips/generate", { method: "POST" });
      if (res.ok) {
        await loadTips();
        setStatusNotification("Personalized tips re-evaluated from latest transaction trends.");
        setTimeout(() => setStatusNotification(null), 4000);
      }
    } catch (err) {
      console.error("Failed to re-evaluate tips:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleStatusChange = async (tipId: string, newStatus: "ACTIVE" | "PINNED" | "DISMISSED") => {
    try {
      const res = await fetch(`/api/saving-tips/${tipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadTips();
        setStatusNotification(
          newStatus === "PINNED"
            ? "Tip pinned to top."
            : newStatus === "DISMISSED"
            ? "Tip dismissed and moved to history."
            : "Tip restored to active advice."
        );
        setTimeout(() => setStatusNotification(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update tip status:", err);
    }
  };

  const handleUnbookmarkInsight = async (insightId: string) => {
    try {
      const res = await fetch(`/api/insights/${insightId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked: false }),
      });

      if (res.ok) {
        setBookmarksData((prev) =>
          prev
            ? {
                ...prev,
                totalCount: Math.max(0, prev.totalCount - 1),
                bookmarkedInsights: prev.bookmarkedInsights.filter(
                  (i) => i.id !== insightId
                ),
              }
            : null
        );
        setStatusNotification("Insight removed from bookmarks.");
        setTimeout(() => setStatusNotification(null), 3000);
      }
    } catch (err) {
      console.error("Failed to unbookmark insight:", err);
    }
  };

  // Determine which tips to display based on active tab
  let displayedTips: TipItem[] = [];
  if (data) {
    if (activeTab === "ACTIVE") {
      displayedTips = data.activeTips;
    } else if (activeTab === "PINNED") {
      displayedTips = data.pinnedTips;
    } else if (activeTab === "DISMISSED") {
      displayedTips = data.dismissedTips;
    } else if (activeTab === "ALL") {
      displayedTips = data.allTips;
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Deterministic Financial Rules Engine &bull; Zero AI Overhead</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Personalized Saving Tips & Bookmarks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Actionable advice derived from your actual spending trends, velocity spikes, and bookmarked insights
          </p>
        </div>

        {/* Re-evaluate Engine Trigger */}
        <button
          type="button"
          disabled={regenerating || loading}
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          title="Re-run the rule-based engine against your latest transaction data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin text-indigo-600" : ""}`} />
          <span>{regenerating ? "Evaluating Rules..." : "Re-evaluate Tips"}</span>
        </button>
      </div>

      {/* Status Notification Toast */}
      {statusNotification && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{statusNotification}</span>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-indigo-400 hover:text-indigo-600 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Low-Data Case Banner ─────────────────────────────────────── */}
      {data?.isLowData && (
        <div className="p-6 rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Building Your Campus Spending Baseline
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                You have logged fewer than 5 transactions this month. As you record everyday campus dining, books, transit, and coffee, the engine will automatically activate customized hacks.
              </p>
            </div>
          </div>
          <Link
            href="/transactions"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs whitespace-nowrap transition-colors"
          >
            Log Today&apos;s Expense
          </Link>
        </div>
      )}

      {/* ── Filter / Navigation Tabs ─────────────────────────────────── */}
      {data && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "ACTIVE"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Active Advice</span>
              <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-[10px] flex items-center justify-center font-bold">
                {data.counts.active}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PINNED")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "PINNED"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>Pinned</span>
              <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 text-[10px] flex items-center justify-center font-bold">
                {data.counts.pinned}
              </span>
            </button>

            {/* Unified Bookmarks Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("BOOKMARKS")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "BOOKMARKS"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5 fill-purple-500 text-purple-500" />
              <span>All Bookmarks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] flex items-center justify-center font-bold">
                {bookmarksData?.totalCount ?? (data.counts.pinned)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("DISMISSED")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "DISMISSED"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Dismissed History</span>
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] flex items-center justify-center font-bold">
                {data.counts.dismissed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>All ({data.counts.total})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Period: <strong className="text-slate-700 dark:text-slate-300">{data.monthName} {data.year}</strong>
          </div>
        </div>
      )}

      {/* ── Loading Skeleton ─────────────────────────────────────────── */}
      {loading && !data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {/* ── UNIFIED BOOKMARKS VIEW ───────────────────────────────────── */}
      {activeTab === "BOOKMARKS" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
                <Bookmark className="h-5 w-5 fill-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Unified Collection &bull; Pinned Tips & AI Insights
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quick access to all actionable advice, student strategies, and Gemini narratives you&apos;ve bookmarked.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              {bookmarksData?.totalCount || 0} Total Saved
            </span>
          </div>

          {/* Bookmarked AI Monthly Insights Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>Bookmarked Monthly AI Insights ({bookmarksData?.bookmarkedInsights.length || 0})</span>
              </h4>
            </div>

            {bookmarksData?.bookmarkedInsights && bookmarksData.bookmarkedInsights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarksData.bookmarkedInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-5 rounded-3xl border border-purple-200/80 dark:border-purple-900/40 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>Period: {insight.month || "Monthly Report"}</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {insight.title}
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUnbookmarkInsight(insight.id)}
                        className="p-1.5 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-600 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                        title="Remove from bookmarks"
                        aria-label="Remove insight bookmark"
                      >
                        <Bookmark className="h-3.5 w-3.5 fill-purple-600" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {insight.summaryText || insight.message}
                    </p>

                    {(insight.tipText || insight.actionableTip) && (
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex items-start gap-2 text-xs text-purple-900 dark:text-purple-200">
                        <Lightbulb className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Key Takeaway: </strong>
                          <span>{insight.tipText || insight.actionableTip}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Saved on {new Date(insight.generatedAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/reports?month=${insight.month || ""}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <span>View In Reports</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No monthly AI insights bookmarked yet. When viewing monthly narratives in Reports, click the bookmark icon to pin them here!
              </div>
            )}
          </div>

          {/* Pinned Saving Tips Section */}
          <div className="space-y-3 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>Pinned Saving Tips ({bookmarksData?.pinnedTips.length || 0})</span>
            </h4>

            {bookmarksData?.pinnedTips && bookmarksData.pinnedTips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bookmarksData.pinnedTips.map((tip) => (
                  <TipCard
                    key={tip.id}
                    tip={tip}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No tips pinned right now. Click the pin icon on any saving tip to keep it in your permanent bookmarks.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Standard Tabs View (Active, Pinned, Dismissed, All) ──────── */}
      {data && activeTab !== "BOOKMARKS" && (
        <div className="space-y-6">
          {/* Dedicated Pinned Section (if on Active tab and pinned tips exist) */}
          {activeTab === "ACTIVE" && data.pinnedTips.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Pinned Advice ({data.pinnedTips.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.pinnedTips.map((tip) => (
                  <TipCard
                    key={tip.id}
                    tip={tip}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Main Tips Grid */}
          <div>
            {activeTab === "ACTIVE" && data.pinnedTips.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                <span>Active Rule-Based Candidates ({displayedTips.length})</span>
              </div>
            )}

            {displayedTips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedTips.map((tip) => (
                  <TipCard
                    key={tip.id}
                    tip={tip}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <HelpCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeTab === "PINNED"
                    ? "No Pinned Advice Yet"
                    : activeTab === "DISMISSED"
                    ? "No Dismissed Advice"
                    : "No Active Tips Found"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {activeTab === "PINNED"
                    ? "Click the pin icon on any advice card to keep it anchored at the top of your dashboard."
                    : activeTab === "DISMISSED"
                    ? "Tips you dismiss from your active feed will be archived here for reference."
                    : "All current rules are satisfied or within normal thresholds. Keep recording transactions to unlock more tips!"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Rule Engine Explanation Footer ───────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 dark:text-slate-300">
          How Campus Coin Evaluates Saving Advice (Rule-Based Algorithm):
        </div>
        <p className="text-[11px] leading-relaxed">
          The engine computes rolling 2-month category averages, projects daily run-rates against active budget caps, audits recurring digital subscription overhead, flags uncapped spending spikes, and benchmarks discretionary dining. Candidates are ranked strictly by estimated monthly dollar savings.
        </p>
      </div>
    </div>
  );
}
