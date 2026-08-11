/**
 * LaunchSettings — Dark Mode Settings page for Launch Intelligence
 * Allows users to customize:
 * - Accent color (cyan, pink, green, orange, purple)
 * - Avatar emoji
 * - Notification preferences (daily missions, streaks, achievements, reminders)
 * - Accessibility (reduced motion, high contrast)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import LaunchDarkLayout from "@/components/LaunchDarkLayout";
import { toast } from "sonner";

const ACCENT_COLORS = [
  { id: "cyan",   label: "Cyan",   color: "#22D3EE" },
  { id: "pink",   label: "Pink",   color: "#F472B6" },
  { id: "green",  label: "Green",  color: "#4ADE80" },
  { id: "orange", label: "Orange", color: "#FB923C" },
  { id: "purple", label: "Purple", color: "#A78BFA" },
] as const;

const AVATARS = ["🚀", "⚡", "🔥", "🎯", "🧭", "✨", "💼", "🏆", "🌟", "🦄", "🎮", "💡"];

export default function LaunchSettings() {
  const utils = trpc.useUtils();
  const { data: prefs } = trpc.launchUserPreferences.getPreferences.useQuery();
  const { data: progress } = trpc.launchProgress.getProgress.useQuery();

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const updateAccentColor = trpc.launchUserPreferences.updateAccentColor.useMutation({
    onSuccess: () => {
      utils.launchUserPreferences.getPreferences.invalidate();
      toast.success("Accent color updated");
    },
    onError: () => {
      toast.error("Failed to update accent color. Please try again.");
      setSelectedColor(null);
    },
  });

  const updateAvatar = trpc.launchUserPreferences.updateAvatar.useMutation({
    onSuccess: () => {
      utils.launchUserPreferences.getPreferences.invalidate();
      toast.success("Avatar updated");
    },
    onError: () => {
      toast.error("Failed to update avatar. Please try again.");
      setSelectedAvatar(null);
    },
  });

  const updateNotifications = trpc.launchUserPreferences.updateNotifications.useMutation({
    onSuccess: () => {
      utils.launchUserPreferences.getPreferences.invalidate();
      toast.success("Notification preferences saved");
    },
    onError: () => {
      toast.error("Failed to save notification preferences. Please try again.");
    },
  });

  const updateAccessibility = trpc.launchUserPreferences.updateAccessibility.useMutation({
    onSuccess: () => {
      utils.launchUserPreferences.getPreferences.invalidate();
      toast.success("Accessibility settings saved");
    },
    onError: () => {
      toast.error("Failed to save accessibility settings. Please try again.");
    },
  });

  const accentColor = selectedColor ?? prefs?.accentColor ?? "cyan";
  const avatar = selectedAvatar ?? prefs?.avatar ?? "🚀";
  const level = progress?.progress?.currentLevel ?? "Explorer";
  const xp = progress?.progress?.totalXp ?? 0;

  return (
    <LaunchDarkLayout showBottomNav={false}>
      <h1 className="text-2xl font-bold mb-2 ld-slide-up" style={{ fontFamily: "var(--ld-font-heading)" }}>Settings</h1>
      <p className="text-sm mb-6 ld-slide-up ld-stagger-1" style={{ color: "var(--ld-text-muted)" }}>Personalize your Launch Intelligence experience</p>

      {/* Profile Card */}
      <div className="ld-card ld-card-glow-cyan p-5 mb-6 ld-slide-up ld-stagger-2">
        <div className="flex items-center gap-4">
          <div className="text-4xl" style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "var(--ld-cyan-soft)", border: "1px solid rgba(34,211,238,0.25)" }}>
            {avatar}
          </div>
          <div>
            <div className="text-lg font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>{level}</div>
            <div className="text-sm" style={{ color: "var(--ld-text-muted)" }}>{xp.toLocaleString()} XP earned</div>
          </div>
        </div>
      </div>

      {/* Avatar Selection */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-3">
        <h2 className="font-semibold text-base mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>Choose Your Avatar</h2>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((av) => (
            <button
              key={av}
              onClick={() => {
                setSelectedAvatar(av);
                updateAvatar.mutate({ avatar: av as "🚀" });
              }}
              className="ld-card p-2 text-center"
              style={{
                fontSize: 24,
                background: avatar === av ? "var(--ld-cyan-soft)" : "var(--ld-surface)",
                border: avatar === av ? "1px solid var(--ld-cyan)" : "1px solid var(--ld-card-border)",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 200ms var(--ld-ease-out)",
              }}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-4">
        <h2 className="font-semibold text-base mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>Accent Color</h2>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedColor(c.id);
                updateAccentColor.mutate({ accentColor: c.id as "cyan" });
              }}
              style={{
                width: 48, height: 48, borderRadius: 12, cursor: "pointer",
                background: c.color,
                border: accentColor === c.id ? "3px solid var(--ld-text)" : "3px solid transparent",
                boxShadow: accentColor === c.id ? `0 0 16px ${c.color}66` : "none",
                transition: "all 200ms var(--ld-ease-out)",
              }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-5">
        <h2 className="font-semibold text-base mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>Notifications</h2>
        <div className="space-y-3">
          {[
            { key: "notifyDailyMissions", label: "Daily Mission Reminders", desc: "Get notified when new missions unlock" },
            { key: "notifyStreaks", label: "Streak Alerts", desc: "Don't break your streak — get reminded daily" },
            { key: "notifyAchievements", label: "Achievement Unlocks", desc: "Celebrate when you earn new badges" },
            { key: "notifyReminders", label: "Application & Interview Reminders", desc: "Never miss a deadline or interview" },
          ].map(({ key, label, desc }) => {
            const checked = prefs?.[key as keyof typeof prefs] as boolean ?? true;
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--ld-surface)", border: "1px solid var(--ld-border)" }}>
                <div>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{desc}</div>
                </div>
                <button
                  onClick={() => updateNotifications.mutate({ [key]: !checked } as { notifyDailyMissions?: boolean })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: checked ? "var(--ld-cyan)" : "rgba(148,163,184,0.2)",
                    position: "relative",
                    transition: "background 200ms var(--ld-ease-out)",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: checked ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "white",
                    transition: "left 200ms var(--ld-ease-out)",
                  }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accessibility */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-6">
        <h2 className="font-semibold text-base mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>Accessibility</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--ld-surface)", border: "1px solid var(--ld-border)" }}>
            <div>
              <div className="text-sm font-semibold">Reduced Motion</div>
              <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>Minimize animations and transitions</div>
            </div>
            <button
              onClick={() => updateAccessibility.mutate({ reducedMotion: !(prefs?.reducedMotion ?? false) })}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: (prefs?.reducedMotion ?? false) ? "var(--ld-cyan)" : "rgba(148,163,184,0.2)",
                position: "relative",
                transition: "background 200ms var(--ld-ease-out)",
              }}
            >
              <div style={{
                position: "absolute", top: 2, left: (prefs?.reducedMotion ?? false) ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%", background: "white",
                transition: "left 200ms var(--ld-ease-out)",
              }} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--ld-surface)", border: "1px solid var(--ld-border)" }}>
            <div>
              <div className="text-sm font-semibold">High Contrast</div>
              <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>Brighter text and borders for readability</div>
            </div>
            <button
              onClick={() => updateAccessibility.mutate({ highContrast: !(prefs?.highContrast ?? false) })}
              style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: (prefs?.highContrast ?? false) ? "var(--ld-cyan)" : "rgba(148,163,184,0.2)",
                position: "relative",
                transition: "background 200ms var(--ld-ease-out)",
              }}
            >
              <div style={{
                position: "absolute", top: 2, left: (prefs?.highContrast ?? false) ? 22 : 2,
                width: 20, height: 20, borderRadius: "50%", background: "white",
                transition: "left 200ms var(--ld-ease-out)",
              }} />
            </button>
          </div>
        </div>
      </div>
    </LaunchDarkLayout>
  );
}
