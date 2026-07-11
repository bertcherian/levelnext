import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ChevronRight } from "lucide-react";

const MODULE_META: Record<string, { label: string; tagline: string; color: string; questionCount: number }> = {
  eci: {
    label: "Executive Communication",
    tagline: "Understand how you communicate, influence, and command presence at the executive level.",
    color: "#12345A",
    questionCount: 30,
  },
  tii: {
    label: "Leadership Time Intelligence",
    tagline: "Your calendar reveals your leadership system. Discover how you invest, protect, and reclaim your most strategic resource.",
    color: "#1a3d5c",
    questionCount: 30,
  },
  lii: {
    label: "Leadership Influence",
    tagline: "Measure your ability to lead through trust, influence, and authentic authority.",
    color: "#1a4a7a",
    questionCount: 40,
  },
  gcc: {
    label: "GCC Readiness",
    tagline: "Assess your organisation's strategic readiness as a Global Capability Centre.",
    color: "#0f2d4a",
    questionCount: 50,
  },
  ldi: {
    label: "Leadership Derailment Intelligence",
    tagline: "The hidden patterns that stall strong leaders — finally measured.",
    color: "#5c1a1a",
    questionCount: 30,
  },
  sti: {
    label: "Strategic Thinking Intelligence",
    tagline: "Measure your strategic thinking capability across 10 dimensions — from clarity to scenario planning.",
    color: "#1e3a5f",
    questionCount: 30,
  },
};

const SCALE_LABELS: Record<number, string> = {
  1: "Strongly Disagree",
  2: "Disagree",
  3: "Neutral",
  4: "Agree",
  5: "Strongly Agree",
};

// ECI Pillar colours and labels for progress display
const ECI_PILLAR_META: Record<string, { label: string; shortLabel: string; color: string }> = {
  strategic_communication: { label: "Strategic Communication", shortLabel: "Strategic", color: "#D4AF37" },
  executive_presence:      { label: "Executive Presence",      shortLabel: "Presence",  color: "#3B82F6" },
  influence_stakeholder:   { label: "Influence & Stakeholder", shortLabel: "Influence", color: "#22C55E" },
  narrative_visibility:    { label: "Narrative & Visibility",  shortLabel: "Narrative", color: "#F59E0B" },
  conversational_leadership: { label: "Conversational Leadership", shortLabel: "Conversational", color: "#8B5CF6" },
};

// LII Dimension metadata for completion screen
const LII_DIM_META: Record<string, { label: string; color: string }> = {
  trust_capital:             { label: "Trust Capital",             color: "#D4AF37" },
  decision_influence:        { label: "Decision Influence",        color: "#3B82F6" },
  stakeholder_alignment:     { label: "Stakeholder Alignment",     color: "#22C55E" },
  coalition_building:        { label: "Coalition Building",        color: "#F59E0B" },
  organizational_navigation: { label: "Organisational Navigation", color: "#8B5CF6" },
  inspirational_leadership:  { label: "Inspirational Leadership",  color: "#EC4899" },
  change_mobilization:       { label: "Change Mobilisation",       color: "#EF4444" },
  conflict_resistance:       { label: "Conflict Resilience",       color: "#14B8A6" },
  adaptive_influence:        { label: "Adaptive Influence",        color: "#F97316" },
  leadership_reputation:     { label: "Leadership Reputation",     color: "#6366F1" },
};

// GCC Dimension metadata for completion screen
const GCC_DIM_META: Record<string, { label: string; color: string }> = {
  strategic_influence:  { label: "Strategic Influence",  color: "#D4AF37" },
  operating_excellence: { label: "Operating Excellence", color: "#3B82F6" },
  leadership_talent:    { label: "Leadership & Talent",  color: "#22C55E" },
  innovation_ai:        { label: "Innovation & AI",       color: "#F59E0B" },
  enterprise_alignment: { label: "Enterprise Alignment", color: "#8B5CF6" },
};

