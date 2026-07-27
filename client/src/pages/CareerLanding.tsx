import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Briefcase, Target, TrendingUp,
  Brain, CheckCircle2, BarChart3, MessageSquare,
  Sparkles, Send, Radio, BookOpen, Scale, Zap,
  Menu, X, Search, Users, Award, Compass,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { OutplacementContactModal } from "@/components/OutplacementContactModal";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_570ab0aa.png";

// ── 5-STEP JOURNEY ────────────────────────────────────────────────────────────
const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Discover",
    subtitle: "Know your gaps",
    icon: Search,
    color: "#818cf8",
    glow: "oklch(55% 0.18 280 / 0.12)",
    items: [
      "Leadership diagnostics",
      "Career readiness",
      "Executive communication",
      "Personal brand",
      "Career positioning",
    ],
  },
  {
    step: "02",
    title: "Develop",
    subtitle: "Build your capability",
    icon: Brain,
    color: "#34d399",
    glow: "oklch(72% 0.17 162 / 0.12)",
    items: [
      "Personal AI Coach",
      "Practice Coach",
      "Daily coaching",
      "Learning plans",
      "Habit building",
    ],
  },
  {
    step: "03",
    title: "Position",
    subtitle: "Own your narrative",
    icon: Sparkles,
    color: "#f59e0b",
    glow: "oklch(78% 0.17 75 / 0.12)",
    items: [
      "Executive profile",
      "CV & LinkedIn",
      "Personal brand",
      "Executive narrative",
      "Thought leadership",
    ],
  },
  {
    step: "04",
    title: "Access",
    subtitle: "Find the right opportunities",
    icon: Radio,
    color: "#a78bfa",
    glow: "oklch(65% 0.18 290 / 0.12)",
    items: [
      "Opportunity discovery",
      "Target companies",
      "Recruiter intelligence",
      "Networking recommendations",
      "Warm introductions",
    ],
  },
  {
    step: "05",
    title: "Transition",
    subtitle: "Win and land well",
    icon: Award,
    color: "#fb7185",
    glow: "oklch(65% 0.2 10 / 0.12)",
    items: [
      "Interview preparation",
      "Negotiation",
      "Offer evaluation",
      "90-day success plan",
      "First-year coaching",
    ],
  },
];

// ── AI ENGINES ────────────────────────────────────────────────────────────────
const AI_ENGINES = [
  {
    icon: Sparkles,
    name: "Executive Brand Engine",
    tagline: "LinkedIn · Narrative · Thought Leadership",
    description:
      "AI rewrites your LinkedIn profile, generates your brand statement and UVP, builds a 4-week content calendar, and creates a full executive bio — all calibrated to your diagnostic profile.",
    color: "#818cf8",
    glow: "oklch(55% 0.18 280 / 0.12)",
  },
  {
    icon: Send,
    name: "Outreach Engine",
    tagline: "AI-crafted messages per contact",
    description:
      "Turns every target contact into a suite of ready-to-send communications — LinkedIn messages, emails, warm intro requests, and a full Conversation Prep Kit.",
    color: "#34d399",
    glow: "oklch(72% 0.17 162 / 0.12)",
  },
  {
    icon: Radio,
    name: "Opportunity Radar",
    tagline: "Signals from your target companies",
    description:
      "Scans your target companies for hiring activity, leadership transitions, funding rounds, and expansion signals — then tells you exactly what to do next.",
    color: "#f59e0b",
    glow: "oklch(78% 0.17 75 / 0.12)",
  },
  {
    icon: BookOpen,
    name: "Interview Preparation",
    tagline: "Questions · STAR stories · Key messages",
    description:
      "Transforms any role into a complete interview dossier: company context, likely questions, a STAR story bank, key messages, and questions to ask the interviewer.",
    color: "#a78bfa",
    glow: "oklch(65% 0.18 290 / 0.12)",
  },
  {
    icon: Scale,
    name: "Negotiation Intelligence",
    tagline: "Offer analysis · Counter-offer scripts",
    description:
      "Analyses any offer against market benchmarks, builds a full negotiation strategy, writes three counter-offer scripts, and scores the decision across five dimensions.",
    color: "#fb7185",
    glow: "oklch(65% 0.2 10 / 0.12)",
  },
];

// ── FOR WHO ───────────────────────────────────────────────────────────────────
const FOR_WHO = [
  { label: "Executives & Directors", detail: "Ready to move into a larger scope or new geography" },
  { label: "High performers expecting change", detail: "Preparing before the market moves" },
  { label: "Professionals changing industries", detail: "Repositioning skills and narrative for a new domain" },
  { label: "Leaders returning after a break", detail: "Re-entering with confidence and a clear strategy" },
  { label: "GCC & MNC leaders", detail: "Seeking to expand their mandate or step up to global roles" },
  { label: "Professionals facing restructuring", detail: "Moving forward with clarity, not anxiety" },
];

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I finally understood exactly where I was leaving opportunity on the table. The Career Positioning diagnostic alone changed how I showed up in every conversation.",
    name: "Priya M.",
    title: "VP Engineering, Global Tech MNC",
  },
  {
    quote: "Every career platform I tried gave me a framework and left me alone. The AI Coach actually coaches me through applying it — daily, in my context.",
    name: "Rajesh K.",
    title: "Business Head, Fortune 500 Company",
  },
  {
    quote: "The diagnostics surfaced a blind spot my 360 feedback never caught. Three weeks in, I had two conversations I'd been avoiding for months.",
    name: "Ananya S.",
    title: "Director, People & Culture",
  },
];

