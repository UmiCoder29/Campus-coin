"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShieldAlert, LogIn, Lock, Mail, AlertCircle, ArrowLeft, Key } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthTransition } from "@/components/auth/auth-transition-context";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    urlError === "AdminAccessRequired"
      ? "Administrator privileges required to access this portal."
      : null
  );
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
        portal: "admin", // Enforces user.role === 'ADMIN'
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        await triggerAuthTransition(callbackUrl);
      }
    } catch {
      setError("An unexpected server error occurred during authentication.");
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail("admin@campuscoin.edu");
    setPassword("Admin@123");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#FBF9F5] dark:bg-[#0E121B] text-[#141722] dark:text-[#F2F5F9] transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-2xl font-black tracking-tight text-[#141722] dark:text-white">
            Campus Coin Administration
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-8 sm:p-10 shadow-xl backdrop-blur-xl">
          {/* Quick Demo Fill for Judges (Quieter styling) */}
          <div className="mb-6 rounded-xl border-l-4 border-l-[#FF6422] bg-[#FFEFE6]/40 dark:bg-[#FF6422]/10 p-3.5 flex items-center justify-between">
            <div className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
              TechWiz7 evaluation demo
            </div>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="inline-flex items-center gap-1.5 font-semibold text-[#FF6422] dark:text-[#FF7D42] text-xs hover:underline cursor-pointer"
            >
              <Key className="h-3 w-3" />
              <span>Fill demo admin</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Admin email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#767D8C] dark:text-[#8B96AA]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campuscoin.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#0E121B] text-sm text-[#141722] dark:text-white placeholder:text-[#767D8C] dark:placeholder:text-[#8B96AA] focus:outline-none focus:border-[#FF6422] dark:focus:border-[#FF7D42] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Admin password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#767D8C] dark:text-[#8B96AA]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#0E121B] text-sm text-[#141722] dark:text-white placeholder:text-[#767D8C] dark:placeholder:text-[#8B96AA] focus:outline-none focus:border-[#FF6422] dark:focus:border-[#FF7D42] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF6422] hover:bg-[#E55519] py-3 px-4 font-bold text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all cursor-pointer mt-6"
            >
              {loading ? (
                <span className="text-sm">Authenticating...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Authenticate Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#F3EFE7] dark:border-[#222938] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#767D8C] dark:text-[#8B96AA] hover:text-[#FF6422] dark:hover:text-[#FF7D42] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Student Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF9F5] dark:bg-[#0E121B] flex items-center justify-center text-[#FF6422] text-sm">Loading admin portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
