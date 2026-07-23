import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Briefcase, Target, TrendingUp,
  Compass, Brain, CheckCircle2, ChevronRight,
  BarChart3, MessageSquare, Lightbulb, Sparkles,
  Send, Radio, BookOpen, Scale, Zap, Shield,
  Menu, X,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_570ab0aa.png";
const BRIEF_URL = "/manus-storage/LevelNext_Career_Intelligence_Executive_Brief_5a0cfaae.pdf";

// ── EOS ENGINES ──────────────────────────────────────────────────────────────
const EOS_ENGINES = [
  {
    id: "brand",
    icon: Sparkles,
    name: "Executive Brand Engine",
    tagline: "LinkedIn · Thought Leadership · Content",
    description:
      "AI rewrites your LinkedIn headline, summary, and About section. Generates your brand statement, UVP, three thought leadership pillars, a 4-week content calendar, and a full executive bio — all calibrated to your diagnostic profile.",
    cta: "Build my brand",
    color: "#818cf8",
    glow: "oklch(55% 0.18 280 / 0.12)",
  },
  {
    id: "outreach",
    icon: Send,
    name: "Outreach Engine",
    tagline: "AI-crafted messages per contact",
    description:
      "Turns every target contact into a suite of ready-to-send communications — LinkedIn messages, emails, warm intro requests, follow-ups, and a full Conversation Prep Kit with talking points and questions to ask.",
    cta: "Craft outreach",
    color: "#34d399",
    glow: "oklch(72% 0.17 162 / 0.12)",
  },
  {
    id: "radar",
    icon: Radio,
    name: "Opportunity Radar",
    tagline: "Signals from your target companies",
    description:
      "Continuously scans your target companies for hiring activity, leadership transitions, funding rounds, product launches, and expansion signals — then tells you exactly what to do next and connects directly to the Outreach Engine.",
    cta: "View signals",
    color: "#f59e0b",
    glow: "oklch(78% 0.17 75 / 0.12)",
  },
  {
    id: "interview",
    icon: BookOpen,
    name: "Interview Preparation",
    tagline: "Questions · STAR stories · Key messages",
    description:
      "Transforms any role into a complete interview dossier: company context, likely questions with suggested answers, a STAR story bank mapped to competencies, key messages to land, and questions to ask the interviewer.",
    cta: "Prepare now",
    color: "#a78bfa",
    glow: "oklch(65% 0.18 290 / 0.12)",
  },
  {
    id: "negotiation",
    icon: Scale,
    name: "Negotiation Intelligence",
    tagline: "Offer analysis · Counter-offer scripts",
    description:
      "Analyses any offer against market benchmarks, scores your compensation position, builds a full negotiation strategy (what to ask, what to accept, walk-away points), writes three counter-offer scripts, and scores the decision across five dimensions.",
    cta: "Analyse offer",
    color: "#fb7185",
    glow: "oklch(65% 0.2 10 / 0.12)",
  },
];

// ── DIAGNOSTICS (rationalised 3-module CI track) ──────────────────────────────
const CI_DIAGNOSTICS = [
  {
    code: "CPI",
    name: "Career Positioning Intelligence",
    icon: Target,
    description:
      "How clearly and powerfully are you positioned in your market? Understand whether your narrative, visibility, and brand are working for you — or against you.",
    outcome: "Career Positioning Score",
  },
  {
    code: "CMK",
    name: "Career Marketability & Optionality",
    icon: TrendingUp,
    description:
      "How in-demand are your skills, experience, and profile today? Understand your leverage before your next negotiation and measure the breadth of your career options.",
    outcome: "Marketability & Optionality Index",
  },
  {
    code: "AIR",
    name: "AI Readiness for Career",
    icon: Brain,
    description:
      "How prepared are you to thrive in an AI-augmented workplace? Understand where AI is a threat to your role and where it is your greatest competitive leverage.",
    outcome: "AI Readiness Score",
  },
];

