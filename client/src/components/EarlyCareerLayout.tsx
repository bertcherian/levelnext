import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ADMINISTRATOR_CONTROLS, isPlatformAdministrator } from "@/lib/adminControls";
import { BarChart3, BriefcaseBusiness, ClipboardCheck, Compass, Home, MessageCircle, ShieldCheck, Sparkles, Theater, UsersRound } from "lucide-react";

const NAV_ITEMS = [
  { href: "/early-career", label: "Today", icon: Home, exact: true },
  { href: "/early-career/diagnostic", label: "Diagnostic", icon: ClipboardCheck },
  { href: "/early-career/guide", label: "Guide", icon: MessageCircle },
  { href: "/early-career/practice", label: "Practice", icon: Theater },
  { href: "/early-career/hr", label: "Cohort", icon: BarChart3 },
  { href: "/early-career/growth", label: "My Growth", icon: Compass },
  { href: "/early-career/manager", label: "Manager Companion", icon: UsersRound },
];

export default function EarlyCareerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdministrator = isPlatformAdministrator(user?.role);

  return (
    <div className="min-h-screen" style={{ background: "#F8F5F0", color: "#0A1A2F" }}>
      <header className="border-b" style={{ borderColor: "#D9D2C5", background: "#0A1A2F" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 md:px-8">
          <Link href="/early-career" className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "#D4AF37", color: "#0A1A2F" }}>
              <BriefcaseBusiness size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">LevelNext</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.17em]" style={{ color: "#D4AF37" }}>Early Career Intelligence</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border px-3 py-1.5 md:flex" style={{ borderColor: "rgba(212,175,55,.35)", color: "#F8F5F0" }}>
            <Sparkles size={14} style={{ color: "#D4AF37" }} aria-hidden="true" />
            <span className="text-xs font-medium">Your First 1,000 Days</span>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b bg-[#F8F5F0]/95 backdrop-blur" style={{ borderColor: "#D9D2C5" }} aria-label="Early Career navigation">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 md:px-8">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? location === item.href : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  background: active ? "#0A1A2F" : "transparent",
                  color: active ? "#F8F5F0" : "#56616D",
                }}
              >
                <Icon size={16} aria-hidden="true" style={{ color: active ? "#D4AF37" : "currentColor" }} />
                {item.label}
              </Link>
            );
          })}
          {isAdministrator && ADMINISTRATOR_CONTROLS.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors" style={{ background: active ? "#0A1A2F" : "#EFE9DE", color: active ? "#F8F5F0" : "#0A1A2F" }}>
                <Icon size={16} aria-hidden="true" style={{ color: active ? "#D4AF37" : "currentColor" }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main>{children}</main>

      <footer className="mx-auto mt-12 flex max-w-7xl items-start gap-3 border-t px-4 py-6 text-xs md:px-8" style={{ borderColor: "#D9D2C5", color: "#6B6258" }}>
        <ShieldCheck size={16} className="mt-0.5 shrink-0" style={{ color: "#0A1A2F" }} aria-hidden="true" />
        <p>Your private coaching conversations and reflections are not shared with your manager or HR. Manager Companion uses only manager-visible profile context and employee-shared commitments.</p>
      </footer>
    </div>
  );
}
