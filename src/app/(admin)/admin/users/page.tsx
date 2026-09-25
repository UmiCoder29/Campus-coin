"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  KeyRound,
  Eye,
  RefreshCw,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Copy,
  Receipt,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
  university?: string | null;
  studentId?: string | null;
  academicYear?: string | null;
  currency: string;
  createdAt: string;
  transactionCount: number;
  budgetCount: number;
}

interface UserActivityDetail {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    university?: string | null;
    studentId?: string | null;
    academicYear?: string | null;
    monthlyAllowance?: number | null;
    savingsGoal?: number | null;
    currency: string;
    createdAt: string;
  };
  stats: {
    totalTransactions: number;
    totalExpense: number;
    totalIncome: number;
    netBalance: number;
    activeBudgetsCount: number;
    notificationCount: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    merchant?: string | null;
    date: string;
    paymentMethod: string;
    categoryName: string;
    categoryColor: string;
  }>;
  budgets: Array<{
    id: string;
    amount: number;
    month: string;
    period: string;
    categoryName: string;
    categoryColor: string;
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Activity modal
  const [activityModalUser, setActivityModalUser] = useState<UserActivityDetail | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Password reset modal
  const [resetModalData, setResetModalData] = useState<{
    email: string;
    name: string;
    resetToken: string;
    resetLink: string;
    tempPassword?: string | null;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        role: roleFilter,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.totalCount || 0);
      } else {
        throw new Error(json.error || "Failed to load users");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user status (Active <-> Disabled)
  const handleToggleStatus = async (user: AdminUserItem) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update status");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      setActionMsg(`Account for ${user.name} is now ${newStatus}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed");
    }
  };

  // Trigger password reset
  const handleTriggerReset = async (user: AdminUserItem) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_TEMP_PASSWORD" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to trigger reset");

      setResetModalData({
        email: user.email,
        name: user.name,
        resetToken: json.data.resetToken,
        resetLink: json.data.resetLink,
        tempPassword: json.data.tempPassword,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Password reset failed");
    }
  };

  // View user activity summary
  const handleViewActivity = async (userId: string) => {
    try {
      setActivityLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (json.success) {
        setActivityModalUser(json.data);
      } else {
        throw new Error(json.error || "Failed to fetch activity");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not load user activity summary");
    } finally {
      setActivityLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Student & User Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              {totalCount} Total Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search student accounts, view read-only financial activity, manage login status, and trigger password recovery
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Messages */}
      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ─────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, university or student ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students Only</option>
            <option value="ADMIN">Admins Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="DISABLED">Disabled Accounts</option>
          </select>
        </div>
      </div>

      {/* ── Users Table ──────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">Student / User</th>
                <th className="py-3.5 px-4">University & ID</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{u.university || "—"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {u.studentId || "No ID"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.role === "ADMIN"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        }`}
                      >
                        {u.role === "ADMIN" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-semibold">
                        {u.transactionCount} transactions
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {u.budgetCount} budgets &bull; Joined {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {u.status === "ACTIVE" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        )}
                        <span>{u.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Activity Summary */}
                        <button
                          onClick={() => handleViewActivity(u.id)}
                          title="View activity summary"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleTriggerReset(u)}
                          title="Trigger password reset"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>

                        {/* Disable / Enable Toggle */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === "ACTIVE" ? "Deactivate account" : "Reactivate account"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.status === "ACTIVE"
                              ? "text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                              : "text-rose-400 hover:text-emerald-400 hover:bg-emerald-950/40"
                          }`}
                        >
                          {u.status === "ACTIVE" ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 px-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {page} of {totalPages} ({totalCount} users)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: User Read-Only Activity Summary ───── */}
      {activityModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-white">
                  Activity Summary: {activityModalUser.user.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {activityModalUser.user.email} &bull; {activityModalUser.user.university || "Campus User"}
                </p>
              </div>
              <button
                onClick={() => setActivityModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent</span>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  ${activityModalUser.stats.totalExpense.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Income</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ${activityModalUser.stats.totalIncome.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Net Ledger</span>
                <div className="text-base font-bold text-white mt-0.5">
                  ${activityModalUser.stats.netBalance.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div className="space-y-2 mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Transactions (Last 10)
              </h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {activityModalUser.recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      activityModalUser.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2.5 text-slate-400 whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 font-medium text-slate-200">
                            {tx.description}
                          </td>
                          <td className="p-2.5">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: tx.categoryColor }}
                              />
                              {tx.categoryName}
                            </span>
                          </td>
                          <td
                            className={`p-2.5 text-right font-semibold ${
                              tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActivityModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Password Reset Credentials ────────── */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Password Reset Token Ready</h3>
                <p className="text-xs text-slate-400">For user: {resetModalData.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              A secure password reset token has been registered in the database for{" "}
              <strong>{resetModalData.email}</strong>.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Reset Link URL
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${resetModalData.resetLink}`}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(`${window.location.origin}${resetModalData.resetLink}`)
                    }
                    className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 transition-colors"
                    title="Copy reset link"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {resetModalData.tempPassword && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block mb-0.5">
                    Temporary Immediate Password
                  </span>
                  <code className="text-sm font-bold text-white">
                    {resetModalData.tempPassword}
                  </code>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
