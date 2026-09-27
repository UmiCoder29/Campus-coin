"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import {
  User,
  Mail,
  GraduationCap,
  Building2,
  IdCard,
  DollarSign,
  PiggyBank,
  Percent,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  Bell,
  AlertTriangle,
  Trash2,
  Save,
  Check,
  Loader2,
  Clock,
  Sparkles,
  BookOpen,
  Wallet,
  X,
} from "lucide-react";

interface ProfileFormData {
  name: string;
  email: string;
  university: string;
  studentId: string;
  academicYear: string;
  currency: string;
  monthlyAllowance: string | number;
  savingsGoal: string | number;
  image: string;
  budgetAlertThreshold: number;
  notifyBudgetAlerts: boolean;
  notifyWeeklySummary: boolean;
  notifySavingTips: boolean;
  updatedAt?: string | null;
}

const PRESET_AVATARS = [
  { id: "initials", label: "Initials", icon: User, color: "from-[#FF722B] to-[#FF9054]" },
  { id: "grad", label: "Graduate", icon: GraduationCap, color: "from-indigo-500 to-purple-600" },
  { id: "spark", label: "Achiever", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  { id: "book", label: "Scholar", icon: BookOpen, color: "from-emerald-500 to-teal-600" },
  { id: "wallet", label: "Saver", icon: Wallet, color: "from-sky-500 to-blue-600" },
];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  // Loading & fetch states
  const [fetching, setFetching] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Profile Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    university: "",
    studentId: "",
    academicYear: "Freshman",
    currency: "USD",
    monthlyAllowance: 0,
    savingsGoal: 0,
    image: "",
    budgetAlertThreshold: 80,
    notifyBudgetAlerts: true,
    notifyWeeklySummary: true,
    notifySavingTips: true,
    updatedAt: null,
  });

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Danger Zone / Account Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch current student profile data on mount
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setFetching(true);
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            const data = json.data;
            setFormData({
              name: data.name || session?.user?.name || "",
              email: data.email || session?.user?.email || "",
              university: data.university || "",
              studentId: data.studentId || "",
              academicYear: data.academicYear || "Freshman",
              currency: data.currency || "USD",
              monthlyAllowance: data.monthlyAllowance !== undefined ? data.monthlyAllowance : 0,
              savingsGoal: data.savingsGoal !== undefined ? data.savingsGoal : 0,
              image: data.image || "",
              budgetAlertThreshold: data.budgetAlertThreshold ?? 80,
              notifyBudgetAlerts: data.notifyBudgetAlerts ?? true,
              notifyWeeklySummary: data.notifyWeeklySummary ?? true,
              notifySavingTips: data.notifySavingTips ?? true,
              updatedAt: data.updatedAt || null,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        if (isMounted) setFetching(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

  // Dynamic live derived values
  const numericAllowance = Math.max(0, Number(formData.monthlyAllowance) || 0);
  const numericSavingsGoal = Math.max(0, Number(formData.savingsGoal) || 0);
  const safeMonthlySpend = Math.max(0, numericAllowance - numericSavingsGoal);
  const dailySpendLimit = (safeMonthlySpend / 30).toFixed(2);
  const savingsTargetRate =
    numericAllowance > 0
      ? Math.min(100, Math.round((numericSavingsGoal / numericAllowance) * 100))
      : 0;

  // Currency symbol helper
  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    CAD: "$",
    AUD: "$",
  };
  const activeSymbol = currencySymbols[formData.currency] || "$";

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErrors({});
    setProfileSuccess(null);

    // Client-side quick checks
    const clientErrors: Record<string, string> = {};
    if (!formData.name.trim()) clientErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      clientErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      clientErrors.email = "Please enter a valid email address";
    }
    if (numericAllowance < 0) {
      clientErrors.monthlyAllowance = "Monthly allowance must be 0 or a positive number";
    }
    if (numericSavingsGoal < 0) {
      clientErrors.savingsGoal = "Savings target must be 0 or a positive number";
    }

    if (Object.keys(clientErrors).length > 0) {
      setProfileErrors(clientErrors);
      setSavingProfile(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          university: formData.university.trim() || null,
          studentId: formData.studentId.trim() || null,
          academicYear: formData.academicYear,
          currency: formData.currency,
          monthlyAllowance: numericAllowance,
          savingsGoal: numericSavingsGoal,
          image: formData.image.trim() || null,
          budgetAlertThreshold: Number(formData.budgetAlertThreshold),
          notifyBudgetAlerts: formData.notifyBudgetAlerts,
          notifyWeeklySummary: formData.notifyWeeklySummary,
          notifySavingTips: formData.notifySavingTips,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors && typeof data.errors === "object") {
          setProfileErrors(data.errors);
        } else {
          setProfileErrors({ general: data.error || "Failed to update profile" });
        }
        return;
      }

      // Success feedback
      setProfileSuccess("Student profile updated successfully");
      if (data.data?.updatedAt) {
        setFormData((prev) => ({ ...prev, updatedAt: data.data.updatedAt }));
      }

      // Update NextAuth session immediately so Header, Sidebar, and Dashboard reflect new info
      await updateSession({
        name: formData.name.trim(),
        email: formData.email.trim(),
        university: formData.university.trim() || null,
        studentId: formData.studentId.trim() || null,
        academicYear: formData.academicYear,
        currency: formData.currency,
        monthlyAllowance: numericAllowance,
        savingsGoal: numericSavingsGoal,
        image: formData.image.trim() || null,
        budgetAlertThreshold: Number(formData.budgetAlertThreshold),
      });

      // Notify other live dashboard views
      window.dispatchEvent(
        new CustomEvent("campus-coin:profile-updated", {
          detail: data.data,
        })
      );

      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err) {
      console.error("Profile update error:", err);
      setProfileErrors({ general: "Network error occurred while saving profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordErrors({});
    setPasswordSuccess(null);

    const clientErrors: Record<string, string> = {};
    if (!currentPassword) {
      clientErrors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      clientErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      clientErrors.newPassword = "New password must be at least 8 characters long";
    }
    if (newPassword !== confirmPassword) {
      clientErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(clientErrors).length > 0) {
      setPasswordErrors(clientErrors);
      setChangingPassword(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors && typeof data.errors === "object") {
          setPasswordErrors(data.errors);
        } else {
          setPasswordErrors({ general: data.error || "Failed to update password" });
        }
        return;
      }

      setPasswordSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordErrors({ general: "Network error occurred while updating password" });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Theme Selection & Persistence
  const handleSelectTheme = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: newTheme.toUpperCase(),
        }),
      });
      await updateSession({ theme: newTheme.toUpperCase() });
    } catch (e) {
      console.warn("Theme DB sync deferred:", e);
    }
  };

  // Handle Notification Toggle Quick Save
  const handleToggleNotification = async (
    key: "notifyBudgetAlerts" | "notifyWeeklySummary" | "notifySavingTips",
    val: boolean
  ) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [key]: val,
        }),
      });
    } catch (e) {
      console.warn("Notification setting sync warning:", e);
    }
  };

  // Handle Permanent Account Deletion
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError("Account password is required to confirm deletion");
      return;
    }

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Failed to delete account. Verify your password.");
        setDeletingAccount(false);
        return;
      }

      // Deletion successful: Sign out student and redirect with notice
      await signOut({ callbackUrl: "/login?deleted=true" });
    } catch (err) {
      console.error("Account deletion error:", err);
      setDeleteError("Network error occurred during account deletion");
      setDeletingAccount(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="h-7 w-7 animate-spin text-[#FF722B] mb-2" />
        <span className="text-xs font-medium">Loading profile preferences...</span>
      </div>
    );
  }

  const userInitial = formData.name ? formData.name.charAt(0).toUpperCase() : "S";

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings & Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your student identity, financial targets, security credentials, and preferences
          </p>
        </div>

        {formData.updatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-800">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Last updated: {new Date(formData.updatedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* ── SECTION 1: Student Account & Academic Profile ─────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B27] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF722B] flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Student Identity & Academic Record
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your collegiate profile information and campus verification details
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Identifier Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Profile avatar & display identifier
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {/* Current Active Preview */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF722B] to-[#FF9054] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 overflow-hidden border-2 border-white dark:border-slate-800">
                {formData.image.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.image}
                    alt={formData.name || "Student"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitial
                )}
              </div>

              {/* Preset Icon Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_AVATARS.map((avatar) => {
                  const Icon = avatar.icon;
                  const isSelected =
                    (avatar.id === "initials" && !formData.image) ||
                    formData.image === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          image: avatar.id === "initials" ? "" : avatar.id,
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#FF722B] bg-orange-50/70 dark:bg-orange-950/40 text-[#FF722B] ring-1 ring-[#FF722B]/30"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{avatar.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom URL Option */}
            <div className="mt-3">
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Or paste a custom avatar image URL (optional)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF722B]"
              />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Chen"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                    profileErrors.name
                      ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                      : "border-slate-300 dark:border-slate-700 focus:ring-[#FF722B]"
                  }`}
                />
              </div>
              {profileErrors.name && (
                <p className="text-[11px] text-rose-500 mt-1">{profileErrors.name}</p>
              )}
            </div>

            {/* Campus Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Campus email address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. student@university.edu"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                    profileErrors.email
                      ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                      : "border-slate-300 dark:border-slate-700 focus:ring-[#FF722B]"
                  }`}
                />
              </div>
              {profileErrors.email ? (
                <p className="text-[11px] text-rose-500 mt-1">{profileErrors.email}</p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Used for sign-in and expense reporting. Uniqueness validated at database level.
                </p>
              )}
            </div>

            {/* University / College */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                University or college
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B]"
                />
              </div>
              {profileErrors.university && (
                <p className="text-[11px] text-rose-500 mt-1">{profileErrors.university}</p>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Student ID number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. STU-94021"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B]"
                />
              </div>
              {profileErrors.studentId && (
                <p className="text-[11px] text-rose-500 mt-1">{profileErrors.studentId}</p>
              )}
            </div>

            {/* Academic Year */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Academic standing
              </label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B]"
              >
                <option value="Freshman">Freshman (1st Year)</option>
                <option value="Sophomore">Sophomore (2nd Year)</option>
                <option value="Junior">Junior (3rd Year)</option>
                <option value="Senior">Senior (4th Year)</option>
                <option value="Graduate">Graduate / Postgrad</option>
              </select>
              {profileErrors.academicYear && (
                <p className="text-[11px] text-rose-500 mt-1">{profileErrors.academicYear}</p>
              )}
            </div>
          </div>

          {/* ── SECTION 2: Financial Profile & Target Allowance ────── */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Allowance & Target Pacing
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calibrate your monthly spending baseline and target savings reserves
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Currency */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF722B]"
                >
                  <option value="USD">USD ($) United States</option>
                  <option value="INR">INR (₹) India</option>
                  <option value="EUR">EUR (€) European Union</option>
                  <option value="GBP">GBP (£) United Kingdom</option>
                  <option value="CAD">CAD ($) Canada</option>
                  <option value="AUD">AUD ($) Australia</option>
                </select>
              </div>

              {/* Monthly Allowance */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly allowance ({activeSymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">
                    {activeSymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.monthlyAllowance}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyAllowance: e.target.value })
                    }
                    placeholder="0"
                    className={`w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                      profileErrors.monthlyAllowance
                        ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                        : "border-slate-300 dark:border-slate-700 focus:ring-[#FF722B]"
                    }`}
                  />
                </div>
                {profileErrors.monthlyAllowance && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {profileErrors.monthlyAllowance}
                  </p>
                )}
              </div>

              {/* Savings Goal */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly savings target ({activeSymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">
                    {activeSymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.savingsGoal}
                    onChange={(e) =>
                      setFormData({ ...formData, savingsGoal: e.target.value })
                    }
                    placeholder="0"
                    className={`w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                      profileErrors.savingsGoal
                        ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                        : "border-slate-300 dark:border-slate-700 focus:ring-[#FF722B]"
                    }`}
                  />
                </div>
                {profileErrors.savingsGoal && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {profileErrors.savingsGoal}
                  </p>
                )}
              </div>
            </div>

            {/* Budget Alert Threshold Slider */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Budget alert notification threshold
                </label>
                <span className="text-xs font-bold text-[#FF722B]">
                  {formData.budgetAlertThreshold}% of budget
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={formData.budgetAlertThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budgetAlertThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-[#FF722B]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                You will be notified immediately whenever your category or monthly spending reaches {formData.budgetAlertThreshold}%.
              </p>
            </div>

            {/* LIVE CALCULATED DERIVED METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Safe monthly spend
                </span>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeSymbol}
                  {safeMonthlySpend.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Allowance minus savings target
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Daily safe limit
                </span>
                <div className="text-lg font-bold text-[#FF722B]">
                  {activeSymbol}
                  {dailySpendLimit}
                  <span className="text-xs font-normal text-slate-500">/day</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Standard 30-day burn rate pace
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Target savings rate
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {savingsTargetRate}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, savingsTargetRate)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Capital retained from allowance
                </p>
              </div>
            </div>
          </div>

          {/* General Error Banner */}
          {profileErrors.general && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{profileErrors.general}</span>
            </div>
          )}

          {/* Inline Success Notice */}
          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Save Profile Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF722B] hover:bg-[#F26118] active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-[#FF722B]/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── SECTION 3: Security & Change Password ─────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B27] p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Security & Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update your account password with current authentication verification
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                  passwordErrors.currentPassword
                    ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-[11px] text-rose-500 mt-1">
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                  passwordErrors.newPassword
                    ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword ? (
              <p className="text-[11px] text-rose-500 mt-1">
                {passwordErrors.newPassword}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Must be at least 8 characters long, matching registration standards.
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm new password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 transition-all ${
                  passwordErrors.confirmPassword
                    ? "border-rose-400 focus:ring-rose-400 bg-rose-50/30"
                    : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-[11px] text-rose-500 mt-1">
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password General Error */}
          {passwordErrors.general && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{passwordErrors.general}</span>
            </div>
          )}

          {/* Password Success */}
          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── SECTION 4: Appearance & Typography ───────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B27] p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Appearance & Typography
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize light and dark display modes and application font scale
          </p>
        </div>

        {/* Theme Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSelectTheme("light")}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              theme === "light"
                ? "border-[#FF722B] bg-orange-50/50 dark:bg-orange-950/40 text-[#FF722B] ring-2 ring-[#FF722B]/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Sun className="h-5 w-5 mb-2" />
            <span>Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme("dark")}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              theme === "dark"
                ? "border-[#FF722B] bg-orange-50/50 dark:bg-orange-950/40 text-[#FF722B] ring-2 ring-[#FF722B]/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Moon className="h-5 w-5 mb-2" />
            <span>Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme("system")}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              theme === "system"
                ? "border-[#FF722B] bg-orange-50/50 dark:bg-orange-950/40 text-[#FF722B] ring-2 ring-[#FF722B]/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Laptop className="h-5 w-5 mb-2" />
            <span>System Default</span>
          </button>
        </div>

        {/* Font Scale Buttons */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Typography and accessibility font scale
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setFontSize("small")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                fontSize === "small"
                  ? "border-[#FF722B] bg-orange-50/50 dark:bg-orange-950/40 text-[#FF722B] ring-1 ring-[#FF722B]/30 font-bold"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <span className="text-xs mb-1 font-bold">A</span>
              <span>Small (14px)</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSize("medium")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                fontSize === "medium"
                  ? "border-[#FF722B] bg-orange-50/50 dark:bg-orange-950/40 text-[#FF722B] ring-1 ring-[#FF722B]/30 font-bold"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <span className="text-sm mb-1 font-bold">A</span>
              <span>Medium (16px)</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSize("large")}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                fontSize === "large"
                  ? "border-[#FF722B] bg-orange-50/50 dark:bg-orange-950/40 text-[#FF722B] ring-1 ring-[#FF722B]/30 font-bold"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <span className="text-base mb-1 font-bold">A</span>
              <span>Large (18px)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: Notification Preferences ───────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B27] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Notification Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure real-time budget warnings and financial digest alerts
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* Budget Alert Toggle */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Budget limit warnings
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive alerts when any category reaches your chosen threshold
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyBudgetAlerts}
                onChange={(e) =>
                  handleToggleNotification("notifyBudgetAlerts", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF722B]"></div>
            </label>
          </div>

          {/* Weekly Summary Toggle */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Weekly summary digest
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive weekly breakdowns of expenditures and allowance balances
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyWeeklySummary}
                onChange={(e) =>
                  handleToggleNotification("notifyWeeklySummary", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF722B]"></div>
            </label>
          </div>

          {/* AI Tips Toggle */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                AI saving tips and anomaly detection
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized collegiate cost-saving suggestions and unusual spend alerts
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifySavingTips}
                onChange={(e) =>
                  handleToggleNotification("notifySavingTips", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF722B]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Danger Zone (Distinct Card) ─────────────── */}
      <div className="rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-700 dark:text-rose-400">
              Danger Zone
            </h2>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
              Permanent and irreversible account operations
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Permanently delete your student profile and all associated data, including recorded transactions, category budgets, personalized saving tips, and activity logs. Once completed, your data cannot be recovered.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setDeleteModalOpen(true);
              setDeletePassword("");
              setDeleteError(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ─────────────────── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-[#161B27] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-base">Confirm Account Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action <strong className="text-rose-600 dark:text-rose-400">cannot be undone</strong>. You are about to permanently delete your account, campus financial ledger, category budgets, and savings history.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm your password to proceed
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showDeletePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-60"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
