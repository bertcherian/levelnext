import { useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Briefcase, Target, TrendingUp, Shield,
  Compass, Zap, Brain, CheckCircle2, ChevronRight,
  Star, BarChart3, MessageSquare, Lightbulb,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_570ab0aa.png";

const CI_DIAGNOSTICS = [
  {
    code: "CPI",
    name: "Career Positioning Intelligence",
    icon: Target,
    description: "Discover how clearly and powerfully you are positioned in your market. Understand whether your narrative, visibility, and brand are working for you — or against you.",
    outcome: "Career Positioning Score",
  },
  {
    code: "CRS",
    name: "Career Resilience & Sustainability",
    icon: Shield,
    description: "Assess your ability to absorb disruption, navigate transitions, and sustain momentum across career phases. Identify the resilience gaps that make you vulnerable.",
    outcome: "Resilience Readiness Score",
  },
  {
    code: "CMK",
    name: "Career Marketability Intelligence",
    icon: TrendingUp,
    description: "Measure how in-demand your skills, experience, and profile are in today's market. Understand your leverage before your next negotiation.",
    outcome: "Marketability Index",
  },
  {
    code: "CST",
    name: "Career Strategy Intelligence",
    icon: Compass,
    description: "Evaluate the quality of your career strategy — how intentional, long-horizon, and optionality-aware your decisions are. Most professionals react. High performers plan.",
    outcome: "Strategy Clarity Score",
  },
  {
    code: "CAO",
    name: "Career Optionality Intelligence",
    icon: Briefcase,
    description: "Measure the breadth and quality of your career options. Are you building optionality, or narrowing your path without realising it?",
    outcome: "Optionality Breadth Score",
  },
  {
    code: "AIR",
    name: "AI Readiness for Career",
    icon: Brain,
    description: "Assess how prepared you are to thrive in an AI-augmented workplace. Understand where AI is a threat to your role and where it is your greatest leverage.",
    outcome: "AI Readiness Score",
  },
];

const JOURNEY_STAGES = [
  {
    stage: "01",
    title: "Discover",
    subtitle: "Know where you stand",
    description: "Complete your first Career Intelligence diagnostic. Get your Career Edge Score and a frank, personalised report — not a personality label, but a precise gap analysis.",
    icon: BarChart3,
  },
  {
    stage: "02",
    title: "Position",
    subtitle: "Build your career narrative",
    description: "Work with your Career Strategist to sharpen your positioning, articulate your value, and close the gap between how you see yourself and how the market sees you.",
    icon: Target,
  },
  {
    stage: "03",
    title: "Prepare",
    subtitle: "Rehearse the hard conversations",
    description: "Use the Career Practice Coach to prepare for salary negotiations, promotion conversations, executive interviews, and career pivots — before they happen.",
    icon: MessageSquare,
  },
  {
    stage: "04",
    title: "Activate",
    subtitle: "Execute with precision",
    description: "Implement your career strategy with daily AI coaching, fortnightly accountability check-ins, and a commitment tracker that keeps you moving.",
    icon: Zap,
  },
  {
    stage: "05",
    title: "Transition",
    subtitle: "Move on your terms",
    description: "Whether you are seeking a promotion, a lateral move, or a full pivot — execute the transition with intelligence, not hope.",
    icon: TrendingUp,
  },
];

const FOR_WHO = [
  "Senior professionals at a career inflection point",
  "Leaders who want a promotion but don't know how to position for it",
  "High performers who feel undervalued or underpaid",
  "Executives considering a pivot or portfolio career",
  "Professionals who want to build leverage before their next negotiation",
  "Anyone who suspects their career strategy is more reactive than intentional",
];

const DIFFERENTIATORS = [
  {
    title: "Precision, not personality",
    description: "Career Intelligence gives you a scored gap analysis across 6 dimensions — not a Myers-Briggs label. You get data, not a horoscope.",
    icon: BarChart3,
  },
  {
    title: "A coach who never sleeps",
    description: "Your Career Strategist is available 24/7. Ask about your positioning, your negotiation strategy, your next move — whenever the thought strikes.",
    icon: MessageSquare,
  },
  {
    title: "Rehearsal before the real thing",
    description: "The Career Practice Coach simulates salary negotiations, executive interviews, and career conversations so you arrive prepared, not improvising.",
    icon: Zap,
  },
  {
    title: "Accountability that scales",
    description: "A Momentum Partner checks your commitments every fortnight. Not a coach — a focused accountability call that keeps implementation real.",
    icon: CheckCircle2,
  },
];

export default function CareerLanding() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-navy)", color: "white" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b" style={{
        background: "oklch(from var(--color-ln-navy) calc(l - 0.02) c h / 0.95)",
        borderColor: "oklch(30% 0.072 248.6)",
        backdropFilter: "blur(12px)",
      }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <img src={LOGO_URL} alt="LevelNext" className="h-8 object-contain" />
            <span className="text-xs font-semibold tracking-wide hidden sm:block" style={{ color: "var(--color-ln-yellow)" }}>
              Career Intelligence
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#diagnostics" className="hover:text-white transition-colors">Diagnostics</a>
            <a href="#journey" className="hover:text-white transition-colors">The Journey</a>
            <a href="#for-who" className="hover:text-white transition-colors">For Who</a>
            <a href="/" className="hover:text-white transition-colors">Leadership Intelligence</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button size="sm" className="font-semibold text-sm px-5"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                onClick={() => navigate("/career")}>
                Go to Dashboard →
              </Button>
            ) : (
              <>
                <a href={loginUrl}>
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/8 font-medium text-sm">
                    Sign In
                  </Button>
                </a>
                <a href="/apply?product=career">
                  <Button size="sm" className="font-semibold text-sm px-5"
                    style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                    Apply for Early Access →
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glow — indigo/violet for CI identity */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 80% at 0% 40%, oklch(55% 0.18 280 / 0.12) 0%, transparent 65%), radial-gradient(ellipse 50% 60% at 100% 80%, oklch(55% 0.18 280 / 0.07) 0%, transparent 60%)"
        }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-28 flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
          {/* Left: Text */}
          <div className="flex flex-col items-start text-left md:w-[55%]">
            {/* Product badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style={{
                background: "oklch(55% 0.18 280 / 0.15)",
                color: "#a5b4fc",
                border: "1.5px solid oklch(55% 0.18 280 / 0.35)"
              }}>
              <Briefcase size={14} />
              Career Intelligence — by LevelNext
            </div>

            {/* Headline */}
            <h1 className="font-bold leading-[1.15] mb-5">
              <span className="block text-3xl sm:text-4xl md:text-5xl text-white">
                Is your career working<br className="hidden md:block" /> as hard as you are?
              </span>
              <span className="block text-xl sm:text-2xl md:text-3xl mt-2 whitespace-nowrap" style={{ color: "#a5b4fc" }}>
                Find the gaps. Close them. Move faster.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base md:text-lg leading-relaxed mb-4 text-white/75 max-w-xl">
              Most senior professionals plateau — not from lack of talent, but from gaps in positioning, strategy, and marketability they never measured.
              <strong className="text-white"> Career Intelligence</strong> gives you precision diagnostics, a 24/7 Career Strategist, and practice simulations to close the gap.
            </p>

            <p className="text-sm mb-7 text-white/45">
              Free to start · First diagnostic in 10 minutes · No credit card
            </p>

            {/* CTA */}
            <a href="/apply?product=career&utm_source=ci_landing&utm_medium=hero">
              <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg"
                style={{ background: "#818cf8", color: "white" }}>
                Apply for Early Access
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href="https://tidycal.com/metaresults/pilot"
              target="_blank" rel="noopener noreferrer"
              className="text-sm mt-3 flex items-center gap-1.5 transition-colors"
              style={{ color: "oklch(65% 0.02 248.6)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a5b4fc")}
              onMouseLeave={e => (e.currentTarget.style.color = "oklch(65% 0.02 248.6)")}
            >
              or book a discovery call →
            </a>
          </div>

          {/* Right: Career Edge Score visual */}
          <div className="md:w-[45%] flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Mock Career Edge card */}
              <div className="rounded-2xl p-6 border" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                borderColor: "oklch(55% 0.18 280 / 0.3)",
                boxShadow: "0 0 60px oklch(55% 0.18 280 / 0.15)",
              }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "oklch(55% 0.18 280 / 0.2)" }}>
                    <Briefcase size={20} style={{ color: "#a5b4fc" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a5b4fc" }}>Career Edge Score</p>
                    <p className="text-xs text-white/50">Across 6 intelligence dimensions</p>
                  </div>
                </div>
                {/* Score ring placeholder */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(55% 0.18 280 / 0.15)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#818cf8" strokeWidth="8"
                        strokeDasharray="251.2" strokeDashoffset="75" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">70</span>
                      <span className="text-xs text-white/50">/ 100</span>
                    </div>
                  </div>
                </div>
                {/* Dimension bars */}
                {[
                  { label: "Positioning", score: 62, color: "#818cf8" },
                  { label: "Marketability", score: 78, color: "#a5b4fc" },
                  { label: "Strategy", score: 55, color: "#818cf8" },
                  { label: "Resilience", score: 80, color: "#a5b4fc" },
                ].map(({ label, score, color }) => (
                  <div key={label} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{label}</span>
                      <span className="font-semibold" style={{ color }}>{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: "oklch(55% 0.18 280 / 0.2)" }}>
                  <Star size={12} style={{ color: "#f59e0b" }} />
                  <p className="text-xs text-white/60">
                    <span className="text-white font-medium">Emerging Strategist</span> — strong resilience, positioning gap to close
                  </p>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: "#818cf8", color: "white" }}>
                Sample Report
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR WHO ─────────────────────────────────────────────────────────── */}
      <section id="for-who" className="px-6 py-14 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#a5b4fc" }}>Who it's for</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10">
            Career Intelligence is built for professionals<br className="hidden md:block" /> who are done leaving their career to chance.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FOR_WHO.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "oklch(55% 0.18 280 / 0.07)", border: "1px solid oklch(55% 0.18 280 / 0.15)" }}>
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#818cf8" }} />
                <p className="text-sm text-white/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 DIAGNOSTICS ───────────────────────────────────────────────────── */}
      <section id="diagnostics" className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>The Intelligence System</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Six diagnostics. One complete picture.
          </h2>
          <p className="text-sm md:text-base text-white/60 text-center max-w-2xl mx-auto mb-12">
            Each diagnostic is a 30-question precision assessment that produces a scored report, a personalised archetype, and a specific development focus. Together, they form your Career Intelligence profile.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CI_DIAGNOSTICS.map(({ code, name, icon: Icon, description, outcome }, idx) => (
              <div key={code} className="rounded-2xl p-5 flex flex-col gap-3 group transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                  border: "1px solid oklch(55% 0.18 280 / 0.2)",
                  boxShadow: "0 2px 16px oklch(55% 0.18 280 / 0.08)",
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                    <Icon size={18} style={{ color: "#a5b4fc" }} />
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>{code}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{name}</h3>
                <p className="text-xs text-white/60 leading-relaxed flex-1">{description}</p>
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "oklch(55% 0.18 280 / 0.15)" }}>
                  <BarChart3 size={12} style={{ color: "#818cf8" }} />
                  <span className="text-xs font-semibold" style={{ color: "#a5b4fc" }}>{outcome}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES IT DIFFERENT ─────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>What makes it different</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Not a course. Not a coach. An intelligence system.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIFFERENTIATORS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                border: "1px solid oklch(55% 0.18 280 / 0.15)",
              }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                  <Icon size={20} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOURNEY ─────────────────────────────────────────────────────────── */}
      <section id="journey" className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>The Career Intelligence Journey</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Five stages. One destination: a career<br className="hidden md:block" /> that moves on your terms.
          </h2>
          <div className="space-y-4">
            {JOURNEY_STAGES.map(({ stage, title, subtitle, description, icon: Icon }, idx) => (
              <div key={stage} className="flex gap-5 p-5 rounded-2xl group transition-all duration-200"
                style={{
                  background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                  border: "1px solid oklch(55% 0.18 280 / 0.15)",
                }}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                    <Icon size={18} style={{ color: "#818cf8" }} />
                  </div>
                  {idx < JOURNEY_STAGES.length - 1 && (
                    <div className="w-px flex-1 min-h-[16px]" style={{ background: "oklch(55% 0.18 280 / 0.2)" }} />
                  )}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>{stage}</span>
                    <ChevronRight size={12} style={{ color: "oklch(50% 0.02 248.6)" }} />
                    <span className="text-xs font-semibold text-white/50">{subtitle}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEVELNEXT PLATFORM LINK ─────────────────────────────────────────── */}
      <section className="px-6 py-10 md:py-14" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-4"
            style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.1)", color: "var(--color-ln-yellow)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.25)" }}>
            <Lightbulb size={12} />
            Also available on LevelNext
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Looking to grow your Leadership Intelligence too?
          </h2>
          <p className="text-sm text-white/60 mb-6 max-w-lg mx-auto">
            LevelNext also offers Leadership Intelligence — 6 diagnostics covering Executive Communication, Thinking, Leadership Impact, GCC Readiness, Leadership Development, and Strategic Thinking. Both products share one platform, one login.
          </p>
          <a href="/">
            <Button variant="outline" className="font-semibold text-sm border-white/20 text-white/70 hover:text-white hover:bg-white/8">
              Explore Leadership Intelligence →
            </Button>
          </a>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 70% at 50% 50%, oklch(55% 0.18 280 / 0.1) 0%, transparent 70%)"
        }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
            style={{
              background: "oklch(55% 0.18 280 / 0.15)",
              color: "#a5b4fc",
              border: "1.5px solid oklch(55% 0.18 280 / 0.3)"
            }}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Early Access — Limited Cohort
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
            Your career won't manage itself.<br />
            <span style={{ color: "#a5b4fc" }}>Start with the diagnosis.</span>
          </h2>
          <p className="text-base text-white/65 mb-8 max-w-lg mx-auto">
            Apply for early access to Career Intelligence. The first diagnostic takes 10 minutes. Your Career Edge Score and personalised report are ready immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <a href="/apply?product=career&utm_source=ci_landing&utm_medium=final_cta">
              <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg w-full sm:w-auto"
                style={{ background: "#818cf8", color: "white" }}>
                Apply for Early Access
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                Book a Discovery Call
              </Button>
            </a>
            <a href="/manus-storage/LevelNext_CareerIntelligence_ExecutiveBrief_9ec74bc6.pdf" download="LevelNext_CareerIntelligence_ExecutiveBrief.pdf" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                Download Executive Brief
              </Button>
            </a>
          </div>
          <p className="text-xs text-white/35 mt-6">Free to start · No credit card · First diagnostic in 10 minutes</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t text-center" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="LevelNext" className="h-6 object-contain opacity-70" />
            <span className="text-xs text-white/40">Career Intelligence · by LevelNext</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <a href="/" className="hover:text-white/70 transition-colors">Leadership Intelligence</a>
            <a href="/apply?product=career" className="hover:text-white/70 transition-colors">Apply</a>
            <span>© {new Date().getFullYear()} Meta Results Pvt. Ltd.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
