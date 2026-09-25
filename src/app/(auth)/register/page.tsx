"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function RegisterPage() {
  const router = useRouter();
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
          router.push("/login?registered=true");
        }, 1200);
      }
    } catch {
      setError("Network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-none max-w-lg mx-auto transition-colors duration-200">
      <div className="flex flex-col items-center text-center mb-7">
        <Logo size="lg" className="mb-4" />
        <h1 className="text-2xl font-black tracking-tight text-[#141722] dark:text-white">
          Student Registration
        </h1>
        <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1 max-w-xs">
          Join Campus Coin & set up your NextGen BudgetBee baseline
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Account created! Redirecting to login...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
            Full Name
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
            Campus Email Address
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="alex.m@university.edu"
            className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
          />
        </div>

        {/* Academic Year & Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
              Academic Year
            </label>
            <select
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-3.5 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            >
              <option value="Freshman">Freshman (Year 1)</option>
              <option value="Sophomore">Sophomore (Year 2)</option>
              <option value="Junior">Junior (Year 3)</option>
              <option value="Senior">Senior (Year 4)</option>
              <option value="Graduate">Graduate / Masters</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-3.5 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>

        {/* Monthly Allowance Baseline & Savings Goal */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
              Monthly Allowance ($)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              required
              value={formData.monthlyAllowance}
              onChange={(e) => setFormData({ ...formData, monthlyAllowance: Number(e.target.value) })}
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
              Savings Goal ($)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              required
              value={formData.savingsGoal}
              onChange={(e) => setFormData({ ...formData, savingsGoal: Number(e.target.value) })}
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            />
          </div>
        </div>

        {/* University & Student ID */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
              Campus / University
            </label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              placeholder="e.g. Apex Tech"
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-3.5 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
              Student ID (Optional)
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              placeholder="STU-2026"
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-3.5 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
            Password (min. 6 characters)
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-2.5 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FF8A44] hover:from-[#E65F1B] hover:to-[#FF7830] active:scale-[0.99] py-3 px-4 font-bold text-sm text-white shadow-lg shadow-[#FF722B]/25 disabled:opacity-50 transition-all cursor-pointer mt-3"
        >
          {loading ? (
            <span>Creating student account...</span>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Create Student Account</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[#767D8C] dark:text-[#8B96AA]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-[#FF6422] dark:text-[#FF7D42] hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
