/**
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

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Assessment questions ─────────────────────────────────────────────────────
const DIMENSIONS = [
  { key: "leadershipIdentityClarity", label: "Leadership Identity Clarity", color: "#D4AF37" },
  { key: "futureSelfVividness",       label: "Future Self Vividness",       color: "#4A90D9" },
  { key: "narrativeCoherence",        label: "Narrative Coherence",         color: "#5BA85A" },
  { key: "identityBehaviourAlignment",label: "Identity–Behaviour Alignment",color: "#E07B39" },
  { key: "transitionReadiness",       label: "Transition Readiness",        color: "#9B59B6" },
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

const SCALE_LABELS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 3, label: "Neutral" },
  { value: 5, label: "Strongly Agree" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IdentityClarityAssessment() {
  const [, navigate] = useLocation();
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState<Record<DimensionKey, number> | null>(null);

  const submitAssessmentMutation = trpc.nextChapter.submitIdentityAssessment.useMutation();

  const question = QUESTIONS[currentQ];
  const progress = ((currentQ) / QUESTIONS.length) * 100;
  const dimension = DIMENSIONS.find((d) => d.key === question?.dimension);

  const handleAnswer = (value: number) => {
    const newResponses = { ...responses, [question.id]: value };
    setResponses(newResponses);

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        handleSubmit(newResponses);
      }
    }, 300);
  };

  const handleSubmit = (finalResponses: Record<number, number>) => {
    // Calculate dimension scores (average of 3 questions each, scaled to 1–10)
    const dimensionScores = {} as Record<DimensionKey, number>;
    for (const dim of DIMENSIONS) {
      const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.key);
      const total = dimQuestions.reduce((sum, q) => sum + (finalResponses[q.id] ?? 3), 0);
      // Average of 3 questions (1–5 scale) → scale to 1–10
      dimensionScores[dim.key] = Math.round((total / dimQuestions.length) * 2);
    }

    setScores(dimensionScores);

    submitAssessmentMutation.mutate(
      {
        assessmentType: "baseline",
        scores: dimensionScores,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: () => {
          // Still show results even if save fails
          setSubmitted(true);
        },
      }
    );
  };

  if (submitted && scores) {
    return (
      <PlatformLayout>
        <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--color-ln-ivory)" }}>
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "#D4AF3722", border: "1.5px solid #D4AF37" }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: "#D4AF37" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
                Your Baseline Identity Clarity Profile
              </h1>
              <p className="text-sm text-gray-500">
                We'll measure this again after each stage so you can see your identity shift over time.
              </p>
            </div>

            {/* Dimension scores */}
            <div className="space-y-4 mb-8">
              {DIMENSIONS.map((dim) => {
                const score = scores[dim.key];
                return (
                  <div key={dim.key} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                        {dim.label}
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: dim.color }}
                      >
                        {score}<span className="text-xs text-gray-400 font-normal">/10</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score * 10}%`, background: dim.color }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {score <= 4
                        ? "This is an area with significant growth potential — your journey starts here."
                        : score <= 6
                        ? "You have a foundation here. The Next Chapter journey will sharpen this further."
                        : "Strong foundation. The journey will deepen and extend this clarity."}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Overall score */}
            <div
              className="rounded-2xl p-6 mb-8 text-center"
              style={{ background: "var(--color-ln-navy)" }}
            >
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Overall Identity Clarity Score</div>
              <div className="text-5xl font-black mb-1" style={{ color: "#D4AF37" }}>
                {Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length)}
                <span className="text-xl text-white/30 font-normal">/10</span>
              </div>
              <p className="text-sm text-white/60 mt-2">
                This is your baseline. By the end of your Next Chapter journey, this number will tell a different story.
              </p>
            </div>

            <Button
              onClick={() => navigate("/next-chapter")}
              className="w-full h-12 text-sm font-semibold"
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

  return (
    <PlatformLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="w-full max-w-xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "#D4AF37" }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Identity Clarity Assessment
                </span>
              </div>
              <span className="text-xs text-gray-400">{currentQ + 1} / {QUESTIONS.length}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Dimension badge */}
          {dimension && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ background: dimension.color + "18", color: dimension.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: dimension.color }} />
              {dimension.label}
            </div>
          )}

          {/* Question */}
          <div
            className="rounded-2xl p-8 mb-6 shadow-sm"
            style={{ background: "white" }}
          >
            <p
              className="text-xl font-semibold leading-relaxed mb-8"
              style={{ color: "var(--color-ln-navy)" }}
            >
              {question?.text}
            </p>

            {/* Likert scale */}
            <div className="space-y-3">
              {[
                { value: 1, label: "Strongly Disagree" },
                { value: 2, label: "Disagree" },
                { value: 3, label: "Neutral" },
                { value: 4, label: "Agree" },
                { value: 5, label: "Strongly Agree" },
              ].map((option) => {
                const selected = responses[question?.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border-2 text-left transition-all duration-150",
                      selected
                        ? "border-transparent text-white"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100"
                    )}
                    style={selected ? { background: dimension?.color ?? "#D4AF37", borderColor: dimension?.color ?? "#D4AF37" } : {}}
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

          {/* Navigation hint */}
          <p className="text-center text-xs text-gray-400">
            Select an answer to automatically advance to the next question
          </p>
        </div>
      </div>
    </PlatformLayout>
  );
}
