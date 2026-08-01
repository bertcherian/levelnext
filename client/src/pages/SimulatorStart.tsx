import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Zap, ArrowRight, Loader2, ChevronRight, Target, Clock, BarChart2, User } from "lucide-react";

type Platform = "leadership" | "manager" | "career" | "young";

const PLATFORM_META: Record<Platform, { label: string; color: string; accent: string; chips: string[] }> = {
  leadership: {
    label: "Leadership Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    chips: [
      "Influencing a sceptical board member",
      "Delivering difficult feedback to a peer",
      "Navigating a politically charged decision",
      "Presenting a strategy under pressure",
      "Managing a high-performing but difficult team member",
    ],
  },
  manager: {
    label: "Manager Effectiveness",
    color: "#1a3a2a",
    accent: "#4ade80",
    chips: [
      "Accountability conversation with an underperformer",
      "Managing up on a priority conflict",
      "Cross-team conflict with another manager",
      "Giving feedback to a defensive team member",
      "Asking for resources from my VP",
    ],
  },
  career: {
    label: "Career Transition Intelligence",
    color: "#0A1A2F",
    accent: "#D4AF37",
    chips: [
      "Salary negotiation with a new employer",
      "Explaining a career gap confidently",
      "Pitching myself for a role in a new industry",
      "Asking for a promotion",
      "Stakeholder influence as a new hire",
    ],
  },
  young: {
    label: "Young Talent Platform",
    color: "#1a1a3a",
    accent: "#818cf8",
    chips: [
      "My first performance review conversation",
      "Asking my manager for feedback",
      "Presenting an idea to senior leadership",
      "Handling a conflict with a peer",
      "Asking for a stretch assignment",
    ],
  },
};

interface ScenarioCard {
  conversationType: string;
  stakeholder: string;
  objective: string;
  expectedChallenge: string;
  difficulty: number;
  estimatedMinutes: number;
  characterName: string;
  characterStyle: string;
  followUpQuestion: string | null;
}

