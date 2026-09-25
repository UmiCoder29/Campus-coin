"use client";

import React, { useState } from "react";
import {
  Pin,
  X,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Tag,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

export interface TipItem {
  id: string;
  title: string;
  content: string;
  category: string;
  targetCategory?: string | null;
  ruleType?: string | null;
  status: "ACTIVE" | "PINNED" | "DISMISSED";
  month?: string | null;
  impactScore: number;
  estimatedSavings?: number | null;
  difficulty: "EASY" | "MODERATE" | "CHALLENGING";
  tags: string[];
}

interface TipCardProps {
  tip: TipItem;
  onStatusChange: (tipId: string, newStatus: "ACTIVE" | "PINNED" | "DISMISSED") => Promise<void>;
  compact?: boolean;
}

export function TipCard({ tip, onStatusChange, compact = false }: TipCardProps) {
  const [loading, setLoading] = useState(false);

  const handlePin = async () => {
    try {
      setLoading(true);
      const nextStatus = tip.status === "PINNED" ? "ACTIVE" : "PINNED";
      await onStatusChange(tip.id, nextStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setLoading(true);
      const nextStatus = tip.status === "DISMISSED" ? "ACTIVE" : "DISMISSED";
      await onStatusChange(tip.id, nextStatus);
    } finally {
      setLoading(false);
    }
  };

  const isPinned = tip.status === "PINNED";
  const isDismissed = tip.status === "DISMISSED";

  // Friendly rule labels
  const getRuleBadge = (ruleType?: string | null) => {
    switch (ruleType) {
      case "SURGE_VS_AVERAGE":
        return { label: "Category Surge", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
      case "BUDGET_PACE_EXCEEDED":
        return { label: "Pacing Warning", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "SUBSCRIPTION_AUDIT":
        return { label: "Subscription Audit", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
      case "UNBUDGETED_SPIKE":
        return { label: "Uncapped Spend", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "DISCRETIONARY_SAVINGS":
        return { label: "Dining & Lifestyle", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      default:
        return { label: "Campus Perk", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" };
    }
  };

  const ruleBadge = getRuleBadge(tip.ruleType);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        isPinned
          ? "border-amber-300 dark:border-amber-700/80 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-sm"
          : isDismissed
          ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-xs hover:shadow-md"
      } ${compact ? "p-4" : "p-5"}`}
    >
      <div>
        {/* Header Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ruleBadge.color}`}
            >
              {ruleBadge.label}
            </span>
            {tip.targetCategory && (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                &bull; {tip.targetCategory}
              </span>
            )}
          </div>

          {/* Pin & Dismiss Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={loading}
              onClick={handlePin}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPinned
                  ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                  : "text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isPinned ? "Unpin tip" : "Pin tip to top"}
            >
              <Pin className={`h-3.5 w-3.5 ${isPinned ? "fill-amber-500 text-amber-500" : ""}`} />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDismissed ? "Restore tip" : "Dismiss tip from active view"}
            >
              {isDismissed ? (
                <RotateCcw className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
          {tip.title}
        </h4>

        {/* Content Advice */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          {tip.content}
        </p>
      </div>

      {/* Footer: Estimated Savings & Difficulty */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
          <TrendingDown className="h-3.5 w-3.5" />
          <span>
            {tip.estimatedSavings && Number(tip.estimatedSavings) > 0
              ? `Save ~$${Number(tip.estimatedSavings).toFixed(0)}/mo`
              : `Potential Impact: $${tip.impactScore.toFixed(0)}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="capitalize">{tip.difficulty.toLowerCase()}</span>
          {isPinned && (
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
              &bull; Pinned
            </span>
          )}
          {isDismissed && (
            <span className="text-slate-400 font-semibold flex items-center gap-0.5">
              &bull; Dismissed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
