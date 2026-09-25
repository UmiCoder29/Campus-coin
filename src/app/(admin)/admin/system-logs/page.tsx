"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  Shield,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
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
            <h1 className="text-2xl font-black tracking-tight text-white">
              System Audit & Action Trail
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              Prisma AdminActionLog
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable administrative event logging verifying who altered user accounts, categories, or broadcast notices
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Filter & Search ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter logs by action, admin email, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Event Types</option>
          <option value="USER">User Account Operations</option>
          <option value="CATEGORY">Category Alterations</option>
          <option value="ANNOUNCEMENT">Announcements & Broadcasts</option>
        </select>
      </div>

      {/* ── Console / Terminal Viewer ─────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl font-mono text-xs">
        <div className="p-3.5 px-4 bg-slate-900/90 text-slate-300 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-white">admin_audit_trail.log</span>
            <span className="text-[10px] text-slate-500 font-sans">
              ({filteredLogs.length} events logged)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Audit Stream Synchronized</span>
          </div>
        </div>

        <div className="divide-y divide-slate-900">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Querying database audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No audit records match the current filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-amber-400 font-bold shrink-0">
                    [{log.action}]
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200">
                      {log.adminEmail}
                    </span>
                    <span className="text-slate-500 mx-1.5">&bull;</span>
                    <span className="text-slate-400">
                      target: <span className="text-indigo-400">{log.targetType}</span>
                    </span>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1 font-sans">
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
