"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, DollarSign, Repeat, AlertCircle, Loader2, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { CategoryPicker, CategoryItem } from "@/components/categories/category-picker";

export interface TransactionItem {
  id: string;
  amount: number | string;
  type: "EXPENSE" | "INCOME";
  categoryId: string;
  category?: CategoryItem;
  description: string;
  date: string | Date;
  paymentMethod: string;
  merchant?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  isRecurring: boolean;
  recurringInterval?: string | null;
  recurringEndDate?: string | Date | null;
  recurringGroupId?: string | null;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: TransactionItem) => void;
  transactionToEdit?: TransactionItem | null;
  initialType?: "EXPENSE" | "INCOME";
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  initialType = "EXPENSE",
}: TransactionModalProps) {
  const isEditing = Boolean(transactionToEdit);
  const isRecurringSeries = Boolean(transactionToEdit?.recurringGroupId);

  const [type, setType] = useState<"EXPENSE" | "INCOME">(initialType);
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [merchant, setMerchant] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Recurrence
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringInterval, setRecurringInterval] = useState<string>("MONTHLY");
  const [recurringEndDate, setRecurringEndDate] = useState<string>("");
  const [recurringScope, setRecurringScope] = useState<"THIS_ONLY" | "THIS_AND_FUTURE">("THIS_ONLY");

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI Categorization states (debounced server-only queries)
  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [isAiCategorizing, setIsAiCategorizing] = useState<boolean>(false);
  const [isAcceptedAi, setIsAcceptedAi] = useState<boolean>(false);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Anomaly & Duplicate Detection Advisory State
  const [anomalyWarning, setAnomalyWarning] = useState<{
    isUnusuallyLarge: boolean;
    isDuplicate: boolean;
    details?: {
      categoryAverage?: number;
      multiple?: number;
      duplicateTransaction?: any;
    };
  } | null>(null);
  const [isDismissedAnomaly, setIsDismissedAnomaly] = useState<boolean>(false);

  const handleDescriptionChange = (newVal: string) => {
    setDescription(newVal);
    if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newVal.trim().length >= 3) {
      setIsAiCategorizing(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/ai/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: newVal.trim(), type }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.suggestion) {
              setAiSuggestion(json.suggestion);
              setAiSuggestedCategory(json.suggestion.categoryName);
            } else {
              setAiSuggestion(null);
            }
          }
        } catch {
          // Graceful silent fallback
          setAiSuggestion(null);
        } finally {
          setIsAiCategorizing(false);
        }
      }, 500);
    } else {
      setAiSuggestion(null);
      setIsAiCategorizing(false);
    }
  };

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.categoryId);
      setDescription(transactionToEdit.description || "");
      setDate(
        typeof transactionToEdit.date === "string"
          ? transactionToEdit.date.split("T")[0]
          : new Date(transactionToEdit.date).toISOString().split("T")[0]
      );
      setPaymentMethod(transactionToEdit.paymentMethod || "CASH");
      setMerchant(transactionToEdit.merchant || "");
      setNotes(transactionToEdit.notes || "");
      setIsRecurring(Boolean(transactionToEdit.isRecurring));
      setRecurringInterval(transactionToEdit.recurringInterval || "MONTHLY");
      setRecurringEndDate(
        transactionToEdit.recurringEndDate
          ? typeof transactionToEdit.recurringEndDate === "string"
            ? transactionToEdit.recurringEndDate.split("T")[0]
            : new Date(transactionToEdit.recurringEndDate).toISOString().split("T")[0]
          : ""
      );
      setRecurringScope("THIS_ONLY");
      setAiSuggestion(null);
      setIsAcceptedAi(Boolean((transactionToEdit as any)?.isAiCategorized));
      setAiSuggestedCategory((transactionToEdit as any)?.aiSuggestedCategory || null);
    } else {
      setType(initialType);
      setAmount("");
      setCategoryId("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("CASH");
      setMerchant("");
      setNotes("");
      setIsRecurring(false);
      setRecurringInterval("MONTHLY");
      setRecurringEndDate("");
      setRecurringScope("THIS_ONLY");
      setAiSuggestion(null);
      setIsAcceptedAi(false);
      setAiSuggestedCategory(null);
    }
    setErrors({});
    setAnomalyWarning(null);
    setIsDismissedAnomaly(false);
  }, [transactionToEdit, initialType, isOpen]);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Debounced Anomaly & Duplicate Evaluation
  useEffect(() => {
    setIsDismissedAnomaly(false);
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0 || !categoryId) {
      setAnomalyWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/transactions/check-anomaly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numAmount,
            categoryId,
            type,
            excludeId: transactionToEdit?.id,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.isUnusuallyLarge || json.isDuplicate) {
            setAnomalyWarning(json);
          } else {
            setAnomalyWarning(null);
          }
        }
      } catch {
        setAnomalyWarning(null);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [amount, categoryId, type, transactionToEdit?.id]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side validations
    const fieldErrors: Record<string, string> = {};

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      fieldErrors.amount = "Please enter a valid amount greater than 0";
    } else {
      const parts = amount.split(".");
      if (parts.length > 1 && parts[1].length > 2) {
        fieldErrors.amount = "Amount can have at most 2 decimal places";
      }
    }

    if (!categoryId) {
      fieldErrors.categoryId = "Please select a category";
    }

    if (!date) {
      fieldErrors.date = "Please enter a date";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        amount: numericAmount,
        type,
        categoryId,
        description: description.trim(),
        date: new Date(date).toISOString(),
        paymentMethod,
        merchant: merchant.trim() || undefined,
        notes: notes.trim() || undefined,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate).toISOString() : undefined,
        isAiCategorized: isAcceptedAi,
        aiSuggestedCategory: aiSuggestedCategory,
      };

      if (isEditing && isRecurringSeries) {
        payload.recurringScope = recurringScope;
      }

      const endpoint = isEditing && transactionToEdit
        ? `/api/transactions/${transactionToEdit.id}`
        : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ _form: data.error || "Failed to save transaction" });
        }
        return;
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setErrors({ _form: err.message || "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? "Edit Transaction" : "New Transaction"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditing
                ? "Update student transaction record"
                : "Log income or expense entry with category classification"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errors._form && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors._form}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Entry type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType("EXPENSE");
                  setCategoryId(""); // Clear category if switching type
                }}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  type === "EXPENSE"
                    ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setCategoryId(""); // Clear category if switching type
                }}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  type === "INCOME"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Income</span>
              </button>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="transaction-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.amount
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="transaction-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.date
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Unified CategoryPicker */}
          <div className="space-y-1.5">
            <CategoryPicker
              id="transaction-category-picker"
              label="Category"
              typeFilter={type}
              value={categoryId}
              onChange={(catId) => {
                setCategoryId(catId);
                if (aiSuggestion && catId !== aiSuggestion.categoryId) {
                  setIsAcceptedAi(false);
                }
              }}
              error={errors.categoryId}
              required
            />

            {/* AI Suggestion Inline Chip (Near Category Field) */}
            {aiSuggestion && categoryId !== aiSuggestion.categoryId && (
              <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs animate-in fade-in duration-200 shadow-2xs">
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-purple-900 dark:text-purple-200 truncate">
                    AI suggests: <strong className="font-bold">{aiSuggestion.categoryName}</strong> | Accept?
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryId(aiSuggestion.categoryId);
                      setIsAcceptedAi(true);
                      setAiSuggestion(null);
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Dismiss suggestion"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {isAcceptedAi && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 pl-1">
                <Sparkles className="h-3 w-3" />
                <span>AI Suggested Classification Accepted</span>
              </div>
            )}

            {/* Anomaly & Duplicate Detection Non-Blocking Advisory Banner */}
            {anomalyWarning && !isDismissedAnomaly && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 animate-in fade-in duration-200 shadow-2xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Transaction Advisory Notice</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDismissedAnomaly(true)}
                    className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                {anomalyWarning.isDuplicate && (
                  <p className="leading-relaxed">
                    <strong>Potential Duplicate:</strong> A matching transaction (${Number(amount).toFixed(2)}) was recorded in this category within the past 24 hours.
                  </p>
                )}
                {anomalyWarning.isUnusuallyLarge && (
                  <p className="leading-relaxed">
                    <strong>Unusually Large Expense:</strong> This amount (${Number(amount).toFixed(2)}) is {anomalyWarning.details?.multiple}x higher than your historical average (${anomalyWarning.details?.categoryAverage?.toFixed(2)}) for this category.
                  </p>
                )}
                <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 italic pt-0.5">
                  This advisory is non-blocking — you can still proceed and save if this record is accurate.
                </p>
              </div>
            )}
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Description / item
                </label>
                {isAiCategorizing && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 font-semibold animate-pulse">
                    <Sparkles className="h-3 w-3" />
                    <span>AI analyzing...</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g., Chemistry Textbook, Lunch"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                maxLength={255}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Merchant / payer
              </label>
              <input
                type="text"
                placeholder="e.g., Campus Bookstore, Starbucks"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="CASH">Cash</option>
              <option value="CAMPUS_CARD">Campus Meal / ID Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DIGITAL_WALLET">Digital Wallet (Apple/Google Pay)</option>
              <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
            </select>
          </div>

          {/* Recurring Transaction Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Recurring Transaction
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Interval
                  </label>
                  <select
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="MONTHLY">Monthly (Standard)</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="SEMESTER">Once a Semester</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                    placeholder="Until cancelled"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Leave blank for &quot;Until cancelled&quot;
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recurring Scope Selection (Only for editing recurring transactions) */}
          {isEditing && isRecurringSeries && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                Recurring Series Scope:
              </span>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="recurringScope"
                    checked={recurringScope === "THIS_ONLY"}
                    onChange={() => setRecurringScope("THIS_ONLY")}
                    className="text-indigo-600"
                  />
                  <span>Apply changes to <strong>this occurrence only</strong></span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="recurringScope"
                    checked={recurringScope === "THIS_AND_FUTURE"}
                    onChange={() => setRecurringScope("THIS_AND_FUTURE")}
                    className="text-indigo-600"
                  />
                  <span>Apply to <strong>this and all future occurrences</strong></span>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Personal notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? "Update Transaction" : "Save Transaction"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
