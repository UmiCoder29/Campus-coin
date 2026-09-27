import React from "react";
import { AuthHeader } from "@/components/layout/auth-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5] dark:bg-[#0A0D14] text-[#141722] dark:text-[#F2F5F9] transition-colors duration-200 selection:bg-[#FFE862] selection:text-black">
      {/* ── Top Header ────────────────────── */}
      <AuthHeader />

      {/* ── Main Content Container ────────── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pb-32 sm:pb-36">
        <div className="w-full max-w-4xl mx-auto">{children}</div>
      </main>

      {/* ── Minimalist Clean Footer ──────── */}
      <footer className="border-t border-[#EFEAE1]/70 dark:border-[#1E2536]/70 py-6 px-6 text-xs text-[#767D8C] dark:text-[#8B96AA]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#141722] dark:text-white">CampusCoin</span>
            <span className="text-[#8B96AA]/50">|</span>
            <span>Collegiate Student Expense Ledger</span>
          </div>

          <div className="text-[11px] text-[#8B96AA]">
            End-to-End Encrypted | Built for Modern Campus Life
          </div>
        </div>
      </footer>
    </div>
  );
}
