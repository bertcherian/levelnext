import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ChevronDown, Quote, Zap, Target, TrendingUp, Brain, Clock, Shield } from "lucide-react";

const LOGO_URL = "/manus-storage/levelnext-logo_525d7189.png";

// ── MECLABS Element: Motivation (4×) ─────────────────────────────────────────
// Open with the visceral pain moment the persona lives every day

// ── MECLABS Element: Value Proposition (3×) ──────────────────────────────────
// Exact transformation + Named Mechanism (Leadership Edge System)

// ── MECLABS Element: Incentive (2×) ──────────────────────────────────────────
// Free diagnostic, 10 minutes, personalised result immediately

// ── MECLABS Element: Friction (−2×) ──────────────────────────────────────────
// No credit card, 10 minutes, instant result

// ── MECLABS Element: Anxiety (−2×) ───────────────────────────────────────────
// Not another generic leadership course. Not a personality test. Real data, real coaching.

const SOCIAL_PROOF = [
  {
    quote: "I finally understand exactly where my leadership is strong and where I'm leaving influence on the table. The ECI diagnostic alone changed how I show up in board meetings.",
    name: "Priya M.",
    title: "VP Engineering, Global Tech MNC",
  },
  {
    quote: "Every leadership programme I've done gave me a framework and left me alone. LevelNext's Guide actually coaches me through applying it — daily, in my context.",
    name: "Rajesh K.",
    title: "GCC Head, Fortune 500 Company",
  },
  {
    quote: "The Leadership Influence diagnostic surfaced a blind spot my 360 feedback never caught. Three weeks in, my team noticed the difference.",
    name: "Ananya S.",
    title: "Director, People & Culture",
  },
];

const TRANSFORMATION_STEPS = [
  {
    icon: Brain,
    step: "01",
    title: "Diagnose your Edge",
    desc: "Six precision diagnostics reveal your exact leadership strengths, blind spots, and growth opportunities — no generic frameworks.",
  },
  {
    icon: TrendingUp,
    step: "02",
    title: "Build your Intelligence Profile",
    desc: "Your Leadership Edge score compounds with every diagnostic. A living profile that grows richer as you do.",
  },
  {
    icon: Target,
    step: "03",
    title: "Get coached daily",
    desc: "Guide — your personal AI coach — knows your exact profile and gives you specific, actionable Missions every day.",
  },
  {
    icon: Zap,
    step: "04",
    title: "Practise in real scenarios",
    desc: "The AI Practice Coach puts you in live leadership conversations. Rehearse, get feedback, and build your muscle before it counts.",
  },
];

