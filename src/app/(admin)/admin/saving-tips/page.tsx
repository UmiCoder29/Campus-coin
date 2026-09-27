"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Megaphone,
  Radio,
  Check,
  X,
  RefreshCw,
  BellRing,
} from "lucide-react";

interface AnnouncementTemplate {
  id: string;
  title: string;
  body: string;
  category: string;
  isActive: boolean;
  broadcasted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSavingTipsCMSPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [editingItem, setEditingItem] = useState<AnnouncementTemplate | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCategory, setFormCategory] = useState("CAMPUS_HACK");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formBroadcast, setFormBroadcast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/announcements");
      const json = await res.json();
      if (json.success) {
        setAnnouncements(json.data || []);
      } else {
        throw new Error(json.error || "Failed to load announcements");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load announcement templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormBody("");
    setFormCategory("CAMPUS_HACK");
    setFormIsActive(true);
    setFormBroadcast(false);
    setModalMode("ADD");
  };

  const openEditModal = (item: AnnouncementTemplate) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormBody(item.body);
    setFormCategory(item.category);
    setFormIsActive(item.isActive);
    setFormBroadcast(false);
    setModalMode("EDIT");
  };

  // Toggle active/inactive
  const handleToggleActive = async (item: AnnouncementTemplate) => {
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to toggle status");

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: !item.isActive } : a))
      );
      setSuccessMsg(`"${item.title}" is now ${!item.isActive ? "active" : "inactive"}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Toggle failed");
    }
  };

  // Broadcast to all active students
  const handleBroadcast = async (item: AnnouncementTemplate) => {
    setBroadcastingId(item.id);
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Broadcast failed");

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, broadcasted: true } : a))
      );
      setSuccessMsg(json.message || "Notification broadcasted to all students!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to broadcast notification");
    } finally {
      setBroadcastingId(null);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to delete");

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setSuccessMsg("Announcement deleted");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete announcement");
    }
  };

  // Submit modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      if (modalMode === "ADD") {
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            body: formBody.trim(),
            category: formCategory,
            isActive: formIsActive,
            broadcastImmediately: formBroadcast,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to create announcement");

        setSuccessMsg(json.message || "Announcement template created!");
      } else if (modalMode === "EDIT" && editingItem) {
        const res = await fetch(`/api/admin/announcements/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            body: formBody.trim(),
            category: formCategory,
            isActive: formIsActive,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to update announcement");

        setSuccessMsg("Template updated successfully");
      }

      setModalMode(null);
      await fetchAnnouncements();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141722] dark:text-white">
              Announcements & Saving Tips CMS
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20 uppercase tracking-widest">
              Broadcast Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#767D8C] dark:text-[#8B96AA] mt-1">
            Author university announcements and money-saving templates. Active items surface in student feeds and push notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] hover:text-[#141722] dark:hover:text-white shadow-2xs transition-colors cursor-pointer"
            title="Refresh announcements"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#FF6422] hover:bg-[#E55519] text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Announcement / Tip</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-xs">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:text-rose-900 dark:hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Connection Banner ────────────────────────── */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#161B27] border border-orange-200/60 dark:border-orange-500/20 flex items-start gap-3.5 shadow-xs">
        <div className="p-2.5 rounded-2xl bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] shrink-0">
          <Radio className="h-5 w-5" />
        </div>
        <div className="text-xs leading-relaxed text-[#767D8C] dark:text-[#8B96AA]">
          <span className="font-bold text-[#141722] dark:text-white block mb-0.5">
            Bidirectional Student Connection
          </span>
          Active templates surface immediately in the student <strong className="text-[#141722] dark:text-[#F2F5F9]">Saving Tips</strong> tab.
          Clicking <strong className="text-[#141722] dark:text-[#F2F5F9]">Broadcast</strong> will instantly dispatch push notifications to all registered student accounts.
        </div>
      </div>

      {/* ── Templates List ───────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-3xl bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] p-12 text-center text-[#767D8C] dark:text-[#8B96AA] shadow-xs">
          <Megaphone className="h-10 w-10 mx-auto mb-3 text-[#767D8C]/50 dark:text-[#8B96AA]/50" />
          <h3 className="font-bold text-[#141722] dark:text-white text-base">No announcements authored yet</h3>
          <p className="text-xs text-[#767D8C] dark:text-[#8B96AA] mt-1 max-w-sm mx-auto">
            Create an announcement or saving tip template to broadcast financial advice or campus notices to students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                item.isActive
                  ? "border-[#EFEAE1] dark:border-[#222938] bg-white dark:bg-[#161B27] hover:border-[#FF6422]/40 dark:hover:border-[#FF6422]/40"
                  : "border-[#EFEAE1]/60 dark:border-[#222938]/60 bg-white/60 dark:bg-[#161B27]/40 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFEFE6] dark:bg-[#FF6422]/15 text-[#FF6422] dark:text-[#FF7D42] border border-orange-200 dark:border-orange-500/20">
                      {item.category.replace(/_/g, " ")}
                    </span>
                    {item.broadcasted && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1">
                        <BellRing className="h-2.5 w-2.5" />
                        Broadcasted
                      </span>
                    )}
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                      item.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                        : "bg-[#FBF9F5] dark:bg-[#0E121B] text-[#767D8C] dark:text-[#8B96AA] border-[#EFEAE1] dark:border-[#222938] hover:text-[#141722] dark:hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>{item.isActive ? "Active" : "Inactive"}</span>
                  </button>
                </div>

                <h3 className="font-bold text-[#141722] dark:text-white text-sm mb-1.5">{item.title}</h3>
                <p className="text-xs text-[#525866] dark:text-[#94A0B8] leading-relaxed line-clamp-3">
                  {item.body}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EFEAE1] dark:border-[#222938] flex items-center justify-between">
                <span className="text-[10px] text-[#767D8C] dark:text-[#8B96AA]">
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {/* Broadcast button */}
                  <button
                    onClick={() => handleBroadcast(item)}
                    disabled={broadcastingId === item.id}
                    title="Broadcast as notification to all students"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <BellRing className="h-3 w-3" />
                    <span>{broadcastingId === item.id ? "Sending..." : "Broadcast"}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] transition-colors cursor-pointer"
                    title="Edit template"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#161B27] border border-[#EFEAE1] dark:border-[#222938] rounded-3xl p-6 max-w-lg w-full shadow-2xl text-[#141722] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE1] dark:border-[#222938] mb-4">
              <h3 className="font-bold text-base text-[#141722] dark:text-white">
                {modalMode === "ADD" ? "Create Announcement / Saving Tip" : "Edit Template"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-xl text-[#767D8C] dark:text-[#8B96AA] hover:text-[#141722] dark:hover:text-white hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Free Campus Shuttle Pass Application Window"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white placeholder-[#767D8C] dark:placeholder-[#8B96AA] focus:outline-none focus:border-[#FF6422]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                  Category Tag
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white focus:outline-none focus:border-[#FF6422]"
                >
                  <option value="CAMPUS_HACK">Campus Hack</option>
                  <option value="STUDENT_DISCOUNT">Student Discount</option>
                  <option value="ACADEMIC_PERK">Academic Perk</option>
                  <option value="GENERAL_ALERT">General Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#525866] dark:text-[#94A0B8] mb-1">
                  Body Content & Actionable Advice
                </label>
                <textarea
                  required
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Describe the opportunity or alert details for students..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938] text-xs text-[#141722] dark:text-white placeholder-[#767D8C] dark:placeholder-[#8B96AA] focus:outline-none focus:border-[#FF6422] resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FBF9F5] dark:bg-[#0E121B] border border-[#EFEAE1] dark:border-[#222938]">
                <div>
                  <div className="text-xs font-bold text-[#141722] dark:text-white">Active in Student Feed</div>
                  <div className="text-[11px] text-[#767D8C] dark:text-[#8B96AA]">
                    Visible immediately in student Saving Tips & Announcements
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6422] focus:ring-0 bg-white dark:bg-[#161B27] border-[#EFEAE1] dark:border-[#222938] cursor-pointer accent-[#FF6422]"
                />
              </div>

              {modalMode === "ADD" && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50">
                  <div>
                    <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      Broadcast Notification Now
                    </div>
                    <div className="text-[11px] text-indigo-600/70 dark:text-slate-400">
                      Dispatch immediate in-app notification to all active students
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formBroadcast}
                    onChange={(e) => setFormBroadcast(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#EFEAE1] dark:border-[#222938] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-[#525866] dark:text-[#94A0B8] hover:bg-[#F3EFE7] dark:hover:bg-[#1E2536] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-2xl bg-[#FF6422] hover:bg-[#E55519] text-xs font-bold text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? "Saving..." : modalMode === "ADD" ? "Create Template" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
