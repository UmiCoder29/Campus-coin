"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { DailySpendItem, WeeklySpendItem } from "@/lib/reports-service";
import { CalendarDays, BarChart3, Flame } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface SpendingRhythmChartProps {
  dailyData: DailySpendItem[];
  weeklyData: WeeklySpendItem[];
  monthName: string;
}

export function SpendingRhythmChart({
  dailyData,
  weeklyData,
  monthName,
}: SpendingRhythmChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [viewMode, setViewMode] = useState<"DAILY" | "WEEKLY">("DAILY");

  const totalSpend = dailyData.reduce((acc, curr) => acc + curr.amount, 0);
  const maxDaySpend = Math.max(...dailyData.map((d) => d.amount), 0);

  if (totalSpend === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-72 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <CalendarDays className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Spending Rhythm in {monthName}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Daily and weekly spending bursts will populate as you log campus transactions throughout the month.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Mode Toggle Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {viewMode === "DAILY" ? (
            <>
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>Highest single-day spend: </span>
              <strong className="text-slate-900 dark:text-white font-bold">
                ${maxDaySpend.toFixed(2)}
              </strong>
            </>
          ) : (
            <>
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
              <span>5-week calendar cadence breakdown</span>
            </>
          )}
        </div>

        {/* Toggle Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("DAILY")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === "DAILY"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Daily Flow
          </button>
          <button
            type="button"
            onClick={() => setViewMode("WEEKLY")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === "WEEKLY"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Weekly Summary
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "DAILY" ? (
            <BarChart
              data={dailyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#1E293B" : "#E2E8F0"}
                opacity={0.8}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke={isDark ? "#94A3B8" : "#64748B"}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#334155" : "#E2E8F0" }}
              />
              <YAxis
                stroke={isDark ? "#94A3B8" : "#64748B"}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DailySpendItem;
                    return (
                      <div
                        className={`p-3 rounded-xl border shadow-xl text-xs space-y-1 ${
                          isDark
                            ? "bg-slate-900/95 border-slate-800 text-white"
                            : "bg-white/95 border-slate-200 text-slate-900"
                        }`}
                      >
                        <div className="font-bold text-slate-200 dark:text-slate-100">
                          {monthName} {item.day} ({item.dayName})
                        </div>
                        <div className="text-emerald-500 dark:text-emerald-400 font-extrabold text-sm">
                          ${item.amount.toFixed(2)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.count} transaction{item.count === 1 ? "" : "s"} logged
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {dailyData.map((entry) => (
                  <Cell
                    key={`bar-${entry.day}`}
                    fill={
                      entry.amount === maxDaySpend && entry.amount > 0
                        ? "#f59e0b" // Highlight peak day with amber
                        : entry.amount > 0
                        ? "#6366f1" // Active spend days indigo
                        : "#cbd5e1" // Inactive days slate
                    }
                    opacity={entry.amount > 0 ? 0.9 : 0.25}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={weeklyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                className="dark:stroke-slate-800"
                opacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="rangeLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as WeeklySpendItem;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1">
                        <div className="font-bold text-slate-200">
                          {item.week}: {item.rangeLabel}
                        </div>
                        <div className="text-emerald-400 font-extrabold text-sm">
                          ${item.amount.toFixed(2)}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {item.count} total transactions
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="amount"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
