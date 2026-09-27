"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import gsap from "gsap";
import { useTheme } from "@/components/theme-provider";
import { Calendar, Layers, Sparkles, Download } from "lucide-react";

export interface VelocityPoint {
  month: string;
  actual: number;
  budget: number;
  highlight?: boolean;
}

interface DailyPoint {
  day: number;
  dateStr: string;
  actual: number;
  budgetBenchmark: number;
  category?: string;
  notes?: string;
}

// 30-Day Daily Campus Spend distribution matching collegiate monthly cycles
const generateDailyData = (): DailyPoint[] => [
  { day: 1, dateStr: "Mar 1", actual: 40, budgetBenchmark: 50, category: "Coffee & Supplies" },
  { day: 2, dateStr: "Mar 2", actual: 80, budgetBenchmark: 50, category: "Groceries" },
  { day: 3, dateStr: "Mar 3", actual: 60, budgetBenchmark: 50, category: "Campus Dining" },
  { day: 4, dateStr: "Mar 4", actual: 100, budgetBenchmark: 50, category: "Textbooks & Prints" },
  { day: 5, dateStr: "Mar 5", actual: 40, budgetBenchmark: 50, category: "Transit Pass" },
  { day: 6, dateStr: "Mar 6", actual: 20, budgetBenchmark: 50, category: "Vending" },
  { day: 7, dateStr: "Mar 7", actual: 80, budgetBenchmark: 50, category: "Weekend Dining" },
  { day: 8, dateStr: "Mar 8", actual: 60, budgetBenchmark: 50, category: "Snacks & Cafe" },
  { day: 9, dateStr: "Mar 9", actual: 40, budgetBenchmark: 50, category: "Stationery" },
  { day: 10, dateStr: "Mar 10", actual: 140, budgetBenchmark: 50, category: "Lab Equipment Fee" },
  { day: 11, dateStr: "Mar 11", actual: 100, budgetBenchmark: 50, category: "Course Software" },
  { day: 12, dateStr: "Mar 12", actual: 60, budgetBenchmark: 50, category: "Campus Meals" },
  { day: 13, dateStr: "Mar 13", actual: 60, budgetBenchmark: 50, category: "Campus Dining" },
  { day: 14, dateStr: "Mar 14", actual: 220, budgetBenchmark: 50, category: "Campus Tech Gear" }, // Featured reference point
  { day: 15, dateStr: "Mar 15", actual: 240, budgetBenchmark: 50, category: "Semester Textbooks" },
  { day: 16, dateStr: "Mar 16", actual: 120, budgetBenchmark: 50, category: "Club Membership" },
  { day: 17, dateStr: "Mar 17", actual: 40, budgetBenchmark: 50, category: "Transit" },
  { day: 18, dateStr: "Mar 18", actual: 20, budgetBenchmark: 50, category: "Library Printing" },
  { day: 19, dateStr: "Mar 19", actual: 40, budgetBenchmark: 50, category: "Coffee Cart" },
  { day: 20, dateStr: "Mar 20", actual: 120, budgetBenchmark: 50, category: "Social Outing" },
  { day: 21, dateStr: "Mar 21", actual: 60, budgetBenchmark: 50, category: "Groceries" },
  { day: 22, dateStr: "Mar 22", actual: 60, budgetBenchmark: 50, category: "Campus Diners" },
  { day: 23, dateStr: "Mar 23", actual: 80, budgetBenchmark: 50, category: "Student Union" },
  { day: 24, dateStr: "Mar 24", actual: 100, budgetBenchmark: 50, category: "Study Group Dinner" },
  { day: 25, dateStr: "Mar 25", actual: 100, budgetBenchmark: 50, category: "Utilities Share" },
  { day: 26, dateStr: "Mar 26", actual: 80, budgetBenchmark: 50, category: "Meal Plan Top-up" },
  { day: 27, dateStr: "Mar 27", actual: 60, budgetBenchmark: 50, category: "Snacks" },
  { day: 28, dateStr: "Mar 28", actual: 20, budgetBenchmark: 50, category: "Coffee" },
  { day: 29, dateStr: "Mar 29", actual: 180, budgetBenchmark: 50, category: "End-of-Month Provisions" },
  { day: 30, dateStr: "Mar 30", actual: 120, budgetBenchmark: 50, category: "Campus Event Ticket" },
  { day: 31, dateStr: "Mar 31", actual: 80, budgetBenchmark: 50, category: "Dining Wrap-up" },
];