// ── FOR WHO ───────────────────────────────────────────────────────────────────
const FOR_WHO = [
  { label: "Directors & VPs", detail: "Ready to move into enterprise or P&L leadership" },
  { label: "General Managers & Business Heads", detail: "Targeting a larger scope or a new geography" },
  { label: "GCC & MNC Leaders", detail: "Seeking to expand their mandate or step up to global roles" },
  { label: "Senior Leaders in Transition", detail: "Navigating a role change, pivot, or board position" },
];

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Begin with Insight",
    description:
      "Complete the Career Positioning Intelligence diagnostic — your first Edge Score and personalised development plan are generated immediately.",
    icon: BarChart3,
  },
  {
    step: "02",
    title: "Build your brand",
    description:
      "The Brand Engine uses your diagnostic profile to generate a complete executive brand strategy — your LinkedIn, your narrative, your content plan.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Add your targets",
    description:
      "Add target companies and contacts. The Opportunity Radar begins scanning for signals and surfaces the most relevant opportunities.",
    icon: Radio,
  },
  {
    step: "04",
    title: "Create conversations",
    description:
      "The Outreach Engine generates personalised messages for every contact in your target list. The Conversation Prep Kit prepares you for every meeting.",
    icon: Send,
  },
  {
    step: "05",
    title: "Prepare to win",
    description:
      "When an opportunity advances, the Interview Preparation and Negotiation Intelligence engines ensure you are the most prepared person in the room.",
    icon: Scale,
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
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#eos" className="hover:text-white transition-colors">Opportunity System</a>
            <a href="#diagnostics" className="hover:text-white transition-colors">Diagnostics</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#for-who" className="hover:text-white transition-colors">For Who</a>
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
                <a href={loginUrl} className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/8 font-medium text-sm">
                    Sign In
                  </Button>
                </a>
                <a href="/signup">
                  <Button size="sm" className="font-semibold text-sm px-5"
                    style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                    Get Early Access →
                  </Button>
                </a>
              </>
            )}
            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8"
              onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-6 py-4 flex flex-col gap-3 text-sm"
            style={{ borderColor: "oklch(30% 0.072 248.6)", background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
            {[
              { href: "#eos", label: "Opportunity System" },
              { href: "#diagnostics", label: "Diagnostics" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "#for-who", label: "For Who" },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="text-white/70 hover:text-white py-1 transition-colors"
                onClick={() => setMobileMenuOpen(false)}>{label}</a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 90% at 0% 50%, oklch(55% 0.18 280 / 0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 100% 80%, oklch(72% 0.17 162 / 0.06) 0%, transparent 60%)"
        }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-12 md:pt-24 md:pb-16">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
            style={{
              background: "oklch(55% 0.18 280 / 0.15)",
              color: "#a5b4fc",
              border: "1.5px solid oklch(55% 0.18 280 / 0.35)"
            }}>
            <Briefcase size={14} />
            Executive Opportunity System™ — by LevelNext
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-16">
            {/* Left: headline + sub + CTA */}
            <div className="lg:w-[52%]">
              <h1 className="font-bold leading-[1.12] mb-6">
                <span className="block text-4xl sm:text-5xl md:text-6xl text-white">
                  Elite executives don't<br className="hidden sm:block" /> chase opportunities.
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl mt-2" style={{ color: "#a5b4fc" }}>
                  They create them.
                </span>
              </h1>
              <p className="text-base md:text-lg leading-relaxed mb-4 text-white/75 max-w-xl">
                Career Intelligence is the only platform that combines precision diagnostics with five AI-powered action engines — so you don't just know your gaps, you close them.
              </p>
              <p className="text-sm mb-8 text-white/45">
                Free to start · First diagnostic in 10 minutes · No credit card
              </p>
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <a href="/signup">
                  <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg w-full sm:w-auto"
                    style={{ background: "#818cf8", color: "white" }}>
                    Start Your Journey
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </a>
                <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg"
                    className="h-13 px-7 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                    Book a Discovery Call
                  </Button>
                </a>
              </div>
              <p className="text-xs text-white/35 mt-4">
                Used by Directors, VPs, and Business Heads at Broadridge, Volvo, Texas Instruments, and Razorpay.
              </p>
              <p className="text-xs mt-3" style={{ color: "oklch(55% 0.18 280 / 0.6)" }}>
                For organisations offering outplacement support —{" "}
                <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity">
                  talk to us
                </a>
              </p>
            </div>

            {/* Right: EOS mini-preview cards */}
            <div className="lg:w-[48%]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EOS_ENGINES.map(({ id, icon: Icon, name, tagline, color, glow }) => (
                  <div key={id} className="flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: `radial-gradient(ellipse 120% 120% at 0% 0%, ${glow} 0%, oklch(from var(--color-ln-navy) calc(l + 0.04) c h) 60%)`,
                      borderColor: `${color}30`,
                    }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}20` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-snug">{name}</p>
                      <p className="text-xs mt-0.5" style={{ color: `${color}cc` }}>{tagline}</p>
                    </div>
                  </div>
                ))}
                {/* Chief of Staff Integration note */}
                <div className="sm:col-span-2 flex items-start gap-3 p-4 rounded-xl border"
                  style={{
                    background: "oklch(from var(--color-ln-navy) calc(l + 0.03) c h)",
                    borderColor: "oklch(from var(--color-ln-yellow) l c h / 0.25)",
                  }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)" }}>
                    <Zap size={18} style={{ color: "var(--color-ln-yellow)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">AI Chief of Staff Briefing</p>
                    <p className="text-xs text-white/55 mt-0.5">
                      Every morning, your top Radar signals, pending outreach, and next strategic action — surfaced automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EOS ENGINES ─────────────────────────────────────────────────────── */}
      <section id="eos" className="px-6 py-16 md:py-24" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.025) c h)" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            The Executive Opportunity System
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Five AI engines. One integrated system.
          </h2>
          <p className="text-sm md:text-base text-white/60 text-center max-w-2xl mx-auto mb-14">
            Most career platforms give you data. Career Intelligence gives you action. Each engine is powered by your diagnostic profile and connected to the others — so every signal leads to outreach, every interview is prepared, every offer is negotiated.
          </p>

          <div className="space-y-5">
            {EOS_ENGINES.map(({ id, icon: Icon, name, tagline, description, cta, color, glow }, idx) => (
              <div key={id} className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: `radial-gradient(ellipse 80% 120% at ${idx % 2 === 0 ? "0%" : "100%"} 50%, ${glow} 0%, oklch(from var(--color-ln-navy) calc(l + 0.04) c h) 65%)`,
                  borderColor: `${color}25`,
                }}>
                {/* Engine number + icon */}
                <div className="flex items-start gap-4 sm:flex-col sm:items-center sm:w-20 flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}20`, border: `1.5px solid ${color}40` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase sm:text-center" style={{ color: `${color}99` }}>
                    Engine {idx + 1}
                  </span>
                </div>
                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    <h3 className="text-base md:text-lg font-bold text-white">{name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}15`, color: `${color}cc` }}>{tagline}</span>
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed mb-3 max-w-2xl">{description}</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                    <ArrowRight size={13} />
                    {cta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTELLIGENCE LOOP ────────────────────────────────────────────────── */}
      <section className="px-6 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            The Intelligence Loop
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Diagnostics power action. Action creates results.
          </h2>
          <p className="text-sm md:text-base text-white/60 text-center max-w-xl mx-auto mb-12">
            Career Intelligence is not two separate products. Your diagnostic profile is the engine that makes every action smarter.
          </p>
          {/* Loop visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: BarChart3,
                title: "Diagnose",
                body: "Three precision assessments reveal your positioning gaps, marketability, and AI readiness — with a scored profile and archetype.",
                color: "#818cf8",
              },
              {
                icon: Compass,
                title: "Strategise",
                body: "Your AI Career Guide synthesises diagnostic insights into a personalised development plan and daily coaching actions.",
                color: "#34d399",
              },
              {
                icon: Zap,
                title: "Execute",
                body: "The five EOS engines translate strategy into brand assets, outreach messages, radar signals, interview prep, and negotiation scripts.",
                color: "var(--color-ln-yellow)",
              },
            ].map(({ icon: Icon, title, body, color }, idx) => (
              <div key={title} className="relative p-6 rounded-2xl border text-center"
                style={{
                  background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                  borderColor: `${color}25`,
                }}>
                {/* Arrow between cards */}
                {idx < 2 && (
                  <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center"
                    style={{ background: "oklch(from var(--color-ln-navy) calc(l + 0.08) c h)", border: "1px solid oklch(40% 0.05 248.6)" }}>
                    <ChevronRight size={12} className="text-white/50" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${color}15` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIAGNOSTICS ─────────────────────────────────────────────────────── */}
      <section id="diagnostics" className="px-6 py-16 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.025) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            Career Diagnostics
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Three assessments. One complete career profile.
          </h2>
          <p className="text-sm md:text-base text-white/60 text-center max-w-2xl mx-auto mb-12">
            Built on the Pareto principle — the three diagnostics that give 80% of the career intelligence value. Each produces a scored report, a personalised archetype, and a specific development focus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CI_DIAGNOSTICS.map(({ code, name, icon: Icon, description, outcome }) => (
              <div key={code} className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
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
          <p className="text-xs text-white/40 text-center mt-6">
            Each diagnostic is 30 questions · Personalised report ready immediately · Archetype + scored gap analysis included
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            How It Works
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Five steps. One destination: a career<br className="hidden md:block" /> that moves on your terms.
          </h2>
          <div className="space-y-4">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }, idx) => (
              <div key={step} className="flex gap-5 p-5 rounded-2xl transition-all duration-200"
                style={{
                  background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                  border: "1px solid oklch(55% 0.18 280 / 0.15)",
                }}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                    <Icon size={18} style={{ color: "#818cf8" }} />
                  </div>
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="w-px flex-1 min-h-[16px]" style={{ background: "oklch(55% 0.18 280 / 0.2)" }} />
                  )}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>{step}</span>
                    <ChevronRight size={12} style={{ color: "oklch(50% 0.02 248.6)" }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHO ─────────────────────────────────────────────────────────── */}
      <section id="for-who" className="px-6 py-14 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.025) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            Designed For
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            Built for senior leaders who are<br className="hidden md:block" /> serious about what comes next.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FOR_WHO.map(({ label, detail }) => (
              <div key={label} className="flex items-start gap-4 p-5 rounded-xl"
                style={{
                  background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                  border: "1px solid oklch(55% 0.18 280 / 0.15)",
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                  <CheckCircle2 size={16} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-white/55 mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT MAKES IT DIFFERENT ─────────────────────────────────────────── */}
      <section className="px-6 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            What makes it different
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Not a course. Not a coach. An intelligence system.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: BarChart3,
                title: "Precision, not personality",
                body: "Scored gap analysis across three dimensions — not a Myers-Briggs label. You get data, not a horoscope.",
              },
              {
                icon: MessageSquare,
                title: "A strategist who never sleeps",
                body: "Your AI Career Guide is available 24/7. Ask about your positioning, your negotiation strategy, your next move — whenever the thought strikes.",
              },
              {
                icon: Zap,
                title: "Action, not just insight",
                body: "Five engines turn diagnostic insight into brand assets, outreach messages, opportunity signals, interview prep, and negotiation scripts.",
              },
              {
                icon: Shield,
                title: "Integrated, not fragmented",
                body: "Every engine is connected. A Radar signal opens the Outreach Engine. A hiring signal opens Interview Prep. The system works as one.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl"
                style={{
                  background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                  border: "1px solid oklch(55% 0.18 280 / 0.15)",
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(55% 0.18 280 / 0.15)" }}>
                  <Icon size={20} style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
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
            Your executive career is your<br /> most important asset.
            <br />
            <span style={{ color: "#a5b4fc" }}>Start Free Today.</span>
          </h2>
          <p className="text-base text-white/65 mb-8 max-w-lg mx-auto">
            LevelNext Career Intelligence gives you the diagnostic clarity, brand strategy, market intelligence, and preparation systems to take control of what comes next — rather than waiting for it to find you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <a href="/signup">
              <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg w-full sm:w-auto"
                style={{ background: "#818cf8", color: "white" }}>
                Start Your Journey
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href={BRIEF_URL} download="LevelNext_CareerIntelligence_ExecutiveBrief.pdf" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                Download Executive Brief
              </Button>
            </a>
          </div>
          <p className="text-xs text-white/35 mt-6">Free to start · No credit card · First diagnostic in 10 minutes</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="LevelNext" className="h-6 object-contain opacity-70" />
            <span className="text-xs text-white/40">Career Intelligence · by LevelNext</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <a href="/signup" className="hover:text-white/70 transition-colors">Get Started</a>
            <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Contact</a>
            <span>© {new Date().getFullYear()} Meta Results Pvt. Ltd.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
