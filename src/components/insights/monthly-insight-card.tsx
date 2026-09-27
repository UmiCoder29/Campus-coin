"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  History,
  AlertCircle,
  Lightbulb,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface MonthlyInsightData {
  id: string;
  title: string;
  message: string;
  summaryText?: string | null;
  tipText?: string | null;
  month?: string | null;
  generatedAt: string | Date;
  severity: string;
  isBookmarked?: boolean;
  metadata?: any;
}

interface MonthlyInsightCardProps {
  month: string; // "YYYY-MM"
  monthName: string;
  year: number;
}

export function MonthlyInsightCard({
  month,
  monthName,
  year,
}: MonthlyInsightCardProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [latestInsight, setLatestInsight] = useState<MonthlyInsightData | null>(null);
  const [history, setHistory] = useState<MonthlyInsightData[]>([]);
  const [isAiAvailable, setIsAiAvailable] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [bookmarkSuccessMessage, setBookmarkSuccessMessage] = useState<string | null>(null);

  const fetchInsightData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/insights/monthly?month=${month}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setLatestInsight(json.data.latest);
          setHistory(json.data.history || []);
          setIsAiAvailable(json.data.isAiAvailable);
        }
      }
    } catch (err) {
      console.warn("Failed to load monthly insights:", err);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchInsightData();
  }, [fetchInsightData]);

  const handleGenerate = async (force: boolean = false) => {
    try {
      setGenerating(true);
      setError(null);
      setConfirmRegenerate(false);

      const res = await fetch("/api/insights/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, force }),
      });

      const json = await res.json();

      if (json.needsConfirmation) {
        setConfirmRegenerate(true);
        return;
      }

      if (!res.ok || !json.success) {
        setError(json.error || "AI insight is unavailable right now. Try again later.");
        return;
      }

      await fetchInsightData();
    } catch (err: any) {
      setError(err?.message || "Failed to contact Gemini service.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleBookmark = async (insightId: string) => {
    try {
      const currentBookmarked = !!latestInsight?.isBookmarked;
      // Optimistic update
      setLatestInsight((prev) =>
        prev && prev.id === insightId
          ? { ...prev, isBookmarked: !currentBookmarked }
          : prev
      );
      setHistory((prev) =>
        prev.map((h) =>
          h.id === insightId ? { ...h, isBookmarked: !currentBookmarked } : h
        )
      );

      const res = await fetch(`/api/insights/${insightId}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked: !currentBookmarked }),
      });

      if (res.ok) {
        const json = await res.json();
        setBookmarkSuccessMessage(
          !currentBookmarked ? "Insight saved to your Bookmarks!" : "Insight removed from Bookmarks"
        );
        setTimeout(() => setBookmarkSuccessMessage(null), 3000);
      } else {
        // Rollback on failure
        setLatestInsight((prev) =>
          prev && prev.id === insightId
            ? { ...prev, isBookmarked: currentBookmarked }
            : prev
        );
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
    }
  };

  return (
    <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs fintech-card space-y-4 transition-all">
      {/* ── Card Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F3EFE7] dark:border-[#222938]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FF8A44] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF722B]/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[#141722] dark:text-white">
                Gemini AI Monthly Narrative
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFEFE6] dark:bg-[#FF6422]/20 text-[#FF6422] dark:text-[#FF7D42]">
                Optional AI Mentor
              </span>
            </div>
            <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5">
              Automated high-level narrative & recommendation for {monthName} {year}
            </p>
          </div>
        </div>

        {/* Action Controls: Generate / Regenerate & History */}
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-xs font-bold text-[#525866] dark:text-[#94A0B8] hover:bg-[#FBF9F5] dark:hover:bg-[#1E2536] transition-colors cursor-pointer"
              aria-label="Toggle insight versions history"
            >
              <History className="h-3.5 w-3.5" />
              <span>History ({history.length})</span>
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}

          <button
            type="button"
            disabled={generating || loading || !isAiAvailable}
            onClick={() => handleGenerate(confirmRegenerate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
              confirmRegenerate
                ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                : "bg-[#181C28] hover:bg-[#252C3D] dark:bg-[#FF722B] dark:hover:bg-[#FF8543] text-white"
            } disabled:opacity-50`}
            aria-label={confirmRegenerate ? "Confirm insight regeneration" : "Generate Gemini insight"}
            title={confirmRegenerate ? "Confirm regeneration" : "Generate Gemini plain-language analysis"}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            <span>
              {generating
                ? "Analyzing with Gemini..."
                : confirmRegenerate
                ? "Confirm Regenerate"
                : latestInsight
                ? "Regenerate Insight"
                : "Generate This Month's Insight"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Cooldown Confirmation Notice ─────────────────────────────── */}
      {confirmRegenerate && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between animate-in fade-in">
          <span>
            An insight was recently generated. To cap API usage, please click <strong>&quot;Confirm Regenerate&quot;</strong> to proceed.
          </span>
          <button
            type="button"
            onClick={() => setConfirmRegenerate(false)}
            className="text-amber-600 hover:underline font-bold text-[11px] shrink-0 ml-3"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Bookmark Toast / Banner ─────────────────────────────────── */}
      {bookmarkSuccessMessage && (
        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2 animate-in fade-in">
          <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span>{bookmarkSuccessMessage}</span>
        </div>
      )}

      {/* ── Error / Unavailable Banner ───────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── AI Service Unconfigured Notice ───────────────────────────── */}
      {!isAiAvailable && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Gemini AI key unconfigured or unavailable.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Your manual category picker, budget limits, reports, and rule-based saving tips continue to work 100% normally.
          </p>
        </div>
      )}

      {/* ── Dedicated AI Generation Skeleton State ───────────────────── */}
      {generating && (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-5 border border-purple-200 dark:border-purple-800/60 shadow-xs space-y-3.5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48 rounded-lg bg-purple-200 dark:bg-purple-900/40" />
              <span className="text-[11px] text-purple-600 dark:text-purple-300 font-medium">
                Synthesizing financial trends...
              </span>
            </div>
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-[92%] rounded-md" />
            <Skeleton className="h-3.5 w-[78%] rounded-md" />
          </div>
          <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-3/4 rounded-md" />
          </div>
        </div>
      )}

      {/* ── Loading Initial Skeleton State ───────────────────────────── */}
      {loading && !latestInsight && !generating && (
        <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      )}

      {/* ── Active / Latest Insight View ─────────────────────────────── */}
      {!generating && latestInsight ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 sm:p-5 border border-purple-100 dark:border-purple-900/40 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {latestInsight.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Bookmark Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(latestInsight.id)}
                  aria-label={latestInsight.isBookmarked ? "Remove bookmark" : "Bookmark this insight"}
                  title={latestInsight.isBookmarked ? "Remove bookmark" : "Bookmark this insight"}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-xs ${
                    latestInsight.isBookmarked
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-300"
                  }`}
                >
                  <Bookmark
                    className={`h-3.5 w-3.5 ${
                      latestInsight.isBookmarked ? "fill-amber-500 text-amber-500" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {latestInsight.isBookmarked ? "Bookmarked" : "Bookmark"}
                  </span>
                </button>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(latestInsight.generatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </div>
            </div>

            {/* 2-4 Sentence Plain-Language Narrative */}
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {latestInsight.summaryText || latestInsight.message}
            </p>

            {/* Concrete Actionable Tip */}
            {(latestInsight.tipText || (latestInsight as any).actionableTip) && (
              <div className="mt-3 p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
                <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Actionable Step: </strong>
                  <span>{latestInsight.tipText || (latestInsight as any).actionableTip}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory SRS AI Disclaimer Label */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 px-1 gap-1">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              <span>
                <strong>Advisory Note:</strong> This is an automated AI suggestion for personal planning, not certified financial advice.
              </span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Engine: gemini-1.5-flash
            </span>
          </div>
        </div>
      ) : !generating && !loading ? (
        /* Empty / Initial State (On-Demand Generation) */
        <div className="p-6 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/30">
          <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No AI Narrative Generated for {monthName} Yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Click &quot;Generate This Month&apos;s Insight&quot; above to have Gemini produce a concise 2–4 sentence summary of your spending patterns and a concrete student saving tip.
          </p>
        </div>
      ) : null}

      {/* ── Insight Version History Drawer ───────────────────────────── */}
      {showHistory && history.length > 0 && (
        <div className="pt-3 border-t border-purple-100 dark:border-purple-900/30 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Historical Versions ({history.length})</span>
            <span className="text-[10px] text-slate-400 normal-case">Most recent first</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {history.map((h, i) => (
              <div
                key={h.id}
                className={`p-3 rounded-xl border text-xs transition-colors ${
                  i === 0
                    ? "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                    : "bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <span>
                    {h.title} {i === 0 && <span className="text-purple-600 text-[10px]">(Active)</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(h.id)}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                      aria-label={h.isBookmarked ? "Remove bookmark" : "Bookmark this version"}
                    >
                      <Bookmark className={`h-3 w-3 ${h.isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(h.generatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {h.summaryText || h.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
