import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Rocket, Sparkles, Zap } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

interface OnboardingData {
  goal: string;
  targetRole: string;
  industry: string;
  experienceLevel: string;
}

// ─── Step Data ────────────────────────────────────────────────────────────────
const GOALS = [
  { id: "first_job", emoji: "🎯", label: "Land my first job", color: "#3B82F6" },
  { id: "switch_role", emoji: "⚡", label: "Switch to a new role", color: "#8B5CF6" },
  { id: "new_industry", emoji: "🌍", label: "Move to a new industry", color: "#10B981" },
  { id: "get_promoted", emoji: "🚀", label: "Get promoted faster", color: "#F59E0B" },
  { id: "freelance", emoji: "💼", label: "Go freelance / consulting", color: "#EF4444" },
  { id: "startup", emoji: "🦄", label: "Join or start a startup", color: "#EC4899" },
];

const ROLES = [
  { id: "software_engineer", emoji: "💻", label: "Software Engineer" },
  { id: "product_manager", emoji: "📊", label: "Product Manager" },
  { id: "data_analyst", emoji: "📈", label: "Data Analyst / Scientist" },
  { id: "designer", emoji: "🎨", label: "UX / Product Designer" },
  { id: "marketing", emoji: "📣", label: "Marketing & Growth" },
  { id: "sales", emoji: "🤝", label: "Sales & Business Dev" },
  { id: "finance", emoji: "💰", label: "Finance & Accounting" },
  { id: "operations", emoji: "⚙️", label: "Operations & Strategy" },
  { id: "hr_people", emoji: "👥", label: "HR & People Ops" },
  { id: "consulting", emoji: "🧠", label: "Consulting & Advisory" },
  { id: "other", emoji: "✨", label: "Something else" },
];

const INDUSTRIES = [
  { id: "tech", emoji: "💻", label: "Tech & Software" },
  { id: "fintech", emoji: "🏦", label: "Fintech & Banking" },
  { id: "healthcare", emoji: "🏥", label: "Healthcare & Pharma" },
  { id: "ecommerce", emoji: "🛒", label: "E-commerce & Retail" },
  { id: "consulting", emoji: "🧩", label: "Consulting & Services" },
  { id: "media", emoji: "🎬", label: "Media & Entertainment" },
  { id: "manufacturing", emoji: "🏭", label: "Manufacturing & Infra" },
  { id: "education", emoji: "📚", label: "Education & EdTech" },
  { id: "startup", emoji: "🚀", label: "Early-stage Startup" },
  { id: "other", emoji: "🌐", label: "Other" },
];

const EXPERIENCE_LEVELS = [
  { id: "student", emoji: "🎓", label: "Still studying", sub: "Final year or recent grad" },
  { id: "0_1", emoji: "🌱", label: "0–1 year", sub: "Just starting out" },
  { id: "1_3", emoji: "📈", label: "1–3 years", sub: "Building momentum" },
  { id: "3_5", emoji: "⚡", label: "3–5 years", sub: "Ready to accelerate" },
];

