"use client";

import React from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useCinematicNavigation } from "@/components/transitions/cinematic-page-transition";

export function AuthHeader() {
  const { cinematicNavigate } = useCinematicNavigation();

  return (
    <header className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-[#EFEAE1] dark:border-[#1E2536] bg-white/70 dark:bg-[#0A0D14]/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <button
        type="button"
        onClick={() => cinematicNavigate("/")}
        className="inline-flex items-center gap-2 cursor-pointer focus:outline-none group text-left"
        aria-label="Back to CampusCoin Home"
      >
        <div className="relative inline-flex items-center">
          <Image
            src="/Images/lightmode-logo.png"
            alt="Campus Coin"
            width={160}
            height={38}
            priority
            className="h-8 sm:h-9 w-auto object-contain block dark:hidden group-hover:opacity-90 transition-opacity"
          />
          <Image
            src="/Images/Darkmode-logo.png"
            alt="Campus Coin"
            width={160}
            height={38}
            priority
            className="h-8 sm:h-9 w-auto object-contain hidden dark:block group-hover:opacity-90 transition-opacity"
          />
        </div>
      </button>

      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
