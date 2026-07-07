import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

const LOGO_URL = "/manus-storage/levelnext-logo_525d7189.png";

const MODULE_META: Record<string, { label: string; description: string; color: string }> = {
  eci: { label: "Executive Communication", description: "Understand how you communicate, influence, and command presence.", color: "#12345A" },
  lii: { label: "Leadership Influence", description: "Measure your ability to lead through trust and influence.", color: "#1a4a7a" },
  gcc: { label: "GCC Readiness", description: "Assess your organisation's strategic readiness as a GCC.", color: "#0f2d4a" },
};

const SCALE_LABELS: Record<number, string> = {
  1: "Strongly Disagree",
  2: "Disagree",
  3: "Neutral",
  4: "Agree",
  5: "Strongly Agree",
};

export default function Assessment() {
  const params = useParams<{ moduleType: string }>();
  const moduleType = params.moduleType?.toLowerCase() ?? "eci";
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: questions, isLoading: questionsLoading } = trpc.assessment.getQuestions.useQuery(
    { moduleType: moduleType.toUpperCase() as "ECI" | "LII" | "GCC" },
    { enabled: isAuthenticated }
  );

  const submitAssessment = trpc.assessment.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
    },
    onError: () => toast.error("Could not submit your diagnostic. Please try again."),
  });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const meta = MODULE_META[moduleType] ?? MODULE_META.eci;
  // Normalize questions from any module shape into a flat array
  const allQuestions: { id: string; text: string }[] = useMemo(() => {
    if (!questions) return [];
    if (Array.isArray(questions)) return questions as { id: string; text: string }[];
    const q = questions as { questions?: { id: string; text: string }[] };
    return q.questions ?? [];
  }, [questions]);
  const totalQ = allQuestions.length;
  const progress = totalQ > 0 ? Math.round((currentQ / totalQ) * 100) : 0;
  const currentQuestion = allQuestions[currentQ];

  const handleAnswer = (value: number) => {
    if (!currentQuestion) return;
    const newResponses = { ...responses, [currentQuestion.id]: value };
    setResponses(newResponses);
    if (currentQ < totalQ - 1) {
      setTimeout(() => setCurrentQ((q) => q + 1), 200);
    }
  };

  const handleSubmit = () => {
    submitAssessment.mutate({
      sessionId: 0,
      moduleType: moduleType.toUpperCase() as "ECI" | "LII" | "GCC",
      responses,
      participantName: user?.name ?? "Leader",
      participantEmail: user?.email ?? "leader@levelnext.com",
    });
  };

  const answeredCount = Object.keys(responses).length;
  const isLastQuestion = currentQ === totalQ - 1;
  const currentAnswer = currentQuestion ? responses[currentQuestion.id] : undefined;

  if (loading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-navy)" }} />
      </div>
    );
  }

  // Completion screen
  if (submitted && result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in"
        style={{ background: "var(--color-ln-navy)" }}>
        <img src={LOGO_URL} alt="LevelNext" className="h-10 w-auto mb-10" />
        <div className="w-full max-w-lg text-center">
          <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 mx-auto mb-6"
            style={{ borderColor: "var(--color-ln-yellow)" }}>
            <span className="text-3xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>
              {Math.round(result.edgeScore)}
            </span>
            <span className="text-xs" style={{ color: "oklch(65% 0.02 248.6)" }}>Edge</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Your Insight is ready.</h1>
          <p className="text-base mb-2" style={{ color: "oklch(75% 0.02 248.6)" }}>
            {meta.label}
          </p>
          {result.archetype && (
            <p className="text-lg font-semibold mb-6" style={{ color: "var(--color-ln-yellow)" }}>
              {result.archetype}
            </p>
          )}
          {result.zone && (
            <p className="text-sm mb-8" style={{ color: "oklch(65% 0.02 248.6)" }}>{result.zone}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/my-edge")}
              className="font-semibold h-12 px-8"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              View My Edge
            </Button>
            <Button
              onClick={() => navigate("/guide")}
              variant="outline"
              className="font-semibold h-12 px-8 border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent">
              Talk to Guide
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b"
        style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
        <button onClick={() => navigate("/diagnostics")} className="flex items-center gap-2 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--color-ln-muted)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <img src={LOGO_URL} alt="LevelNext" className="h-7 w-auto" />
        <span className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
          {answeredCount}/{totalQ}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: "var(--color-ln-border)" }}>
        <div className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--color-ln-yellow)" }} />
      </div>

      {/* Module info */}
      <div className="px-6 py-5 text-center border-b" style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}>
          {moduleType.toUpperCase()}
        </span>
        <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-ln-navy)" }}>{meta.label}</p>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl animate-fade-in" key={currentQ}>
          {currentQuestion ? (
            <>
              <p className="text-xs font-medium mb-4 text-center" style={{ color: "var(--color-ln-muted)" }}>
                Question {currentQ + 1} of {totalQ}
              </p>
              <h2 className="text-xl font-semibold text-center mb-10 leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>
                {currentQuestion.text}
              </h2>

              {/* Likert scale */}
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAnswer(val)}
                    className="w-full rounded-xl px-5 py-4 text-left flex items-center gap-4 transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: currentAnswer === val ? "var(--color-ln-navy)" : "white",
                      border: `1.5px solid ${currentAnswer === val ? "var(--color-ln-navy)" : "var(--color-ln-border)"}`,
                      boxShadow: currentAnswer === val ? "none" : "var(--shadow-sm)",
                    }}
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: currentAnswer === val ? "var(--color-ln-yellow)" : "var(--color-ln-ivory-dark)",
                        color: currentAnswer === val ? "var(--color-ln-navy)" : "var(--color-ln-muted)",
                      }}>
                      {val}
                    </span>
                    <span className="text-sm font-medium"
                      style={{ color: currentAnswer === val ? "white" : "var(--color-ln-text)" }}>
                      {SCALE_LABELS[val]}
                    </span>
                    {currentAnswer === val && <CheckCircle2 size={16} className="ml-auto" style={{ color: "var(--color-ln-yellow)" }} />}
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
                    {submitAssessment.isPending ? <><Loader2 size={16} className="animate-spin mr-2" />Processing…</> : "Get My Insight"}
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