// GCC Zone colours
const GCC_ZONE_COLORS: Record<string, string> = {
  critical:   "#EF4444",
  developing: "#F97316",
  emerging:   "#F59E0B",
  capable:    "#3B82F6",
  strategic:  "#22C55E",
};

// ECI Archetype icons (emoji fallback)
const ARCHETYPE_ICONS: Record<string, string> = {
  strategic_influencer: "⚡",
  invisible_expert: "🔍",
  executive_diplomat: "🤝",
  technical_operator: "⚙️",
  trusted_integrator: "🔗",
  defensive_specialist: "🛡️",
  emerging_executive_voice: "🌱",
  narrative_leader: "📖",
};

// GCC Archetype icons
const GCC_ARCHETYPE_ICONS: Record<string, string> = {
  delivery_engine:          "⚙️",
  efficient_executor:       "📊",
  scaling_gcc:              "📈",
  enterprise_contributor:   "🤝",
  innovation_hub:           "💡",
  strategic_partner:        "🎯",
  ai_accelerated_gcc:       "🤖",
  enterprise_growth_engine: "🚀",
};

// ECI Zone colours
const ZONE_COLORS: Record<string, string> = {
  emerging_voice: "#EF4444",
  developing_communicator: "#F97316",
  capable_communicator: "#EAB308",
  executive_communicator: "#22C55E",
  elite_communicator: "#10B981",
};

type SubmitResult = {
  edgeScore: number;
  archetype: string;
  archetypeLabel?: string;
  archetypeTagline?: string;
  archetypeDescription?: string;
  archetypeStrengths?: string[];
  archetypeRisks?: string[];
  zone: string;
  zoneLabel?: string;
  zoneDescription?: string;
  zoneImplication?: string;
  dimensionScores?: Record<string, number>;
  reportSlug?: string;
  slug?: string;
};

