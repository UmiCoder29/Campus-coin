"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Megaphone,
  Radio,
  Check,
  X,
  RefreshCw,
  BellRing,
  Lightbulb,
  Sparkles,
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
            <h1 className="text-2xl font-black tracking-tight text-white">
              Announcements & Saving Tips CMS
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
              Broadcast Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Author university announcements and money-saving templates. Active items surface in student feeds and push notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Announcement / Tip</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Connection Banner ────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/20 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <Radio className="h-5 w-5" />
        </div>
        <div className="text-xs leading-relaxed text-slate-300">
          <span className="font-bold text-white block mb-0.5">
            Bidirectional Student Connection
          </span>
          Active templates surface immediately in the student <strong>Saving Tips</strong> tab.
          Clicking <strong>Broadcast</strong> will instantly dispatch push notifications to all registered student accounts.
        </div>
      </div>

      {/* ── Templates List ───────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center text-slate-400">
          <Megaphone className="h-10 w-10 mx-auto mb-3 text-slate-600" />
          <h3 className="font-bold text-white text-base">No announcements authored yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create an announcement or saving tip template to broadcast financial advice or campus notices to students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                item.isActive
                  ? "border-slate-800 bg-slate-900/90 hover:border-slate-700"
                  : "border-slate-800/40 bg-slate-950/40 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.category.replace(/_/g, " ")}
                    </span>
                    {item.broadcasted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                        <BellRing className="h-2.5 w-2.5" />
                        Broadcasted
                      </span>
                    )}
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                      item.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.isActive ? "bg-emerald-400" : "bg-slate-500"
                      }`}
                    />
                    <span>{item.isActive ? "Active" : "Inactive"}</span>
                  </button>
                </div>

                <h3 className="font-bold text-white text-sm mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.body}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Updated {new Date(item.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {/* Broadcast button */}
                  <button
                    onClick={() => handleBroadcast(item)}
                    disabled={broadcastingId === item.id}
                    title="Broadcast as notification to all students"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <BellRing className="h-3 w-3" />
                    <span>{broadcastingId === item.id ? "Sending..." : "Broadcast"}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit template"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">
                {modalMode === "ADD" ? "Create Announcement / Saving Tip" : "Edit Template"}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Free Campus Shuttle Pass Application Window"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category Tag
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="CAMPUS_HACK">Campus Hack</option>
                  <option value="STUDENT_DISCOUNT">Student Discount</option>
                  <option value="ACADEMIC_PERK">Academic Perk</option>
                  <option value="GENERAL_ALERT">General Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Body Content & Actionable Advice
                </label>
                <textarea
                  required
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Describe the opportunity or alert details for students..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Active in Student Feed</div>
                  <div className="text-[11px] text-slate-500">
                    Visible immediately in student Saving Tips & Announcements
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {modalMode === "ADD" && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50">
                  <div>
                    <div className="text-xs font-bold text-indigo-300">
                      Broadcast Notification Now
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Dispatch immediate in-app notification to all active students
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formBroadcast}
                    onChange={(e) => setFormBroadcast(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 disabled:opacity-50 transition-colors"
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
