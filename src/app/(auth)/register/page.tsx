"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useCinematicNavigation } from "@/components/transitions/cinematic-page-transition";

export default function RegisterPage() {
  const router = useRouter();
  const { cinematicNavigate } = useCinematicNavigation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    academicYear: "Freshman",
    monthlyAllowance: 500,
    savingsGoal: 100,
    university: "",
    studentId: "",
    currency: "USD",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live financial pace calculations
  const allowance = Number(formData.monthlyAllowance) || 0;
  const savings = Number(formData.savingsGoal) || 0;
  const netSpending = Math.max(0, allowance - savings);
  const dailyPace = allowance > 0 ? (netSpending / 30).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to register account");
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          cinematicNavigate("/login");
        }, 1100);
      }
    } catch {
      setError("Network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ── Main Registration Card (Primary Hierarchy) ─────────── */}
      <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#1E2536] bg-white dark:bg-[#0E1320] p-6 sm:p-10 shadow-2xl shadow-black/5 dark:shadow-black/40 transition-colors">
        {/* Header - No eyebrow pill */}
        <div className="pb-6 mb-6 border-b border-[#EFEAE1] dark:border-[#1E2536] text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141722] dark:text-white">
            Create your student account
          </h1>
          <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1">
            Set up your academic profile, monthly allowance, and savings targets.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300 animate-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs text-emerald-700 dark:text-emerald-300 animate-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Account created successfully! Transferring to sign in...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left Column: Student Credentials (7 cols) ───── */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-semibold text-[#FF722B] dark:text-[#FF8A44] flex items-center gap-1.5 pb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>1. Student identity & login</span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Morgan"
                  className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Campus email address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex.morgan@university.edu"
                  className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password (min. 8 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 pr-11 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* University & Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="Stanford University"
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Student ID number
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="STU-2026-908"
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ── Right Column: Financial Baseline (5 cols) ───── */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-semibold text-[#FF722B] dark:text-[#FF8A44] flex items-center gap-1.5 pb-1">
                <Wallet className="h-4 w-4" />
                <span>2. Allowance & savings target</span>
              </div>

              {/* Academic Year & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Academic year
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-3.5 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] transition-all"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-3.5 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] transition-all"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="VND">VND (₫)</option>
                  </select>
                </div>
              </div>

              {/* Allowance & Savings inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Monthly allowance ({formData.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formData.monthlyAllowance}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyAllowance: Number(e.target.value) })
                    }
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Savings target ({formData.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formData.savingsGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, savingsGoal: Number(e.target.value) })
                    }
                    className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] transition-all"
                  />
                </div>
              </div>

              {/* Simplified Stat Block (Rule 6: Plain short labels, no decorative headers/eyebrow tags) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Safe spend / mo
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {formData.currency} ${netSpending.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Daily limit
                    </div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ${dailyPace} / day
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit & Back Navigation - No trailing arrow glyphs */}
          <div className="pt-4 border-t border-[#EFEAE1] dark:border-[#1E2536] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => cinematicNavigate("/login")}
                className="font-bold text-[#FF722B] dark:text-[#FF7D42] hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FF8A44] hover:from-[#E65F1B] hover:to-[#FF7830] active:scale-[0.99] py-3 px-7 font-bold text-sm text-white shadow-lg shadow-[#FF722B]/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create student account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