const DIAGNOSTICS = [
  { code: "ECI", name: "Executive Communication", desc: "How you land influence in the room" },
  { code: "TII", name: "Time Intelligence", desc: "How you invest your leadership attention" },
  { code: "LII", name: "Leadership Influence", desc: "How you shape decisions and culture" },
  { code: "GCC", name: "GCC Readiness", desc: "How ready you are to lead at global scale" },
  { code: "LDI", name: "Derailment Intelligence", desc: "What could silently stall your career" },
  { code: "STI", name: "Strategic Thinking", desc: "How you think at the level above your role" },
];

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
        <img src={LOGO_URL} alt="LevelNext" className="h-12 w-auto animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-navy)", color: "white" }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
        <img src={LOGO_URL} alt="LevelNext" className="h-9 w-auto" />
        <div className="flex items-center gap-3">
          <a href={getLoginUrl()}>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">
              Sign In
            </Button>
          </a>
          <a href={getLoginUrl()}>
            <Button size="sm" className="font-semibold text-sm px-5"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Start Free →
            </Button>
          </a>
        </div>
      </header>

      {/* ── HERO: Motivation (4×) + Value Proposition (3×) ───────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(from var(--color-ln-yellow) l c h / 0.08) 0%, transparent 70%)"
        }} />

        {/* MECLABS: Motivation — visceral pain hook */}
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-base font-semibold mb-8"
          style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", color: "var(--color-ln-yellow)", border: "1.5px solid oklch(from var(--color-ln-yellow) l c h / 0.35)" }}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          For senior leaders who know they have more to give
        </div>

        {/* MECLABS: Motivation — the pain moment */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6 max-w-4xl mx-auto">
          <span className="text-white">The Gap Between Where You Are</span><br />
          <span className="text-white">And What's Next</span> <span style={{ color: "var(--color-ln-yellow)" }}>Is Leadership.</span>
        </h1>

        {/* MECLABS: Value Proposition — exact transformation + Named Mechanism */}
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-4 leading-relaxed text-white">
          Most leaders plateau — from gaps you're ignoring or don't even know.
          The <strong style={{ color: "var(--color-ln-yellow)" }}>LevelNext Leadership Intelligence System</strong> gives you
          the exact diagnostics, daily coaching, and AI-powered practice to close the gap
          between the leader you are and the leader you're capable of becoming.
        </p>

        {/* MECLABS: Friction (−2×) — remove every barrier */}
        <p className="text-base mb-10 text-white/60">
          Free to start · First diagnostic in 10 minutes · Personalised result immediately · No credit card
        </p>

        {/* MECLABS: Incentive (2×) — immediate, free, personalised */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a href={getLoginUrl()}>
            <Button size="lg" className="h-14 px-10 text-base font-bold rounded-xl shadow-lg"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Start Your Free Leadership Diagnostic
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>
        </div>

        {/* MECLABS: Anxiety (−2×) — pre-empt the #1 fear */}
        <p className="text-base mt-5 text-white font-medium">
          Not another personality test. Not a generic course. Real intelligence, built on your actual leadership data.
        </p>

        {/* Scroll hint */}
        <div className="mt-16 flex flex-col items-center gap-2 animate-bounce" style={{ color: "oklch(40% 0.02 248.6)" }}>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ── SOCIAL PROOF: Real quotes from real leaders ───────────────────────── */}
      <section className="px-6 py-12 md:py-16" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-lg font-bold uppercase tracking-widest mb-10" style={{ color: "var(--color-ln-yellow)" }}>
            What leaders are saying
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map((sp) => (
              <div key={sp.name} className="rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "oklch(from white 12% 0 0 / 0.06)", border: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
                <Quote size={20} style={{ color: "var(--color-ln-yellow)", opacity: 0.6 }} />
                <p className="text-base leading-relaxed flex-1 text-white">
                  "{sp.quote}"
                </p>
                <div>
                  <p className="text-base font-bold text-white">{sp.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>{sp.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM: Motivation deepened (4×) ────────────────────────────── */}
      <section className="px-6 py-12 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-white">
            Leadership development is broken.<br />
            <span style={{ color: "var(--color-ln-yellow)" }}>Here's why yours hasn't stuck.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
            {[
              {
                icon: Clock,
                problem: "Generic frameworks",
                detail: "Off-the-shelf programmes give you models that weren't built for your context, your role, or your actual gaps.",
              },
              {
                icon: Brain,
                problem: "No continuity",
                detail: "A two-day workshop fades in two weeks. Without daily reinforcement, insight doesn't become behaviour.",
              },
              {
                icon: Target,
                problem: "No precision",
                detail: "You can't improve what you can't measure. Most leaders have never seen a real diagnostic of their leadership.",
              },
            ].map((item) => (
              <div key={item.problem} className="rounded-2xl p-6"
                style={{ background: "oklch(from white 12% 0 0 / 0.04)", border: "1px solid oklch(from white 30% 0 0 / 0.07)" }}>
                <item.icon size={22} className="mb-4" style={{ color: "var(--color-ln-yellow)" }} />
                <h3 className="text-lg font-bold text-white mb-2">{item.problem}</h3>
                <p className="text-base leading-relaxed" style={{ color: "oklch(72% 0.02 248.6)" }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SOLUTION: Value Proposition (3×) + Named Mechanism ──────────── */}
      <section className="px-6 py-16 md:py-24" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-ln-yellow)" }}>
              The LevelNext Leadership Intelligence System
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">
              Four steps from insight to<br />
              <span style={{ color: "var(--color-ln-yellow)" }}>measurable leadership growth.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRANSFORMATION_STEPS.map((step) => (
              <div key={step.step} className="rounded-2xl p-6 flex gap-5"
                style={{ background: "oklch(from white 12% 0 0 / 0.05)", border: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
                <div className="flex-shrink-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.25)" }}>
                    <step.icon size={20} style={{ color: "var(--color-ln-yellow)" }} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "oklch(50% 0.02 248.6)" }}>Step {step.step}</p>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: "oklch(72% 0.02 248.6)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIAGNOSTICS: What's inside ────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-ln-yellow)" }}>
              Six precision diagnostics
            </p>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">
            Know exactly where you stand.<br />
            <span style={{ color: "var(--color-ln-yellow)" }}>In every dimension that matters.</span>
          </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {DIAGNOSTICS.map((d) => (
              <div key={d.code} className="rounded-xl p-5 flex items-start gap-4"
                style={{ background: "oklch(from white 12% 0 0 / 0.04)", border: "1px solid oklch(from white 30% 0 0 / 0.07)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", color: "var(--color-ln-yellow)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.2)" }}>
                  {d.code}
                </div>
                <div>
                  <p className="text-base font-bold text-white">{d.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANXIETY COUNTER: Pre-empt the #1 fear (−2×) ─────────────────────── */}
      <section className="px-6 py-16 md:py-20" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-white">
            Not what you're thinking.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                fear: "\"It's just another MBTI.\"",
                counter: "LevelNext diagnostics are built for leadership behaviour in context — not personality archetypes. Your Edge score is grounded in how you actually lead.",
              },
              {
                fear: "\"I don't have time for this.\"",
                counter: "Each diagnostic takes 10 minutes. Guide fits into your day in 2-minute coaching moments. The AI Practice Coach works around your schedule.",
              },
              {
                fear: "\"My company already does this.\"",
                counter: "LevelNext is your personal leadership intelligence — independent of your employer. It travels with you, compounds over time, and belongs to you.",
              },
            ].map((item) => (
              <div key={item.fear} className="rounded-2xl p-6 text-left"
                style={{ background: "oklch(from white 12% 0 0 / 0.05)", border: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} style={{ color: "var(--color-ln-yellow)" }} />
                  <p className="text-base font-semibold text-white">{item.fear}</p>
                </div>
                <p className="text-base leading-relaxed" style={{ color: "oklch(78% 0.02 248.6)" }}>{item.counter}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA: Incentive (2×) + Friction removal (−2×) ──────────────── */}
      <section className="px-6 py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 100%, oklch(from var(--color-ln-yellow) l c h / 0.07) 0%, transparent 70%)"
        }} />
        <div className="max-w-2xl mx-auto relative">
          <p className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--color-ln-yellow)" }}>
            Start building your edge today
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-white">
            Your next level of leadership<br />
            <span style={{ color: "var(--color-ln-yellow)" }}>starts with one diagnostic.</span>
          </h2>
          <p className="text-lg mb-10 leading-relaxed text-white/70">
            In 10 minutes, you'll have a personalised Leadership Edge score,
            a clear picture of your strengths and growth edges, and your first
            coaching mission from Guide — completely free.
          </p>

          {/* Friction-reducing checklist */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {["Free to start", "10-minute first diagnostic", "Instant personalised result", "No credit card required", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "var(--color-ln-yellow)" }} />
                <span className="text-sm" style={{ color: "oklch(65% 0.02 248.6)" }}>{item}</span>
              </div>
            ))}
          </div>

          <a href={getLoginUrl()}>
            <Button size="lg" className="h-14 px-12 text-base font-bold rounded-xl shadow-xl"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Start Your Free Diagnostic
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>

          <p className="text-xs mt-5" style={{ color: "oklch(40% 0.02 248.6)" }}>
            Trusted by senior leaders across GCCs, MNCs, and high-growth companies.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid oklch(from white 20% 0 0 / 0.08)" }}>
        <img src={LOGO_URL} alt="LevelNext" className="h-8 w-auto opacity-60" />
        <p className="text-sm text-center" style={{ color: "oklch(40% 0.02 248.6)" }}>
          © 2026 LevelNext · Powered by Meta Results Pvt. Ltd.
        </p>
        <a href={getLoginUrl()}>
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/70 text-xs">
            Sign In →
          </Button>
        </a>
      </footer>
    </div>
  );
}
