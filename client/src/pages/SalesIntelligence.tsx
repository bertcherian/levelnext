import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, ArrowRight, BrainCircuit, Check, ChevronRight, CircleDot,
  Eye, Flame, Lightbulb, Loader2, Plus, RefreshCw, ShieldCheck, Target,
} from "lucide-react";
import type { CommercialJudgment } from "../../../shared/modules/salesIntelligence";
import "./salesIntelligence.css";

type View = "desk" | "think" | "situation";

const CATEGORY_COPY = {
  fact: { label: "Fact", text: "Directly observed or objectively known." },
  evidence: { label: "Evidence", text: "Supports an interpretation but does not prove it." },
  interpretation: { label: "Interpretation", text: "A reasonable conclusion to test." },
  assumption: { label: "Assumption", text: "Believed without sufficient evidence." },
  hope: { label: "Hope", text: "An outcome wanted but not substantiated." },
} as const;

function formatDate(date: Date | string | null | undefined) {
  return date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No date";
}

function JudgmentCard({ judgment }: { judgment: CommercialJudgment }) {
  return <section className="sales-judgment" aria-label="Commercial judgment">
    <div className="sales-judgment-lede"><div><p className="sales-kicker">What I think is happening</p><h2>{judgment.whatIsHappening}</h2></div><span className={`sales-confidence sales-confidence--${judgment.confidence}`}>{judgment.confidence} confidence</span></div>
    <div className="sales-truth-grid"><article><p>What we know</p>{judgment.whatWeKnow.length ? <ul>{judgment.whatWeKnow.map((item) => <li key={item}>{item}</li>)}</ul> : <span>No validated facts yet.</span>}</article><article><p>What we are assuming</p>{judgment.whatWeAreAssuming.length ? <ul>{judgment.whatWeAreAssuming.map((item) => <li key={item}>{item}</li>)}</ul> : <span>No explicit assumptions recorded.</span>}</article></div>
    <div className="sales-constraint"><AlertTriangle size={19} /><div><p className="sales-kicker">Primary constraint</p><h3>{judgment.primaryConstraint}</h3><span>{judgment.whatMattersMost}</span></div></div>
    <div className="sales-next-move"><div><p className="sales-kicker">Next best move</p><h3>{judgment.recommendedNextMove}</h3><span>Alternative: {judgment.alternativeMove}</span></div><Target size={29} /></div>
    <div className="sales-learning-grid"><article><p>What would change this judgment</p><span>{judgment.whatWouldChangeJudgment}</span></article><article><p>Practice this</p><span>{judgment.practicePrompt}</span></article></div>
  </section>;
}

