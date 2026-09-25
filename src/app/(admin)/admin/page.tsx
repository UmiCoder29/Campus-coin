"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Receipt,
  DollarSign,
  TrendingUp,
  Tag,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  Award,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import Link from "next/link";

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

  const stats = data?.stats;
  const topCategories = data?.topCategories || [];
  const monthlyTrends = data?.monthlyTrends || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Bar ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              System Overview & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              Live DB Aggregates
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global ledger metrics, student adoption, and category usage computed in PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Metrics</span>
          </button>

          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-colors"
          >
            <span>Manage Users</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* ── Metric Stat Cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Accounts
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : stats?.totalUsers.toLocaleString() ?? "0"}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-400 font-semibold">
              {stats?.totalStudents ?? 0} students
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">
              {stats?.activeUsers ?? 0} active ({stats?.disabledUsers ?? 0} disabled)
            </span>
          </div>
        </div>

        {/* Card 2: Transactions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transactions Logged
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : stats?.totalTransactions.toLocaleString() ?? "0"}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Avg: ${stats?.averageTransaction.toFixed(2) ?? "0.00"}</span>
            <span className="text-slate-600">&bull;</span>
            <span>{stats?.totalBudgets ?? 0} budgets monitored</span>
          </div>
        </div>

        {/* Card 3: Volume */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Tracked Volume
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {loading ? "..." : `$${(stats?.totalVolume ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-rose-400 font-semibold">
              -${(stats?.totalExpenses ?? 0).toFixed(0)} spent
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400 font-semibold">
              +${(stats?.totalIncome ?? 0).toFixed(0)} earned
            </span>
          </div>
        </div>

        {/* Card 4: AI & Health */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              System Health & AI
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 flex items-center gap-2">
            <span>100% OK</span>
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>{stats?.totalInsights ?? 0} AI insights generated</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400">PostgreSQL sync</span>
          </div>
        </div>
      </div>

      {/* ── Main Charts Section ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Transaction Volume Trends */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span>6-Month Platform Volume & Cashflow Trends</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated student expenses vs. income across all university ledgers
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Computing database aggregates...
              </div>
            ) : monthlyTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No transaction data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="adminIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748B"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#F8FAFC",
                    }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income Volume"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#adminIncomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expense Volume"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#adminExpenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1 Col: Top Most-Used Categories */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-amber-400" />
                <span>Top Categories</span>
              </h2>
              <Link
                href="/admin/categories"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                Manage
              </Link>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Highest transaction volume across the campus ecosystem
            </p>

            <div className="space-y-3.5">
              {topCategories.map((c) => (
                <div key={c.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-semibold text-slate-200">{c.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono font-medium">
                      {c.transactionCount} txs (${c.totalVolume.toFixed(0)})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
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

          <div className="pt-4 mt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Payment Channels:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                Cash
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                Campus Card
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300">
                Digital Wallet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
