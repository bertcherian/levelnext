import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, BarChart3, Clock, Lock } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_013311b9.png";

const SCORE_LABELS: Record<number, string> = {
  1: "Strongly Disagree", 2: "Disagree", 3: "Somewhat Disagree",
  4: "Neutral", 5: "Somewhat Agree", 6: "Agree", 7: "Strongly Agree",
};

type ViewMode = "hub" | "taking" | "results";

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
    onError: () => toast.error("Could not submit diagnostic. Please try again."),
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

  const handleSubmit = async () => {
    if (!activeDiagCode || !diagDetail) return;
    const missing = diagDetail.questions.filter((q: any) => !answers[q.id]);
    if (missing.length > 0) {
      toast.error(`Please answer all ${missing.length} remaining questions.`);
      return;
    }
    setSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        code: activeDiagCode,
        responses: answers,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getResultForDiag = (code: string) =>
    myResults?.find((r: any) => r.diagnosticCode === code);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#34d399";
    if (score >= 50) return "#f59e0b";
    return "#f87171";
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

          {/* Current question */}
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

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
            >
              Previous
            </Button>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {questions.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
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
                {submitting ? "Analysing…" : "Submit"}
              </Button>
            )}
          </div>

          <button
            className="text-xs text-center w-full"
            style={{ color: "oklch(55% 0.02 248.6)" }}
            onClick={() => { setView("hub"); setActiveDiagCode(null); }}
          >
            ← Back to Diagnostics
          </button>
        </div>
      </div>
    );
  }

  // ── Results view ──────────────────────────────────────────────────────────
  if (view === "results" && latestResult) {
    const diag = diagnostics?.find((d: any) => d.code === latestResult.diagnosticCode);
    const getScoreLabel = (score: number) => {
      if (score >= 80) return "Excellent";
      if (score >= 65) return "Strong";
      if (score >= 50) return "Developing";
      return "Needs Focus";
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
            <div className="text-4xl font-bold mb-1" style={{ color: getScoreColor(latestResult.overallScore) }}>
              {latestResult.overallScore}
              <span className="text-lg font-normal ml-1 text-white/50">/100</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: getScoreColor(latestResult.overallScore) }}>
              {getScoreLabel(latestResult.overallScore)}
            </p>
          </div>

          {/* Dimension scores */}
          {latestResult.dimensionScores && latestResult.dimensionScores.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
                Dimension Breakdown
              </h2>
              <div className="space-y-3">
                {latestResult.dimensionScores.map((d: any) => (
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

          {/* AI Insights */}
          {latestResult.llmAnalysis?.headline && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>
                AI Insights
              </h2>
              <p className="text-sm leading-relaxed font-medium mb-3" style={{ color: "oklch(25% 0.02 248.6)" }}>
                {latestResult.llmAnalysis.headline}
              </p>
              {latestResult.llmAnalysis.coachQuestion && (
                <div className="rounded-xl px-4 py-3 mt-3" style={{ background: "oklch(from #34d399 l c h / 0.06)", border: "1px solid oklch(from #34d399 l c h / 0.15)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#34d399" }}>Coaching Question</p>
                  <p className="text-sm italic" style={{ color: "oklch(35% 0.02 248.6)" }}>"{latestResult.llmAnalysis.coachQuestion}"</p>
                </div>
              )}
            </div>
          )}

          {/* Top strengths & growth areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestResult.llmAnalysis?.strengths && latestResult.llmAnalysis.strengths.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(from #34d399 l c h / 0.06)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>Top Strengths</h3>
                <ul className="space-y-2">
                  {latestResult.llmAnalysis.strengths.slice(0, 3).map((s: any, i: number) => (
                    <li key={i} className="text-xs" style={{ color: "oklch(30% 0.02 248.6)" }}>
                      <span className="font-semibold" style={{ color: "#34d399" }}>✓ {s.title}</span><br />{s.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {latestResult.llmAnalysis?.risks && latestResult.llmAnalysis.risks.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(from #f59e0b l c h / 0.06)", border: "1px solid oklch(from #f59e0b l c h / 0.2)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>Growth Areas</h3>
                <ul className="space-y-2">
                  {latestResult.llmAnalysis.risks.slice(0, 3).map((s: any, i: number) => (
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
              className="flex-1 font-semibold"
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              onClick={() => {
                if (latestResult?.llmAnalysis?.coachQuestion) {
                  setShowReflection(true);
                } else {
                  navigate("/manager");
                }
              }}
            >
              Back to Home
            </Button>
          </div>

          {/* Reflection modal overlay */}
          {showReflection && latestResult?.llmAnalysis?.coachQuestion && (
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
                  "{latestResult.llmAnalysis.coachQuestion}"
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
