"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, ArrowRight, X, Loader2 } from "lucide-react";
import { CategoryItem, CategoryPicker } from "@/components/categories/category-picker";

interface CategoryDeleteModalProps {
  isOpen: boolean;
  category: CategoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryDeleteModal({
  isOpen,
  category,
  onClose,
  onSuccess,
}: CategoryDeleteModalProps) {
  const [strategy, setStrategy] = useState<"default" | "custom">("default");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !category) return null;

  const txCount = category._count?.transactions || 0;
  const defaultFallbackName = category.type === "EXPENSE" ? "Miscellaneous" : "Other Income";

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const payload: any = {};
      if (txCount > 0) {
        if (strategy === "default") {
          payload.reassignToDefault = true;
        } else {
          if (!targetCategoryId) {
            setError("Please pick a target category to reassign transactions to.");
            setLoading(false);
            return;
          }
          if (targetCategoryId === category?.id) {
            setError("Target category must be different from the one being deleted.");
            setLoading(false);
            return;
          }
          payload.reassignToCategoryId = targetCategoryId;
        }
      }

      const res = await fetch(`/api/categories/${category?.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "Failed to delete category");
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Delete &quot;{category.name}&quot;?
          </h3>

          {txCount === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to delete this custom category? This action cannot be undone.
            </p>
          ) : (
            <div className="space-y-4 mt-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                This category is currently assigned to{" "}
                <span className="font-bold text-slate-900 dark:text-white">{txCount}</span>{" "}
                active transaction(s). To preserve your spending history and ledger accuracy, please choose how to reassign them:
              </p>

              {/* Reassignment Choice */}
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === "default"}
                    onChange={() => setStrategy("default")}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Move to System Default ({defaultFallbackName})
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Reassign all {txCount} transactions to &quot;{defaultFallbackName}&quot; automatically.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === "custom"}
                    onChange={() => setStrategy("custom")}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs flex-1">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Reassign to another category
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Pick any of your other {category.type.toLowerCase()} categories.
                    </span>
                  </div>
                </label>
              </div>

              {strategy === "custom" && (
                <div className="pt-2">
                  <CategoryPicker
                    label="Select Replacement Category"
                    typeFilter={category.type}
                    value={targetCategoryId}
                    onChange={(val) => setTargetCategoryId(val)}
                    placeholder="Choose category..."
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete Category</span>
          </button>
        </div>
      </div>
    </div>
  );
}
