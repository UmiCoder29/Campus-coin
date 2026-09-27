"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  LogIn,
  Sparkles,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuthTransition } from "@/components/auth/auth-transition-context";
import { useCinematicNavigation } from "@/components/transitions/cinematic-page-transition";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const isReset = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { triggerAuthTransition } = useAuthTransition();
  const { cinematicNavigate } = useCinematicNavigation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        portal: "student",
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Preloader curtain transition to dashboard upon successful sign-in
        await triggerAuthTransition("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickFillStudent = () => {
    setEmail("student.evaluator@campuscoin.edu");
    setPassword("Student@Evaluator123");
    setError(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* ── Main Authentication Card (Prominent Primary Hierarchy) ─────────── */}
      <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#1E2536] bg-white dark:bg-[#0E1320] p-7 sm:p-10 shadow-2xl shadow-black/5 dark:shadow-black/40 transition-colors">
        {/* Header - No eyebrow pill */}
        <div className="text-center mb-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141722] dark:text-white">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1.5 max-w-sm mx-auto">
            Sign in to track your campus expenses, category budgets, and daily allowances.
          </p>
        </div>

        {/* Status Banners */}
        {isRegistered && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Account created successfully! Please sign in with your credentials.</span>
          </div>
        )}

        {isReset && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Password reset successfully. Sign in with your new credentials.</span>
          </div>
        )}

        {/* 1-Click Evaluator Demo Callout (Visually quieter secondary element) */}
        <div className="mb-6 rounded-xl border-l-4 border-l-[#FF722B] bg-[#FFF7F2]/80 dark:bg-[#161B27]/80 p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#767D8C] dark:text-[#8B96AA]">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FF722B]" />
            <span>Evaluator demo account available</span>
          </div>
          <button
            type="button"
            onClick={handleQuickFillStudent}
            className="flex items-center gap-1.5 font-semibold text-[#FF722B] dark:text-[#FF8A44] hover:underline cursor-pointer shrink-0"
          >
            <User className="h-3.5 w-3.5" />
            <span>Auto-fill demo</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3.5 text-xs text-red-700 dark:text-red-300 animate-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Campus email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student.evaluator@campuscoin.edu"
              className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-3 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#FF722B] dark:text-[#FF7D42] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-3 pr-11 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FF8A44] hover:from-[#E65F1B] hover:to-[#FF7830] active:scale-[0.99] py-3.5 px-4 font-bold text-sm text-white shadow-lg shadow-[#FF722B]/25 disabled:opacity-50 transition-all cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </>
            )}
          </button>
        </form>

        {/* Switch to Registration with Cinematic Transition (No trailing arrow glyph) */}
        <div className="mt-6 text-center text-xs text-[#767D8C] dark:text-[#8B96AA]">
          Don&apos;t have an account yet?{" "}
          <button
            type="button"
            onClick={() => cinematicNavigate("/register")}
            className="font-bold text-[#FF722B] dark:text-[#FF7D42] hover:underline cursor-pointer"
          >
            Create student account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-[#767D8C] rounded-3xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] max-w-md mx-auto">
          <div className="w-6 h-6 border-2 border-[#FF722B]/30 border-t-[#FF722B] rounded-full animate-spin mx-auto mb-3" />
          <span>Loading student portal...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
