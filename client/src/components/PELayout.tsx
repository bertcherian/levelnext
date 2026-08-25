/**
 * Professional Effectiveness Intelligence — Persistent Sidebar Layout
 * Desktop: collapsible left sidebar
 * Mobile: hamburger button in top bar → slide-in drawer overlay
 */
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ADMINISTRATOR_CONTROLS, isPlatformAdministrator } from "@/lib/adminControls";
import {
  LayoutGrid,
  MessageSquare,
  Zap,
  Activity,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";

const LOGO_URL = "/logo.png";

const NAV_ITEMS = [
  { href: "/pe", label: "Home", icon: Home, exact: true },
  { href: "/pe/assessment", label: "PEI Assessment", icon: LayoutGrid },
  { href: "/pe/coach", label: "AI Coach", icon: MessageSquare },
  { href: "/pe/practice", label: "Practice", icon: Zap },
  { href: "/pe/progress", label: "My Progress", icon: Activity },
  { href: "/pe/settings", label: "Settings", icon: Settings },
];

interface PELayoutProps {
  children: React.ReactNode;
}

export default function PELayout({ children }: PELayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdministrator = isPlatformAdministrator(user?.role);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location === item.href;
    return location.startsWith(item.href);
  };

  const navContent = (onItemClick?: () => void) => (
    <nav className="flex-1 px-2 py-2 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link key={item.href} href={item.href}>
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
              style={{
                background: active ? "oklch(from #d4af37 l c h / 0.15)" : "transparent",
                border: active ? "1px solid oklch(from #d4af37 l c h / 0.3)" : "1px solid transparent",
              }}
              title={collapsed ? item.label : undefined}
              onClick={onItemClick}
            >
              <Icon
                size={16}
                className="flex-shrink-0"
                style={{ color: active ? "#d4af37" : "oklch(65% 0.02 248.6)" }}
              />
              {!collapsed && (
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: active ? "#ffffff" : "oklch(65% 0.02 248.6)" }}
                >
                  {item.label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
      {isAdministrator && (
        <>
          {!collapsed && <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#d4af37" }}>Administrator</p>}
          {ADMINISTRATOR_CONTROLS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{ background: active ? "oklch(from #d4af37 l c h / 0.15)" : "transparent", border: active ? "1px solid oklch(from #d4af37 l c h / 0.3)" : "1px solid transparent" }}
                  title={collapsed ? item.label : undefined}
                  onClick={onItemClick}
                >
                  <Icon size={16} className="flex-shrink-0" style={{ color: active ? "#d4af37" : "oklch(65% 0.02 248.6)" }} />
                  {!collapsed && <span className="text-sm font-medium truncate" style={{ color: active ? "#ffffff" : "oklch(65% 0.02 248.6)" }}>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? "64px" : "220px",
          background: "var(--color-ln-navy)",
          borderRight: "1px solid oklch(from white 15% 0 0 / 0.08)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          className="flex items-center px-4 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid oklch(from white 15% 0 0 / 0.08)" }}
        >
          {!collapsed ? (
            <img src={LOGO_URL} alt="LevelNext" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={LOGO_URL} alt="LevelNext" style={{ height: "28px", width: "28px", objectFit: "contain" }} />
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#d4af37" }}>
              Professional Effectiveness
            </p>
          </div>
        )}

        {navContent()}

        <div className="flex-shrink-0 px-3 py-4" style={{ borderTop: "1px solid oklch(from white 15% 0 0 / 0.08)" }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center w-full py-2 rounded-lg transition-colors duration-150"
            style={{ background: "oklch(from white 15% 0 0 / 0.06)", color: "oklch(55% 0.02 248.6)" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!collapsed && <span className="text-xs ml-2">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex flex-col flex-1 min-w-0">
        <header
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0 sticky top-0 z-30"
          style={{ background: "var(--color-ln-navy)", borderBottom: "1px solid oklch(from white 15% 0 0 / 0.08)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: "oklch(from white 15% 0 0 / 0.08)", color: "oklch(75% 0.02 248.6)" }}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <img src={LOGO_URL} alt="LevelNext" style={{ height: "26px", width: "auto", objectFit: "contain" }} />
          <p className="text-xs font-semibold uppercase tracking-widest ml-1" style={{ color: "#d4af37" }}>
            Prof. Effectiveness
          </p>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0"
              style={{ background: "oklch(0% 0 0 / 0.55)" }}
              onClick={() => setMobileOpen(false)}
            />
            <div
              className="relative flex flex-col w-72 h-full"
              style={{ background: "var(--color-ln-navy)", borderRight: "1px solid oklch(from white 15% 0 0 / 0.08)" }}
            >
              <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid oklch(from white 15% 0 0 / 0.08)" }}>
                <img src={LOGO_URL} alt="LevelNext" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ background: "oklch(from white 15% 0 0 / 0.08)", color: "oklch(65% 0.02 248.6)" }}
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#d4af37" }}>
                  Professional Effectiveness
                </p>
              </div>
              {navContent(() => setMobileOpen(false))}
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Desktop main content */}
      <main className="hidden md:block flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
