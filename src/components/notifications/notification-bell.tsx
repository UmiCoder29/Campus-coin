"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  type:
    | "BUDGET_WARNING"
    | "BUDGET_EXCEEDED"
    | "INSIGHT_READY"
    | "AI_INSIGHT"
    | "UNUSUAL_TRANSACTION"
    | "RECURRING_BILL"
    | "SYSTEM";
  title: string;
  message: string;
  linkUrl?: string | null;
  categoryId?: string | null;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  month?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 25000); // 25s polling

    const handleFocus = () => fetchNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
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

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
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

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    const targetUrl = item.linkUrl || "/notifications";
    router.push(targetUrl);
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
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getTypeIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "BUDGET_WARNING":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400",
        };
      case "BUDGET_EXCEEDED":
        return {
          icon: AlertOctagon,
          bg: "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400",
        };
      case "INSIGHT_READY":
      case "AI_INSIGHT":
        return {
          icon: Sparkles,
          bg: "bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400",
        };
      case "UNUSUAL_TRANSACTION":
        return {
          icon: TrendingUp,
          bg: "bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400",
        };
      case "RECURRING_BILL":
        return {
          icon: Clock,
          bg: "bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400",
        };
      case "SYSTEM":
      default:
        return {
          icon: Info,
          bg: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400",
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Button ──────────────────────────────── */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        id="notification-bell-btn"
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />

        {/* Dynamic Badge (Hidden entirely at zero) */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-md shadow-rose-500/30 ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ───────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of items */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Bell className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  All caught up!
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto">
                  You have no unread notifications or pending budget threshold warnings.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const { icon: TypeIcon, bg } = getTypeIcon(n.type);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 px-4 flex items-start gap-3 cursor-pointer transition-colors group ${
                      !n.isRead
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${bg}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            !n.isRead
                              ? "font-bold text-slate-900 dark:text-white"
                              : "font-medium text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Click-through hint */}
                      <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View details</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 shrink-0 ring-2 ring-indigo-200 dark:ring-indigo-950" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Full Notification History</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <span className="text-[10px] text-slate-400 font-medium">
              Campus Coin Alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
