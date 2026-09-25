"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn, Sparkles, User, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuthTransition } from "@/components/auth/auth-transition-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const isReset = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { triggerAuthTransition } = useAuthTransition();

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
        // Trigger the full-screen GSAP preloader with curtain transition into dashboard
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
  };

  return (
    <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-none transition-colors duration-200">
      <div className="flex flex-col items-center text-center mb-7">
        <Logo size="lg" className="mb-4" />
        <h1 className="text-2xl font-black tracking-tight text-[#141722] dark:text-white">
          Student Sign In
        </h1>
        <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1 max-w-xs">
          Access your Campus Coin cockpit, category caps & AI insights
        </p>
      </div>

      {isRegistered && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Account created successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {isReset && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Password reset successfully. Sign in with your new password.</span>
        </div>
      )}

      {/* Demo Credentials Quick-Fill for TechWiz 7 Evaluator */}
      <div className="mb-6 rounded-2xl border border-[#FFEFE6] dark:border-[#FF6422]/20 bg-[#FFF7F2] dark:bg-[#FF6422]/10 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6422] dark:text-[#FF8A44]">
            <Sparkles className="h-3.5 w-3.5 text-[#FF722B]" />
            <span>TechWiz 7 Quick-Fill:</span>
          </div>
          <button
            type="button"
            onClick={handleQuickFillStudent}
            className="flex items-center gap-1.5 rounded-xl border border-[#FF6422]/20 bg-white dark:bg-[#1E2536] py-1 px-3 text-xs font-bold text-[#FF6422] dark:text-[#FF8A44] hover:bg-[#FFEFE6] dark:hover:bg-[#FF6422]/20 transition-all cursor-pointer shadow-2xs"
          >
            <User className="h-3 w-3" />
            <span>Fill Evaluator</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8] mb-1.5">
            Campus Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@campuscoin.edu"
            className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-3 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#525866] dark:text-[#94A0B8]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#FF6422] dark:text-[#FF7D42] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#111520] px-4 py-3 text-sm text-[#141722] dark:text-white placeholder:text-[#9EA5B4] focus:outline-none focus:ring-2 focus:ring-[#FF722B] focus:border-[#FF722B] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF722B] to-[#FF8A44] hover:from-[#E65F1B] hover:to-[#FF7830] active:scale-[0.99] py-3 px-4 font-bold text-sm text-white shadow-lg shadow-[#FF722B]/25 disabled:opacity-50 transition-all cursor-pointer mt-2"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Sign In as Student</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[#767D8C] dark:text-[#8B96AA]">
        New to Campus Coin?{" "}
        <Link
          href="/register"
          className="font-bold text-[#FF6422] dark:text-[#FF7D42] hover:underline"
        >
          Create student account
        </Link>
      </div>

      <div className="mt-6 pt-5 border-t border-[#EFEAE1] dark:border-[#222938] text-center">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#767D8C] hover:text-[#FF722B] dark:text-[#8B96AA] dark:hover:text-[#FF8A44] transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Administrator Portal Access &rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#767D8C]">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
