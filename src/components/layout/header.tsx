"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Logo } from "@/components/ui/logo";
import { LogOut, Menu, User as UserIcon, Search } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5]/90 dark:bg-[#0E121B]/90 backdrop-blur-md">
      {/* ── Main Header Row ───────────────── */}
      <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Hamburger + Brand (mobile) */}
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only) */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1F2636] hover:text-[#141722] dark:hover:text-white transition-colors"
            aria-label="Open menu"
            id="header-menu-toggle"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile-only brand logo */}
          <div className="md:hidden">
            <Logo size="sm" href="/dashboard" />
          </div>

          {/* Optional page title (used by admin layout) */}
          {title && (
            <h1 className="hidden md:block text-base font-bold text-[#141722] dark:text-white tracking-tight">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search pill bar matching screenshot */}
          <div className="hidden lg:flex items-center gap-2 bg-[#F1EFEA] dark:bg-[#181E2D] border border-transparent dark:border-[#222938] rounded-full px-3.5 py-1.5 text-xs text-[#767D8C] dark:text-[#8B96AA]">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none w-28 text-xs text-[#141722] dark:text-white placeholder-[#989FA8]"
              readOnly
            />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Bell with unread badge and dropdown */}
          <NotificationBell />

          {/* User Section matching screenshot pill */}
          {session?.user && (
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-[#EFEAE1] dark:border-[#222938]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF722B] to-[#FF9054] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {session.user.name
                    ? session.user.name.charAt(0).toUpperCase()
                    : <UserIcon className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#141722] dark:text-white leading-tight">
                    {session.user.name}
                  </div>
                  <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] capitalize flex items-center gap-1.5">
                    <span>{session.user.role?.toLowerCase() || "Student"}</span>
                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="text-[10px] text-orange-600 dark:text-orange-400 hover:underline font-semibold"
                      >
                        (Admin Portal)
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Breadcrumbs Row ────────────────── */}
      <div className="px-4 sm:px-6 pb-2">
        <Breadcrumbs />
      </div>
    </header>
  );
}