// 6-Month Semester Term Baseline
const defaultMonthlyData: VelocityPoint[] = [
  { month: "Jan", actual: 165, budget: 280 },
  { month: "Feb", actual: 210, budget: 270, highlight: true },
  { month: "Mar", actual: 412, budget: 350, highlight: true },
  { month: "Apr", actual: 275, budget: 320, highlight: true },
  { month: "May", actual: 276, budget: 300, highlight: true },
  { month: "Jun", actual: 140, budget: 260 },
];

export function OverviewChart({ initialMonthlyData }: { initialMonthlyData?: VelocityPoint[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // View mode: "30D" (Daily Dotted Velocity) or "6M" (Semester Term Pacing)
  const [viewMode, setViewMode] = useState<"30D" | "6M">("30D");

  // Hovered index: Default to Day 14 (index 13) for 30D, or Month 2 (March, index 2) for 6M
  const [selectedIndex, setSelectedIndex] = useState<number>(13);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const dailyData = useMemo(() => generateDailyData(), []);
  const monthlyData = useMemo(() => initialMonthlyData || defaultMonthlyData, [initialMonthlyData]);

  // Handle View Mode switch
  const handleModeSwitch = (mode: "30D" | "6M") => {
    setViewMode(mode);
    setSelectedIndex(mode === "30D" ? 13 : 2); // Default to featured point
  };

  // GSAP Entrance & Stagger Animation on Mount & Mode Change
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Animate in all dot-matrix beads with playful spring stagger
      gsap.fromTo(
        ".bead-node",
        {
          scale: 0,
          opacity: 0,
          transformOrigin: "center center",
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.45,
          stagger: {
            each: viewMode === "30D" ? 0.003 : 0.012,
            from: "start",
          },
          ease: "back.out(1.6)",
        }
      );

      // Animate projection dashed guideline
      gsap.fromTo(
        ".projection-guide",
        { opacity: 0, strokeDashoffset: 400 },
        { opacity: 1, strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }
      );

      // Animate target floating value badges
      gsap.fromTo(
        ".floating-badge",
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }
      );

      // In 6M mode, animate the budget ceiling curve stroke
      if (viewMode === "6M") {
        gsap.fromTo(
          ".budget-ceiling-curve",
          { strokeDashoffset: 1000, strokeDasharray: 1000 },
          { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [viewMode]);

  // Micro-animation on hover over active column
  useEffect(() => {
    if (!containerRef.current) return;

    const activeBeads = containerRef.current.querySelectorAll(`.col-${selectedIndex} .bead-node`);
    if (activeBeads.length > 0) {
      gsap.fromTo(
        activeBeads,
        { scale: 0.95 },
        {
          scale: 1.15,
          duration: 0.22,
          stagger: 0.012,
          ease: "back.out(2)",
          transformOrigin: "center center",
        }
      );
    }
  }, [selectedIndex]);

  // SVG Geometry Dimensions
  const svgWidth = 840;
  const svgHeight = 290;
  const marginLeft = 65;
  const marginRight = 25;
  const marginTop = 30;
  const baseY = 230; // Baseline ground where beads rest

  // ── 30-Day Dotted Mode Geometry ───────────────────────────
  const dailyColCount = dailyData.length;
  const dailyColWidth = (svgWidth - marginLeft - marginRight) / dailyColCount;
  const dailyUnitValue = 20; // Each bead represents $20
  const dailyBeadRadius = 5.2;
  const dailyBeadSpacing = 15; // Vertical distance between centers

  // ── 6-Month Dotted Mode Geometry ──────────────────────────
  const monthlyColCount = monthlyData.length;
  const monthlyColWidth = (svgWidth - marginLeft - marginRight) / monthlyColCount;
  const monthlyUnitValue = 25; // Each bead represents $25
  const monthlyBeadRadius = 7.5;
  const monthlyBeadSpacing = 12.8;

  // Selected Item Telemetry
  const currentDailyItem = dailyData[selectedIndex] || dailyData[13];
  const currentMonthlyItem = monthlyData[selectedIndex] || monthlyData[2];

  // Calculate Budget Ceiling Bezier Path for 6M mode
  const budgetCeilingPath = useMemo(() => {
    if (viewMode !== "6M") return "";
    const points = monthlyData.map((d, idx) => {
      const cx = marginLeft + idx * monthlyColWidth + monthlyColWidth / 2;
      const cy = baseY - (d.budget / 450) * 190;
      return { x: cx, y: cy };
    });

    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [viewMode, monthlyData, marginLeft, monthlyColWidth, baseY]);

  // Current active projection coordinates
  const activeCoordinates = useMemo(() => {
    if (viewMode === "30D") {
      const item = currentDailyItem;
      const dotsCount = Math.max(1, Math.round(item.actual / dailyUnitValue));
      const cx = marginLeft + selectedIndex * dailyColWidth + dailyColWidth / 2;
      const topY = baseY - (dotsCount - 1) * dailyBeadSpacing - dailyBeadRadius;
      return {
        cx,
        topY,
        amount: item.actual,
        label: item.dateStr,
        dotsCount,
        unitVal: dailyUnitValue,
        status: item.actual > 150 ? "Peak Outflow" : "Optimal Velocity",
        isOver: item.actual > item.budgetBenchmark * 3,
      };
    } else {
      const item = currentMonthlyItem;
      const dotsCount = Math.max(1, Math.round(item.actual / monthlyUnitValue));
      const cx = marginLeft + selectedIndex * monthlyColWidth + monthlyColWidth / 2;
      const topY = baseY - (dotsCount - 1) * monthlyBeadSpacing - monthlyBeadRadius;
      return {
        cx,
        topY,
        amount: item.actual,
        label: item.month,
        dotsCount,
        unitVal: monthlyUnitValue,
        status: item.actual > item.budget ? "Over Budget Cap" : "Safe Pacing",
        isOver: item.actual > item.budget,
      };
    }
  }, [
    viewMode,
    selectedIndex,
    currentDailyItem,
    currentMonthlyItem,
    marginLeft,
    dailyColWidth,
    monthlyColWidth,
    dailyUnitValue,
    monthlyUnitValue,
    dailyBeadSpacing,
    monthlyBeadSpacing,
    dailyBeadRadius,
    monthlyBeadRadius,
    baseY,
  ]);

  // Export SVG Snapshot as visual download
  const handleExportSVG = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `campus-velocity-${viewMode.toLowerCase()}-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  }, [viewMode]);

  return (
    <div ref={containerRef} className="w-full flex flex-col space-y-4">
      {/* ── Interactive View Switcher & Live Telemetry HUD Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
        {/* Left: View Mode Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#161B27] border border-[#E7E1D6] dark:border-[#222938] shadow-2xs">
          <button
            type="button"
            onClick={() => handleModeSwitch("30D")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "30D"
                ? "bg-[#FF722B] text-white shadow-sm"
                : "text-[#525866] dark:text-[#94A0B8] hover:text-[#141722] dark:hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>30-Day Daily Velocity</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("6M")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "6M"
                ? "bg-[#FF722B] text-white shadow-sm"
                : "text-[#525866] dark:text-[#94A0B8] hover:text-[#141722] dark:hover:text-white"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Semester Term (6-Mo)</span>
          </button>
        </div>

        {/* Right: Active Point Live Telemetry Badge + Export Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161B27] border border-[#E7E1D6] dark:border-[#222938] text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#FF722B] animate-pulse" />
            <span className="font-bold text-[#141722] dark:text-white font-mono">
              {activeCoordinates.label}:
            </span>
            <span className="font-black font-mono text-[#FF722B] dark:text-[#FFA64D]">
              ${activeCoordinates.amount.toFixed(0)}
            </span>
            <span className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-mono hidden md:inline">
              ({activeCoordinates.dotsCount} beads @ ${activeCoordinates.unitVal}/ea)
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeCoordinates.isOver
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {activeCoordinates.status}
            </span>
          </div>

          {/* Quick Snapshot Export Button */}
          <button
            type="button"
            onClick={handleExportSVG}
            title="Export Vector Chart Snapshot"
            className="p-2 rounded-xl bg-white hover:bg-[#F3EFE7] dark:bg-[#161B27] dark:hover:bg-[#1E2536] border border-[#E7E1D6] dark:border-[#222938] text-[#525866] dark:text-[#94A0B8] transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Main Dotted Matrix SVG Canvas ──────────────────────── */}
      <div className="relative w-full h-[280px] sm:h-[300px] overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Active Bead Gradient: Fiery Campus Flame */}
            <radialGradient id="activeBeadGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFA64D" />
              <stop offset="60%" stopColor="#FF722B" />
              <stop offset="100%" stopColor="#E05615" />
            </radialGradient>

            {/* Over-Budget Alert Bead Gradient */}
            <radialGradient id="alertBeadGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="70%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#9F1239" />
            </radialGradient>

            {/* Budget Ceiling Area Glow */}
            <linearGradient id="budgetAreaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? "#4F6E9C" : "#2C436B"} stopOpacity={0.2} />
              <stop offset="100%" stopColor={isDark ? "#4F6E9C" : "#2C436B"} stopOpacity={0.0} />
            </linearGradient>

            {/* Floating Pill Drop Shadow */}
            <filter id="pillGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#FF722B" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* ── Horizontal Gridlines & Y-Axis Reference Ticks ───── */}
          {viewMode === "30D" ? (
            [300, 200, 100, 0].map((val) => {
              const y = baseY - (val / 300) * 190;
              return (
                <g key={`ytick-${val}`}>
                  <line
                    x1={marginLeft}
                    y1={y}
                    x2={svgWidth - marginRight}
                    y2={y}
                    stroke={isDark ? "#222938" : "#EFEAE1"}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity={0.8}
                  />
                  <text
                    x={marginLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    fill={isDark ? "#768297" : "#8F95A3"}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="500"
                  >
                    ${val}
                  </text>
                </g>
              );
            })
          ) : (
            [450, 300, 150, 0].map((val) => {
              const y = baseY - (val / 450) * 190;
              return (
                <g key={`ytick-6m-${val}`}>
                  <line
                    x1={marginLeft}
                    y1={y}
                    x2={svgWidth - marginRight}
                    y2={y}
                    stroke={isDark ? "#222938" : "#EFEAE1"}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity={0.8}
                  />
                  <text
                    x={marginLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    fill={isDark ? "#768297" : "#8F95A3"}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="500"
                  >
                    ${val}
                  </text>
                </g>
              );
            })
          )}

          {/* ── 6-Month Mode Budget Ceiling Curve ───────────────── */}
          {viewMode === "6M" && budgetCeilingPath && (
            <g>
              {/* Soft area fill under budget curve */}
              <path
                d={`${budgetCeilingPath} L ${
                  marginLeft + (monthlyColCount - 1) * monthlyColWidth + monthlyColWidth / 2
                } ${baseY} L ${marginLeft + monthlyColWidth / 2} ${baseY} Z`}
                fill="url(#budgetAreaGlow)"
              />
              {/* Smooth curved ceiling line */}
              <path
                d={budgetCeilingPath}
                fill="none"
                stroke={isDark ? "#6E93D1" : "#2C436B"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="budget-ceiling-curve"
              />
            </g>
          )}

          {/* ── Interactive Horizontal Projection Guideline ─────── */}
          <line
            x1={marginLeft}
            y1={activeCoordinates.topY}
            x2={activeCoordinates.cx}
            y2={activeCoordinates.topY}
            stroke="#FF722B"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            className="projection-guide transition-all duration-150"
          />

          {/* Projection Anchor Nodes */}
          <circle
            cx={marginLeft}
            y={activeCoordinates.topY}
            r="3"
            fill="#FF722B"
            className="transition-all duration-150"
          />
          <circle
            cx={activeCoordinates.cx}
            cy={activeCoordinates.topY}
            r="3"
            fill="#FFFFFF"
            className="transition-all duration-150"
          />

          {/* ── Dotted Matrix Columns (30-Day View) ─────────────── */}
          {viewMode === "30D" &&
            dailyData.map((item, colIdx) => {
              const cx = marginLeft + colIdx * dailyColWidth + dailyColWidth / 2;
              const dotsCount = Math.max(1, Math.round(item.actual / dailyUnitValue));
              const isSelected = selectedIndex === colIdx;

              // Render vertical stack of circular beads for this day
              const dots = Array.from({ length: dotsCount }).map((_, dotIdx) => {
                const cy = baseY - dotIdx * dailyBeadSpacing - dailyBeadRadius;
                return (
                  <circle
                    key={`daily-dot-${colIdx}-${dotIdx}`}
                    cx={cx}
                    cy={cy}
                    r={dailyBeadRadius}
                    fill={
                      isSelected
                        ? "url(#activeBeadGrad)"
                        : isDark
                        ? "rgba(204, 251, 241, 0.2)"
                        : "#B2E7DB"
                    }
                    stroke={
                      isSelected
                        ? "#FFFFFF"
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "#A2DDD0"
                    }
                    strokeWidth={isSelected ? 1.2 : 0.8}
                    className="bead-node transition-colors duration-200"
                  />
                );
              });

              return (
                <g
                  key={`daily-col-${colIdx}`}
                  className={`col-${colIdx} cursor-pointer group`}
                  onClick={() => setSelectedIndex(colIdx)}
                  onMouseEnter={() => setSelectedIndex(colIdx)}
                >
                  {/* Invisible broad hitbox for effortless mouse tracking */}
                  <rect
                    x={cx - dailyColWidth / 2}
                    y={marginTop}
                    width={dailyColWidth}
                    height={baseY - marginTop + 40}
                    fill="transparent"
                  />

                  {/* Beacon pulse circle for active top bead */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={baseY - (dotsCount - 1) * dailyBeadSpacing - dailyBeadRadius}
                      r={dailyBeadRadius + 4}
                      fill="none"
                      stroke="#FF722B"
                      strokeWidth="1.5"
                      className="animate-ping"
                      opacity={0.7}
                    />
                  )}

                  {/* Render the vertical bead stack */}
                  {dots}

                  {/* Regular milestone X-Axis labels (Mar 1, Mar 5, Mar 10, etc.) */}
                  {!isSelected && (item.day === 1 || item.day % 5 === 0 || item.day === 31) && (
                    <text
                      x={cx}
                      y={baseY + 22}
                      textAnchor="middle"
                      fill={isDark ? "#768297" : "#8F95A3"}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {item.dateStr}
                    </text>
                  )}
                </g>
              );
            })}

          {/* ── Dotted Matrix Columns (6-Month View) ─────────────── */}
          {viewMode === "6M" &&
            monthlyData.map((item, colIdx) => {
              const cx = marginLeft + colIdx * monthlyColWidth + monthlyColWidth / 2;
              const dotsCount = Math.max(1, Math.round(item.actual / monthlyUnitValue));
              const isSelected = selectedIndex === colIdx;
              const budgetY = baseY - (item.budget / 450) * 190;

              // Render vertical stack of circular beads for this month
              const dots = Array.from({ length: dotsCount }).map((_, dotIdx) => {
                const cy = baseY - dotIdx * monthlyBeadSpacing - monthlyBeadRadius;
                const isOverBudget = cy < budgetY;

                return (
                  <circle
                    key={`monthly-dot-${colIdx}-${dotIdx}`}
                    cx={cx}
                    cy={cy}
                    r={monthlyBeadRadius}
                    fill={
                      isSelected
                        ? isOverBudget
                          ? "url(#alertBeadGrad)"
                          : "url(#activeBeadGrad)"
                        : isOverBudget
                        ? isDark
                          ? "rgba(225, 29, 72, 0.45)"
                          : "rgba(225, 29, 72, 0.35)"
                        : isDark
                        ? "rgba(204, 251, 241, 0.22)"
                        : "#B2E7DB"
                    }
                    stroke={
                      isSelected
                        ? "#FFFFFF"
                        : isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "#A2DDD0"
                    }
                    strokeWidth={isSelected ? 1.5 : 1}
                    className="bead-node transition-colors duration-200"
                  />
                );
              });

              return (
                <g
                  key={`monthly-col-${colIdx}`}
                  className={`col-${colIdx} cursor-pointer group`}
                  onClick={() => setSelectedIndex(colIdx)}
                  onMouseEnter={() => setSelectedIndex(colIdx)}
                >
                  {/* Invisible broad hitbox */}
                  <rect
                    x={cx - monthlyColWidth / 2}
                    y={marginTop}
                    width={monthlyColWidth}
                    height={baseY - marginTop + 40}
                    fill="transparent"
                  />

                  {/* Beacon pulse for active top bead */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={baseY - (dotsCount - 1) * monthlyBeadSpacing - monthlyBeadRadius}
                      r={monthlyBeadRadius + 5}
                      fill="none"
                      stroke={item.actual > item.budget ? "#E11D48" : "#FF722B"}
                      strokeWidth="1.8"
                      className="animate-ping"
                      opacity={0.7}
                    />
                  )}

                  {/* Render the vertical bead stack */}
                  {dots}

                  {/* Regular Month Label */}
                  {!isSelected && (
                    <text
                      x={cx}
                      y={baseY + 24}
                      textAnchor="middle"
                      fill={isDark ? "#768297" : "#8F95A3"}
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {item.month}
                    </text>
                  )}
                </g>
              );
            })}

          {/* ── Floating Y-Axis Value Pill Badge ────────────────── */}
          <g
            className="floating-badge transition-all duration-150"
            transform={`translate(8, ${activeCoordinates.topY - 12})`}
            filter="url(#pillGlow)"
          >
            <rect
              width="48"
              height="24"
              rx="7"
              fill={activeCoordinates.isOver ? "#E11D48" : "#FF722B"}
            />
            <text
              x="24"
              y="16"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              ${activeCoordinates.amount.toFixed(0)}
            </text>
          </g>

          {/* ── Floating X-Axis Active Date Pill Badge ──────────── */}
          <g
            className="floating-badge transition-all duration-150"
            transform={`translate(${activeCoordinates.cx - 28}, ${baseY + 12})`}
            filter="url(#pillGlow)"
          >
            <rect
              width="56"
              height="24"
              rx="7"
              fill={activeCoordinates.isOver ? "#E11D48" : "#FF722B"}
            />
            <text
              x="28"
              y="16"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {activeCoordinates.label}
            </text>
          </g>
        </svg>
      </div>

      {/* ── Interactive Legend & Explanatory Micro-Pills ────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F3EFE7] dark:border-[#222938] text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[#6B7280] dark:text-[#8B96AA]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B2E7DB] border border-[#A2DDD0]" />
            <span>Idle Allowance Beads</span>
          </span>

          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FFA64D] to-[#FF722B] shadow-2xs" />
            <span>Active Spend Bead (${viewMode === "30D" ? "20" : "25"}/bead)</span>
          </span>

          {viewMode === "6M" && (
            <>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                <span>Over-Cap Threshold Beads</span>
              </span>

              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-4 h-0.5 rounded-full bg-[#2C436B] dark:bg-[#6E93D1]" />
                <span>Budget Baseline Ceiling</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#767D8C] dark:text-[#8B96AA]">
          <Sparkles className="h-3 w-3 text-[#FF722B]" />
          <span>Interactive GSAP physics canvas, hover or tap to inspect</span>
        </div>
      </div>
    </div>
  );
}

export default OverviewChart;
