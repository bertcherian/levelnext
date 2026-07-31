/**
 * LaunchPageWrapper
 * A lightweight wrapper that provides the dark navy background, animated orbs,
 * LevelNext logo header, and XP/streak nav bar for Launch Intelligence pages.
 * 
 * Use this for pages that manage their own inner layout (multi-phase pages like
 * StoryBuilder, SkillSprint, ResumeMakeover, ApplicationTracker).
 * 
 * The wrapper renders ABOVE the page's own content div, so the page's own
 * outer div (with background: "#0F172A") becomes transparent and the navy
 * background shows through.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Map, LayoutDashboard, Briefcase, LogOut, Menu, X, Rocket } from "lucide-react";
import { useState } from "react";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_c21f58d5.png";

const NAV_ITEMS = [
  { href: "/launch/home",         label: "Home",        icon: Rocket },
  { href: "/launch/journey",      label: "Journey",     icon: Map },
  { href: "/launch/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/launch/applications", label: "Tracker",     icon: Briefcase },
];

export default function LaunchPageWrapper({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, {
    staleTime: 60_000,
  });
  const progress = progressQuery.data;
  const xp = progress?.progress?.totalXp ?? 0;
  const level = progress?.progress?.currentLevel ?? "Career Explorer";
  const streak = progress?.progress?.currentStreak ?? 0;
  const levelXp = xp % 200;

  return (
    <div style={{
      fontFamily: "'Manrope', sans-serif",
      minHeight: "100vh",
      color: "#F8FAFC",
      background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 40%, #0A1628 70%, #060D1A 100%)",
      position: "relative",
    }}>
      {/* Animated background orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* ── Top Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,15,30,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(59,130,246,0.15)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <button
            onClick={() => navigate("/launch/home")}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img src={LOGO_URL} alt="LevelNext" style={{ height: 36, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.05em" }}>
              LAUNCH
            </span>
          </button>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden md:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href !== "/launch/home" && location.startsWith(href));
              return (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                    background: active ? "rgba(59,130,246,0.18)" : "transparent",
                    color: active ? "#60A5FA" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Right: XP + Streak + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="hidden md:flex">
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: "rgba(59,130,246,0.15)", color: "#60A5FA",
              border: "1px solid rgba(59,130,246,0.25)",
            }}>
              ⚡ {xp} XP
            </span>
            {streak > 0 && (
              <span style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: "rgba(251,146,60,0.15)", color: "#FB923C",
                border: "1px solid rgba(251,146,60,0.25)",
              }}>
                🔥 {streak}d
              </span>
            )}
            <button
              onClick={() => logoutMutation.mutate()}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center" }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 6 }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* XP Progress bar */}
        {progress && (
          <div style={{ background: "rgba(59,130,246,0.06)", borderTop: "1px solid rgba(59,130,246,0.08)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4px 1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#60A5FA", minWidth: 130 }}>{level}</span>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                <div style={{
                  height: 3, borderRadius: 2,
                  background: "linear-gradient(90deg, #3B82F6, #10B981)",
                  width: `${Math.min((levelXp / 200) * 100, 100)}%`,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", minWidth: 60, textAlign: "right" }}>{levelXp}/200 XP</span>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{ background: "rgba(10,15,30,0.95)", borderTop: "1px solid rgba(59,130,246,0.15)", padding: "12px 20px 16px" }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href !== "/launch/home" && location.startsWith(href));
              return (
                <button
                  key={href}
                  onClick={() => { navigate(href); setMobileOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 14, fontWeight: 600, marginBottom: 4,
                    background: active ? "rgba(59,130,246,0.18)" : "transparent",
                    color: active ? "#60A5FA" : "rgba(255,255,255,0.6)",
                    textAlign: "left",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>⚡ {xp} XP</span>
              {streak > 0 && <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "rgba(251,146,60,0.15)", color: "#FB923C" }}>🔥 {streak}d</span>}
              <button onClick={() => logoutMutation.mutate()} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Sign out</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Page Content ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
