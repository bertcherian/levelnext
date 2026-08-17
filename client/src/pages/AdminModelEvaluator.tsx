import PlatformLayout from "@/components/PlatformLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BarChart3, CheckCircle2, Clock3, Copy, Gauge, Loader2, Scale, ShieldCheck, Sparkles } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PreferredModel = "claude" | "qwen" | "tie" | "neither";

const DEFAULT_SYSTEM_PROMPT = "You are a pragmatic executive coach. Be concise, specific, constructive, and grounded in the context provided.";

type ReviewableEvaluation = {
  preferredModel: PreferredModel | null;
  reviewScores: { clarity: number; usefulness: number; leadershipTone: number } | null;
  reviewerNote: string | null;
};

export function reviewFormValues(evaluation: ReviewableEvaluation | null) {
  return {
    preferredModel: evaluation?.preferredModel ?? "tie",
    clarity: String(evaluation?.reviewScores?.clarity ?? 4),
    usefulness: String(evaluation?.reviewScores?.usefulness ?? 4),
    leadershipTone: String(evaluation?.reviewScores?.leadershipTone ?? 4),
    reviewerNote: evaluation?.reviewerNote ?? "",
  };
}

function formatLatency(latencyMs: number | null) {
  if (latencyMs === null) return "—";
  return latencyMs >= 1_000 ? `${(latencyMs / 1_000).toFixed(1)}s` : `${latencyMs}ms`;
}

function formatTokens(tokens: number | null | undefined) {
  return typeof tokens === "number" ? tokens.toLocaleString() : "—";
}

