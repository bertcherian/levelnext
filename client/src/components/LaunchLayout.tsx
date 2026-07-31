import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Rocket, Map, Trophy, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/launch/home",    label: "Home",    icon: Rocket },
  { href: "/launch/journey", label: "Journey", icon: Map    },
  { href: "/launch/wins",    label: "Wins",    icon: Trophy },
];

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="launch-theme min-h-screen" style={{ background: "var(--li-bg)", color: "var(--li-text)", fontFamily: "'Manrope', sans-serif" }}>
      {/* Top Navigation Bar */}
      <nav style={{ background: "var(--li-surface)", borderBottom: "1px solid var(--li-border)" }} className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + Product Name */}
          <button
            onClick={() => navigate("/launch/home")}
            className="flex items-center gap-2 font-bold text-lg"
            style={{ color: "var(--li-primary)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Rocket size={20} />
            <span>Launch Intelligence</span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location.startsWith(href);
              return (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: active ? "var(--li-primary-soft)" : "transparent",
                    color: active ? "var(--li-primary)" : "var(--li-text-muted)",
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* XP + Streak Pills */}
          <div className="hidden md:flex items-center gap-2">
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "var(--li-primary-soft)", color: "var(--li-primary)" }}
            >
              ⚡ {xp} XP
            </span>
            {streak > 0 && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#FFF3E0", color: "#E65100" }}
              >
                🔥 {streak}d
              </span>
            )}
            <button
              onClick={() => navigate("/launch/settings")}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--li-text-muted)" }}
            >
              <Settings size={16} />
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--li-text-muted)" }}
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: "var(--li-text-muted)" }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="md:hidden px-4 pb-3 flex flex-col gap-1"
            style={{ background: "var(--li-surface)", borderTop: "1px solid var(--li-border)" }}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = location.startsWith(href);
              return (
                <button
                  key={href}
                  onClick={() => { navigate(href); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: active ? "var(--li-primary-soft)" : "transparent",
                    color: active ? "var(--li-primary)" : "var(--li-text)",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
            <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--li-border)" }}>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--li-primary-soft)", color: "var(--li-primary)" }}>
                ⚡ {xp} XP
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#FFF3E0", color: "#E65100" }}>
                  🔥 {streak}d streak
                </span>
              )}
              <span className="ml-auto text-xs" style={{ color: "var(--li-text-muted)" }}>
                {level}
              </span>
            </div>
          </div>
        )}
      </nav>

      {/* Level Progress Bar */}
      {progress && (
        <div style={{ background: "var(--li-primary-soft)", borderBottom: "1px solid var(--li-border)" }}>
          <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: "var(--li-primary)", minWidth: 120 }}>
              {level}
            </span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--li-border)" }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: "var(--li-primary)",
                  width: `${Math.min((xp % 200) / 200 * 100, 100)}%`,
                }}
              />
            </div>
            <span className="text-xs" style={{ color: "var(--li-text-muted)", minWidth: 60, textAlign: "right" }}>
              {xp % 200}/200 XP
            </span>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
