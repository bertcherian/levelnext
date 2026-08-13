import { Fragment, useState, useRef, useMemo } from "react";
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
  Globe,
  Users,
  Route,
  Sparkles,
  UserCheck,
  Upload,
  FileText,
  Radio,
  ClipboardList,
  Scale,
  Search,
  X as XIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CI_MODULES } from "@shared/modules/careerData";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import ProductSwitcher from "@/components/ProductSwitcher";
import { getLeaderNavigationGroups, LEADER_BOTTOM_TABS } from "@/components/leaderNavigation";

// Searchable index for Career nav — maps nested tool names to their parent route
const CI_SEARCH_INDEX: { term: string; label: string; href: string }[] = [
  // Market Intel sub-tools
  { term: "opportunities executive opportunity", label: "Opportunities", href: "/career/market-intel" },
  { term: "signals radar hiring expansion", label: "Radar Signals", href: "/career/market-intel" },
  { term: "relationships relationship graph contacts network", label: "Relationship Graph", href: "/career/market-intel" },
  { term: "access paths target organisations company", label: "Access Paths", href: "/career/market-intel" },
  { term: "outreach engine linkedin brand content", label: "Outreach Engine", href: "/career/market-intel" },
  // Prepare sub-tools
  { term: "resume makeover cv rewrite", label: "Resume Makeover", href: "/career/prepare" },
  { term: "interview prep mock questions", label: "Interview Prep", href: "/career/prepare" },
  { term: "negotiation salary offer compensation", label: "Negotiation Intelligence", href: "/career/prepare" },
  // My Journey sub-tools
  { term: "progress journey tracker completion", label: "Journey Progress", href: "/career/journey" },
  { term: "growth profile leadership scores", label: "Growth Profile", href: "/career/journey" },
];

// Tooltip descriptions for each CI nav item
const CI_NAV_TOOLTIPS: Record<string, { description: string; subItems: string[] }> = {
  "/career": { description: "Your career transition dashboard", subItems: ["Edge Score", "Daily coach prompt", "Quick diagnostics"] },
  "/diagnostics": { description: "Run career intelligence assessments", subItems: ["Career Positioning", "Resilience", "Marketability", "+ 4 more"] },
  "/guide": { description: "AI coaching chat for career questions", subItems: ["Ask anything", "Personalised advice", "Unlock insights"] },
  "/practice": { description: "Role-play practice with AI feedback", subItems: ["Difficult conversations", "Executive presence", "Debrief & score"] },
  "/career/market-intel": { description: "Find and access your next opportunity", subItems: ["Opportunities", "Radar Signals", "Relationships", "Access Paths", "Outreach"] },
  "/career/prepare": { description: "Get ready to win the role", subItems: ["Resume Makeover", "Interview Prep", "Negotiation"] },
  "/career/journey": { description: "Track your progress and growth", subItems: ["Journey Progress", "Growth Profile"] },
  "/settings": { description: "Account and platform settings", subItems: [] },
};

