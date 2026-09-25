import React from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5] dark:bg-[#0E121B] text-[#141722] dark:text-white transition-colors duration-200">
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#EFEAE1] dark:border-[#222938] bg-white/80 dark:bg-[#161B27]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Logo size="md" href="/login" />
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFEFE6] text-[#FF6422] dark:bg-[#FF6422]/20 dark:text-[#FF7D42] border border-[#FF6422]/20">
            TechWiz 7
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-xs text-[#767D8C] dark:text-[#8B96AA] border-t border-[#EFEAE1] dark:border-[#222938]">
        Campus Coin &copy; 2026 &bull; Aptech TechWiz 7 NextGen BudgetBee
      </footer>
    </div>
  );
}
