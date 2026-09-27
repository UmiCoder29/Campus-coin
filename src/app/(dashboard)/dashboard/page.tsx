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
  ArrowDownRight,
  Plus,
  Receipt,
  Target,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  GraduationCap,
  Clock,
  Flame,
  ShieldCheck,
  CheckCircle,
  Compass,
  CreditCard,
  Zap,
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
import { HeroAmbientCanvas } from "@/components/ui/hero-ambient-canvas";
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

  const {
    preloadedDashboardMetrics,
    notifyDashboardReady,
    justTransitioned,
    clearJustTransitioned,
  } = useAuthTransition();

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

  const handleTipStatusChange = async (
    tipId: string,
    newStatus: "ACTIVE" | "PINNED" | "DISMISSED"
  ) => {
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

  // Initial mount
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

  // Listen for live student profile & target updates from Settings
  useEffect(() => {
    const handleProfileUpdated = () => {
      loadDashboardData();
    };
    window.addEventListener("campus-coin:profile-updated", handleProfileUpdated);
    return () => {
      window.removeEventListener("campus-coin:profile-updated", handleProfileUpdated);
    };
  }, [loadDashboardData]);

  // Tactile keyboard shortcuts: 'e' for expense, 'i' for income
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setQuickAddType("EXPENSE");
        setQuickAddOpen(true);
      } else if ((e.key === "i" || e.key === "I") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setQuickAddType("INCOME");
        setQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Daily burn rate calculations
  const daysInMonth = 30;
  const daysPassed = Math.max(1, daysInMonth - metrics.daysRemaining);
  const dailyBurnRate = (metrics.monthExpense / daysPassed).toFixed(2);

  // Safe daily spend estimate from budget envelope
  const remainingBudget = Math.max(0, metrics.budgetTotal - metrics.budgetSpent);
  const safeDailySpend =
    metrics.daysRemaining > 0
      ? remainingBudget > 0
        ? (remainingBudget / metrics.daysRemaining).toFixed(0)
        : Math.max(0, (metrics.monthIncome - metrics.monthExpense) / metrics.daysRemaining).toFixed(0)
      : "0";

  // Burn intensity level (1 to 5) for tactile visual meter
  const burnIntensity =
    metrics.monthExpense === 0
      ? 1
      : metrics.budgetUsedPercent > 100
      ? 5
      : metrics.budgetUsedPercent >= 80
      ? 4
      : metrics.budgetUsedPercent >= 50
      ? 3
      : 2;

  return (
    <div className="space-y-6">
      {/* ── Bespoke Collegiate Command Deck ───────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FDFCFB] to-[#FFF7ED] dark:from-[#121624] dark:via-[#1A2236] dark:to-[#0D111A] text-[#141722] dark:text-white p-6 sm:p-8 shadow-xs dark:shadow-xl dark:shadow-black/20 border border-[#E7E1D6] dark:border-white/10">
        {/* Subtle WebGL fluid atmospheric backdrop */}
        <HeroAmbientCanvas intensity={0.25} className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30" />

        {/* Layered grid pattern overlay */}
        <div className="absolute inset-0 pattern-grid-mesh opacity-35 dark:opacity-25 pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Integrated ledger metadata row (no pill containers, no middle dot separators) */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#525866] dark:text-[#94A0B8]">
              <div className="flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-4 w-4 text-[#EA580C] dark:text-[#FFA64D]" />
                <span className="font-heading font-semibold text-[#141722] dark:text-white">Campus Ledger</span>
                <span className="text-[#8B96AA]">{metrics.monthName} {metrics.year}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#C2410C] dark:text-[#FFA64D]" />
                <span>Day {daysPassed} of {daysInMonth} ({metrics.daysRemaining} days remaining)</span>
              </div>
              {metrics.hasBudgets && (
                <div className="flex items-center gap-1.5 font-semibold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      metrics.budgetUsedPercent > 100
                        ? "bg-rose-500 animate-pulse"
                        : metrics.budgetUsedPercent >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span
                    className={
                      metrics.budgetUsedPercent > 100
                        ? "text-rose-600 dark:text-rose-400"
                        : metrics.budgetUsedPercent >= 80
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  >
                    {metrics.budgetUsedPercent > 100
                      ? "Cap exceeded"
                      : metrics.budgetUsedPercent >= 80
                      ? "Near threshold"
                      : "Optimal pacing"}
                  </span>
                </div>
              )}
            </div>

            {/* Personalized greeting with display font */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading text-[#141722] dark:text-white">
                {greeting}, {userName}! 🐝
              </h1>
              <p className="text-[#4B5565] dark:text-white/80 text-xs sm:text-sm font-medium leading-relaxed">
                {metrics.hasBudgets ? (
                  <>
                    You&apos;ve deployed{" "}
                    <span className="font-bold text-[#141722] dark:text-white underline decoration-[#FF722B] decoration-2 underline-offset-4">
                      {metrics.budgetUsedPercent}%
                    </span>{" "}
                    of your {metrics.monthName} category caps (${metrics.budgetSpent.toFixed(0)} of ${metrics.budgetTotal.toFixed(0)}).{" "}
                    {metrics.daysRemaining > 0 && (
                      <span className="text-[#4B5565] dark:text-white/90">
                        Estimated safe spending velocity is{" "}
                        <span className="font-extrabold text-[#C2410C] dark:text-[#FFA64D]">${safeDailySpend}/day</span>.
                      </span>
                    )}
                  </>
                ) : (
                  `Welcome to your campus ledger. Set your monthly category allowances to monitor daily velocity and build savings habits.`
                )}
              </p>
            </div>

            {/* Term Cycle Progress Track */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#6B7280] dark:text-white/60 font-medium">Term cycle pacing</span>
                <span className="text-[#141722] dark:text-white/80 font-bold">{Math.round((daysPassed / daysInMonth) * 100)}% elapsed</span>
              </div>
              <div className="w-full h-2 bg-[#E5DECF] dark:bg-white/15 rounded-full overflow-hidden flex gap-0.5">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const segPercent = (idx + 1) * 10;
                  const isFilled = (daysPassed / daysInMonth) * 100 >= segPercent;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-full rounded-xs transition-colors duration-500 ${
                        isFilled ? "bg-gradient-to-r from-[#FF722B] to-[#FFA64D]" : "bg-[#E5DECF] dark:bg-white/15"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Tactile Quick Actions & Safe Spend Compass */}
          <div className="flex flex-col sm:flex-row xl:flex-col gap-3 shrink-0">
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setQuickAddType("EXPENSE");
                  setQuickAddOpen(true);
                }}
                id="quick-add-expense"
                className="group relative flex items-center gap-2 bg-[#FF722B] hover:bg-[#F26118] active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-md shadow-[#FF722B]/25 border border-transparent transition-all cursor-pointer"
                title="Log Expense (Press 'E')"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
                <span>Log Expense</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/20 text-white/95 font-mono font-medium">
                  E
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickAddType("INCOME");
                  setQuickAddOpen(true);
                }}
                id="quick-add-income"
                className="group flex items-center gap-2 bg-white hover:bg-[#F7F4EE] dark:bg-white/10 dark:hover:bg-white/15 border-2 border-[#D8D0C5] hover:border-[#FF722B] dark:border-white/20 active:scale-95 text-[#141722] dark:text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition-all cursor-pointer shadow-xs"
                title="Deposit Inflow (Press 'I')"
              >
                <Plus className="h-4 w-4 text-[#FF722B] dark:text-[#FFA64D] transition-transform group-hover:rotate-90 duration-200" />
                <span>Deposit Inflow</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#F1EFEA] dark:bg-white/15 text-[#525866] dark:text-white/80 font-mono font-medium">
                  I
                </kbd>
              </button>
            </div>

            {/* Smart Daily Allowance Compass */}
            <div className="p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-white/5 border border-[#E5DECF] dark:border-white/10 backdrop-blur-md shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-[#C2410C] dark:text-[#FFA64D] flex items-center justify-center border border-orange-200 dark:border-orange-500/30">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-[#6B7280] dark:text-white/60 font-medium">
                    Safe Daily Spend
                  </div>
                  <div className="text-base font-black font-heading text-[#141722] dark:text-white">
                    ${safeDailySpend} <span className="text-xs font-normal text-[#6B7280] dark:text-white/60">/ day</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBudgetModalOpen(true)}
                className="text-xs font-bold text-[#C2410C] dark:text-[#FFA64D] hover:underline transition-colors cursor-pointer"
              >
                Set Cap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zero-Data Onboarding Card ───────── */}
      {!metrics.hasTransactions && (
        <div className="p-6 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEFE6] dark:bg-[#FF722B]/15 text-[#FF722B] dark:text-[#FF7D38] flex items-center justify-center shrink-0 shadow-xs border border-[#FF722B]/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#141722] dark:text-white text-base font-heading">
                Welcome to your Campus Coin Cockpit!
              </h3>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5 max-w-xl">
                You haven&apos;t recorded any entries yet. Click &quot;Log Expense&quot; [E] or &quot;Deposit Inflow&quot; [I] to begin your financial ledger, or set your category caps under Budgets!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setQuickAddType("EXPENSE");
              setQuickAddOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#141722] hover:bg-[#252C3D] dark:bg-[#FF722B] dark:hover:bg-[#F26118] text-white text-xs font-bold transition-all shrink-0 shadow-sm cursor-pointer"
          >
            Record First Transaction
          </button>
        </div>
      )}

      {/* ── Expressive KPI Telemetry Deck (Stripe/Mercury School of Design) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Primary Anchor Ledger (Net Cashflow & Position) - Spans 2 cols */}
        <div className="fintech-kpi-card lg:col-span-2 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#6B7280] dark:text-[#8B96AA] flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${metrics.monthNet >= 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>{metrics.monthName} Net Cashflow</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                <div
                  className={`text-3xl sm:text-4xl font-black font-heading tracking-tight ${
                    metrics.monthNet >= 0
                      ? "text-[#141722] dark:text-white"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {metrics.monthNet >= 0 ? "+" : "-"}${Math.abs(metrics.monthNet).toFixed(2)}
                </div>
                <div
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    metrics.monthNet >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <span>{metrics.monthNet >= 0 ? "Surplus reserve" : "Drawdown balance"}</span>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-2xl shrink-0 ${
              metrics.monthNet >= 0
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300"
            }`}>
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#F3EFE7] dark:border-[#222938] text-xs">
            <div>
              <span className="text-[#6B7280] dark:text-[#8B96AA] block text-[11px]">All-time ledger balance</span>
              <span className="font-bold font-mono text-sm text-[#141722] dark:text-white">
                ${metrics.allTimeNetBalance.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] dark:text-[#8B96AA] block text-[11px]">Monthly deposits</span>
              <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                +${metrics.monthIncome.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Outflow & Daily Burn Rate */}
        <div className="fintech-kpi-card rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6B7280] dark:text-[#8B96AA] mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{metrics.monthName} Expenses</span>
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-black font-heading text-[#BE123C] dark:text-[#FB7185] mt-1">
              -${metrics.monthExpense.toFixed(2)}
            </div>

            <div className="text-xs text-[#6B7280] dark:text-[#8B96AA] mt-2">
              <span>{metrics.totalTransactionCount} transactions logged</span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#F3EFE7] dark:border-[#222938] flex items-center justify-between text-xs">
            <span className="text-[#6B7280] dark:text-[#8B96AA] flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>Burn rate:</span>
            </span>
            <span className="font-bold text-[#141722] dark:text-white font-mono">
              ${dailyBurnRate} / day
            </span>
          </div>
        </div>

        {/* Card 3: Budget Envelope Pacing Meter */}
        <div className="fintech-kpi-card rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#6B7280] dark:text-[#8B96AA] mb-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                <span>Budget Envelopes</span>
              </span>
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-[#C2410C] dark:text-orange-300">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl sm:text-3xl font-black font-heading text-[#141722] dark:text-white">
                {metrics.hasBudgets ? `${metrics.budgetUsedPercent}%` : "No limits set"}
              </div>
              {metrics.hasBudgets && (
                <span
                  className={`text-xs font-semibold ${
                    metrics.budgetUsedPercent > 100
                      ? "text-rose-600 dark:text-rose-400"
                      : metrics.budgetUsedPercent >= 80
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {metrics.budgetUsedPercent > 100
                    ? "Cap exceeded"
                    : metrics.budgetUsedPercent >= 80
                    ? "Near threshold"
                    : "Safe pace"}
                </span>
              )}
            </div>

            {/* Single clean proportional progress bar */}
            {metrics.hasBudgets && (
              <div className="w-full bg-[#E5DECF] dark:bg-[#1E2536] h-2 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    metrics.budgetUsedPercent > 100
                      ? "bg-rose-500"
                      : metrics.budgetUsedPercent >= 80
                      ? "bg-amber-500"
                      : "bg-[#FF722B]"
                  }`}
                  style={{ width: `${Math.min(metrics.budgetUsedPercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="text-xs text-[#6B7280] dark:text-[#8B96AA] mt-5 pt-3 border-t border-[#F3EFE7] dark:border-[#222938] flex items-center justify-between">
            <span className="font-mono text-[11px]">
              ${metrics.budgetSpent.toFixed(0)} of ${metrics.budgetTotal.toFixed(0)} spent
            </span>
            <button
              onClick={() => setBudgetModalOpen(true)}
              className="text-[#C2410C] dark:text-[#FFA64D] hover:underline font-semibold text-xs cursor-pointer"
            >
              Adjust caps
            </button>
          </div>
        </div>
      </div>

      {/* ── Spending Velocity Chart + Top Category Spotlight & Vault ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs fintech-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-black font-heading text-[#141722] dark:text-white">
                Semester Spending Velocity & Pacing
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#8B96AA] mt-0.5">
                Real-time campus outflow cadence with interactive projection guidelines and dotted velocity matrix
              </p>
            </div>
          </div>

          <OverviewChart />
        </div>

        {/* Top Category Spotlight & Savings Goal Vault (1 Col) */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black font-heading text-[#141722] dark:text-white">
                Top Expenditure Spotlight
              </h2>
              <span className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
                {metrics.monthName}
              </span>
            </div>

            {metrics.topCategory ? (
              /* Campus Spend Ticket Aesthetic */
              <div className="relative p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-center overflow-hidden">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs mx-auto mb-3"
                  style={{ backgroundColor: metrics.topCategory.color || "#FF722B" }}
                >
                  <CategoryIcon
                    name={metrics.topCategory.icon}
                    className="h-7 w-7 text-white"
                  />
                </div>

                <div className="text-sm font-extrabold text-[#141722] dark:text-white font-heading">
                  {metrics.topCategory.name}
                </div>
                <div className="text-2xl font-black font-heading text-[#141722] dark:text-white mt-0.5">
                  ${metrics.topCategory.amount.toFixed(2)}
                </div>

                <div className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-1 font-mono">
                  {metrics.topCategory.percentOfTotal}% of total monthly outflow
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#EFEAE1] dark:border-[#222938]">
                  <div
                    className={`text-xs font-semibold ${
                      metrics.topCategory.trendUp
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <span>{metrics.topCategory.trend} vs last month</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                <HelpCircle className="h-8 w-8 text-[#9EA5B4] dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] font-medium">
                  No expenses recorded in {metrics.monthName} yet
                </p>
              </div>
            )}
          </div>

          {/* Student Savings Goal Mini-Vault Widget */}
          <div className="mt-4 p-4 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#525866] dark:text-[#94A0B8] flex items-center gap-1.5 font-heading">
                <Target className="h-4 w-4 text-[#FF722B]" />
                <span>Semester savings vault</span>
              </span>
              <span className="font-bold text-[#141722] dark:text-white font-mono">
                ${currentSavings.toFixed(0)} of ${savingsGoalTarget}
              </span>
            </div>

            <div className="w-full bg-[#EAE5DC] dark:bg-[#1E2536] h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF722B] to-[#FFA64D] transition-all duration-1000"
                style={{ width: `${savingsPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#767D8C] dark:text-[#8B96AA] mt-2 font-mono">
              <span>{savingsPercent >= 100 ? "Goal completed" : "Accumulating reserve"}</span>
              <span className="font-bold text-[#141722] dark:text-white">{savingsPercent}% achieved</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget vs Actual Envelope Board & Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Envelopes (Tabular Data-Dense Stripe/Mercury layout) */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black font-heading text-[#141722] dark:text-white">
                  Budget Envelopes vs. Actuals
                </h2>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
                  {metrics.monthName} {metrics.year} category caps & pace
                </p>
              </div>
              <Link
                href="/budgets"
                className="text-xs font-bold text-[#FF722B] dark:text-[#FF7D38] hover:underline"
              >
                Planner
              </Link>
            </div>

            {metrics.hasBudgets ? (
              <div className="divide-y divide-[#F3EFE7] dark:divide-[#222938]">
                {metrics.budgetVsActual.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-[#FBF9F5]/70 dark:hover:bg-[#1E2536]/30 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.categoryColor }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#141722] dark:text-white truncate">
                          {item.categoryName}
                        </div>
                        <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                          <span>{item.percentage}% deployed, {item.remaining > 0 ? `$${item.remaining.toFixed(0)} remaining` : `$${item.overAmount.toFixed(0)} over cap`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[#141722] dark:text-white">
                        ${item.spent.toFixed(0)} <span className="text-[#767D8C] dark:text-[#8B96AA] font-normal">/ ${item.limit.toFixed(0)}</span>
                      </div>
                      <div className="w-24 bg-[#EAE5DC] dark:bg-[#1E2536] h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isOver
                              ? "bg-rose-500"
                              : item.status === "WARNING"
                              ? "bg-amber-500"
                              : "bg-[#FF722B]"
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5]/60 dark:bg-[#0E121B]/40">
                <PiggyBank className="h-8 w-8 text-[#9EA5B4] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#141722] dark:text-white font-heading">
                  No active budgets for {metrics.monthName}
                </h4>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] max-w-xs mx-auto mt-1 mb-4">
                  Set category spending limits to pace your cashflow and receive automated threshold alerts!
                </p>
                <button
                  onClick={() => setBudgetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF722B] hover:bg-[#F26118] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Set Up Category Budget</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/budgets"
            className="mt-4 text-center py-2.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-xs font-bold text-[#FF722B] dark:text-[#FF7D38] hover:bg-[#FBF9F5] dark:hover:bg-[#1E2536] transition-colors"
          >
            Open Full Budget Planner
          </Link>
        </div>

        {/* Recent Campus Activity Ledger */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs fintech-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black font-heading text-[#141722] dark:text-white">
                  Recent Campus Activity
                </h2>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
                  Latest recorded ledger entries & vouchers
                </p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-bold text-[#FF722B] dark:text-[#FF7D38] hover:underline"
              >
                View All
              </Link>
            </div>

            {metrics.recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {metrics.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] flex items-center justify-between gap-3 group hover:border-[#FF722B]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: tx.color }}
                      >
                        <CategoryIcon name={tx.icon} className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#141722] dark:text-white truncate font-heading">
                          {tx.merchant}
                        </div>
                        <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA] flex items-center gap-2">
                          <span>{tx.category}</span>
                          <span className="text-[#A0AAB8] dark:text-[#64748B]">/</span>
                          <span>
                            {new Date(tx.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-extrabold font-mono shrink-0 px-2.5 py-1 rounded-lg ${
                        tx.type === "INCOME"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-[#E11D48] dark:bg-rose-950/40 dark:text-[#FB7185]"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                <Receipt className="h-8 w-8 text-[#9EA5B4] dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] font-medium">
                  No campus transactions recorded yet
                </p>
              </div>
            )}
          </div>

          <Link
            href="/transactions"
            className="mt-4 text-center py-2.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-xs font-bold text-[#FF722B] dark:text-[#FF7D38] hover:bg-[#FBF9F5] dark:hover:bg-[#1E2536] transition-colors"
          >
            Open Transaction Ledger
          </Link>
        </div>
      </div>

      {/* ── Personalized Saving Tips (Rule-Based Engine) ── */}
      <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs fintech-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F3EFE7] dark:border-[#222938]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FFA64D] text-white shrink-0 shadow-md shadow-[#FF722B]/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-heading text-[#141722] dark:text-white">
                Personalized Saving Advice
              </h3>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5">
                Tailored recommendations evaluated from your {metrics.monthName} spending velocity & caps
              </p>
            </div>
          </div>
          <Link
            href="/saving-tips"
            className="shrink-0 text-xs font-bold text-[#FF722B] dark:text-[#FF7D38] hover:underline hover:text-[#FFA64D] transition-colors"
          >
            All Tips & History
          </Link>
        </div>

        {/* Low-data friendly prompt for new users */}
        {isTipsLowData ? (
          <div className="p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <h4 className="text-xs font-bold font-heading text-[#141722] dark:text-white">
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
              className="px-3.5 py-1.5 rounded-xl bg-[#141722] dark:bg-white text-white dark:text-[#141722] text-xs font-bold hover:bg-[#252C3D] dark:hover:bg-slate-100 transition-colors shrink-0 shadow-xs cursor-pointer"
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

      {/* ── Gemini AI Monthly Narrative & Recommendation ── */}
      <div>
        <MonthlyInsightCard
          month={metrics.month}
          monthName={metrics.monthName}
          year={metrics.year}
        />
      </div>

      {/* ── Recent Activity & Session Trail Widget ── */}
      <div>
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

