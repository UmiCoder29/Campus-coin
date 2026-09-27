"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import {
  Activity,
  Users,
  Tags,
  Megaphone,
  History,
  ArrowLeft,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Admin Navigation Items
   ───────────────────────────────────────────── */

const adminNavItems = [
  { name: "Overview & Analytics", href: "/admin", icon: Activity },
  { name: "Users & Accounts", href: "/admin/users", icon: Users },
  { name: "Default Categories", href: "/admin/categories", icon: Tags },
  { name: "Announcements & Tips", href: "/admin/saving-tips", icon: Megaphone },
  { name: "Audit Trail & Logs", href: "/admin/system-logs", icon: History },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Desktop sidebar expand state
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isPinned || isHovered;

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

  const adminInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A";

  const renderNavLinks = (expanded: boolean) => (
    <nav className="space-y-1 px-1">
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            id={`admin-nav-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
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
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Desktop Admin Animated Sidebar ───────────────────── */}
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
        aria-label="Admin desktop navigation"
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
                <Logo size="sm" href="/admin" />
              </motion.div>
            ) : (
              <Link
                href="/admin"
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF722B] to-[#FF9054] text-white flex items-center justify-center font-black text-base shadow-md shadow-[#FF722B]/20 mx-auto"
                title="Admin Console"
              >
                AD
              </Link>
            )}

            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? "Collapse sidebar" : "Pin sidebar expanded"}
                className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white transition-colors"
                aria-label="Toggle admin sidebar width"
              >
                {isPinned ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Admin profile capsule */}
          {session?.user && (
            <div
              className={cn(
                "rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] transition-all",
                isExpanded ? "p-2.5" : "p-1.5 flex justify-center"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FFEFE6] dark:bg-[#FF6422]/20 text-[#FF722B] dark:text-[#FF7D42] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {adminInitial}
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
                    <div className="text-[10px] text-[#FF722B] dark:text-[#FF7D42] font-semibold truncate">
                      Platform Administrator
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {isExpanded && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#767D8C] dark:text-[#8B96AA]">
              Governance Console
            </div>
          )}
          {renderNavLinks(isExpanded)}
        </div>

        {/* Footer actions */}
        <div className="space-y-2 pt-3 border-t border-[#EFEAE1] dark:border-[#222938]">
          {/* Back to student app */}
          <Link
            href="/dashboard"
            title="Exit to Student Dashboard"
            className={cn(
              "flex items-center rounded-2xl py-2 font-semibold text-xs transition-colors",
              "text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white",
              isExpanded ? "gap-2.5 px-3" : "justify-center px-0"
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-[#FF722B]" />
            {isExpanded && <span>Exit to Student App</span>}
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            title="Sign out"
            id="admin-nav-logout"
            className={cn(
              "w-full flex items-center rounded-2xl py-2.5 text-xs font-semibold transition-colors",
              "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20",
              isExpanded ? "gap-3 px-3.5" : "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {isExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile Admin Animated Drawer ───────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#FBF9F5] dark:bg-[#0E121B] border-r border-[#EFEAE1] dark:border-[#222938] flex flex-col justify-between p-4 md:hidden shadow-2xl"
              aria-label="Admin mobile navigation menu"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE1] dark:border-[#222938]">
                  <Logo size="sm" href="/admin" />
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {session?.user && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FFEFE6] dark:bg-[#FF6422]/20 text-[#FF722B] dark:text-[#FF7D42] flex items-center justify-center font-bold text-sm shadow-2xs">
                        {adminInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#141722] dark:text-white truncate">
                          {session.user.name}
                        </div>
                        <div className="text-[10px] text-[#FF722B] dark:text-[#FF7D42] font-semibold truncate">
                          Platform Administrator
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#767D8C] dark:text-[#8B96AA]">
                  Governance Console
                </div>
                {renderNavLinks(true)}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#EFEAE1] dark:border-[#222938]">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536]"
                >
                  <ArrowLeft className="h-4 w-4 text-[#FF722B]" />
                  <span>Exit to Student Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
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

export default AdminSidebar;
