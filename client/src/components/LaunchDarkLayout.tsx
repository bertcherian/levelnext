/**
 * LaunchDarkLayout
 * Unified dark-mode neon neo-brutalism shell for Launch Intelligence.
 * Replaces both LaunchLayout and LaunchPageWrapper with a single component
 * that uses the .launch-dark design system tokens.
 *
 * Features:
 * - Glassmorphic top nav with backdrop blur
 * - XP progress bar with neon gradient
 * - Mobile bottom-sheet navigation (Gen Z pattern)
 * - Settings & preferences integration
 * - Reduced-motion / high-contrast support
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ADMINISTRATOR_CONTROLS, isPlatformAdministrator } from "@/lib/adminControls";
import { Map, LayoutDashboard, Briefcase, LogOut, Menu, X, Rocket, Settings, Trophy, History, Swords } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_c21f58d5.png";

function LaunchBrandMark() {
  return (
    <span aria-label="LevelNext Launch Intelligence" className="launch-app-brand">
      <span aria-hidden="true" className="launch-app-brand__mark">
        <img src={LOGO_URL} alt="" style={{ position: "absolute", height: 64, width: "auto", maxWidth: "none", top: -14, left: -6 }} />
      </span>
      <span className="launch-app-brand__copy">
        <span className="launch-app-brand__name">
          Level<span className="launch-app-brand__accent">Next</span>
        </span>
        <span className="launch-app-brand__product">
          LAUNCH INTELLIGENCE
        </span>
      </span>
    </span>
  );
}

const NAV_ITEMS = [
  { href: "/launch/home",         label: "Home",        icon: Rocket },
  { href: "/launch/journey",      label: "Journey",     icon: Map },
  { href: "/launch/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/launch/applications", label: "Tracker",     icon: Briefcase },
  { href: "/launch/leaderboard",  label: "Leaderboard", icon: Trophy },
  { href: "/launch/challenges",   label: "Challenges",  icon: Swords },
  { href: "/launch/history",      label: "History",     icon: History },
];

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(({ href }) => [
  "/launch/home",
  "/launch/journey",
  "/launch/challenges",
  "/launch/history",
  "/launch/leaderboard",
].includes(href));

export default function LaunchDarkLayout({ children, showBottomNav = true }: { children: React.ReactNode; showBottomNav?: boolean }) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const isAdministrator = isPlatformAdministrator(user?.role);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [xpPulse, setXpPulse] = useState(false);
  const previousXp = useRef<number | null>(null);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, {
    staleTime: 60_000,
  });
  const prefsQuery = trpc.launchUserPreferences.getPreferences.useQuery(undefined, {
    staleTime: 120_000,
  });

  const progress = progressQuery.data;
  const xp = progress?.progress?.totalXp ?? 0;
  const level = progress?.progress?.currentLevel ?? "Explorer";
  const streak = progress?.progress?.currentStreak ?? 0;
  const levelXp = xp % 200;

  const prefs = prefsQuery.data;
  const highContrast = prefs?.highContrast ?? false;
  const reducedMotion = prefs?.reducedMotion ?? false;
  const accentColor = prefs?.accentColor ?? "cyan";

  // Map accent color to CSS variable overrides
  const accentColorMap: Record<string, string> = {
    cyan:   "#22D3EE",
    pink:   "#F472B6",
    green:  "#4ADE80",
    orange: "#FB923C",
    purple: "#A78BFA",
  };
  const accentHex = accentColorMap[accentColor] || accentColorMap.cyan;

  useEffect(() => {
    if (previousXp.current !== null && xp > previousXp.current) {
      setXpPulse(true);
      const timer = window.setTimeout(() => setXpPulse(false), 760);
      previousXp.current = xp;
      return () => window.clearTimeout(timer);
    }
    previousXp.current = xp;
  }, [xp]);

  // Apply accessibility classes to the wrapper
  const wrapperClass = [
    "launch-dark",
    "launch-brutal-app",
    highContrast ? "ld-high-contrast" : "",
    reducedMotion ? "ld-reduced-motion" : "",
  ].filter(Boolean).join(" ");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <div className={wrapperClass} style={{
      fontFamily: "var(--ld-font-body)",
      minHeight: "100vh",
      width: "100vw",
      maxWidth: "100%",
      minWidth: 0,
      overflowX: "clip",
      color: "var(--ld-text)",
      background: "var(--ld-bg-gradient)",
      position: "relative",
      // Override accent CSS variables based on user preference
      ["--ld-cyan" as string]: accentHex,
      ["--ld-cyan-glow" as string]: `${accentHex}66`,
      ["--ld-cyan-soft" as string]: `${accentHex}1F`,
      ["--ld-gradient-primary" as string]: `linear-gradient(135deg, ${accentHex} 0%, #F472B6 100%)`,
      ["--ld-gradient-level" as string]: `linear-gradient(90deg, ${accentHex}, #4ADE80)`,
      ["--ld-shadow-cyan" as string]: `0 0 20px ${accentHex}4D`,
    } as React.CSSProperties}>
      {/* Animated background orbs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "60%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* ── Top Navigation ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,15,30,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--ld-border)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.25rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <button
            onClick={() => navigate("/launch/home")}
            aria-label="Go to Launch home"
            style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <LaunchBrandMark />
          </button>

          {/* Desktop Nav */}
          <div style={{ alignItems: "center", gap: 4 }} className="hidden lg:flex">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href !== "/launch/home" && location.startsWith(href));
              return (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, transition: "all 200ms var(--ld-ease-out)",
                    background: active ? "var(--ld-cyan-soft)" : "transparent",
                    color: active ? "var(--ld-cyan)" : "var(--ld-text-muted)",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
            {isAdministrator && (
              <details style={{ position: "relative" }}>
                <summary style={{ listStyle: "none", display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--ld-cyan)", cursor: "pointer", fontSize: 13, fontWeight: 700, background: "var(--ld-cyan-soft)", color: "var(--ld-cyan)" }}>Admin</summary>
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220, padding: 8, borderRadius: 10, border: "1px solid var(--ld-border)", background: "rgba(10,15,30,.98)", boxShadow: "var(--ld-shadow-cyan)" }}>
                  {ADMINISTRATOR_CONTROLS.map(({ href, label, icon: Icon }) => (
                    <button key={href} onClick={() => navigate(href)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", border: "none", borderRadius: 7, cursor: "pointer", background: "transparent", color: "var(--ld-text-muted)", fontSize: 12, fontWeight: 600, textAlign: "left" }}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* Right: XP + Streak + Settings + Logout */}
          <div style={{ alignItems: "center", gap: 8 }} className="hidden lg:flex">
            <span className="ld-badge ld-badge-cyan">
              ⚡ {xp} XP
            </span>
            {streak > 0 && (
              <span className="ld-badge ld-badge-orange">
                🔥 {streak}d
              </span>
            )}
            <button
              onClick={() => navigate("/launch/settings")}
              aria-label="Open Launch settings"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "var(--ld-text-dim)", display: "flex", alignItems: "center", transition: "color 200ms var(--ld-ease-out)" }}
              title="Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              aria-label="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "var(--ld-text-dim)", display: "flex", alignItems: "center", transition: "color 200ms var(--ld-ease-out)" }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ld-text-muted)", padding: 6 }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* XP Progress bar */}
        {progress && (
          <div style={{ background: "rgba(34,211,238,0.04)", borderTop: "1px solid rgba(34,211,238,0.06)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4px 1.25rem", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ld-cyan)", minWidth: 130, fontFamily: "var(--ld-font-heading)" }}>{level}</span>
              <div className="ld-progress-track" style={{ flex: 1 }}>
                <div className={`ld-progress-fill ${xpPulse ? "ld-progress-pulse" : ""}`} style={{
                  width: `${Math.min((levelXp / 200) * 100, 100)}%`,
                }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--ld-text-dim)", minWidth: 60, textAlign: "right" }}>{levelXp}/200 XP</span>
            </div>
          </div>
        )}

        {/* Mobile Menu (slide-down) */}
        {mobileOpen && (
          <div className="ld-slide-up" style={{ background: "rgba(10,15,30,0.95)", borderTop: "1px solid var(--ld-border)", padding: "12px 20px 16px" }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href !== "/launch/home" && location.startsWith(href));
              return (
                <button
                  key={href}
                  onClick={() => { navigate(href); setMobileOpen(false); }}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 14, fontWeight: 600, marginBottom: 4,
                    background: active ? "var(--ld-cyan-soft)" : "transparent",
                    color: active ? "var(--ld-cyan)" : "var(--ld-text-muted)",
                    textAlign: "left",
                    transition: "all 200ms var(--ld-ease-out)",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
            {isAdministrator && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--ld-border)" }}>
                <p style={{ margin: "0 0 6px 12px", color: "var(--ld-cyan)", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Administrator</p>
                {ADMINISTRATOR_CONTROLS.map(({ href, label, icon: Icon }) => (
                  <button key={href} onClick={() => { navigate(href); setMobileOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, marginBottom: 4, background: "transparent", color: "var(--ld-text-muted)", textAlign: "left" }}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ld-border)" }}>
              <span className="ld-badge ld-badge-cyan">⚡ {xp} XP</span>
              {streak > 0 && <span className="ld-badge ld-badge-orange">🔥 {streak}d</span>}
              <button onClick={() => navigate("/launch/settings")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--ld-text-dim)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Settings size={14} /> Settings
              </button>
              <button onClick={() => logoutMutation.mutate()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ld-text-dim)", fontSize: 13 }}>Sign out</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Page Content ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "2rem 1.25rem 5rem" }}>
        {children}
      </div>

      {/* ── Mobile Bottom Nav (Gen Z pattern) ── */}
      {showBottomNav && (
        <div className="ld-bottom-nav md:hidden">
          {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/launch/home" && location.startsWith(href));
            return (
              <button
                key={href}
                className={`ld-bottom-nav-item ${active ? "active" : ""}`}
                onClick={() => navigate(href)}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
