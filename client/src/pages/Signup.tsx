/**
 * /signup — Open Self-Registration Page
 *
 * Anyone can sign up without an invite.
 * Collects name + email, sends a magic link via the existing requestMagicLink flow.
 * No password needed. Product sign-ups preserve their requested product destination;
 * generic users can continue through onboarding.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Brain, Target, Zap, TrendingUp, Shield, AlertTriangle, RefreshCw, Mail } from "lucide-react";

const LOGO_URL = "/logo.png";

const BENEFITS = [
  {
    icon: Brain,
    title: "6 Precision Diagnostics",
    desc: "Know exactly where your leadership stands — ECI, LII, TII, GCC, LDI, STI.",
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
];

const SOCIAL_PROOF = [
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
];

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "The sign-in link is missing. Please request a new one.",
  invalid_or_expired: "This sign-in link has expired or already been used. Please request a new one.",
  server_error: "Something went wrong. Please try again.",
};

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [state, setState] = useState<"form" | "check_inbox" | "link_error">("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const errorParam = params.get("error");
  // ?platform=mep → /manager, ?platform=career → /career, etc.
  const platformParam = params.get("platform");
  const returnToParam = params.get("returnTo");
  const resolvedReturnTo = returnToParam ??
    (platformParam === "mep" ? "/manager" :
     platformParam === "career" ? "/career" :
     platformParam === "leadership" ? "/home" : undefined);
  const isManagerEffectivenessSignup = platformParam === "mep";

  useEffect(() => {
    if (errorParam === "invalid_or_expired" || errorParam === "missing_token") {
      setState("link_error");
      setErrorMsg(ERROR_MESSAGES[errorParam]);
    }
  }, [errorParam]);

  const requestMagicLink = trpc.emailAuth.requestMagicLink.useMutation({
    onSuccess: (data) => {
      setState("check_inbox");
      if (data && "devToken" in data && data.devToken) {
        setDevToken(data.devToken as string);
      }
      window.history.replaceState({}, "", window.location.pathname);
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
      organisation: isManagerEffectivenessSignup ? organisation.trim() || undefined : undefined,
      returnTo: resolvedReturnTo,
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
          <div style={{ color: '#ffffff' }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(242,183,5,0.15)", color: "#F2B705", border: "1px solid rgba(242,183,5,0.3)" }}
            >
              <Shield size={12} /> Free to join · No credit card required
            </div>

            <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: '#ffffff' }}>
              Know exactly where<br />
              your leadership stands.
            </h1>
            <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              LevelNext is the Leadership Intelligence Platform for senior leaders who want precision over platitudes — and a daily coaching system that actually moves the needle.
            </p>

            <div className="space-y-4 mb-10">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div
                    className="rounded-lg p-2 flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(242,183,5,0.12)" }}
                  >
                    <b.icon size={16} style={{ color: "#F2B705" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{b.title}</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="space-y-3">
              {SOCIAL_PROOF.map((s) => (
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
            {state === "link_error" ? (
              <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: "#FEF2F2" }}
                >
                  <AlertTriangle size={28} style={{ color: "#DC2626" }} />
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: "#12345A" }}>
                  {errorParam === "invalid_or_expired" ? "Link expired" : "Invalid link"}
                </h2>
                <p className="text-sm mb-6" style={{ color: "#555" }}>
                  {errorParam === "invalid_or_expired"
                    ? "This sign-in link has expired or has already been used. Magic links are valid for 15 minutes and can only be clicked once."
                    : "This sign-in link is not valid. Please request a new one below."
                  }
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!email.trim()) return;
                    setErrorMsg(null);
                    requestMagicLink.mutate({ email: email.trim().toLowerCase(), origin: window.location.origin, name: name || undefined, organisation: isManagerEffectivenessSignup ? organisation.trim() || undefined : undefined, returnTo: resolvedReturnTo });
                  }}
                  className="space-y-3 mb-4"
                >
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#999" }} />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="h-12 text-base pl-10"
                      style={{ borderColor: "#d1cfc9" }}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold rounded-full gap-2"
                    style={{ background: "#F2B705", color: "#12345A" }}
                    disabled={requestMagicLink.isPending || !email.trim()}
                  >
                    <RefreshCw size={16} />
                    {requestMagicLink.isPending ? "Sending new link…" : "Send New Sign-In Link"}
                  </Button>
                </form>
                <p className="text-xs" style={{ color: "#aaa" }}>Enter your email above and we’ll send a fresh link.</p>
              </div>
            ) : state === "form" ? (
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

                  {isManagerEffectivenessSignup && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "#12345A" }}>
                        Organisation <span className="text-xs font-normal" style={{ color: "#666" }}>(optional)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Broadridge"
                        value={organisation}
                        onChange={(e) => setOrganisation(e.target.value)}
                        className="h-12 text-base"
                        style={{ borderColor: "#d1cfc9" }}
                      />
                      <p className="mt-1.5 text-xs" style={{ color: "#666" }}>
                        We will carry this into your organisation setup after you verify your email.
                      </p>
                    </div>
                  )}

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
                  {[
                    "Free access to all 6 leadership diagnostics",
                    "Personalised AI coaching from Guide",
                    "AI Practice Coach for real conversations",
                    "Career Intelligence suite",
                  ].map((item) => (
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
                  We've sent your sign-in link to
                </p>
                <p className="font-semibold text-base mb-4" style={{ color: "#12345A" }}>
                  {email}
                </p>
                <p className="text-sm mb-6" style={{ color: "#333" }}>
                  Click the link in the email to access LevelNext. The link expires in 15 minutes.
                </p>

                {/* Dev mode */}
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
                  className="text-sm underline"
                  style={{ color: "#333" }}
                  onClick={() => { setState("form"); setErrorMsg(null); setDevToken(null); }}
                >
                  Use a different email
                </button>

                <p className="text-xs mt-6" style={{ color: "#555" }}>
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
