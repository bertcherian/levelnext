/**
 * /signup — Open Self-Registration Page
 *
 * Detects ?platform=mep to show Manager Effectiveness copy,
 * otherwise defaults to Leadership Intelligence copy.
 * Collects name + email, sends a magic link via requestMagicLink.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  CheckCircle2, ArrowRight, Brain, Target, Zap, TrendingUp,
  Shield, Users, BarChart3, MessageSquare, BookOpen,
} from "lucide-react";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_88851f5c.png";

// ── Platform content configs ──────────────────────────────────────────────────

const LI_CONTENT = {
  badge: "Free to join · No credit card required",
  headline: ["Know exactly where", "your leadership stands."],
  subhead:
    "LevelNext is the Leadership Intelligence Platform for senior leaders who want precision over platitudes — and a daily coaching system that actually moves the needle.",
  benefits: [
    {
      icon: Brain,
      title: "6 Precision Diagnostics",
      desc: "Measure ECI, LII, TII, GCC, LDI, and STI — the six dimensions that define executive impact.",
    },
    {
      icon: Target,
      title: "Daily AI Coaching",
      desc: "Guide knows your exact profile and gives you specific, actionable missions every day.",
    },
    {
      icon: Zap,
      title: "AI Practice Coach",
      desc: "Rehearse real leadership conversations and get instant feedback before it counts.",
    },
    {
      icon: TrendingUp,
      title: "Career Intelligence",
      desc: "Map your career graph, build your brand strategy, and draft targeted outreach.",
    },
  ],
  checklist: [
    "Free access to all 6 leadership diagnostics",
    "Personalised AI coaching from Guide",
    "AI Practice Coach for real conversations",
    "Career Intelligence suite",
  ],
  testimonials: [
    {
      quote: "The ECI diagnostic alone changed how I show up in board meetings.",
      name: "Priya M.",
      title: "VP Engineering, Global Tech MNC",
    },
    {
      quote: "Guide actually coaches me through applying it — daily, in my context.",
      name: "Rajesh K.",
      title: "GCC Head, Fortune 500 Company",
    },
    {
      quote: "It surfaced a blind spot my 360 feedback never caught.",
      name: "Ananya S.",
      title: "Director, People & Culture",
    },
  ],
};

const MEP_CONTENT = {
  badge: "Free to join · No credit card required",
  headline: ["Become the manager", "your team deserves."],
  subhead:
    "LevelNext Manager Effectiveness gives you 10 precision diagnostics, an AI coaching advisor, and a daily management brief — everything you need to go from good to exceptional.",
  benefits: [
    {
      icon: BarChart3,
      title: "10 Management Diagnostics",
      desc: "Measure delegation, feedback, motivation, communication, conflict, decision-making, and more.",
    },
    {
      icon: MessageSquare,
      title: "AI Manager Guide",
      desc: "Context-aware coaching that knows your diagnostic profile and gives you specific daily actions.",
    },
    {
      icon: Zap,
      title: "AI Practice Partner",
      desc: "Role-play difficult conversations — feedback, conflict, performance — and get instant coaching.",
    },
    {
      icon: Users,
      title: "Team Intelligence",
      desc: "Build your team map, generate AI coaching insights per person, and track their growth.",
    },
    {
      icon: BookOpen,
      title: "Manager Playbook",
      desc: "Describe any situation and get a structured, SBI-based playbook with a conversation guide.",
    },
  ],
  checklist: [
    "Free access to all 10 management diagnostics",
    "Personalised AI coaching from Manager Guide",
    "AI Practice Partner for difficult conversations",
    "Daily Management Brief to start every day sharp",
    "Team Intelligence dashboard",
  ],
  testimonials: [
    {
      quote: "The delegation diagnostic showed me exactly why my team wasn't taking ownership.",
      name: "Vikram R.",
      title: "Engineering Manager, Global MNC",
    },
    {
      quote: "The Practice Partner helped me prepare for a performance conversation I'd been avoiding for weeks.",
      name: "Sneha P.",
      title: "Team Lead, Product & Design",
    },
    {
      quote: "My Daily Brief is the first thing I read every morning. It keeps me focused.",
      name: "Arjun T.",
      title: "Operations Manager, Fortune 500",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "check_inbox">("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  // Detect platform from URL query param: /signup?platform=mep
  const params = new URLSearchParams(window.location.search);
  const isMep = params.get("platform") === "mep";
  const content = isMep ? MEP_CONTENT : LI_CONTENT;

  const requestMagicLink = trpc.emailAuth.requestMagicLink.useMutation({
    onSuccess: (data) => {
      setState("check_inbox");
      if (data && "devToken" in data && data.devToken) {
        setDevToken(data.devToken as string);
      }
    },
    onError: (err) => {
      setErrorMsg(err.message || "Failed to send sign-in link. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMsg(null);
    requestMagicLink.mutate({
      email: email.trim().toLowerCase(),
      origin: window.location.origin,
      name: name.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#12345A" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <a href="/">
          <img src={LOGO_URL} alt="LevelNext" className="h-10 object-contain" />
        </a>
        <a
          href="/login"
          className="text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Already have an account? <span style={{ color: "#F2B705" }}>Sign in →</span>
        </a>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Value proposition */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(242,183,5,0.15)", color: "#F2B705", border: "1px solid rgba(242,183,5,0.3)" }}
            >
              <Shield size={12} /> {content.badge}
            </div>

            {/* Headline — explicit white for full readability on navy */}
            <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "#FFFFFF" }}>
              {content.headline[0]}<br />{content.headline[1]}
            </h1>

            <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.82)" }}>
              {content.subhead}
            </p>

            <div className="space-y-4 mb-10">
              {content.benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div
                    className="rounded-lg p-2 flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(242,183,5,0.12)" }}
                  >
                    <b.icon size={16} style={{ color: "#F2B705" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{b.title}</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="space-y-3">
              {content.testimonials.map((s) => (
                <div
                  key={s.name}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <p className="text-sm italic mb-2" style={{ color: "rgba(255,255,255,0.8)" }}>
                    "{s.quote}"
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "#F2B705" }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Sign-up form */}
          <div>
            {state === "form" ? (
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-1" style={{ color: "#12345A" }}>
                  Create your free account
                </h2>
                <p className="text-sm mb-6" style={{ color: "#666" }}>
                  No password needed. We'll email you a sign-in link.
                </p>

                {errorMsg && (
                  <div
                    className="mb-4 px-4 py-3 rounded-lg text-sm"
                    style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
                  >
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#12345A" }}>
                      Your name
                    </label>
                    <Input
                      type="text"
                      placeholder="Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 text-base"
                      style={{ borderColor: "#d1cfc9" }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "#12345A" }}>
                      Work email address <span style={{ color: "#e53e3e" }}>*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 text-base"
                      style={{ borderColor: "#d1cfc9" }}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold rounded-full gap-2"
                    style={{ background: "#F2B705", color: "#12345A" }}
                    disabled={requestMagicLink.isPending || !email.trim()}
                  >
                    {requestMagicLink.isPending ? (
                      "Sending your link…"
                    ) : (
                      <>Get Started Free <ArrowRight size={18} /></>
                    )}
                  </Button>
                </form>

                {/* What you get checklist */}
                <div
                  className="mt-6 pt-6 border-t space-y-2"
                  style={{ borderColor: "#f0ede8" }}
                >
                  {content.checklist.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm" style={{ color: "#444" }}>
                      <CheckCircle2 size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center mt-5" style={{ color: "#aaa" }}>
                  By signing up, you agree to our{" "}
                  <a href="/privacy" className="underline" style={{ color: "#888" }}>Privacy Policy</a>.
                  <br />
                  Already have an account?{" "}
                  <a href="/login" className="underline font-medium" style={{ color: "#12345A" }}>Sign in</a>
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
                  style={{ background: "#FEF3C7" }}
                >
                  ✉
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: "#12345A" }}>
                  Check your inbox
                </h2>
                <p className="text-sm mb-2" style={{ color: "#333" }}>
                  We've sent a sign-in link to
                </p>
                <p className="text-base font-bold mb-4" style={{ color: "#12345A" }}>
                  {email}
                </p>
                <p className="text-sm mb-6" style={{ color: "#333" }}>
                  Click the link in the email to sign in. The link expires in 15 minutes.
                </p>

                {devToken && (
                  <div
                    className="mb-6 p-4 rounded-lg text-left"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                  >
                    <p className="text-xs font-semibold mb-2" style={{ color: "#166534" }}>
                      DEV MODE — SMTP not configured. Use this link:
                    </p>
                    <a
                      href={`/api/auth/magic-link/verify?token=${devToken}`}
                      className="text-xs break-all underline"
                      style={{ color: "#15803D" }}
                    >
                      /api/auth/magic-link/verify?token={devToken}
                    </a>
                  </div>
                )}

                <button
                  className="w-full h-11 rounded-full border text-sm font-medium mb-3 transition-colors"
                  style={{ borderColor: "#d1cfc9", color: "#12345A", background: "transparent" }}
                  onClick={() => { setState("form"); setErrorMsg(null); setDevToken(null); }}
                >
                  Use a different email
                </button>
                <button
                  className="text-sm underline"
                  style={{ color: "#12345A" }}
                  onClick={handleSubmit}
                >
                  Resend sign-in link
                </button>
                <p className="text-xs mt-5" style={{ color: "#888" }}>
                  Didn't receive it? Check your spam folder or try a different email address.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        LevelNext by Meta Results Pvt. Ltd. · Bangalore, India
      </div>
    </div>
  );
}
