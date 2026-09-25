"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Receipt,
  Target,
  Calendar,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
} from "lucide-react";
import { OverviewChart } from "@/components/reports/overview-chart";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { CategoryIcon } from "@/components/ui/category-icon";
import { BudgetModal } from "@/components/budgets/budget-modal";
import { TipCard, TipItem } from "@/components/saving-tips/tip-card";
import { MonthlyInsightCard } from "@/components/insights/monthly-insight-card";
import { RecentActivityWidget } from "@/components/dashboard/recent-activity-widget";
import { useAuthTransition } from "@/components/auth/auth-transition-context";
import gsap from "gsap";

interface DashboardMetrics {
  month: string;
  monthName: string;
  year: number;
  daysRemaining: number;
  isCurrentMonth: boolean;
  totalTransactionCount: number;
  hasTransactions: boolean;

  monthIncome: number;
  monthExpense: number;
  monthNet: number;

  allTimeIncome: number;
  allTimeExpense: number;
  allTimeNetBalance: number;

  budgetTotal: number;
  budgetSpent: number;
  budgetUsedPercent: number;
  budgetVsActual: Array<{
    id: string;
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: "NORMAL" | "WARNING" | "EXCEEDED";
    isOver: boolean;
    overAmount: number;
  }>;
  hasBudgets: boolean;
  hasPreviousMonthBudgets: boolean;

  topCategory: {
    id: string;
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentOfTotal: number;
    trend: string;
    trendUp: boolean;
  } | null;

  monthlyAllowance: number;
  savingsGoal: number;

