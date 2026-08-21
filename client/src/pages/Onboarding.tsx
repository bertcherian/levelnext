import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getIndividualOnboardingDestination } from "./onboardingDestination";
import {
  isManagerEffectivenessDestination,
  MEP_DEFERRED_ORG_SETUP_KEY,
  MEP_POST_SKIP_WELCOME_KEY,
} from "@/lib/mepPostSkip";
import {
  Building2, Users, ArrowRight, CheckCircle2, ChevronLeft,
  AlertCircle, Check, Sparkles, Brain, Target, Zap, TrendingUp, BookOpen, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Mode = "choose" | "create" | "join" | "success" | "tour";

// ── Step definitions ───────────────────────────────────────────────────────────
const STEPS: Record<Exclude<Mode, "choose" | "success" | "tour">, { index: number; label: string }> = {
  create: { index: 1, label: "Create Organisation" },
  join:   { index: 1, label: "Join Organisation" },
};

// ── Validation helpers ─────────────────────────────────────────────────────────
function validateOrgName(v: string): string | null {
  if (!v.trim()) return "Organisation name is required.";
  if (v.trim().length < 2) return "Must be at least 2 characters.";
  if (v.trim().length > 120) return "Must be 120 characters or fewer.";
  return null;
}

function validateInviteCode(v: string): string | null {
  if (!v.trim()) return "Invite code is required.";
  if (v.replace(/[-\s]/g, "").length < 6) return "Invite code looks too short.";
  return null;
}

// ── Platform pillars ───────────────────────────────────────────────────────────
const PLATFORM_PILLARS = [
  { label: "Executive Communication", desc: "Build your presence and strategic voice" },
  { label: "Leadership Influence",    desc: "Expand your impact across stakeholders" },
  { label: "GCC Readiness",           desc: "Lead your global capability centre forward" },
];

// ── Tour steps ─────────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    icon: Brain,
    title: "Start with a Diagnostic",
    desc: "LevelNext begins with precision. Your first step is to complete one of 6 leadership diagnostics — each one generates a personalised score, zone, and AI-powered recommendations specific to you.",
    highlight: "Recommended first: Executive Communication Intelligence (ECI)",
    action: "Go to Diagnostics",
    path: "/diagnostics",
  },
  {
    icon: Target,
    title: "Meet Guide — Your AI Coach",
    desc: "Guide is your always-on AI coaching partner. It knows your diagnostic scores, your leadership context, and your goals. Every day it gives you specific, actionable missions — not generic advice.",
    highlight: "Guide adapts to your exact profile. The more you share, the sharper it gets.",
    action: "Open Guide",
    path: "/guide",
  },
  {
    icon: Zap,
    title: "Practice Real Conversations",
    desc: "The AI Practice Coach lets you rehearse leadership conversations before they happen — difficult feedback, stakeholder alignment, executive presence moments. Get instant, specific feedback.",
    highlight: "Practice is where insight becomes behaviour.",
    action: "Try Practice Coach",
    path: "/practice",
  },
  {
    icon: BookOpen,
    title: "Begin Your Next Chapter",
    desc: "Next Chapter is your identity-first career intelligence journey — a 16-module programme that helps you design your leadership future, build your brand, and navigate your next transition with clarity.",
    highlight: "Start with Module 1: Understanding Today.",
    action: "Start Next Chapter",
    path: "/next-chapter",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    desc: "Your Leadership Edge profile evolves as you complete diagnostics, coaching sessions, and practice. Your coach can see your portfolio and brief themselves before every session.",
    highlight: "Your data is private. You control what your coach can see.",
    action: "View My Progress",
    path: "/progress",
  },
];

