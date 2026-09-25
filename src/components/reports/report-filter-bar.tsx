"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  Layers,
  RotateCcw,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface ReportFilterBarProps {
  currentMonth: string; // "YYYY-MM"
  monthName: string;
  year: number;
  availableCategories: CategoryOption[];
  selectedCategoryIds: string[];
  selectedType: "ALL" | "EXPENSE" | "INCOME";
  onFilterChange: (filters: {
    month: string;
    categoryIds: string[];
    type: "ALL" | "EXPENSE" | "INCOME";
  }) => void;
}

export function ReportFilterBar({
  currentMonth,
  monthName,
  year,
  availableCategories,
  selectedCategoryIds,
  selectedType,
  onFilterChange,
}: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate previous and next months
  const [yStr, mStr] = currentMonth.split("-");
  const curYear = parseInt(yStr, 10);
  const curMonthIndex = parseInt(mStr, 10) - 1;

  const prevDate = new Date(Date.UTC(curYear, curMonthIndex - 1, 1));
  const prevMonthStr = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;

  const nextDate = new Date(Date.UTC(curYear, curMonthIndex + 1, 1));
  const nextMonthStr = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;

  // Check if current month is today's real-time month
  const now = new Date();
  const todayMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const isViewingCurrentMonth = currentMonth === todayMonthStr;

  // Update query params in URL so state survives refresh and is shareable
  const updateUrlParams = (newMonth: string, newCatIds: string[], newType: "ALL" | "EXPENSE" | "INCOME") => {
    const params = new URLSearchParams(searchParams.toString());
    if (newMonth) params.set("month", newMonth);
    else params.delete("month");

    if (newCatIds.length > 0) params.set("categories", newCatIds.join(","));
    else params.delete("categories");

    if (newType !== "ALL") params.set("type", newType);
    else params.delete("type");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    onFilterChange({ month: newMonth, categoryIds: newCatIds, type: newType });
  };

  const handleMonthChange = (newMonth: string) => {
    updateUrlParams(newMonth, selectedCategoryIds, selectedType);
  };

  const handleTypeChange = (newType: "ALL" | "EXPENSE" | "INCOME") => {
    updateUrlParams(currentMonth, selectedCategoryIds, newType);
  };

  const handleToggleCategory = (catId: string) => {
    let nextCatIds: string[];
    if (selectedCategoryIds.includes(catId)) {
      nextCatIds = selectedCategoryIds.filter((id) => id !== catId);
    } else {
      nextCatIds = [...selectedCategoryIds, catId];
    }
    updateUrlParams(currentMonth, nextCatIds, selectedType);
  };

  const handleClearCategories = () => {
    updateUrlParams(currentMonth, [], selectedType);
  };

  const handleResetAll = () => {
    updateUrlParams(todayMonthStr, [], "ALL");
  };

  const hasActiveFilters =
    !isViewingCurrentMonth || selectedCategoryIds.length > 0 || selectedType !== "ALL";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => handleMonthChange(prevMonthStr)}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 text-sm font-bold text-slate-900 dark:text-white min-w-[130px] justify-center">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <span>
                {monthName} {year}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleMonthChange(nextMonthStr)}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={() => handleMonthChange(todayMonthStr)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Filters Group: Categories, Type, Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Multi-Select Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedCategoryIds.length > 0
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-2xs"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>
                {selectedCategoryIds.length === 0
                  ? "All Categories"
                  : `${selectedCategoryIds.length} Categor${selectedCategoryIds.length === 1 ? "y" : "ies"}`}
              </span>
              {selectedCategoryIds.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {selectedCategoryIds.length}
                </span>
              )}
            </button>

            {/* Category Dropdown Menu */}
            {categoryDropdownOpen && (
              <div className="absolute right-0 sm:left-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-30 p-2 text-xs">
                <div className="flex items-center justify-between pb-2 mb-1.5 px-2 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <span>Filter by Category</span>
                  {selectedCategoryIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCategories}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline lowercase font-medium"
                    >
                      clear all
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <CategoryIcon name={cat.icon} className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Type Toggle: All / Expense / Income */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTypeChange("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Cashflow
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("EXPENSE")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === "EXPENSE"
                  ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("INCOME")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === "INCOME"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Income
            </button>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset all filters to current month default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
