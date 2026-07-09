import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Home,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  LayoutGrid,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Zap,
  MoreHorizontal,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

// Full sidebar nav items
const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "My Edge", icon: TrendingUp, href: "/my-edge" },
  { label: "Guide", icon: MessageSquare, href: "/guide" },
  { label: "AI Practice Coach", icon: Zap, href: "/practice" },
  { label: "Growth Profile", icon: Activity, href: "/practice?screen=growth-profile" },
  { label: "Insights", icon: Lightbulb, href: "/insights" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
  { label: "Progress", icon: BarChart3, href: "/progress" },
  { label: "Organisation", icon: Building2, href: "/organisation" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// Bottom tab bar — 5 primary destinations + More
const BOTTOM_TABS = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "My Edge", icon: TrendingUp, href: "/my-edge" },
  { label: "Coach", icon: Zap, href: "/practice" },
  { label: "Insights", icon: Lightbulb, href: "/insights" },
  { label: "More", icon: MoreHorizontal, href: null }, // opens drawer
];

interface PlatformLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [location] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Full URL including query params for active state matching
  const fullLocation = location + (typeof window !== 'undefined' ? window.location.search : '');

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center leading-tight animate-pulse">
            <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-ln-navy)" }}>LevelNext</span>
            <span className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>The Leadership Intelligence Platform</span>
          </div>
          <p className="text-sm text-ln-muted">Loading your platform…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
        <div className="flex flex-col items-center gap-8 p-8 max-w-sm w-full">
          <div className="flex flex-col items-center leading-tight">
            <span className="text-3xl font-bold tracking-tight text-white">LevelNext</span>
            <span className="text-sm font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>The Leadership Intelligence Platform</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome to LevelNext</h1>
            <p className="text-sm" style={{ color: "oklch(80% 0.02 248.6)" }}>
              Sign in to continue your leadership journey.
            </p>
          </div>
          <a href={getLoginUrl()} className="w-full">
            <Button className="w-full h-12 text-base font-semibold" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Sign In to LevelNext
            </Button>
          </a>
          <p className="text-xs text-center" style={{ color: "oklch(60% 0.02 248.6)" }}>
            Powered by Meta Results
          </p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "LN";

  const isNavActive = (href: string) => {
    if (!href) return false;
    const itemHasQuery = href.includes('?');
    if (itemHasQuery) return fullLocation === href;
    return (location === href || location.startsWith(href + '/')) &&
      !(href === '/practice' && fullLocation.includes('screen=growth-profile'));
  };

  // "More" tab is active when current page is not in the bottom tabs
  const bottomTabPaths = BOTTOM_TABS.filter(t => t.href).map(t => t.href as string);
  const isMoreActive = !bottomTabPaths.some(p => location === p || location.startsWith(p + '/'));

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-ln-ivory)" }}>

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Full-screen slide-in drawer (mobile) ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 transition-transform duration-300 ease-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--color-ln-navy)" }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
          <Link href="/home" onClick={() => setSidebarOpen(false)} className="flex flex-col leading-tight cursor-pointer select-none">
            <span className="text-xl font-bold tracking-tight text-white">LevelNext</span>
            <span className="text-xs font-medium tracking-wide" style={{ color: "var(--color-ln-yellow)" }}>The Leadership Intelligence Platform</span>
          </Link>
          <button
            className="text-white/60 hover:text-white transition-colors p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setSidebarOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                        isActive
                          ? "text-ln-yellow border-l-2 pl-2.5"
                          : "text-white/70 hover:text-white hover:bg-white/8"
                      )}
                      style={isActive ? {
                        background: "oklch(from var(--color-ln-yellow) l c h / 0.12)",
                        borderLeftColor: "var(--color-ln-yellow)",
                        color: "var(--color-ln-yellow)",
                      } : {}}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Drawer user profile */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "oklch(30% 0.072 248.6)", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "oklch(30% 0.072 248.6 / 0.5)" }}>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="text-xs font-semibold" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Leader"}</p>
              <p className="text-xs truncate" style={{ color: "oklch(65% 0.02 248.6)" }}>{user?.email || ""}</p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 p-1"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0"
        style={{ background: "var(--color-ln-navy)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
          <Link href="/home" className="flex flex-col leading-tight cursor-pointer select-none">
            <span className="text-xl font-bold tracking-tight text-white">LevelNext</span>
            <span className="text-xs font-medium tracking-wide" style={{ color: "var(--color-ln-yellow)" }}>The Leadership Intelligence Platform</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                        isActive
                          ? "text-ln-yellow border-l-2 pl-2.5"
                          : "text-white/70 hover:text-white hover:bg-white/8"
                      )}
                      style={isActive ? {
                        background: "oklch(from var(--color-ln-yellow) l c h / 0.12)",
                        borderLeftColor: "var(--color-ln-yellow)",
                        color: "var(--color-ln-yellow)",
                      } : {}}
                    >
                      <Icon size={18} className={cn("flex-shrink-0", isActive ? "" : "group-hover:scale-105 transition-transform")} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Desktop user profile */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "oklch(30% 0.072 248.6 / 0.5)" }}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs font-semibold" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || "Leader"}</p>
              <p className="text-xs truncate" style={{ color: "oklch(65% 0.02 248.6)" }}>{user?.email || ""}</p>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top header */}
        <header
          className="lg:hidden flex items-center justify-between px-4 border-b bg-white flex-shrink-0"
          style={{
            borderColor: "var(--color-ln-border)",
            paddingTop: "max(0.75rem, env(safe-area-inset-top))",
            paddingBottom: "0.75rem",
          }}
        >
          <button
            className="p-1 -ml-1 rounded-lg transition-colors active:bg-gray-100"
            style={{ color: "var(--color-ln-navy)" }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-base font-bold tracking-tight" style={{ color: "var(--color-ln-navy)" }}>LevelNext</span>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-semibold" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page content — add bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-y-auto pb-safe-bottom lg:pb-0" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
          <div className="lg:pb-0" style={{ paddingBottom: 0 }}>
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t flex items-stretch"
        style={{
          borderColor: "var(--color-ln-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -2px 12px rgba(18,52,90,0.08)",
        }}
      >
        {BOTTOM_TABS.map((tab) => {
          const isActive = tab.href ? isNavActive(tab.href) : isMoreActive;
          const Icon = tab.icon;

          if (tab.href === null) {
            // "More" button opens drawer
            return (
              <button
                key="more"
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] transition-colors active:bg-gray-50"
                onClick={() => setSidebarOpen(true)}
                style={{ color: isMoreActive ? "var(--color-ln-navy)" : "oklch(55% 0.02 248.6)" }}
              >
                <Icon size={22} strokeWidth={isMoreActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                {isMoreActive && (
                  <span className="absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)-2px)] w-5 h-0.5 rounded-full" style={{ background: "var(--color-ln-yellow)" }} />
                )}
              </button>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div
                className="flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] w-full transition-colors active:bg-gray-50 relative"
                style={{ color: isActive ? "var(--color-ln-navy)" : "oklch(55% 0.02 248.6)" }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                    style={{ background: "var(--color-ln-yellow)" }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