// ── Tour component ─────────────────────────────────────────────────────────────
function PlatformTour({ firstName, onFinish }: { firstName: string; onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();
  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>
            Platform Tour
          </p>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            {firstName}, here's how LevelNext works
          </h1>
        </div>
        <button
          onClick={onFinish}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          title="Skip tour"
        >
          <X size={16} style={{ color: "var(--color-ln-muted)" }} />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {TOUR_STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? "24px" : "8px",
              height: "8px",
              background: i === step ? "var(--color-ln-navy)" : i < step ? "var(--color-ln-yellow)" : "oklch(88% 0.01 248.6)",
            }}
          />
        ))}
        <span className="ml-2 text-xs" style={{ color: "var(--color-ln-muted)" }}>
          {step + 1} of {TOUR_STEPS.length}
        </span>
      </div>

      {/* Step card */}
      <div
        className="rounded-2xl p-6 mb-4"
        style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}
        key={step}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "var(--color-ln-navy)" }}
        >
          <Icon size={22} style={{ color: "var(--color-ln-yellow)" }} />
        </div>

        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
          {current.title}
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#444" }}>
          {current.desc}
        </p>

        {/* Highlight callout */}
        <div
          className="rounded-lg px-4 py-3 mb-4"
          style={{ background: "oklch(97% 0.02 90)", border: "1px solid oklch(88% 0.06 90)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "oklch(45% 0.12 90)" }}>
            💡 {current.highlight}
          </p>
        </div>

        {/* Go there button */}
        <button
          onClick={() => navigate(current.path)}
          className="text-sm font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--color-ln-navy)" }}
        >
          {current.action} <ArrowRight size={14} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1 h-10 text-sm"
            style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}
            onClick={() => setStep(s => s - 1)}
          >
            ← Previous
          </Button>
        )}
        <Button
          className="flex-1 h-10 text-sm font-semibold"
          style={{ background: "var(--color-ln-navy)", color: "white" }}
          onClick={() => isLast ? onFinish() : setStep(s => s + 1)}
        >
          {isLast ? "Get Started →" : "Next →"}
        </Button>
      </div>

      <p className="text-xs text-center mt-4" style={{ color: "var(--color-ln-muted)" }}>
        You can always revisit this tour from the Help menu.
      </p>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ mode }: { mode: Mode }) {
  if (mode === "choose" || mode === "success") return null;
  const steps = ["Choose path", STEPS[mode as "create" | "join"].label, "You're in"];
  const current = 1; // always step 2 when in create/join form

  return (
    <div className="flex items-center gap-0 mb-7">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-0">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: done ? "var(--color-ln-navy)" : active ? "var(--color-ln-yellow)" : "oklch(92% 0.01 248.6)",
                  color: done ? "white" : active ? "var(--color-ln-navy)" : "var(--color-ln-muted)",
                  boxShadow: active ? "0 0 0 3px oklch(from var(--color-ln-yellow) l c h / 0.25)" : "none",
                }}
              >
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span
                className="text-[10px] mt-1 font-medium whitespace-nowrap"
                style={{ color: active ? "var(--color-ln-navy)" : "var(--color-ln-muted)" }}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className="h-[2px] w-12 sm:w-16 mx-1 mb-4 rounded-full transition-all duration-500"
                style={{ background: done ? "var(--color-ln-navy)" : "oklch(90% 0.01 248.6)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Success overlay ────────────────────────────────────────────────────────────
function SuccessScreen({ orgName }: { orgName: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-8 animate-fade-in"
      style={{ animationDuration: "400ms" }}
    >
      {/* Animated checkmark ring */}
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "oklch(97% 0.01 150)",
            border: "3px solid oklch(60% 0.15 150)",
            animation: "successPop 0.5s cubic-bezier(0.23, 1, 0.32, 1) both",
          }}
        >
          <Check size={36} strokeWidth={2.5} style={{ color: "oklch(45% 0.15 150)" }} />
        </div>
        {/* Sparkle */}
        <Sparkles
          size={18}
          className="absolute -top-1 -right-1"
          style={{ color: "var(--color-ln-yellow)", animation: "sparkleIn 0.6s 0.3s ease-out both" }}
        />
      </div>

      <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
        You're all set!
      </h2>
      <p className="text-sm mb-1" style={{ color: "var(--color-ln-muted)" }}>
        <span className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>{orgName}</span> is ready.
      </p>
      <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
        Taking you to your dashboard…
      </p>

      {/* Progress bar */}
      <div
        className="mt-6 h-1 rounded-full overflow-hidden"
        style={{ width: "140px", background: "oklch(92% 0.01 248.6)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "var(--color-ln-yellow)",
            animation: "progressFill 2s linear forwards",
          }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");
  const [successOrgName, setSuccessOrgName] = useState("");

  // Create form state
  const [orgName, setOrgName]       = useState("");
  const [orgNameTouched, setOrgNameTouched] = useState(false);
  const [industry, setIndustry]     = useState("");
  const [size, setSize]             = useState("");

  // Join form state
  const [inviteCode, setInviteCode]           = useState("");
  const [inviteCodeTouched, setInviteCodeTouched] = useState(false);

  // Derived validation
  const orgNameError    = orgNameTouched    ? validateOrgName(orgName)       : null;
  const inviteCodeError = inviteCodeTouched ? validateInviteCode(inviteCode) : null;
  const createValid     = validateOrgName(orgName) === null;
  const joinValid       = validateInviteCode(inviteCode) === null;

  const createTenant = trpc.tenant.create.useMutation({
    onSuccess: (_, vars) => {
      setSuccessOrgName(vars.name);
      // Redirect to the Enterprise Onboarding Wizard for full setup
      navigate("/enterprise-onboarding");
    },
    onError: (e) => toast.error(e.message),
  });

  const joinTenant = trpc.tenant.join.useMutation({
    onSuccess: (data) => {
      setSuccessOrgName(data.name);
      setMode("success");
    },
    onError: (e) => toast.error(e.message),
  });

  // Auto-navigate after success animation — respect returnTo param from magic link flow
  const returnToParam = new URLSearchParams(window.location.search).get("returnTo");
  const individualDestination = getIndividualOnboardingDestination(returnToParam);
  const individualProductName = individualDestination.startsWith("/manager")
    ? "Manager Effectiveness"
    : "Career Transition";
  const handleIndividualSkip = () => {
    const isManagerDestination = isManagerEffectivenessDestination(individualDestination);
    if (isManagerDestination) {
      window.sessionStorage.setItem(MEP_POST_SKIP_WELCOME_KEY, "true");
      window.localStorage.setItem(MEP_DEFERRED_ORG_SETUP_KEY, "true");
    }
    const postSkipDestination = isManagerDestination && individualDestination === "/manager"
      ? "/manager?onboarding=skipped"
      : individualDestination;
    navigate(postSkipDestination);
  };
  useEffect(() => {
    if (mode === "success") {
      const destination = returnToParam ?? "/home";
      const t = setTimeout(() => navigate(destination), 2200);
      return () => clearTimeout(t);
    }
  }, [mode, navigate, returnToParam]);

  const firstName = user?.name?.split(" ")[0] ?? "Leader";

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes successPop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes sparkleIn {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes progressFill {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fieldShake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-4px); }
          40%      { transform: translateX(4px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }
        .field-error { animation: fieldShake 0.35s ease; }
      `}</style>

      <div className="min-h-screen flex" style={{ background: "var(--color-ln-ivory)" }}>

        {/* ── Left panel ──────────────────────────────────────────────────── */}
        <div
          className="hidden lg:flex flex-col justify-between w-[42%] min-h-screen p-12"
          style={{ background: "var(--color-ln-navy)" }}
        >
          <div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-bold tracking-tight text-white">LevelNext</span>
              <span className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>
                The Leadership Intelligence Platform
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Build your<br />
              <span style={{ color: "var(--color-ln-yellow)" }}>Leadership Edge</span><br />
              across every dimension.
            </h2>
            <p className="text-white/60 text-sm mb-10 leading-relaxed max-w-xs">
              LevelNext unifies your leadership intelligence across three diagnostics into a single, evolving Edge profile — personalised to you.
            </p>
            <div className="space-y-4">
              {PLATFORM_PILLARS.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-ln-yellow)" }} />
                  <div>
                    <p className="text-sm font-semibold text-white">{p.label}</p>
                    <p className="text-xs text-white/50 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Meta Results Pvt. Ltd.</p>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-ln-navy)" }}>LevelNext</span>
            <p className="text-xs font-medium tracking-wide mt-0.5" style={{ color: "var(--color-ln-yellow)" }}>
              The Leadership Intelligence Platform
            </p>
          </div>

          <div className="w-full max-w-md">

            {/* Step indicator (shown in create/join modes) */}
            <StepIndicator mode={mode} />

            {/* ── SUCCESS ─────────────────────────────────────────────────── */}
            {mode === "success" && <SuccessScreen orgName={successOrgName} />}

            {/* ── TOUR ────────────────────────────────────────────────────── */}
            {mode === "tour" && (
              <PlatformTour
                firstName={firstName}
                onFinish={() => setMode("choose")}
              />
            )}

            {/* ── CHOOSE ──────────────────────────────────────────────────── */}
            {mode === "choose" && (
              <div className="animate-fade-in">
                <div className="mb-8">
                  {/* Welcome banner */}
                  <div
                    className="rounded-2xl p-5 mb-6"
                    style={{ background: "var(--color-ln-navy)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>
                      Welcome to LevelNext
                    </p>
                    <h1 className="text-xl font-bold text-white mb-2">
                      Hi {firstName} — great to have you here.
                    </h1>
                    <p className="text-sm text-white/70 leading-relaxed mb-4">
                      LevelNext is your Leadership Intelligence Platform. It combines precision diagnostics, daily AI coaching, practice simulations, and a career intelligence journey into one evolving profile.
                    </p>
                    <button
                      onClick={() => setMode("tour")}
                      className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                      style={{ color: "var(--color-ln-yellow)" }}
                    >
                      <Sparkles size={14} /> Take a 2-minute platform tour →
                    </button>
                  </div>

                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>
                    First, set up your workspace:
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setMode("create")}
                    className="w-full rounded-2xl p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
                    style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-ln-navy)" }}>
                        <Building2 size={20} style={{ color: "var(--color-ln-yellow)" }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Create an Organisation</p>
                        <p className="text-sm mt-0.5" style={{ color: "var(--color-ln-muted)" }}>Set up LevelNext for your team or company</p>
                      </div>
                      <ArrowRight size={16} className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--color-ln-muted)" }} />
                    </div>
                  </button>

                  <button
                    onClick={() => setMode("join")}
                    className="w-full rounded-2xl p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
                    style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "oklch(95% 0.02 248.6)" }}>
                        <Users size={20} style={{ color: "var(--color-ln-navy)" }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Join an Organisation</p>
                        <p className="text-sm mt-0.5" style={{ color: "var(--color-ln-muted)" }}>Use an invite code from your organisation admin</p>
                      </div>
                      <ArrowRight size={16} className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--color-ln-muted)" }} />
                    </div>
                  </button>
                </div>

                {/* Testers and individual users can defer organisation setup. */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleIndividualSkip}
                  className="mt-5 h-auto w-full flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-3 text-center transition-colors hover:bg-slate-50 active:scale-[0.99]"
                  style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-muted)", background: "transparent" }}
                >
                  <span className="text-sm font-medium">Skip for now</span>
                  <span className="text-[11px] font-normal" style={{ color: "var(--color-ln-muted)" }}>
                    Explore {individualProductName} first. You can set up an organisation later.
                  </span>
                </Button>

                <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--color-ln-border)" }}>
                  <p className="text-xs text-center" style={{ color: "var(--color-ln-muted)" }}>
                    Your data is private and never shared without your consent.
                  </p>
                </div>
              </div>
            )}

            {/* ── CREATE ──────────────────────────────────────────────────── */}
            {mode === "create" && (
              <div className="animate-fade-in">
                <button onClick={() => setMode("choose")}
                  className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-70"
                  style={{ color: "var(--color-ln-muted)" }}>
                  <ChevronLeft size={15} /> Back
                </button>

                <div className="mb-7">
                  <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>Create your Organisation</h1>
                  <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                    This sets up your LevelNext workspace. You can invite team members after setup.
                  </p>
                </div>

                <div className="rounded-2xl p-6 space-y-5"
                  style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}>

                  {/* Organisation name */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      Organisation Name <span style={{ color: "#e53e3e" }}>*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={orgName}
                        onChange={(e) => { setOrgName(e.target.value); if (!orgNameTouched) setOrgNameTouched(true); }}
                        onBlur={() => setOrgNameTouched(true)}
                        placeholder="e.g. Broadridge India GCC"
                        className={`h-10 pr-9 transition-colors ${orgNameError ? "field-error" : ""}`}
                        style={{
                          borderColor: orgNameError ? "#e53e3e" : orgName.trim() && !orgNameError ? "oklch(60% 0.15 150)" : "var(--color-ln-border)",
                        }}
                      />
                      {/* Inline status icon */}
                      {orgNameTouched && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {orgNameError
                            ? <AlertCircle size={15} style={{ color: "#e53e3e" }} />
                            : <Check size={15} style={{ color: "oklch(50% 0.15 150)" }} />
                          }
                        </div>
                      )}
                    </div>
                    {orgNameError && (
                      <p className="text-xs flex items-center gap-1" style={{ color: "#e53e3e" }}>
                        <AlertCircle size={11} /> {orgNameError}
                      </p>
                    )}
                    {/* Character count */}
                    {orgName.length > 80 && (
                      <p className="text-xs text-right" style={{ color: orgName.length > 120 ? "#e53e3e" : "var(--color-ln-muted)" }}>
                        {orgName.length}/120
                      </p>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      Industry{" "}
                      <span className="text-xs font-normal" style={{ color: "var(--color-ln-muted)" }}>(optional)</span>
                    </Label>
                    <Input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Financial Services, Technology"
                      className="h-10"
                      style={{ borderColor: "var(--color-ln-border)" }}
                    />
                  </div>

                  {/* Team size */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      Team Size{" "}
                      <span className="text-xs font-normal" style={{ color: "var(--color-ln-muted)" }}>(optional)</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["1–10", "11–50", "51–200", "201–500", "501–1000", "1001–5000", "5001–10,000", "10001+"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(size === s ? "" : s)}
                          className="h-9 rounded-lg text-sm font-medium transition-all duration-100 hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: size === s ? "var(--color-ln-navy)" : "oklch(97% 0.005 248.6)",
                            color: size === s ? "white" : "var(--color-ln-navy)",
                            border: size === s ? "1.5px solid var(--color-ln-navy)" : "1.5px solid var(--color-ln-border)",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setOrgNameTouched(true);
                      if (!createValid) return;
                      createTenant.mutate({ name: orgName, industry: industry || undefined, size: size || undefined });
                    }}
                    disabled={createTenant.isPending}
                    className="w-full h-11 font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: createValid ? "var(--color-ln-navy)" : "oklch(85% 0.01 248.6)",
                      color: createValid ? "white" : "var(--color-ln-muted)",
                      cursor: createValid ? "pointer" : "default",
                    }}
                  >
                    {createTenant.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Organisation <ArrowRight size={15} />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ── JOIN ────────────────────────────────────────────────────── */}
            {mode === "join" && (
              <div className="animate-fade-in">
                <button onClick={() => setMode("choose")}
                  className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-70"
                  style={{ color: "var(--color-ln-muted)" }}>
                  <ChevronLeft size={15} /> Back
                </button>

                <div className="mb-7">
                  <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>Join your Organisation</h1>
                  <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                    Enter the invite code shared by your organisation admin to connect your account.
                  </p>
                </div>

                <div className="rounded-2xl p-6 space-y-5"
                  style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}>

                  {/* Invite code */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                      Invite Code <span style={{ color: "#e53e3e" }}>*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={inviteCode}
                        onChange={(e) => {
                          setInviteCode(e.target.value.toUpperCase());
                          if (!inviteCodeTouched) setInviteCodeTouched(true);
                        }}
                        onBlur={() => setInviteCodeTouched(true)}
                        placeholder="e.g. ABCD-1234-EFGH"
                        maxLength={16}
                        className={`h-10 font-mono tracking-widest text-center text-base pr-9 transition-colors ${inviteCodeError ? "field-error" : ""}`}
                        style={{
                          borderColor: inviteCodeError ? "#e53e3e" : inviteCode.trim() && !inviteCodeError ? "oklch(60% 0.15 150)" : "var(--color-ln-border)",
                        }}
                      />
                      {inviteCodeTouched && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {inviteCodeError
                            ? <AlertCircle size={15} style={{ color: "#e53e3e" }} />
                            : <Check size={15} style={{ color: "oklch(50% 0.15 150)" }} />
                          }
                        </div>
                      )}
                    </div>
                    {inviteCodeError && (
                      <p className="text-xs flex items-center gap-1" style={{ color: "#e53e3e" }}>
                        <AlertCircle size={11} /> {inviteCodeError}
                      </p>
                    )}
                    {!inviteCodeError && (
                      <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                        Ask your organisation admin for the invite code.
                      </p>
                    )}
                  </div>

                  {/* What happens next */}
                  <div className="rounded-xl p-4 space-y-2"
                    style={{ background: "oklch(97% 0.005 248.6)", border: "1px solid var(--color-ln-border)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                      What happens next
                    </p>
                    {[
                      "Your account is linked to the organisation",
                      "You can begin your first diagnostic immediately",
                      "Your Edge profile is private to you",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-ln-navy)" }} />
                        <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{step}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      setInviteCodeTouched(true);
                      if (!joinValid) return;
                      joinTenant.mutate({ inviteCode });
                    }}
                    disabled={joinTenant.isPending}
                    className="w-full h-11 font-semibold text-sm transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                    style={{
                      background: joinValid ? "var(--color-ln-navy)" : "oklch(85% 0.01 248.6)",
                      color: joinValid ? "white" : "var(--color-ln-muted)",
                      cursor: joinValid ? "pointer" : "default",
                    }}
                  >
                    {joinTenant.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Joining…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Join Organisation <ArrowRight size={15} />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