function EvaluationResponse({
  label,
  model,
  accent,
  response,
  error,
  latencyMs,
  totalTokens,
}: {
  label: string;
  model: string;
  accent: "gold" | "blue";
  response: string | null;
  error: string | null;
  latencyMs: number | null;
  totalTokens: number | null | undefined;
}) {
  const isGold = accent === "gold";
  const copyResponse = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response);
    toast.success(`${label} response copied`);
  };

  return (
    <section className="overflow-hidden rounded-2xl border" style={{ borderColor: isGold ? "oklch(from var(--color-ln-yellow) l c h / .52)" : "oklch(0.63 0.15 245 / .35)", background: "var(--color-card)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: "var(--color-border)", background: isGold ? "oklch(from var(--color-ln-yellow) l c h / .09)" : "oklch(0.63 0.15 245 / .07)" }}>
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl" style={{ background: isGold ? "var(--color-ln-yellow)" : "oklch(0.56 0.15 245)", color: isGold ? "var(--color-ln-navy)" : "white" }}>
            {isGold ? <Sparkles size={18} /> : <Gauge size={18} />}
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>{label}</p>
            <p className="text-xs text-muted-foreground">{model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock3 size={13} />{formatLatency(latencyMs)}</span>
          <span className="inline-flex items-center gap-1"><BarChart3 size={13} />{formatTokens(totalTokens)} tokens</span>
          {response && <Button type="button" onClick={copyResponse} variant="ghost" size="icon" className="size-8" aria-label={`Copy ${label} response`}><Copy size={15} /></Button>}
        </div>
      </div>
      <div className="min-h-80 p-5 text-sm leading-7 whitespace-pre-wrap" style={{ color: "var(--color-ln-charcoal)" }}>
        {response || (error ? <p className="rounded-lg bg-red-50 p-3 text-red-700"><strong>{label} could not complete:</strong> {error}</p> : <p className="italic text-muted-foreground">Run the comparison to see this model’s response.</p>)}
      </div>
    </section>
  );
}

export default function AdminModelEvaluator() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState("700");
  const [temperature, setTemperature] = useState("0.3");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [preferredModel, setPreferredModel] = useState<PreferredModel>("tie");
  const [clarity, setClarity] = useState("4");
  const [usefulness, setUsefulness] = useState("4");
  const [leadershipTone, setLeadershipTone] = useState("4");
  const [reviewerNote, setReviewerNote] = useState("");

  const { data: evaluations = [], isLoading: isLoadingHistory } = trpc.modelEvaluation.list.useQuery({ limit: 12 }, { enabled: user?.role === "admin" });
  const selectedEvaluation = useMemo(
    () => evaluations.find((evaluation) => evaluation.id === selectedId) ?? evaluations[0] ?? null,
    [evaluations, selectedId]
  );

  useEffect(() => {
    const values = reviewFormValues(selectedEvaluation);
    setPreferredModel(values.preferredModel);
    setClarity(values.clarity);
    setUsefulness(values.usefulness);
    setLeadershipTone(values.leadershipTone);
    setReviewerNote(values.reviewerNote);
  }, [selectedEvaluation?.id]);

  const runMutation = trpc.modelEvaluation.run.useMutation({
    onSuccess: (evaluation) => {
      setSelectedId(evaluation.id);
      utils.modelEvaluation.list.invalidate();
      toast.success(evaluation.status === "completed" ? "Comparison completed" : "Comparison saved with a partial result");
    },
    onError: (error) => toast.error(error.message || "Unable to run the comparison"),
  });

  const reviewMutation = trpc.modelEvaluation.review.useMutation({
    onSuccess: (evaluation) => {
      setSelectedId(evaluation.id);
      utils.modelEvaluation.list.invalidate();
      toast.success("Reviewer decision saved");
    },
    onError: (error) => toast.error(error.message || "Unable to save the review"),
  });

  const startComparison = () => {
    const parsedMaxTokens = Number(maxTokens);
    const parsedTemperature = Number(temperature);
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      toast.error("Add both a system prompt and a test prompt before running.");
      return;
    }
    runMutation.mutate({
      systemPrompt: systemPrompt.trim(),
      userPrompt: userPrompt.trim(),
      maxTokens: Number.isInteger(parsedMaxTokens) ? parsedMaxTokens : 700,
      temperature: Number.isFinite(parsedTemperature) ? parsedTemperature : 0.3,
    });
  };

  const saveReview = () => {
    if (!selectedEvaluation) return;
    reviewMutation.mutate({
      evaluationId: selectedEvaluation.id,
      preferredModel,
      reviewScores: {
        clarity: Number(clarity),
        usefulness: Number(usefulness),
        leadershipTone: Number(leadershipTone),
      },
      reviewerNote: reviewerNote.trim() || undefined,
    });
  };

  if (loading) {
    return <PlatformLayout><div className="mx-auto max-w-7xl px-4 py-10"><Skeleton className="h-96 rounded-2xl" /></div></PlatformLayout>;
  }

  if (user?.role !== "admin") {
    return (
      <PlatformLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto mb-4 size-10" style={{ color: "var(--color-ln-yellow)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Admin access required</h1>
          <p className="mt-2 text-muted-foreground">Model comparisons are restricted to platform administrators because prompts and outputs are stored for quality review.</p>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 pb-16">
        <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "oklch(from var(--color-ln-yellow) l c h / .14)", color: "var(--color-ln-navy)" }}>
              <Scale size={14} /> ADMIN QUALITY LAB
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-ln-navy)" }}>Model evaluator</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Send the same coaching prompt to Claude Haiku and Qwen3-30B-A3B, inspect the response quality side-by-side, and retain a structured decision for future routing.</p>
          </div>
          <div className="rounded-xl border px-4 py-3 text-xs leading-5 text-muted-foreground" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <strong className="block" style={{ color: "var(--color-ln-navy)" }}>Privacy boundary</strong>
            Use anonymised test prompts only. Results are saved for review.
          </div>
        </header>

        <section className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="evaluator-system">System prompt</Label>
              <Textarea id="evaluator-system" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} className="min-h-28 resize-y" maxLength={8000} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evaluator-prompt">Test prompt</Label>
              <Textarea id="evaluator-prompt" value={userPrompt} onChange={(event) => setUserPrompt(event.target.value)} className="min-h-28 resize-y" placeholder="Paste an anonymised coaching, report, or analysis prompt…" maxLength={12000} />
            </div>
            <div className="flex gap-3 lg:flex-col">
              <div className="space-y-2"><Label htmlFor="evaluator-max-tokens">Max output</Label><Input id="evaluator-max-tokens" type="number" min="64" max="2000" value={maxTokens} onChange={(event) => setMaxTokens(event.target.value)} className="w-28" /></div>
              <div className="space-y-2"><Label htmlFor="evaluator-temperature">Temperature</Label><Input id="evaluator-temperature" type="number" min="0" max="1" step="0.1" value={temperature} onChange={(event) => setTemperature(event.target.value)} className="w-28" /></div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs text-muted-foreground">Both models receive the same system prompt, user prompt, output cap, and temperature. Qwen runs in non-thinking mode for a Haiku-class speed comparison.</p>
            <Button type="button" onClick={startComparison} disabled={runMutation.isPending} className="min-w-44" style={{ background: "var(--color-ln-navy)", color: "white" }}>
              {runMutation.isPending ? <><Loader2 className="mr-2 size-4 animate-spin" />Running both models</> : <><Scale className="mr-2 size-4" />Run comparison</>}
            </Button>
          </div>
        </section>

        {selectedEvaluation ? (
          <>
            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              <EvaluationResponse label="Claude Haiku" model={selectedEvaluation.claudeModel} accent="gold" response={selectedEvaluation.claudeResponse} error={selectedEvaluation.claudeError} latencyMs={selectedEvaluation.claudeLatencyMs} totalTokens={selectedEvaluation.claudeUsage?.totalTokens} />
              <EvaluationResponse label="Qwen3-30B-A3B" model={selectedEvaluation.qwenModel} accent="blue" response={selectedEvaluation.qwenResponse} error={selectedEvaluation.qwenError} latencyMs={selectedEvaluation.qwenLatencyMs} totalTokens={selectedEvaluation.qwenUsage?.totalTokens} />
            </section>

            <section className="mt-6 rounded-2xl border p-5" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Reviewer decision</h2><p className="mt-1 text-xs text-muted-foreground">Score the response pair before using it to change production model routing.</p></div><Badge variant="outline" className="capitalize">{selectedEvaluation.status}</Badge></div>
              <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
                <div className="space-y-4">
                  <div><Label className="mb-2 block">Preferred response</Label><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(["claude", "qwen", "tie", "neither"] as const).map((option) => <button type="button" key={option} onClick={() => setPreferredModel(option)} className={cn("rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors", preferredModel === option ? "border-transparent text-white" : "bg-background text-muted-foreground hover:border-slate-400")} style={preferredModel === option ? { background: option === "qwen" ? "oklch(0.56 0.15 245)" : "var(--color-ln-navy)" } : undefined}>{option}</button>)}</div></div>
                  <div className="grid grid-cols-3 gap-3">{[{ id: "evaluator-clarity", label: "Clarity", value: clarity, setValue: setClarity }, { id: "evaluator-usefulness", label: "Usefulness", value: usefulness, setValue: setUsefulness }, { id: "evaluator-leadership-tone", label: "Leadership tone", value: leadershipTone, setValue: setLeadershipTone }].map((score) => <div key={score.label} className="space-y-2"><Label htmlFor={score.id}>{score.label}</Label><Input id={score.id} type="number" min="1" max="5" value={score.value} onChange={(event) => score.setValue(event.target.value)} /></div>)}</div>
                </div>
                <div className="space-y-2"><Label htmlFor="evaluator-note">Reviewer note</Label><Textarea id="evaluator-note" value={reviewerNote} onChange={(event) => setReviewerNote(event.target.value)} className="min-h-28" placeholder="What made one response stronger or safer for this use case?" maxLength={4000} /><Button type="button" onClick={saveReview} disabled={reviewMutation.isPending} className="mt-2 w-full" variant="outline">{reviewMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}Save review</Button></div>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed px-6 py-16 text-center" style={{ borderColor: "var(--color-border)", background: "oklch(from var(--color-ln-ivory) l c h / .6)" }}><Scale className="mx-auto mb-3 size-8" style={{ color: "var(--color-ln-yellow)" }} /><h2 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Your first comparison will appear here</h2><p className="mt-2 text-sm text-muted-foreground">Use an anonymised prompt to begin a reusable model-quality record.</p></section>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold" style={{ color: "var(--color-ln-navy)" }}>Recent evaluations</h2><span className="text-xs text-muted-foreground">Last 12 saved comparisons</span></div>
          {isLoadingHistory ? <Skeleton className="h-32 rounded-2xl" /> : evaluations.length === 0 ? <p className="rounded-xl border p-6 text-sm text-muted-foreground" style={{ borderColor: "var(--color-border)" }}>No comparisons saved yet.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{evaluations.map((evaluation) => <button key={evaluation.id} type="button" onClick={() => setSelectedId(evaluation.id)} className={cn("rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md", selectedEvaluation?.id === evaluation.id && "ring-2 ring-offset-2")} style={{ borderColor: "var(--color-border)", background: "var(--color-card)", ...(selectedEvaluation?.id === evaluation.id ? { "--tw-ring-color": "var(--color-ln-yellow)" } as React.CSSProperties : {}) }}><div className="flex items-center justify-between gap-3"><Badge variant="outline" className="capitalize">{evaluation.status}</Badge>{evaluation.preferredModel && <span className="text-xs font-semibold capitalize" style={{ color: "var(--color-ln-navy)" }}>{evaluation.preferredModel} preferred</span>}</div><p className="mt-3 line-clamp-2 text-sm font-medium" style={{ color: "var(--color-ln-charcoal)" }}>{evaluation.userPrompt}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(evaluation.createdAt).toLocaleString()}</p></button>)}</div>}
        </section>
      </main>
    </PlatformLayout>
  );
}
