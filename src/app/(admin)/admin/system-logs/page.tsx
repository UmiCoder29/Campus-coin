"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";

interface AdminLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
  createdAt: string;
}

export default function AdminSystemLogsPage() {
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (targetTypeFilter !== "ALL") {
        params.set("targetType", targetTypeFilter);
      }
      params.set("limit", "50");

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(query) ||
      l.adminEmail.toLowerCase().includes(query) ||
      l.targetType.toLowerCase().includes(query) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141722] dark:text-white">
              System Audit & Action Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20 uppercase tracking-widest">
              Prisma AdminActionLog
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1">
            Immutable administrative event logging verifying who altered user accounts, categories, or broadcast notices
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white shadow-2xs transition-colors cursor-pointer"
          title="Refresh audit logs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Filter & Search ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767D8C] dark:text-[#8B96AA]" />
          <input
            type="text"
            placeholder="Filter logs by action, admin email, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white placeholder-[#767D8C] dark:placeholder-[#8B96AA] focus:outline-none focus:border-[#FF6422] shadow-2xs"
          />
        </div>

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF6422] shadow-2xs cursor-pointer"
        >
          <option value="ALL">All Event Types</option>
          <option value="USER">User Account Operations</option>
          <option value="CATEGORY">Category Alterations</option>
          <option value="ANNOUNCEMENT">Announcements & Broadcasts</option>
        </select>
      </div>

      {/* ── Console / Terminal Viewer ─────────────────── */}
      <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] overflow-hidden shadow-xs text-xs">
        <div className="p-4 bg-[#FBF9F5] dark:bg-[#0E121B] text-[#525866] dark:text-[#94A0B8] flex items-center justify-between border-b border-[#EFEAE1] dark:border-[#222938]">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#FF6422]" />
            <span className="font-bold text-[#141722] dark:text-white font-mono">admin_audit_trail.log</span>
            <span className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-sans">
              ({filteredLogs.length} events logged)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audit Stream Synchronized</span>
          </div>
        </div>

        <div className="divide-y divide-[#EFEAE1] dark:divide-[#222938]">
          {loading ? (
            <div className="p-12 text-center text-[#767D8C] dark:text-[#8B96AA]">
              Querying database audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-[#767D8C] dark:text-[#8B96AA]">
              No audit records match the current filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FBF9F5]/70 dark:hover:bg-[#1E2536]/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-[#FF6422] font-bold font-mono text-xs shrink-0">
                    [{log.action}]
                  </span>
                  <div>
                    <span className="font-semibold text-[#141722] dark:text-white">
                      {log.adminEmail}
                    </span>
                    <span className="text-[#767D8C] dark:text-[#8B96AA] mx-1.5">|</span>
                    <span className="text-[#767D8C] dark:text-[#8B96AA]">
                      target: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{log.targetType}</span>
                    </span>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <span className="text-[#525866] dark:text-[#94A0B8] text-[11px] font-mono bg-[#FBF9F5] dark:bg-[#0E121B] px-2 py-0.5 rounded-md border border-[#EFEAE1] dark:border-[#222938] block sm:inline sm:ml-2 mt-1 sm:mt-0">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA] shrink-0 flex items-center gap-1 font-sans">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
