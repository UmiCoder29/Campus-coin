"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { Shield, ShieldAlert, LogOut, ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AdminHeader({
  title = "Platform Governance Console",
  subtitle = "Aptech TechWiz7 • System Administration",
}: AdminHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl text-white shadow-lg shadow-black/10">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Distinct Admin Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                <Lock className="h-2.5 w-2.5" />
                Root Guard
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {subtitle}
            </div>
          </div>
        </div>

        {/* Right: Privilege Indicator, Theme Toggle, Admin Profile, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick exit to Student App */}
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
          >
            <span>Student App</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin User Section */}
          {session?.user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20">
                  {session.user.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {session.user.name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold tracking-wide">
                    SYSTEM ADMIN
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                title="Sign out of Admin Portal"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
