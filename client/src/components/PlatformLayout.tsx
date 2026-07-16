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
  Briefcase,
  Link2,
  LayoutDashboard,
  Phone,
  AlertCircle,
  UserCog,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import ProductSwitcher from "@/components/ProductSwitcher";

// Full sidebar nav items
const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "My Edge", icon: TrendingUp, href: "/my-edge" },
  { label: "Guide", icon: MessageSquare, href: "/guide", badgeKey: "guide" as const },
  { label: "Practice", icon: Zap, href: "/practice" },
  { label: "Playbook", icon: BookOpen, href: "/playbook" },
  { label: "Growth Profile", icon: Activity, href: "/growth-profile" },
  { label: "Insights", icon: Lightbulb, href: "/insights" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
  { label: "Progress", icon: BarChart3, href: "/progress" },
  { label: "Organisation", icon: Building2, href: "/organisation" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// Career Intelligence nav items
const CI_NAV_ITEMS = [
  { label: "Career Home", icon: Briefcase, href: "/career" },
  { label: "Guide", icon: MessageSquare, href: "/guide", badgeKey: "guide" as const },
  { label: "Practice", icon: Zap, href: "/practice" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
  { label: "Progress", icon: BarChart3, href: "/career/progress" },
  { label: "Growth Profile", icon: Activity, href: "/growth-profile" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// Bottom tab bar — 5 primary destinations + More
const BOTTOM_TABS = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "My Edge", icon: TrendingUp, href: "/my-edge" },
  { label: "Growth", icon: Activity, href: "/growth-profile" },
  { label: "Insights", icon: Lightbulb, href: "/insights" },
  { label: "More", icon: MoreHorizontal, href: null }, // opens drawer
];

interface PlatformLayoutProps {
  children: React.ReactNode;
  title?: string;
}

// ── Small notification dot/badge ─────────────────────────────────────────────
function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-auto flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
      style={{
        minWidth: "18px",
        height: "18px",
        padding: "0 4px",
        background: "var(--color-ln-yellow)",
        color: "var(--color-ln-navy)",
      }}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [location] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Full URL including query params for active state matching
  const fullLocation = location + (typeof window !== "undefined" ? window.location.search : "");

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      window.location.href = "/";
    },
  });

  // Active product detection for product-aware nav
  const { data: activeProduct } = trpc.products.getActiveProduct.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
  const activeProductId = activeProduct?.productId ?? "leadership_intelligence";
  const isCareerProduct = activeProductId === "career_intelligence";

  // Notification badge: count of modules where all gates have passed but the
  // narrative has not yet been shown (i.e. user is ready for next diagnostic
  // but hasn't seen the Guide message yet).
  const { data: unlockStatuses } = trpc.unlock.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60_000, // refresh every minute
  });
  const pendingUnlockCount = unlockStatuses
    ? unlockStatuses.filter((s) => s.narrativeReady && !s.narrativeShown).length
    : 0;

  // Badge map keyed by badgeKey
  const badgeCounts: Record<string, number> = {
    guide: pendingUnlockCount,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center leading-tight animate-pulse">
            <img src="/manus-storage/LevelNext_logo_transparent_570ab0aa.png" alt="LevelNext" className="h-14 object-contain" />
            <span className="text-xs font-medium tracking-wide mt-1" style={{ color: "var(--color-ln-yellow)" }}>Leadership Intelligence Platform</span>
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
            <img src="/manus-storage/LevelNext_logo_transparent_570ab0aa.png" alt="LevelNext" className="h-20 object-contain" />
            <span className="text-sm font-medium tracking-wide mt-1" style={{ color: "var(--color-ln-yellow)" }}>Leadership Intelligence Platform</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome to LevelNext</h1>
            <p className="text-sm" style={{ color: "oklch(80% 0.02 248.6)" }}>
              Sign in to continue your leadership journey.
            </p>
          </div>
          <a href="/login" className="w-full">
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
    const itemHasQuery = href.includes("?");
    if (itemHasQuery) return fullLocation === href;
    return (
      (location === href || location.startsWith(href + "/")) &&
      true
    );
  };

  // "More" tab is active when current page is not in the bottom tabs
  const bottomTabPaths = BOTTOM_TABS.filter((t) => t.href).map((t) => t.href as string);
  const isMoreActive = !bottomTabPaths.some((p) => location === p || location.startsWith(p + "/"));

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
            <img src="/manus-storage/LevelNext_logo_transparent_570ab0aa.png" alt="LevelNext" className="h-10 object-contain" />
            <span className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>Leadership Intelligence Platform</span>
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
            {(isCareerProduct ? CI_NAV_ITEMS : NAV_ITEMS).map((item) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
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
                      {isActive && !badge && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      {badge > 0 && <NavBadge count={badge} />}
                    </div>
                  </Link>
                </li>
              );
            })}
            {/* Admin-only nav items */}
            {user?.role === "admin" && (() => {
              const isActiveAdmin = location === "/admin";
              const isActivePilot = isNavActive("/admin/pilot-applications");
              const isActiveInvites = isNavActive("/admin/invites");
              const isActiveMomentumMobile = isNavActive("/admin/momentum");
              const isActiveEscalationsMobile = isNavActive("/admin/escalations");
              const isActiveEnrollmentsMobile = isNavActive("/admin/enrollments");
              return (
                <>
                  <li key="/admin-section-mobile">
                    <div className="mt-3 mb-1 px-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>Admin</p>
                    </div>
                  </li>
                  <li key="/admin-mobile">
                    <Link href="/admin" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveAdmin ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveAdmin ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <LayoutDashboard size={18} className="flex-shrink-0" />
                        <span>Admin Dashboard</span>
                        {isActiveAdmin && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/pilot-applications-mobile">
                    <Link href="/admin/pilot-applications" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActivePilot ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActivePilot ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Briefcase size={18} className="flex-shrink-0" />
                        <span>Pilot Applications</span>
                        {isActivePilot && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/invites-mobile">
                    <Link href="/admin/invites" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveInvites ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveInvites ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Link2 size={18} className="flex-shrink-0" />
                        <span>Manage Invites</span>
                        {isActiveInvites && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/momentum-mobile">
                    <Link href="/admin/momentum" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveMomentumMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveMomentumMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Phone size={18} className="flex-shrink-0" />
                        <span>Momentum Partner</span>
                        {isActiveMomentumMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/escalations-mobile">
                    <Link href="/admin/escalations" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveEscalationsMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveEscalationsMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <AlertCircle size={18} className="flex-shrink-0" />
                        <span>Escalation Inbox</span>
                        {isActiveEscalationsMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/enrollments-mobile">
                    <Link href="/admin/enrollments" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveEnrollmentsMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveEnrollmentsMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <UserCog size={18} className="flex-shrink-0" />
                        <span>Product Enrollments</span>
                        {isActiveEnrollmentsMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                </>
              );
            })()}
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
            <img src="/manus-storage/LevelNext_logo_transparent_570ab0aa.png" alt="LevelNext" className="h-10 object-contain" />
            <span className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>Leadership Intelligence Platform</span>
          </Link>
        </div>

        {/* Product Switcher */}
        <ProductSwitcher />
        {/* Desktop nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {(isCareerProduct ? CI_NAV_ITEMS : NAV_ITEMS).map((item) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
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
                      {isActive && !badge && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      {badge > 0 && <NavBadge count={badge} />}
                    </div>
                  </Link>
                </li>
              );
            })}
            {/* Admin-only nav items */}
            {user?.role === "admin" && (() => {
              const isActiveAdmin = location === "/admin";
              const isActivePilot = isNavActive("/admin/pilot-applications");
              const isActiveInvites = isNavActive("/admin/invites");
              const isActiveMomentum = isNavActive("/admin/momentum");
              const isActiveEscalations = isNavActive("/admin/escalations");
              const isActiveEnrollments = isNavActive("/admin/enrollments");
              return (
                <>
                  <li key="/admin-section-desktop">
                    <div className="mt-3 mb-1 px-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>Admin</p>
                    </div>
                  </li>
                  <li key="/admin-desktop">
                    <Link href="/admin">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveAdmin ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveAdmin ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <LayoutDashboard size={18} className={cn("flex-shrink-0", isActiveAdmin ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Admin Dashboard</span>
                        {isActiveAdmin && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/pilot-applications">
                    <Link href="/admin/pilot-applications">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActivePilot ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActivePilot ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Briefcase size={18} className={cn("flex-shrink-0", isActivePilot ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Pilot Applications</span>
                        {isActivePilot && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/invites">
                    <Link href="/admin/invites">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveInvites ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveInvites ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Link2 size={18} className={cn("flex-shrink-0", isActiveInvites ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Manage Invites</span>
                        {isActiveInvites && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/momentum">
                    <Link href="/admin/momentum">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveMomentum ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveMomentum ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Phone size={18} className={cn("flex-shrink-0", isActiveMomentum ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Momentum Partner</span>
                        {isActiveMomentum && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/escalations">
                    <Link href="/admin/escalations">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveEscalations ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveEscalations ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <AlertCircle size={18} className={cn("flex-shrink-0", isActiveEscalations ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Escalation Inbox</span>
                        {isActiveEscalations && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/enrollments">
                    <Link href="/admin/enrollments">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveEnrollments ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveEnrollments ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <UserCog size={18} className={cn("flex-shrink-0", isActiveEnrollments ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Product Enrollments</span>
                        {isActiveEnrollments && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                </>
              );
            })()}
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
            className="p-1 -ml-1 rounded-lg transition-colors active:bg-gray-100 relative"
            style={{ color: "var(--color-ln-navy)" }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
            {/* Red dot on hamburger when there are pending notifications */}
            {pendingUnlockCount > 0 && (
              <span
                className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ background: "#ef4444" }}
              />
            )}
          </button>
          <img src="/manus-storage/LevelNext_logo_transparent_570ab0aa.png" alt="LevelNext" className="h-8 object-contain" style={{ filter: "brightness(0) saturate(100%) invert(17%) sepia(41%) saturate(800%) hue-rotate(190deg) brightness(85%)" }} />
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
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] transition-colors active:bg-gray-50 relative"
                onClick={() => setSidebarOpen(true)}
                style={{ color: isMoreActive ? "var(--color-ln-navy)" : "oklch(55% 0.02 248.6)" }}
              >
                <Icon size={22} strokeWidth={isMoreActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                {/* Red dot on More tab when notifications are pending */}
                {pendingUnlockCount > 0 && (
                  <span
                    className="absolute top-1.5 right-[calc(50%-14px)] w-2 h-2 rounded-full"
                    style={{ background: "#ef4444" }}
                  />
                )}
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
