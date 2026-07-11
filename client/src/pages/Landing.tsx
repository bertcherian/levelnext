import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2, Quote, Zap, Target, TrendingUp, Brain, Clock, Shield } from "lucide-react";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_570ab0aa.png";
const VIDEO_URL = "/manus-storage/levelnext_explainer_v5_a20a9a42.mp4";
const POSTER_URL = "/manus-storage/video_poster_9c31f573.jpg";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, loading, navigate]);

  function handlePlay() {
    setPlaying(true);
    videoRef.current?.play();
  }

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
      <header className="sticky top-0 z-50 px-6 md:px-10 py-4"
        style={{
          background: "oklch(from var(--color-ln-navy) l c h / 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(from white 30% 0 0 / 0.08)"
        }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img src={LOGO_URL} alt="LevelNext" className="h-14 w-auto" />
          <div className="flex items-center gap-3">
            <a href={getLoginUrl()}>
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">
                Sign In
              </Button>
            </a>
            <a href="/apply">
              <Button size="sm" className="font-semibold text-sm px-5"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                Apply for a Pilot →
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO: Split layout — text left, video right ───────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 80% at 0% 50%, oklch(from var(--color-ln-yellow) l c h / 0.06) 0%, transparent 60%)"
        }} />

        {/* Mobile: video on top, text below */}
        {/* Desktop: text left, video right — both above the fold */}
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-0 md:min-h-[calc(100vh-65px)] flex flex-col md:flex-row md:items-center gap-8 md:gap-12">

          {/* ── Left: Text + CTA ──────────────────────────────────────────────── */}
          <div className="flex flex-col items-start text-left md:w-[52%] md:py-6 order-2 md:order-1">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
              style={{
                background: "oklch(from var(--color-ln-yellow) l c h / 0.12)",
                color: "var(--color-ln-yellow)",
                border: "1.5px solid oklch(from var(--color-ln-yellow) l c h / 0.35)"
              }}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              For senior leaders who know they have more to give
            </div>

            {/* Headline — compact size */}
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold leading-[1.15] mb-4">
              <span className="text-white">Know Exactly Where Your Leadership Stands.</span><br />
              <span style={{ color: "var(--color-ln-yellow)" }}>Fix What's Holding You Back.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm md:text-base leading-relaxed mb-3 text-white/80 max-w-lg">
              Most leaders plateau — from gaps they're ignoring or don't even know.
              The <strong style={{ color: "var(--color-ln-yellow)" }}>LevelNext Leadership Intelligence System</strong> gives you
              precision diagnostics, daily AI coaching, and practice to close the gap.
            </p>

            {/* Friction reducer */}
            <p className="text-xs mb-5 text-white/50">
              Free to start · First diagnostic in 10 minutes · No credit card
            </p>

            {/* CTA — above the fold */}
            <a href="/apply">
              <Button size="lg" className="h-13 px-8 text-base font-bold rounded-xl shadow-lg"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                Apply for a Pilot
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </a>

            {/* Anxiety counter */}
            <p className="text-sm mt-4 text-white/50">
              Not another personality test. Real intelligence, built on your actual leadership data.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6">
              {["IBM", "Volvo", "Broadridge", "Texas Instruments", "Syngenta"].map((co) => (
                <span key={co} className="text-xs font-semibold tracking-wide"
                  style={{ color: "oklch(55% 0.02 248.6)" }}>
                  {co}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Video ──────────────────────────────────────────────────── */}
          <div className="md:w-[48%] order-1 md:order-2 md:py-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{ border: "2px solid oklch(from var(--color-ln-yellow) l c h / 0.3)" }}>
              <video
                ref={videoRef}
                src={VIDEO_URL}
                poster={POSTER_URL}
                className="w-full block"
                style={{ aspectRatio: "16/9", objectFit: "cover" }}
                playsInline
                controls
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
              {/* Custom play button overlay — hidden once playing */}
              {!playing && (
                <button
                  onClick={handlePlay}
                  aria-label="Play video"
                  className="absolute inset-0 flex items-center justify-center w-full h-full"
                  style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.35)", backdropFilter: "blur(2px)", border: "none", cursor: "pointer" }}
                >
                  <div className="flex items-center justify-center rounded-full"
                    style={{
                      width: 72, height: 72,
                      background: "var(--color-ln-yellow)",
                      boxShadow: "0 0 0 8px oklch(from var(--color-ln-yellow) l c h / 0.25), 0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <polygon points="10,7 22,14 10,21" fill="var(--color-ln-navy)" />
                    </svg>
                  </div>
                  <span className="absolute bottom-4 left-0 right-0 text-center text-xs font-semibold tracking-wide"
                    style={{ color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                    Watch the 85-second overview
                  </span>
                </button>
              )}
            </div>
            <p className="text-xs text-center mt-3" style={{ color: "oklch(50% 0.02 248.6)" }}>
              See LevelNext in action — 85 seconds
            </p>
          </div>

        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-12 md:py-16" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-bold uppercase tracking-widest mb-10" style={{ color: "var(--color-ln-yellow)" }}>
            What leaders are saying
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map((sp) => (
              <div key={sp.name} className="rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "oklch(from white 12% 0 0 / 0.06)", border: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
                <Quote size={20} style={{ color: "var(--color-ln-yellow)", opacity: 0.6 }} />
                <p className="text-base leading-relaxed flex-1 text-white">"{sp.quote}"</p>
                <div>
                  <p className="text-base font-bold text-white">{sp.name}</p>
                  <p className="text-sm mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>{sp.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-12 md:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-white">
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

      {/* ── THE SOLUTION ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24" style={{ background: "oklch(from var(--color-ln-navy) calc(l - 0.03) c h)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-ln-yellow)" }}>
              The LevelNext Leadership Intelligence System
            </p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white">
              Four steps from insight to{" "}
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

      {/* ── DIAGNOSTICS ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-ln-yellow)" }}>
              Six precision diagnostics
            </p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white">
              Know exactly where you stand.{" "}
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

      {/* ── ANXIETY COUNTER ──────────────────────────────────────────────────── */}
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

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 100%, oklch(from var(--color-ln-yellow) l c h / 0.07) 0%, transparent 70%)"
        }} />
        <div className="max-w-2xl mx-auto relative">
          <p className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--color-ln-yellow)" }}>
            Start building your edge today
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-white">
            Your next level of leadership{" "}
            <span style={{ color: "var(--color-ln-yellow)" }}>starts with one diagnostic.</span>
          </h2>
          <p className="text-lg mb-10 leading-relaxed text-white/70">
            In 10 minutes, you'll have a personalised Leadership Edge score,
            a clear picture of your strengths and growth edges, and your first
            coaching mission from Guide — completely free.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
            {["Free to start", "10-minute first diagnostic", "Instant personalised result", "No credit card required"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "var(--color-ln-yellow)" }} />
                <span className="text-sm" style={{ color: "oklch(65% 0.02 248.6)" }}>{item}</span>
              </div>
            ))}
          </div>

          <a href="/apply">
            <Button size="lg" className="h-14 px-12 text-base font-bold rounded-xl shadow-xl"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Apply for a Pilot
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </a>

          <p className="text-xs mt-5" style={{ color: "oklch(40% 0.02 248.6)" }}>
            Trusted by senior leaders across GCCs, MNCs, and high-growth companies.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid oklch(from white 20% 0 0 / 0.08)" }}>
        <img src={LOGO_URL} alt="LevelNext" className="h-12 w-auto opacity-70" />
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
