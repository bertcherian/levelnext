import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Zap, ChevronRight, ArrowLeft, Check, Loader2, Star, BookOpen, Target, Mic2, Clock, Trophy, Lock } from "lucide-react";
import { toast } from "sonner";
import { AIGeneratingScreen, SuccessScreen } from "@/components/launch/AIGeneratingScreen";
import LaunchPageWrapper from "@/components/LaunchPageWrapper";

type ViewState =
  | { mode: "list" }
  | { mode: "module"; moduleId: string }
  | { mode: "challenge"; moduleId: string }
  | { mode: "generating"; moduleId: string }
  | { mode: "feedback"; moduleId: string; feedback: string; score: number; xpEarned: number }
  | { mode: "success"; moduleId: string; xpEarned: number };

const CATEGORY_COLORS: Record<string, string> = {
  Communication: "#3B82F6",
  Productivity: "#10B981",
  "Professional Presence": "#8B5CF6",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Communication: <Mic2 size={14} />,
  Productivity: <Target size={14} />,
  "Professional Presence": <Star size={14} />,
};

export default function LaunchSkillSprint() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [challengeText, setChallengeText] = useState("");

  const { data: modules, isLoading, refetch } = trpc.launchSkillSprint.getModules.useQuery();
  const submitChallenge = trpc.launchSkillSprint.submitChallenge.useMutation();

  const categories = ["All", "Communication", "Productivity", "Professional Presence"];

  const filteredModules =
    activeCategory === "All"
      ? modules ?? []
      : (modules ?? []).filter((m) => m.category === activeCategory);

  const completedCount = (modules ?? []).filter((m) => m.status === "completed").length;
  const totalXp = (modules ?? []).filter((m) => m.status === "completed").reduce((sum, m) => sum + m.xpEarned, 0);

  // ── List View ─────────────────────────────────────────────────────────────────
  if (view.mode === "list") {
    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate("/launch/journey")} className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                ⚡ Skill Sprint
              </h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Mission 3 · 10 modules</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="p-4 rounded-2xl mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white">Your Progress</p>
              <p className="text-xs" style={{ color: "#F59E0B" }}>+{totalXp} XP earned</p>
            </div>
            <div className="w-full h-2 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${((completedCount / 10) * 100)}%`, background: "linear-gradient(90deg, #10B981, #3B82F6)" }}
              />
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{completedCount}/10 modules completed</p>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
                style={{
                  background: activeCategory === cat ? (CATEGORY_COLORS[cat] ?? "#3B82F6") : "rgba(255,255,255,0.06)",
                  color: activeCategory === cat ? "#fff" : "rgba(255,255,255,0.5)",
                  border: activeCategory === cat ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Module list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "#3B82F6" }} />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredModules.map((module, idx) => {
                const color = CATEGORY_COLORS[module.category] ?? "#3B82F6";
                const isCompleted = module.status === "completed";
                return (
                  <button
                    key={module.id}
                    onClick={() => setView({ mode: "module", moduleId: module.id })}
                    className="w-full p-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.98]"
                    style={{
                      background: isCompleted ? `${color}15` : "rgba(255,255,255,0.04)",
                      border: isCompleted ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: `${color}20` }}
                      >
                        {module.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                            {module.title}
                          </p>
                          {isCompleted && <Check size={12} style={{ color: "#10B981", flexShrink: 0 }} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${color}20`, color }}>
                            {module.category}
                          </span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                            <Clock size={9} className="inline mr-0.5" />{module.duration}
                          </span>
                          <span className="text-[10px]" style={{ color: "#F59E0B" }}>
                            +{module.xp} XP
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* All done CTA */}
          {completedCount === 10 && (
            <div className="mt-6 p-4 rounded-2xl text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <Trophy size={24} className="mx-auto mb-2" style={{ color: "#10B981" }} />
              <p className="text-sm font-bold text-white mb-1">Skill Sprint Complete!</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>You've earned {totalXp} XP. Keep the momentum going!</p>
            </div>
          )}

          <button onClick={() => navigate("/launch/journey")} className="w-full mt-6 py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Back to Journey Map
          </button>
        </div>
      </LaunchPageWrapper>
    );
  }

  // ── Module Detail View ────────────────────────────────────────────────────────
  if (view.mode === "module") {
    const module = modules?.find((m) => m.id === view.moduleId);
    if (!module) return null;
    const color = CATEGORY_COLORS[module.category] ?? "#3B82F6";

    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setView({ mode: "list" })} className="flex items-center gap-2 mb-6 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={14} /> Back to modules
          </button>

          {/* Module header */}
          <div className="p-5 rounded-2xl mb-5" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
            <div className="text-3xl mb-3">{module.emoji}</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${color}25`, color }}>
                {module.category}
              </span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{module.duration}</span>
              <span className="text-[10px]" style={{ color: "#F59E0B" }}>+{module.xp} XP</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {module.title}
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Manrope, sans-serif" }}>
              {module.summary}
            </p>
          </div>

          {/* Key points */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>What You'll Learn</p>
            </div>
            <div className="space-y-2">
              {module.keyPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                    style={{ background: `${color}25`, color }}>
                    {i + 1}
                  </div>
                  <p className="text-xs text-white leading-relaxed" style={{ fontFamily: "Manrope, sans-serif" }}>{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge preview */}
          <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} style={{ color: "#F59E0B" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#F59E0B" }}>Your Challenge</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Manrope, sans-serif" }}>
              {module.challenge}
            </p>
          </div>

          {/* CTA */}
          {module.status === "completed" ? (
            <div>
              <div className="p-4 rounded-2xl mb-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Check size={14} style={{ color: "#10B981" }} />
                  <p className="text-xs font-semibold" style={{ color: "#10B981" }}>Completed · +{module.xpEarned} XP earned</p>
                </div>
                {module.challengeFeedback && (
                  <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Manrope, sans-serif" }}>
                    {module.challengeFeedback}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setChallengeText(module.challengeResponse ?? ""); setView({ mode: "challenge", moduleId: module.id }); }}
                className="w-full py-3 rounded-2xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Redo Challenge
              </button>
            </div>
          ) : (
            <button
              onClick={() => setView({ mode: "challenge", moduleId: module.id })}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
              style={{ background: color, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
              Start Challenge →
            </button>
          )}
        </div>
      </LaunchPageWrapper>
    );
  }

  // ── Challenge View ────────────────────────────────────────────────────────────
  if (view.mode === "challenge") {
    const module = modules?.find((m) => m.id === view.moduleId);
    if (!module) return null;
    const color = CATEGORY_COLORS[module.category] ?? "#3B82F6";

    const handleSubmit = async () => {
      if (challengeText.trim().length < 20) {
        toast.error("Please write at least 20 characters.");
        return;
      }
      setView({ mode: "generating", moduleId: view.moduleId });
      try {
        const result = await submitChallenge.mutateAsync({ moduleId: view.moduleId, response: challengeText });
        await refetch();
        setView({ mode: "feedback", moduleId: view.moduleId, feedback: result.feedback, score: result.score, xpEarned: result.xpEarned });
      } catch {
        toast.error("Failed to submit. Please try again.");
        setView({ mode: "challenge", moduleId: view.moduleId });
      }
    };

    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => setView({ mode: "module", moduleId: view.moduleId })} className="flex items-center gap-2 mb-6 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">{module.emoji}</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>Challenge</p>
              <h2 className="text-base font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{module.title}</h2>
            </div>
          </div>

          <div className="p-4 rounded-2xl mb-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Manrope, sans-serif" }}>
              {module.challenge}
            </p>
          </div>

          <textarea
            value={challengeText}
            onChange={(e) => setChallengeText(e.target.value)}
            placeholder="Write your response here..."
            rows={8}
            className="w-full p-4 rounded-2xl text-sm resize-none outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontFamily: "Manrope, sans-serif",
            }}
          />
          <p className="text-xs mt-1 mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            {challengeText.length} characters · Aim for at least 100
          </p>

          <button
            onClick={handleSubmit}
            disabled={challengeText.trim().length < 20}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
            style={{ background: color, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
            Submit & Get Feedback →
          </button>
        </div>
      </LaunchPageWrapper>
    );
  }

  // ── Generating View ───────────────────────────────────────────────────────────
  if (view.mode === "generating") {
    const module = modules?.find((m) => m.id === view.moduleId);
    const color = CATEGORY_COLORS[module?.category ?? "Communication"] ?? "#3B82F6";
    return (
      <AIGeneratingScreen
        title="Layla is reviewing your response..."
        subtitle="Analysing your challenge submission and crafting personalised feedback"
        accentColor={color}
        icon={<Zap size={32} style={{ color }} />}
        steps={[
          { label: "Reading your response carefully", duration: 1200 },
          { label: "Checking application of key concepts", duration: 1400 },
          { label: "Identifying your strengths", duration: 1100 },
          { label: "Crafting actionable feedback", duration: 1600 },
          { label: "Calculating your XP reward", duration: 800 },
        ]}
      />
    );
  }

  // ── Feedback View ─────────────────────────────────────────────────────────────
  if (view.mode === "feedback") {
    const module = modules?.find((m) => m.id === view.moduleId);
    if (!module) return null;
    const color = CATEGORY_COLORS[module.category] ?? "#3B82F6";
    const { feedback, score, xpEarned } = view;

    return (
      <LaunchPageWrapper>
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Score ring */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: `${color}20`, border: `3px solid ${color}` }}>
              <span className="text-2xl font-bold" style={{ color, fontFamily: "Space Grotesk, sans-serif" }}>{score}/10</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {score >= 8 ? "Excellent work! 🔥" : score >= 6 ? "Great effort! ⚡" : "Good start! 💪"}
            </h2>
            <p className="text-xs" style={{ color: "#F59E0B" }}>+{xpEarned} XP earned</p>
          </div>

          {/* Layla's feedback */}
          <div className="p-5 rounded-2xl mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: "#3B82F620" }}>🌟</div>
              <p className="text-xs font-semibold" style={{ color: "#3B82F6" }}>Layla's Feedback</p>
            </div>
            <p className="text-sm leading-relaxed text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{feedback}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setView({ mode: "list" })}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
              style={{ background: color, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
              Continue to Next Module →
            </button>
            <button onClick={() => navigate("/launch/journey")} className="w-full py-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Back to Journey Map
            </button>
          </div>
        </div>
      </LaunchPageWrapper>
    );
  }

  return null;
}
