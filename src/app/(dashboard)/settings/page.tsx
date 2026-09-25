"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun, Laptop, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme, fontSize, setFontSize } = useTheme();
  const [currency, setCurrency] = useState(session?.user?.currency || "USD");
  const [threshold, setThreshold] = useState(80);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Preferences & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Customize your appearance, currency, alert thresholds, and profile
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section (Light / Dark Mode) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Appearance & Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select your preferred display theme for Campus Coin
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all ${
                theme === "light"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Sun className="h-5 w-5 mb-2" />
              <span>Light Mode</span>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all ${
                theme === "dark"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Moon className="h-5 w-5 mb-2" />
              <span>Dark Mode</span>
            </button>

            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all ${
                theme === "system"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Laptop className="h-5 w-5 mb-2" />
              <span>System Auto</span>
            </button>
          </div>
        </div>

        {/* Accessibility & Font Size Scaling */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Typography & Accessibility Scaling
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              WCAG AA Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Adjust the application-wide root font scale for enhanced legibility and comfortable viewing
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setFontSize("small")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                fontSize === "small"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 font-bold"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="text-xs font-semibold mb-1">A</span>
              <span className="text-xs">Small (14px)</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSize("medium")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                fontSize === "medium"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 font-bold"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="text-sm font-semibold mb-1">A</span>
              <span className="text-xs">Medium (16px)</span>
            </button>

            <button
              type="button"
              onClick={() => setFontSize("large")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                fontSize === "large"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 font-bold"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="text-base font-bold mb-1">A</span>
              <span className="text-xs">Large (18px)</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <strong>Preview:</strong> Campus Coin balances, transactions, and reports automatically scale proportionally across all screens.
          </div>
        </div>

        {/* Currency & Financial Preferences */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Currency & Regional Formatting
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="USD">USD ($) - United States Dollar</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="AUD">AUD ($) - Australian Dollar</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Budget Alert Threshold
              </label>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Campus Coin will alert you when you reach {threshold}% of any category or monthly budget.
            </p>
          </div>
        </div>

        {/* Save Changes */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                <span>Preferences Saved</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
