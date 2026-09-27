"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Receipt,
  DollarSign,
  TrendingUp,
  Tag,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  ShieldCheck,
  Server,
  Database,
  CreditCard,
  Wallet,
  Coins,
  TrendingDown,
  Lock,
  History,
  Megaphone,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { CategoryIcon } from "@/components/ui/category-icon";
import { HeroAmbientCanvas } from "@/components/ui/hero-ambient-canvas";
import gsap from "gsap";

interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    totalStudents: number;
    activeUsers: number;
    disabledUsers: number;
    totalTransactions: number;
    totalVolume: number;
    averageTransaction: number;
    totalExpenses: number;
    totalIncome: number;
    totalBudgets: number;
    totalInsights: number;
  };
  topCategories: Array<{
    categoryId: string;
    name: string;
    type: string;
    color: string;
    icon: string;
    transactionCount: number;
    totalVolume: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    expenses: number;
    income: number;
    count: number;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error(`Admin stats returned status ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastRefreshed(new Date());
      } else {
        throw new Error(json.error || "Failed to load stats");
      }
    } catch (err: any) {
      console.error("Admin dashboard fetch error:", err);
      setError(err.message || "Failed to load administrative analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading && data) {
      gsap.fromTo(
        ".admin-stat-card",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    }
  }, [loading, data]);

  const stats = data?.stats;
  const topCategories = data?.topCategories || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const paymentMethods = data?.paymentMethods || [];

  // Derived metrics
  const totalPaymentCount = paymentMethods.reduce((sum, pm) => sum + pm.count, 0) || 1;
  const studentRatioPercent = stats?.totalUsers
    ? Math.round(((stats.totalStudents || 0) / stats.totalUsers) * 100)
    : 0;

  // Peak month calculation
  const peakMonth = monthlyTrends.reduce(
    (max, curr) => (curr.income + curr.expenses > max.total ? { month: curr.month, total: curr.income + curr.expenses } : max),
    { month: "N/A", total: 0 }
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ── Executive Operations Command Deck ───────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FDFCFB] to-[#FFF7ED] dark:from-[#121624] dark:via-[#1A2236] dark:to-[#0D111A] text-[#141722] dark:text-white p-6 sm:p-8 shadow-xs dark:shadow-xl dark:shadow-black/20 border border-[#E7E1D6] dark:border-white/10">
        {/* Realtime WebGL Atmospheric Backdrop Canvas */}
        <HeroAmbientCanvas />

        {/* Layered grid pattern overlay */}
        <div className="absolute inset-0 pattern-grid-mesh opacity-35 dark:opacity-25 pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Integrated System Status metadata row (no pill chips, no middle-dots) */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#525866] dark:text-[#94A0B8]">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-[#EA580C] dark:text-[#FFA64D]" />
                <span className="font-heading font-semibold text-[#141722] dark:text-white">Root Operations Console</span>
                <span className="text-[#8B96AA]">TechWiz 7 Core</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>PostgreSQL Primary Live</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[#767D8C] dark:text-[#8B96AA]">
                <span>Refreshed:</span>
                <span className="font-semibold text-[#141722] dark:text-white">
                  {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading text-[#141722] dark:text-white">
                Campus Financial OS // Governance Deck
              </h1>
              <p className="text-[#4B5565] dark:text-white/80 text-xs sm:text-sm font-medium leading-relaxed">
                Global transaction ledger, student cohort adoption, and budget caps computed across all university accounts.
              </p>
            </div>

            {/* Quick Navigation Items (no all-caps micro-label) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[#6B7280] dark:text-white/50 text-xs font-medium mr-1">Quick navigation:</span>
              <Link
                href="/admin/users"
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5F1EA] dark:bg-white/10 dark:hover:bg-white/20 border border-[#D8D0C5] dark:border-white/15 text-[#141722] dark:text-white font-semibold transition-colors shadow-2xs"
              >
                Accounts ({stats?.totalUsers ?? "..."})
              </Link>
              <Link
                href="/admin/categories"
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5F1EA] dark:bg-white/10 dark:hover:bg-white/20 border border-[#D8D0C5] dark:border-white/15 text-[#141722] dark:text-white font-semibold transition-colors shadow-2xs"
              >
                Categories
              </Link>
              <Link
                href="/admin/saving-tips"
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5F1EA] dark:bg-white/10 dark:hover:bg-white/20 border border-[#D8D0C5] dark:border-white/15 text-[#141722] dark:text-white font-semibold transition-colors shadow-2xs"
              >
                Announcements
              </Link>
              <Link
                href="/admin/system-logs"
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F5F1EA] dark:bg-white/10 dark:hover:bg-white/20 border border-[#D8D0C5] dark:border-white/15 text-[#141722] dark:text-white font-semibold transition-colors shadow-2xs"
              >
                Audit Trail
              </Link>
            </div>
          </div>

          {/* Action controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F7F4EE] dark:bg-white/10 dark:hover:bg-white/15 border-2 border-[#D8D0C5] dark:border-white/20 text-[#141722] dark:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-[#FF722B] ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Recomputing DB..." : "Refresh Aggregates"}</span>
            </button>

            <Link
              href="/admin/users"
              className="flex items-center gap-2 bg-[#FF722B] hover:bg-[#F26118] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md shadow-[#FF722B]/25 border border-transparent transition-all cursor-pointer"
            >
              <span>Manage User Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={fetchStats} className="underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Metric Stat Cards (Stripe / Mercury Hierarchical Layout) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Primary Anchor: Gross Tracked Volume & Campus Net Ledger (lg:col-span-6) */}
        <div className="admin-stat-card lg:col-span-6 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-[#6B7280] dark:text-[#8B96AA] mb-3">
              <span className="text-xs font-semibold tracking-normal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Gross platform volume
              </span>
              <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <div className="text-3xl sm:text-4xl font-black font-heading text-[#141722] dark:text-white tabular-nums tracking-tight">
                {loading ? "..." : `$${(stats?.totalVolume ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <span
                className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg ${
                  ((stats?.totalIncome ?? 0) - (stats?.totalExpenses ?? 0)) >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
                }`}
              >
                {((stats?.totalIncome ?? 0) - (stats?.totalExpenses ?? 0)) >= 0 ? "+" : ""}$
                {((stats?.totalIncome ?? 0) - (stats?.totalExpenses ?? 0)).toFixed(2)} net ledger
              </span>
            </div>
            <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-1.5">
              All-time cumulative cashflow computed across verified student and institutional accounts
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-[#F3EFE7] dark:border-[#222938]">
            <div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">Total deposits</div>
              <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">
                +${(stats?.totalIncome ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">Total outflow</div>
              <div className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400 mt-0.5 tabular-nums">
                -${(stats?.totalExpenses ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">Average ticket</div>
              <div className="text-sm font-bold font-mono text-[#141722] dark:text-white mt-0.5 tabular-nums">
                ${stats?.averageTransaction.toFixed(2) ?? "0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metric: User Directory & Cohort Adoption (lg:col-span-3) */}
        <div className="admin-stat-card lg:col-span-3 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-[#6B7280] dark:text-[#8B96AA] mb-3">
              <span className="text-xs font-semibold tracking-normal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Registered accounts
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-[#4F46E5] dark:bg-indigo-500/20 dark:text-[#818CF8]">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="text-3xl font-black font-heading text-[#141722] dark:text-white tabular-nums tracking-tight">
              {loading ? "..." : stats?.totalUsers.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mt-1">
              {studentRatioPercent}% student cohort ratio
            </div>
          </div>

          <div className="space-y-2 mt-5 pt-3.5 border-t border-[#F3EFE7] dark:border-[#222938] text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#8B96AA]">
              <span>Active users</span>
              <span className="font-bold text-[#141722] dark:text-white font-mono tabular-nums">{stats?.activeUsers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#8B96AA]">
              <span>Undergraduate students</span>
              <span className="font-bold text-[#141722] dark:text-white font-mono tabular-nums">{stats?.totalStudents ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#8B96AA]">
              <span>Disabled or pending</span>
              <span className="font-bold text-[#141722] dark:text-white font-mono tabular-nums">{stats?.disabledUsers ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Secondary Metric: Transaction Engine & Enforcement (lg:col-span-3) */}
        <div className="admin-stat-card lg:col-span-3 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-[#6B7280] dark:text-[#8B96AA] mb-3">
              <span className="text-xs font-semibold tracking-normal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                Transaction activity
              </span>
              <div className="p-2 rounded-xl bg-orange-100/70 text-[#C2410C] dark:bg-orange-500/20 dark:text-orange-300">
                <Receipt className="h-4 w-4" />
              </div>
            </div>

            <div className="text-3xl font-black font-heading text-[#141722] dark:text-white tabular-nums tracking-tight">
              {loading ? "..." : stats?.totalTransactions.toLocaleString() ?? "0"}
            </div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>All ledgers synchronized</span>
            </div>
          </div>

          <div className="space-y-2 mt-5 pt-3.5 border-t border-[#F3EFE7] dark:border-[#222938] text-xs">
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#8B96AA]">
              <span>Active budget envelopes</span>
              <span className="font-bold text-[#141722] dark:text-white font-mono tabular-nums">{stats?.totalBudgets ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#8B96AA]">
              <span>AI insights generated</span>
              <span className="font-bold text-purple-700 dark:text-purple-400 font-mono tabular-nums">{stats?.totalInsights ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#8B96AA]">
              <span>Database integrity</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">100% OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Charts Section ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Transaction Volume Trends */}
        <div className="lg:col-span-2 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 sm:p-6 shadow-xs fintech-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black font-heading text-[#141722] dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#FF722B] dark:text-[#FF7D38]" />
                  <span>6-Month Platform Volume & Cashflow Trends</span>
                </h2>
              </div>
              <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-0.5">
                Aggregated student expenses vs. income across all university ledgers
              </p>
            </div>

            {/* Custom chart legend indicators */}
            <div className="flex items-center gap-4 text-xs font-semibold text-[#767D8C] dark:text-[#8B96AA]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                Income Volume
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF722B]" />
                Expense Volume
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#767D8C] dark:text-[#8B96AA] text-xs">
                Computing database aggregates...
              </div>
            ) : monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#767D8C] dark:text-[#8B96AA] text-xs">
                No transaction data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="adminExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF722B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF722B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-[#EFEAE1] dark:text-[#222938]" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="month"
                    stroke="#8B96AA"
                    tick={{ fill: "#8B96AA", fontSize: 11 }}
                    axisLine={{ stroke: "#EFEAE1", opacity: 0.5 }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#8B96AA"
                    tick={{ fill: "#8B96AA", fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card, #FFFFFF)",
                      border: "1px solid var(--border, #EFEAE1)",
                      borderRadius: "1rem",
                      fontSize: "12px",
                      color: "var(--foreground, #141722)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                      padding: "10px 14px",
                    }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income Volume"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#adminIncomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expense Volume"
                    stroke="#FF722B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#adminExpenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sub-chart telemetry summary strip */}
          <div className="mt-4 pt-3 border-t border-[#F3EFE7] dark:border-[#222938] flex flex-wrap items-center justify-between gap-3 text-xs text-[#767D8C] dark:text-[#8B96AA]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#767D8C] dark:text-[#8B96AA]">Peak volume:</span>
              <span className="font-bold text-[#141722] dark:text-white font-mono">
                {peakMonth.month} (${peakMonth.total.toFixed(0)})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#767D8C] dark:text-[#8B96AA]">
              <span>Sample window:</span>
              <span className="font-bold text-[#141722] dark:text-white">Past 6 calendar months</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Most-Used Categories & Payment Channels */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-5 sm:p-6 shadow-xs fintech-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold font-heading text-[#141722] dark:text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#FF722B] dark:text-[#FF7D38]" />
                <span>Top Categories Leaderboard</span>
              </h2>
              <Link
                href="/admin/categories"
                className="text-xs font-bold text-[#FF722B] dark:text-[#FF7D38] hover:underline"
              >
                Manage
              </Link>
            </div>
            <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mb-4">
              Ranked transaction volume across student ledgers
            </p>

            <div className="space-y-2.5">
              {topCategories.slice(0, 5).map((c, idx) => (
                <div
                  key={c.categoryId}
                  className="p-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] hover:border-[#FF722B]/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-[#EFEAE1] dark:bg-[#222938] text-[10px] font-bold font-mono text-[#525866] dark:text-[#94A0B8] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-bold text-[#141722] dark:text-white font-heading truncate max-w-[110px]">
                        {c.name}
                      </span>
                    </div>
                    <span className="text-[#767D8C] dark:text-[#8B96AA] font-mono text-[11px]">
                      <strong className="text-[#141722] dark:text-white">${c.totalVolume.toFixed(0)}</strong> ({c.transactionCount} txs)
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#EAE5DC] dark:bg-[#1E2536] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (c.transactionCount / Math.max(topCategories[0]?.transactionCount || 1, 1)) * 100,
                          100
                        )}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Channels Breakdown */}
          <div className="pt-4 mt-4 border-t border-[#F3EFE7] dark:border-[#222938]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-[#141722] dark:text-white font-heading">
                Payment Channel Distribution
              </span>
              <span className="text-[10px] font-mono text-[#767D8C] dark:text-[#8B96AA]">
                {totalPaymentCount} Total Txs
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => {
                const percent = Math.round((pm.count / totalPaymentCount) * 100);
                return (
                  <div
                    key={pm.method}
                    className="p-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-center"
                  >
                    <div className="text-[11px] font-medium text-[#767D8C] dark:text-[#8B96AA] capitalize truncate">
                      {pm.method.toLowerCase().replace("_", " ")}
                    </div>
                    <div className="text-sm font-black font-heading text-[#141722] dark:text-white mt-0.5">
                      {percent}%
                    </div>
                    <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-mono">
                      {pm.count} txs
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Governance Fast Command Deck ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <Link
          href="/admin/users"
          className="p-4 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] hover:border-[#FF722B]/50 hover:shadow-md transition-all shadow-xs fintech-card flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#141722] dark:text-white font-heading">
                User Directory
              </div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                Manage & audit accounts
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="p-4 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] hover:border-[#FF722B]/50 hover:shadow-md transition-all shadow-xs fintech-card flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF722B] dark:text-[#FF7D38] group-hover:scale-105 transition-transform">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#141722] dark:text-white font-heading">
                Default Categories
              </div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                Configure taxonomy & colors
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/saving-tips"
          className="p-4 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] hover:border-[#FF722B]/50 hover:shadow-md transition-all shadow-xs fintech-card flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#141722] dark:text-white font-heading">
                Announcements & Tips
              </div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                Broadcast tips & guidance
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/system-logs"
          className="p-4 rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] hover:border-[#FF722B]/50 hover:shadow-md transition-all shadow-xs fintech-card flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#141722] dark:text-white font-heading">
                Audit Trail & Logs
              </div>
              <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                System activity & records
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

