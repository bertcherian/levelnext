import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, BarChart3, Clock, Loader2, History, TrendingUp, Calendar, Info } from "lucide-react";
import { toast } from "sonner";
import DiagnosticRadarChart from "@/components/DiagnosticRadarChart";
import { exportMepReportPdf, type MepReportFactor } from "@/lib/mepReportPdf";
import { MepReportDetails, MepReportDownloadButton } from "@/components/mep/ManagerDiagnosticReportDetails";

const LOGO_URL = "/logo.png";

const SCORE_LABELS: Record<number, string> = {
  1: "Strongly Disagree", 2: "Disagree", 3: "Somewhat Disagree",
  4: "Neutral", 5: "Somewhat Agree", 6: "Agree", 7: "Strongly Agree",
};

type ViewMode = "hub" | "taking" | "results" | "history";

export default function ManagerDiagnostics() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<ViewMode>("hub");
  const [activeDiagCode, setActiveDiagCode] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [latestDiagCode, setLatestDiagCode] = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [historyResult, setHistoryResult] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Store the last submission payload so we can retry on failure
  const lastSubmissionRef = useRef<{ code: string; responses: Record<string, number> } | null>(null);

  const { data: diagnostics } = trpc.mep.getDiagnostics.useQuery();
  const { data: myResults, refetch: refetchResults } = trpc.mep.getMyResults.useQuery();
  const { data: diagDetail } = trpc.mep.getDiagnosticDetail.useQuery(
    { code: activeDiagCode! },
    { enabled: !!activeDiagCode && view === "taking" }
  );

  const submitMutation = trpc.mep.submitDiagnostic.useMutation({
    onSuccess: (data) => {
      setLatestResult({ ...data, diagnosticCode: activeDiagCode });
      setLatestDiagCode(activeDiagCode);
      setView("results");
      refetchResults();
      toast.success("Diagnostic complete! Your results are ready.");
    },
    onError: (err: any) => {
      console.error("[MEP] submitDiagnostic error:", err);
      const isValidation = err?.message?.includes("max") || err?.message?.includes("expected");
      const msg = isValidation
        ? "Invalid response value. Please contact support."
        : "Could not submit diagnostic. Please try again.";
      toast.error(msg, {
        duration: 10000,
        action: {
          label: "Retry",
          onClick: () => {
            if (lastSubmissionRef.current) {
              handleSubmitWithPayload(lastSubmissionRef.current.code, lastSubmissionRef.current.responses);
            }
          },
        },
      });
    },
  });

  const startDiagnostic = (code: string) => {
    setActiveDiagCode(code);
    setAnswers({});
    setCurrentQ(0);
    setView("taking");
  };

  const handleAnswer = (questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (diagDetail && currentQ < diagDetail.questions.length - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 300);
    }
  };

  const handleSubmitWithPayload = useCallback(async (code: string, responses: Record<string, number>) => {
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({ code, responses });
    } finally {
      setSubmitting(false);
    }
  }, [submitMutation]);

  const handleSubmit = async () => {
    if (!activeDiagCode || !diagDetail) return;
    const missing = diagDetail.questions.filter((q: any) => !answers[q.id]);
    if (missing.length > 0) {
      toast.error(`Please answer all ${missing.length} remaining questions.`);
      return;
    }
    lastSubmissionRef.current = { code: activeDiagCode, responses: answers };
    handleSubmitWithPayload(activeDiagCode, answers);
  };

  const getResultForDiag = (code: string) =>
    myResults?.find((r: any) => r.diagnosticCode === code);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#f59e0b";
    return "#f87171";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Strong";
    if (score >= 50) return "Developing";
    return "Needs Focus";
  };

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Hub view ──────────────────────────────────────────────────────────────
  if (view === "hub") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
              Management Diagnostics
            </h1>
            <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
              Assess your effectiveness across 10 management dimensions. Each diagnostic takes 5–10 minutes.
            </p>
          </div>

          {/* Overall score if any results */}
          {myResults && myResults.length > 0 && (
            <div
              className="rounded-2xl px-6 py-5 flex items-center gap-6"
              style={{ background: "var(--color-ln-navy)" }}
            >
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#34d399" }}>
                  Overall Management Score
                </p>
                <p className="text-3xl font-bold text-white">
                  {Math.round(myResults.reduce((sum: number, r: any) => sum + r.overallScore, 0) / myResults.length)}
                  <span className="text-base font-normal ml-1" style={{ color: "oklch(60% 0.02 248.6)" }}>/100</span>
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(60% 0.02 248.6)" }}>
                  Based on {myResults.length} of {diagnostics?.length ?? 10} diagnostics completed
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <BarChart3 size={32} style={{ color: "#34d399", opacity: 0.6 }} />
              </div>
            </div>
          )}

          {/* History button */}
          {myResults && myResults.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold"
              onClick={() => setView("history")}
            >
              <History size={14} className="mr-1.5" />
              View Diagnostic History ({myResults.length} completed)
            </Button>
          )}

          {/* Diagnostic cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagnostics?.map((diag: any) => {
              const result = getResultForDiag(diag.code);
              const isCompleted = !!result;
              return (
                <div
                  key={diag.code}
                  className="rounded-2xl p-5 border"
                  style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isCompleted
                          ? <CheckCircle2 size={14} style={{ color: "#34d399" }} />
                          : <Clock size={14} style={{ color: "oklch(60% 0.02 248.6)" }} />}
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: isCompleted ? "#34d399" : "oklch(60% 0.02 248.6)" }}>
                          {isCompleted ? "Completed" : `${diag.questionCount} questions`}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                        {diag.title}
                      </h3>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>
                        {diag.description}
                      </p>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "oklch(45% 0.02 248.6)" }}>Score</span>
                        <span className="text-sm font-bold" style={{ color: getScoreColor(result.overallScore) }}>
                          {result.overallScore}/100
                        </span>
                      </div>
                      <Progress value={result.overallScore} className="h-1.5" />
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={isCompleted ? "outline" : "default"}
                    className="w-full text-xs font-semibold"
                    style={isCompleted
                      ? {}
                      : { background: "#34d399", color: "var(--color-ln-navy)" }}
                    onClick={() => startDiagnostic(diag.code)}
                  >
                    {isCompleted ? "Retake Diagnostic" : "Start Diagnostic"}
                    <ChevronRight size={12} className="ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Taking view ───────────────────────────────────────────────────────────
  if (view === "taking" && diagDetail) {
    const questions = diagDetail.questions;
    const q = questions[currentQ];
    const activeFactor = diagDetail.dimensions.find((dimension: any) => dimension.id === q.dimensionId);
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;
    const allAnswered = answeredCount === questions.length;

    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>
                {diagDetail.title}
              </h1>
              <span className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Submitting overlay — full-card spinner */}
          {submitting && (
            <div
              className="rounded-2xl p-8 flex flex-col items-center justify-center gap-4"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                  Generating your diagnostic report…
                </p>
                <p className="text-xs mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  Analysing responses and preparing AI insights. This takes a few seconds.
                </p>
              </div>
              {/* Shimmer progress bar */}
              <div className="w-full max-w-xs mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-primary/40 animate-[shimmer_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Current question — hidden while submitting */}
          {!submitting && (
            <div
              className="rounded-2xl p-6"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>
                Question {currentQ + 1} of {questions.length}
              </p>
              <p className="text-sm font-medium mb-6 leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>
                {q.text}
              </p>
              {activeFactor && (
                <div className="rounded-xl px-4 py-3 mb-5 flex gap-3" style={{ background: "oklch(from #0A1A2F l c h / 0.04)", border: "1px solid oklch(from #0A1A2F l c h / 0.1)" }}>
                  <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-ln-navy)" }} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-ln-navy)" }}>
                      Measuring: {activeFactor.label}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(42% 0.02 248.6)" }}>
                      {activeFactor.description}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => {
                  const isSelected = answers[q.id] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => handleAnswer(q.id, val)}
                      className="flex flex-col items-center gap-1 rounded-xl py-3 transition-all duration-150"
                      style={{
                        background: isSelected ? "#34d399" : "oklch(96% 0.01 248.6)",
                        border: `1px solid ${isSelected ? "#34d399" : "oklch(88% 0.01 248.6)"}`,
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: isSelected ? "var(--color-ln-navy)" : "oklch(45% 0.02 248.6)" }}>
                        {val}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>Strongly Disagree</span>
                <span className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>Strongly Agree</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0 || submitting}
            >
              Previous
            </Button>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {questions.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  disabled={submitting}
                  className="w-6 h-6 rounded-full text-[10px] font-bold transition-all"
                  style={{
                    background: answers[questions[i].id]
                      ? "#34d399"
                      : i === currentQ
                        ? "var(--color-ln-navy)"
                        : "oklch(88% 0.01 248.6)",
                    color: answers[questions[i].id] || i === currentQ ? "white" : "oklch(45% 0.02 248.6)",
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {currentQ < questions.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentQ((q) => q + 1)}
                disabled={submitting}
                style={{ background: "var(--color-ln-navy)", color: "white" }}
              >
                Next
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Analysing…
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </div>

          <button
            className="text-xs text-center w-full"
            style={{ color: "oklch(55% 0.02 248.6)" }}
            onClick={() => { setView("hub"); setActiveDiagCode(null); }}
            disabled={submitting}
          >
            ← Back to Diagnostics
          </button>
        </div>
      </div>
    );
  }

  // ── History view ──────────────────────────────────────────────────────────
  if (view === "history") {
    const sortedResults = [...(myResults ?? [])].sort(
      (a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                Diagnostic History
              </h1>
              <p className="text-sm" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Your past Manager Effectiveness diagnostic scores and reports.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("hub")}
            >
              ← Back to Diagnostics
            </Button>
          </div>

          {/* Summary stats */}
          {sortedResults.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <TrendingUp size={18} className="mx-auto mb-1" style={{ color: "var(--color-ln-navy)" }} />
                <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {Math.round(sortedResults.reduce((s: number, r: any) => s + r.overallScore, 0) / sortedResults.length)}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  Avg Score
                </p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <CheckCircle2 size={18} className="mx-auto mb-1" style={{ color: "#34d399" }} />
                <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {sortedResults.length}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  Completed
                </p>
              </div>
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <Calendar size={18} className="mx-auto mb-1" style={{ color: "#f59e0b" }} />
                <p className="text-sm font-bold mt-2" style={{ color: "var(--color-ln-navy)" }}>
                  {formatDate(sortedResults[0].completedAt)}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  Most Recent
                </p>
              </div>
            </div>
          )}

          {/* History list */}
          <div className="space-y-3">
            {sortedResults.length === 0 && (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <History size={32} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
                <p className="text-sm font-medium" style={{ color: "oklch(45% 0.02 248.6)" }}>
                  No diagnostics completed yet. Take your first diagnostic to see your scores here.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                  onClick={() => setView("hub")}
                >
                  Browse Diagnostics
                </Button>
              </div>
            )}

            {sortedResults.map((r: any) => {
              const diag = diagnostics?.find((d: any) => d.code === r.diagnosticCode);
              const dimArray = r.dimensionScores
                ? (Array.isArray(r.dimensionScores)
                    ? r.dimensionScores
                    : Object.entries(r.dimensionScores).map(([dim, score]: [string, any]) => ({ dimension: dim, score: typeof score === "number" ? score : Number(score) })))
                : [];
              return (
                <div
                  key={r.id}
                  className="rounded-2xl p-5"
                  style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "oklch(55% 0.02 248.6)" }}>
                          {formatDate(r.completedAt)}
                        </span>
                        {r.zone && (
                          <span
                            className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{
                              background: getScoreColor(r.overallScore) + "15",
                              color: getScoreColor(r.overallScore),
                            }}
                          >
                            {r.zone}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                        {diag?.title ?? r.diagnosticCode}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: getScoreColor(r.overallScore) }}>
                        {r.overallScore}
                        <span className="text-xs font-normal ml-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>/100</span>
                      </p>
                      <p className="text-[10px] font-semibold" style={{ color: getScoreColor(r.overallScore) }}>
                        {getScoreLabel(r.overallScore)}
                      </p>
                    </div>
                  </div>

                  {/* Dimension mini-bars */}
                  {dimArray.length > 0 && (
                    <div className="space-y-1.5 mt-3">
                      {dimArray.map((d: any) => (
                        <div key={d.dimension} className="flex items-center gap-2">
                          <span className="text-[10px] w-28 truncate" style={{ color: "oklch(45% 0.02 248.6)" }}>
                            {d.dimension}
                          </span>
                          <Progress value={d.score} className="h-1 flex-1" />
                          <span className="text-[10px] font-bold w-8 text-right" style={{ color: getScoreColor(d.score) }}>
                            {d.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI insight headline preview */}
                  {r.llmAnalysis?.headline && (
                    <p className="text-xs italic mt-3 pt-3" style={{ color: "oklch(45% 0.02 248.6)", borderTop: "1px solid oklch(92% 0.01 248.6)" }}>
                      "{r.llmAnalysis.headline}"
                    </p>
                  )}

                  {/* View full report button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-xs font-semibold"
                    onClick={() => {
                      setHistoryResult(r);
                      setView("results");
                    }}
                  >
                    View Full Report
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Results view ──────────────────────────────────────────────────────────
  const displayResult = historyResult || latestResult;
  if (view === "results" && displayResult) {
    const diag = diagnostics?.find((d: any) => d.code === displayResult.diagnosticCode);
    const dimArray = displayResult.dimensionScores
      ? (Array.isArray(displayResult.dimensionScores)
          ? displayResult.dimensionScores
          : Object.entries(displayResult.dimensionScores).map(([dim, score]: [string, any]) => ({ dimension: dim, score: typeof score === "number" ? score : Number(score) })))
      : [];
    const factorReports: MepReportFactor[] = Array.isArray(displayResult.llmAnalysis?.factorReports)
      ? displayResult.llmAnalysis.factorReports
      : dimArray.map((dimension: any) => {
          const score = dimension.score ?? 0;
          const label = String(dimension.dimension).replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
          const status: MepReportFactor["status"] = score >= 75 ? "Strength" : score >= 60 ? "Foundation" : "Priority";
          return {
            label,
            score,
            status,
            definition: `This factor captures the consistency and quality of your management practice in ${label.toLowerCase()}.`,
            whyItMatters: `${label} enables the team to operate with greater clarity, confidence, and consistency.`,
            strength: score >= 75 ? `${label} is a reliable asset in your current management approach.` : `You have a workable base in ${label.toLowerCase()} that can become more consistent.`,
            weakness: score < 60 ? "This factor is a development priority because inconsistency may create avoidable uncertainty for the team." : "Protect this factor by applying it consistently when conditions are demanding.",
            action: `Choose one upcoming management moment to make ${label.toLowerCase()} more explicit, then ask your team what changed.`,
          };
        });
    const developmentActions = Array.isArray(displayResult.llmAnalysis?.learningPath) && displayResult.llmAnalysis.learningPath.length > 0
      ? displayResult.llmAnalysis.learningPath.slice(0, 3)
      : factorReports
          .slice()
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map((factor, index) => ({
            priority: index + 1,
            focus: factor.label,
            action: factor.action,
            timeframe: `${(index + 1) * 10} days`,
            successSignal: `Ask the team for evidence that ${factor.label.toLowerCase()} is becoming more consistent.`,
          }));

    const handleDownloadReport = async () => {
      if (!diag) return;
      setIsExporting(true);
      try {
        await exportMepReportPdf({
          diagnosticTitle: diag.title,
          overallScore: displayResult.overallScore,
          zone: displayResult.zone,
          headline: displayResult.llmAnalysis?.headline,
          strengths: displayResult.llmAnalysis?.strengths ?? [],
          risks: displayResult.llmAnalysis?.risks ?? [],
          factorReports,
          learningPath: displayResult.llmAnalysis?.learningPath ?? [],
          coachQuestion: displayResult.llmAnalysis?.coachQuestion,
        });
        toast.success("Your Manager Effectiveness report has been downloaded.");
      } catch (error) {
        console.error("[MEP] Report export failed:", error);
        toast.error("We could not download the report. Please try again.");
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div
            className="rounded-2xl px-6 py-6 text-center"
            style={{ background: "var(--color-ln-navy)" }}
          >
            <img src={LOGO_URL} alt="LevelNext" style={{ height: "40px", width: "auto", objectFit: "contain", margin: "0 auto 12px" }} />
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "#34d399" }} />
            <h1 className="text-xl font-bold text-white mb-1">Diagnostic Complete</h1>
            <p className="text-sm mb-4" style={{ color: "oklch(70% 0.02 248.6)" }}>
              {diag?.title ?? "Management Diagnostic"}
            </p>
            <div className="text-4xl font-bold mb-1" style={{ color: getScoreColor(displayResult.overallScore) }}>
              {displayResult.overallScore}
              <span className="text-lg font-normal ml-1 text-white/50">/100</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: getScoreColor(displayResult.overallScore) }}>
              {getScoreLabel(displayResult.overallScore)}
            </p>
            <MepReportDownloadButton onClick={handleDownloadReport} isExporting={isExporting} disabled={!diag} />
          </div>

          {/* Dimension scores — radar chart + bar breakdown */}
          {dimArray.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
                Dimension Breakdown
              </h2>

              {/* Radar chart */}
              <div className="mb-6">
                <DiagnosticRadarChart
                  dimensions={dimArray}
                  height={260}
                />
              </div>

              {/* Bar breakdown */}
              <div className="space-y-3">
                {dimArray.map((d: any) => (
                  <div key={d.dimension}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--color-ln-navy)" }}>{d.dimension}</span>
                      <span className="text-xs font-bold" style={{ color: getScoreColor(d.score) }}>{d.score}/100</span>
                    </div>
                    <Progress value={d.score} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <MepReportDetails factorReports={factorReports} developmentActions={developmentActions} />

          {/* AI Insights */}
          {displayResult.llmAnalysis?.headline && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>
                AI Insights
              </h2>
              <p className="text-sm leading-relaxed font-medium mb-3" style={{ color: "oklch(25% 0.02 248.6)" }}>
                {displayResult.llmAnalysis.headline}
              </p>
              {displayResult.llmAnalysis.coachQuestion && (
                <div className="rounded-xl px-4 py-3 mt-3" style={{ background: "oklch(from #34d399 l c h / 0.06)", border: "1px solid oklch(from #34d399 l c h / 0.15)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#34d399" }}>Coaching Question</p>
                  <p className="text-sm italic" style={{ color: "oklch(35% 0.02 248.6)" }}>"{displayResult.llmAnalysis.coachQuestion}"</p>
                </div>
              )}
            </div>
          )}

          {/* Top strengths & growth areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayResult.llmAnalysis?.strengths && displayResult.llmAnalysis.strengths.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(from #34d399 l c h / 0.06)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>Top Strengths</h3>
                <ul className="space-y-2">
                  {displayResult.llmAnalysis.strengths.slice(0, 3).map((s: any, i: number) => (
                    <li key={i} className="text-xs" style={{ color: "oklch(30% 0.02 248.6)" }}>
                      <span className="font-semibold" style={{ color: "#34d399" }}>✓ {s.title}</span><br />{s.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {displayResult.llmAnalysis?.risks && displayResult.llmAnalysis.risks.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(from #f59e0b l c h / 0.06)", border: "1px solid oklch(from #f59e0b l c h / 0.2)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Growth Areas</h3>
                <ul className="space-y-2">
                  {displayResult.llmAnalysis.risks.slice(0, 3).map((s: any, i: number) => (
                    <li key={i} className="text-xs" style={{ color: "oklch(30% 0.02 248.6)" }}>
                      <span className="font-semibold" style={{ color: "#f59e0b" }}>→ {s.title}</span><br />{s.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 font-semibold"
              onClick={() => {
                setHistoryResult(null);
                setView("history");
              }}
            >
              ← Back to History
            </Button>
            <Button
              className="flex-1 font-semibold"
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              onClick={() => {
                if (displayResult?.llmAnalysis?.coachQuestion && !historyResult) {
                  setShowReflection(true);
                } else {
                  setHistoryResult(null);
                  navigate("/manager");
                }
              }}
            >
              Back to Home
            </Button>
          </div>

          {/* Reflection modal overlay */}
          {showReflection && displayResult?.llmAnalysis?.coachQuestion && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "oklch(0% 0 0 / 0.6)" }}
            >
              <div
                className="w-full max-w-md rounded-2xl px-8 py-8 text-center"
                style={{ background: "var(--color-ln-navy)", border: "1px solid oklch(from #34d399 l c h / 0.3)" }}
              >
                <img src={LOGO_URL} alt="LevelNext" style={{ height: "36px", width: "auto", objectFit: "contain", margin: "0 auto 16px" }} />
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>Reflection Moment</p>
                <p className="text-lg font-semibold text-white leading-relaxed mb-2">
                  Before you go, sit with this question:
                </p>
                <p className="text-base italic leading-relaxed mb-6" style={{ color: "oklch(80% 0.02 248.6)" }}>
                  "{displayResult.llmAnalysis.coachQuestion}"
                </p>
                <p className="text-xs mb-6" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  Take 60 seconds to reflect before moving on.
                </p>
                <Button
                  className="w-full font-semibold"
                  style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                  onClick={() => { setShowReflection(false); navigate("/manager"); }}
                >
                  I've reflected — take me home
                </Button>
                <button
                  className="mt-3 text-xs"
                  style={{ color: "oklch(50% 0.02 248.6)" }}
                  onClick={() => { setShowReflection(false); navigate("/manager"); }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
