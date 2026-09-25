"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Tags,
  Edit2,
  Trash2,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  FolderTree,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface DefaultCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isDefault: boolean;
  transactionCount: number;
  budgetCount: number;
  isInUse: boolean;
}

const PRESET_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#059669", // Dark Green
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6B7280", // Slate
];

const PRESET_ICONS = [
  "Utensils",
  "Bus",
  "Home",
  "BookOpen",
  "CreditCard",
  "Music",
  "Tag",
  "Wallet",
  "Briefcase",
  "GraduationCap",
  "Gift",
  "PlusCircle",
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<DefaultCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add / Edit Modal state
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [selectedCat, setSelectedCat] = useState<DefaultCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formColor, setFormColor] = useState("#6366F1");
  const [formIcon, setFormIcon] = useState("Tag");
  const [submitting, setSubmitting] = useState(false);

  // Delete & Reassign Modal state
  const [deleteModalCat, setDeleteModalCat] = useState<DefaultCategory | null>(null);
  const [reassignToId, setReassignToId] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data || []);
      } else {
        throw new Error(json.error || "Failed to load categories");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load default categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Add Modal
  const openAddModal = () => {
    setSelectedCat(null);
    setFormName("");
    setFormType("EXPENSE");
    setFormColor("#6366F1");
    setFormIcon("Tag");
    setModalMode("ADD");
  };

  // Open Edit Modal
  const openEditModal = (cat: DefaultCategory) => {
    setSelectedCat(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setModalMode("EDIT");
  };

  // Open Delete Modal
  const openDeleteModal = (cat: DefaultCategory) => {
    setDeleteModalCat(cat);
    // Default reassignment candidate of the same type
    const candidate = categories.find((c) => c.id !== cat.id && c.type === cat.type);
    setReassignToId(candidate?.id || "");
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (modalMode === "ADD") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            type: formType,
            icon: formIcon,
            color: formColor,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to add category");

        setSuccessMsg(`Default category "${formName}" created successfully!`);
      } else if (modalMode === "EDIT" && selectedCat) {
        const res = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedCat.id,
            name: formName.trim(),
            icon: formIcon,
            color: formColor,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to update category");

        setSuccessMsg(`Category updated. Changes propagated across all ledgers.`);
      }

      setModalMode(null);
      await fetchCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Delete & Reassign
  const handleExecuteDelete = async () => {
    if (!deleteModalCat) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteModalCat.id,
          reassignToId: deleteModalCat.isInUse ? reassignToId : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete category");
      }

      setSuccessMsg(json.message || "Category removed successfully.");
      setDeleteModalCat(null);
      await fetchCategories();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Delete operation failed");
    } finally {
      setDeleting(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              System Default Categories
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              Live Seed Taxonomy
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global standard categories available to all student accounts with deletion guards & propagation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Default Category</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Section: Expense Categories ──────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Default Expense Categories ({expenseCategories.length})
          </h2>
          <span className="text-xs text-slate-500">Auto-assigned to student expense ledgers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4.5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: c.color }}
                    />
                    <h3 className="font-bold text-white text-sm">{c.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/50">
                    EXPENSE
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Logged Transactions:</span>
                    <span className="font-semibold text-slate-200">
                      {c.transactionCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Budgets:</span>
                    <span className="font-semibold text-slate-200">
                      {c.budgetCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Icon: <code className="text-amber-400">{c.icon}</code>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section: Income Categories ───────────────── */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Default Income Categories ({incomeCategories.length})
          </h2>
          <span className="text-xs text-slate-500">Auto-assigned to student income ledgers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4.5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: c.color }}
                    />
                    <h3 className="font-bold text-white text-sm">{c.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                    INCOME
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Logged Deposits:</span>
                    <span className="font-semibold text-slate-200">
                      {c.transactionCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Icon: <code className="text-amber-400">{c.icon}</code>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {modalMode === "ADD" ? "Add Default Category" : `Edit Category: ${selectedCat?.name}`}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Lab Supplies"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {modalMode === "ADD" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType("EXPENSE")}
                      className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                        formType === "EXPENSE"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("INCOME")}
                      className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                        formType === "INCOME"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>
              )}

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Icon Identifier
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormIcon(iconName)}
                      className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center transition-colors truncate ${
                        formIcon === iconName
                          ? "bg-amber-500/20 text-amber-300 border-amber-500"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {iconName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving..." : modalMode === "ADD" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete with Confirm & Reassign Modal ───────── */}
      {deleteModalCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-white">
                Delete Category: {deleteModalCat.name}
              </h3>
            </div>

            {deleteModalCat.isInUse ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 leading-relaxed">
                  <p className="font-bold mb-1">Active Ledger Guard Warning</p>
                  This default category is actively referenced by{" "}
                  <strong>{deleteModalCat.transactionCount} transactions</strong> and{" "}
                  <strong>{deleteModalCat.budgetCount} budgets</strong> across student accounts.
                  To preserve historical financial integrity, you must choose a replacement category to safely reassign those records.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Replacement Category ({deleteModalCat.type})
                  </label>
                  <select
                    value={reassignToId}
                    onChange={(e) => setReassignToId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories
                      .filter(
                        (c) =>
                          c.id !== deleteModalCat.id && c.type === deleteModalCat.type
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                This category has 0 associated transactions or budgets and can be safely deleted immediately.
              </p>
            )}

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalCat(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting || (deleteModalCat.isInUse && !reassignToId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20 disabled:opacity-50 transition-colors"
              >
                {deleting
                  ? "Processing..."
                  : deleteModalCat.isInUse
                  ? "Reassign & Delete"
                  : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
