import React from "react";
import { ArrowRight, ChevronLeft, ShieldCheck, Sparkles, Target, TrendingUp, UsersRound } from "lucide-react";
import { careerStages, type CareerStage } from "./landingData";

type CareerStageLandingProps = {
  stageKey: CareerStage["key"];
};

const stageIcons = {
  "early-career": Sparkles,
  professional: Target,
  manager: UsersRound,
  leader: TrendingUp,
  executive: ShieldCheck,
} as const;

const stageCtas: Record<CareerStage["key"], { href: string; label: string }> = {
  "early-career": { href: "/early-career/diagnostic", label: "Start the Early Career diagnostic" },
  professional: { href: "/pe/assessment", label: "Start the Professional diagnostic" },
  manager: { href: "/manager/diagnostics", label: "Start the Manager diagnostic" },
  leader: { href: "/login?returnTo=%2Fleader", label: "Continue to Leader Intelligence" },
  executive: { href: "/login?returnTo=%2Fexecutive", label: "Explore Executive Intelligence" },
};

const stageIntroductions: Record<CareerStage["key"], string> = {
  "early-career": "Turn early potential into dependable contribution through practical work habits, confidence, and visible progress.",
  professional: "Strengthen ownership, execution, and follow-through across the work your organisation depends on.",
  manager: "Build the coaching, delegation, and accountability habits that turn managerial intent into team performance.",
  leader: "Create the strategic alignment and decision quality required to execute through complexity.",
  executive: "Clarify the mandate, decisions, and relationships that move enterprise priorities forward.",
};

function getStage(stageKey: CareerStage["key"]) {
  return careerStages.find((stage) => stage.key === stageKey) ?? careerStages[0];
}

export default function CareerStageLanding({ stageKey }: CareerStageLandingProps) {
  const stage = getStage(stageKey);
  const StageIcon = stageIcons[stage.key as keyof typeof stageIcons];
  const cta = stageCtas[stage.key as keyof typeof stageCtas];

  return (
    <main className="min-h-screen" style={{ background: "#0A1A2F", color: "#F8F5F0" }}>
      <header className="border-b" style={{ borderColor: "rgba(255,255,255,.12)", background: "rgba(10,26,47,.96)" }}>
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-5 px-5 py-3 md:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="Return to LevelNext home">
            <img src="/logo.png" alt="LevelNext" className="h-10 w-auto object-contain" />
            <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] md:block" style={{ color: "#D4AF37" }}>Leadership Intelligence Platform</span>
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/#who-its-for" className="hidden text-white/70 transition-colors hover:text-white sm:block">All career stages</a>
            <a href={cta.href.startsWith("/login") ? cta.href : `/login?returnTo=${encodeURIComponent(cta.href)}`} className="text-white/70 transition-colors hover:text-white">Log in</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b" style={{ borderColor: "rgba(212,175,55,.25)", background: "linear-gradient(135deg,#0A1A2F 0%,#123550 100%)" }}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#D4AF37 0%,transparent 68%)" }} />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.1fr_.9fr] md:items-center md:px-8 md:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ borderColor: "rgba(212,175,55,.55)", color: "#D4AF37", background: "rgba(212,175,55,.08)" }}>
              <StageIcon size={16} aria-hidden="true" /> {stage.name}
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "#D4AF37" }}>{stage.journeyLabel}</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-6xl">{stage.tagline}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 md:text-lg">{stageIntroductions[stage.key]}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href={cta.href} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5" style={{ background: "#D4AF37", color: "#0A1A2F", boxShadow: "0 8px 0 rgba(110,87,43,.45), 0 14px 24px rgba(0,0,0,.2)" }}>{cta.label} <ArrowRight size={17} aria-hidden="true" /></a>
              <a href="/#pilot" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/60 bg-white px-6 py-3.5 text-sm font-bold text-[#111] transition-transform hover:-translate-y-0.5">See the 60-day pilot <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          </div>

          <aside className="rounded-2xl border p-6 md:p-8" style={{ borderColor: "rgba(231,202,114,.5)", background: "rgba(7,21,37,.42)", boxShadow: "12px 12px 0 rgba(212,175,55,.18)" }} aria-label={`${stage.name} focus areas`}>
            <div className="mb-7 flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#D4AF37" }}>What this pathway builds</span><StageIcon size={24} style={{ color: "#D4AF37" }} aria-hidden="true" /></div>
            <div className="grid gap-4">
              {stage.focus.map((focus, index) => <div key={focus} className="flex items-start gap-3 border-t pt-4" style={{ borderColor: "rgba(255,255,255,.14)" }}><span className="text-xs font-extrabold" style={{ color: "#D4AF37" }}>0{index + 1}</span><div><h2 className="text-base font-bold text-white">{focus}</h2><p className="mt-1 text-sm leading-6 text-white/60">A practical development signal you can observe, practise, and improve.</p></div></div>)}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {["Diagnose the current pattern", "Practise the next move", "Measure what changes"].map((title, index) => <article key={title} className="rounded-xl border p-6" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)" }}><span className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-extrabold" style={{ borderColor: "rgba(212,175,55,.65)", color: "#D4AF37" }}>0{index + 1}</span><h2 className="text-lg font-bold text-white">{title}</h2><p className="mt-3 text-sm leading-6 text-white/60">{index === 0 ? stage.description : index === 1 ? "Use AI coaching, human support, and realistic practice to turn insight into a real-work action." : stage.buyerOutcome}</p></article>)}
        </div>
        <a href="/#who-its-for" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#D4AF37" }}><ChevronLeft size={16} aria-hidden="true" /> Compare all five career stages</a>
      </section>

      <footer className="border-t px-5 py-8 md:px-8" style={{ borderColor: "rgba(255,255,255,.1)", background: "#071525" }}><div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-3 text-xs text-white/45 sm:flex-row"><span>LevelNext — A Meta Results Platform</span><a href="/" className="transition-colors hover:text-white">Back to LevelNext home</a></div></footer>
    </main>
  );
}

export { stageCtas, stageIcons, stageIntroductions };
