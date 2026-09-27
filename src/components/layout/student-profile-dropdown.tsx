"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Edit3,
  Settings,
  Check,
  Loader2,
  X,
  Building2,
  IdCard,
  Target,
  RefreshCw,
} from "lucide-react";
import gsap from "gsap";

interface LiveFinancialStats {
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  allTimeIncome: number;
  allTimeExpense: number;
  allTimeNetBalance: number;
  monthName: string;
}

interface UserProfileDetails {
  name: string;
  email: string;
  university: string;
  studentId: string;
  academicYear: string;
  monthlyAllowance: number;
  savingsGoal: number;
  currency: string;
  image?: string | null;
}

export function StudentProfileDropdown() {
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Live Database Financial Stats
  const [stats, setStats] = useState<LiveFinancialStats | null>(null);

  // Live Database Profile Details
  const [profile, setProfile] = useState<UserProfileDetails>({
    name: session?.user?.name || "Student",
    email: session?.user?.email || "",
    university: "",
    studentId: "",
    academicYear: "Freshman",
    monthlyAllowance: 0,
    savingsGoal: 0,
    currency: "USD",
    image: session?.user?.image,
  });

  // Edit form state
  const [formData, setFormData] = useState({
    name: "",
    university: "",
    studentId: "",
    academicYear: "Freshman",
    monthlyAllowance: 0,
    savingsGoal: 0,
  });

  // Fetch actual data from PostgreSQL database
  const fetchLiveDatabaseData = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      setError(null);

      // Concurrently fetch both live stats and live user profile from real DB
      const [statsRes, profileRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/user/profile"),
      ]);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success && statsJson.data) {
          const d = statsJson.data;
          setStats({
            monthIncome: Number(d.monthIncome ?? 0),
            monthExpense: Number(d.monthExpense ?? 0),
            monthNet: Number(d.monthNet ?? 0),
            allTimeIncome: Number(d.allTimeIncome ?? 0),
            allTimeExpense: Number(d.allTimeExpense ?? 0),
            allTimeNetBalance: Number(d.allTimeNetBalance ?? 0),
            monthName: d.monthName || "This Month",
          });
        }
      }

      if (profileRes.ok) {
        const profileJson = await profileRes.json();
        if (profileJson.success && profileJson.data) {
          const p = profileJson.data;
          const userDetails: UserProfileDetails = {
            name: p.name || session?.user?.name || "Student",
            email: p.email || session?.user?.email || "",
            university: p.university || "",
            studentId: p.studentId || "",
            academicYear: p.academicYear || "Freshman",
            monthlyAllowance: Number(p.monthlyAllowance ?? 0),
            savingsGoal: Number(p.savingsGoal ?? 0),
            currency: p.currency || "USD",
            image: p.image || session?.user?.image,
          };
          setProfile(userDetails);
          setFormData({
            name: userDetails.name,
            university: userDetails.university,
            studentId: userDetails.studentId,
            academicYear: userDetails.academicYear,
            monthlyAllowance: userDetails.monthlyAllowance,
            savingsGoal: userDetails.savingsGoal,
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching live database metrics for profile dropdown:", err);
      setError("Unable to load latest financial figures");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchLiveDatabaseData();
    }
  }, [isOpen]);

  // Initial fetch for avatar/profile info
  useEffect(() => {
    if (session?.user) {
      fetchLiveDatabaseData();
    }
  }, [session?.user?.id]);

  // GSAP slide-down animation
  useEffect(() => {
    if (isOpen && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        {
          opacity: 0,
          y: -18,
          scale: 0.97,
          transformOrigin: "top center",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          ease: "power3.out",
        }
      );
    }
  }, [isOpen]);

  // Click outside and Escape key handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsEditing(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Save profile changes to database
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: profile.email || session?.user?.email || "student@campuscoin.dev",
          university: formData.university || null,
          studentId: formData.studentId || null,
          academicYear: formData.academicYear,
          monthlyAllowance: Number(formData.monthlyAllowance || 0),
          savingsGoal: Number(formData.savingsGoal || 0),
          currency: profile.currency || "USD",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      setProfile((prev) => ({
        ...prev,
        name: formData.name,
        university: formData.university,
        studentId: formData.studentId,
        academicYear: formData.academicYear,
        monthlyAllowance: Number(formData.monthlyAllowance || 0),
        savingsGoal: Number(formData.savingsGoal || 0),
      }));

      // Update next-auth session display name
      await updateSession({ name: formData.name });

      // Refresh live database figures
      await fetchLiveDatabaseData();

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  if (!session?.user) return null;

  const displayName = profile.name || session.user.name || "Student";
  const userInitial = displayName.charAt(0).toUpperCase();
  const roleLabel = session.user.role?.toLowerCase() || "student";

  // Calculate actual savings progress percentage
  const actualSavingsBalance = stats ? stats.allTimeNetBalance : 0;
  const savingsGoalTarget = profile.savingsGoal || 0;
  const savingsProgressPct =
    savingsGoalTarget > 0 ? Math.min(Math.round((actualSavingsBalance / savingsGoalTarget) * 100), 100) : null;

  return (
    <div ref={containerRef} className="relative">
      {/* ── Header Trigger Pill (Evaluator Student / Student) ── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsEditing(false);
        }}
        aria-expanded={isOpen}
        aria-label="Toggle student profile panel"
        className={`flex items-center gap-2.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? "bg-[#F3EFE7] dark:bg-[#1E2536]"
            : "hover:bg-[#F3EFE7]/70 dark:hover:bg-[#1E2536]/70"
        }`}
      >
        {/* Avatar circle */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF722B] to-[#FF9054] flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-[#FF722B]/30 transition-all">
          {profile.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.image} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>

        {/* Text information */}
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-[#141722] dark:text-white leading-tight truncate max-w-[140px]">
            {displayName}
          </div>
          <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] capitalize flex items-center gap-1">
            <span>{roleLabel}</span>
            <ChevronDown
              className={`h-3 w-3 text-[#767D8C] transition-transform duration-200 ${
                isOpen ? "rotate-180 text-[#FF722B]" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* ── Animated Slide-Down Dropdown Panel ─────────────────── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-3 w-[92vw] sm:w-[420px] max-w-[440px] z-50 rounded-3xl bg-white dark:bg-[#121624] border border-[#E7E1D6] dark:border-[#222938] shadow-2xl p-5 text-[#141722] dark:text-white backdrop-blur-xl"
          style={{ willChange: "transform, opacity" }}
        >
          {/* Top Panel Bar: User Info & Close / Refresh */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#F3EFE7] dark:border-[#222938]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF722B] to-[#FFA64D] flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.image}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black font-heading text-[#141722] dark:text-white truncate">
                    {displayName}
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
                    Live Account
                  </span>
                </div>
                <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] truncate mt-0.5">
                  {profile.email}
                </p>
                {(profile.university || profile.studentId) && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#525866] dark:text-[#94A0B8] mt-1 font-medium">
                    {profile.university && (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <Building2 className="h-3 w-3 text-[#FF722B]" />
                        {profile.university}
                      </span>
                    )}
                    {profile.studentId && (
                      <span className="flex items-center gap-1">
                        <IdCard className="h-3 w-3 text-[#FF722B]" />
                        {profile.studentId}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchLiveDatabaseData}
                disabled={loading}
                title="Refresh live figures"
                className="p-1.5 rounded-xl text-[#767D8C] hover:text-[#141722] dark:hover:text-white hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#FF722B]" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-xl text-[#767D8C] hover:text-[#141722] dark:hover:text-white hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── VIEW 1: LIVE DATABASE STATS (Accurate from PostgreSQL) ── */}
          {!isEditing ? (
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#141722] dark:text-white font-heading flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Actual Ledger Pulse ({stats?.monthName || "Current Month"})
                  </span>
                  <span className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-mono">
                    PostgreSQL Aggregated
                  </span>
                </div>

                {loading && !stats ? (
                  <div className="py-8 text-center text-xs text-[#767D8C] dark:text-[#8B96AA] flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF722B]" />
                    <span>Computing actual database sums...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Actual Income */}
                    <div className="p-3 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                        <span>Income</span>
                      </div>
                      <div className="text-base font-black font-heading text-emerald-700 dark:text-emerald-400 tabular-nums">
                        ${(stats?.monthIncome ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-mono mt-0.5 truncate">
                        +${(stats?.allTimeIncome ?? 0).toFixed(0)} all-time
                      </div>
                    </div>

                    {/* Actual Expense */}
                    <div className="p-3 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">
                        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                        <span>Expense</span>
                      </div>
                      <div className="text-base font-black font-heading text-rose-700 dark:text-rose-400 tabular-nums">
                        ${(stats?.monthExpense ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-mono mt-0.5 truncate">
                        -${(stats?.allTimeExpense ?? 0).toFixed(0)} all-time
                      </div>
                    </div>

                    {/* Actual Net Savings */}
                    <div className="p-3 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#FF722B] dark:text-[#FFA64D] mb-1">
                        <PiggyBank className="h-3.5 w-3.5 shrink-0" />
                        <span>Savings</span>
                      </div>
                      <div
                        className={`text-base font-black font-heading tabular-nums ${
                          (stats?.monthNet ?? 0) >= 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {(stats?.monthNet ?? 0) >= 0 ? "+" : ""}${(stats?.monthNet ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#767D8C] dark:text-[#8B96AA] font-mono mt-0.5 truncate">
                        ${(stats?.allTimeNetBalance ?? 0).toFixed(0)} balance
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Savings Goal Tracker from DB */}
              {savingsGoalTarget > 0 && (
                <div className="p-3 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#141722] dark:text-white flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-[#FF722B]" />
                      <span>Savings Target Goal</span>
                    </span>
                    <span className="font-mono font-bold text-xs text-[#FF722B]">
                      ${actualSavingsBalance.toFixed(0)} / ${savingsGoalTarget.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-[#EAE5DC] dark:bg-[#1E2536] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#FF722B] to-[#FFA64D] h-full rounded-full transition-all duration-700"
                      style={{ width: `${savingsProgressPct ?? 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#767D8C] dark:text-[#8B96AA] mt-1 font-mono">
                    <span>{savingsProgressPct}% reached</span>
                    <span>
                      {actualSavingsBalance >= savingsGoalTarget
                        ? "Goal Achieved!"
                        : `$${(savingsGoalTarget - actualSavingsBalance).toFixed(0)} remaining`}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Profile Actions: Edit Profile + Settings */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#FF722B] hover:bg-[#F26118] text-white font-bold text-xs shadow-md shadow-[#FF722B]/20 transition-all cursor-pointer active:scale-98"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>

                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-2xl bg-[#F5F1EA] hover:bg-[#ECE5D9] dark:bg-[#1E2536] dark:hover:bg-[#252E42] text-[#141722] dark:text-white font-semibold text-xs border border-[#E2DBD0] dark:border-[#2A3448] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Footer row: Sign Out */}
              <div className="pt-2 border-t border-[#F3EFE7] dark:border-[#222938] flex items-center justify-between text-xs text-[#767D8C] dark:text-[#8B96AA]">
                <span className="text-[11px]">Campus Coin Ledger v2.4</span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── VIEW 2: INLINE PROFILE EDITOR ─────────────────────── */
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-sm text-[#141722] dark:text-white font-heading">
                  Edit Student Profile
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#767D8C] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  <span>Profile updated in database!</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF722B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                    University / College
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stanford University"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF722B]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STU-99214"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF722B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                    Academic Year
                  </label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF722B]"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                    Savings Target ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.savingsGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, savingsGoal: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF722B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                    Monthly Allowance ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.monthlyAllowance}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyAllowance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF722B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                    Campus Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.email}
                    className="w-full px-3 py-2 rounded-xl bg-[#F3EFE7]/50 dark:bg-[#151A26] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#767D8C] dark:text-[#8B96AA] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-[#EFEAE1] dark:border-[#222938] text-xs font-semibold text-[#767D8C] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#FF722B] hover:bg-[#F26118] text-white text-xs font-bold shadow-md shadow-[#FF722B]/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <span>Save to Database</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
