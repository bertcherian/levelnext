import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Users, Target, TrendingUp, MessageSquare,
  CheckCircle2, BarChart3, Zap, Brain, BookOpen, ClipboardList,
  Star, Shield,
} from "lucide-react";

const LOGO_URL = "/logo.png";

const MEP_DIAGNOSTICS = [
  {
    code: "MEI",
    name: "Manager Effectiveness Index",
    icon: BarChart3,
    description: "The flagship diagnostic — measures your effectiveness across 10 core management dimensions to give you a complete picture of your management impact.",
    outcome: "Management Effectiveness Score",
  },
  {
    code: "DEL",
    name: "Delegation Intelligence",
    icon: Users,
    description: "Measures your ability to delegate effectively — from trust and task selection to empowerment and full ownership transfer.",
    outcome: "Delegation Effectiveness Score",
  },
  {
    code: "FDB",
    name: "Feedback & Coaching Quality",
    icon: MessageSquare,
    description: "Assesses how well you give feedback, coach for growth, and create a culture of continuous improvement in your team.",
    outcome: "Feedback Quality Score",
  },
  {
    code: "TMS",
    name: "Team Motivation & Engagement",
    icon: Zap,
    description: "Measures your ability to inspire, motivate, and sustain high engagement across diverse team members and contexts.",
    outcome: "Motivation Impact Score",
  },
  {
    code: "CON",
    name: "Conflict & Difficult Conversations",
    icon: Shield,
    description: "Assesses your confidence and competence in navigating conflict, giving hard feedback, and handling difficult conversations.",
    outcome: "Conversation Confidence Score",
  },
  {
    code: "STR",
    name: "Strategic Thinking for Managers",
    icon: Brain,
    description: "Measures how well you connect day-to-day management to broader organisational goals and think beyond immediate tasks.",
    outcome: "Strategic Clarity Score",
  },
  {
    code: "PST",
    name: "Psychological Safety & Trust",
    icon: Shield,
    description: "Measures the psychological safety and trust levels in your team — voice safety, failure tolerance, inclusion, trust building, vulnerability modelling, and challenge safety.",
    outcome: "Psychological Safety Score",
  },
  {
    code: "PFM",
    name: "Performance Management",
    icon: BarChart3,
    description: "Assesses your performance management effectiveness — goal setting, ongoing feedback, addressing underperformance, recognition, development focus, and fairness.",
    outcome: "Performance Management Score",
  },
  {
    code: "CFI",
    name: "Cross-functional Influence",
    icon: Users,
    description: "Measures your ability to build relationships, align stakeholders, influence without authority, and collaborate effectively across organisational boundaries.",
    outcome: "Cross-functional Influence Score",
  },
  {
    code: "MRW",
    name: "Manager Resilience & Wellbeing",
    icon: Zap,
    description: "Measures your resilience and wellbeing as a manager — stress management, recovery, boundary setting, emotional regulation, team wellbeing, and sustainable performance.",
    outcome: "Resilience & Wellbeing Score",
  },
];

const DIFFERENTIATORS = [
  {
    title: "Precision diagnostics, not guesswork",
    description: "10 management diagnostics across the dimensions that actually drive team performance — scored, ranked, and personalised to your context.",
    icon: BarChart3,
  },
  {
    title: "AI Manager Guide, always on",
    description: "Your AI Manager Guide is available 24/7 to coach you through real situations — difficult conversations, underperformers, team dynamics — whenever you need it.",
    icon: MessageSquare,
  },
  {
    title: "Practice before the real thing",
    description: "The AI Practice Partner simulates difficult conversations so you arrive prepared. Role-play the performance review, the conflict, the tough feedback — before it happens.",
    icon: Zap,
  },
  {
    title: "Situation-specific playbooks",
    description: "Describe any management challenge and get a structured play — what to say, how to say it, and what to watch for. Built for the messy reality of managing people.",
    icon: BookOpen,
  },
  {
    title: "Behaviour commitments that stick",
    description: "Turn insights into lasting behaviour change with a commitment tracker that holds you accountable to the specific management habits that matter most.",
    icon: ClipboardList,
  },
  {
    title: "Built for managers in the flow of work",
    description: "Not a course. Not a workshop. A daily intelligence platform that fits into your working day and gets sharper the more you use it.",
    icon: Target,
  },
];

const FOR_WHO = [
  "First-time managers who want to get it right from the start",
  "Mid-level managers who feel they have plateaued",
  "Senior managers who want to lead high-performance teams",
  "Managers struggling with delegation, feedback, or difficult conversations",
  "HR and L&D leaders looking for a scalable manager development solution",
  "Organisations investing in management capability as a strategic priority",
];

