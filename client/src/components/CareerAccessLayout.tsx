import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Target,
  Users,
  Map,
  Briefcase,
  Zap,
  BarChart3,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ArrowLeftRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const CA_NAV_ITEMS = [
  {
    label: "Command Centre",
    icon: Zap,
    href: "/career-access",
    description: "AI Chief of Staff briefing",
  },
  {
    label: "Career Strategy",
    icon: Target,
    href: "/career-access/strategy",
    description: "Strategy & positioning",
  },
  {
    label: "Opportunity CRM",
    icon: Briefcase,
    href: "/career-access/opportunities",
    description: "Target company pipeline",
  },
  {
    label: "Relationship Graph",
    icon: Users,
    href: "/career-access/relationships",
    description: "Network intelligence",
  },
  {
    label: "Access Paths",
    icon: Map,
    href: "/career-access/access-paths",
    description: "Warm intro strategies",
  },
  {
    label: "Access Score",
    icon: BarChart3,
    href: "/career-access/score",
    description: "12-dimension readiness",
  },
  {
    label: "Career Profile",
    icon: User,
    href: "/career-access/profile",
    description: "Your career data",
  },
];

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_a0b1c2d3.png";

interface CareerAccessLayoutProps {
  children: React.ReactNode;
}

export function CareerAccessLayout({ children }: CareerAccessLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  const switchMutation = trpc.products.switchProduct.useMutation({
    onSuccess: () => { window.location.href = "/career"; },
  });

  const isActive = (href: string) => {
    if (href === "/career-access") return location === "/career-access";
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
        <img src={LOGO_URL} alt="LevelNext" className="h-8 w-auto object-contain flex-shrink-0" />
        {!collapsed && (
          <div>
            <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest leading-none">Executive Opportunity System</div>
            <div className="text-[10px] text-white/50 mt-0.5">Intelligence™</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {CA_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  active
                    ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    <div className="text-[10px] text-white/40 truncate">{item.description}</div>
                  </div>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Platform switcher */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => switchMutation.mutate({ productId: "career_intelligence" })}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-all text-sm ${collapsed ? "justify-center" : ""}`}
          title="Switch to Career Intelligence"
        >
          <ArrowLeftRight size={16} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">Career Intelligence</span>}
        </button>

        {/* User + logout */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white/80 truncate">{user.name}</div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-white/40 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8F5F0] overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#0A1A2F] transition-all duration-200 flex-shrink-0 relative ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0A1A2F] border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0A1A2F] flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#0A1A2F] border-b border-white/10">
          <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white">
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-[#D4AF37]">Executive Opportunity System™</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
