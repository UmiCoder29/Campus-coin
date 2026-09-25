"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  PiggyBank,
  BarChart3,
  Lightbulb,
  Bell,
  Settings,
  Shield,
  LogOut,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Navigation Items
   ───────────────────────────────────────────── */

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Budgets", href: "/budgets", icon: PiggyBank },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Saving Tips", href: "/saving-tips", icon: Lightbulb },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

/* ─────────────────────────────────────────────
   Sidebar Component (Desktop + Mobile Drawer)
   ───────────────────────────────────────────── */

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [unreadCount, setUnreadCount] = React.useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const res = await fetch("/api/notifications?limit=1");
        if (res.ok) {
          const json = await res.json();
          if (json.success) setUnreadCount(json.unreadCount || 0);
        }
      } catch (err) {
        // silent fallback
      }
    }
    loadUnreadCount();
  }, [pathname]);

  // Close drawer on route change
  useEffect(() => {
    onClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* ── Brand & Official Logo ────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1 pt-1">
          <Logo size="md" href="/dashboard" />

          {/* Close button (mobile only) */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-[#F3EFE7] dark:hover:bg-[#1F2636] transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── User Info (Card below Logo matching design) ──── */}
        {session?.user && (
          <div className="mb-5 p-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F6DFC2] dark:bg-[#3D2E1E] text-[#935219] dark:text-[#FFA64D] flex items-center justify-center font-bold text-sm shrink-0">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#141722] dark:text-white truncate">
                  {session.user.name}
                </div>
                <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] truncate">
                  {session.user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation Links ────────────────── */}
        <nav className="space-y-1 px-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] font-semibold shadow-xs"
                    : "text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-[#FF6422] dark:text-[#FF7D42]" : "text-[#767D8C] dark:text-[#8B96AA] group-hover:text-[#FF6422]"
                  }`}
                />
                <span>{item.name}</span>

                {/* Notification badge dynamically displayed if unread > 0 */}
                {item.name === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-[#E5DFD5] dark:bg-[#283244] text-[11px] font-bold text-[#4B5262] dark:text-[#E2E8F0] shadow-2xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Footer Section ────────────────────── */}
      <div className="space-y-2 px-1 pt-4 border-t border-[#EFEAE1] dark:border-[#222938]">
        {/* Admin Quick Switch */}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/25 transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Portal</span>
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          id="nav-logout"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────── */}
      <aside
        className="w-64 shrink-0 border-r border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#0E121B] hidden md:flex md:flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto scrollbar-hide"
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile Drawer Overlay ─────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer Panel ───────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FBF9F5] dark:bg-[#0E121B] border-r border-[#EFEAE1] dark:border-[#222938] flex flex-col justify-between p-4 md:hidden transition-transform duration-300 ease-out shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