const JOURNEY_STAGES = [
  {
    stage: "01",
    title: "Diagnose",
    subtitle: "Know your gaps",
    description: "Complete your Manager Effectiveness diagnostic. Get a precise, scored picture of where you are strong and where you are leaving performance on the table.",
    icon: BarChart3,
  },
  {
    stage: "02",
    title: "Understand",
    subtitle: "Get your coaching brief",
    description: "Your Daily Management Brief gives you a focused priority each day — drawn from your diagnostic results and current team context.",
    icon: Brain,
  },
  {
    stage: "03",
    title: "Practise",
    subtitle: "Rehearse the hard moments",
    description: "Use the AI Practice Partner to simulate the conversations you are avoiding. Arrive prepared, not improvising.",
    icon: MessageSquare,
  },
  {
    stage: "04",
    title: "Apply",
    subtitle: "Use situation-specific plays",
    description: "When a management challenge arises, generate a structured play in seconds. Know exactly what to do and how to do it.",
    icon: BookOpen,
  },
  {
    stage: "05",
    title: "Commit",
    subtitle: "Build lasting habits",
    description: "Track your behaviour commitments. Close the gap between knowing what good management looks like and actually doing it consistently.",
    icon: CheckCircle2,
  },
];

export default function ManagerEffectivenessLanding() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-navy)", color: "white" }}>

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b" style={{
        background: "oklch(from var(--color-ln-navy) calc(l - 0.02) c h / 0.95)",
        borderColor: "oklch(30% 0.072 248.6)",
        backdropFilter: "blur(12px)",
      }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <img src={LOGO_URL} alt="LevelNext" className="h-8 object-contain" />
            <span className="text-xs font-semibold tracking-wide hidden sm:block" style={{ color: "var(--color-ln-yellow)" }}>
              Manager Effectiveness
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#diagnostics" className="hover:text-white transition-colors">Diagnostics</a>
            <a href="#journey" className="hover:text-white transition-colors">The Journey</a>
            <a href="#for-who" className="hover:text-white transition-colors">For Who</a>
            <a href="/" className="hover:text-white transition-colors">Leadership Intelligence</a>
            <a href="/career-landing" className="hover:text-white transition-colors">Career Transition Intelligence</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button size="sm" className="font-semibold text-sm px-5"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                onClick={() => navigate("/manager")}>
                Go to Dashboard →
              </Button>
            ) : (
              <>
                <a href="/login?returnTo=%2Fmanager">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/8 font-medium text-sm">
                    Sign In
                  </Button>
                </a>
                <a href="/signup?platform=mep">
                  <Button size="sm" className="font-semibold text-sm px-5"
                    style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                    Get Started Free →
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 80% at 0% 40%, oklch(60% 0.15 160 / 0.1) 0%, transparent 65%), radial-gradient(ellipse 50% 60% at 100% 80%, oklch(60% 0.15 160 / 0.07) 0%, transparent 60%)"
        }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-28 flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
          <div className="flex flex-col items-start text-left md:w-[55%]">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style={{
                background: "oklch(60% 0.15 160 / 0.15)",
                color: "#6ee7b7",
                border: "1.5px solid oklch(60% 0.15 160 / 0.35)"
              }}>
              <Users size={14} />
              Manager Effectiveness Platform — by LevelNext
            </div>
            <h1 className="font-bold leading-[1.15] mb-5">
              <span className="block text-3xl sm:text-4xl md:text-5xl text-white">
                Become the manager<br className="hidden md:block" /> your team deserves.
              </span>
              <span className="block text-xl sm:text-2xl md:text-3xl mt-2" style={{ color: "#6ee7b7" }}>
                Diagnose. Practise. Commit. Lead.
              </span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-4 text-white/75 max-w-xl">
              Most managers plateau — not from lack of effort, but from gaps in delegation, feedback, and difficult conversations they never measured.
              The <strong className="text-white">Manager Effectiveness Platform</strong> gives you precision diagnostics, a 24/7 AI Manager Guide, and practice simulations to close the gap.
            </p>
            <p className="text-sm mb-7 text-white/45">
              Free to start · First diagnostic in 10 minutes · No credit card
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/signup?platform=mep&utm_source=mep_landing&utm_medium=hero">
                <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg"
                  style={{ background: "#10b981", color: "white" }}>
                  Get Started Free
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </a>
              <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-xl border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                  Book a Discovery Call
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Score visual */}
          <div className="md:w-[45%] flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="rounded-2xl p-6 border" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                borderColor: "oklch(60% 0.15 160 / 0.3)",
                boxShadow: "0 0 60px oklch(60% 0.15 160 / 0.15)",
              }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(60% 0.15 160 / 0.2)" }}>
                    <Users size={20} style={{ color: "#6ee7b7" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6ee7b7" }}>Management Effectiveness Score</p>
                    <p className="text-xs text-white/50">Across 10 management dimensions</p>
                  </div>
                </div>
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(60% 0.15 160 / 0.15)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8"
                        strokeDasharray="251.2" strokeDashoffset="63" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">75</span>
                      <span className="text-xs text-white/50">/ 100</span>
                    </div>
                  </div>
                </div>
                {[
                  { label: "Delegation", score: 68, color: "#10b981" },
                  { label: "Feedback Quality", score: 82, color: "#6ee7b7" },
                  { label: "Difficult Conversations", score: 59, color: "#10b981" },
                  { label: "Team Motivation", score: 77, color: "#6ee7b7" },
                ].map(({ label, score, color }) => (
                  <div key={label} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{label}</span>
                      <span className="font-semibold" style={{ color }}>{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "oklch(60% 0.15 160 / 0.15)" }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: "oklch(60% 0.15 160 / 0.2)" }}>
                  <Star size={12} style={{ color: "#f59e0b" }} />
                  <p className="text-xs text-white/60">
                    <span className="text-white font-medium">Developing Manager</span> — strong feedback, delegation gap to close
                  </p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: "#10b981", color: "white" }}>
                Sample Report
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="px-6 py-16 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l + 0.02) c h)" }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6ee7b7" }}>Why Manager Effectiveness Platform</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 max-w-2xl">
            Not another management training. An intelligence platform built for how managers actually work.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="p-5 rounded-xl border" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                borderColor: "oklch(60% 0.15 160 / 0.2)",
              }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "oklch(60% 0.15 160 / 0.15)" }}>
                  <Icon size={18} style={{ color: "#6ee7b7" }} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIAGNOSTICS */}
      <section id="diagnostics" className="px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6ee7b7" }}>The Diagnostics</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">10 Diagnostics. Every Management Dimension That Matters.</h2>
          <p className="text-white/60 mb-10 max-w-2xl text-sm">Each diagnostic takes 5–10 minutes and gives you a scored, personalised report with specific recommendations. Start with the Manager Effectiveness Index — then go deeper into the dimensions that matter most.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MEP_DIAGNOSTICS.map(({ code, name, icon: Icon, description, outcome }) => (
              <div key={code} className="p-5 rounded-xl border" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.03) c h)",
                borderColor: "oklch(60% 0.15 160 / 0.2)",
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "oklch(60% 0.15 160 / 0.2)", color: "#6ee7b7" }}>{code}</span>
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "oklch(60% 0.15 160 / 0.1)" }}>
                    <Icon size={13} style={{ color: "#6ee7b7" }} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{name}</h3>
                <p className="text-xs text-white/55 leading-relaxed mb-3">{description}</p>
                <p className="text-xs font-medium" style={{ color: "#6ee7b7" }}>→ {outcome}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section id="journey" className="px-6 py-16 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l + 0.02) c h)" }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6ee7b7" }}>The Journey</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10">From Diagnostic to High-Performance Manager — in 5 Stages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {JOURNEY_STAGES.map(({ stage, title, subtitle, description, icon: Icon }) => (
              <div key={stage} className="p-5 rounded-xl border" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                borderColor: "oklch(60% 0.15 160 / 0.2)",
              }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-3"
                  style={{ background: "#10b981", color: "white" }}>{stage}</div>
                <h3 className="text-sm font-bold text-white mb-0.5">{title}</h3>
                <p className="text-xs font-medium mb-2" style={{ color: "#6ee7b7" }}>{subtitle}</p>
                <p className="text-xs text-white/55 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR WHO */}
      <section id="for-who" className="px-6 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#6ee7b7" }}>Who It's For</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10">Manager Effectiveness Platform is built for managers who want to lead at a higher level.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            {FOR_WHO.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                <p className="text-sm text-white/75">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 md:py-28 text-center relative overflow-hidden" style={{ background: "oklch(from var(--color-ln-navy) calc(l + 0.02) c h)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 70% at 50% 50%, oklch(60% 0.15 160 / 0.08) 0%, transparent 70%)"
        }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{
              background: "oklch(60% 0.15 160 / 0.15)",
              color: "#6ee7b7",
              border: "1.5px solid oklch(60% 0.15 160 / 0.3)"
            }}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Free to start — No credit card required
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
            Your team deserves a better manager.<br />
            <span style={{ color: "#6ee7b7" }}>Start with the diagnosis.</span>
          </h2>
          <p className="text-base text-white/65 mb-8 max-w-lg mx-auto">
            Begin your Manager Effectiveness journey today. The first diagnostic takes 10 minutes. Your personalised Management Effectiveness Score and report are ready immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <a href="/signup?platform=mep&utm_source=mep_landing&utm_medium=final_cta">
              <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg w-full sm:w-auto"
                style={{ background: "#10b981", color: "white" }}>
                Get Started Free
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                Book a Discovery Call
              </Button>
            </a>
            <a href="/manus-storage/LevelNext_MEP_ExecutiveBrief_64c667e8.pdf" target="_blank" rel="noopener noreferrer" download="LevelNext_MEP_ExecutiveBrief.pdf">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                Download Executive Brief
              </Button>
            </a>
          </div>
          <p className="text-xs text-white/35 mt-6">Free to start · No credit card · First diagnostic in 10 minutes</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8 border-t text-center" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="LevelNext" className="h-6 object-contain opacity-70" />
            <span className="text-xs text-white/40">Manager Effectiveness Platform · by LevelNext</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <a href="/" className="hover:text-white/70 transition-colors">Leadership Intelligence</a>
            <a href="/career-landing" className="hover:text-white/70 transition-colors">Career Transition Intelligence</a>
            <a href="/signup?platform=mep" className="hover:text-white/70 transition-colors">Get Started</a>
            <span>© {new Date().getFullYear()} Meta Results Pvt. Ltd.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
