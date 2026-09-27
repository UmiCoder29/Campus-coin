"use client";

import React from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[#EFEAE1] dark:border-[#222938] bg-[#F1EFEA] dark:bg-[#181E2D] p-1 text-[#767D8C] dark:text-[#8B96AA]">
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        className={`rounded-full p-1.5 transition-colors cursor-pointer ${
          theme === "light"
            ? "bg-white text-[#FF6422] shadow-xs dark:bg-[#222938] dark:text-[#FF7D42]"
            : "hover:text-[#141722] dark:hover:text-white"
        }`}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        className={`rounded-full p-1.5 transition-colors cursor-pointer ${
          theme === "dark"
            ? "bg-white text-[#FF6422] shadow-xs dark:bg-[#222938] dark:text-[#FF7D42]"
            : "hover:text-[#141722] dark:hover:text-white"
        }`}
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        aria-label="System mode"
        className={`rounded-full p-1.5 transition-colors cursor-pointer ${
          theme === "system"
            ? "bg-white text-[#FF6422] shadow-xs dark:bg-[#222938] dark:text-[#FF7D42]"
            : "hover:text-[#141722] dark:hover:text-white"
        }`}
      >
        <Laptop className="h-4 w-4" />
      </button>
    </div>
  );
}
