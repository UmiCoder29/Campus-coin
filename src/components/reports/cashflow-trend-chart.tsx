"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { TrendMonthItem } from "@/lib/reports-service";
import { TrendingUp, Sparkles } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface CashflowTrendChartProps {
  data: TrendMonthItem[];
  selectedMonth: string;
}

export function CashflowTrendChart({
  data,
  selectedMonth,
}: CashflowTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const hasAnyData = data.some((m) => m.income > 0 || m.expense > 0);

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-72 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <TrendingUp className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Historical Activity Found
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          As you log allowances and expenses across academic months, your 6-month comparative cashflow velocity and next-month forecast will graph here.
        </p>
      </div>
    );
  }

  const gridStroke = isDark ? "#1E293B" : "#E2E8F0";
  const textStroke = isDark ? "#94A3B8" : "#64748B";
  const axisLineColor = isDark ? "#334155" : "#E2E8F0";

  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
            barGap={6}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              opacity={0.8}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke={textStroke}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: axisLineColor }}
            />
            <YAxis
              stroke={textStroke}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const mData = payload[0].payload as TrendMonthItem;
                  const isPositive = mData.net >= 0;
                  return (
                    <div
                      className={`p-3.5 rounded-xl border shadow-xl text-xs space-y-1.5 min-w-[180px] ${
                        isDark
                          ? "bg-slate-900/95 border-slate-800 text-white"
                          : "bg-white/95 border-slate-200 text-slate-900"
                      }`}
                    >
                      <div className="font-bold text-sm border-b pb-1 flex items-center justify-between border-slate-200 dark:border-slate-800">
                        <span>{mData.fullLabel}</span>
                        {mData.isProjection ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-300">
                            Forecast
                          </span>
                        ) : mData.monthStr === selectedMonth ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-500 dark:text-indigo-300">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {mData.isProjection ? "Projected Income:" : "Income:"}
                        </span>
                        <span className="font-extrabold">${mData.income.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {mData.isProjection ? "Projected Spend:" : "Expense:"}
                        </span>
                        <span className="font-extrabold">${mData.expense.toFixed(2)}</span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold">
                        <span className="text-slate-500 dark:text-slate-400">Net Surplus:</span>
                        <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {isPositive ? "+" : "-"}${Math.abs(mData.net).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        Savings Rate: {mData.savingsRate}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: "10px", fontSize: "12px", fontWeight: "600" }}
              formatter={(value) => (
                <span className="text-slate-700 dark:text-slate-300 capitalize">{value}</span>
              )}
            />
            {/* Income Bar (Emerald) */}
            <Bar
              name="Income"
              dataKey="income"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-inc-${index}`}
                  fill="#10b981"
                  fillOpacity={entry.isProjection ? 0.45 : 1}
                  stroke={entry.isProjection ? "#10b981" : undefined}
                  strokeDasharray={entry.isProjection ? "3 3" : undefined}
                />
              ))}
            </Bar>
            {/* Expense Bar (Rose) */}
            <Bar
              name="Expense"
              dataKey="expense"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-exp-${index}`}
                  fill="#f43f5e"
                  fillOpacity={entry.isProjection ? 0.45 : 1}
                  stroke={entry.isProjection ? "#f43f5e" : undefined}
                  strokeDasharray={entry.isProjection ? "3 3" : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 6-Month Summary Statistics Strip with Projected Indicator */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        {data.slice(-4).map((m) => (
          <div
            key={m.monthStr}
            className={`p-2 rounded-xl transition-colors ${
              m.isProjection
                ? "bg-amber-50/60 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-800"
                : m.monthStr === selectedMonth
                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800"
                : "bg-slate-50/40 dark:bg-slate-800/30"
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <span>{m.label}</span>
              {m.isProjection && <Sparkles className="h-2.5 w-2.5 text-amber-500" />}
            </div>
            <div
              className={`font-black text-sm mt-0.5 ${
                m.net >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {m.net >= 0 ? "+" : "-"}${Math.abs(m.net).toFixed(0)}
            </div>
            {m.isProjection && (
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                Next-Month Forecast
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