export default function SimulatorStart() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  

  // Detect platform from URL
  const path = window.location.pathname;
  const platform: Platform = path.includes("/manager") ? "manager"
    : path.includes("/career") ? "career"
    : path.includes("/young") ? "young"
    : "leadership";

  const meta = PLATFORM_META[platform];
  const [prompt, setPrompt] = useState("");
  const [scenario, setScenario] = useState<ScenarioCard | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [adjustedDifficulty, setAdjustedDifficulty] = useState<number | null>(null);

  const inferMutation = trpc.simulator.inferScenario.useMutation({
    onSuccess: (data) => setScenario(data),
  });

  const startMutation = trpc.simulator.startSession.useMutation({
    onSuccess: (data) => navigate(`/simulator/${data.sessionId}`),
    onError: (err) => {
      console.error("[SimulatorStart] startSession error:", err.message);
    },
  });

  const handleInfer = (text: string) => {
    if (!text.trim()) return;
    setScenario(null);
    inferMutation.mutate({ prompt: text, platform });
  };

  const handleStart = () => {
    if (!scenario) return;
    const finalPrompt = scenario.followUpQuestion && followUpAnswer
      ? `${prompt}. ${followUpAnswer}`
      : prompt;
    const effectiveDifficulty = adjustedDifficulty ?? scenario.difficulty;
    startMutation.mutate({
      platform,
      userPrompt: finalPrompt,
      conversationType: scenario.conversationType,
      stakeholder: scenario.stakeholder,
      objective: scenario.objective,
      expectedChallenge: scenario.expectedChallenge,
      difficulty: effectiveDifficulty,
      estimatedMinutes: scenario.estimatedMinutes,
      characterName: scenario.characterName,
      characterStyle: scenario.characterStyle,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: meta.color }}>
        <div className="text-center text-white p-8">
          <Mic className="w-12 h-12 mx-auto mb-4" style={{ color: meta.accent }} />
          <h2 className="text-2xl font-bold mb-2">Practice Simulator</h2>
          <p className="text-white/70 mb-6">Sign in to start your practice session</p>
          <Button onClick={() => window.location.href = "/login?returnTo=%2Fhome"} style={{ background: meta.accent, color: meta.color }}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: meta.color }}>
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1 as any)} className="text-white/60 hover:text-white text-sm">
            ← Back
          </button>
          <span className="text-white/30">|</span>
          <span className="text-white/80 text-sm">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" style={{ color: meta.accent }} />
          <span className="text-white font-semibold text-sm">Practice Simulator</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 border"
            style={{ borderColor: meta.accent + "40", color: meta.accent, background: meta.accent + "10" }}>
            <Zap className="w-3 h-3" />
            AI-Powered Practice
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            What conversation do you want to practise?
          </h1>
          <p className="text-white/60 text-base">
            Describe the situation in your own words — the AI will build a realistic scenario and character for you.
          </p>
        </div>

        {/* Prompt Input */}
        <div className="mb-5">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I need to have a difficult conversation with my manager about being passed over for a promotion..."
            className="w-full min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleInfer(prompt);
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-white/30 text-xs">Cmd+Enter to generate</span>
            <Button
              onClick={() => handleInfer(prompt)}
              disabled={!prompt.trim() || inferMutation.isPending}
              className="font-semibold"
              style={{ background: meta.accent, color: meta.color }}
            >
              {inferMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building scenario...</>
              ) : (
                <>Build My Scenario <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Quick-start chips */}
        {!scenario && !inferMutation.isPending && (
          <div className="mb-8">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Or pick a common scenario</p>
            <div className="flex flex-wrap gap-2">
              {meta.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setPrompt(chip); handleInfer(chip); }}
                  className="px-3 py-2 rounded-lg text-sm border text-white/70 hover:text-white transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {inferMutation.isPending && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: meta.accent }} />
            <p className="text-white/60">Designing your scenario...</p>
          </div>
        )}

        {/* Scenario Summary Card */}
        {scenario && !inferMutation.isPending && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: meta.accent + "40", background: "rgba(255,255,255,0.04)" }}>
            {/* Card header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: meta.accent + "20", background: meta.accent + "10" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: meta.accent }}>Your Scenario</p>
                  <h2 className="text-white font-bold text-xl">{scenario.conversationType}</h2>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Difficulty</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const d = adjustedDifficulty ?? scenario.difficulty;
                      const active = i < d;
                      return (
                        <button
                          key={i}
                          onClick={() => setAdjustedDifficulty(i + 1)}
                          title={`Set difficulty ${i + 1}`}
                          className="w-4 h-4 rounded-full transition-all duration-150 hover:scale-125"
                          style={{
                            background: active ? meta.accent : "rgba(255,255,255,0.15)",
                            boxShadow: active ? `0 0 5px ${meta.accent}70` : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">
                    {(["Warm-up","Moderate","Challenging","Tough","Intense"])[(adjustedDifficulty ?? scenario.difficulty) - 1]} · {adjustedDifficulty ?? scenario.difficulty}/5
                  </p>
                  {adjustedDifficulty !== null && adjustedDifficulty !== scenario.difficulty && (
                    <button
                      onClick={() => setAdjustedDifficulty(null)}
                      className="text-white/30 hover:text-white/60 text-[10px] mt-0.5 transition-colors block text-right"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">You're speaking with</p>
                    <p className="text-white text-sm font-medium">{scenario.stakeholder}</p>
                    <p className="text-white/50 text-xs mt-0.5">Played by {scenario.characterName} · {scenario.characterStyle}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Estimated time</p>
                    <p className="text-white text-sm font-medium">{scenario.estimatedMinutes} minutes</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Target className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Your objective</p>
                  <p className="text-white text-sm">{scenario.objective}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: meta.accent }} />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Expect this challenge</p>
                  <p className="text-white/80 text-sm">{scenario.expectedChallenge}</p>
                </div>
              </div>

              {/* Follow-up question if needed */}
              {scenario.followUpQuestion && (
                <div className="rounded-xl p-4 border" style={{ borderColor: meta.accent + "30", background: meta.accent + "08" }}>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: meta.accent }}>One quick question</p>
                  <p className="text-white text-sm mb-3">{scenario.followUpQuestion}</p>
                  <input
                    type="text"
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>
              )}
            </div>

            {/* Card footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: meta.accent + "20" }}>
              <button
                onClick={() => { setScenario(null); setPrompt(""); }}
                className="text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                ← Try a different scenario
              </button>
              <Button
                onClick={handleStart}
                disabled={startMutation.isPending || (!!scenario.followUpQuestion && !followUpAnswer.trim())}
                size="lg"
                className="font-bold px-8"
                style={{ background: meta.accent, color: meta.color }}
              >
                {startMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>
                ) : (
                  <>Start Practice <ChevronRight className="w-5 h-5 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Errors */}
        {inferMutation.isError && (
          <div className="text-center py-4 text-red-400 text-sm">
            Could not generate scenario. Please try again or rephrase your description.
          </div>
        )}
        {startMutation.isError && (
          <div className="text-center py-4 text-red-400 text-sm">
            Could not start session — please try again.
          </div>
        )}
      </div>
    </div>
  );
}
