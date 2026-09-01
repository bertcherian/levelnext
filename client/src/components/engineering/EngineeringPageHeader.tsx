import * as React from "react";
import { Link, useLocation } from "wouter";
import { BrainCircuit, Compass, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

const LINKS = [
  { href: "/engineering/diagnostic", label: "Diagnostic", icon: BrainCircuit },
  { href: "/engineering/profile", label: "Operating Profile", icon: Compass },
  { href: "/engineering/partner", label: "Partner Workspace", icon: UsersRound },
];

export default function EngineeringPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const [location] = useLocation();
  const { user } = useAuth();
  const visibleLinks = LINKS.filter((item) => item.href !== "/engineering/partner" || user?.role === "admin" || user?.role === "success_partner");

  return (
    <header className="mb-7 sm:mb-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B58A00]">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#10243E] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        </div>
        <nav aria-label="Tech Intelligence sections" className="flex flex-wrap gap-2">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97]",
                active ? "border-[#10243E] bg-[#10243E] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-[#D4A900] hover:text-[#10243E]",
              )}>
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
