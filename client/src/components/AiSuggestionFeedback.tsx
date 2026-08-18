import { useState } from "react";
import * as React from "react";
import { Flag, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type AiSuggestionFeedbackProps = {
  surface: "pe_daily_brief" | "manager_daily_brief" | "career_chief_of_staff" | "career_weekly_report";
  suggestionKind: "development_suggestion" | "daily_focus" | "chief_of_staff_brief" | "weekly_report";
  contentKey?: string;
  suggestionText: string;
  dark?: boolean;
};

export function AiSuggestionFeedback({ surface, suggestionKind, contentKey, suggestionText, dark = false }: AiSuggestionFeedbackProps) {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState<"helpful" | "unhelpful" | null>(null);
  const [pendingRating, setPendingRating] = useState<"helpful" | "unhelpful" | null>(null);
  const [retryRating, setRetryRating] = useState<"helpful" | "unhelpful" | null>(null);
  const submit = trpc.aiSuggestionFeedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Thanks — your feedback helps improve future suggestions.");
      setExpanded(false);
    },
    onError: () => toast.error("We could not save your feedback. Please try again."),
  });

  const submitFeedback = (reason: "helpful" | "malformed" | "unhelpful") => submit.mutate({ surface, suggestionKind, contentKey, reason, contentSnapshot: suggestionText });
  const rate = (reason: "helpful" | "unhelpful") => {
    const previous = rating;
    setRating(reason);
    setPendingRating(reason);
    setRetryRating(null);
    submit.mutate({ surface, suggestionKind, contentKey, reason, contentSnapshot: suggestionText }, {
      onSuccess: () => setPendingRating(null),
      onError: () => { setRating(previous); setPendingRating(null); setRetryRating(reason); },
    });
  };
  const buttonClass = dark ? "text-xs text-slate-300 hover:text-white" : "text-xs text-muted-foreground hover:text-foreground";
  const selectedClass = dark ? "bg-white/20 text-white" : "bg-muted text-foreground";

  return <div className={`mt-3 flex flex-wrap items-center gap-1.5 ${dark ? "text-slate-300" : "text-muted-foreground"}`} aria-label="Suggestion feedback">
    <span className="mr-1 text-xs">Was this useful?</span>
    <button type="button" aria-label="Rate this AI suggestion helpful" aria-pressed={rating === "helpful"} onClick={() => rate("helpful")} disabled={submit.isPending || pendingRating !== null} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${buttonClass} ${rating === "helpful" ? selectedClass : ""}`}>{pendingRating === "helpful" ? <Loader2 className="size-3 animate-spin" /> : <ThumbsUp className="size-3" />}Helpful</button>
    <button type="button" aria-label="Rate this AI suggestion not helpful" aria-pressed={rating === "unhelpful"} onClick={() => rate("unhelpful")} disabled={submit.isPending || pendingRating !== null} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${buttonClass} ${rating === "unhelpful" ? selectedClass : ""}`}>{pendingRating === "unhelpful" ? <Loader2 className="size-3 animate-spin" /> : <ThumbsDown className="size-3" />}Not helpful</button>
    <button type="button" onClick={() => setExpanded((value) => !value)} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${buttonClass}`} aria-label="Flag this AI suggestion"><Flag className="size-3" />More feedback</button>
    {expanded && <div className={`basis-full mt-1 flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-2 ${dark ? "bg-white/10" : "bg-muted/55"}`}><span className="text-xs">Report a specific issue:</span><button type="button" onClick={() => submitFeedback("malformed")} disabled={submit.isPending} className={buttonClass}>{submit.isPending ? <Loader2 className="inline size-3 animate-spin" /> : "Markup or text issue"}</button><button type="button" onClick={() => setExpanded(false)} className={buttonClass}>Cancel</button></div>}
    {retryRating && <div className={`basis-full mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${dark ? "bg-red-400/15 text-red-100" : "bg-red-50 text-red-800"}`}><span>Rating could not be saved.</span><button type="button" className="font-semibold underline" onClick={() => rate(retryRating)}>Retry {retryRating === "helpful" ? "helpful" : "not helpful"} rating</button></div>}
  </div>;
}
