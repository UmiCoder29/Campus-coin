"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CampusAiAssistant } from "@/components/ai/campus-ai-assistant";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#FBF9F5] dark:bg-[#0E121B] text-[#141722] dark:text-[#F2F5F9] transition-colors">
      {/* Sidebar (desktop persistent + mobile drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Nav (mobile only) */}
      <BottomNav />

      {/* Hover-triggered AI Assistant Panel (slim right-edge tab) */}
      <CampusAiAssistant />
    </div>
  );
}
