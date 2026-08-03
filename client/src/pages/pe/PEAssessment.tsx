import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, CheckCircle2, Award, TrendingUp, AlertCircle } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { PEI_DIMENSIONS, PEI_ZONES, getZone } from "@shared/modules/peiData";
import { toast } from "sonner";

type ViewState = "intro" | "assessment" | "results";

export default function PEAssessment() {
  const [viewState, setViewState] = useState<ViewState>("intro");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const assessment = trpc.pei.getAssessment.useQuery();
  const startAssessment = trpc.pei.startAssessment.useMutation();
  const submitResponse = trpc.pei.submitResponse.useMutation();
  const latestResult = trpc.pei.getLatestResult.useQuery();

  useEffect(() => {
    if (latestResult.data && viewState === "intro") {
      setViewState("results");
      setResultData(latestResult.data);
    }
  }, [latestResult.data]);

  const handleStart = async () => {
    try {
      const result = await startAssessment.mutateAsync();
      setSessionId(result.id);
      setCurrentQ(0);
      setResponses({});
      setViewState("assessment");
    } catch {
      toast.error("Failed to start assessment");
    }
  };

  const handleSubmitResponse = async (value: number) => {
    if (!sessionId || !assessment.data) return;
    const question = assessment.data.questions[currentQ];
    setSubmitting(true);
    try {
      const result = await submitResponse.mutateAsync({
        sessionId,
        questionId: question.id,
        response: value,
      });
      const newResponses = { ...responses, [question.id]: value };
      setResponses(newResponses);
      if (result.isComplete) {
        setResultData({
          overallScore: result.overallScore,
          zone: result.zone,
          dimensionScores: result.dimensionScores,
          resultId: result.resultId,
        });
        latestResult.refetch();
        setViewState("results");
      } else {
        setCurrentQ(result.currentQuestionIndex ?? currentQ + 1);
      }
    } catch (e) {
      toast.error("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── INTRO VIEW ───────────────────────────────────────────────────────────
  if (viewState === "intro") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: "oklch(from #d4af37 l c h / 0.12)" }}>
            <Award size={28} style={{ color: "#d4af37" }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            Professional Effectiveness Index
          </h1>
          <p className="text-sm mt-2 max-w-xl mx-auto" style={{ color: "oklch(50% 0.02 248.6)" }}>
            A 30-question assessment across 6 dimensions of professional effectiveness.
            Takes about 5-7 minutes. Your results unlock personalized coaching and practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {PEI_DIMENSIONS.map((dim: any, i: number) => (
            <div key={dim.id} className="bg-white rounded-xl shadow-sm border p-4" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0" style={{ background: "var(--color-ln-navy)" }}>
                  <span className="text-xs font-bold" style={{ color: "#d4af37" }}>{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{dim.label}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>{dim.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={handleStart}
            disabled={startAssessment.isPending}
            style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}
            className="px-8"
          >
            {startAssessment.isPending ? "Starting..." : "Begin Assessment"}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── ASSESSMENT VIEW ──────────────────────────────────────────────────────
  if (viewState === "assessment" && assessment.data) {
    const question = assessment.data.questions[currentQ];
    const progress = ((currentQ + 1) / assessment.data.totalQuestions) * 100;
    const dimension = PEI_DIMENSIONS.find((d: any) => d.id === question.dimensionId);

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "oklch(55% 0.02 248.6)" }}>
              Question {currentQ + 1} of {assessment.data.totalQuestions}
            </span>
            <span className="text-xs font-medium" style={{ color: "#d4af37" }}>{dimension?.label}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(90% 0.02 248.6)" }}>
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "var(--color-ln-navy)" }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <p className="text-lg font-medium mb-6" style={{ color: "var(--color-ln-navy)" }}>
            {question.text}
          </p>

          {/* Likert scale */}
          <div className="space-y-2">
            {[
              { value: 1, label: "Strongly Disagree" },
              { value: 2, label: "Disagree" },
              { value: 3, label: "Neutral" },
              { value: 4, label: "Agree" },
              { value: 5, label: "Strongly Agree" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSubmitResponse(opt.value)}
                disabled={submitting}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150 hover:scale-[1.01]"
                style={{
                  background: responses[question.id] === opt.value ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "oklch(96% 0.02 248.6)",
                  border: responses[question.id] === opt.value ? "2px solid var(--color-ln-navy)" : "2px solid transparent",
                  color: responses[question.id] === opt.value ? "var(--color-ln-navy)" : "oklch(40% 0.02 248.6)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 text-xs font-bold"
                  style={{
                    background: responses[question.id] === opt.value ? "var(--color-ln-navy)" : "white",
                    color: responses[question.id] === opt.value ? "#d4af37" : "oklch(55% 0.02 248.6)",
                    border: "1px solid oklch(80% 0.02 248.6)",
                  }}
                >
                  {opt.value}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Back button */}
        {currentQ > 0 && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            >
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── RESULTS VIEW ─────────────────────────────────────────────────────────
  if (viewState === "results" && resultData) {
    const overallScore = Math.round(resultData.overallScore ?? 0);
    const zone = getZone(overallScore);
    const dimScores = (resultData.dimensionScores ?? {}) as Record<string, number>;
    const sortedDims = Object.entries(dimScores).sort(([, a], [, b]) => b - a);
    const analysis = resultData.llmAnalysis as any;
    const devPlan = resultData.developmentPlan as any;

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Score header */}
        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#d4af37" }}>Your PEI Score</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-5xl md:text-6xl font-bold" style={{ color: "#d4af37" }}>{overallScore}</div>
            <div className="text-left">
              <div className="text-lg font-semibold text-white">{zone.label}</div>
              <div className="text-xs" style={{ color: "oklch(65% 0.02 248.6)" }}>out of 100</div>
            </div>
          </div>
          {analysis?.headline && (
            <p className="text-sm mt-4 max-w-xl mx-auto" style={{ color: "oklch(75% 0.02 248.6)" }}>
              "{analysis.headline}"
            </p>
          )}
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>PEI Radar Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={sortedDims.map(([dimId, score]) => ({
              dimension: PEI_DIMENSIONS.find((d: any) => d.id === dimId)?.label ?? dimId,
              score: Math.round(score),
              fullMark: 100,
            }))}>
              <PolarGrid stroke="oklch(90% 0.02 248.6)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: "oklch(40% 0.02 248.6)", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "oklch(55% 0.02 248.6)", fontSize: 9 }} />
              <Radar
                name="PEI Score"
                dataKey="score"
                stroke="#0A1A2F"
                fill="#d4af37"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid oklch(90% 0.02 248.6)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension scores */}
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Dimension Breakdown</h3>
          <div className="space-y-3">
            {sortedDims.map(([dimId, score]) => {
              const dim = PEI_DIMENSIONS.find((d: any) => d.id === dimId);
              const dimZone = getZone(score);
              return (
                <div key={dimId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{dim?.label ?? dimId}</span>
                    <span className="text-sm font-bold" style={{ color: dimZone.color }}>{Math.round(score)}/100</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(93% 0.02 248.6)" }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${score}%`, background: dimZone.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis */}
        {analysis && (
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>AI Coaching Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.strengths && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#22c55e" }}>Strengths</p>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.growthAreas && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#f97316" }}>Growth Areas</p>
                  <ul className="space-y-1">
                    {analysis.growthAreas.map((s: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                        <TrendingUp size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#f97316" }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {analysis.careerImplications && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid oklch(90% 0.02 248.6)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Career Implications</p>
                <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{analysis.careerImplications}</p>
              </div>
            )}
            {analysis.blindSpots && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#ef4444" }}>Blind Spots</p>
                <ul className="space-y-1">
                  {analysis.blindSpots.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 90-Day Development Timeline */}
        {devPlan?.weeklyMilestones && Array.isArray(devPlan.weeklyMilestones) && devPlan.weeklyMilestones.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>90-Day Development Timeline</h3>
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5" style={{ background: "oklch(85% 0.02 248.6)" }} />
              {devPlan.weeklyMilestones.map((m: any, i: number) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  {/* Dot */}
                  <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2" style={{ background: i === 0 ? "#d4af37" : "white", borderColor: "#d4af37" }} />
                  <div className="ml-4">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d4af37" }}>Week {m.week}</p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-ln-navy)" }}>{m.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Development Plan */}
        {devPlan?.focusAreas && (
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>90-Day Development Plan</h3>
            <div className="space-y-4">
              {devPlan.focusAreas.map((area: any, i: number) => (
                <div key={i} className="rounded-xl p-4" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)" }}>
                  <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{area.dimension}</p>
                  <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>{area.goal}</p>
                  <ul className="mt-2 space-y-1">
                    {area.actions?.map((a: string, j: number) => (
                      <li key={j} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                        <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#d4af37" }} />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2" style={{ color: "oklch(55% 0.02 248.6)" }}>Timeline: {area.timeline}</p>
                </div>
              ))}
            </div>
            {devPlan.successIndicators && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid oklch(90% 0.02 248.6)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#d4af37" }}>Success Indicators</p>
                <ul className="space-y-1">
                  {devPlan.successIndicators.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                      <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#d4af37" }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-4">
          <p className="text-sm mb-3" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Ready to start developing? Your coach is waiting.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/pe/coach">
              <Button style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
                Start Coaching
              </Button>
            </a>
            <a href="/pe/practice">
              <Button variant="outline" style={{ borderColor: "var(--color-ln-navy)", color: "var(--color-ln-navy)" }}>
                Practice a Scenario
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
