"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Repeat,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
  ArrowUpDown,
  Sparkles,
  Upload,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CategoryPicker } from "@/components/categories/category-picker";
import { TransactionModal, TransactionItem } from "@/components/transactions/transaction-modal";
import { TransactionDeleteModal } from "@/components/transactions/transaction-delete-modal";
import { CsvImportModal } from "@/components/transactions/csv-import-modal";

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL query params for quick-add triggers
  const actionParam = searchParams.get("action");
  const typeParam = searchParams.get("type");

  // Transactions State
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0 });

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter Bar State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionItem | null>(null);
  const [initialType, setInitialType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  // Load categories for CSV Import mapping
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          setCategories(json.categories || []);
        }
      } catch (e) {
        console.error("Failed to load categories for CSV import:", e);
      }
    }
    loadCats();
  }, []);

  const handleOpenEdit = (tx: TransactionItem) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
    // Track transaction view to ActivityLog and update lastViewedAt
    fetch("/api/activity/view-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId: tx.id, description: tx.description }),
    }).catch(() => {});
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Open modal if URL query param action=add is detected
  useEffect(() => {
    if (actionParam === "add") {
      setEditingTransaction(null);
      setInitialType(typeParam === "income" ? "INCOME" : "EXPENSE");
      setIsModalOpen(true);
    }
  }, [actionParam, typeParam]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (selectedCategoryId && selectedCategoryId !== "ALL") params.set("categoryId", selectedCategoryId);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTransactions(json.data || []);
          if (json.pagination) setPagination(json.pagination);
          if (json.summary) setSummary(json.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, typeFilter, selectedCategoryId, debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      typeFilter !== "ALL" ||
      (selectedCategoryId && selectedCategoryId !== "ALL") ||
      fromDate ||
      toDate
  );

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("ALL");
    setSelectedCategoryId("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function handleExportCSV() {
    if (transactions.length === 0) return;
    const headers = ["Date", "Type", "Category", "Description", "Merchant", "Amount", "Payment Method", "Recurring"];
    const rows = transactions.map((t) => [
      typeof t.date === "string" ? t.date.split("T")[0] : new Date(t.date).toISOString().split("T")[0],
      t.type,
      t.category?.name || "Uncategorized",
      `"${(t.description || "").replace(/"/g, '""')}"`,
      `"${(t.merchant || "").replace(/"/g, '""')}"`,
      Number(t.amount).toFixed(2),
      t.paymentMethod,
      t.isRecurring ? "Yes" : "No",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campus_coin_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Transactions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log student income and expenses with real-time category attribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Download current transactions view as CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            id="btn-import-csv"
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Bulk import transactions from bank or card statement CSV"
          >
            <Upload className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            id="btn-new-transaction"
            onClick={() => {
              setEditingTransaction(null);
              setInitialType("EXPENSE");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* ── Filtered Summary Stats ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Filtered Income
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4" />
            <span>${summary.totalIncome.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Filtered Expenses
          </span>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
            <ArrowDownRight className="h-4 w-4" />
            <span>${summary.totalExpense.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Net Difference
          </span>
          <div
            className={`text-xl font-bold mt-1 ${
              summary.netBalance >= 0
                ? "text-slate-900 dark:text-white"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            ${summary.netBalance.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────── */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
            {(["ALL", "EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTypeFilter(t);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === t
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t === "ALL" ? "All" : t === "EXPENSE" ? "Expenses" : "Income"}
              </button>
            ))}
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors shrink-0 ${
              showAdvancedFilters || hasActiveFilters
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/40"
                : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters {hasActiveFilters && "•"}</span>
          </button>
        </div>

        {/* Collapsible Advanced Filters Bar */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
            {/* Category Filter */}
            <div>
              <CategoryPicker
                label="Category Filter"
                value={selectedCategoryId}
                onChange={(catId) => {
                  setSelectedCategoryId(catId);
                  setPage(1);
                }}
                typeFilter={typeFilter}
                allowAllOption
                allOptionLabel="All Categories"
              />
            </div>

            {/* Date Range: From */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Date Range: To */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}

        {/* Active Filter Pills & Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Showing filtered results ({pagination.totalCount} matches)
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Transactions List / Table ──────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Loading student transactions...
          </div>
        ) : transactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === "date") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("date");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Description / Merchant</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment</th>
                    <th
                      className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                      onClick={() => {
                        if (sortBy === "amount") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("amount");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Amount</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => {
                    const formattedDate = new Date(tx.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Date & Recurrence Tag */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formattedDate}</span>
                            {tx.isRecurring && (
                              <span
                                title="Recurring monthly series"
                                className="p-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                              >
                                <Repeat className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                          <div>
                            <span className="block truncate">{tx.description}</span>
                            {tx.merchant && tx.merchant !== tx.description && (
                              <span className="text-[11px] text-slate-400 truncate block">
                                {tx.merchant}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category Tag */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {tx.category ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: tx.category.color }}
                              />
                              <CategoryIcon
                                name={tx.category.icon}
                                className="h-3 w-3"
                              />
                              <span>{tx.category.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Uncategorized</span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap uppercase">
                          {tx.paymentMethod.replace("_", " ")}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-sm ${
                              tx.type === "INCOME"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {tx.type === "INCOME" ? (
                              <>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                +${Number(tx.amount).toFixed(2)}
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="h-3.5 w-3.5" />
                                -${Number(tx.amount).toFixed(2)}
                              </>
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              title="Edit transaction"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingTransaction(tx)}
                              title="Delete transaction"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>&bull;</span>
                        <span>{tx.paymentMethod.replace("_", " ")}</span>
                        {tx.isRecurring && (
                          <span className="p-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <Repeat className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`text-sm font-bold shrink-0 ${
                        tx.type === "INCOME"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {tx.category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <CategoryIcon name={tx.category.icon} className="h-3 w-3" />
                        <span>{tx.category.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Uncategorized</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingTransaction(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total entries)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Distinct Empty States */
          <div className="p-12 text-center">
            {hasActiveFilters ? (
              /* Empty state: No matching search/filter results */
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Filter className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No matching transactions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  No entries match your search query or selected filters. Try adjusting the date range or clearing filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            ) : (
              /* Empty state: First time user, no transactions yet */
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No transactions recorded yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Start tracking your student budget by adding your first income or expense entry!
                </p>
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setInitialType("EXPENSE");
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Transaction</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // If opened via URL query params, clear them
          if (actionParam) {
            router.replace("/transactions");
          }
        }}
        onSuccess={() => {
          fetchTransactions();
        }}
        transactionToEdit={editingTransaction}
        initialType={initialType}
      />

      {/* Transaction Delete Modal */}
      <TransactionDeleteModal
        isOpen={Boolean(deletingTransaction)}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onSuccess={() => {
          fetchTransactions();
        }}
      />

      {/* CSV Bulk Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
        }}
        categories={categories}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
          Loading student transactions...
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
