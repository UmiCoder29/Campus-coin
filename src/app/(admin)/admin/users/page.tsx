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
  Check,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
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
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    date: string;
    categoryName: string;
    categoryColor: string;
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Notifications
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail Modal
  const [activityModalUser, setActivityModalUser] = useState<UserActivityDetail | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Password Reset Modal
  const [resetModalData, setResetModalData] = useState<{
    email: string;
    name: string;
    resetToken?: string;
    resetLink?: string;
    tempPassword?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  // View read-only student activity
  const handleViewActivity = async (userId: string) => {
    try {
      setActivityLoading(true);
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (json.success) {
        setActivityModalUser(json.data);
      } else {
        throw new Error(json.error || "Failed to load activity");
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
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141722] dark:text-white">
              Student & User Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20 uppercase tracking-widest">
              {totalCount} Total Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1">
            Search student accounts, view read-only financial activity, manage login status, and trigger password recovery
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Messages */}
      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-xs">
          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-rose-900 dark:hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ─────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#767D8C] dark:text-[#8B96AA]" />
          <input
            type="text"
            placeholder="Search by name, email, university or student ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white placeholder-[#767D8C] dark:placeholder-[#8B96AA] focus:outline-none focus:border-[#FF6422] dark:focus:border-[#FF7D42] shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-xs font-medium text-[#141722] dark:text-white focus:outline-none focus:border-[#FF6422] shadow-2xs"
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
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-xs font-medium text-[#141722] dark:text-white focus:outline-none focus:border-[#FF6422] shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="DISABLED">Disabled Accounts</option>
          </select>
        </div>
      </div>

      {/* ── Users Table ──────────────────────────────── */}
      <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#0E121B] uppercase tracking-wider text-[#767D8C] dark:text-[#8B96AA] font-bold">
              <tr>
                <th className="py-3.5 px-4">Student / User</th>
                <th className="py-3.5 px-4">University & ID</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEAE1] dark:divide-[#222938]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#767D8C] dark:text-[#8B96AA]">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#767D8C] dark:text-[#8B96AA]">
                    No matching accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F3EFE7]/50 dark:hover:bg-[#1E2536]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#141722] dark:text-white text-xs">{u.name}</div>
                      <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#525866] dark:text-[#94A0B8]">
                      <div>{u.university || "—"}</div>
                      <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA] font-mono">
                        {u.studentId || "No ID"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.role === "ADMIN"
                            ? "bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] border-orange-200 dark:border-orange-500/20"
                            : "bg-[#EEF2FF] dark:bg-[#4F46E5]/20 text-[#4F46E5] dark:text-[#818CF8] border-indigo-200 dark:border-indigo-500/20"
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

                    <td className="py-3.5 px-4 text-[#525866] dark:text-[#94A0B8]">
                      <div className="font-semibold text-[#141722] dark:text-white">
                        {u.transactionCount} transactions
                      </div>
                      <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                        {u.budgetCount} budgets | Joined {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{u.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Activity Summary */}
                        <button
                          onClick={() => handleViewActivity(u.id)}
                          title="View activity summary"
                          className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleTriggerReset(u)}
                          title="Trigger password reset"
                          className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-[#FF6422] dark:hover:text-[#FF7D42] hover:bg-[#FFEFE6] dark:hover:bg-[#FF6422]/10 transition-colors cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>

                        {/* Disable / Enable Toggle */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === "ACTIVE" ? "Deactivate account" : "Reactivate account"}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                            u.status === "ACTIVE"
                              ? "text-[#767D8C] dark:text-[#8B96AA] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              : "text-rose-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
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
        <div className="p-3.5 px-4 border-t border-[#EFEAE1] dark:border-[#222938] bg-[#FBF9F5] dark:bg-[#0E121B] flex items-center justify-between text-xs text-[#767D8C] dark:text-[#8B96AA]">
          <span>
            Page {page} of {totalPages} ({totalCount} users)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: User Read-Only Activity Summary ───── */}
      {activityModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl text-[#141722] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE1] dark:border-[#222938] mb-4">
              <div>
                <h3 className="font-bold text-base text-[#141722] dark:text-white">
                  Activity Summary: {activityModalUser.user.name}
                </h3>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA]">
                  {activityModalUser.user.email} | {activityModalUser.user.university || "Campus User"}
                </p>
              </div>
              <button
                onClick={() => setActivityModalUser(null)}
                className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                <span className="text-[10px] uppercase font-bold text-[#767D8C] dark:text-[#8B96AA]">Total Spent</span>
                <div className="text-base font-black text-rose-500 mt-0.5">
                  ${activityModalUser.stats.totalExpense.toFixed(2)}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                <span className="text-[10px] uppercase font-bold text-[#767D8C] dark:text-[#8B96AA]">Total Income</span>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${activityModalUser.stats.totalIncome.toFixed(2)}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                <span className="text-[10px] uppercase font-bold text-[#767D8C] dark:text-[#8B96AA]">Net Ledger</span>
                <div className="text-base font-black text-[#141722] dark:text-white mt-0.5">
                  ${activityModalUser.stats.netBalance.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div className="space-y-2 mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#767D8C] dark:text-[#8B96AA]">
                Recent Transactions (Last 10)
              </h4>
              <div className="rounded-2xl border border-[#EFEAE1] dark:border-[#222938] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBF9F5] dark:bg-[#0E121B] text-[#767D8C] dark:text-[#8B96AA] font-bold border-b border-[#EFEAE1] dark:border-[#222938]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE1] dark:divide-[#222938] bg-white dark:bg-[#161B27]">
                    {activityModalUser.recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-[#767D8C] dark:text-[#8B96AA]">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      activityModalUser.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2.5 text-[#767D8C] dark:text-[#8B96AA] whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 font-medium text-[#141722] dark:text-white">
                            {tx.description}
                          </td>
                          <td className="p-2.5">
                            <span className="flex items-center gap-1.5 text-[#525866] dark:text-[#94A0B8]">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: tx.categoryColor }}
                              />
                              {tx.categoryName}
                            </span>
                          </td>
                          <td
                            className={`p-2.5 text-right font-bold ${
                              tx.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
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

            <div className="pt-3 border-t border-[#EFEAE1] dark:border-[#222938] flex justify-end">
              <button
                onClick={() => setActivityModalUser(null)}
                className="px-4 py-2 rounded-2xl bg-[#181C28] hover:bg-[#252C3D] dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#181C28] text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Password Reset Credentials ────────── */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] rounded-3xl p-6 max-w-md w-full shadow-2xl text-[#141722] dark:text-white">
            <div className="flex items-center gap-3 text-[#FF6422] dark:text-[#FF7D42] mb-3">
              <div className="p-2.5 rounded-2xl bg-[#FFEFE6] dark:bg-[#FF6422]/20 border border-orange-200 dark:border-orange-500/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#141722] dark:text-white">Password Reset Token Ready</h3>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA]">For user: {resetModalData.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#525866] dark:text-[#94A0B8] mb-4 leading-relaxed">
              A secure password reset token has been registered in the database for{" "}
              <strong>{resetModalData.email}</strong>.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-[#767D8C] dark:text-[#8B96AA] mb-1">
                  Reset link URL
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${resetModalData.resetLink}`}
                    className="flex-1 px-3 py-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white font-mono"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(`${window.location.origin}${resetModalData.resetLink}`)
                    }
                    className="p-2.5 rounded-2xl bg-[#FF6422] hover:bg-[#E55519] text-white font-bold transition-colors cursor-pointer"
                    title="Copy reset link"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {resetModalData.tempPassword && (
                <div className="p-3.5 rounded-2xl bg-[#FFEFE6] dark:bg-[#FF6422]/10 border border-orange-200 dark:border-orange-500/20">
                  <span className="text-[10px] font-bold uppercase text-[#FF6422] dark:text-[#FF7D42] block mb-0.5">
                    Temporary Immediate Password
                  </span>
                  <code className="text-sm font-bold text-[#141722] dark:text-white">
                    {resetModalData.tempPassword}
                  </code>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EFEAE1] dark:border-[#222938] flex justify-end">
              <button
                onClick={() => setResetModalData(null)}
                className="px-4 py-2 rounded-2xl bg-[#FF6422] hover:bg-[#E55519] text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
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
