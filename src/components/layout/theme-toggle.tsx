"use client";

import React from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1 text-slate-600 dark:text-slate-300">
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        className={`rounded-full p-1.5 transition-colors ${
          theme === "light"
            ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
            : "hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        className={`rounded-full p-1.5 transition-colors ${
          theme === "dark"
            ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
            : "hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        aria-label="System mode"
        className={`rounded-full p-1.5 transition-colors ${
          theme === "system"
            ? "bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400"
            : "hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
