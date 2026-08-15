import React, { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Compass, NotebookPen, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./executiveExperienceEnhancements.css";

type ExecutiveSection = "overview" | "think" | "decisions" | "mandate" | "context";
type ReviewableDecision = { id: number; decision: string; reviewDate?: Date | string | null };

const WALKTHROUGH_KEY = "levelnext-executive-sidebar-walkthrough-v1";
const WALKTHROUGH_STEPS: Array<{ section: ExecutiveSection; title: string; body: string }> = [
  { section: "overview", title: "Start with your Executive view", body: "Use this as a short radar: focus, decisions ready for review, and the context that grounds the workspace." },
  { section: "think", title: "Bring one live issue", body: "Use Think with me for a consequential conversation, choice, or moment that needs deliberate examination." },
  { section: "decisions", title: "Close the learning loop", body: "Record the reasoning, then return when the result is visible to capture what happened and what changes next time." },
  { section: "mandate", title: "Keep the mandate visible", body: "Use this to maintain a small set of consequential outcomes and make your attention allocation explicit." },
];

export function ExecutiveSidebarWalkthrough({ onSelect }: { onSelect: (section: ExecutiveSection) => void }) {
  const [step, setStep] = useState<number | null>(() => typeof window === "undefined" || window.localStorage.getItem(WALKTHROUGH_KEY) ? null : 0);
  const finish = () => { window.localStorage.setItem(WALKTHROUGH_KEY, "done"); setStep(null); };
  const current = step === null ? null : WALKTHROUGH_STEPS[step];

  if (!current || step === null) return null;
  return <aside className="exec-walkthrough" role="dialog" aria-label="Executive Intelligence sidebar walkthrough">
    <button type="button" className="exec-walkthrough-close" onClick={finish} aria-label="Skip sidebar walkthrough"><X size={15} /></button>
    <p>New cockpit · {step + 1} of {WALKTHROUGH_STEPS.length}</p>
    <h2>{current.title}</h2>
    <span>{current.body}</span>
    <div><button type="button" onClick={() => setStep((value) => value && value > 0 ? value - 1 : value)} disabled={step === 0}><ChevronLeft size={14} /> Back</button><button type="button" onClick={() => { if (step === WALKTHROUGH_STEPS.length - 1) return finish(); const next = WALKTHROUGH_STEPS[step + 1]; onSelect(next.section); setStep(step + 1); }}>{step === WALKTHROUGH_STEPS.length - 1 ? <>Finish <Check size={14} /></> : <>Next <ChevronRight size={14} /></>}</button></div>
  </aside>;
}

export function ExecutiveDecisionReviewPanel({ decisions }: { decisions: ReviewableDecision[] }) {
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(decisions[0]?.id ?? null);
  const [reviewStatus, setReviewStatus] = useState<"working" | "mixed" | "not_working">("working");
  const [actualOutcome, setActualOutcome] = useState("");
  const [learning, setLearning] = useState("");
  const [nextTimeChange, setNextTimeChange] = useState("");
  const selected = decisions.find((entry) => entry.id === selectedId);
  const saveOutcome = trpc.executiveIntelligence.saveDecisionOutcome.useMutation({
    onSuccess: () => {
      utils.executiveIntelligence.getWorkspace.invalidate();
      setActualOutcome(""); setLearning(""); setNextTimeChange("");
    },
  });

  useEffect(() => { if (decisions.length && !decisions.some((entry) => entry.id === selectedId)) setSelectedId(decisions[0].id); }, [decisions, selectedId]);
  if (!selected) return null;

  return <section className="exec-review-panel" aria-labelledby="decision-review-heading">
    <div className="exec-review-heading"><NotebookPen size={18} /><div><p>Decision review</p><h2 id="decision-review-heading">What did this decision teach you?</h2><span>Capture the outcome without rewriting the original reasoning.</span></div></div>
    <label>Decision ready for review<select value={selectedId ?? ""} onChange={(event) => setSelectedId(Number(event.target.value))}>{decisions.map((entry) => <option key={entry.id} value={entry.id}>{entry.decision}</option>)}</select></label>
    <div className="exec-review-status" aria-label="Decision outcome status">{(["working", "mixed", "not_working"] as const).map((status) => <button key={status} type="button" className={reviewStatus === status ? "is-active" : ""} onClick={() => setReviewStatus(status)}>{status === "not_working" ? "Not working" : status[0].toUpperCase() + status.slice(1)}</button>)}</div>
    <label>What happened?<textarea value={actualOutcome} onChange={(event) => setActualOutcome(event.target.value)} placeholder="Describe the observable result, including what differed from your expectation." /></label>
    <label>What did you learn?<textarea value={learning} onChange={(event) => setLearning(event.target.value)} placeholder="Name the assumption, signal, trade-off, or stakeholder dynamic you would carry forward." /></label>
    <label>What would you change next time? <small>Optional</small><textarea value={nextTimeChange} onChange={(event) => setNextTimeChange(event.target.value)} placeholder="Capture the adjustment you want to make in a comparable decision." /></label>
    <button className="exec-navy-button" disabled={actualOutcome.trim().length < 8 || learning.trim().length < 8 || saveOutcome.isPending} onClick={() => selectedId && saveOutcome.mutate({ decisionId: selectedId, reviewStatus, actualOutcome, learning, nextTimeChange: nextTimeChange || undefined })}>{saveOutcome.isPending ? "Saving review…" : <><Compass size={15} /> Save outcome review</>}</button>
    {saveOutcome.error && <p className="exec-review-error" role="alert">{saveOutcome.error.message}</p>}
  </section>;
}
