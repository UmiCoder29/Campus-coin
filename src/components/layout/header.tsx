"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Logo } from "@/components/ui/logo";
import { StudentProfileDropdown } from "./student-profile-dropdown";
import { LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5]/90 dark:bg-[#0E121B]/90 backdrop-blur-md">
      {/* ── Main Header Row: 3-column layout centering controls in the middle ── */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 relative">
        {/* Left: Mobile Navigation + Brand / Page Title */}
        <div className="flex items-center gap-3 shrink-0 min-w-0 md:min-w-[120px] lg:min-w-[180px]">
          {/* Hamburger (mobile only) */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1F2636] hover:text-[#141722] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Open menu"
            id="header-menu-toggle"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile-only brand logo */}
          <div className="md:hidden">
            <Logo size="sm" href="/dashboard" />
          </div>

          {/* Optional page title (used by admin or nested pages) */}
          {title && (
            <h1 className="hidden md:block text-sm font-bold text-[#141722] dark:text-white tracking-tight truncate">
              {title}
            </h1>
          )}
        </div>

        {/* ── TOP MIDDLE COMMAND ISLAND (Centered) ───────────────── */}
        <div className="flex items-center justify-center flex-1 max-w-fit mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-full sm:rounded-2xl bg-white/70 dark:bg-[#151A26]/85 backdrop-blur-md border border-[#E7E1D6]/80 dark:border-[#263043]/80 shadow-xs">
            {/* Search pill bar matching reference image */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center gap-2 bg-[#F1EFEA] dark:bg-[#181E2D] border border-[#EBE6DC] dark:border-[#222938] rounded-full px-3.5 py-1.5 text-xs text-[#767D8C] dark:text-[#8B96AA]">
              <Search className="h-3.5 w-3.5 text-[#767D8C] dark:text-[#8B96AA]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none w-24 sm:w-28 md:w-36 text-xs text-[#141722] dark:text-white placeholder-[#989FA8]"
              />
            </form>

            {/* Theme Toggle (Light / Dark / System) */}
            <ThemeToggle />

            {/* Notifications Bell */}
            <NotificationBell />

            {/* Vertical Separator */}
            <div className="w-px h-6 bg-[#E2DBD0] dark:bg-[#2A3448] mx-0.5" />

            {/* User Section with Animated Slide-Down Profile Panel */}
            {session?.user && <StudentProfileDropdown />}

            {/* Direct Logout Button */}
            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Symmetrical balancer for perfect geometric centering on desktop */}
        <div className="hidden md:flex items-center justify-end shrink-0 min-w-0 md:min-w-[120px] lg:min-w-[180px]">
          {/* Subtle live indicator badge on desktop right */}
          <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#767D8C] dark:text-[#8B96AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Campus Live</span>
          </span>
        </div>
      </div>

      {/* ── Breadcrumbs Row ────────────────── */}
      <div className="px-4 sm:px-6 pb-2">
        <Breadcrumbs />
      </div>
    </header>
  );
}