// ─── Animated Background ──────────────────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="launch-onboarding-bg fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="launch-onboarding-bg__base absolute inset-0" style={{
        background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 40%, #0A1628 70%, #060D1A 100%)"
      }} />
      {/* Glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)", filter: "blur(60px)" }} />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Your Goal" },
    { n: 2, label: "Target Role" },
    { n: 3, label: "Industry" },
    { n: 4, label: "Experience" },
  ];
  return (
    <div className="launch-app-progress flex items-center gap-0 mb-10" aria-label={`Onboarding step ${step} of 4`}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center">
            <div
              className="launch-app-progress__step w-8 h-8 flex items-center justify-center text-xs font-bold transition-all duration-300"
              data-state={step > s.n ? "complete" : step === s.n ? "current" : "upcoming"}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span className="launch-app-progress__label text-[9px] mt-1 font-medium" data-active={step >= s.n}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="launch-app-progress__line flex-1 h-[2px] mx-2 mb-4 transition-all duration-500" data-complete={step > s.n} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Selection Card ───────────────────────────────────────────────────────────
function SelectCard({
  emoji, label, sub, isSelected, onClick, accentColor
}: {
  emoji: string; label: string; sub?: string; isSelected: boolean; onClick: () => void; accentColor?: string;
}) {
  const color = accentColor || "#3B82F6";
  return (
    <button
      onClick={onClick}
      className="launch-app-select-card w-full text-left p-4 transition-all duration-200 relative overflow-hidden"
      data-selected={isSelected}
      aria-pressed={isSelected}
      style={{
        ["--launch-choice" as string]: color,
      } as React.CSSProperties}>
      {isSelected && (
        <div className="launch-app-select-card__check absolute top-2 right-2 w-5 h-5 flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">✓</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-sm font-semibold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{label}</p>
          {sub && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</p>}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LaunchOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    goal: "",
    targetRole: "",
    industry: "",
    experienceLevel: "",
  });
  const [saving, setSaving] = useState(false);

  const completeOnboardingMutation = trpc.launchProgress.completeOnboarding.useMutation();

  const canNext = () => {
    if (step === 1) return !!data.goal;
    if (step === 2) return !!data.targetRole;
    if (step === 3) return !!data.industry;
    if (step === 4) return !!data.experienceLevel;
    return false;
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleFinish = async () => {
    if (!canNext()) return;
    setSaving(true);
    try {
      // Map experience level to the enum values the server expects
      const expMap: Record<string, "fresher" | "1-2y" | "3-5y"> = {
        student: "fresher",
        "0_1": "fresher",
        "1_3": "1-2y",
        "3_5": "3-5y",
      };
      await completeOnboardingMutation.mutateAsync({
        targetRole: data.targetRole,
        targetIndustry: data.industry,
        experienceLevel: expMap[data.experienceLevel] ?? "fresher",
      });
      navigate("/launch/home");
    } catch {
      toast.error("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="launch-dark launch-brutal-app launch-brutal-app--onboarding min-h-screen relative" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <AnimatedBg />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="launch-app-onboarding-header text-center mb-8">
          {/* LevelNext Logo */}
          <div className="flex justify-center mb-5">
            <span className="launch-app-onboarding-logo">
              <img
                src="/manus-storage/LevelNext_logo_transparent_c21f58d5.png"
                alt="LevelNext"
                style={{ height: "72px", width: "auto", objectFit: "contain" }}
              />
            </span>
          </div>
          <div className="launch-app-kicker inline-flex items-center gap-2 px-4 py-2 mb-4">
            <Rocket size={14} />
            <span className="text-xs font-semibold">Launch Intelligence</span>
          </div>
          <h1 className="text-3xl font-black mb-2">
            {step === 1 && "What's your mission?"}
            {step === 2 && "Where are you headed?"}
            {step === 3 && "Pick your arena."}
            {step === 4 && "Where are you right now?"}
          </h1>
          <p className="launch-app-onboarding-header__lede text-sm">
            {step === 1 && "This shapes your entire Launch journey."}
            {step === 2 && "We'll tailor your missions to your target role."}
            {step === 3 && "Industry context sharpens your coaching."}
            {step === 4 && "Honest answer = better plan."}
          </p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-md">
          <ProgressBar step={step} />
        </div>

        {/* Card */}
        <div className="launch-app-onboarding-card w-full max-w-md p-6">

          {/* Step 1: Goal */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <SelectCard
                  key={g.id}
                  emoji={g.emoji}
                  label={g.label}
                  isSelected={data.goal === g.id}
                  onClick={() => setData({ ...data, goal: g.id })}
                  accentColor={g.color}
                />
              ))}
            </div>
          )}

          {/* Step 2: Target Role */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(59,130,246,0.3) transparent" }}>
              {ROLES.map((r) => (
                <SelectCard
                  key={r.id}
                  emoji={r.emoji}
                  label={r.label}
                  isSelected={data.targetRole === r.id}
                  onClick={() => setData({ ...data, targetRole: r.id })}
                  accentColor="#3B82F6"
                />
              ))}
            </div>
          )}

          {/* Step 3: Industry */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {INDUSTRIES.map((ind) => (
                <SelectCard
                  key={ind.id}
                  emoji={ind.emoji}
                  label={ind.label}
                  isSelected={data.industry === ind.id}
                  onClick={() => setData({ ...data, industry: ind.id })}
                  accentColor="#10B981"
                />
              ))}
            </div>
          )}

          {/* Step 4: Experience */}
          {step === 4 && (
            <div className="grid grid-cols-1 gap-3">
              {EXPERIENCE_LEVELS.map((e) => (
                <SelectCard
                  key={e.id}
                  emoji={e.emoji}
                  label={e.label}
                  sub={e.sub}
                  isSelected={data.experienceLevel === e.id}
                  onClick={() => setData({ ...data, experienceLevel: e.id })}
                  accentColor="#F59E0B"
                />
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="launch-app-onboarding-actions flex items-center justify-between mt-6 pt-4">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="launch-app-button launch-app-button--secondary flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150">
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canNext()}
                className="launch-app-button flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-200">
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canNext() || saving}
                className="launch-app-button launch-app-button--finish flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-200">
                {saving ? (
                  <><Sparkles size={14} className="animate-spin" /> Launching…</>
                ) : (
                  <><Zap size={14} /> Start My Journey</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="launch-app-onboarding-footer text-[11px] mt-6 text-center">
          You can update these anytime in your profile settings
        </p>
      </div>
    </div>
  );
}
