"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search, Tag, AlertCircle } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

export interface CategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string | null;
  _count?: {
    transactions?: number;
    budgets?: number;
  };
}

export interface CategoryPickerProps {
  value?: string;
  onChange: (categoryId: string, category?: CategoryItem) => void;
  typeFilter?: "INCOME" | "EXPENSE" | "ALL";
  categories?: CategoryItem[];
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  allowAllOption?: boolean;
  allOptionLabel?: string;
}

export function CategoryPicker({
  value,
  onChange,
  typeFilter = "ALL",
  categories: externalCategories,
  error,
  label = "Category",
  placeholder = "Select a category...",
  required = false,
  disabled = false,
  id = "category-picker",
  className = "",
  allowAllOption = false,
  allOptionLabel = "All Categories",
}: CategoryPickerProps) {
  const [internalCategories, setInternalCategories] = useState<CategoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch categories if not passed externally
  useEffect(() => {
    if (externalCategories) {
      setInternalCategories(externalCategories);
      return;
    }

    let isMounted = true;
    async function loadCategories() {
      setLoading(true);
      try {
        const url = typeFilter && typeFilter !== "ALL"
          ? `/api/categories?type=${typeFilter}`
          : "/api/categories";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setInternalCategories(data.data || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch categories in CategoryPicker:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [externalCategories, typeFilter]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter categories by type and search term
  const filteredCategories = internalCategories.filter((cat) => {
    const matchesType =
      typeFilter === "ALL" || !typeFilter || cat.type === typeFilter;
    const matchesSearch =
      cat.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Separate into Income and Expense, then Defaults first
  const expenseCategories = filteredCategories
    .filter((c) => c.type === "EXPENSE")
    .sort((a, b) => (a.isDefault === b.isDefault ? a.name.localeCompare(b.name) : a.isDefault ? -1 : 1));

  const incomeCategories = filteredCategories
    .filter((c) => c.type === "INCOME")
    .sort((a, b) => (a.isDefault === b.isDefault ? a.name.localeCompare(b.name) : a.isDefault ? -1 : 1));

  const selectedCategory = internalCategories.find((c) => c.id === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all ${
          error
            ? "border-red-500 bg-red-50/20 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-red-500"
            : isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {allowAllOption && (!value || value === "ALL") ? (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Tag className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                {allOptionLabel}
              </span>
            </div>
          ) : selectedCategory ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: selectedCategory.color }}
              >
                <CategoryIcon
                  name={selectedCategory.icon}
                  className="h-3.5 w-3.5 text-white"
                />
              </div>
              <span className="font-medium truncate text-sm">
                {selectedCategory.name}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  selectedCategory.isDefault
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {selectedCategory.isDefault ? "Default" : "Custom"}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-sm">
              {loading ? "Loading categories..." : placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search category name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Options Container */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1">
            {allowAllOption && (
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    onChange("ALL");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    value === "ALL" || !value
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                      <Tag className="h-3 w-3" />
                    </div>
                    <span>{allOptionLabel}</span>
                  </div>
                  {(value === "ALL" || !value) && (
                    <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              </div>
            )}

            {/* Expense Categories Group */}
            {expenseCategories.length > 0 && (
              <div className="p-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Expense Categories
                </div>
                <div className="space-y-0.5">
                  {expenseCategories.map((cat) => {
                    const isSelected = value === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onChange(cat.id, cat);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon
                              name={cat.icon}
                              className="h-3 w-3 text-white"
                            />
                          </div>
                          <span className="truncate">{cat.name}</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                              cat.isDefault
                                ? "text-slate-400"
                                : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
                            }`}
                          >
                            {cat.isDefault ? "Default" : "Custom"}
                          </span>
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

            {/* Income Categories Group */}
            {incomeCategories.length > 0 && (
              <div className="p-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Income Categories
                </div>
                <div className="space-y-0.5">
                  {incomeCategories.map((cat) => {
                    const isSelected = value === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onChange(cat.id, cat);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon
                              name={cat.icon}
                              className="h-3 w-3 text-white"
                            />
                          </div>
                          <span className="truncate">{cat.name}</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                              cat.isDefault
                                ? "text-slate-400"
                                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300"
                            }`}
                          >
                            {cat.isDefault ? "Default" : "Custom"}
                          </span>
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

            {filteredCategories.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching categories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
