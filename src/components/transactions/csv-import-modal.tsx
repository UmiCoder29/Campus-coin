"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  Trash2,
  Check,
  RefreshCw,
  HelpCircle,
  Download,
  Filter,
} from "lucide-react";
import {
  parseCsvText,
  detectColumnIndices,
  findBestCategoryMatch,
  ParsedCsvTransaction,
} from "@/lib/csv-parser";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{
    id: string;
    name: string;
    type: "INCOME" | "EXPENSE";
    icon: string;
    color: string;
  }>;
}

export function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedCsvTransaction[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [filterInvalidOnly, setFilterInvalidOnly] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setRows([]);
      setError(null);
      setSuccessInfo(null);
      setFilterInvalidOnly(false);
    }
  }, [isOpen]);

  const validateRow = (row: Partial<ParsedCsvTransaction>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!row.amount || isNaN(row.amount) || row.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }
    if (!row.description || row.description.trim().length === 0) {
      errors.push("Description is required");
    }
    if (!row.categoryId) {
      errors.push("Category must be selected");
    }
    if (!row.date || isNaN(new Date(row.date).getTime())) {
      errors.push("Valid date required (YYYY-MM-DD)");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const processCsvFile = async (selectedFile: File) => {
    try {
      setIsParsing(true);
      setError(null);
      setFile(selectedFile);

      const text = await selectedFile.text();
      const rawMatrix = parseCsvText(text);

      if (rawMatrix.length < 2) {
        throw new Error("CSV file must contain a header row and at least one data row.");
      }

      const headers = rawMatrix[0];
      const indices = detectColumnIndices(headers);

      const parsedRows: ParsedCsvTransaction[] = [];

      for (let i = 1; i < rawMatrix.length; i++) {
        const line = rawMatrix[i];
        if (!line || line.length === 0 || line.every((c) => c === "")) continue;

        const rawDate = indices.date !== undefined ? line[indices.date] : "";
        const rawAmount = indices.amount !== undefined ? line[indices.amount] : "";
        const rawDesc = indices.description !== undefined ? line[indices.description] : "";
        const rawCat = indices.category !== undefined ? line[indices.category] : "";
        const rawType = indices.type !== undefined ? line[indices.type] : "";
        const rawMerchant = indices.merchant !== undefined ? line[indices.merchant] : "";
        const rawMethod = indices.paymentMethod !== undefined ? line[indices.paymentMethod] : "";

        // Parse amount (strip currency symbols and commas)
        const numAmount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]+/g, "")) || 0);

        // Parse type (infer income if negative debit/credit or explicitly labelled)
        let txType: "EXPENSE" | "INCOME" = "EXPENSE";
        if (
          rawType.toLowerCase().includes("income") ||
          rawType.toLowerCase().includes("credit") ||
          rawAmount.startsWith("+")
        ) {
          txType = "INCOME";
        }

        // Format date to YYYY-MM-DD
        let formattedDate = new Date().toISOString().split("T")[0];
        if (rawDate) {
          const parsedD = new Date(rawDate);
          if (!isNaN(parsedD.getTime())) {
            formattedDate = parsedD.toISOString().split("T")[0];
          }
        }

        // Best guess category match
        const bestCat = findBestCategoryMatch(rawCat || rawDesc, categories);

        // Normalize payment method
        let method: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "CAMPUS_CARD" | "DIGITAL_WALLET" | "BANK_TRANSFER" = "CASH";
        const mNorm = rawMethod.toLowerCase();
        if (mNorm.includes("credit")) {
          method = "CREDIT_CARD";
        } else if (mNorm.includes("debit") || mNorm.includes("card")) {
          method = "DEBIT_CARD";
        } else if (mNorm.includes("campus") || mNorm.includes("meal")) {
          method = "CAMPUS_CARD";
        } else if (mNorm.includes("bank") || mNorm.includes("transfer") || mNorm.includes("ach")) {
          method = "BANK_TRANSFER";
        } else if (mNorm.includes("mobile") || mNorm.includes("venmo") || mNorm.includes("zelle") || mNorm.includes("apple") || mNorm.includes("wallet")) {
          method = "DIGITAL_WALLET";
        }

        const candidateRow: Partial<ParsedCsvTransaction> = {
          id: `csv-${i}-${Date.now()}`,
          date: formattedDate,
          amount: numAmount,
          type: txType,
          description: rawDesc || "Campus Expense",
          categoryId: bestCat?.id,
          categoryName: bestCat?.name,
          paymentMethod: method,
          merchant: rawMerchant || undefined,
          included: true,
        };

        const { isValid, errors } = validateRow(candidateRow);

        parsedRows.push({
          ...(candidateRow as ParsedCsvTransaction),
          isValid,
          errors,
          isAiCategorized: false,
        });
      }

      setRows(parsedRows);
    } catch (err: any) {
      console.error("CSV parse error:", err);
      setError(err?.message || "Failed to parse CSV file. Ensure it is standard comma-separated text.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv") {
        processCsvFile(droppedFile);
      } else {
        setError("Please upload a .csv file.");
      }
    }
  };

  const handleRowChange = (id: string, updates: Partial<ParsedCsvTransaction>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, ...updates };

        // If category changed, update category name
        if (updates.categoryId) {
          const cat = categories.find((c) => c.id === updates.categoryId);
          if (cat) updated.categoryName = cat.name;
        }

        const { isValid, errors } = validateRow(updated);
        return { ...updated, isValid, errors };
      })
    );
  };

  const handleToggleInclude = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, included: !r.included } : r))
    );
  };

  const handleToggleAllIncluded = (included: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, included })));
  };

  const handleExcludeInvalid = () => {
    setRows((prev) =>
      prev.map((r) => (!r.isValid ? { ...r, included: false } : r))
    );
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBatchAiCategorize = async () => {
    const unmapped = rows.filter((r) => r.included && (!r.categoryId || r.errors.includes("Category must be selected")));
    if (unmapped.length === 0) {
      setError("All included rows are already mapped to a category!");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setIsAiCategorizing(true);
      setError(null);

      const res = await fetch("/api/transactions/batch/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: unmapped.map((r) => ({
            id: r.id,
            description: r.description,
            amount: r.amount,
            type: r.type,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Batch AI categorization failed");
      }

      const suggestions = json.suggestions as Record<
        string,
        { categoryId: string; categoryName: string }
      >;

      setRows((prev) =>
        prev.map((row) => {
          if (suggestions[row.id]) {
            const match = suggestions[row.id];
            const updated = {
              ...row,
              categoryId: match.categoryId,
              categoryName: match.categoryName,
              isAiCategorized: true,
            };
            const { isValid, errors } = validateRow(updated);
            return { ...updated, isValid, errors };
          }
          return row;
        })
      );
    } catch (err: any) {
      setError(err?.message || "Failed to auto-categorize with AI");
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleConfirmImport = async () => {
    const validIncludedRows = rows.filter((r) => r.included && r.isValid);
    if (validIncludedRows.length === 0) {
      setError("Please select at least one valid row to import.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/transactions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: validIncludedRows.map((r) => ({
            amount: r.amount,
            type: r.type,
            description: r.description,
            categoryId: r.categoryId,
            date: r.date,
            paymentMethod: r.paymentMethod,
            merchant: r.merchant || null,
            isAiCategorized: r.isAiCategorized || false,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to import transactions");
      }

      setSuccessInfo(`Successfully imported ${json.insertedCount} transactions!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Import failed. Please check rows and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = `Date,Description,Amount,Category,Type,PaymentMethod,Merchant
2026-09-15,University Bookstore - Textbooks,124.50,Academics,Expense,Card,Campus Store
2026-09-18,Campus Cafeteria Lunch,12.80,Food & Dining,Expense,Card,Dorm Dining
2026-09-20,Monthly Bus Transit Pass,45.00,Transportation,Expense,Mobile_Payment,City Metro
2026-09-22,Student Tutoring Stipend,250.00,Allowances & Income,Income,Bank_Transfer,Academic Center
2026-09-24,Library Printing Services,8.25,Academics,Expense,Cash,Main Library`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "campus-coin-sample-import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const validCount = rows.filter((r) => r.included && r.isValid).length;
  const invalidCount = rows.filter((r) => r.included && !r.isValid).length;
  const displayedRows = filterInvalidOnly ? rows.filter((r) => !r.isValid) : rows;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden scale-in-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-modal-title"
      >
        {/* ── Modal Header ─────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="csv-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                CSV Bulk Transaction Import
              </h2>
              <p className="text-xs text-slate-500">
                Upload bank/card statements, review mapped categories, and batch insert records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Download formatted sample template CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Sample Template</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close CSV import modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Modal Body ───────────────────────────────────────────── */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Upload Dropzone (if no file parsed yet or user wants to re-upload) */}
          {rows.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="p-10 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 rounded-3xl bg-indigo-50/20 dark:bg-indigo-950/10 text-center cursor-pointer transition-all hover:bg-indigo-50/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processCsvFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                {isParsing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isParsing ? "Parsing CSV Rows..." : "Click or drag CSV file here"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Supports bank statements or spreadsheet exports with Date, Amount, Description, and Category columns.
              </p>
            </div>
          ) : (
            /* Parsed Preview Table with Editable Rows */
            <div className="space-y-3">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    File: <span className="font-mono text-indigo-600 dark:text-indigo-400">{file?.name}</span> ({rows.length} rows)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                      {validCount} valid
                    </span>
                    {invalidCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                        {invalidCount} invalid
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* AI Categorize Unmapped Button */}
                  <button
                    type="button"
                    disabled={isAiCategorizing}
                    onClick={handleBatchAiCategorize}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Automatically classify unmapped rows using Gemini"
                  >
                    {isAiCategorizing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>AI Auto-Categorize</span>
                  </button>

                  {/* Filter invalid toggle */}
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterInvalidOnly(!filterInvalidOnly)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        filterInvalidOnly
                          ? "bg-rose-100 border-rose-300 text-rose-800 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      <span>{filterInvalidOnly ? "Show All Rows" : "Show Errors Only"}</span>
                    </button>
                  )}

                  {/* Exclude all invalid */}
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={handleExcludeInvalid}
                      className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors cursor-pointer"
                    >
                      Exclude Invalid Rows
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setRows([]);
                      setFile(null);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Clear File
                  </button>
                </div>
              </div>

              {/* Editable Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/90 sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700 backdrop-blur-xs">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={rows.every((r) => r.included)}
                          onChange={(e) => handleToggleAllIncluded(e.target.checked)}
                          aria-label="Toggle all rows"
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="p-3 w-28">Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 w-28">Amount</th>
                      <th className="p-3 w-28">Type</th>
                      <th className="p-3 w-48">Category</th>
                      <th className="p-3 w-24 text-center">Status</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          !row.included
                            ? "opacity-40 bg-slate-50/50 dark:bg-slate-900/30"
                            : !row.isValid
                            ? "bg-rose-50/40 dark:bg-rose-950/20"
                            : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Include Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.included}
                            onChange={() => handleToggleInclude(row.id)}
                            aria-label={`Include row ${row.description}`}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* Date Field */}
                        <td className="p-2">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) =>
                              handleRowChange(row.id, { date: e.target.value })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          />
                        </td>

                        {/* Description Field */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) =>
                              handleRowChange(row.id, { description: e.target.value })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          />
                        </td>

                        {/* Amount Field */}
                        <td className="p-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-slate-400">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={row.amount || ""}
                              onChange={(e) =>
                                handleRowChange(row.id, {
                                  amount: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full pl-5 pr-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                            />
                          </div>
                        </td>

                        {/* Type Toggle */}
                        <td className="p-2">
                          <select
                            value={row.type}
                            onChange={(e) =>
                              handleRowChange(row.id, {
                                type: e.target.value as "EXPENSE" | "INCOME",
                              })
                            }
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                          >
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                          </select>
                        </td>

                        {/* Category Dropdown */}
                        <td className="p-2">
                          <div className="relative">
                            <select
                              value={row.categoryId || ""}
                              onChange={(e) =>
                                handleRowChange(row.id, { categoryId: e.target.value })
                              }
                              className={`w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border text-xs text-slate-900 dark:text-white font-medium ${
                                !row.categoryId
                                  ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                                  : "border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <option value="">-- Choose Category --</option>
                              {categories
                                .filter((c) => c.type === row.type)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>
                            {row.isAiCategorized && (
                              <span
                                className="absolute right-6 top-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                title="Categorized by AI"
                              >
                                AI
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Validation Status */}
                        <td className="p-2 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>OK</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 cursor-help"
                              title={row.errors.join("; ")}
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Fix</span>
                            </span>
                          )}
                        </td>

                        {/* Delete Row Button */}
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────── */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {rows.length > 0 ? (
              <span>
                Ready to insert <strong>{validCount}</strong> valid transaction(s).
                {invalidCount > 0 && (
                  <span className="text-rose-600 ml-1">
                    ({invalidCount} row(s) excluded or requiring correction)
                  </span>
                )}
              </span>
            ) : (
              <span>Upload CSV statement to preview</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSubmitting || validCount === 0}
              onClick={handleConfirmImport}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-all active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>
                {isSubmitting
                  ? "Importing Transactions..."
                  : `Import ${validCount} Transaction${validCount === 1 ? "" : "s"}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
