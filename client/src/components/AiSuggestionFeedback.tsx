import { useState } from "react";
import * as React from "react";
import { Flag, Loader2 } from "lucide-react";
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
  const submit = trpc.aiSuggestionFeedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Thanks — your feedback helps improve future suggestions.");
      setExpanded(false);
    },
    onError: () => toast.error("We could not save your feedback. Please try again."),
  });

  const flag = (reason: "malformed" | "unhelpful") => submit.mutate({ surface, suggestionKind, contentKey, reason, contentSnapshot: suggestionText });
  const buttonClass = dark ? "text-xs text-slate-300 hover:text-white" : "text-xs text-muted-foreground hover:text-foreground";

  return expanded ? (
    <div className={`mt-3 flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-2 ${dark ? "bg-white/10" : "bg-muted/55"}`} aria-label="Suggestion feedback">
      <span className={dark ? "text-xs text-slate-200" : "text-xs text-muted-foreground"}>Was this suggestion useful?</span>
      <button type="button" onClick={() => flag("malformed")} disabled={submit.isPending} className={buttonClass}>{submit.isPending ? <Loader2 className="inline size-3 animate-spin" /> : "Markup or text issue"}</button>
      <button type="button" onClick={() => flag("unhelpful")} disabled={submit.isPending} className={buttonClass}>Not helpful</button>
      <button type="button" onClick={() => setExpanded(false)} className={buttonClass}>Cancel</button>
    </div>
  ) : (
    <button type="button" onClick={() => setExpanded(true)} className={`mt-3 inline-flex items-center gap-1 ${buttonClass}`} aria-label="Flag this AI suggestion"><Flag className="size-3" />Flag suggestion</button>
  );
}