export default function CareerLanding() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [outplacementModalOpen, setOutplacementModalOpen] = useState(false);
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
              Career Transition Intelligence
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#journey" className="hover:text-white transition-colors">The Journey</a>
            <a href="#engines" className="hover:text-white transition-colors">AI Engines</a>
            <a href="#for-who" className="hover:text-white transition-colors">For Who</a>
            <a href="/career-investment" className="hover:text-white transition-colors">Investment</a>
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
                <a href={loginUrl} className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/8 font-medium text-sm">
                    Sign In
                  </Button>
                </a>
                <a href="/signup">
                  <Button size="sm" className="font-semibold text-sm px-5"
                    style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                    Start Your Transition →
                  </Button>
                </a>
              </>
            )}
            <button className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8"
              onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-6 py-4 flex flex-col gap-3 text-sm"
            style={{ borderColor: "oklch(30% 0.072 248.6)", background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
            {[
              { href: "#journey", label: "The Journey" },
              { href: "#engines", label: "AI Engines" },
              { href: "#for-who", label: "For Who" },
              { href: "/career-investment", label: "Investment" },
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
          background: "radial-gradient(ellipse 70% 80% at 0% 50%, oklch(55% 0.18 280 / 0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 100% 80%, oklch(72% 0.17 162 / 0.06) 0%, transparent 60%)"
        }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-10 md:pt-12 md:pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
            style={{
              background: "oklch(55% 0.18 280 / 0.15)",
              color: "#a5b4fc",
              border: "1.5px solid oklch(55% 0.18 280 / 0.35)"
            }}>
            <Briefcase size={14} />
            Career Transition Intelligence — by LevelNext
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">
            {/* Left: headline + sub + CTA */}
            <div className="lg:w-[55%]">
              <h1 className="font-bold leading-[1.1] mb-6">
                <span className="block text-3xl sm:text-4xl md:text-5xl text-white">
                  Your next career opportunity<br /> shouldn't depend<br /> on luck.
                </span>
              </h1>
              <p className="text-base md:text-lg leading-relaxed mb-4 text-white/75 max-w-2xl">
                Career Transition Intelligence helps professionals discover their gaps, position themselves strategically, access better opportunities and confidently transition into their next role.
              </p>
              <p className="text-sm mb-8 text-white/45">
                Free to start · First diagnostic in 10 minutes · No credit card
              </p>
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <a href="/signup">
                  <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg w-full sm:w-auto"
                    style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                    Start Your Career Transition
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </a>
                <a href="#journey">
                  <Button variant="outline" size="lg"
                    className="h-13 px-7 text-base font-semibold rounded-xl w-full sm:w-auto border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                    See How It Works
                  </Button>
                </a>
              </div>
              <p className="text-xs text-white/35 mt-4">
                Used by Directors, VPs, and Business Heads at Broadridge, Volvo, Texas Instruments, and Razorpay.
              </p>
              <p className="text-xs mt-3" style={{ color: "oklch(55% 0.18 280 / 0.6)" }}>
                For organisations offering outplacement support —{" "}
                <button
                  onClick={() => setOutplacementModalOpen(true)}
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity font-medium bg-transparent border-0 p-0 cursor-pointer">
                  talk to us
                </button>
              </p>
            </div>

            {/* Right: philosophy cards */}
            <div className="lg:w-[45%]">
              <div className="rounded-2xl p-6 border" style={{
                background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)",
                borderColor: "oklch(55% 0.18 280 / 0.25)",
              }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#a5b4fc" }}>
                  Why most transitions fail
                </p>
                {[
                  "They don't know their gaps",
                  "They position themselves poorly",
                  "They practise too little",
                  "They network randomly",
                  "They don't understand the market",
                  "They wait until it's too late",
                ].map((reason) => (
                  <div key={reason} className="flex items-start gap-3 mb-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "oklch(65% 0.2 10 / 0.2)", border: "1px solid oklch(65% 0.2 10 / 0.4)" }}>
                      <X size={10} style={{ color: "#fb7185" }} />
                    </div>
                    <p className="text-sm text-white/65">{reason}</p>
                  </div>
                ))}
                <div className="mt-5 pt-5 border-t" style={{ borderColor: "oklch(55% 0.18 280 / 0.2)" }}>
                  <p className="text-sm font-semibold text-white">Career Transition Intelligence changes that.</p>
                  <p className="text-xs text-white/50 mt-1">
                    Diagnostics + AI coaching + deliberate practice + market intelligence + execution — in one operating system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5-STEP JOURNEY ──────────────────────────────────────────────────── */}
      <section id="journey" className="px-6 py-16 md:py-24" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.025) c h)" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "var(--color-ln-yellow)" }}>
            The Five-Step Journey
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            A complete operating system for career transition.
          </h2>
          <p className="text-sm md:text-base text-white/60 text-center max-w-2xl mx-auto mb-14">
            Not a course. Not a job board. A continuous intelligence platform that works with you from gap discovery to successful transition.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {JOURNEY_STEPS.map(({ step, title, subtitle, icon: Icon, color, glow, items }) => (
              <div key={step} className="rounded-2xl p-5 border flex flex-col gap-4"
                style={{
                  background: `radial-gradient(ellipse 120% 120% at 0% 0%, ${glow} 0%, oklch(from var(--color-ln-navy) calc(l + 0.04) c h) 65%)`,
                  borderColor: `${color}30`,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20`, border: `1.5px solid ${color}40` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: `${color}99` }}>{step}</p>
                    <p className="text-base font-bold text-white leading-tight">{title}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold" style={{ color: `${color}cc` }}>{subtitle}</p>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-white/60">
                      <CheckCircle2 size={11} style={{ color, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI ENGINES ──────────────────────────────────────────────────────── */}
      <section id="engines" className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#a5b4fc" }}>
            AI-Powered Action Engines
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Five engines. One integrated system.
          </h2>
          <p className="text-sm md:text-base text-white/60 text-center max-w-2xl mx-auto mb-14">
            Most career platforms give you data. Career Transition Intelligence gives you action. Each engine is powered by your diagnostic profile and connected to the others.
          </p>

          <div className="space-y-5">
            {AI_ENGINES.map(({ icon: Icon, name, tagline, description, color, glow }, idx) => (
              <div key={name} className="flex flex-col sm:flex-row gap-5 p-6 rounded-2xl border"
                style={{
                  background: `radial-gradient(ellipse 80% 120% at ${idx % 2 === 0 ? "0%" : "100%"} 50%, ${glow} 0%, oklch(from var(--color-ln-navy) calc(l + 0.04) c h) 65%)`,
                  borderColor: `${color}25`,
                }}>
                <div className="flex items-start gap-4 sm:flex-col sm:items-center sm:w-20 flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}20`, border: `1.5px solid ${color}40` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase sm:text-center" style={{ color: `${color}99` }}>
                    Engine {idx + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    <h3 className="text-base md:text-lg font-bold text-white">{name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${color}15`, color: `${color}cc` }}>{tagline}</span>
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed max-w-2xl">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHO ─────────────────────────────────────────────────────────── */}
      <section id="for-who" className="px-6 py-16 md:py-24" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.025) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "var(--color-ln-yellow)" }}>
            Who It's For
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Built for professionals who refuse to leave their next opportunity to chance.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FOR_WHO.map(({ label, detail }) => (
              <div key={label} className="flex items-start gap-3 p-5 rounded-xl border"
                style={{ background: "oklch(from var(--color-ln-navy) calc(l + 0.04) c h)", borderColor: "oklch(from white 20% 0 0 / 0.08)" }}>
                <CheckCircle2 size={16} style={{ color: "var(--color-ln-yellow)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-10 text-center" style={{ color: "var(--color-ln-yellow)" }}>
            What leaders are saying
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "oklch(from white 12% 0 0 / 0.06)", border: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
                <p className="text-base leading-relaxed flex-1 text-white">"{t.quote}"</p>
                <div>
                  <p className="text-base font-bold text-white">{t.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.025) c h)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-ln-yellow)" }}>
            Begin your transition
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Your next opportunity is closer than you think.
          </h2>
          <p className="text-base text-white/60 mb-8 max-w-xl mx-auto">
            Career Transition Intelligence gives you the diagnostic clarity, brand strategy, market intelligence, and preparation systems to take control of what comes next — rather than waiting for it to find you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/signup">
              <Button size="lg" className="h-13 px-10 text-base font-bold rounded-xl shadow-lg"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                Start Your Career Transition
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>
            <a href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg"
                className="h-13 px-8 text-base font-semibold rounded-xl border-white/20 text-white/80 hover:text-white hover:bg-white/8">
                Book a Discovery Call
              </Button>
            </a>
          </div>
          <p className="text-xs text-white/35 mt-5">Free to start · No credit card · First diagnostic in 10 minutes</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-8" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="LevelNext" className="h-7 object-contain" />
            <span className="text-xs text-white/40">Career Transition Intelligence · by LevelNext</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <a href="/" className="hover:text-white/70 transition-colors">Leadership Intelligence</a>
            <a href="/manager-effectiveness" className="hover:text-white/70 transition-colors">Manager Effectiveness</a>
            <a href="/signup" className="hover:text-white/70 transition-colors">Get Started</a>
            <span>© {new Date().getFullYear()} Meta Results Pvt. Ltd.</span>
          </div>
        </div>
      </footer>

      <OutplacementContactModal
        open={outplacementModalOpen}
        onOpenChange={setOutplacementModalOpen}
      />
    </div>
  );
}
