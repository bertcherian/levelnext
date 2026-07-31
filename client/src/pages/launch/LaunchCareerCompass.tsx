import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Compass, ChevronRight, ChevronLeft, Loader2, Sparkles, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { AIGeneratingScreen, SuccessScreen } from "@/components/launch/AIGeneratingScreen";

// ─── Dimension Config ─────────────────────────────────────────────────────────
const DIMENSIONS = [
  { key: "strengths" as const, label: "Strengths", emoji: "💪", color: "#3B82F6", description: "What you're naturally good at" },
  { key: "interests" as const, label: "Interests", emoji: "🔥", color: "#10B981", description: "What lights you up" },
  { key: "workStyle" as const, label: "Work Style", emoji: "⚡", color: "#F59E0B", description: "How you work best" },
  { key: "values" as const, label: "Values", emoji: "🎯", color: "#8B5CF6", description: "What matters most to you" },
];

type DimensionKey = "strengths" | "interests" | "workStyle" | "values";

export default function LaunchCareerCompass() {
  const [, navigate] = useLocation();
  const [currentDimension, setCurrentDimension] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({
    strengths: {},
    interests: {},
    workStyle: {},
    values: {},
  });
  const [phase, setPhase] = useState<"intro" | "assessment" | "generating" | "success" | "results">("intro");
  const [directionCard, setDirectionCard] = useState<any>(null);

  const { data: sessionData } = trpc.launchCareerCompass.getSession.useQuery();
  const saveResponses = trpc.launchCareerCompass.saveResponses.useMutation();
  const completeCompass = trpc.launchCareerCompass.complete.useMutation({
    onSuccess: (data) => {
      setDirectionCard(data);
      setPhase("success");
    },
    onError: () => {
      toast.error("Something went wrong generating your results. Please try again.");
      setPhase("assessment");
    },
  });

  const questions = sessionData?.questions;
  const existingSession = sessionData?.session;

  // If already completed, show results
  React.useEffect(() => {
    if (existingSession?.status === "completed") {
      setDirectionCard(existingSession);
      setPhase("results");
    }
  }, [existingSession]);

  const dim = DIMENSIONS[currentDimension];
  const dimQuestions = questions?.[dim.key] ?? [];
  const currentQ = dimQuestions[currentQuestion];
  const currentAnswer = answers[dim.key]?.[currentQ?.id ?? ""] ?? "";

  const totalQuestions = 16;
  const answeredCount = Object.values(answers).reduce(
    (sum, dimAnswers) => sum + Object.keys(dimAnswers).length,
    0
  );
  const progressPct = (answeredCount / totalQuestions) * 100;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [dim.key]: { ...prev[dim.key], [currentQ.id]: value },
    }));
  };

  const handleNext = async () => {
    if (!currentAnswer.trim()) {
      toast.error("Please write something before continuing");
      return;
    }

    if (currentQuestion < dimQuestions.length - 1) {
      // Next question in same dimension
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Save this dimension's responses
      const dimResponses = Object.entries(answers[dim.key]).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      // Add current answer
      const allResponses = [
        ...dimResponses.filter((r) => r.questionId !== currentQ.id),
        { questionId: currentQ.id, answer: currentAnswer },
      ];

      await saveResponses.mutateAsync({
        dimension: dim.key as DimensionKey,
        responses: allResponses,
      });

      if (currentDimension < DIMENSIONS.length - 1) {
        // Move to next dimension
        setCurrentDimension(currentDimension + 1);
        setCurrentQuestion(0);
      } else {
        // All done — generate results
        setPhase("generating");
        await completeCompass.mutateAsync();
      }
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentDimension > 0) {
      setCurrentDimension(currentDimension - 1);
      const prevDim = DIMENSIONS[currentDimension - 1];
      setCurrentQuestion((questions?.[prevDim.key]?.length ?? 1) - 1);
    }
  };

  // ── Intro Screen ─────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: "rgba(59,130,246,0.15)", border: "2px solid rgba(59,130,246,0.4)" }}
          >
            <Compass size={36} style={{ color: "#3B82F6" }} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Career Compass
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Manrope, sans-serif" }}>
            16 questions across 4 dimensions — Strengths, Interests, Work Style, and Values. Takes about 10 minutes. At the end, you'll get your personalised Career Direction Card.
          </p>

          {/* Dimension preview */}
          <div className="w-full grid grid-cols-2 gap-3 mb-8">
            {DIMENSIONS.map((d) => (
              <div
                key={d.key}
                className="p-3 rounded-xl text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-lg">{d.emoji}</span>
                <p className="text-xs font-semibold text-white mt-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{d.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{d.description}</p>
              </div>
            ))}
          </div>

          <div className="w-full flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <Star size={14} style={{ color: "#3B82F6" }} />
              <span className="text-xs" style={{ color: "#3B82F6" }}>+100 XP on completion</span>
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>~10 minutes</span>
          </div>

          <button
            onClick={() => setPhase("assessment")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
            style={{ background: "#3B82F6", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}
          >
            Start Career Compass →
          </button>

          <button
            onClick={() => navigate("/launch/journey")}
            className="mt-3 text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Back to Journey Map
          </button>
        </div>
      </div>
    );
  }

  // ── Generating Screen ─────────────────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <AIGeneratingScreen
        title="Generating Your Career Direction Card"
        subtitle="Analysing your responses across all 4 dimensions..."
        accentColor="#3B82F6"
        icon={<Compass size={32} style={{ color: "#3B82F6" }} />}
        steps={[
          { label: "Mapping your Strengths profile", duration: 1800 },
          { label: "Analysing Interests & passions", duration: 1600 },
          { label: "Identifying Work Style patterns", duration: 1500 },
          { label: "Distilling core Values", duration: 1400 },
          { label: "Synthesising career directions", duration: 2000 },
          { label: "Writing your Direction Card", duration: 1800 },
        ]}
      />
    );
  }

  // ── Success Screen ────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <SuccessScreen
        title="Your Career Direction Card is Ready!"
        subtitle="We've analysed your responses across all 4 dimensions and mapped your unique career direction. Your personalised card is waiting."
        xpEarned={100}
        accentColor="#3B82F6"
        icon={<MapPin size={40} style={{ color: "#3B82F6" }} />}
        onContinue={() => setPhase("results")}
        continueLabel="View My Career Direction Card"
      />
    );
  }

  // ── Results Screen ────────────────────────────────────────────────────────────
  if (phase === "results") {
    const card = directionCard?.directionCardJson ?? directionCard;
    const narrative = directionCard?.llmNarrative ?? card?.narrative ?? "";
    const primaryDir = directionCard?.primaryDirection ?? card?.primaryDirection ?? "Your Career Direction";
    const secondaryDir = directionCard?.secondaryDirection ?? card?.secondaryDirection ?? "";
    const tertiaryDir = directionCard?.tertiaryDirection ?? card?.tertiaryDirection ?? "";
    const topStrengths: string[] = card?.topStrengths ?? [];
    const coreInterests: string[] = card?.coreInterests ?? [];
    const coreValues: string[] = card?.coreValues ?? [];
    const nextActions: string[] = card?.nextActions ?? [];
    const roleExamples: string[] = card?.roleExamples ?? [];

    return (
      <div className="launch-theme min-h-screen" style={{ background: "#0F172A" }}>
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(59,130,246,0.15)", border: "2px solid rgba(59,130,246,0.4)" }}
            >
              <MapPin size={28} style={{ color: "#3B82F6" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Your Career Direction Card
            </h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>+100 XP earned</p>
          </div>

          {/* Primary Direction */}
          <div
            className="p-5 rounded-2xl mb-4"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#3B82F6" }}>
              Primary Direction
            </p>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {primaryDir}
            </h2>
          </div>

          {/* Secondary & Tertiary */}
          {(secondaryDir || tertiaryDir) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {secondaryDir && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#10B981" }}>Alternative</p>
                  <p className="text-xs font-semibold text-white">{secondaryDir}</p>
                </div>
              )}
              {tertiaryDir && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#F59E0B" }}>Third Option</p>
                  <p className="text-xs font-semibold text-white">{tertiaryDir}</p>
                </div>
              )}
            </div>
          )}

          {/* Narrative */}
          {narrative && (
            <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Manrope, sans-serif" }}>
                {narrative}
              </p>
            </div>
          )}

          {/* Strengths, Interests, Values */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Top Strengths", items: topStrengths, color: "#3B82F6" },
              { label: "Core Interests", items: coreInterests, color: "#10B981" },
              { label: "Core Values", items: coreValues, color: "#8B5CF6" },
            ].map(({ label, items, color }) => items.length > 0 && (
              <div key={label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color }}>{label}</p>
                {items.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-[10px] text-white mb-0.5" style={{ fontFamily: "Manrope, sans-serif" }}>• {item}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Role Examples */}
          {roleExamples.length > 0 && (
            <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Roles to Explore
              </p>
              <div className="flex flex-wrap gap-2">
                {roleExamples.map((role, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)" }}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next Actions */}
          {nextActions.length > 0 && (
            <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Your Next 3 Actions
              </p>
              {nextActions.slice(0, 3).map((action, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(59,130,246,0.2)" }}>
                    <span className="text-[10px] font-bold" style={{ color: "#3B82F6" }}>{i + 1}</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Manrope, sans-serif" }}>{action}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate("/launch/mission/2")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98] mb-3"
            style={{ background: "#10B981", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}
          >
            Next: Build Your Story →
          </button>
          <button
            onClick={() => navigate("/launch/journey")}
            className="w-full py-3 text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Back to Journey Map
          </button>
        </div>
      </div>
    );
  }

  // ── Assessment Screen ─────────────────────────────────────────────────────────
  return (
    <div className="launch-theme min-h-screen flex flex-col" style={{ background: "#0F172A" }}>
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-1 transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${dim.color}, ${dim.color}aa)`,
          }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        {/* Dimension indicator */}
        <div className="flex items-center gap-2 mb-6">
          {DIMENSIONS.map((d, i) => (
            <div
              key={d.key}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: i < currentDimension
                  ? d.color
                  : i === currentDimension
                  ? `${d.color}88`
                  : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>

        {/* Dimension label */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">{dim.emoji}</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: dim.color }}>{dim.label}</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Question {currentQuestion + 1} of {dimQuestions.length}
            </p>
          </div>
        </div>

        {/* Question */}
        {currentQ && (
          <div className="flex-1">
            <h2
              className="text-lg font-bold text-white mb-2 leading-snug"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {currentQ.text}
            </h2>

            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={currentQ.placeholder}
              rows={5}
              className="w-full mt-4 p-4 rounded-2xl text-sm resize-none outline-none transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${currentAnswer ? dim.color + "66" : "rgba(255,255,255,0.1)"}`,
                color: "white",
                fontFamily: "Manrope, sans-serif",
                lineHeight: "1.6",
              }}
              onFocus={(e) => {
                e.target.style.border = `1px solid ${dim.color}99`;
              }}
              onBlur={(e) => {
                e.target.style.border = `1px solid ${currentAnswer ? dim.color + "66" : "rgba(255,255,255,0.1)"}`;
              }}
            />

            <p className="text-[10px] mt-2 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
              {currentAnswer.length} characters
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {(currentDimension > 0 || currentQuestion > 0) && (
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-[0.95]"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!currentAnswer.trim() || saveResponses.isPending}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: dim.color, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}
          >
            {saveResponses.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : currentDimension === DIMENSIONS.length - 1 && currentQuestion === dimQuestions.length - 1 ? (
              <>Generate My Direction Card <Sparkles size={14} /></>
            ) : (
              <>Continue <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
