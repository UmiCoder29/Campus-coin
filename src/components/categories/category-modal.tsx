"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, AlertCircle, Loader2 } from "lucide-react";
import { CategoryIcon, AVAILABLE_ICON_NAMES, PRESET_COLORS } from "@/components/ui/category-icon";
import { CategoryItem } from "@/components/categories/category-picker";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: CategoryItem) => void;
  categoryToEdit?: CategoryItem | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryModalProps) {
  const isEditing = Boolean(categoryToEdit);
  const hasTransactions = Boolean(
    categoryToEdit?._count?.transactions && categoryToEdit._count.transactions > 0
  );

  const [name, setName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState("#6366F1");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setIcon(categoryToEdit.icon || "Tag");
      setColor(categoryToEdit.color || "#6366F1");
    } else {
      setName("");
      setType("EXPENSE");
      setIcon("Tag");
      setColor("#6366F1");
    }
    setErrors({});
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrors({ name: "Category name is required" });
      return;
    }
    if (trimmedName.length > 50) {
      setErrors({ name: "Category name must be 50 characters or less" });
      return;
    }

    setLoading(true);
    try {
      const endpoint = isEditing && categoryToEdit
        ? `/api/categories/${categoryToEdit.id}`
        : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          type,
          icon,
          color,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ _form: data.error || "Failed to save category" });
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
        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEditing ? "Edit Category" : "New Custom Category"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditing
                ? "Update custom category attributes"
                : "Create a personalized spending or income category"}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errors._form && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors._form}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Category type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                disabled={hasTransactions}
                onClick={() => setType("EXPENSE")}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === "EXPENSE"
                    ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                } ${hasTransactions ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Expense
              </button>
              <button
                type="button"
                disabled={hasTransactions}
                onClick={() => setType("INCOME")}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === "INCOME"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                } ${hasTransactions ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Income
              </button>
            </div>
            {hasTransactions && (
              <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                <Lock className="h-3 w-3 shrink-0" />
                <span>
                  Type locked: {categoryToEdit?._count?.transactions} transaction(s) attached
                </span>
              </p>
            )}
            {errors.type && (
              <p className="text-xs text-red-500 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Category name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Campus Gym, Boba Tea, Hackathons"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500"
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Preview Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Badge Preview:
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: color }}
              >
                <CategoryIcon name={icon} className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {name || "Category Preview"}
              </span>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Theme color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Category icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              {AVAILABLE_ICON_NAMES.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                    icon === iconName
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                  }`}
                  title={iconName}
                >
                  <CategoryIcon name={iconName} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
              <span>{isEditing ? "Save Changes" : "Create Category"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
