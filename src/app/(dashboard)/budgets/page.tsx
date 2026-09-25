"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Edit3,
  Trash2,
  Copy,
  PiggyBank,
  TrendingDown,
  Loader2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { BudgetVsActualItem } from "@/lib/budget-service";
import { BudgetModal } from "@/components/budgets/budget-modal";
import { BudgetDeleteModal } from "@/components/budgets/budget-delete-modal";

export default function BudgetsPage() {
  const [currentMonthStr, setCurrentMonthStr] = useState<string>(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  });

  const [budgets, setBudgets] = useState<BudgetVsActualItem[]>([]);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpentOnBudgeted: 0,
    overallPercentage: 0,
    hasBudgets: false,
    hasPreviousMonthBudgets: false,
    previousMonthBudgetCount: 0,
  });
  const [bounds, setBounds] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rolloverLoading, setRolloverLoading] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetVsActualItem | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetVsActualItem | null>(null);

  const fetchBudgets = useCallback(async (monthToFetch: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/budgets?month=${monthToFetch}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBudgets(json.data || []);
          if (json.summary) setSummary(json.summary);
          if (json.bounds) setBounds(json.bounds);
        }
      }
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets(currentMonthStr);
  }, [currentMonthStr, fetchBudgets]);

  function handlePrevMonth() {
    if (bounds?.previousMonthStr) {
      setCurrentMonthStr(bounds.previousMonthStr);
    }
  }

  function handleNextMonth() {
    if (bounds?.nextMonthStr) {
      setCurrentMonthStr(bounds.nextMonthStr);
    }
  }

  function handleCurrentMonth() {
    const now = new Date();
    const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    setCurrentMonthStr(thisMonth);
  }

  async function handleRollover() {
    try {
      setRolloverLoading(true);
      const res = await fetch("/api/budgets/rollover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMonth: currentMonthStr }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBudgets(currentMonthStr);
      }
    } catch (err) {
      console.error("Rollover failed:", err);
    } finally {
      setRolloverLoading(false);
    }
  }

  const remainingTotal = Math.max(0, summary.totalBudget - summary.totalSpentOnBudgeted);
  const isOverallOver = summary.totalSpentOnBudgeted > summary.totalBudget;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budgets & Spending Limits
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure monthly category spending caps with 80% and 100% threshold alert notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summary.hasPreviousMonthBudgets && !summary.hasBudgets && (
            <button
              onClick={handleRollover}
              disabled={rolloverLoading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
            >
              {rolloverLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>Rollover from Last Month</span>
            </button>
          )}

          <button
            id="btn-create-budget"
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Set New Budget</span>
          </button>
        </div>
      </div>

      {/* ── Month Selector Bar ─────────────── */}
      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {bounds?.monthName || "Month"} {bounds?.year || ""}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCurrentMonth}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            This Month
          </button>
          <input
            type="month"
            value={currentMonthStr}
            onChange={(e) => {
              if (e.target.value) setCurrentMonthStr(e.target.value);
            }}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* ── Overall Monthly Budget Overview ── */}
      {summary.hasBudgets && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Monthly Spending Envelope
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  ${summary.totalSpentOnBudgeted.toFixed(2)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  spent of ${summary.totalBudget.toFixed(2)} total budget
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOverallOver
                    ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                    : summary.overallPercentage >= 80
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isOverallOver ? (
                  <>
                    <AlertOctagon className="h-3.5 w-3.5" />
                    <span>Over Budget ({summary.overallPercentage}%)</span>
                  </>
                ) : summary.overallPercentage >= 80 ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Near Limit ({summary.overallPercentage}%)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>On Track ({summary.overallPercentage}%)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Progress Bar with Limit Marker */}
          <div className="space-y-1.5">
            <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isOverallOver
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : summary.overallPercentage >= 80
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                }`}
                style={{ width: `${Math.min(summary.overallPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>0%</span>
              <span className="text-amber-600 dark:text-amber-400">80% Alert Threshold</span>
              <span>100% Limit</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Budget Cards Grid ─────── */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading monthly budget targets...
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isWarning = b.status === "WARNING";
            const isExceeded = b.status === "EXCEEDED";

            return (
              <div
                key={b.id}
                className={`group rounded-3xl border p-5 shadow-xs transition-all hover:shadow-md bg-white dark:bg-slate-900 flex flex-col justify-between ${
                  isExceeded
                    ? "border-red-200 dark:border-red-900/60 ring-1 ring-red-500/10"
                    : isWarning
                    ? "border-amber-200 dark:border-amber-900/60 ring-1 ring-amber-500/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: b.categoryColor }}
                      >
                        <CategoryIcon name={b.categoryIcon} className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {b.categoryName}
                        </h3>
                        <span className="text-[11px] text-slate-400">Monthly Cap</span>
                      </div>
                    </div>

                    {/* Status Badge with Icon + Label (Accessibility) */}
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isExceeded
                          ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40"
                          : isWarning
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40"
                          : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
                      }`}
                    >
                      {isExceeded ? (
                        <>
                          <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                          <span>Over (+${b.overAmount.toFixed(0)})</span>
                        </>
                      ) : isWarning ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>Near Limit ({b.percentage}%)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>On Track</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Figures */}
                  <div className="flex items-baseline justify-between text-sm mt-3">
                    <div>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        ${b.spent.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400"> / ${b.limit.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      {isExceeded ? (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          Exceeded by ${b.overAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          ${b.remaining.toFixed(2)} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isExceeded
                            ? "bg-red-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{b.percentage}% used</span>
                      <span>80% alert threshold</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-1.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingBudget(b);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Limit</span>
                  </button>
                  <button
                    onClick={() => setDeletingBudget(b)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 text-center bg-slate-50/50 dark:bg-slate-900/20">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <PiggyBank className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No budgets set for {bounds?.monthName} {bounds?.year}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {summary.hasPreviousMonthBudgets
              ? `You had ${summary.previousMonthBudgetCount} budget(s) active in ${bounds?.previousMonthStr}. You can copy them forward or create new custom limits.`
              : "Set up spending caps for Food, Academics, Entertainment, or Transport to pace your monthly student cashflow."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {summary.hasPreviousMonthBudgets && (
              <button
                onClick={handleRollover}
                disabled={rolloverLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
              >
                {rolloverLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>Rollover from {bounds?.previousMonthStr}</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingBudget(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Budget</span>
            </button>
          </div>
        </div>
      )}

      {/* Set/Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchBudgets(currentMonthStr)}
        month={currentMonthStr}
        budgetToEdit={editingBudget}
      />

      {/* Delete Budget Modal */}
      <BudgetDeleteModal
        isOpen={Boolean(deletingBudget)}
        budget={deletingBudget}
        month={currentMonthStr}
        onClose={() => setDeletingBudget(null)}
        onSuccess={() => fetchBudgets(currentMonthStr)}
      />
    </div>
  );
}