export default function SalesIntelligence() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [view, setView] = useState<View>("desk");
  const [selectedSituationId, setSelectedSituationId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [accountName, setAccountName] = useState("");
  const [situation, setSituation] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [commitmentAction, setCommitmentAction] = useState("");
  const [stakeholder, setStakeholder] = useState("");
  const [intendedBehaviour, setIntendedBehaviour] = useState("");
  const [commitmentId, setCommitmentId] = useState<number | null>(null);
  const [outcome, setOutcome] = useState("");
  const [reflection, setReflection] = useState("");
  const [reflectionStatus, setReflectionStatus] = useState<"completed" | "not_done">("completed");
  const [feedback, setFeedback] = useState<string | null>(null);

  const desk = trpc.salesIntelligence.getDesk.useQuery(undefined, { enabled: isAuthenticated });
  const situationDetail = trpc.salesIntelligence.getSituation.useQuery({ id: selectedSituationId ?? 0 }, { enabled: isAuthenticated && Boolean(selectedSituationId) });
  const analyze = trpc.salesIntelligence.analyzeSituation.useMutation({
    onSuccess: (data) => { utils.salesIntelligence.getDesk.invalidate(); setSelectedSituationId(data.id); setView("situation"); setFeedback("Commercial judgment created. Review the evidence boundary before acting."); },
    onError: (error) => setFeedback(error.message),
  });
  const createCommitment = trpc.salesIntelligence.createCommitment.useMutation({
    onSuccess: () => { utils.salesIntelligence.getSituation.invalidate(); utils.salesIntelligence.getDesk.invalidate(); setCommitmentAction(""); setStakeholder(""); setIntendedBehaviour(""); setFeedback("Commitment captured. Return after the interaction to record what happened."); },
    onError: (error) => setFeedback(error.message),
  });
  const reflectCommitment = trpc.salesIntelligence.reflectCommitment.useMutation({
    onSuccess: () => { utils.salesIntelligence.getSituation.invalidate(); utils.salesIntelligence.getDesk.invalidate(); setCommitmentId(null); setOutcome(""); setReflection(""); setReflectionStatus("completed"); setFeedback("Outcome reflection saved. The next situation will benefit from this learning."); },
    onError: (error) => setFeedback(error.message),
  });

  const currentSituation = situationDetail.data?.situation;
  const currentJudgment = currentSituation?.judgment as CommercialJudgment | null | undefined;
  const selectedCommitment = useMemo(() => situationDetail.data?.commitments.find((item) => item.id === commitmentId) ?? null, [situationDetail.data?.commitments, commitmentId]);
  const openSituation = (id: number) => { setSelectedSituationId(id); setView("situation"); };

  if (loading || (isAuthenticated && desk.isLoading)) return <main className="sales-shell sales-shell--loading"><div className="sales-loader"><Loader2 className="animate-spin" /><span>Opening your Revenue Desk…</span></div></main>;
  if (!isAuthenticated) return <main className="sales-access"><div><p className="sales-kicker">LevelNext Sales Intelligence</p><h1>Better revenue decisions begin with the truth.</h1><span>Private commercial judgment for the conversations and choices that matter.</span><button onClick={() => { window.location.href = getLoginUrl(); }}>Enter Sales Intelligence <ArrowRight size={16} /></button></div></main>;

  return <main className="sales-shell"><aside className="sales-sidebar"><Link href="/home" className="sales-brand"><img src="/logo.png" alt="LevelNext" /><span>Sales<br /><b>Intelligence</b></span></Link><nav>{([ ["desk", "My Revenue Desk", Eye], ["think", "Help Me Think", BrainCircuit] ] as const).map(([id, label, Icon]) => <button key={id} className={view === id ? "is-active" : ""} onClick={() => setView(id)}><Icon size={17} />{label}</button>)}</nav><div className="sales-sidebar-note"><ShieldCheck size={14} /> Private seller workspace<br /><span>Development is not performance surveillance.</span></div></aside>
    <section className="sales-main"><header className="sales-topbar"><div><p>LevelNext Sales Intelligence</p><span>System of Judgment</span></div><button onClick={() => setView("think")}><Plus size={15} /> Live situation</button></header><div className="sales-content">{feedback && <section className="sales-feedback" role="status"><Check size={16} /><span>{feedback}</span><button onClick={() => setFeedback(null)}>Dismiss</button></section>}
      {view === "desk" && <section className="sales-view"><div className="sales-hero"><div><p className="sales-kicker">My Revenue Desk</p><h1>What deserves your attention today?</h1><span>Bring the commercial moments that require sharper thinking—not more administrative work.</span></div><button onClick={() => setView("think")}><BrainCircuit size={17} /> Help me think</button></div><div className="sales-desk-grid"><article className="sales-desk-card sales-desk-card--navy"><p className="sales-kicker">Start here</p><h2>Bring a live commercial situation.</h2><span>A discount request. A stalled deal. A difficult customer conversation. Start with what is actually happening.</span><button onClick={() => setView("think")}>Open Help Me Think <ArrowRight size={15} /></button></article><article className="sales-desk-card"><p className="sales-kicker">Commitments due</p><strong>{desk.data?.commitments.length ?? 0}</strong><h3>actions need reflection</h3><span>Learning compounds when you compare the intended move with what happened.</span></article><article className="sales-desk-card"><p className="sales-kicker">Commercial memory</p><strong>{desk.data?.situations.length ?? 0}</strong><h3>situations captured</h3><span>Each situation retains the reasoning, evidence boundary, action, and outcome.</span></article></div><section className="sales-history"><div><p className="sales-kicker">Recent situations</p><h2>Continue the thinking</h2></div>{desk.data?.situations.length ? <div>{desk.data.situations.map((item) => <button key={item.id} onClick={() => openSituation(item.id)}><span>{item.accountName || "Commercial situation"}</span><b>{item.title}</b><em>{item.judgment?.primaryConstraint || "Judgment pending"}</em><ChevronRight size={16} /></button>)}</div> : <div className="sales-empty"><Lightbulb size={18} /><span>No situations yet. Capture the next deal, meeting, or commercial decision that matters.</span></div>}</section></section>}
      {view === "think" && <section className="sales-view sales-think"><div className="sales-view-title"><p className="sales-kicker">Help Me Think</p><h1>What is really happening?</h1><span>Start in your own words. The system will distinguish evidence from assumption before recommending a move.</span></div><article className="sales-intake"><label>Give this situation a short name<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Procurement asks for another discount" /></label><div className="sales-intake-grid"><label>Account <small>Optional</small><input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="e.g. Acme Industries" /></label><label>Desired outcome <small>Optional</small><input value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} placeholder="What would a useful next step achieve?" /></label></div><label>What is happening?<textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="Tell me what the customer said or did, who is involved, what has already happened, and what makes this commercially important. Avoid polishing it—the detail helps." /></label><p className="sales-intake-note"><CircleDot size={15} /> LevelNext will not invent customer facts. It will make assumptions and missing information visible.</p><button disabled={title.trim().length < 4 || situation.trim().length < 20 || analyze.isPending} onClick={() => analyze.mutate({ title, accountName: accountName || undefined, situation, desiredOutcome: desiredOutcome || undefined })}>{analyze.isPending ? <><Loader2 size={16} className="animate-spin" /> Examining the situation…</> : <><Flame size={16} /> Create commercial judgment</>}</button></article></section>}
      {view === "situation" && <section className="sales-view">{situationDetail.isLoading ? <div className="sales-inline-loading"><Loader2 className="animate-spin" /> Loading the commercial context…</div> : currentSituation && currentJudgment ? <><div className="sales-situation-heading"><button className="sales-back" onClick={() => setView("desk")}>← My Revenue Desk</button><p className="sales-kicker">{currentSituation.accountName || "Commercial situation"}</p><h1>{currentSituation.title}</h1><span>{currentSituation.desiredOutcome || "No desired outcome supplied."}</span></div><JudgmentCard judgment={currentJudgment} /><section className="sales-loop"><div><p className="sales-kicker">Commit to the move</p><h2>What will you actually do?</h2><span>Translate the recommendation into a specific action, stakeholder, and behaviour.</span></div><div className="sales-commitment-form"><label>Action<input value={commitmentAction} onChange={(event) => setCommitmentAction(event.target.value)} placeholder={currentJudgment.recommendedNextMove} /></label><label>Stakeholder <small>Optional</small><input value={stakeholder} onChange={(event) => setStakeholder(event.target.value)} placeholder="Who needs to be involved?" /></label><label>Intended behaviour <small>Optional</small><input value={intendedBehaviour} onChange={(event) => setIntendedBehaviour(event.target.value)} placeholder="How do you want to show up?" /></label><button disabled={commitmentAction.trim().length < 5 || createCommitment.isPending} onClick={() => createCommitment.mutate({ situationId: currentSituation.id, action: commitmentAction, stakeholder: stakeholder || undefined, intendedBehaviour: intendedBehaviour || undefined })}>{createCommitment.isPending ? "Saving…" : "Commit to this move"}</button></div></section><section className="sales-reflections"><p className="sales-kicker">Act → Reflect → Learn</p><h2>Close the loop after the interaction.</h2>{situationDetail.data?.commitments.length ? <div>{situationDetail.data.commitments.map((item) => <article key={item.id}><div><b>{item.action}</b><span>{item.stakeholder || "No stakeholder specified"} · {item.status === "pending" ? "Awaiting reflection" : `${item.status.replace("_", " ")} ${formatDate(item.updatedAt)}`}</span></div>{item.status === "pending" && <button onClick={() => setCommitmentId(item.id)}>Reflect on outcome <ArrowRight size={14} /></button>}</article>)}</div> : <span>Capture a commitment to begin the learning loop.</span>}</section>{selectedCommitment && <section className="sales-reflection-form"><div><p className="sales-kicker">Outcome reflection</p><h2>What happened?</h2><span>{selectedCommitment.action}</span></div><div className="sales-reflection-status"><button className={reflectionStatus === "completed" ? "is-active" : ""} onClick={() => setReflectionStatus("completed")}>Completed</button><button className={reflectionStatus === "not_done" ? "is-active" : ""} onClick={() => setReflectionStatus("not_done")}>Not done</button></div><label>Outcome<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="What did the customer or stakeholder say or do?" /></label><label>What did you learn?<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="What would you carry into the next similar commercial situation?" /></label><button className="sales-reflection-save" disabled={outcome.trim().length < 8 || reflection.trim().length < 8 || reflectCommitment.isPending} onClick={() => reflectCommitment.mutate({ commitmentId: selectedCommitment.id, status: reflectionStatus, outcome, reflection })}>{reflectCommitment.isPending ? "Saving reflection…" : "Save outcome and learning"}</button></section>}</> : <div className="sales-empty"><AlertTriangle size={18} /> Situation not found or no longer available.</div>}</section>}</div></section></main>;
}
