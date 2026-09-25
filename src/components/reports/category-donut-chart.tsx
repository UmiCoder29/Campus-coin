"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { CategoryPieItem } from "@/lib/reports-service";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PieChart as PieIcon, HelpCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface CategoryDonutChartProps {
  data: CategoryPieItem[];
  totalExpense: number;
  monthName: string;
}

export function CategoryDonutChart({
  data,
  totalExpense,
  monthName,
}: CategoryDonutChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || totalExpense === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-80 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Spending Recorded in {monthName}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          When you record expenses for this month, an interactive category breakdown and percentage analysis will appear here.
        </p>
      </div>
    );
  }

  // Pre-calculated or hovered slice highlight
  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Donut Chart Visual */}
      <div className="md:col-span-6 relative h-64 sm:h-72 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as CategoryPieItem;
                  return (
                    <div
                      className={`p-3 rounded-xl border shadow-xl text-xs ${
                        isDark
                          ? "bg-slate-900/95 border-slate-800 text-white"
                          : "bg-white/95 border-slate-200 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span>{d.name}</span>
                      </div>
                      <div className="text-emerald-500 dark:text-emerald-400 font-extrabold text-sm">
                        ${d.amount.toFixed(2)}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {d.percentage}% of {monthName} expenses &bull; {d.count} tx
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="64%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="transparent"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.id}`}
                  fill={entry.color || "#6366F1"}
                  className="transition-all duration-300 cursor-pointer focus:outline-none"
                  style={{
                    filter:
                      activeIndex === index
                        ? "drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
                        : "none",
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                    transform:
                      activeIndex === index ? "scale(1.03)" : "scale(1)",
                    transformOrigin: "center center",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {activeItem ? activeItem.name : "Total Outflow"}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            ${activeItem ? activeItem.amount.toFixed(2) : totalExpense.toFixed(2)}
          </span>
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            {activeItem ? `${activeItem.percentage}% of total` : `${data.length} Categories`}
          </span>
        </div>
      </div>

      {/* Category Breakdown Legend with Name, Amount, & Percentage */}
      <div className="md:col-span-6 space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {data.map((item, idx) => {
          const isHovered = activeIndex === idx;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isHovered
                  ? "bg-slate-100/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 shadow-xs"
                  : "bg-slate-50/60 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  >
                    <CategoryIcon name={item.icon} className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    ({item.count} tx)
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ${item.amount.toFixed(2)}
                  </span>
                  <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Mini Percentage Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
