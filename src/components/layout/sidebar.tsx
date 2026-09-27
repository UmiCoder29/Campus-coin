"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
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
  ChevronLeft,
  ChevronRight,
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

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [unreadCount, setUnreadCount] = useState(0);

  // Desktop sidebar expand state
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const res = await fetch("/api/notifications?limit=1");
        if (res.ok) {
          const json = await res.json();
          if (json.success) setUnreadCount(json.unreadCount || 0);
        }
      } catch {
        // silent fallback
      }
    }
    loadUnreadCount();
  }, [pathname]);

  // Close mobile drawer on route change
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

  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";

  // Reusable Nav Content
  const renderNavLinks = (expanded: boolean) => (
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
            title={!expanded ? item.name : undefined}
            className={cn(
              "group relative flex items-center rounded-2xl py-2.5 transition-all duration-200",
              expanded ? "gap-3 px-3.5" : "justify-center px-0",
              isActive
                ? "bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF722B] dark:text-[#FF7D42] font-semibold shadow-2xs"
                : "text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? "text-[#FF722B] dark:text-[#FF7D42]"
                  : "text-[#767D8C] dark:text-[#8B96AA] group-hover:text-[#FF722B]"
              )}
            />

            {/* Smoothly animated text label */}
            <motion.span
              initial={false}
              animate={{
                display: expanded ? "inline-block" : "none",
                opacity: expanded ? 1 : 0,
                x: expanded ? 0 : -8,
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1"
            >
              {item.name}
            </motion.span>

            {/* Notification Badge */}
            {item.name === "Notifications" && unreadCount > 0 && (
              <span
                className={cn(
                  "flex items-center justify-center rounded-full font-bold text-[10px] bg-[#FF722B] text-white shrink-0 shadow-xs",
                  expanded
                    ? "ml-auto h-5 min-w-[20px] px-1.5"
                    : "absolute -top-1 -right-1 h-4 w-4 text-[9px]"
                )}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Desktop Animated Sidebar ───────────────────── */}
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 264 : 76,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => {
          if (!isPinned) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (!isPinned) setIsHovered(false);
        }}
        className={cn(
          "hidden md:flex md:flex-col justify-between p-3.5 sticky top-0 h-screen",
          "border-r border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#0E121B]",
          "z-30 shrink-0 select-none overflow-x-hidden overflow-y-auto scrollbar-hide shadow-xs"
        )}
        aria-label="Main desktop navigation"
      >
        <div className="space-y-4">
          {/* Header row: Brand logo + Pin toggle */}
          <div className="flex items-center justify-between px-1 pt-1 h-10">
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Logo size="sm" href="/dashboard" />
              </motion.div>
            ) : (
              <Link
                href="/dashboard"
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF722B] to-[#FF9054] text-white flex items-center justify-center font-black text-base shadow-md shadow-[#FF722B]/20 mx-auto"
                title="CampusCoin Cockpit"
              >
                CC
              </Link>
            )}

            {/* Toggle collapse / pin button */}
            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? "Collapse sidebar" : "Pin sidebar expanded"}
                className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white transition-colors"
                aria-label="Toggle sidebar width"
              >
                {isPinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* User profile capsule */}
          {session?.user && (
            <div
              className={cn(
                "rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] transition-all",
                isExpanded ? "p-2.5" : "p-1.5 flex justify-center"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF722B] to-[#FF9054] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs overflow-hidden">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Student"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-w-0 flex-1 overflow-hidden"
                  >
                    <div className="text-xs font-bold text-[#141722] dark:text-white truncate">
                      {session.user.name}
                    </div>
                    <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] truncate">
                      {session.user.email}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {renderNavLinks(isExpanded)}
        </div>

        {/* Footer actions */}
        <div className="space-y-2 pt-3 border-t border-[#EFEAE1] dark:border-[#222938]">
          {/* Admin Switch */}
          {isAdmin && (
            <Link
              href="/admin"
              title="Admin Portal"
              className={cn(
                "flex items-center rounded-2xl py-2 font-bold text-xs transition-colors",
                "bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF722B] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20",
                isExpanded ? "gap-2.5 px-3" : "justify-center px-0"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {isExpanded && <span>Admin Portal</span>}
            </Link>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            id="nav-logout"
            className={cn(
              "w-full flex items-center rounded-2xl py-2.5 text-xs font-semibold transition-colors",
              "text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white",
              isExpanded ? "gap-3 px-3.5" : "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {isExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile Animated Drawer ───────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Slide-In Side Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#FBF9F5] dark:bg-[#0E121B] border-r border-[#EFEAE1] dark:border-[#222938] flex flex-col justify-between p-4 md:hidden shadow-2xl"
              aria-label="Mobile navigation menu"
            >
              <div className="space-y-4">
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE1] dark:border-[#222938]">
                  <Logo size="sm" href="/dashboard" />
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1F2636] transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* User card on mobile */}
                {session?.user && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF722B] to-[#FF9054] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                        {userInitial}
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

                {/* Mobile Links */}
                {renderNavLinks(true)}
              </div>

              {/* Mobile Footer */}
              <div className="space-y-2 pt-4 border-t border-[#EFEAE1] dark:border-[#222938]">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF722B] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Portal</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
