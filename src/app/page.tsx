"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Wallet,
  PieChart,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  Sun,
  Moon,
  AlertTriangle,
  Coffee,
  BookOpen,
  Wifi,
  ShoppingBag,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useCinematicNavigation } from "@/components/transitions/cinematic-page-transition";

export default function HomePage() {
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { cinematicNavigate } = useCinematicNavigation();
  const [mounted, setMounted] = useState(false);

  // Interactive demo state for live category burn demo
  const [activeTab, setActiveTab] = useState<"daily" | "roommates" | "categories">("daily");

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#141722] dark:bg-[#0E121B] dark:text-[#F2F5F9] transition-colors duration-300 selection:bg-[#FFE862] selection:text-black pb-28 sm:pb-36"
    >
      {/* ── Top Header with Logo in Top Middle ───────────────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-[#0E121B]/85 border-b border-[#EFEAE1] dark:border-[#222938] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Campus branding & Quick nav */}
          <div className="flex items-center gap-4 sm:gap-6 w-1/3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 shrink-0">
              <GraduationCap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Campus Edition</span>
            </span>
            <span className="hidden lg:block w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a
                href="#features"
                className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Workflow
              </a>
              <a
                href="#faq"
                className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                FAQ
              </a>
            </nav>
          </div>

          {/* Center: Logo in the Top Middle */}
          <div className="flex justify-center items-center w-1/3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center justify-center p-1 rounded-xl focus:outline-none transition-transform hover:scale-[1.03] cursor-pointer"
              aria-label="CampusCoin Home"
            >
              <div className="relative inline-flex items-center">
                {/* Light Mode Logo */}
                <Image
                  src="/Images/lightmode-logo.png"
                  alt="Campus Coin Logo"
                  width={180}
                  height={44}
                  priority
                  className="h-9 sm:h-11 w-auto object-contain block dark:hidden"
                />
                {/* Dark Mode Logo */}
                <Image
                  src="/Images/Darkmode-logo.png"
                  alt="Campus Coin Logo"
                  width={180}
                  height={44}
                  priority
                  className="h-9 sm:h-11 w-auto object-contain hidden dark:block"
                />
              </div>
            </button>
          </div>

          {/* Right: Actions & Theme toggle */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 w-1/3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {session?.user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-500/25 transition-all"
              >
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => cinematicNavigate("/login")}
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => cinematicNavigate("/register")}
                  className="inline-flex items-center px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all cursor-pointer"
                >
                  <span>Student Registration</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1">
        {/* ── Hero Section ───────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1] mb-6">
              Master Your Student Budget.{" "}
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                Zero Stress, Complete Clarity.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Track dining hall allowances, split dorm utility bills with roommates, set monthly
              category limits, and finish every semester with confidence.
            </p>

            {/* CTA Buttons with Smooth Cinematic Transition */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                type="button"
                onClick={() => cinematicNavigate("/register")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Student Registration</span>
              </button>

              <button
                type="button"
                onClick={() => cinematicNavigate("/login")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 font-semibold text-base border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Sign in to Account</span>
              </button>
            </div>

            {/* ── ACTUAL APPLICATION DEMO SHOWCASE ──────────────── */}
            <div className="relative mx-auto max-w-4xl">
              <div className="relative rounded-3xl p-2 sm:p-4 bg-white/70 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl">
                {/* Window Chrome Bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200/60 dark:border-slate-800 mb-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-400/80 inline-block" />
                  </div>
                  <div className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>campus-coin.app / student-overview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <span>Live Ledger</span>
                    </span>
                  </div>
                </div>

                {/* Video container */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-inner flex items-center justify-center">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-2xl"
                    poster="/Images/lightmode-logo.png"
                  >
                    <source src="/videos/student_budget_chart_anim.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Floating Metric 1: Monthly Allowance Balance */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/50 dark:border-slate-700/60 shadow-xl hidden sm:flex items-center gap-3 text-left">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Monthly allowance
                      </div>
                      <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                        $450.00 / $600.00
                      </div>
                    </div>
                  </div>

                  {/* Floating Metric 2: Daily Safe Pace */}
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/50 dark:border-slate-700/60 shadow-xl hidden sm:flex items-center gap-3 text-left">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Daily safe pace
                      </div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        $18.50 / day remaining
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AUTHENTIC PRODUCT FEATURES (Zero stock photos, 100% genuine UI) ────── */}
        <section
          id="features"
          className="scroll-mt-24 py-20 bg-white/60 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-heading">
                Real campus functionality
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
                Designed for dorm rooms, dining halls, and semester life
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-3 text-base sm:text-lg">
                No corporate finance clutter. Just the four tools you need to stay in control of
                your college allowance.
              </p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 gap-1 text-xs sm:text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("daily")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === "daily"
                      ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Daily Burn Rate
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("roommates")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === "roommates"
                      ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Roommate Splitting
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === "categories"
                      ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Category Limits
                </button>
              </div>
            </div>

            {/* Tab 1: Daily Burn Rate Interactive Demo */}
            {activeTab === "daily" && (
              <div className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg animate-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-6 space-y-4 text-left">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Live Daily Pace Calculator</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Never wonder if you can afford lunch this Friday.
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      CampusCoin dynamically divides your remaining semester allowance by the days
                      left in the month. As you log meals and transit, your safe spending limit
                      adjusts automatically.
                    </p>
                    <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Updates in real-time with every logged transaction</span>
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          Today&apos;s allowance pace
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          On Track
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-3xl font-black text-slate-900 dark:text-white">$18.50</div>
                          <div className="text-[11px] text-slate-500">Remaining for today</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">$6.50 spent</div>
                          <div className="text-[11px] text-slate-400">Morning Coffee & Bagel</div>
                        </div>
                      </div>
                      {/* Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "26%" }} />
                      </div>
                      <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Month Allowance:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">$500.00</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400">Days Remaining:</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">18 Days</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Roommate Splitting Interactive Demo */}
            {activeTab === "roommates" && (
              <div className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg animate-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-6 space-y-4 text-left">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Shared Dorm Ledger</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Split rent, groceries & Wi-Fi without awkwardness.
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Log shared expenses in seconds. CampusCoin calculates equal splits between
                      roommates so everyone knows who paid what, eliminating friction.
                    </p>
                    <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Transparent history prevents repeat bill arguments</span>
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                        <span>Recent shared dorm expenses</span>
                        <span>Split (3 people)</span>
                      </div>

                      {/* Item 1 */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600">
                            <Wifi className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              High-Speed Dorm Wi-Fi
                            </div>
                            <div className="text-[10px] text-slate-400">Paid by Alex</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">$45.00</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            $15.00 / person
                          </div>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Hostel Grocery Bulk Run
                            </div>
                            <div className="text-[10px] text-slate-400">Paid by Jordan</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">$75.00</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            $25.00 / person
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Category Limits Interactive Demo */}
            {activeTab === "categories" && (
              <div className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg animate-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-6 space-y-4 text-left">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                      <PieChart className="w-3.5 h-3.5" />
                      <span>Visual Category Budgets</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      Custom limits for food, books, transport & social.
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      Set monthly spending caps per category. Get alerted at 80% so you never
                      accidentally blow your textbook fund on weekend takeout.
                    </p>
                    <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-orange-600 dark:text-orange-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Custom color coding and icon categories</span>
                    </div>
                  </div>

                  <div className="md:col-span-6">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
                      {/* Category 1 */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5 text-amber-500" />
                            <span>Campus Dining & Cafeteria</span>
                          </span>
                          <span>$140 / $200 (70%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: "70%" }} />
                        </div>
                      </div>

                      {/* Category 2 */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            <span>Textbooks & Lab Supplies</span>
                          </span>
                          <span>$65 / $120 (54%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: "54%" }} />
                        </div>
                      </div>

                      {/* Category 3 */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Weekend Social & Outings</span>
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-extrabold">
                            $92 / $100 (92% Alert)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full" style={{ width: "92%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 3-STEP WORKFLOW ─────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-24 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-heading">
              Simple 30-second setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
              How CampusCoin Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-base">
              No complex bank linking required. Full privacy, full control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-lg mb-5">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Set Your Allowance
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                Define your monthly stipend and your target savings goal in USD, EUR, GBP, or your
                local currency.
              </p>
            </div>

            <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg mb-5">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Log Campus Expenses
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                Enter cafeteria snacks, transit cards, or shared rent in 2 taps. Attach receipts or
                notes whenever you want.
              </p>
            </div>

            <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg mb-5">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Export & Review
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                Download monthly PDF summaries or spreadsheet reports to verify balances or share
                with sponsors.
              </p>
            </div>
          </div>
        </section>

        {/* ── FREQUENTLY ASKED QUESTIONS ─────────────────── */}
        <section id="faq" className="scroll-mt-24 py-20 bg-slate-100/50 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-heading">
                Student questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Do I need to connect my actual bank account?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  No. CampusCoin operates as a private, secure student ledger. You input your
                  allowance and expenses manually or via 1-click batch import without sharing bank
                  passwords.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Can I track expenses in my local university currency?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Yes! CampusCoin supports USD, EUR, GBP, CAD, AUD, INR, and VND, and allows you to
                  change your baseline currency anytime from settings.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  Can I export my spending records for scholarship review?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Yes, you can generate comprehensive PDF monthly reports and clean CSV exports with
                  category breakdowns and audit timestamps.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HIGH-CONVERTING BOTTOM CALL TO ACTION ─────────── */}
        <section className="py-20 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="relative rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-8 sm:p-12 text-white shadow-2xl overflow-hidden">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
                Take control of your campus budget today.
              </h2>
              <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                Join students who are saving more, stressing less, and building real financial
                discipline across university life.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => cinematicNavigate("/register")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-orange-600 font-bold text-sm shadow-xl hover:bg-orange-50 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Registration</span>
                </button>
                <button
                  type="button"
                  onClick={() => cinematicNavigate("/login")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-orange-700/50 border border-white/30 text-white font-semibold text-sm hover:bg-orange-700/70 transition-all cursor-pointer"
                >
                  <span>Sign in to Account</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-[#EFEAE1] dark:border-[#222938] bg-white/40 dark:bg-slate-950/60 py-10 text-sm text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <div className="relative inline-flex items-center">
              <Image
                src="/Images/lightmode-logo.png"
                alt="Campus Coin"
                width={140}
                height={32}
                className="h-7 w-auto object-contain block dark:hidden"
              />
              <Image
                src="/Images/Darkmode-logo.png"
                alt="Campus Coin"
                width={140}
                height={32}
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </div>
            <p className="text-xs text-slate-500">
              Collegiate Expense & Allowance Tracker | Built for Modern Campus Life
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs sm:text-sm font-medium">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => cinematicNavigate("/login")}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => cinematicNavigate("/register")}
              className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer"
            >
              Student Registration
            </button>
          </div>

          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} CampusCoin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
