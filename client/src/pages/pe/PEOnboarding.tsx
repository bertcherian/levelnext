import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ChevronRight, Briefcase, Target, Clock, Building2, Mic2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  "Individual Contributor", "Senior Professional", "Team Lead", "Manager",
  "Senior Manager", "Director", "Senior Director", "VP / SVP",
  "C-Suite", "Entrepreneur / Founder",
];

const GOALS = [
  "Accelerate career growth", "Improve communication impact", "Build executive presence",
  "Strengthen strategic thinking", "Enhance relationship building", "Navigate a transition",
  "Prepare for a promotion", "Build a personal brand", "Improve work-life effectiveness",
];

const FOCUS_AREAS = [
  "Strategic Clarity", "Execution Discipline", "Communication Impact",
  "Relationship Intelligence", "Adaptive Thinking", "Leadership Presence",
];

const DEPARTMENTS = [
  "Engineering / Technology", "Product", "Sales", "Marketing",
  "Finance", "HR / People", "Operations", "Strategy",
  "Consulting", "Other",
];

export default function PEOnboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [department, setDepartment] = useState("");
  const [careerGoals, setCareerGoals] = useState<string[]>([]);
  const [developmentFocus, setDevelopmentFocus] = useState<string[]>([]);
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "sarvam">("openai");

  const upsertProfile = trpc.pei.upsertProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile saved! Welcome to Professional Effectiveness Intelligence.");
      window.location.href = "/pe";
    },
    onError: () => toast.error("Failed to save profile. Please try again."),
  });

  const steps = [
    { title: "Your Current Role", icon: Briefcase },
    { title: "Career Goals", icon: Target },
    { title: "Experience & Department", icon: Building2 },
    { title: "Development Focus", icon: CheckCircle2 },
    { title: "Voice Preference", icon: Mic2 },
  ];

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter((x) => x !== item));
    } else {
      setter([...arr, item]);
    }
  };

  const handleComplete = () => {
    upsertProfile.mutate({
      currentRole,
      targetRole,
      experienceYears: typeof experienceYears === "number" ? experienceYears : undefined,
      department,
      careerGoals,
      developmentFocus,
      voiceProvider,
      onboardingComplete: true,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!currentRole;
      case 1: return careerGoals.length > 0;
      case 2: return !!department && experienceYears !== "";
      case 3: return developmentFocus.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="LevelNext" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            Welcome to Professional Effectiveness Intelligence
          </h1>
          <p className="text-sm mt-2" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Let's set up your profile to personalize your coaching experience.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center flex-1">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                  style={{
                    background: i <= step ? "var(--color-ln-navy)" : "oklch(90% 0.02 248.6)",
                    color: i <= step ? "#d4af37" : "oklch(60% 0.02 248.6)",
                  }}
                >
                  <Icon size={18} />
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-1 transition-all duration-200"
                    style={{ background: i < step ? "var(--color-ln-navy)" : "oklch(90% 0.02 248.6)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>What's your current role?</h2>
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>Select the option that best describes your current position.</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
                    style={{
                      background: currentRole === role ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                      border: currentRole === role ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                      color: currentRole === role ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Target role (optional)</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Director of Product, VP of Engineering"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>What are your career goals?</h2>
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>Select all that apply. This helps us personalize your coaching.</p>
              <div className="space-y-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleArrayItem(careerGoals, goal, setCareerGoals)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
                    style={{
                      background: careerGoals.includes(goal) ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                      border: careerGoals.includes(goal) ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                      color: careerGoals.includes(goal) ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: careerGoals.includes(goal) ? "var(--color-ln-navy)" : "transparent",
                        border: careerGoals.includes(goal) ? "none" : "2px solid oklch(80% 0.02 248.6)",
                      }}
                    >
                      {careerGoals.includes(goal) && <CheckCircle2 size={14} color="#d4af37" />}
                    </div>
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Experience & Department</h2>
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>Help us understand your professional context.</p>
              <div className="mb-4">
                <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Years of professional experience</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="e.g. 10"
                  min={0}
                  max={50}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>Department / Function</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setDepartment(dept)}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
                      style={{
                        background: department === dept ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                        border: department === dept ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                        color: department === dept ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                      }}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>What do you want to develop?</h2>
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>Select 2-4 areas you'd like to focus on. These will guide your coaching and practice.</p>
              <div className="space-y-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      if (developmentFocus.includes(area)) {
                        setDevelopmentFocus(developmentFocus.filter((x) => x !== area));
                      } else if (developmentFocus.length < 4) {
                        setDevelopmentFocus([...developmentFocus, area]);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
                    style={{
                      background: developmentFocus.includes(area) ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                      border: developmentFocus.includes(area) ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                      color: developmentFocus.includes(area) ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: developmentFocus.includes(area) ? "var(--color-ln-navy)" : "transparent",
                        border: developmentFocus.includes(area) ? "none" : "2px solid oklch(80% 0.02 248.6)",
                      }}
                    >
                      {developmentFocus.includes(area) && <CheckCircle2 size={14} color="#d4af37" />}
                    </div>
                    {area}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "oklch(55% 0.02 248.6)" }}>
                Selected: {developmentFocus.length}/4
              </p>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Voice preference</h2>
              <p className="text-sm mb-4" style={{ color: "oklch(50% 0.02 248.6)" }}>Choose your preferred voice provider for audio coaching sessions.</p>
              <div className="space-y-2">
                <button
                  onClick={() => setVoiceProvider("openai")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
                  style={{
                    background: voiceProvider === "openai" ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                    border: voiceProvider === "openai" ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                    color: voiceProvider === "openai" ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                  }}
                >
                  <Mic2 size={18} />
                  <div>
                    <div className="font-semibold">OpenAI TTS</div>
                    <div className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Natural English voices — ideal for international professionals</div>
                  </div>
                </button>
                <button
                  onClick={() => setVoiceProvider("sarvam")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
                  style={{
                    background: voiceProvider === "sarvam" ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                    border: voiceProvider === "sarvam" ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                    color: voiceProvider === "sarvam" ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                  }}
                >
                  <Mic2 size={18} />
                  <div>
                    <div className="font-semibold">Sarvam AI</div>
                    <div className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Indian language support — Hindi, Tamil, Telugu, and more</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "1px solid oklch(90% 0.02 248.6)" }}>
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}
              >
                Continue <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={upsertProfile.isPending}
                style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}
              >
                {upsertProfile.isPending ? "Saving..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
