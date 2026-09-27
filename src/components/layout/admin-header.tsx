"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "@/components/ui/logo";
import { LogOut, Menu, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function AdminHeader({
  title = "Platform Governance Console",
  onMenuClick,
}: AdminHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/users?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5]/90 dark:bg-[#0E121B]/90 backdrop-blur-md">
      {/* ── Main Header Row: 3-column layout centering controls in the middle ── */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 relative">
        {/* Left: Hamburger (mobile) + Brand + Admin Title */}
        <div className="flex items-center gap-3 shrink-0 min-w-0 md:min-w-[140px] lg:min-w-[200px]">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1F2636] hover:text-[#141722] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Open admin menu"
            id="admin-header-menu-toggle"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="md:hidden">
            <Logo size="sm" href="/admin" />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#FF722B]" />
            <h1 className="text-sm font-bold text-[#141722] dark:text-white tracking-tight truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* ── TOP MIDDLE COMMAND ISLAND (Centered) ───────────────── */}
        <div className="flex items-center justify-center flex-1 max-w-fit mx-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full sm:rounded-2xl bg-white/80 dark:bg-[#151A26]/90 backdrop-blur-md border border-[#E7E1D6] dark:border-[#263043] shadow-xs">
            {/* Search input */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center gap-2 bg-[#F1EFEA] dark:bg-[#181E2D] border border-transparent dark:border-[#222938] rounded-full px-3 py-1 text-xs text-[#767D8C] dark:text-[#8B96AA]">
              <Search className="h-3.5 w-3.5 text-[#767D8C] dark:text-[#8B96AA]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts..."
                className="bg-transparent border-none outline-none w-24 xl:w-28 text-xs text-[#141722] dark:text-white placeholder-[#989FA8]"
              />
            </form>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Quick link to Student App */}
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-[#525866] dark:text-[#94A0B8] hover:text-[#141722] dark:hover:text-white hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors"
            >
              <span>Student App</span>
            </Link>

            {/* Vertical Separator */}
            <div className="hidden sm:block w-px h-5 bg-[#E2DBD0] dark:bg-[#2A3448] mx-0.5" />

            {/* Admin Profile Chip */}
            {session?.user && (
              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF722B] to-[#FF9054] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {session.user.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-[#141722] dark:text-white leading-tight">
                    {session.user.name}
                  </div>
                  <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-medium">
                    Root Administrator
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out */}
            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: "/admin/login" })}
                title="Sign out of Admin Portal"
                className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Symmetrical balancer on desktop */}
        <div className="hidden md:flex items-center justify-end shrink-0 min-w-0 md:min-w-[140px] lg:min-w-[200px]">
          <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Root Active</span>
          </span>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
