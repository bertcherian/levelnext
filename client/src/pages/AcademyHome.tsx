import { Link } from "wouter";
import AcademyLayout from "../components/AcademyLayout";
import { trpc } from "../lib/trpc";
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { slugToLabel } from "@shared/modules/academy";

export default function AcademyHome() {
  const { data: passport, isLoading } = trpc.academy.getPassportSummary.useQuery();

  if (isLoading || !passport) {
    return (
      <AcademyLayout stageBadge="Loading...">
        <div className="py-24 text-center">
          <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#F8F5F0]/70">Loading your Product Fluency workspace...</p>
        </div>
      </AcademyLayout>
    );
  }

  const { profile, compositeScore, fluencyLevel, dimensionScores, gaps } = passport;

  const getPrimaryNextAction = () => {
    if (compositeScore < 40) {
      return {
        title: "Complete Baseline Diagnostic",
        desc: "Calibrate your understanding across LevelNext's core thesis, product families, and change loop.",
        href: "/academy/diagnostic",
        buttonText: "Start Diagnostic",
      };
    }
    if (compositeScore < 75) {
      return {
        title: "Explore the First-Time Manager Golden Journey",
        desc: "Walk through Aarav's transition story from conflict avoidance to simulator rehearsal and real-work commitments.",
        href: "/academy/map",
        buttonText: "Open Product Map",
      };
    }
    return {
      title: "Test Explanation with Product Mentor",
      desc: "Simulate answering executive or buyer questions on privacy and behavioral rehearsal.",
      href: "/academy/mentor",
      buttonText: "Ask Product Mentor",
    };
  };

  const nextAction = getPrimaryNextAction();

  return (
    <AcademyLayout stageBadge={slugToLabel(fluencyLevel)}>
      <div className="space-y-8">
        {/* Welcome & North-star Header */}
        <div className="bg-gradient-to-r from-[#0E243F] to-[#0A1A2F] border border-[#D4AF37]/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase flex items-center gap-1.5">
              <Sparkles size={14} /> LevelNext Internal Academy
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8F5F0] tracking-tight">
              Move from knowing about LevelNext to applying it with conviction.
            </h1>
            <p className="text-sm text-[#F8F5F0]/80 leading-relaxed">
              Product Fluency is not video completion. It is the ability to diagnose the true problem, navigate the platform, apply the right intervention, and explain the change clearly.
            </p>
          </div>
        </div>

        {/* The 6 Core Academy Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Where am I? */}
          <div className="bg-[#1C1C1C]/90 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#D4AF37]">
              <span className="font-semibold uppercase tracking-wider">1. Where am I?</span>
              <ShieldCheck size={16} />
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-[#F8F5F0]">{compositeScore}/100</div>
              <p className="text-xs font-semibold text-[#D4AF37] capitalize">{slugToLabel(fluencyLevel)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/5">
              <div>Understand: <span className="font-bold text-white">{dimensionScores.understand}%</span></div>
              <div>Navigate: <span className="font-bold text-white">{dimensionScores.navigate}%</span></div>
              <div>Apply: <span className="font-bold text-white">{dimensionScores.apply}%</span></div>
              <div>Explain: <span className="font-bold text-white">{dimensionScores.explain}%</span></div>
            </div>
          </div>

          {/* 2. What should I do next? (HERO ACTION) */}
          <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0E243F] border-2 border-[#D4AF37] rounded-xl p-5 space-y-3 md:col-span-2 shadow-lg relative">
            <div className="flex items-center justify-between text-xs text-[#D4AF37]">
              <span className="font-semibold uppercase tracking-wider">2. What should I do next?</span>
              <Compass size={16} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-lg font-bold text-white">{nextAction.title}</h3>
            <p className="text-xs text-[#F8F5F0]/80 leading-relaxed">{nextAction.desc}</p>
            <div className="pt-2">
              <Link
                href={nextAction.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition shadow-md"
              >
                <span>{nextAction.buttonText}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 3. What am I learning? */}
          <div className="bg-[#1C1C1C]/90 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#D4AF37]">
              <span className="font-semibold uppercase tracking-wider">3. What am I learning?</span>
              <BookOpen size={16} />
            </div>
            <p className="text-sm font-semibold text-white">The LevelNext Change Thesis</p>
            <p className="text-xs text-[#F8F5F0]/70 leading-relaxed">
              Why traditional leadership offsites fade, and how the loop from Diagnosis to Simulator Rehearsal and Real-Work Evidence breaks historical inertia.
            </p>
            <Link href="/academy/map" className="inline-block text-xs text-[#D4AF37] hover:underline font-medium">
              View Product Map →
            </Link>
          </div>

          {/* 4. Where am I unclear? (Misconceptions & Gaps) */}
          <div className="bg-[#1C1C1C]/90 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#D4AF37]">
              <span className="font-semibold uppercase tracking-wider">4. Where am I unclear?</span>
              <AlertCircle size={16} className="text-amber-400" />
            </div>
            {gaps.length === 0 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> No unresolved gaps detected.
              </p>
            ) : (
              <ul className="space-y-2">
                {gaps.map((gap, i) => (
                  <li key={i} className="text-xs text-[#F8F5F0]/80 flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                    <span>{slugToLabel(gap)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/academy/diagnostic" className="inline-block text-xs text-[#D4AF37] hover:underline font-medium">
              Re-run Diagnostic →
            </Link>
          </div>

          {/* 5. How can I get help? (Product Mentor) */}
          <div className="bg-[#1C1C1C]/90 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#D4AF37]">
              <span className="font-semibold uppercase tracking-wider">5. How can I get help?</span>
              <HelpCircle size={16} />
            </div>
            <p className="text-sm font-semibold text-white">Ask the Product Mentor</p>
            <p className="text-xs text-[#F8F5F0]/70 leading-relaxed">
              Grounded in approved LevelNext knowledge. Ask questions, clarify why layers, or simulate stakeholder challenge objections.
            </p>
            <Link
              href="/academy/mentor"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
            >
              <span>Open Mentor Chat</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </AcademyLayout>
  );
}
