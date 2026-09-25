"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Plus,
  Target,
  PiggyBank,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { ReportFilterBar, CategoryOption } from "@/components/reports/report-filter-bar";
import { CategoryDonutChart } from "@/components/reports/category-donut-chart";
import { CashflowTrendChart } from "@/components/reports/cashflow-trend-chart";
import { SpendingRhythmChart } from "@/components/reports/spending-rhythm-chart";
import { ReportExportButton } from "@/components/reports/report-export-button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyInsightCard } from "@/components/insights/monthly-insight-card";
import Link from "next/link";

interface ReportData {
  bounds: {
    monthStr: string;
    monthName: string;
    year: number;
    daysRemaining: number;
  };
  user: {
    name: string;
    email: string;
    university: string;
  };
  filters: {
    month: string;
    categoryIds: string[];
    type: "ALL" | "EXPENSE" | "INCOME";
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
    averageDailySpend: number;
    topCategory: any;
    highestSpendDay: any;
    totalTransactionsCount: number;
    hasData: boolean;
  };
  categoryBreakdown: any[];
  trendMonths: any[];
  dailyBreakdown: any[];
  weeklyBreakdown: any[];
  savingsSummary?: {
    budgets: Array<{
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      budgetLimit: number;
      spent: number;
      remaining: number;
      percentage: number;
      status: "ON_TRACK" | "WARNING" | "EXCEEDED";
    }>;
    tips: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      estimatedSavings: number | null;
      status: string;
    }>;
  };
}

