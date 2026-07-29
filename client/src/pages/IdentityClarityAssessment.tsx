/*
 * Identity Clarity Assessment (ICA)
 *
 * A 15-item Likert instrument measuring 5 dimensions of leadership identity clarity.
 * Administered at baseline (before Module 1) and after each stage boundary.
 *
 * Dimensions:
 *   1. Leadership Identity Clarity (LIC)
 *   2. Future Self Vividness (FSV)
 *   3. Narrative Coherence (NC)
 *   4. Identity-Behaviour Alignment (IBA)
 *   5. Transition Readiness (TR)
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Assessment questions ─────────────────────────────────────────────────────
const DIMENSIONS = [
  { key: "leadershipIdentityClarity", label: "Leadership Identity Clarity", color: "#D4AF37", icon: "🧭" },
  { key: "futureSelfVividness",        label: "Future Self Vividness",        color: "#4A90D9", icon: "🔭" },
  { key: "narrativeCoherence",         label: "Narrative Coherence",          color: "#5BA85A", icon: "📖" },
  { key: "identityBehaviourAlignment", label: "Identity–Behaviour Alignment", color: "#E07B39", icon: "⚡" },
  { key: "transitionReadiness",        label: "Transition Readiness",         color: "#9B59B6", icon: "🚀" },
] as const;

type DimensionKey = typeof DIMENSIONS[number]["key"];

const QUESTIONS: { id: number; dimension: DimensionKey; text: string }[] = [
  // Leadership Identity Clarity
  { id: 1,  dimension: "leadershipIdentityClarity", text: "I have a clear and specific sense of who I am as a leader." },
  { id: 2,  dimension: "leadershipIdentityClarity", text: "I can articulate my leadership identity in a single, compelling sentence." },
  { id: 3,  dimension: "leadershipIdentityClarity", text: "My core values as a leader are well-defined and guide my daily decisions." },
  // Future Self Vividness
  { id: 4,  dimension: "futureSelfVividness",       text: "I have a vivid and specific picture of the leader I want to become in 3 years." },
  { id: 5,  dimension: "futureSelfVividness",       text: "I can describe in detail the role, impact, and influence I want to have in my next chapter." },
  { id: 6,  dimension: "futureSelfVividness",       text: "When I imagine my future leadership self, the image is clear and motivating." },
  // Narrative Coherence
  { id: 7,  dimension: "narrativeCoherence",        text: "My career story makes sense to me — I can see a clear thread connecting where I've been to where I'm going." },
  { id: 8,  dimension: "narrativeCoherence",        text: "I can tell a compelling story about my leadership journey that others find credible and inspiring." },
  { id: 9,  dimension: "narrativeCoherence",        text: "I understand how my past experiences have shaped the leader I am today." },
  // Identity-Behaviour Alignment
  { id: 10, dimension: "identityBehaviourAlignment", text: "My daily behaviours consistently reflect the leader I believe myself to be." },
  { id: 11, dimension: "identityBehaviourAlignment", text: "Others would describe me in a way that matches how I see myself as a leader." },
  { id: 12, dimension: "identityBehaviourAlignment", text: "I rarely feel like I am acting inconsistently with my leadership values." },
  // Transition Readiness
  { id: 13, dimension: "transitionReadiness",       text: "I feel ready to step into a significantly more senior or broader leadership role." },
  { id: 14, dimension: "transitionReadiness",       text: "I have a clear plan for how I will develop myself over the next 12 months." },
  { id: 15, dimension: "transitionReadiness",       text: "I actively take steps to build the identity, capabilities, and relationships my next chapter requires." },
];

const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly Disagree", short: "SD" },
  { value: 2, label: "Disagree",          short: "D"  },
  { value: 3, label: "Neutral",           short: "N"  },
  { value: 4, label: "Agree",             short: "A"  },
  { value: 5, label: "Strongly Agree",    short: "SA" },
];

// ─── Confetti particle ───────────────────────────────────────────────────────
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 8;
  return (
    <div
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 0.6,
        background: color,
        animation: `confettiFall 2.5s ${delay}s ease-in forwards`,
        opacity: 0,
        transform: `rotate(${Math.random() * 360}deg)`,
      }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IdentityClarityAssessment() {
  const [, navigate] = useLocation();
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<Record<DimensionKey, number> | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"in" | "out">("in");
  const [showCelebration, setShowCelebration] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();
  const submitAssessmentMutation = trpc.nextChapter.submitIdentityAssessment.useMutation();

  const question = QUESTIONS[currentQ];
  const progressPct = (currentQ / QUESTIONS.length) * 100;
  const dimension = DIMENSIONS.find((d) => d.key === question?.dimension);

  // Inject confetti keyframe animation once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes confettiFall {
        0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
        100% { opacity: 0; transform: translateY(600px) rotate(720deg); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOutLeft {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(-40px); }
      }
      @keyframes fadeScaleIn {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes pulseGold {
        0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
        50%       { box-shadow: 0 0 0 12px rgba(212,175,55,0); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleAnswer = (value: number) => {
    if (isTransitioning) return;

    const newResponses = { ...responses, [question.id]: value };
    setResponses(newResponses);

    if (currentQ < QUESTIONS.length - 1) {
      // Slide out current, then slide in next
      setIsTransitioning(true);
      setSlideDirection("out");
      setTimeout(() => {
        setCurrentQ((q) => q + 1);
        setSlideDirection("in");
        setTimeout(() => setIsTransitioning(false), 250);
      }, 220);
    } else {
      handleSubmit(newResponses);
    }
  };

  const handleBack = () => {
    if (currentQ === 0 || isTransitioning) return;
    setIsTransitioning(true);
    setSlideDirection("in"); // reverse: slide in from left
    setTimeout(() => {
      setCurrentQ((q) => q - 1);
      setSlideDirection("in");
      setTimeout(() => setIsTransitioning(false), 250);
    }, 220);
  };

  const handleSubmit = (finalResponses: Record<number, number>) => {
    const dimensionScores = {} as Record<DimensionKey, number>;
    for (const dim of DIMENSIONS) {
      const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.key);
      const total = dimQuestions.reduce((sum, q) => sum + (finalResponses[q.id] ?? 3), 0);
      dimensionScores[dim.key] = Math.round((total / dimQuestions.length) * 2);
    }

    setScores(dimensionScores);

    submitAssessmentMutation.mutate(
      { assessmentType: "baseline", scores: dimensionScores },
      {
        onSuccess: () => {
          // Invalidate the assessments cache so NextChapter sees the new baseline immediately
          utils.nextChapter.getIdentityAssessments.invalidate();
          setSubmitted(true);
          setTimeout(() => setShowCelebration(true), 100);
        },
        onError: () => {
          setSubmitted(true);
          setTimeout(() => setShowCelebration(true), 100);
        },
      }
    );
  };

  // ── Celebration / Results screen ─────────────────────────────────────────────
  if (submitted && scores) {
    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length);
    const confettiColors = ["#D4AF37", "#4A90D9", "#5BA85A", "#E07B39", "#9B59B6", "#12345A"];

    return (
      <PlatformLayout>
        <div
          className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
          style={{ background: "var(--color-ln-ivory)" }}
        >
          {/* Confetti */}
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <ConfettiParticle
                  key={i}
                  delay={i * 0.05}
                  color={confettiColors[i % confettiColors.length]}
                />
              ))}
            </div>
          )}

          <div
            className="w-full max-w-2xl"
            style={{ animation: showCelebration ? "fadeScaleIn 0.5s ease-out forwards" : undefined }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "#D4AF3722",
                  border: "2px solid #D4AF37",
                  animation: "pulseGold 2s ease-in-out 3",
                }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: "#D4AF37" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
                Your Baseline Identity Clarity Profile
              </h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                This is your starting point. We'll measure this again after each stage so you can see your identity shift over time.
              </p>
            </div>

            {/* Overall score */}
            <div
              className="rounded-2xl p-6 mb-6 text-center"
              style={{ background: "var(--color-ln-navy)" }}
            >
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Overall Identity Clarity Score</div>
              <div className="text-6xl font-black mb-1" style={{ color: "#D4AF37" }}>
                {overall}
                <span className="text-2xl text-white/30 font-normal">/10</span>
              </div>
              <p className="text-sm text-white/60 mt-2 max-w-sm mx-auto">
                {overall <= 4
                  ? "You're at the beginning of a powerful transformation. The Next Chapter journey was made for this moment."
                  : overall <= 6
                  ? "A solid foundation to build on. The journey ahead will sharpen and deepen your identity clarity."
                  : "Strong clarity to start with. Your Next Chapter will take this to an entirely new level."}
              </p>
            </div>

            {/* Dimension scores */}
            <div className="space-y-3 mb-8">
              {DIMENSIONS.map((dim, idx) => {
                const score = scores[dim.key];
                return (
                  <div
                    key={dim.key}
                    className="bg-white rounded-2xl p-5 shadow-sm"
                    style={{ animation: `fadeScaleIn 0.4s ${0.1 + idx * 0.08}s ease-out both` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{dim.icon}</span>
                        <span className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                          {dim.label}
                        </span>
                      </div>
                      <span className="text-lg font-bold" style={{ color: dim.color }}>
                        {score}<span className="text-xs text-gray-400 font-normal">/10</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${score * 10}%`,
                          background: dim.color,
                          transition: "width 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {score <= 4
                        ? "Significant growth potential — your journey starts here."
                        : score <= 6
                        ? "A foundation exists. The journey will sharpen this further."
                        : "Strong foundation. The journey will deepen and extend this clarity."}
                    </p>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => navigate("/next-chapter")}
              className="w-full h-13 text-sm font-semibold"
              style={{ background: "#D4AF37", color: "var(--color-ln-navy)" }}
            >
              Begin Your Next Chapter Journey
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  // ── Question screen ───────────────────────────────────────────────────────────
  const completedDimensions = new Set(
    QUESTIONS.slice(0, currentQ).map((q) => q.dimension)
  );

  return (
    <PlatformLayout>
      <div
        className="min-h-screen flex flex-col items-center justify-start px-4 pt-8 pb-12"
        style={{ background: "var(--color-ln-ivory)" }}
      >
        <div className="w-full max-w-xl">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              disabled={currentQ === 0}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                currentQ === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#D4AF37" }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Identity Clarity Assessment
              </span>
            </div>
            <span className="text-xs text-gray-400 tabular-nums">
              {currentQ + 1} / {QUESTIONS.length}
            </span>
          </div>

          {/* Progress bar with dimension segments */}
          <div className="mb-6">
            {/* Segmented progress bar */}
            <div className="flex gap-1 mb-3">
              {DIMENSIONS.map((dim) => {
                const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.key);
                const dimStart = QUESTIONS.findIndex((q) => q.dimension === dim.key);
                const dimEnd = dimStart + dimQuestions.length;
                const dimProgress = Math.max(0, Math.min(1, (currentQ - dimStart) / dimQuestions.length));
                const isActive = currentQ >= dimStart && currentQ < dimEnd;
                const isComplete = currentQ >= dimEnd;

                return (
                  <div key={dim.key} className="flex-1">
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: isComplete ? "100%" : isActive ? `${dimProgress * 100}%` : "0%",
                          background: dim.color,
                        }}
                      />
                    </div>
                    <div
                      className="text-[9px] mt-1 text-center font-medium truncate transition-colors duration-300"
                      style={{ color: isActive ? dim.color : isComplete ? dim.color + "99" : "#D1D5DB" }}
                    >
                      {dim.icon}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active dimension label */}
            {dimension && (
              <div className="flex items-center justify-center">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: dimension.color + "18", color: dimension.color }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: dimension.color }} />
                  {dimension.label}
                </div>
              </div>
            )}
          </div>

          {/* Question card with slide animation */}
          <div
            ref={cardRef}
            className="rounded-2xl p-8 mb-6 shadow-sm"
            style={{
              background: "white",
              animation: slideDirection === "in"
                ? "slideInRight 0.25s cubic-bezier(0.23, 1, 0.32, 1) forwards"
                : "slideOutLeft 0.22s cubic-bezier(0.77, 0, 0.175, 1) forwards",
            }}
          >
            <p
              className="text-xl font-semibold leading-relaxed mb-8"
              style={{ color: "var(--color-ln-navy)" }}
            >
              {question?.text}
            </p>

            {/* Likert scale */}
            <div className="space-y-2.5">
              {LIKERT_OPTIONS.map((option) => {
                const selected = responses[question?.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    disabled={isTransitioning}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border-2 text-left transition-all",
                      selected
                        ? "border-transparent text-white scale-[1.01]"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-[0.99]"
                    )}
                    style={{
                      background: selected ? dimension?.color ?? "#D4AF37" : undefined,
                      borderColor: selected ? dimension?.color ?? "#D4AF37" : undefined,
                      transition: "all 0.15s cubic-bezier(0.23, 1, 0.32, 1)",
                    }}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        selected ? "border-white bg-white/30" : "border-gray-300"
                      )}
                    >
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={cn("text-sm font-medium", selected ? "text-white" : "text-gray-700")}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Select an answer to automatically advance
          </p>
        </div>
      </div>
    </PlatformLayout>
  );
}
