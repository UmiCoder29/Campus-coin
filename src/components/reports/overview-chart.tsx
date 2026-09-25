"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/theme-provider";

interface VelocityPoint {
  month: string;
  actual: number;
  budget: number;
  highlight?: boolean;
}

const defaultData: VelocityPoint[] = [
  { month: "Jan", actual: 165, budget: 280 },
  { month: "Feb", actual: 210, budget: 270, highlight: true },
  { month: "Mar", actual: 412, budget: 350, highlight: true },
  { month: "Apr", actual: 275, budget: 320, highlight: true },
  { month: "May", actual: 276, budget: 300, highlight: true },
  { month: "Jun", actual: 140, budget: 260 },
];

export function OverviewChart() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={defaultData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="velocityAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isDark ? "#4F6E9C" : "#2C436B"} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isDark ? "#4F6E9C" : "#2C436B"} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8B42" />
              <stop offset="100%" stopColor="#FF6E26" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="2 2"
            vertical={false}
            stroke={isDark ? "#222938" : "#EFEAE1"}
            opacity={0.8}
          />

          <XAxis
            dataKey="month"
            stroke={isDark ? "#768297" : "#8F95A3"}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: isDark ? "#222938" : "#EFEAE1" }}
          />

          <YAxis
            stroke={isDark ? "#768297" : "#8F95A3"}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, 450]}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#161B27" : "#FFFFFF",
              borderRadius: "1rem",
              border: `1px solid ${isDark ? "#2A3448" : "#EFEAE1"}`,
              color: isDark ? "#F2F5F9" : "#141722",
              fontSize: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              padding: "10px 14px",
            }}
            formatter={(value: any, name: any) => [
              `$${value}`,
              name === "actual" ? "Actual Expenses" : "Budget Cap",
            ]}
          />

          {/* Warm Coral Bars */}
          <Bar
            dataKey="actual"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            barSize={18}
          />

          {/* Area under the line */}
          <Area
            type="monotone"
            dataKey="budget"
            stroke="transparent"
            fill="url(#velocityAreaGradient)"
          />

          {/* Deep Navy/Blue Pacing Line */}
          <Line
            type="monotone"
            dataKey="budget"
            stroke={isDark ? "#6E93D1" : "#243A61"}
            strokeWidth={2.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.highlight) {
                return (
                  <g key={`dot-${payload.month}`}>
                    <circle cx={cx} cy={cy} r={3.5} fill={isDark ? "#6E93D1" : "#243A61"} />
                    <rect
                      x={cx - 14}
                      y={cy - 20}
                      width={28}
                      height={14}
                      rx={3}
                      fill={isDark ? "#222938" : "#FFFFFF"}
                      stroke={isDark ? "#3E4960" : "#E5DFD5"}
                      strokeWidth={1}
                    />
                    <text
                      x={cx}
                      y={cy - 10}
                      textAnchor="middle"
                      fill={isDark ? "#F2F5F9" : "#141722"}
                      fontSize={9}
                      fontWeight="bold"
                    >
                      {payload.actual}
                    </text>
                  </g>
                );
              }
              return <circle key={`dot-blank-${payload.month}`} cx={cx} cy={cy} r={0} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default OverviewChart;
