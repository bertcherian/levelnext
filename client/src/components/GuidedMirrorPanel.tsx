import { useState } from "react";
import { Bell, Brain, CheckCircle2, ChevronDown, Lightbulb, Loader2, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DIMENSION_LABELS: Record<string, string> = {
  self_awareness: "Self-awareness",
  authenticity: "Authenticity",
  courage: "Courage",
  responsibility: "Responsibility",
  other_centredness: "Other-centredness",
  integrity: "Integrity",
};

const NOT_YET_REASONS = [
  ["does_not_fit_my_situation", "Doesn’t fit this situation"], ["too_generic", "Too general"], ["not_actionable", "Not actionable enough"], ["wrong_depth", "Not the right depth"], ["not_the_right_time", "Not the right time"], ["other", "Something else"],
] as const;

export default function GuidedMirrorPanel({ enabled }: { enabled: boolean }) {
  const utils = trpc.useUtils();
  const [situation, setSituation] = useState("");
  const [observedBehaviour, setObservedBehaviour] = useState("");
  const [careerStage, setCareerStage] = useState<"early_career" | "professional" | "manager" | "leader" | "cxo">("leader");
  const [open, setOpen] = useState(true);
  const [showReasonOptions, setShowReasonOptions] = useState(false);
  const { data, isLoading } = trpc.intelligenceCore.getGuidedMirrors.useQuery(undefined, { enabled });
  const { data: reminder } = trpc.intelligenceCore.getGuidedMirrorReminder.useQuery(undefined, { enabled });
  const createMirror = trpc.intelligenceCore.createGuidedMirror.useMutation({
    onSuccess: () => {
      utils.intelligenceCore.getGuidedMirrors.invalidate();
      utils.intelligenceCore.getSelfLeadershipProgress.invalidate();
      setSituation("");
      setObservedBehaviour("");
      toast.success("Your private Guided Mirror is ready.");
    },
    onError: () => toast.error("Guide could not create a mirror right now. Please try again."),
  });
  const rateMirror = trpc.intelligenceCore.rateGuidedMirror.useMutation({
    onSuccess: () => {
      utils.intelligenceCore.getGuidedMirrors.invalidate();
      utils.intelligenceCore.getSelfLeadershipProgress.invalidate();
    },
  });
  const updateExperiment = trpc.intelligenceCore.updateGuidedMirrorExperiment.useMutation({
    onSuccess: () => {
      utils.intelligenceCore.getGuidedMirrors.invalidate();
      utils.intelligenceCore.getSelfLeadershipProgress.invalidate();
    },
  });
  const saveReminder = trpc.intelligenceCore.saveGuidedMirrorReminder.useMutation({
    onSuccess: () => { utils.intelligenceCore.getGuidedMirrorReminder.invalidate(); toast.success("Weekly Guided Mirror reminder updated."); },
    onError: () => toast.error("Reminder settings could not be saved. Please try again."),
  });

  const handleCreate = () => {
    if (situation.trim().length < 10 || createMirror.isPending) return;
    createMirror.mutate({ situation: situation.trim(), observedBehaviour: observedBehaviour.trim() || undefined, careerStage });
  };
  const latestMirror = data?.mirrors?.[0];
  const analysis = latestMirror?.analysis as any;

  return (
    <section className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 p-5 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}><Brain size={18} /></span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--color-ln-navy)" }}>Guided Mirror</span><span className="mt-1 block text-sm" style={{ color: "var(--color-ln-muted)" }}>Turn a real workplace moment into one clearer next choice.</span></span>
        <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--color-ln-muted)" }} />
      </button>
      {open && <div className="border-t p-5" style={{ borderColor: "var(--color-ln-border)" }}>
        <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>Private to you. Guide uses observable behaviour and context—not personality labels or assumptions about motives.</p>
        <div className="mb-4 flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-ln-border)", background: "var(--color-ln-ivory)" }}>
          <div className="flex gap-2"><Bell size={15} style={{ color: "var(--color-ln-navy)" }} /><p className="text-xs" style={{ color: "var(--color-ln-muted)" }}><strong style={{ color: "var(--color-ln-navy)" }}>Weekly reminder</strong><br />A private email prompt on Monday morning UTC.</p></div>
          <button onClick={() => saveReminder.mutate({ enabled: !reminder?.enabled, dayOfWeek: reminder?.dayOfWeek ?? 1, hourUtc: reminder?.hourUtc ?? 3 })} disabled={saveReminder.isPending} className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--color-ln-border)", background: reminder?.enabled ? "var(--color-ln-navy)" : "white", color: reminder?.enabled ? "white" : "var(--color-ln-navy)" }}>{reminder?.enabled ? "Reminder on" : "Turn on"}</button>
        </div>
        <div className="space-y-3">
          <Textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="What happened? Describe the workplace moment you want to understand." className="min-h-[92px] text-sm" maxLength={4000} />
          <Textarea value={observedBehaviour} onChange={(event) => setObservedBehaviour(event.target.value)} placeholder="What did you say or do? (Optional, but it sharpens the mirror.)" className="min-h-[70px] text-sm" maxLength={3000} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-xs font-medium" style={{ color: "var(--color-ln-muted)" }}>Your current context <select value={careerStage} onChange={(event) => setCareerStage(event.target.value as typeof careerStage)} className="ml-2 rounded-lg border px-2 py-1.5 text-xs" style={{ borderColor: "var(--color-ln-border)", color: "var(--color-ln-navy)" }}><option value="early_career">Early career</option><option value="professional">Professional</option><option value="manager">Manager</option><option value="leader">Leader</option><option value="cxo">CXO / Business Head</option></select></label>
            <button onClick={handleCreate} disabled={situation.trim().length < 10 || createMirror.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--color-ln-navy)", color: "white" }}>{createMirror.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{createMirror.isPending ? "Reflecting…" : "Create my Mirror"}</button>
          </div>
        </div>
        {latestMirror?.relevance === "down" && <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--color-ln-border)", background: "var(--color-ln-ivory)" }}><div className="flex items-center justify-between gap-3"><p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Optional: what would make this more useful?</p><button onClick={() => setShowReasonOptions((value) => !value)} className="text-xs font-semibold hover:underline" style={{ color: "var(--color-ln-navy)" }}>{showReasonOptions ? "Hide" : "Add reason"}</button></div>{showReasonOptions && <div className="mt-2 flex flex-wrap gap-2">{NOT_YET_REASONS.map(([value, label]) => <button key={value} onClick={() => rateMirror.mutate({ mirrorId: latestMirror.id, relevance: "down", feedbackReason: value })} disabled={rateMirror.isPending} className="rounded-full border bg-white px-2.5 py-1 text-xs" style={{ borderColor: "var(--color-ln-border)" }}>{label}</button>)}</div>}</div>}
        {isLoading ? <div className="mt-5 h-24 animate-pulse rounded-xl" style={{ background: "var(--color-ln-ivory)" }} /> : analysis && latestMirror && <div className="mt-5 rounded-xl p-4" style={{ background: "oklch(98% 0.01 248.6)", border: "1px solid var(--color-ln-border)" }}>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.18)", color: "var(--color-ln-navy)" }}>{DIMENSION_LABELS[analysis.selfLeadershipSignal?.primaryDimension] ?? "Self-leadership"}</span><span className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{analysis.selfLeadershipSignal?.confidence} confidence · evidence, not a label</span></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>What we’re noticing</p><p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-ln-text)" }}>{analysis.mirror?.whatWeAreNoticing}</p></div><div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Why it may matter</p><p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-ln-text)" }}>{analysis.mirror?.whyItMayMatter}</p></div><div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Question to consider</p><p className="mt-1 text-sm leading-relaxed italic" style={{ color: "var(--color-ln-text)" }}>{analysis.mirror?.questionToConsider}</p></div><div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>Experiment</p><p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-ln-text)" }}>{analysis.mirror?.experiment}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--color-ln-border)" }}><span className="mr-1 text-xs" style={{ color: "var(--color-ln-muted)" }}>Was this useful?</span><button onClick={() => rateMirror.mutate({ mirrorId: latestMirror.id, relevance: "up" })} disabled={rateMirror.isPending} aria-pressed={latestMirror.relevance === "up"} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: latestMirror.relevance === "up" ? "var(--color-ln-yellow)" : "var(--color-ln-border)", color: "var(--color-ln-navy)", background: latestMirror.relevance === "up" ? "oklch(from var(--color-ln-yellow) l c h / 0.18)" : "white" }}><ThumbsUp size={13} />Relevant</button><button onClick={() => rateMirror.mutate({ mirrorId: latestMirror.id, relevance: "down" })} disabled={rateMirror.isPending} aria-pressed={latestMirror.relevance === "down"} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: latestMirror.relevance === "down" ? "var(--color-ln-yellow)" : "var(--color-ln-border)", color: "var(--color-ln-navy)", background: latestMirror.relevance === "down" ? "oklch(from var(--color-ln-yellow) l c h / 0.18)" : "white" }}><ThumbsDown size={13} />Not yet</button><button onClick={() => updateExperiment.mutate({ mirrorId: latestMirror.id, experimentStatus: latestMirror.experimentStatus === "attempted" ? "not_started" : "attempted" })} disabled={updateExperiment.isPending} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "var(--color-ln-navy)" }}><CheckCircle2 size={13} />{latestMirror.experimentStatus === "attempted" ? "Experiment logged" : "I tried this"}</button></div>
        </div>}
      </div>}
    </section>
  );
}
