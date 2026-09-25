"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ShieldAlert, LogIn, Lock, Mail, AlertCircle, ArrowLeft, Key } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#0E121B] text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Governance & Platform Management</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Campus Coin Administration
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#222938] bg-[#161B27] p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Quick Demo Fill for Judges */}
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-center justify-between">
            <div className="text-xs text-amber-300 font-medium">
              TechWiz7 Evaluation:
            </div>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer"
            >
              <Key className="h-3 w-3" />
              <span>Fill Demo Admin</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campuscoin.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 px-4 font-semibold text-white shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer mt-6"
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

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 text-sm">Loading admin portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