function ReportsContent() {
  const searchParams = useSearchParams();

  // Read initial filter values from URL or defaults
  const paramMonth = searchParams.get("month") || "";
  const paramCategories = searchParams.get("categories")
    ? (searchParams.get("categories") as string).split(",").filter(Boolean)
    : [];
  const paramType = (searchParams.get("type") as "ALL" | "EXPENSE" | "INCOME") || "ALL";

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [currentMonth, setCurrentMonth] = useState<string>(paramMonth);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(paramCategories);
  const [selectedType, setSelectedType] = useState<"ALL" | "EXPENSE" | "INCOME">(paramType);

  // Fetch categories for the filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          if (json.categories) {
            setCategories(
              json.categories.filter((c: any) => c.type === "EXPENSE")
            );
          }
        }
      } catch (err) {
        console.error("Failed to load category filters:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch report analytics data from API
  const fetchReports = useCallback(
    async (monthVal?: string, catIds?: string[], typeVal?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (monthVal) params.set("month", monthVal);
        if (catIds && catIds.length > 0) params.set("categoryIds", catIds.join(","));
        if (typeVal && typeVal !== "ALL") params.set("type", typeVal);

        const res = await fetch(`/api/reports/analytics?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch report metrics");
        }
        const json = await res.json();
        setReportData(json.data);
        if (!monthVal && json.data?.bounds?.monthStr) {
          setCurrentMonth(json.data.bounds.monthStr);
        }
      } catch (err: any) {
        console.error("Report fetch error:", err);
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch when URL search params or local filter state changes
  useEffect(() => {
    fetchReports(currentMonth, selectedCategoryIds, selectedType);
  }, [fetchReports, currentMonth, selectedCategoryIds, selectedType]);

  const handleFilterChange = (filters: {
    month: string;
    categoryIds: string[];
    type: "ALL" | "EXPENSE" | "INCOME";
  }) => {
    setCurrentMonth(filters.month);
    setSelectedCategoryIds(filters.categoryIds);
    setSelectedType(filters.type);
  };

  const monthLabel = reportData?.bounds?.monthName || "Current Month";
  const yearLabel = reportData?.bounds?.year || new Date().getUTCFullYear();
  const hasTransactions = reportData?.summary?.hasData ?? false;

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-period expense breakdown, 6-month trajectory pacing, and spending cadence rhythm
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2">
          {reportData && (
            <ReportExportButton
              reportElementId="campus-coin-report-print-area"
              userName={reportData.user.name}
              monthStr={reportData.bounds.monthStr}
            />
          )}
        </div>
      </div>

      {/* ── SRS Notice Banner ────────────────────────────────────────── */}
      <div className="px-4 py-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Student Record-Keeping Notice:</strong> Generated charts and exported summaries are compiled strictly for personal academic budgeting and record-keeping (SRS Section 2.1).
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Client-side Verified</span>
        </div>
      </div>

      {/* ── Synchronized Filter Bar ──────────────────────────────────── */}
      <ReportFilterBar
        currentMonth={reportData?.bounds?.monthStr || currentMonth || "2026-09"}
        monthName={monthLabel}
        year={yearLabel}
        availableCategories={categories}
        selectedCategoryIds={selectedCategoryIds}
        selectedType={selectedType}
        onFilterChange={handleFilterChange}
      />

      {/* ── Loading Skeleton State ───────────────────────────────────── */}
      {loading && !reportData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Transition Loading Indicator ─────────────────────── */}
      {loading && reportData && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Synchronizing analytics and budget pacing for {monthLabel} {yearLabel}...</span>
        </div>
      )}

      {/* ── Main Report Content Area (Target for PDF/PNG Export) ─────── */}
      {reportData && (
        <div
          id="campus-coin-report-print-area"
          className={`space-y-6 bg-transparent transition-opacity duration-300 ${
            loading ? "opacity-60" : "opacity-100"
          }`}
        >
          {/* Printable Report Header Details (Visible when exported / printed) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                CC
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Campus Coin &bull; Student Financial Report
                </h2>
                <div className="text-xs text-slate-400">
                  Account: <span className="font-semibold text-slate-700 dark:text-slate-300">{reportData.user.name}</span> ({reportData.user.university})
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-right text-slate-500 dark:text-slate-400">
              <div>
                Reporting Period: <strong className="text-slate-900 dark:text-white">{monthLabel} {yearLabel}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                {selectedCategoryIds.length > 0
                  ? `Filtered: ${selectedCategoryIds.length} categories`
                  : "All Campus Categories"}{" "}
                &bull; {selectedType === "ALL" ? "All Cashflow" : selectedType}
              </div>
            </div>
          </div>

          {/* ── KPI Summary Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Expense */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {monthLabel} Outflow
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                ${reportData.summary.totalExpense.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {reportData.categoryBreakdown.length} active spending categories
              </p>
            </div>

            {/* Total Income */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {monthLabel} Inflow
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ${reportData.summary.totalIncome.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Allowances, wages & student aid
              </p>
            </div>

            {/* Net Savings & Savings Rate */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Net Period Cashflow
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  reportData.summary.netSavings >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {reportData.summary.netSavings >= 0 ? "+" : "-"}$
                {Math.abs(reportData.summary.netSavings).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Savings Rate: <strong>{reportData.summary.savingsRate}%</strong> of income
              </p>
            </div>

            {/* Average Daily Spend */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Average Daily Spend
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ${reportData.summary.averageDailySpend.toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {reportData.summary.highestSpendDay
                  ? `Peak: $${reportData.summary.highestSpendDay.amount.toFixed(0)} on day ${reportData.summary.highestSpendDay.day}`
                  : "Daily campus spending velocity"}
              </p>
            </div>
          </div>

          {/* ── Empty State for Zero-Transaction Month ─────────────────── */}
          {!hasTransactions && (
            <div className="p-8 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
              <HelpCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Transactions Found in {monthLabel} {yearLabel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                There are no transactions recorded matching your selected filters for this period. Try switching months, clearing category filters, or logging a new transaction.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  href="/transactions"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log a Transaction</span>
                </Link>
              </div>
            </div>
          )}

          {/* ── Optional Gemini AI Monthly Narrative & Recommendation ── */}
          <MonthlyInsightCard
            month={reportData.bounds.monthStr}
            monthName={monthLabel}
            year={yearLabel}
          />

          {/* ── Charts Grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category-Wise Monthly Spending Donut */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Category Spending Distribution
                    </h3>
                    <p className="text-xs text-slate-500">
                      Proportional breakdown for {monthLabel} {yearLabel}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <PieIcon className="h-4 w-4" />
                  </div>
                </div>

                <CategoryDonutChart
                  data={reportData.categoryBreakdown}
                  totalExpense={reportData.summary.totalExpense}
                  monthName={monthLabel}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                Interactive donut: hover slices for individual category totals
              </div>
            </div>

            {/* Income vs. Expense 6-Month Trajectory */}
            <div className="lg:col-span-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      6-Month Cashflow Trajectory
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comparative Income vs. Expense pacing with monthly surplus
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>

                <CashflowTrendChart
                  data={reportData.trendMonths}
                  selectedMonth={reportData.bounds.monthStr}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                Green bars: Student Income &bull; Rose bars: Campus Expenses
              </div>
            </div>

            {/* Daily and Weekly Spending Rhythm */}
            <div className="lg:col-span-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Spending Rhythm & Cadence
                  </h3>
                  <p className="text-xs text-slate-500">
                    Velocity within {monthLabel} across individual days and 5 calendar weeks
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Total {reportData.summary.totalTransactionsCount} transactions evaluated
                </div>
              </div>

              <SpendingRhythmChart
                dailyData={reportData.dailyBreakdown}
                weeklyData={reportData.weeklyBreakdown}
                monthName={monthLabel}
              />
            </div>
          </div>

          {/* ── Savings Summary & Category Budget Pacing (Specifically included in Export) ── */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Savings Summary & Budget Pacing
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category budget consumption limits and active saving tips for {monthLabel} {yearLabel}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <Target className="h-3.5 w-3.5" />
                <span>Pacing Status</span>
              </div>
            </div>

            {/* Budget Pacing Cards */}
            {reportData.savingsSummary?.budgets && reportData.savingsSummary.budgets.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Category Budgets ({reportData.savingsSummary.budgets.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reportData.savingsSummary.budgets.map((b) => (
                    <div
                      key={b.categoryId}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: b.categoryColor }}
                          />
                          {b.categoryName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === "EXCEEDED"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : b.status === "WARNING"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {b.status === "EXCEEDED" ? "Exceeded" : b.status === "WARNING" ? "Pacing Alert" : "On Track"}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">
                          Spent: <strong className="text-slate-900 dark:text-white">${b.spent.toFixed(2)}</strong>
                        </span>
                        <span className="text-slate-400">
                          Limit: ${b.budgetLimit.toFixed(2)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.status === "EXCEEDED"
                              ? "bg-rose-500"
                              : b.status === "WARNING"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-right text-slate-400">
                        {b.percentage.toFixed(0)}% consumed &bull; {b.remaining >= 0 ? `$${b.remaining.toFixed(2)} left` : `$${Math.abs(b.remaining).toFixed(2)} over`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                No active category budgets configured for {monthLabel}. You can create category limits on the Budgets page to monitor real-time pacing.
              </div>
            )}

            {/* Active Saving Tips & Campus Hacks */}
            {reportData.savingsSummary?.tips && reportData.savingsSummary.tips.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Curated Saving Tips & Action Items for {monthLabel}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportData.savingsSummary.tips.map((tip) => (
                    <div
                      key={tip.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {tip.title}
                        </span>
                        {tip.estimatedSavings && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Save ~${tip.estimatedSavings.toFixed(0)}/mo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {tip.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Footer Disclaimer (included in print canvas) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>
              Campus Coin NextGen BudgetBee Financial Engine &bull; Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span>Personal Record-Keeping Copy &bull; TechWiz7 Finalist Solution</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      }
    >
      <ReportsContent />
    </React.Suspense>
  );
}
