import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Rocket, ChevronRight, ChevronLeft, Check } from "lucide-react";

const ROLES = [
  "Software Engineer", "Product Manager", "Data Analyst", "UX Designer",
  "Marketing Manager", "Business Analyst", "Financial Analyst", "HR Specialist",
  "Sales Executive", "Operations Manager", "Consultant", "Other",
];

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Consulting",
  "E-commerce / Retail", "Media & Entertainment", "Manufacturing",
  "Education", "Government / Public Sector", "Startup / Entrepreneurship", "Other",
];

const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Student / Fresher", desc: "Currently studying or just graduated" },
  { value: "1-2y", label: "Early Career (1–2 yrs)", desc: "Just starting my career" },
  { value: "3-5y", label: "Growing (3–5 yrs)", desc: "Building my foundation" },
];

const GOALS = [
  { value: "first_job", label: "Land my first job", icon: "🎯" },
  { value: "switch_role", label: "Switch to a new role", icon: "🔄" },
  { value: "switch_industry", label: "Move to a new industry", icon: "🌐" },
  { value: "promotion", label: "Get promoted faster", icon: "📈" },
  { value: "freelance", label: "Go freelance / consulting", icon: "💼" },
  { value: "startup", label: "Join or start a startup", icon: "🚀" },
];

const STEPS = ["Your Goal", "Target Role", "Experience", "Ready!"];

export default function LaunchOnboarding() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<{
    primaryGoal: string;
    targetRole: string;
    targetIndustry: string;
    experienceLevel: "fresher" | "1-2y" | "3-5y";
  }>({
    primaryGoal: "",
    targetRole: "",
    targetIndustry: "",
    experienceLevel: "fresher",
  });
  const [customRole, setCustomRole] = useState("");

  const completeOnboarding = trpc.launchProgress.completeOnboarding.useMutation({
    onSuccess: () => navigate("/launch/home"),
  });

  const canNext = () => {
    if (step === 0) return !!form.primaryGoal;
    if (step === 1) return !!(form.targetRole || customRole) && !!form.targetIndustry;
    if (step === 2) return !!form.experienceLevel;
    return true;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      completeOnboarding.mutate({
        targetRole: form.targetRole === "Other" ? customRole : form.targetRole,
        targetIndustry: form.targetIndustry,
        experienceLevel: form.experienceLevel,
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "var(--li-bg)", fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 font-bold text-xl" style={{ color: "var(--li-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Rocket size={24} />
        Launch Intelligence
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: i < step ? "var(--li-success)" : i === step ? "var(--li-primary)" : "var(--li-border)",
                  color: i <= step ? "white" : "var(--li-text-muted)",
                }}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: i === step ? "var(--li-primary)" : "var(--li-text-muted)" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-0.5 mb-4" style={{ background: i < step ? "var(--li-success)" : "var(--li-border)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-fade-in"
        style={{ background: "white", border: "1.5px solid var(--li-border)", boxShadow: "0 4px 24px rgba(26,111,212,0.08)" }}
      >
        {/* Step 0: Goal */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
              What's your primary goal right now?
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--li-text-muted)" }}>
              This helps us personalise your daily missions.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setForm({ ...form, primaryGoal: value })}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: form.primaryGoal === value ? "var(--li-primary-soft)" : "var(--li-bg)",
                    border: `1.5px solid ${form.primaryGoal === value ? "var(--li-primary)" : "var(--li-border)"}`,
                  }}
                >
                  <span className="text-lg">{icon}</span>
                  <p className="text-xs font-semibold mt-1" style={{ color: form.primaryGoal === value ? "var(--li-primary)" : "var(--li-text)" }}>
                    {label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Target Role + Industry */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
              What role are you aiming for?
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--li-text-muted)" }}>
              Your missions will be tailored to this role.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setForm({ ...form, targetRole: role })}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: form.targetRole === role ? "var(--li-primary)" : "var(--li-primary-soft)",
                    color: form.targetRole === role ? "white" : "var(--li-primary)",
                    border: `1px solid ${form.targetRole === role ? "var(--li-primary)" : "var(--li-border)"}`,
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
            {form.targetRole === "Other" && (
              <input
                type="text"
                placeholder="Type your target role..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm mb-4"
                style={{ border: "1.5px solid var(--li-border)", outline: "none", color: "var(--li-text)" }}
              />
            )}
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--li-text)" }}>
              Target industry
            </p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setForm({ ...form, targetIndustry: ind })}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: form.targetIndustry === ind ? "var(--li-accent)" : "var(--li-accent-soft)",
                    color: form.targetIndustry === ind ? "white" : "var(--li-accent)",
                    border: `1px solid ${form.targetIndustry === ind ? "var(--li-accent)" : "var(--li-border)"}`,
                  }}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Experience Level */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
              Where are you in your career?
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--li-text-muted)" }}>
              This calibrates the difficulty of your missions.
            </p>
            <div className="flex flex-col gap-3">
              {EXPERIENCE_LEVELS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setForm({ ...form, experienceLevel: value as "fresher" | "1-2y" | "3-5y" })}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    background: form.experienceLevel === value ? "var(--li-primary-soft)" : "var(--li-bg)",
                    border: `1.5px solid ${form.experienceLevel === value ? "var(--li-primary)" : "var(--li-border)"}`,
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: form.experienceLevel === value ? "var(--li-primary)" : "var(--li-text)" }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--li-text-muted)" }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
              You're all set!
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--li-text-muted)" }}>
              Your personalised career launch missions are ready. Complete 3 missions a day to build unstoppable momentum.
            </p>
            <div className="flex flex-col gap-2 text-sm text-left rounded-xl p-4 mb-4" style={{ background: "var(--li-primary-soft)", border: "1.5px solid #BDD8F5" }}>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--li-primary)" }}>🎯</span>
                <span style={{ color: "var(--li-text)" }}>Target: <strong>{form.targetRole === "Other" ? customRole : form.targetRole}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--li-primary)" }}>🏭</span>
                <span style={{ color: "var(--li-text)" }}>Industry: <strong>{form.targetIndustry}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--li-primary)" }}>📊</span>
                <span style={{ color: "var(--li-text)" }}>Level: <strong>{EXPERIENCE_LEVELS.find(e => e.value === form.experienceLevel)?.label}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: "transparent",
              color: step === 0 ? "var(--li-border)" : "var(--li-text-muted)",
              border: `1.5px solid ${step === 0 ? "var(--li-border)" : "var(--li-border)"}`,
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext() || completeOnboarding.isPending}
            className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: canNext() ? "var(--li-primary)" : "var(--li-border)",
              color: canNext() ? "white" : "var(--li-text-muted)",
            }}
          >
            {step === 3 ? (completeOnboarding.isPending ? "Setting up..." : "Launch! 🚀") : "Next"}
            {step < 3 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
