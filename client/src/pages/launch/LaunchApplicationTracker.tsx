import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Plus, ChevronRight, Briefcase, MapPin, DollarSign,
  ExternalLink, Trash2, Edit3, Check, X, Star, Calendar, Loader2, BarChart2, Bell, BellOff, CheckCircle
} from "lucide-react";
import { toast } from "sonner";

type AppStatus = "wishlist" | "applied" | "phone_screen" | "interview" | "offer" | "rejected" | "withdrawn";

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; emoji: string }> = {
  wishlist: { label: "Wishlist", color: "#94A3B8", bg: "rgba(148,163,184,0.1)", emoji: "⭐" },
  applied: { label: "Applied", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", emoji: "📤" },
  phone_screen: { label: "Phone Screen", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", emoji: "📞" },
  interview: { label: "Interview", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", emoji: "🎯" },
  offer: { label: "Offer!", color: "#10B981", bg: "rgba(16,185,129,0.1)", emoji: "🎉" },
  rejected: { label: "Rejected", color: "#EF4444", bg: "rgba(239,68,68,0.1)", emoji: "❌" },
  withdrawn: { label: "Withdrawn", color: "#64748B", bg: "rgba(100,116,139,0.1)", emoji: "↩️" },
};

const PIPELINE_STAGES: AppStatus[] = ["wishlist", "applied", "phone_screen", "interview", "offer"];

type View = "list" | "add" | "detail";

interface AppFormData {
  companyName: string;
  roleName: string;
  jobUrl: string;
  location: string;
  salaryRange: string;
  status: AppStatus;
  notes: string;
  excitement: number;
}

const DEFAULT_FORM: AppFormData = {
  companyName: "",
  roleName: "",
  jobUrl: "",
  location: "",
  salaryRange: "",
  status: "wishlist",
  notes: "",
  excitement: 3,
};

export default function LaunchApplicationTracker() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<AppStatus | "all">("all");
  const [form, setForm] = useState<AppFormData>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: apps, isLoading, refetch } = trpc.launchApplications.getAll.useQuery();
  const { data: stats } = trpc.launchApplications.getStats.useQuery();
  const createMutation = trpc.launchApplications.create.useMutation();
  const updateMutation = trpc.launchApplications.update.useMutation();
  const updateStatusMutation = trpc.launchApplications.updateStatus.useMutation();
  const deleteMutation = trpc.launchApplications.delete.useMutation();

  // ── Reminders ─────────────────────────────────────────────────────────────────
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderAppId, setReminderAppId] = useState<number | null>(null);
  const [reminderForm, setReminderForm] = useState({ type: "interview" as "interview" | "follow_up" | "deadline" | "assessment" | "other", date: "", note: "" });
  const { data: upcomingReminders, refetch: refetchReminders } = trpc.launchReminders.getUpcoming.useQuery();
  const createReminderMutation = trpc.launchReminders.create.useMutation();
  const markDoneMutation = trpc.launchReminders.markDone.useMutation();
  const deleteReminderMutation = trpc.launchReminders.delete.useMutation();

  const handleAddReminder = async () => {
    if (!reminderAppId || !reminderForm.date) { toast.error("Please select a date."); return; }
    try {
      await createReminderMutation.mutateAsync({ applicationId: reminderAppId, reminderType: reminderForm.type, reminderDate: new Date(reminderForm.date).toISOString(), note: reminderForm.note || undefined });
      await refetchReminders();
      setShowReminderModal(false);
      setReminderForm({ type: "interview", date: "", note: "" });
      toast.success("Reminder set!");
    } catch { toast.error("Failed to set reminder."); }
  };

  const handleMarkDone = async (id: number) => {
    try { await markDoneMutation.mutateAsync({ id }); await refetchReminders(); toast.success("Marked as done!"); } catch { toast.error("Failed."); }
  };

  const handleDeleteReminder = async (id: number) => {
    try { await deleteReminderMutation.mutateAsync({ id }); await refetchReminders(); } catch { toast.error("Failed."); }
  };

  const filteredApps = activeFilter === "all"
    ? (apps ?? [])
    : (apps ?? []).filter((a) => a.status === activeFilter);

  const selectedApp = apps?.find((a) => a.id === selectedId);

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.roleName.trim()) {
      toast.error("Company name and role are required.");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast.success("Application updated.");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Application added!");
      }
      await refetch();
      setForm(DEFAULT_FORM);
      setEditingId(null);
      setView("list");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleStatusChange = async (id: number, status: AppStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      await refetch();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await refetch();
      setView("list");
      toast.success("Application removed.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  // ── Add / Edit Form ───────────────────────────────────────────────────────────
  if (view === "add") {
    return (
      <div className="launch-theme min-h-screen" style={{ background: "#0F172A" }}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => { setView("list"); setForm(DEFAULT_FORM); setEditingId(null); }}
            className="flex items-center gap-2 mb-6 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={14} /> Cancel
          </button>

          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {editingId ? "Edit Application" : "Add Application"}
          </h2>

          <div className="space-y-4">
            {/* Company + Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Company *</label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  placeholder="e.g. Google"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Role *</label>
                <input
                  value={form.roleName}
                  onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}
                  placeholder="e.g. Product Manager"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            </div>

            {/* Location + Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Bangalore"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Salary Range</label>
                <input
                  value={form.salaryRange}
                  onChange={(e) => setForm((f) => ({ ...f, salaryRange: e.target.value }))}
                  placeholder="e.g. ₹12–18 LPA"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            </div>

            {/* Job URL */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Job URL</label>
              <input
                value={form.jobUrl}
                onChange={(e) => setForm((f) => ({ ...f, jobUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>Status</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
                      style={{
                        background: form.status === s ? cfg.color : "rgba(255,255,255,0.06)",
                        color: form.status === s ? "#fff" : "rgba(255,255,255,0.5)",
                        border: form.status === s ? "none" : "1px solid rgba(255,255,255,0.08)",
                      }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Excitement */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                Excitement Level: {form.excitement}/5
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm((f) => ({ ...f, excitement: n }))}
                    className="w-9 h-9 rounded-xl text-sm font-bold transition-all duration-150"
                    style={{
                      background: form.excitement >= n ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.06)",
                      color: form.excitement >= n ? "#F59E0B" : "rgba(255,255,255,0.3)",
                    }}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this role, contacts, or next steps..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Manrope, sans-serif" }}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full mt-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#3B82F6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            {(createMutation.isPending || updateMutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {editingId ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────────
  return (
    <div className="launch-theme min-h-screen" style={{ background: "#0F172A" }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/launch/journey")} className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                🎯 Application Tracker
              </h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{apps?.length ?? 0} applications tracked</p>
            </div>
          </div>
          <button
            onClick={() => { setForm(DEFAULT_FORM); setEditingId(null); setView("add"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#3B82F6", color: "#fff" }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: "Total", value: stats.total, color: "#94A3B8" },
              { label: "Active", value: stats.active, color: "#3B82F6" },
              { label: "Interviews", value: stats.interviews, color: "#F59E0B" },
              { label: "Offers", value: stats.offers, color: "#10B981" },
            ].map((s) => (
              <div key={s.label} className="p-2.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-lg font-bold" style={{ color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</p>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pipeline progress bar */}
        {stats && stats.total > 0 && (
          <div className="p-3 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Pipeline</p>
            <div className="flex gap-1">
              {PIPELINE_STAGES.map((stage) => {
                const count = stats.byStatus[stage] ?? 0;
                const cfg = STATUS_CONFIG[stage];
                return (
                  <div key={stage} className="flex-1 text-center">
                    <div className="h-1.5 rounded-full mb-1" style={{ background: count > 0 ? cfg.color : "rgba(255,255,255,0.08)" }} />
                    <p className="text-[9px]" style={{ color: count > 0 ? cfg.color : "rgba(255,255,255,0.25)" }}>{count}</p>
                    <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>{cfg.label.split(" ")[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
            style={{
              background: activeFilter === "all" ? "#3B82F6" : "rgba(255,255,255,0.06)",
              color: activeFilter === "all" ? "#fff" : "rgba(255,255,255,0.5)",
              border: activeFilter === "all" ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}>
            All ({apps?.length ?? 0})
          </button>
          {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => {
            const count = stats?.byStatus[s] ?? 0;
            if (count === 0) return null;
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setActiveFilter(s)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
                style={{
                  background: activeFilter === s ? cfg.color : "rgba(255,255,255,0.06)",
                  color: activeFilter === s ? "#fff" : "rgba(255,255,255,0.5)",
                  border: activeFilter === s ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {cfg.emoji} {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Application list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: "#3B82F6" }} />
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-white mb-1">No applications yet</p>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Start tracking your job search journey</p>
            <button
              onClick={() => { setForm(DEFAULT_FORM); setEditingId(null); setView("add"); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "#3B82F6", color: "#fff" }}>
              + Add First Application
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const cfg = STATUS_CONFIG[app.status as AppStatus];
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background: cfg.bg }}>
                      {cfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {app.roleName}
                          </p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{app.companyName}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setForm({
                                companyName: app.companyName,
                                roleName: app.roleName,
                                jobUrl: app.jobUrl ?? "",
                                location: app.location ?? "",
                                salaryRange: app.salaryRange ?? "",
                                status: app.status as AppStatus,
                                notes: app.notes ?? "",
                                excitement: app.excitement ?? 3,
                              });
                              setEditingId(app.id);
                              setView("add");
                            }}
                            className="p-1.5 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.06)" }}>
                            <Edit3 size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 rounded-lg"
                            style={{ background: "rgba(239,68,68,0.1)" }}>
                            <Trash2 size={11} style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {app.location && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <MapPin size={9} />{app.location}
                          </span>
                        )}
                        {app.salaryRange && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <DollarSign size={9} />{app.salaryRange}
                          </span>
                        )}
                        {app.jobUrl && (
                          <a href={app.jobUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-0.5" style={{ color: "#3B82F6" }}>
                            <ExternalLink size={9} />Job Link
                          </a>
                        )}
                      </div>

                      {/* Excitement stars */}
                      {app.excitement && (
                        <div className="flex gap-0.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className="text-[10px]" style={{ color: (app.excitement ?? 0) >= n ? "#F59E0B" : "rgba(255,255,255,0.15)" }}>★</span>
                          ))}
                        </div>
                      )}

                      {/* Status selector */}
                      <div className="mt-2.5">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as AppStatus)}
                          className="text-[10px] px-2 py-1 rounded-lg outline-none font-semibold"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                          {(Object.keys(STATUS_CONFIG) as AppStatus[]).map((s) => (
                            <option key={s} value={s} style={{ background: "#1e293b", color: "#fff" }}>
                              {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {app.notes && (
                        <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Manrope, sans-serif" }}>
                          {app.notes.length > 100 ? app.notes.slice(0, 100) + "…" : app.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => navigate("/launch/journey")} className="w-full mt-6 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Back to Journey Map
        </button>
      </div>
    </div>
  );
}