export default function Assessment() {
  const params = useParams<{ moduleType: string }>();
  const moduleType = params.moduleType?.toLowerCase() ?? "eci";
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  const [phase, setPhase] = useState<"intro" | "questions" | "complete">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const { data: questionsData, isLoading: questionsLoading, isError: questionsError } = trpc.assessment.getQuestions.useQuery(
    { moduleType: moduleType.toUpperCase() as "ECI" | "TII" | "LII" | "GCC" | "LDI" | "STI" },
    { enabled: isAuthenticated }
  );

  const submitAssessment = trpc.assessment.submit.useMutation({
    onSuccess: (data) => {
      setResult(data as SubmitResult);
      setPhase("complete");
    },
    onError: () => toast.error("Could not submit your diagnostic. Please try again."),
  });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const meta = MODULE_META[moduleType] ?? MODULE_META.eci;

  // Normalise questions from any module shape
  const allQuestions: { id: string; text: string; pillarId?: string; dimensionId?: string }[] = useMemo(() => {
    if (!questionsData) return [];
    const q = questionsData as { questions?: { id: string; text: string; pillarId?: string; dimensionId?: string }[] };
    return q.questions ?? [];
  }, [questionsData]);

  // ECI: group questions by pillar for progress display
  const pillarGroups = useMemo(() => {
    if (moduleType !== "eci" || allQuestions.length === 0) return [];
    const groups: Record<string, { pillarId: string; questions: typeof allQuestions }> = {};
    for (const q of allQuestions) {
      const pid = q.pillarId ?? "unknown";
      if (!groups[pid]) groups[pid] = { pillarId: pid, questions: [] };
      groups[pid].questions.push(q);
    }
    return Object.values(groups);
  }, [allQuestions, moduleType]);

  // Current pillar for ECI
  const currentPillarId = useMemo(() => {
    if (moduleType !== "eci" || allQuestions.length === 0) return null;
    return allQuestions[currentQ]?.pillarId ?? null;
  }, [allQuestions, currentQ, moduleType]);

  const totalQ = allQuestions.length;
  const progress = totalQ > 0 ? Math.round(((currentQ + 1) / totalQ) * 100) : 0;
  const currentQuestion = allQuestions[currentQ];
  const answeredCount = Object.keys(responses).length;
  const isLastQuestion = currentQ === totalQ - 1;
  const currentAnswer = currentQuestion ? responses[currentQuestion.id] : undefined;

  const handleAnswer = (value: number) => {
    if (!currentQuestion) return;
    const newResponses = { ...responses, [currentQuestion.id]: value };
    setResponses(newResponses);
    if (currentQ < totalQ - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 220);
    }
  };

  const handleSubmit = () => {
    submitAssessment.mutate({
      sessionId: 0,
      moduleType: moduleType.toUpperCase() as "ECI" | "TII" | "LII" | "GCC" | "LDI" | "STI",
      responses,
      participantName: user?.name ?? "Leader",
      participantEmail: user?.email ?? "leader@levelnext.com",
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-navy)" }} />
      </div>
    );
  }

  // ── Error / empty questions guard ──────────────────────────────────────────
  if (!questionsLoading && !loading && (questionsError || (allQuestions.length === 0 && phase !== "complete")) && phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Could not load questions</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>There was a problem loading the diagnostic questions. Please try again or contact support.</p>
          <button
            onClick={() => navigate("/diagnostics")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--color-ln-navy)", color: "white" }}
          >← Back to Diagnostics</button>
        </div>
      </div>
    );
  }

  // ── Intro Screen ─────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-navy)" }}>
        {/* Top bar */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/diagnostics")}
            className="flex items-center gap-2 text-sm transition-colors hover:opacity-70"
            style={{ color: "oklch(70% 0.02 248.6)" }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-base font-bold tracking-tight text-white">LevelNext</span>
          <div className="w-16" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
          <div className="w-full max-w-lg text-center">
            {/* Module badge */}
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
              style={{ background: "oklch(25% 0.072 248.6)", color: "var(--color-ln-yellow)" }}>
              {moduleType.toUpperCase()} Diagnostic
            </span>

            <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{meta.label}</h1>
            <p className="text-base mb-8 leading-relaxed" style={{ color: "oklch(75% 0.02 248.6)" }}>
              {meta.tagline}
            </p>

            {/* What to expect */}
            <div className="rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left space-y-4"
              style={{ background: "oklch(20% 0.072 248.6)" }}>
              <p className="text-sm font-semibold text-white mb-3">What to expect</p>
              {moduleType === "eci" && pillarGroups.length > 0 ? (
                <div className="space-y-2">
                  {pillarGroups.map((g) => {
                    const pm = ECI_PILLAR_META[g.pillarId];
                    return (
                      <div key={g.pillarId} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pm?.color ?? "#F2B705" }} />
                        <span className="text-sm" style={{ color: "oklch(80% 0.02 248.6)" }}>
                          {pm?.label ?? g.pillarId} — {g.questions.length} questions
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "oklch(75% 0.02 248.6)" }}>
                  {totalQ} questions across key leadership dimensions. Takes approximately 8–12 minutes.
                </p>
              )}
              <div className="pt-3 border-t" style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
                <p className="text-xs" style={{ color: "oklch(60% 0.02 248.6)" }}>
                  Answer based on your typical behaviour, not your ideal. There are no right or wrong answers.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setPhase("questions")}
              className="w-full h-14 text-base font-semibold rounded-xl"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
            >
              Begin Diagnostic <ChevronRight size={18} className="ml-2" />
            </Button>
            <p className="text-xs mt-4" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Your responses are private and feed directly into your Leadership Edge profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Completion Screen ────────────────────────────────────────────────────────
  if (phase === "complete" && result) {
    const isGcc = moduleType === "gcc";
    const archetypeIcon = isGcc
      ? (GCC_ARCHETYPE_ICONS[result.archetype] ?? "🏢")
      : (ARCHETYPE_ICONS[result.archetype] ?? "✦");
    const zoneColor = isGcc
      ? (GCC_ZONE_COLORS[result.zone] ?? "#22C55E")
      : (ZONE_COLORS[result.zone] ?? "#22C55E");
    // ECI: filter to pillar-level scores only
    const pillarScores = result.dimensionScores
      ? Object.entries(result.dimensionScores).filter(([k]) => ECI_PILLAR_META[k])
      : [];
    // LII: filter to dimension-level scores
    const liiDimScores = result.dimensionScores
      ? Object.entries(result.dimensionScores).filter(([k]) => LII_DIM_META[k])
      : [];
    // GCC: filter to module-level scores
    const gccDimScores = result.dimensionScores
      ? Object.entries(result.dimensionScores).filter(([k]) => GCC_DIM_META[k])
      : [];
    const reportSlug = (result as any).slug;

    return (
      <div className="min-h-screen flex flex-col animate-fade-in" style={{ background: "var(--color-ln-navy)" }}>
        {/* Top bar */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div />
          <span className="text-base font-bold tracking-tight text-white">LevelNext</span>
          <div />
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="w-full max-w-2xl mx-auto space-y-6">

            {/* Edge Score Hero */}
            <div className="text-center py-8">
              <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 mx-auto mb-5"
                style={{ borderColor: "var(--color-ln-yellow)" }}>
                <span className="text-4xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>
                  {Math.round(result.edgeScore)}
                </span>
                <span className="text-xs font-medium mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>Edge</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: zoneColor + "22", color: zoneColor, border: `1px solid ${zoneColor}44` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: zoneColor }} />
                {result.zoneLabel ?? result.zone.replace(/_/g, " ")}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Your Insight is ready.</h1>
              <p className="text-sm" style={{ color: "oklch(70% 0.02 248.6)" }}>{meta.label} Diagnostic</p>
            </div>

            {/* Archetype Card */}
            <div className="rounded-2xl p-4 sm:p-6" style={{ background: "oklch(20% 0.072 248.6)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-yellow)" }}>
                {moduleType === "lii" ? "Your Influence Archetype" : moduleType === "gcc" ? "Your GCC Archetype" : moduleType === "ldi" ? "Your Derailment Profile" : "Your Communication Archetype"}
              </p>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl flex-shrink-0">{archetypeIcon}</span>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {result.archetypeLabel ?? result.archetype.replace(/_/g, " ")}
                  </h2>
                  {result.archetypeTagline && (
                    <p className="text-sm font-medium mb-2" style={{ color: "var(--color-ln-yellow)" }}>
                      {result.archetypeTagline}
                    </p>
                  )}
                  {result.archetypeDescription && (
                    <p className="text-sm leading-relaxed" style={{ color: "oklch(75% 0.02 248.6)" }}>
                      {result.archetypeDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Strengths & Risks */}
              {(result.archetypeStrengths?.length || result.archetypeRisks?.length) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t"
                  style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
                  {result.archetypeStrengths && result.archetypeStrengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#22C55E" }}>Strengths</p>
                      <ul className="space-y-1">
                        {result.archetypeStrengths.map((s, i) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: "oklch(75% 0.02 248.6)" }}>
                            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.archetypeRisks && result.archetypeRisks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "#F97316" }}>Growth Edges</p>
                      <ul className="space-y-1">
                        {result.archetypeRisks.map((r, i) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: "oklch(75% 0.02 248.6)" }}>
                            <span className="text-orange-400 mt-0.5 flex-shrink-0">→</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Zone Implication */}
            {result.zoneImplication && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(20% 0.072 248.6)", borderLeft: `3px solid ${zoneColor}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: zoneColor }}>
                  What This Means For You
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(80% 0.02 248.6)" }}>
                  {result.zoneImplication}
                </p>
              </div>
            )}

            {/* GCC Module Scores */}
            {moduleType === "gcc" && gccDimScores.length > 0 && (
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "oklch(20% 0.072 248.6)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-ln-yellow)" }}>
                  Readiness Dimension Breakdown
                </p>
                <div className="space-y-4">
                  {gccDimScores
                    .sort(([, a], [, b]) => b - a)
                    .map(([dimId, score]) => {
                      const dm = GCC_DIM_META[dimId];
                      const pct = Math.round(score);
                      return (
                        <div key={dimId}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-white">{dm?.label ?? dimId}</span>
                            <span className="text-sm font-bold" style={{ color: dm?.color ?? "var(--color-ln-yellow)" }}>{pct}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(30% 0.072 248.6)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: dm?.color ?? "var(--color-ln-yellow)" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* LII Dimension Scores */}
            {moduleType === "lii" && liiDimScores.length > 0 && (
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "oklch(20% 0.072 248.6)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-ln-yellow)" }}>
                  Influence Dimension Breakdown
                </p>
                <div className="space-y-4">
                  {liiDimScores
                    .sort(([, a], [, b]) => b - a)
                    .map(([dimId, rawScore]) => {
                      const dm = LII_DIM_META[dimId];
                      // LII scores are on 1-5 scale; convert to 0-100 for display
                      const pct = Math.round(((rawScore - 1) / 4) * 100);
                      return (
                        <div key={dimId}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-white">{dm?.label ?? dimId}</span>
                            <span className="text-sm font-bold" style={{ color: dm?.color ?? "var(--color-ln-yellow)" }}>{pct}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(30% 0.072 248.6)" }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: dm?.color ?? "var(--color-ln-yellow)" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Pillar Scores (ECI only) */}
            {moduleType === "eci" && pillarScores.length > 0 && (
              <div className="rounded-2xl p-4 sm:p-6" style={{ background: "oklch(20% 0.072 248.6)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-ln-yellow)" }}>
                  Pillar Breakdown
                </p>
                <div className="space-y-4">
                  {pillarScores.map(([pillarId, score]) => {
                    const pm = ECI_PILLAR_META[pillarId];
                    const pct = Math.round(score);
                    return (
                      <div key={pillarId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-white">{pm?.label ?? pillarId}</span>
                          <span className="text-sm font-bold" style={{ color: pm?.color ?? "var(--color-ln-yellow)" }}>{pct}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(30% 0.072 248.6)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: pm?.color ?? "var(--color-ln-yellow)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LDI: Top 3 Derailment Risks & Top 3 Stabilizers */}
            {moduleType === "ldi" && result.dimensionScores && (() => {
              const LDI_DIM_LABELS: Record<string, string> = {
                self_awareness: "Self-Awareness",
                emotional_regulation: "Emotional Regulation",
                humility_vs_defensiveness: "Humility vs Defensiveness",
                trust_relationship_building: "Trust & Relationships",
                stakeholder_management: "Stakeholder Navigation",
                strategic_thinking: "Strategic Thinking",
                decision_making_ambiguity: "Decision-Making",
                accountability_courage: "Accountability & Courage",
                delegation_team_development: "Delegation & Growth",
                executive_communication: "Executive Communication",
              };
              const sorted = Object.entries(result.dimensionScores)
                .filter(([k]) => LDI_DIM_LABELS[k])
                .map(([k, v]) => ({ key: k, label: LDI_DIM_LABELS[k], score: Math.round(v) }))
                .sort((a, b) => a.score - b.score);
              const risks = sorted.slice(0, 3);
              const stabilizers = [...sorted].reverse().slice(0, 3);
              return (
                <div className="rounded-2xl p-4 sm:p-6" style={{ background: "oklch(20% 0.072 248.6)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#f87171" }}>Top 3 Derailment Risks</p>
                      <div className="space-y-3">
                        {risks.map(({ label, score }, i) => (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white">{i + 1}. {label}</span>
                              <span className="text-xs font-bold" style={{ color: "#f87171" }}>{score}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(30% 0.072 248.6)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: "#dc2626" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#4ade80" }}>Top 3 Stabilizers</p>
                      <div className="space-y-3">
                        {stabilizers.map(({ label, score }, i) => (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white">{i + 1}. {label}</span>
                              <span className="text-xs font-bold" style={{ color: "#4ade80" }}>{score}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(30% 0.072 248.6)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: "#16a34a" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pb-8">
              <Button
                onClick={() => navigate("/guide")}
                className="flex-1 font-semibold h-12"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                Talk to Guide About This
              </Button>
              <Button
                onClick={() => navigate("/my-edge")}
                variant="outline"
                className="flex-1 font-semibold h-12 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
              >
                View My Edge Profile
              </Button>
            </div>
            {reportSlug && (
              <div className="text-center pb-6">
                <button
                  onClick={() => navigate(`/report/${reportSlug}`)}
                  className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: "oklch(55% 0.02 248.6)" }}
                >
                  View full diagnostic report →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ──────────────────────────────────────────────────────────
  const currentPillarMeta = currentPillarId ? ECI_PILLAR_META[currentPillarId] : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b"
        style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
        <button
          onClick={() => setPhase("intro")}
          className="flex items-center gap-2 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--color-ln-muted)" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-base font-bold tracking-tight" style={{ color: "var(--color-ln-navy)" }}>LevelNext</span>
        <span className="text-sm font-medium tabular-nums" style={{ color: "var(--color-ln-muted)" }}>
          {answeredCount}/{totalQ}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1.5 w-full" style={{ background: "var(--color-ln-border)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: currentPillarMeta?.color ?? "var(--color-ln-yellow)",
          }}
        />
      </div>

      {/* Pillar indicator (ECI only) */}
      {moduleType === "eci" && currentPillarMeta && (
        <div className="px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 border-b"
          style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: currentPillarMeta.color }} />
          <span className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>
            {currentPillarMeta.label}
          </span>
          <span className="text-xs ml-auto" style={{ color: "var(--color-ln-muted)" }}>
            Q{currentQ + 1} of {totalQ}
          </span>
        </div>
      )}

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-2xl animate-fade-in" key={currentQ}>
          {currentQuestion ? (
            <>
              {/* Question text */}
              <h2 className="text-xl font-semibold text-center mb-10 leading-relaxed"
                style={{ color: "var(--color-ln-navy)" }}>
                {currentQuestion.text}
              </h2>

              {/* Likert scale */}
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAnswer(val)}
                    className="w-full rounded-xl px-5 py-4 text-left flex items-center gap-4 transition-all duration-150 hover:scale-[1.01] active:scale-[0.98]"
                    style={{
                      background: currentAnswer === val ? "var(--color-ln-navy)" : "white",
                      border: `1.5px solid ${currentAnswer === val ? "var(--color-ln-navy)" : "var(--color-ln-border)"}`,
                      boxShadow: currentAnswer === val ? "none" : "var(--shadow-sm)",
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: currentAnswer === val ? "var(--color-ln-yellow)" : "var(--color-ln-ivory-dark)",
                        color: currentAnswer === val ? "var(--color-ln-navy)" : "var(--color-ln-muted)",
                      }}
                    >
                      {val}
                    </span>
                    <span className="text-sm font-medium"
                      style={{ color: currentAnswer === val ? "white" : "var(--color-ln-text)" }}>
                      {SCALE_LABELS[val]}
                    </span>
                    {currentAnswer === val && (
                      <CheckCircle2 size={16} className="ml-auto flex-shrink-0"
                        style={{ color: "var(--color-ln-yellow)" }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-2 text-sm transition-colors disabled:opacity-30"
                  style={{ color: "var(--color-ln-muted)" }}
                >
                  <ArrowLeft size={16} /> Previous
                </button>

                {isLastQuestion && answeredCount === totalQ ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitAssessment.isPending}
                    className="font-semibold h-11 px-8"
                    style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                  >
                    {submitAssessment.isPending
                      ? <><Loader2 size={16} className="animate-spin mr-2" />Processing…</>
                      : "Get My Insight"}
                  </Button>
                ) : currentAnswer !== undefined && !isLastQuestion ? (
                  <button
                    onClick={() => setCurrentQ((q) => q + 1)}
                    className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: "var(--color-ln-navy)" }}
                  >
                    Next <ArrowRight size={16} />
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p style={{ color: "var(--color-ln-muted)" }}>Loading questions…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
