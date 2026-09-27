"use client";

import React, { useState, useEffect } from "react";
import { X, DollarSign, Calendar, Loader2, AlertCircle } from "lucide-react";
import { CategoryPicker } from "@/components/categories/category-picker";
import { BudgetVsActualItem } from "@/lib/budget-service";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  month: string; // "YYYY-MM"
  budgetToEdit?: BudgetVsActualItem | null;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  month,
  budgetToEdit,
}: BudgetModalProps) {
  const isEditing = Boolean(budgetToEdit);

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [rolloverUnused, setRolloverUnused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setAmount(String(budgetToEdit.limit));
      setSelectedMonth(month);
      setRolloverUnused(false);
    } else {
      setCategoryId("");
      setAmount("");
      setSelectedMonth(month);
      setRolloverUnused(false);
    }
    setErrors({});
  }, [budgetToEdit, month, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrors({ amount: "Please enter a valid budget amount greater than 0" });
      return;
    }

    if (!categoryId) {
      setErrors({ categoryId: "Please choose an expense category" });
      return;
    }

    setLoading(true);
    try {
      const endpoint = isEditing && budgetToEdit ? `/api/budgets/${budgetToEdit.id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";

      const payload = isEditing
        ? { amount: numericAmount, rolloverUnused }
        : {
            categoryId,
            amount: numericAmount,
            month: selectedMonth,
            rolloverUnused,
          };

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
          setErrors({ _form: data.error || "Failed to save budget" });
        }
        return;
      }

      onSuccess();
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
        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? `Edit ${budgetToEdit?.categoryName} Budget` : "Set Category Budget"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set monthly spending limit for {selectedMonth}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errors._form && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors._form}</span>
            </div>
          )}

          {/* Category Picker (Only editable if creating) */}
          <div>
            {isEditing ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-semibold text-sm text-slate-900 dark:text-white">
                  {budgetToEdit?.categoryName}
                </div>
              </div>
            ) : (
              <CategoryPicker
                id="budget-category-picker"
                label="Expense Category"
                typeFilter="EXPENSE"
                value={categoryId}
                onChange={(catId) => setCategoryId(catId)}
                error={errors.categoryId}
                required
                placeholder="Choose expense category to budget..."
              />
            )}
          </div>

          {/* Budget Limit Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly limit amount ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 150"
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

          {/* Target Month */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Budget month
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                disabled={isEditing}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white disabled:opacity-75 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              <span>{isEditing ? "Update Limit" : "Set Budget"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
