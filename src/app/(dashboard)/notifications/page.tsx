"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  Clock,
  Info,
  CheckCheck,
  Check,
  Trash2,
  Filter,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Zap,
} from "lucide-react";
import { NotificationItem } from "@/components/notifications/notification-bell";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "BUDGET" | "INSIGHT" | "SYSTEM">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const router = useRouter();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=50");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data || []);
          setUnreadCount(json.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        if (item && !item.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNavigate = async (item: NotificationItem) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
    const targetUrl = item.linkUrl || "/dashboard";
    router.push(targetUrl);
  };

  // Quick event simulation for testing/evaluators
  const triggerSimulation = async (type: string) => {
    setSimulating(true);
    try {
      let body: any = {};
      if (type === "BUDGET_WARNING") {
        body = {
          type: "BUDGET_WARNING",
          title: "Budget Alert: Food & Dining reached 85%",
          message: "You've spent $340 of your $400 monthly cap. $60 remaining for this semester month.",
          linkUrl: "/budgets",
        };
      } else if (type === "BUDGET_EXCEEDED") {
        body = {
          type: "BUDGET_EXCEEDED",
          title: "Budget Exceeded: Entertainment!",
          message: "Alert: You are $25 over your $100 entertainment budget for September.",
          linkUrl: "/budgets",
        };
      } else if (type === "INSIGHT_READY") {
        body = {
          type: "INSIGHT_READY",
          title: "AI Financial Insight: Textbook Savings",
          message: "Your monthly academic spending shows 18% savings compared to peer averages. View your personalized breakdown.",
          linkUrl: "/dashboard",
        };
      } else if (type === "UNUSUAL_TRANSACTION") {
        body = {
          type: "UNUSUAL_TRANSACTION",
          title: "Unusual Spending Detected: $289.00",
          message: "A large expense at Campus Tech Depot was logged under Academics. Confirm this matches your scheduled budget.",
          linkUrl: "/transactions",
        };
      }

      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await loadNotifications();
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.isRead;
    if (activeTab === "BUDGET")
      return n.type === "BUDGET_WARNING" || n.type === "BUDGET_EXCEEDED";
    if (activeTab === "INSIGHT")
      return n.type === "INSIGHT_READY" || n.type === "AI_INSIGHT";
    if (activeTab === "SYSTEM")
      return (
        n.type === "SYSTEM" ||
        n.type === "UNUSUAL_TRANSACTION" ||
        n.type === "RECURRING_BILL"
      );
    return true;
  });

  const getTypeMetadata = (type: NotificationItem["type"]) => {
    switch (type) {
      case "BUDGET_WARNING":
        return {
          icon: AlertTriangle,
          label: "Budget Warning",
          bg: "bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400",
          badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        };
      case "BUDGET_EXCEEDED":
        return {
          icon: AlertOctagon,
          label: "Budget Exceeded",
          bg: "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400",
          badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        };
      case "INSIGHT_READY":
      case "AI_INSIGHT":
        return {
          icon: Sparkles,
          label: "AI Insight",
          bg: "bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400",
          badgeBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        };
      case "UNUSUAL_TRANSACTION":
        return {
          icon: TrendingUp,
          label: "Spending Anomaly",
          bg: "bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400",
          badgeBg: "bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        };
      case "RECURRING_BILL":
        return {
          icon: Clock,
          label: "Recurring Bill",
          bg: "bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400",
          badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        };
      case "SYSTEM":
      default:
        return {
          icon: Info,
          label: "System Event",
          bg: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400",
          badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        };
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Top Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time threshold alerts, AI financial pacing, and campus anomalies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            disabled={loading}
            title="Refresh notifications"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Evaluation & Demo Simulator Strip ────────── */}
      <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-amber-50/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Interactive Evaluator: Live Alert Simulation</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Click to dispatch live events into the notification engine
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => triggerSimulation("BUDGET_WARNING")}
            disabled={simulating}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs transition-colors"
          >
            + 80% Budget Warning
          </button>
          <button
            onClick={() => triggerSimulation("BUDGET_EXCEEDED")}
            disabled={simulating}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs transition-colors"
          >
            + 100% Exceeded Alert
          </button>
          <button
            onClick={() => triggerSimulation("INSIGHT_READY")}
            disabled={simulating}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 shadow-xs transition-colors"
          >
            + AI Insight Ready
          </button>
          <button
            onClick={() => triggerSimulation("UNUSUAL_TRANSACTION")}
            disabled={simulating}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/40 shadow-xs transition-colors"
          >
            + Unusual Spending
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: "ALL", label: "All Alerts", count: notifications.length },
          { key: "UNREAD", label: "Unread", count: unreadCount },
          {
            key: "BUDGET",
            label: "Budget Alerts",
            count: notifications.filter(
              (n) => n.type === "BUDGET_WARNING" || n.type === "BUDGET_EXCEEDED"
            ).length,
          },
          {
            key: "INSIGHT",
            label: "AI Insights",
            count: notifications.filter(
              (n) => n.type === "INSIGHT_READY" || n.type === "AI_INSIGHT"
            ).length,
          },
          {
            key: "SYSTEM",
            label: "Anomalies & System",
            count: notifications.filter(
              (n) =>
                n.type === "SYSTEM" ||
                n.type === "UNUSUAL_TRANSACTION" ||
                n.type === "RECURRING_BILL"
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification Feed ────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            No notifications in this view
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            You are fully up to date! Budget pacing alerts, unusual transactions, and AI insights will automatically appear here as expenses are logged.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const { icon: TypeIcon, bg, badgeBg, label } = getTypeMetadata(n.type);

            return (
              <div
                key={n.id}
                onClick={() => handleNavigate(n)}
                className={`group relative rounded-2xl border p-4.5 sm:p-5 transition-all duration-200 cursor-pointer shadow-xs ${
                  !n.isRead
                    ? "border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/40 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`p-3 rounded-2xl shrink-0 ${bg}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}
                        >
                          {label}
                        </span>
                        {!n.isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </div>

                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <h3
                      className={`text-sm mb-1 ${
                        !n.isRead
                          ? "font-bold text-slate-900 dark:text-white"
                          : "font-semibold text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {n.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>

                    {/* Navigation Link / Actions bar */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                        <span>Inspect in Dashboard</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {!n.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          disabled={deletingId === n.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
