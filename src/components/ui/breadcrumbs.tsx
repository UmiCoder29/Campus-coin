"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

/* ─────────────────────────────────────────────
   Route → Label mapping
   ───────────────────────────────────────────── */
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  categories: "Categories",
  budgets: "Budgets",
  reports: "Reports",
  "saving-tips": "Saving Tips",
  notifications: "Notifications",
  settings: "Settings",
  admin: "Admin",
};

function labelFor(segment: string): string {
  return LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

/* ─────────────────────────────────────────────
   Breadcrumbs Component
   ───────────────────────────────────────────── */

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't render breadcrumbs on the dashboard home page itself
  if (segments.length <= 1 && segments[0] === "dashboard") return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto scrollbar-hide"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {labelFor(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {labelFor(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