  recentTransactions: Array<{
    id: string;
    merchant: string;
    description: string;
    category: string;
    icon: string;
    color: string;
    date: string;
    amount: number;
    type: "EXPENSE" | "INCOME";
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name || "Student";

  const { preloadedDashboardMetrics, notifyDashboardReady, justTransitioned, clearJustTransitioned } = useAuthTransition();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(
    preloadedDashboardMetrics || null
  );
  const [loading, setLoading] = useState(!preloadedDashboardMetrics);

  // Quick Add Transaction Modal state
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Budget Modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  // Saving tips state
  const [savingTips, setSavingTips] = useState<TipItem[]>([]);
  const [isTipsLowData, setIsTipsLowData] = useState(false);
  const [tipsLowDataMessage, setTipsLowDataMessage] = useState<string | null>(null);

  const loadSavingTips = useCallback(async () => {
    try {
      const res = await fetch("/api/saving-tips");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setIsTipsLowData(Boolean(json.data.isLowData));
          setTipsLowDataMessage(json.data.message);
          const topList = [...(json.data.pinnedTips || []), ...(json.data.activeTips || [])];
          setSavingTips(topList.slice(0, 3));
        }
      }
    } catch (err) {
      console.error("Failed to load saving tips for dashboard:", err);
    }
  }, []);

  const handleTipStatusChange = async (tipId: string, newStatus: "ACTIVE" | "PINNED" | "DISMISSED") => {
    try {
      const res = await fetch(`/api/saving-tips/${tipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadSavingTips();
      }
    } catch (err) {
      console.error("Failed to update tip status from dashboard:", err);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      if (!metrics) {
        setLoading(true);
      }
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMetrics(json.data);
          notifyDashboardReady();
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
      notifyDashboardReady();
    }
  }, [metrics, notifyDashboardReady]);

  // Initial mount: always load saving tips and load dashboard metrics if not preloaded
  useEffect(() => {
    loadSavingTips();
    if (!metrics) {
      loadDashboardData();
    } else {
      notifyDashboardReady();
    }
  }, [loadSavingTips, loadDashboardData, metrics, notifyDashboardReady]);

  // Clean up transition flag
  useEffect(() => {
    if (justTransitioned) {
      clearJustTransitioned();
    }
  }, [justTransitioned, clearJustTransitioned]);

  if ((status === "loading" && !metrics) || loading || !metrics) {
    return <DashboardSkeleton />;
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Calculations for savings goal progress
  const savingsGoalTarget = metrics.savingsGoal || 1000;
  const currentSavings = Math.max(0, metrics.allTimeNetBalance);
  const savingsPercent = Math.min(100, Math.round((currentSavings / savingsGoalTarget) * 100));

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ───────────────────── */}
      <div className="dashboard-section relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#FF722B] via-[#FF7D35] to-[#FF8A44] text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#FF722B]/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-8 w-36 h-36 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-white/95 text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>NextGen BudgetBee &bull; {metrics.monthName} {metrics.year}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {greeting}, {userName}! 🐝
          </h1>
          <p className="text-white/90 text-sm mt-1.5 max-w-lg font-medium">
            {metrics.hasBudgets ? (
              <>
                You&apos;ve used{" "}
                <span className="font-bold text-white">
                  {metrics.budgetUsedPercent}%
                </span>{" "}
                of your {metrics.monthName} category budgets. Pace is{" "}
                <span className={metrics.budgetUsedPercent > 100 ? "text-amber-200 font-bold" : metrics.budgetUsedPercent >= 80 ? "text-amber-100 font-bold" : "text-emerald-100 font-bold"}>
                  {metrics.budgetUsedPercent > 100 ? "exceeded" : metrics.budgetUsedPercent >= 80 ? "near limit" : "on track"}
                </span>.
              </>
            ) : (
              `Keep tabs on your ${metrics.monthName} spending, allowances, and campus budget goals.`
            )}
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setQuickAddType("EXPENSE");
              setQuickAddOpen(true);
            }}
            id="quick-add-expense"
            className="flex items-center gap-1.5 bg-[#181C28] hover:bg-[#252C3D] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-lg shadow-black/20 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickAddType("INCOME");
              setQuickAddOpen(true);
            }}
            id="quick-add-income"
            className="flex items-center gap-1.5 bg-[#181C28] hover:bg-[#252C3D] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-lg shadow-black/20 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* ── Zero-Data Onboarding Card ───────── */}
      {!metrics.hasTransactions && (
        <div className="dashboard-section p-6 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEFE6] dark:bg-[#FF6422]/20 text-[#FF6422] dark:text-[#FF7D42] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#141722] dark:text-white text-base">
                Welcome to your Campus Coin Cockpit!
              </h3>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5 max-w-xl">
                You haven&apos;t recorded any entries yet. Click &quot;Add Expense&quot; or &quot;Add Income&quot; to log your first transaction, or configure category spending caps under Budgets!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setQuickAddType("EXPENSE");
              setQuickAddOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#181C28] hover:bg-[#252C3D] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#181C28] text-xs font-bold transition-all shrink-0 shadow-sm cursor-pointer"
          >
            Record First Transaction
          </button>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────── */}
      <div className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Cashflow */}
        <div className="group rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#767D8C] dark:text-[#8B96AA] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {metrics.monthName} Net Cashflow
            </span>
            <div className="p-2 rounded-xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8] group-hover:scale-110 transition-transform">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${metrics.monthNet >= 0 ? "text-[#141722] dark:text-white" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.monthNet >= 0 ? "+" : "-"}${Math.abs(metrics.monthNet).toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-[#F3EFE7] dark:border-[#222938] text-[#767D8C] dark:text-[#8B96AA]">
            <span className="text-[11px] font-medium">All-Time Balance:</span>
            <span className="font-bold text-[#141722] dark:text-white">
              ${metrics.allTimeNetBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total Income */}
        <div className="group rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#767D8C] dark:text-[#8B96AA] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {metrics.monthName} Income
            </span>
            <div className="p-2 rounded-xl bg-[#ECFDF5] text-[#059669] dark:bg-[#059669]/20 dark:text-[#34D399] group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              +${metrics.monthIncome.toFixed(2)}
            </div>
            {/* Sparkline wave visual from reference design */}
            <svg className="h-5 w-14 text-emerald-500 opacity-70" viewBox="0 0 100 40" fill="none">
              <path d="M0 32 Q 30 32, 50 18 T 90 8 L 100 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M0 32 Q 30 32, 50 18 T 90 8 L 100 12 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.1" />
            </svg>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-[#F3EFE7] dark:border-[#222938] text-[#767D8C] dark:text-[#8B96AA]">
            <span className="text-[11px] font-medium">All-Time Income:</span>
            <span className="font-bold text-[#141722] dark:text-white">
              ${metrics.allTimeIncome.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="group rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#767D8C] dark:text-[#8B96AA] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {metrics.monthName} Expenses
            </span>
            <div className="p-2 rounded-xl bg-[#FFF1F2] text-[#E11D48] dark:bg-[#E11D48]/20 dark:text-[#FB7185] group-hover:scale-110 transition-transform">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-[#E11D48] dark:text-[#FB7185]">
              -${metrics.monthExpense.toFixed(2)}
            </div>
            {/* Sparkline mini-bars from reference design */}
            <div className="flex items-end gap-1 h-5 opacity-70">
              <span className="w-1.5 h-2 bg-[#FF722B] rounded-full" />
              <span className="w-1.5 h-4 bg-[#FF722B] rounded-full" />
              <span className="w-1.5 h-3 bg-[#FF722B] rounded-full" />
              <span className="w-1.5 h-5 bg-[#FF722B] rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-[#F3EFE7] dark:border-[#222938] text-[#767D8C] dark:text-[#8B96AA]">
            <span className="text-[11px] font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Days Remaining:</span>
            </span>
            <span className="font-bold text-[#141722] dark:text-white">
              {metrics.daysRemaining} days
            </span>
          </div>
        </div>

        {/* Budget Status */}
        <div className="group rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between text-[#767D8C] dark:text-[#8B96AA] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Budget Status
            </span>
            <div className="p-2 rounded-xl bg-[#FFF7ED] text-[#EA580C] dark:bg-[#EA580C]/20 dark:text-[#FB923C] group-hover:scale-110 transition-transform">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#141722] dark:text-white">
            {metrics.hasBudgets ? `${metrics.budgetUsedPercent}%` : "No limits"}
          </div>
          <div className="w-full bg-[#F3EFE7] dark:bg-[#222938] h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                metrics.budgetUsedPercent > 100
                  ? "bg-red-500"
                  : metrics.budgetUsedPercent >= 80
                  ? "bg-amber-500"
                  : "bg-[#FF722B]"
              }`}
              style={{ width: `${Math.min(metrics.budgetUsedPercent, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA] mt-1.5 flex items-center justify-between">
            <span>
              ${metrics.budgetSpent.toFixed(0)} of ${metrics.budgetTotal.toFixed(0)} cap
            </span>
            {metrics.hasBudgets && (
              <span className={`font-bold ${metrics.budgetUsedPercent > 100 ? "text-red-500" : metrics.budgetUsedPercent >= 80 ? "text-amber-500" : "text-emerald-500"}`}>
                {metrics.budgetUsedPercent > 100 ? "Over" : metrics.budgetUsedPercent >= 80 ? "Near limit" : "Healthy"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Spending Chart + Top Category ──── */}
      <div className="dashboard-section grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[#141722] dark:text-white">
                Semester Spending Velocity
              </h2>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5">
                Monthly actual expenses vs. student budget cap
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFEFE6] text-[#FF6422] dark:bg-[#FF6422]/20 dark:text-[#FF7D42]">
              USD
            </span>
          </div>
          <OverviewChart />
        </div>

        {/* This Month's Top Category */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-[#141722] dark:text-white mb-3">
              This Month&apos;s Top Category
            </h2>

            {metrics.topCategory ? (
              <div className="flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#111520] border border-[#EFEAE1] dark:border-[#222938]">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3"
                  style={{ backgroundColor: metrics.topCategory.color || "#FF722B" }}
                >
                  <CategoryIcon
                    name={metrics.topCategory.icon}
                    className="h-7 w-7 text-white"
                  />
                </div>
                <div className="text-base font-bold text-[#141722] dark:text-white">
                  {metrics.topCategory.name}
                </div>
                <div className="text-2xl font-black text-[#141722] dark:text-white mt-1">
                  ${metrics.topCategory.amount.toFixed(2)}
                </div>
                <div className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-1">
                  {metrics.topCategory.percentOfTotal}% of total {metrics.monthName} expenses
                </div>
                <div
                  className={`inline-flex items-center gap-1 text-xs font-bold mt-2.5 px-2.5 py-0.5 rounded-full ${
                    metrics.topCategory.trendUp
                      ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                      : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {metrics.topCategory.trendUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  <span>{metrics.topCategory.trend} vs last month</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#FBF9F5] dark:bg-[#111520] border border-[#EFEAE1] dark:border-[#222938]">
                <HelpCircle className="h-8 w-8 text-[#9EA5B4] dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] font-medium">
                  No expenses recorded in {metrics.monthName} yet
                </p>
              </div>
            )}
          </div>

          {/* Student Savings Goal Mini-Widget */}
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#111520] border border-[#EFEAE1] dark:border-[#222938]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-[#525866] dark:text-[#94A0B8] flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-[#FF722B]" />
                <span>Savings Goal Target</span>
              </span>
              <span className="font-black text-[#141722] dark:text-white">
                ${currentSavings.toFixed(0)} / ${savingsGoalTarget}
              </span>
            </div>
            <div className="w-full bg-[#EAE5DC] dark:bg-[#222938] h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF722B] to-[#FF8A44] transition-all duration-1000"
                style={{ width: `${savingsPercent}%` }}
              />
            </div>
            <div className="text-right text-[10px] text-[#767D8C] dark:text-[#8B96AA] mt-1 font-bold">
              {savingsPercent}% achieved
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget vs Actual Widget + Recent Activity ── */}
      <div className="dashboard-section grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Widget */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-[#141722] dark:text-white">
                  Budget vs. Actual
                </h2>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
                  {metrics.monthName} {metrics.year} category caps
                </p>
              </div>
              <Link
                href="/budgets"
                className="text-xs font-bold text-[#FF6422] dark:text-[#FF7D42] hover:underline flex items-center gap-0.5"
              >
                <span>Manage Budgets</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {metrics.hasBudgets ? (
              <div className="space-y-4">
                {metrics.budgetVsActual.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.categoryColor }}
                        />
                        <span className="font-bold text-[#141722] dark:text-white">
                          {item.categoryName}
                        </span>
                        {item.status === "EXCEEDED" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                            <AlertOctagon className="h-2.5 w-2.5" /> Over
                          </span>
                        )}
                        {item.status === "WARNING" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-2.5 w-2.5" /> 80%+
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${item.isOver ? "text-red-600 dark:text-red-400" : "text-[#141722] dark:text-white"}`}>
                          ${item.spent.toFixed(0)}
                        </span>
                        <span className="text-[#767D8C] dark:text-[#8B96AA]"> / ${item.limit.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-[#F3EFE7] dark:bg-[#222938] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.isOver
                            ? "bg-red-500"
                            : item.status === "WARNING"
                            ? "bg-amber-500"
                            : "bg-[#FF722B]"
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5]/60 dark:bg-[#111520]/40">
                <PiggyBank className="h-8 w-8 text-[#9EA5B4] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#141722] dark:text-white">
                  No active budgets for {metrics.monthName}
                </h4>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] max-w-xs mx-auto mt-1 mb-4">
                  Set category spending limits to pace your cashflow and get automated threshold alerts!
                </p>
                <button
                  onClick={() => setBudgetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF722B] hover:bg-[#FF8543] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Set Up Category Budget</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/budgets"
            className="mt-4 text-center py-2.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-xs font-bold text-[#FF6422] dark:text-[#FF7D42] hover:bg-[#FBF9F5] dark:hover:bg-[#1E2536] transition-colors"
          >
            View Full Budget Planner &rarr;
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[#141722] dark:text-white">
                Recent Activity
              </h2>
              <Link
                href="/transactions"
                className="text-xs font-bold text-[#FF6422] dark:text-[#FF7D42] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {metrics.recentTransactions.length > 0 ? (
              <div className="divide-y divide-[#F3EFE7] dark:divide-[#222938]">
                {metrics.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between group hover:bg-[#FBF9F5] dark:hover:bg-[#1E2536] -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: tx.color }}
                      >
                        <CategoryIcon name={tx.icon} className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#141722] dark:text-white truncate">
                          {tx.merchant}
                        </div>
                        <div className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
                          {tx.category} &bull;{" "}
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-sm font-bold shrink-0 ${
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[#E11D48] dark:text-[#FB7185]"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#FBF9F5] dark:bg-[#111520] border border-[#EFEAE1] dark:border-[#222938]">
                <Receipt className="h-8 w-8 text-[#9EA5B4] dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] font-medium">
                  No transactions recorded yet
                </p>
              </div>
            )}
          </div>

          <Link
            href="/transactions"
            className="mt-4 text-center py-2.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-xs font-bold text-[#FF6422] dark:text-[#FF7D42] hover:bg-[#FBF9F5] dark:hover:bg-[#1E2536] transition-colors"
          >
            Open Transaction Ledger &rarr;
          </Link>
        </div>
      </div>

      {/* ── Personalized Saving Tips (Rule-Based Engine) ── */}
      <div className="dashboard-section rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F3EFE7] dark:border-[#222938]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FF8A44] text-white shrink-0 shadow-md shadow-[#FF722B]/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#141722] dark:text-white">
                  Personalized Saving Advice
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFEFE6] dark:bg-[#FF6422]/20 text-[#FF6422] dark:text-[#FF7D42]">
                  Rule-Based Engine
                </span>
              </div>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5">
                Tailored recommendations evaluated from your {metrics.monthName} spending velocity & caps
              </p>
            </div>
          </div>
          <Link
            href="/saving-tips"
            className="shrink-0 text-xs font-bold text-[#FF6422] dark:text-[#FF7D42] hover:text-[#FF8A44] flex items-center gap-1 group"
          >
            <span>View All Tips & History</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Low-data friendly prompt for new users */}
        {isTipsLowData ? (
          <div className="p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#111520] border border-[#EFEAE1] dark:border-[#222938] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <h4 className="text-xs font-bold text-[#141722] dark:text-white">
                Gathering Campus Routine Data
              </h4>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5 max-w-lg">
                {tipsLowDataMessage ||
                  "Add a few more transactions across your campus routine to unlock personalized savings advice!"}
              </p>
            </div>
            <button
              onClick={() => {
                setQuickAddType("EXPENSE");
                setQuickAddOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#181C28] dark:bg-white text-white dark:text-[#181C28] text-xs font-bold hover:bg-[#252C3D] dark:hover:bg-slate-100 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Add Expense
            </button>
          </div>
        ) : savingTips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savingTips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                onStatusChange={handleTipStatusChange}
                compact={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 text-xs text-slate-500">
            All spending categories are currently within normal baseline velocity. Check back as new transactions are recorded!
          </div>
        )}
      </div>

      {/* ── Optional Gemini AI Monthly Narrative & Recommendation ── */}
      <div className="dashboard-section">
        <MonthlyInsightCard
          month={metrics.month}
          monthName={metrics.monthName}
          year={metrics.year}
        />
      </div>

      {/* ── Recent Activity & Session Trail Widget ── */}
      <div className="dashboard-section">
        <RecentActivityWidget />
      </div>

      {/* Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          loadSavingTips();
        }}
        initialType={quickAddType}
      />

      {/* Set Budget Modal */}
      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          loadSavingTips();
        }}
        month={metrics.month}
      />
    </div>
  );
}
