"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileSpreadsheet,
  Mail,
  Edit2,
  PlusCircle,
  Tag,
  ExternalLink,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import Link from "next/link";

interface RecentTransaction {
  id: string;
  amount: number | string;
  type: "EXPENSE" | "INCOME";
  description: string;
  date: string;
  lastViewedAt?: string | null;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  title: string;
  createdAt: string;
}

export function RecentActivityWidget() {
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "LOG">("TRANSACTIONS");

  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true);
        const res = await fetch("/api/activity");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setRecentTransactions(json.data.recentTransactions || []);
            setActivities(json.data.activities || []);
          }
        }
      } catch (err) {
        console.error("Failed to load user activity:", err);
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, []);

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return "Just now";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getActionIcon = (action: string, entityType: string) => {
    if (action === "EMAIL") return <Mail className="h-3.5 w-3.5 text-indigo-500" />;
    if (action === "IMPORT") return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />;
    if (action === "VIEW") return <Eye className="h-3.5 w-3.5 text-slate-400" />;
    if (action === "CREATE") return <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />;
    if (action === "UPDATE") return <Edit2 className="h-3.5 w-3.5 text-amber-500" />;
    return <Clock className="h-3.5 w-3.5 text-slate-400" />;
  };

  return (
    <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-6 shadow-xs space-y-4">
      {/* ── Widget Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42]">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#141722] dark:text-white">
              Recent Activity & Viewed Items
            </h3>
            <p className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
              Cross-session record trail & recently modified entries
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F3EFE7] dark:bg-[#111520] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "TRANSACTIONS"
                ? "bg-white dark:bg-[#1E2536] text-[#FF6422] dark:text-[#FF7D42] shadow-2xs"
                : "text-[#767D8C] hover:text-[#141722] dark:text-[#8B96AA] dark:hover:text-white"
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LOG")}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              activeTab === "LOG"
                ? "bg-white dark:bg-[#1E2536] text-[#FF6422] dark:text-[#FF7D42] shadow-2xs"
                : "text-[#767D8C] hover:text-[#141722] dark:text-[#8B96AA] dark:hover:text-white"
            }`}
          >
            Action Log
          </button>
        </div>
      </div>

      {/* ── Content View ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
          Loading recent session activity...
        </div>
      ) : activeTab === "TRANSACTIONS" ? (
        recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-1.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: `${tx.category?.color || "#6366F1"}15`,
                      color: tx.category?.color || "#6366F1",
                    }}
                  >
                    <CategoryIcon name={tx.category?.icon || "Tag"} className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{tx.category?.name || "Campus"}</span>
                      <span>&bull;</span>
                      <span>
                        {tx.lastViewedAt
                          ? `Viewed ${formatRelativeTime(tx.lastViewedAt)}`
                          : `Edited ${formatRelativeTime(tx.updatedAt)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-bold flex items-center justify-end gap-0.5 ${
                      tx.type === "INCOME"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </div>
                  <Link
                    href={`/transactions?search=${encodeURIComponent(tx.description)}`}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                  >
                    <span>View</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No recently viewed transactions yet. Click into transactions on the ledger to bookmark them in your activity trail.
          </div>
        )
      ) : activities.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {activities.map((act) => (
            <div
              key={act.id}
              className="py-2.5 flex items-center justify-between gap-3 text-xs px-1.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getActionIcon(act.action, act.entityType)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {act.title}
                  </p>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {act.action} &bull; {act.entityType}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                {formatRelativeTime(act.createdAt)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          No audit activity logged yet.
        </div>
      )}
    </div>
  );
}
