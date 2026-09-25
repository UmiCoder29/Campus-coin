"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Check,
  Mail,
  X,
  Send,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

interface ReportExportButtonProps {
  reportElementId: string;
  userName: string;
  monthStr: string;
}

export function ReportExportButton({
  reportElementId,
  userName,
  monthStr,
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"PDF" | "IMAGE" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Campus Coin Financial Summary • ${monthStr}`
  );
  const [emailNotes, setEmailNotes] = useState("");
  const [emailFormat, setEmailFormat] = useState<"PDF" | "SUMMARY">("PDF");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const cleanUserName = userName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const fileNameBase = `campus-coin-report-${cleanUserName}-${monthStr}`;

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isEmailModalOpen) {
        setIsEmailModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEmailModalOpen]);

  const capturePng = async (el: HTMLElement): Promise<string> => {
    return await toPng(el, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
  };

  const handleExportPDF = async () => {
    const el = document.getElementById(reportElementId);
    if (!el) {
      alert("Unable to find printable report container.");
      return;
    }

    try {
      setIsExporting(true);
      setExportType("PDF");

      const imgData = await capturePng(el);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileNameBase}.pdf`);

      setSuccessMessage("PDF downloaded!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportImage = async () => {
    const el = document.getElementById(reportElementId);
    if (!el) {
      alert("Unable to find printable report container.");
      return;
    }

    try {
      setIsExporting(true);
      setExportType("IMAGE");

      const dataUrl = await capturePng(el);
      const link = document.createElement("a");
      link.download = `${fileNameBase}.png`;
      link.href = dataUrl;
      link.click();

      setSuccessMessage("Image downloaded!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Image export failed:", err);
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setEmailError("Please enter a valid recipient email address.");
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailError(null);

      const res = await fetch("/api/reports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          subject: emailSubject,
          month: monthStr,
          format: emailFormat,
          notes: emailNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to dispatch email");
      }

      setEmailSuccess(`Report dispatched to ${recipientEmail}`);
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setEmailSuccess(null);
        setRecipientEmail("");
        setEmailNotes("");
      }, 1800);
    } catch (err: any) {
      setEmailError(err?.message || "Failed to send email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {successMessage && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
            <Check className="h-3.5 w-3.5" />
            <span>{successMessage}</span>
          </span>
        )}

        {/* Email Report Button */}
        <button
          type="button"
          onClick={() => setIsEmailModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
          title="Email this report to yourself, guardian, or advisor"
          aria-label="Email report"
        >
          <Mail className="h-3.5 w-3.5 text-indigo-500" />
          <span className="hidden sm:inline">Email Report</span>
        </button>

        {/* Export as Image Button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportImage}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          title="Download high-resolution PNG image of current report view"
          aria-label="Export report as PNG image"
        >
          {isExporting && exportType === "IMAGE" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span className="hidden sm:inline">Export PNG</span>
        </button>

        {/* Export as PDF Button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          title="Generate client-side PDF with charts and savings summary"
          aria-label="Export report as PDF"
        >
          {isExporting && exportType === "PDF" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span>Export PDF</span>
        </button>
      </div>

      {/* ── Email Report Modal ─────────────────────────────────────── */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 scale-in-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-report-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3
                    id="email-report-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    Share / Email Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Period: {monthStr} &bull; Generated for {userName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close email modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {emailSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Email Dispatched!
                </h4>
                <p className="text-xs text-slate-500">{emailSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-3.5">
                {emailError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{emailError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@university.edu or advisor@campus.edu"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format & Summary Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEmailFormat("PDF")}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium transition-all ${
                        emailFormat === "PDF"
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Full PDF Summary</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailFormat("SUMMARY")}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium transition-all ${
                        emailFormat === "SUMMARY"
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      <span>Executive Overview</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Personal Memo / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={emailNotes}
                    onChange={(e) => setEmailNotes(e.target.value)}
                    placeholder="Attach personal notes or semester planning context..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingEmail ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{isSendingEmail ? "Dispatching..." : "Send Report"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
