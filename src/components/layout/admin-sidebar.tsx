"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Tags,
  Megaphone,
  History,
  ArrowLeft,
  Activity,
  Layers,
} from "lucide-react";

const adminNavItems = [
  { name: "Overview & Analytics", href: "/admin", icon: Activity },
  { name: "Users & Accounts", href: "/admin/users", icon: Users },
  { name: "Default Categories", href: "/admin/categories", icon: Tags },
  { name: "Announcements & Tips", href: "/admin/saving-tips", icon: Megaphone },
  { name: "Audit Trail & Logs", href: "/admin/system-logs", icon: History },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-amber-500/20 bg-slate-950 text-slate-200 hidden md:flex md:flex-col justify-between p-4 sticky top-0 h-screen shadow-xl shadow-black/20">
      <div>
        {/* Brand */}
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 mb-6 hover:border-amber-500/40 transition-colors"
        >
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Campus Admin</span>
            </div>
            <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mt-0.5">
              TechWiz7 Control
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Governance Modules
        </div>
        <nav className="space-y-1.5">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`admin-nav-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/25"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:border hover:border-slate-800"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-slate-950 font-bold" : "text-amber-400/80"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Exit Link */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <div className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>Admin Mode Active</span>
          </div>
          All changes immediately reflect in live student ledgers and queries.
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" />
          <span>Exit to Student Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
