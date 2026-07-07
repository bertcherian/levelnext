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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

const LOGO_URL = "/manus-storage/levelnext-logo_525d7189.png";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "My Edge", icon: TrendingUp, href: "/my-edge" },
  { label: "Guide", icon: MessageSquare, href: "/guide" },
  { label: "Insights", icon: Lightbulb, href: "/insights" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
  { label: "Progress", icon: BarChart3, href: "/progress" },
  { label: "Organisation", icon: Building2, href: "/organisation" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface PlatformLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function PlatformLayout({ children, title }: PlatformLayoutProps) {
  const [location] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <img src={LOGO_URL} alt="LevelNext" className="h-12 w-auto animate-pulse" />
          <p className="text-sm text-ln-muted">Loading your platform…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
        <div className="flex flex-col items-center gap-8 p-8 max-w-sm w-full">
          <img src={LOGO_URL} alt="LevelNext" className="h-16 w-auto" />
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome to LevelNext</h1>
            <p className="text-sm" style={{ color: "oklch(80% 0.02 248.6)" }}>
              The Leadership Intelligence Platform. Sign in to continue your leadership journey.
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

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "var(--color-ln-navy)" }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
          <Link href="/home">
            <img src={LOGO_URL} alt="LevelNext" className="h-9 w-auto cursor-pointer" />
          </Link>
          <button
            className="lg:hidden text-white/60 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
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
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={18} className={cn("flex-shrink-0", isActive ? "" : "group-hover:scale-105 transition-transform")} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile area */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-white" style={{ borderColor: "var(--color-ln-border)" }}>
          <button
            className="text-ln-navy"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <img src={LOGO_URL} alt="LevelNext" className="h-7 w-auto" />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-semibold" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