// Career Transition Intelligence nav items — simplified 7-item structure
const CI_NAV_ITEMS = [
  { label: "Career Home", icon: Briefcase, href: "/career" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/diagnostics" },
  { label: "Guide", icon: MessageSquare, href: "/guide", badgeKey: "guide" as const },
  { label: "Practice", icon: Zap, href: "/practice" },
  { label: "Market Intel", icon: Globe, href: "/career/market-intel" },
  { label: "Prepare", icon: ClipboardList, href: "/career/prepare" },
  { label: "My Journey", icon: BarChart3, href: "/career/journey" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

// ── CI-specific nav item with tooltip ────────────────────────────────────────
function CINavItem({
  item,
  isActive,
  badge,
  journeyPct,
  onClick,
}: {
  item: typeof CI_NAV_ITEMS[0];
  isActive: boolean;
  badge: number;
  journeyPct?: number; // 0-100, only for My Journey item
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const tooltip = CI_NAV_TOOLTIPS[item.href];
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
        isActive ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
      )}
      style={isActive ? {
        background: "oklch(from var(--color-ln-yellow) l c h / 0.12)",
        borderLeftColor: "var(--color-ln-yellow)",
        color: "var(--color-ln-yellow)",
      } : {}}
      onClick={onClick}
    >
      <Icon size={18} className={cn("flex-shrink-0", isActive ? "" : "group-hover:scale-105 transition-transform")} />
      <span className="flex-1 truncate">{item.label}</span>
      {/* Journey progress badge */}
      {item.href === "/career/journey" && journeyPct !== undefined && (
        <span
          className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: journeyPct >= 100
              ? "oklch(from #34d399 l c h / 0.25)"
              : "oklch(from var(--color-ln-yellow) l c h / 0.2)",
            color: journeyPct >= 100 ? "#34d399" : "var(--color-ln-yellow)",
          }}
          title={`${journeyPct}% complete`}
        >
          {journeyPct}%
        </span>
      )}
      {isActive && !badge && item.href !== "/career/journey" && <ChevronRight size={14} className="ml-auto opacity-60" />}
      {badge > 0 && (
        <span
          className="ml-auto flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
          style={{ minWidth: "18px", height: "18px", padding: "0 4px", background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </div>
  );

  if (!tooltip || tooltip.subItems.length === 0) return inner;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {inner}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="max-w-[200px] p-3"
        style={{ background: "var(--color-ln-navy)", border: "1px solid oklch(40% 0.05 248.6)", color: "white" }}
      >
        <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-ln-yellow)" }}>{item.label}</p>
        <p className="text-[11px] text-white/60 mb-2">{tooltip.description}</p>
        {tooltip.subItems.length > 0 && (
          <ul className="space-y-0.5">
            {tooltip.subItems.map((sub) => (
              <li key={sub} className="text-[11px] text-white/50 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "var(--color-ln-yellow)" }} />
                {sub}
              </li>
            ))}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// Manager Effectiveness Platform nav items
const MEP_NAV_ITEMS: { label: string; icon: React.ElementType; href: string; badgeKey?: string }[] = [
  { label: "Manager Home", icon: Home, href: "/manager" },
  { label: "Diagnostics", icon: LayoutGrid, href: "/manager/diagnostics" },
  { label: "Manager Guide", icon: MessageSquare, href: "/manager/guide" },
  { label: "Playbook", icon: BookOpen, href: "/manager/playbook" },
  { label: "Daily Brief", icon: Lightbulb, href: "/manager/brief" },
  { label: "Practice Partner", icon: Zap, href: "/manager/practice" },
  { label: "Commitments", icon: Activity, href: "/manager/commitments" },
  { label: "Settings", icon: Settings, href: "/settings" },
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

  // Career nav search state
  const [ciSearch, setCiSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Journey progress: count completed CI diagnostics vs total
  const { data: allReports = [] } = trpc.report.myReports.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const journeyPct = useMemo(() => {
    const total = CI_MODULES.length;
    if (total === 0) return 0;
    const ciCodes = CI_MODULES.map((m) => m.code);
    const ciReports = allReports.filter((r) => ciCodes.includes(r.moduleType));
    const latestByModule: Record<string, boolean> = {};
    for (const r of ciReports) latestByModule[r.moduleType] = true;
    const completed = Object.keys(latestByModule).length;
    return Math.round((completed / total) * 100);
  }, [allReports]);

  // CI search results
  const ciSearchResults = useMemo(() => {
    const q = ciSearch.trim().toLowerCase();
    if (!q) return [];
    return CI_SEARCH_INDEX.filter((entry) =>
      entry.term.includes(q) || entry.label.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [ciSearch]);

  // Active product detection for product-aware nav
  const { data: activeProduct } = trpc.products.getActiveProduct.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });
  const activeProductId = activeProduct?.productId ?? "leadership_intelligence";
  const isCareerProduct = activeProductId === "career_intelligence";
  const isMepProduct = activeProductId === "manager_effectiveness";

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

  // Tenant role — used to gate the Organisation nav item
  const { data: tenantData } = trpc.tenant.myTenant.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const isTenantAdmin = tenantData?.role === "owner" || tenantData?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center leading-tight animate-pulse">
            <img src="/logo.png" alt="LevelNext" className="h-14 object-contain" />
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
            <img src="/logo.png" alt="LevelNext" className="h-20 object-contain" />
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

  // "More" is active when the current page is outside the focused mobile tabs.
  const bottomTabPaths = LEADER_BOTTOM_TABS.filter((t) => t.href).map((t) => t.href as string);
  const isMoreActive = !bottomTabPaths.some((p) => location === p || location.startsWith(p + "/"));

  const leaderNavGroups = getLeaderNavigationGroups(isTenantAdmin);
  const leaderNavItems = leaderNavGroups.flatMap((group) => group.items);
  const leaderGroupByHref = new Map(
    leaderNavGroups.flatMap((group) => group.items.map((item) => [item.href, group.label] as const)),
  );
  const currentNavItems = isMepProduct ? MEP_NAV_ITEMS : isCareerProduct ? CI_NAV_ITEMS : leaderNavItems;

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
            <img src="/logo.png" alt="LevelNext" className="h-10 object-contain" />
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
          {/* CI search bar — only shown for career product */}
          {isCareerProduct && (
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(55% 0.02 248.6)" }} />
              <input
                ref={searchInputRef}
                value={ciSearch}
                onChange={(e) => setCiSearch(e.target.value)}
                placeholder="Find a tool…"
                className="w-full pl-8 pr-7 py-2 text-xs rounded-lg outline-none"
                style={{ background: "oklch(from white 15% 0 0 / 0.07)", color: "white", border: "1px solid oklch(from white 15% 0 0 / 0.12)", caretColor: "var(--color-ln-yellow)" }}
              />
              {ciSearch && (
                <button onClick={() => setCiSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  <XIcon size={12} />
                </button>
              )}
              {/* Search results dropdown */}
              {ciSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-10" style={{ background: "oklch(18% 0.05 248.6)", border: "1px solid oklch(35% 0.05 248.6)" }}>
                  {ciSearchResults.map((r) => (
                    <Link key={r.label} href={r.href} onClick={() => { setCiSearch(""); setSidebarOpen(false); }}>
                      <div className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-white/8">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-ln-yellow)" }} />
                        <span className="text-white/80">{r.label}</span>
                        <span className="ml-auto text-white/30 text-[10px] truncate">{r.href.split("/").pop()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <ul className="space-y-0.5">
            {currentNavItems.map((item, index) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
              const groupLabel = !isMepProduct && !isCareerProduct ? leaderGroupByHref.get(item.href) : undefined;
              const priorGroupLabel = !isMepProduct && !isCareerProduct && index > 0
                ? leaderGroupByHref.get(currentNavItems[index - 1]?.href)
                : undefined;
              const showGroupLabel = !!groupLabel && groupLabel !== priorGroupLabel;
              if (isCareerProduct) {
                return (
                  <li key={item.href}><Link href={item.href} onClick={() => setSidebarOpen(false)}><CINavItem item={item as typeof CI_NAV_ITEMS[0]} isActive={isActive} badge={badge} journeyPct={item.href === "/career/journey" ? journeyPct : undefined} onClick={() => setSidebarOpen(false)} /></Link></li>
                );
              }
              return (
                <Fragment key={item.href}>
                  {showGroupLabel && <li className="mt-4 mb-1 px-3"><p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>{groupLabel}</p></li>}
                  <li>
                    <Link href={item.href} onClick={() => setSidebarOpen(false)}>
                      <div className={cn("flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group", isActive ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8")} style={isActive ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}>
                        <Icon size={18} className="flex-shrink-0" />
                        <span>{item.label}</span>
                        {isActive && !badge && <ChevronRight size={14} className="ml-auto opacity-60" />}
                        {badge > 0 && <NavBadge count={badge} />}
                      </div>
                    </Link>
                  </li>
                </Fragment>
              );
            })}
            {/* Admin-only nav items */}
            {user?.role === "admin" && (() => {
              const isActiveAdmin = location === "/admin";
              const isActivePilot = isNavActive("/admin/pilot-applications");
              const isActiveInvites = isNavActive("/admin/invites");
              const isActiveMomentumMobile = isNavActive("/admin/momentum");
              const isActiveLSOSMobile = isNavActive("/admin/lsos");
              const isActiveEscalationsMobile = isNavActive("/admin/escalations");
              const isActiveEnrollmentsMobile = isNavActive("/admin/enrollments");
              const isActiveSPsMobile = isNavActive("/admin/success-partners");
              const isActiveOrgContextMobile = isNavActive("/admin/org-context");
              const isActiveImportMobile = isNavActive("/admin/participants/import");
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
                  <li key="/admin/lsos-mobile">
                    <Link href="/admin/lsos" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveLSOSMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveLSOSMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Zap size={18} className="flex-shrink-0" />
                        <span>SP Workspace</span>
                        {isActiveLSOSMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
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
                        <span>Success Partner</span>
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
                  <li key="/admin/success-partners-mobile">
                    <Link href="/admin/success-partners" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPsMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPsMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <UserCheck size={18} className="flex-shrink-0" />
                        <span>Manage SPs</span>
                        {isActiveSPsMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/org-context-mobile">
                    <Link href="/admin/org-context" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveOrgContextMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveOrgContextMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Building2 size={18} className="flex-shrink-0" />
                        <span>Org Context</span>
                        {isActiveOrgContextMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/participants/import-mobile">
                    <Link href="/admin/participants/import" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveImportMobile ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveImportMobile ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Upload size={18} className="flex-shrink-0" />
                        <span>Import Participants</span>
                        {isActiveImportMobile && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                </>
              );
            })()}
            {/* SP-only nav items (success_partner role) */}
            {user?.role === "success_partner" && (() => {
              const isActiveSPLSOS = isNavActive("/admin/lsos");
              const isActiveSPQueue = isNavActive("/admin/momentum");
              const isActiveSPEscalations = isNavActive("/admin/escalations");
              return (
                <>
                  <li key="/sp-section-mobile">
                    <div className="mt-3 mb-1 px-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>Success Partner</p>
                    </div>
                  </li>
                  <li key="/sp-lsos-mobile">
                    <Link href="/admin/lsos" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPLSOS ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPLSOS ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Zap size={18} className="flex-shrink-0" />
                        <span>SP Workspace</span>
                        {isActiveSPLSOS && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/sp-queue-mobile">
                    <Link href="/admin/momentum" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPQueue ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPQueue ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Phone size={18} className="flex-shrink-0" />
                        <span>Call Queue</span>
                        {isActiveSPQueue && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/sp-escalations-mobile">
                    <Link href="/admin/escalations" onClick={() => setSidebarOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPEscalations ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPEscalations ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <AlertCircle size={18} className="flex-shrink-0" />
                        <span>Escalation Inbox</span>
                        {isActiveSPEscalations && <ChevronRight size={14} className="ml-auto opacity-60" />}
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
            <img src="/logo.png" alt="LevelNext" className="h-10 object-contain" />
            <span className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>Leadership Intelligence Platform</span>
          </Link>
        </div>

        {/* Product Switcher */}
        <ProductSwitcher />
        {/* Desktop nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* CI search bar — only shown for career product */}
          {isCareerProduct && (
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(55% 0.02 248.6)" }} />
              <input
                value={ciSearch}
                onChange={(e) => setCiSearch(e.target.value)}
                placeholder="Find a tool…"
                className="w-full pl-8 pr-7 py-2 text-xs rounded-lg outline-none"
                style={{ background: "oklch(from white 15% 0 0 / 0.07)", color: "white", border: "1px solid oklch(from white 15% 0 0 / 0.12)", caretColor: "var(--color-ln-yellow)" }}
              />
              {ciSearch && (
                <button onClick={() => setCiSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  <XIcon size={12} />
                </button>
              )}
              {/* Search results dropdown */}
              {ciSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-10" style={{ background: "oklch(18% 0.05 248.6)", border: "1px solid oklch(35% 0.05 248.6)" }}>
                  {ciSearchResults.map((r) => (
                    <Link key={r.label} href={r.href} onClick={() => setCiSearch("")}>
                      <div className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-white/8">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-ln-yellow)" }} />
                        <span className="text-white/80">{r.label}</span>
                        <span className="ml-auto text-white/30 text-[10px] truncate">{r.href.split("/").pop()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <ul className="space-y-0.5">
            {currentNavItems.map((item, index) => {
              const isActive = isNavActive(item.href);
              const Icon = item.icon;
              const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
              const groupLabel = !isMepProduct && !isCareerProduct ? leaderGroupByHref.get(item.href) : undefined;
              const priorGroupLabel = !isMepProduct && !isCareerProduct && index > 0
                ? leaderGroupByHref.get(currentNavItems[index - 1]?.href)
                : undefined;
              const showGroupLabel = !!groupLabel && groupLabel !== priorGroupLabel;
              if (isCareerProduct) {
                return (
                  <li key={item.href}><Link href={item.href}><CINavItem item={item as typeof CI_NAV_ITEMS[0]} isActive={isActive} badge={badge} journeyPct={item.href === "/career/journey" ? journeyPct : undefined} /></Link></li>
                );
              }
              return (
                <Fragment key={item.href}>
                  {showGroupLabel && <li className="mt-4 mb-1 px-3"><p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>{groupLabel}</p></li>}
                  <li>
                    <Link href={item.href}>
                      <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group", isActive ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8")} style={isActive ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}>
                        <Icon size={18} className={cn("flex-shrink-0", isActive ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>{item.label}</span>
                        {isActive && !badge && <ChevronRight size={14} className="ml-auto opacity-60" />}
                        {badge > 0 && <NavBadge count={badge} />}
                      </div>
                    </Link>
                  </li>
                </Fragment>
              );
            })}
            {/* Admin-only nav items */}
            {user?.role === "admin" && (() => {
              const isActiveAdmin = location === "/admin";
              const isActivePilot = isNavActive("/admin/pilot-applications");
              const isActiveInvites = isNavActive("/admin/invites");
              const isActiveMomentum = isNavActive("/admin/momentum");
              const isActiveLSOS = isNavActive("/admin/lsos");
              const isActiveEscalations = isNavActive("/admin/escalations");
              const isActiveEnrollments = isNavActive("/admin/enrollments");
              const isActiveSPs = isNavActive("/admin/success-partners");
              const isActiveOrgContext = isNavActive("/admin/org-context");
              const isActiveImport = isNavActive("/admin/participants/import");
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
                  <li key="/admin/lsos">
                    <Link href="/admin/lsos">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveLSOS ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveLSOS ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Zap size={18} className={cn("flex-shrink-0", isActiveLSOS ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>SP Workspace</span>
                        {isActiveLSOS && <ChevronRight size={14} className="ml-auto opacity-60" />}
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
                        <span>Success Partner</span>
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
                  <li key="/admin/success-partners">
                    <Link href="/admin/success-partners">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPs ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPs ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <UserCheck size={18} className={cn("flex-shrink-0", isActiveSPs ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Manage SPs</span>
                        {isActiveSPs && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/org-context">
                    <Link href="/admin/org-context">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveOrgContext ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveOrgContext ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Building2 size={18} className={cn("flex-shrink-0", isActiveOrgContext ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Org Context</span>
                        {isActiveOrgContext && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/admin/participants/import">
                    <Link href="/admin/participants/import">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveImport ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveImport ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Upload size={18} className={cn("flex-shrink-0", isActiveImport ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Import Participants</span>
                        {isActiveImport && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                </>
              );
            })()}
            {/* SP-only nav items (success_partner role) */}
            {user?.role === "success_partner" && (() => {
              const isActiveSPLSOS = isNavActive("/admin/lsos");
              const isActiveSPQueue = isNavActive("/admin/momentum");
              const isActiveSPEscalations = isNavActive("/admin/escalations");
              return (
                <>
                  <li key="/sp-section-desktop">
                    <div className="mt-3 mb-1 px-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(45% 0.02 248.6)" }}>Success Partner</p>
                    </div>
                  </li>
                  <li key="/sp-lsos-desktop">
                    <Link href="/admin/lsos">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPLSOS ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPLSOS ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Zap size={18} className={cn("flex-shrink-0", isActiveSPLSOS ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>SP Workspace</span>
                        {isActiveSPLSOS && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/sp-queue-desktop">
                    <Link href="/admin/momentum">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPQueue ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPQueue ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <Phone size={18} className={cn("flex-shrink-0", isActiveSPQueue ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Call Queue</span>
                        {isActiveSPQueue && <ChevronRight size={14} className="ml-auto opacity-60" />}
                      </div>
                    </Link>
                  </li>
                  <li key="/sp-escalations-desktop">
                    <Link href="/admin/escalations">
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                          isActiveSPEscalations ? "text-ln-yellow border-l-2 pl-2.5" : "text-white/70 hover:text-white hover:bg-white/8"
                        )}
                        style={isActiveSPEscalations ? { background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", borderLeftColor: "var(--color-ln-yellow)", color: "var(--color-ln-yellow)" } : {}}
                      >
                        <AlertCircle size={18} className={cn("flex-shrink-0", isActiveSPEscalations ? "" : "group-hover:scale-105 transition-transform")} />
                        <span>Escalation Inbox</span>
                        {isActiveSPEscalations && <ChevronRight size={14} className="ml-auto opacity-60" />}
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
          <img src="/logo.png" alt="LevelNext" className="h-8 object-contain" style={{ filter: "brightness(0) saturate(100%) invert(17%) sepia(41%) saturate(800%) hue-rotate(190deg) brightness(85%)" }} />
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
        {LEADER_BOTTOM_TABS.map((tab) => {
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
