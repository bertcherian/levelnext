import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../_core/hooks/useAuth";
import {
  Compass,
  GraduationCap,
  HelpCircle,
  Map,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface AcademyLayoutProps {
  children: ReactNode;
  stageBadge?: string;
}

export default function AcademyLayout({ children, stageBadge = "Product Fluency" }: AcademyLayoutProps) {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  const navItems = [
    { href: "/academy", label: "Academy Home", icon: Compass },
    { href: "/academy/diagnostic", label: "Diagnostic", icon: Sparkles },
    { href: "/academy/map", label: "Product Map", icon: Map },
    { href: "/academy/mentor", label: "Product Mentor", icon: HelpCircle },
    { href: "/academy/passport", label: "Passport", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-[#F8F5F0] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#0A1A2F]">
      {/* Top Banner */}
      <header className="border-b border-[#D4AF37]/20 bg-[#0A1A2F]/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2 text-xs text-[#D4AF37] hover:text-[#F8F5F0] transition">
            <ArrowLeft size={14} />
            <span>Return to LevelNext Platform</span>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="LevelNext" className="h-6 w-auto object-contain" />
            <span className="font-semibold text-sm tracking-wide flex items-center gap-1.5">
              Academy
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                {stageBadge}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-[#F8F5F0]">{user?.name ?? "Team Member"}</p>
            <p className="text-[11px] text-[#D4AF37]/80 capitalize">{user?.role ?? "Learner"}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
            {user?.name ? user.name.charAt(0).toUpperCase() : "LN"}
          </div>
        </div>
      </header>

      {/* Academy Secondary Navigation Bar */}
      <nav className="bg-[#1C1C1C]/80 border-b border-white/5 px-4 lg:px-8 py-2 overflow-x-auto flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition shrink-0 ${
                isActive
                  ? "bg-[#D4AF37] text-[#0A1A2F] font-semibold shadow-sm"
                  : "text-[#F8F5F0]/70 hover:text-[#F8F5F0] hover:bg-white/5"
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mx-auto mb-4" />
            <p className="text-sm text-[#F8F5F0]/70">Checking Academy access...</p>
          </div>
        ) : !user ? (
          <div className="max-w-lg mx-auto py-20">
            <div className="bg-[#1C1C1C] border border-[#D4AF37]/30 rounded-2xl p-8 text-center shadow-xl space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto">
                <GraduationCap size={22} className="text-[#D4AF37]" />
              </div>
              <h1 className="text-xl font-bold text-white">Sign in to enter the Academy</h1>
              <p className="text-sm text-[#F8F5F0]/70 leading-relaxed">
                LevelNext Academy is a private product-fluency workspace. Your diagnostic responses, reflections, and practice evidence belong to you.
              </p>
              <Link
                href={`/login?returnTo=${encodeURIComponent(location)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition"
              >
                Sign in to continue <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Academy Footer Guarantee */}
      <footer className="border-t border-white/10 bg-[#071322] px-4 lg:px-8 py-4 text-center text-xs text-white/50 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>LevelNext Academy • Internal Product & Capability Fluency</p>
        <p className="text-[11px] text-[#D4AF37]/70">
          Privacy Protected: Individual reflections and practice attempts remain private to the learner.
        </p>
      </footer>
    </div>
  );
}
