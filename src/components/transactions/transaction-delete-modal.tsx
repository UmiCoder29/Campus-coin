"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, X, Loader2, Repeat } from "lucide-react";
import { TransactionItem } from "@/components/transactions/transaction-modal";

interface TransactionDeleteModalProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionDeleteModal({
  isOpen,
  transaction,
  onClose,
  onSuccess,
}: TransactionDeleteModalProps) {
  const [scope, setScope] = useState<"THIS_ONLY" | "THIS_AND_FUTURE">("THIS_ONLY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const isRecurring = Boolean(transaction.recurringGroupId);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const url = `/api/transactions/${transaction?.id}?scope=${scope}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete transaction");
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
            Delete Transaction?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            &quot;{transaction.description}&quot; &bull; ${Number(transaction.amount).toFixed(2)}
          </p>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong>SRS Audit Trail:</strong> This entry will be soft-deleted and removed from your active balance and reports while preserving the historical audit log.
          </p>

          {isRecurring && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Repeat className="h-3.5 w-3.5 text-amber-600" />
                <span>Recurring Transaction Series</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Choose the deletion scope for this recurring series:
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={scope === "THIS_ONLY"}
                    onChange={() => setScope("THIS_ONLY")}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Delete <strong>this occurrence only</strong></span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={scope === "THIS_AND_FUTURE"}
                    onChange={() => setScope("THIS_AND_FUTURE")}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Delete <strong>this and all future occurrences</strong></span>
                </label>
              </div>
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
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
