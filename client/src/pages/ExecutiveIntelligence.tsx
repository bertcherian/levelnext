import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { trpc } from "@/lib/trpc";
import { downloadDecisionJournal } from "@/lib/decisionJournalExport";
import {
  AlertCircle, ArrowRight, BellRing, BrainCircuit, Check, ChevronDown, CircleDot, Compass,
  Download, Landmark, Lightbulb, Loader2, Plus, RefreshCw, Scale, ShieldCheck, Sparkles,
  Target, TriangleAlert, Waypoints,
} from "lucide-react";
import type { ExecutivePriority } from "../../../shared/modules/executiveIntelligence";
import "./executive.css";

const LEVELNEXT_LOGO_URL = "/manus-storage/levelnext-logo_810a0952.png";

type PriorityDraft = Pick<ExecutivePriority, "title" | "area" | "outcome" | "progress"> & { id: string };

const EMPTY_PRIORITIES: PriorityDraft[] = [
  { id: "priority-1", title: "", area: "business_outcome", outcome: "", progress: "active" },
  { id: "priority-2", title: "", area: "strategic_choice", outcome: "", progress: "active" },
  { id: "priority-3", title: "", area: "organisation", outcome: "", progress: "not_started" },
];

const PRIORITY_AREAS = [
  ["business_outcome", "Business outcome"], ["strategic_choice", "Strategic choice"], ["transformation", "Transformation"],
  ["organisation", "Organisation"], ["stakeholder", "Stakeholder"], ["leadership_shift", "Leadership shift"],
] as const;

const ACTIONS = [
  { id: "prepare", title: "Prepare me", text: "Pressure-test a consequential meeting or conversation.", icon: Compass },
  { id: "think", title: "Think with me", text: "Open up an ambiguous situation before advice narrows it.", icon: BrainCircuit },
  { id: "challenge", title: "Challenge my decision", text: "Examine assumptions, trade-offs, risks, and second-order effects.", icon: Scale },
  { id: "debrief", title: "Debrief with me", text: "Turn a significant event into evidence for your next move.", icon: Sparkles },
] as const;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function ExecutiveLoadingState() {
  return <main className="executive-shell"><header className="executive-nav"><span className="executive-brand executive-brand--loading"><span className="executive-skeleton executive-skeleton--logo" /><span className="executive-skeleton executive-skeleton--text" /></span></header><div className="executive-container executive-loading" aria-busy="true" aria-live="polite"><span className="executive-skeleton executive-skeleton--kicker" /><span className="executive-skeleton executive-skeleton--title" /><span className="executive-skeleton executive-skeleton--copy" /><div className="executive-skeleton-grid"><span className="executive-skeleton executive-skeleton--card" /><span className="executive-skeleton executive-skeleton--card" /><span className="executive-skeleton executive-skeleton--card" /></div></div></main>;
}

export default function ExecutiveIntelligence() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: workspace, isLoading, isFetching, error: workspaceError, refetch } = trpc.executiveIntelligence.getWorkspace.useQuery(undefined, { enabled: isAuthenticated, retry: 1 });
  const decisionExport = trpc.executiveIntelligence.exportDecisionJournal.useQuery(undefined, { enabled: false, retry: 1 });
  const { data: decisionReviewReminder } = trpc.executiveIntelligence.getDecisionReviewReminder.useQuery(undefined, { enabled: isAuthenticated });
  const [contextOpen, setContextOpen] = useState(true);
  const [activeAction, setActiveAction] = useState<"prepare" | "think" | "challenge" | "debrief" | null>(null);
  const [roleTitle, setRoleTitle] = useState("");
  const [roleType, setRoleType] = useState<"ceo_bu_head" | "cfo" | "chro" | "cio_cto" | "coo" | "commercial_leader" | "other">("other");
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [geography, setGeography] = useState("");
  const [scopeDescription, setScopeDescription] = useState("");
  const [mandateStatement, setMandateStatement] = useState("");
  const [stakeholderSummary, setStakeholderSummary] = useState("");
  const [transitionMode, setTransitionMode] = useState<"first_180_days" | "executive_performance">("executive_performance");
  const [attention, setAttention] = useState({ run: 40, transform: 35, build: 25 });
  const [priorities, setPriorities] = useState<PriorityDraft[]>(EMPTY_PRIORITIES);
  const [situation, setSituation] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [decision, setDecision] = useState("");
  const [decisionContext, setDecisionContext] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reminderDay, setReminderDay] = useState(1);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderTimeZone, setReminderTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  useEffect(() => {
    if (!workspace?.profile) return;
    setRoleTitle(workspace.profile.roleTitle ?? "");
    setRoleType(["ceo_bu_head", "cfo", "chro", "cio_cto", "coo", "commercial_leader"].includes(workspace.profile.roleType ?? "") ? workspace.profile.roleType as typeof roleType : "other");
    setBusinessName(workspace.profile.businessName ?? "");
    setBusinessDescription(workspace.profile.businessDescription ?? "");
    setGeography(workspace.profile.geography ?? "");
    setScopeDescription(workspace.profile.scopeDescription ?? "");
    setMandateStatement(workspace.profile.mandateStatement ?? "");
    setStakeholderSummary(workspace.profile.stakeholderSummary ?? "");
    setTransitionMode(workspace.profile.transitionMode === "first_180_days" ? "first_180_days" : "executive_performance");
    setAttention({ run: workspace.profile.runAttention ?? 0, transform: workspace.profile.transformAttention ?? 0, build: workspace.profile.buildAttention ?? 0 });
    setContextOpen(false);
  }, [workspace?.profile]);

  useEffect(() => {
    const saved = workspace?.mandate?.priorities;
    if (saved?.length) setPriorities(saved as PriorityDraft[]);
  }, [workspace?.mandate?.priorities]);

  useEffect(() => {
    if (!decisionReviewReminder) return;
    setReminderDay(decisionReviewReminder.localDayOfWeek ?? 1);
    setReminderHour(decisionReviewReminder.localHour ?? 9);
    setReminderTimeZone(decisionReviewReminder.timeZone ?? "UTC");
  }, [decisionReviewReminder?.localDayOfWeek, decisionReviewReminder?.localHour, decisionReviewReminder?.timeZone]);

  const saveContext = trpc.executiveIntelligence.saveContext.useMutation({
    onSuccess: () => { utils.executiveIntelligence.getWorkspace.invalidate(); setContextOpen(false); setFeedback("Executive context saved."); },
    onError: (error) => setFeedback(error.message),
  });
  const saveMandate = trpc.executiveIntelligence.saveMandate.useMutation({
    onSuccess: () => { utils.executiveIntelligence.getWorkspace.invalidate(); setFeedback("Living mandate saved."); },
    onError: (error) => setFeedback(error.message),
  });
  const thinkWithMe = trpc.executiveIntelligence.thinkWithMe.useMutation({ onError: (error) => setFeedback(error.message) });
  const createDecision = trpc.executiveIntelligence.createDecision.useMutation({
    onSuccess: () => { utils.executiveIntelligence.getWorkspace.invalidate(); setDecision(""); setDecisionContext(""); setReviewDate(""); setFeedback("Decision recorded. It will be available for review on the selected date."); },
    onError: (error) => setFeedback(error.message),
  });
  const saveDecisionReviewReminder = trpc.executiveIntelligence.saveDecisionReviewReminder.useMutation({
    onSuccess: (result) => { utils.executiveIntelligence.getDecisionReviewReminder.invalidate(); setFeedback(result.enabled ? "Weekly decision-review email reminder saved." : "Decision-review email reminder paused."); },
    onError: (error) => setFeedback(error.message),
  });

  const savedPriorities = (workspace?.mandate?.priorities ?? []) as ExecutivePriority[];
  const activePriorities = savedPriorities.filter((priority) => priority.progress !== "on_track").slice(0, 3);
  const contextComplete = Boolean(workspace?.profile?.roleTitle && workspace?.profile?.mandateStatement);
  const attentionTotal = attention.run + attention.transform + attention.build;
  const leadName = user?.name?.split(" ")[0] ?? "Executive";
  const analysis = thinkWithMe.data?.analysis;
  const priorityReady = priorities.filter((priority) => priority.title.trim()).length >= 3;
  const attentionBars = useMemo(() => [
    { label: "Run", value: attention.run, color: "#78D2C5" }, { label: "Transform", value: attention.transform, color: "#EFBD65" }, { label: "Build", value: attention.build, color: "#8C9EFF" },
  ], [attention]);
  const executiveAction = activeAction ?? "think";
  const reviewableDecisions = workspace?.reviewableDecisions ?? [];
  const actionCopy = {
    prepare: { kicker: "Prepare me", title: "Prepare for the room that matters.", placeholder: "What meeting, conversation, or commitment are you preparing for?", outcome: "What must move by the end of the conversation?", button: "Prepare the conversation" },
    think: { kicker: "Think with me", title: "Bring an issue that matters.", placeholder: "What is happening? Describe the business situation, choice, or tension in your own words.", outcome: "What would a useful outcome look like? (optional)", button: "Examine the situation" },
    challenge: { kicker: "Challenge my decision", title: "Test the thinking before commitment hardens.", placeholder: "What decision, recommendation, or position do you want to pressure-test?", outcome: "What would a sound decision make possible? (optional)", button: "Challenge the decision" },
    debrief: { kicker: "Debrief with me", title: "Turn a significant event into learning.", placeholder: "What happened, and what response or outcome do you want to understand?", outcome: "What would you like to learn before the next comparable moment? (optional)", button: "Debrief the event" },
  }[executiveAction];

  const updatePriority = (index: number, next: Partial<PriorityDraft>) => setPriorities((current) => current.map((priority, itemIndex) => itemIndex === index ? { ...priority, ...next } : priority));
  const exportJournal = async () => {
    const result = await decisionExport.refetch();
    if (result.error) { setFeedback(result.error.message); return; }
    if (!result.data?.length) { setFeedback("There are no decision records to export yet."); return; }
    downloadDecisionJournal(result.data);
    setFeedback(`${result.data.length} decision record${result.data.length === 1 ? "" : "s"} exported as CSV.`);
  };

  if (loading || (isAuthenticated && isLoading)) return <ExecutiveLoadingState />;
  if (!loading && !isAuthenticated) return <main className="executive-shell executive-access"><div className="executive-access-card"><img src={LEVELNEXT_LOGO_URL} alt="LevelNext" className="executive-access-logo" /><p className="executive-kicker">Executive Intelligence</p><h1>See more. Decide better. Lead what matters.</h1><p>Executive Intelligence is a private thinking layer for consequential business leadership.</p><button onClick={() => { window.location.href = getLoginUrl(); }} className="executive-primary">Enter Executive Intelligence <ArrowRight size={16} /></button></div></main>;

  return <main className="executive-shell">
    <header className="executive-nav"><Link href="/home" className="executive-brand"><img src={LEVELNEXT_LOGO_URL} alt="LevelNext" className="executive-brand-logo" /><span className="executive-brand-divider" /><span className="executive-brand-product">Executive</span></Link><div className="executive-nav-right"><PwaInstallButton /><span className="executive-private"><ShieldCheck size={14} /> Private executive space</span><Link href="/guide" className="executive-nav-link">Guide</Link></div></header>
    <div className="executive-container">
      {workspaceError && <section className="executive-alert executive-alert--error" role="alert"><AlertCircle size={17} /><span><b>We could not load your executive workspace.</b> {workspaceError.message}</span><button type="button" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Try again</button></section>}
      {feedback && <section className="executive-alert" role="status"><Check size={17} /><span>{feedback}</span><button type="button" onClick={() => setFeedback(null)}>Dismiss</button></section>}
      {reviewableDecisions.length > 0 && <section className="executive-review-radar" aria-label="Decisions ready for review"><div><p className="executive-kicker">Decision review</p><h2>{reviewableDecisions.length} decision{reviewableDecisions.length === 1 ? "" : "s"} ready for a second look.</h2><p>Revisit the reasoning before the outcome rewrites the story.</p></div><div className="executive-review-items">{reviewableDecisions.map((entry) => <div key={entry.id}><BellRing size={15} /><span><b>{entry.decision}</b><small>{entry.reviewDate && new Date(entry.reviewDate) < new Date() ? "Overdue for review" : "Review due soon"}</small></span></div>)}</div></section>}
      <section className="executive-hero"><div><p className="executive-kicker">Executive Intelligence</p><h1>{greeting()}, {leadName}.</h1><p className="executive-hero-copy">An intelligence layer between you and the complexity of running your business.</p></div><div className="executive-mode"><span>{transitionMode === "first_180_days" ? "First 180 days" : "Executive performance"}</span><p>{transitionMode === "first_180_days" ? "See · Choose · Move · Build" : "See · Think · Decide · Act · Learn"}</p></div></section>
      <section className="executive-focus" aria-labelledby="executive-focus-title"><div className="executive-focus-heading"><span className="executive-focus-icon"><Lightbulb size={19} /></span><div><p className="executive-kicker">Your executive radar</p><h2 id="executive-focus-title">Three things deserve attention.</h2></div></div><div className="executive-radar-grid">{(activePriorities.length ? activePriorities : [{ id: "context", title: "Establish your Executive Context Map", area: "leadership_shift" as const }, { id: "mandate", title: "Name the three to five outcomes that define your mandate", area: "business_outcome" as const }, { id: "attention", title: "Make your Run / Transform / Build allocation visible", area: "strategic_choice" as const }]).map((priority) => <article key={priority.id} className="executive-radar-item"><p>{priority.area.replace(/_/g, " ")}</p><h3>{priority.title}</h3><button onClick={() => setContextOpen(true)}>Explore <ArrowRight size={14} /></button></article>)}</div></section>
      <section className="executive-grid executive-grid--primary"><article className="executive-card executive-agenda"><div className="executive-section-head"><div><p className="executive-kicker">Your executive agenda</p><h2>What must genuinely move?</h2></div><button className="executive-text-button" onClick={() => setContextOpen((open) => !open)}>{contextOpen ? "Close context" : "Edit context"} <ChevronDown size={15} className={contextOpen ? "rotate-180" : ""} /></button></div>{contextOpen && <div className="executive-context-form"><p className="executive-note">Build this progressively. No financial disclosure is required; qualitative descriptions are welcome.</p><div className="executive-form-grid"><label>Role / title<input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="e.g. Country Head, India" /></label><label>Executive role<select value={roleType} onChange={(event) => setRoleType(event.target.value as typeof roleType)}><option value="ceo_bu_head">CEO / Business head</option><option value="cfo">CFO / Finance</option><option value="chro">CHRO / People</option><option value="cio_cto">CIO / CTO</option><option value="coo">COO / Operations</option><option value="commercial_leader">Commercial leader</option><option value="other">Other executive role</option></select></label><label>Business / unit<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Growth business, APAC" /></label><label>Geography / market<input value={geography} onChange={(event) => setGeography(event.target.value)} placeholder="e.g. India, ASEAN, global" /></label><label className="executive-full">Business context<textarea value={businessDescription} onChange={(event) => setBusinessDescription(event.target.value)} placeholder="What is changing in the business, market, or enterprise environment?" /></label><label className="executive-full">Scope of responsibility<textarea value={scopeDescription} onChange={(event) => setScopeDescription(event.target.value)} placeholder="What business, functions, people, customers, or P&L are in your remit?" /></label><label className="executive-full">Why does this role exist right now?<textarea value={mandateStatement} onChange={(event) => setMandateStatement(event.target.value)} placeholder="Describe the enterprise outcome, change, or responsibility that defines this role." /></label><label>Operating mode<select value={transitionMode} onChange={(event) => setTransitionMode(event.target.value as typeof transitionMode)}><option value="executive_performance">Established executive role</option><option value="first_180_days">New executive transition</option></select></label><label className="executive-full">Stakeholder context<textarea value={stakeholderSummary} onChange={(event) => setStakeholderSummary(event.target.value)} placeholder="Board, CEO, peers, customers, investors, regulators, and critical relationships." /></label></div><div className="executive-form-actions"><span>{contextComplete ? "Context captured — refine it as the business changes." : "Start with your role and current mandate."}</span><button className="executive-primary" disabled={!roleTitle.trim() || !mandateStatement.trim() || saveContext.isPending} onClick={() => saveContext.mutate({ roleTitle, roleType, businessName, businessDescription, geography, scopeDescription, mandateStatement, stakeholderSummary, transitionMode, runAttention: attention.run, transformAttention: attention.transform, buildAttention: attention.build })}>{saveContext.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save context</button></div></div>}{!contextOpen && <div className="executive-context-summary"><p><b>{workspace?.profile?.roleTitle}</b>{workspace?.profile?.businessName ? ` · ${workspace.profile.businessName}` : ""}</p><p>{workspace?.profile?.mandateStatement}</p></div>}<div className="executive-priorities"><div className="executive-section-head"><div><p className="executive-kicker">Living mandate</p><h3>Prioritise three to five consequential outcomes.</h3></div>{priorityReady && <button className="executive-text-button" onClick={() => saveMandate.mutate({ priorities: priorities.filter((priority) => priority.title.trim()) })}>{saveMandate.isPending ? "Saving…" : "Save mandate"}</button>}</div>{priorities.map((priority, index) => <div className="executive-priority-row" key={priority.id}><span>{index + 1}</span><input value={priority.title} onChange={(event) => updatePriority(index, { title: event.target.value })} placeholder="A consequence that matters to the business" /><select value={priority.area} onChange={(event) => updatePriority(index, { area: event.target.value as PriorityDraft["area"] })}>{PRIORITY_AREAS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>)}{priorities.length < 5 && <button className="executive-add" onClick={() => setPriorities((items) => [...items, { id: `priority-${items.length + 1}`, title: "", area: "transformation", outcome: "", progress: "not_started" }])}><Plus size={14} /> Add priority</button>}</div></article><aside className="executive-card executive-attention"><p className="executive-kicker">Attention allocation</p><h2>Run. Transform. Build.</h2><p className="executive-note">Make the allocation visible. The right balance depends on your mandate.</p><div className="executive-attention-bars">{attentionBars.map((item) => <label key={item.label}><span><b>{item.label}</b><em>{item.value}%</em></span><input type="range" min="0" max="100" value={item.value} onChange={(event) => setAttention((current) => ({ ...current, [item.label.toLowerCase()]: Number(event.target.value) }))} style={{ accentColor: item.color }} /></label>)}</div><div className="executive-total"><span>Recorded allocation</span><b>{attentionTotal}%</b></div><p className="executive-small-note">This is an attention prompt, not a score. Temporary imbalance can be exactly right.</p></aside></section>
      <section className="executive-actions"><div className="executive-section-head"><div><p className="executive-kicker">Executive actions</p><h2>Keep the interface simple. Bring real work.</h2></div></div><div className="executive-action-grid">{ACTIONS.map((action) => <button key={action.id} className={`executive-action ${activeAction === action.id ? "is-active" : ""}`} onClick={() => { setActiveAction(action.id); document.getElementById("executive-thinking")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><action.icon size={18} /><span><b>{action.title}</b><small>{action.text}</small></span><ArrowRight size={15} /></button>)}</div></section>
      <section className="executive-grid executive-grid--thinking"><article id="executive-thinking" className="executive-card executive-think"><div className="executive-section-head"><div><p className="executive-kicker">{actionCopy.kicker}</p><h2>{actionCopy.title}</h2></div><BrainCircuit size={22} /></div><textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder={actionCopy.placeholder} /><input value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} placeholder={actionCopy.outcome} /><button className="executive-primary" disabled={situation.trim().length < 12 || thinkWithMe.isPending} onClick={() => thinkWithMe.mutate({ situation, desiredOutcome: desiredOutcome || undefined, mode: executiveAction })}>{thinkWithMe.isPending ? <><Loader2 size={15} className="animate-spin" /> Thinking…</> : <><Waypoints size={15} /> {actionCopy.button}</>}</button>{analysis && <div className="executive-analysis"><div className="executive-analysis-top"><span>{analysis.primaryIntelligence.replace(/_/g, " ")}</span><em>{analysis.confidence} confidence · {analysis.evidenceLevel.replace(/_/g, " ")}</em></div><h3>{analysis.framing}</h3><div className="executive-analysis-grid"><div><p>What may not be visible</p><span>{analysis.assumptions?.[0]}</span></div><div><p>Stakeholder lens</p><span>{analysis.stakeholderLens}</span></div><div><p>Trade-off</p><span>{analysis.tradeOff}</span></div><div><p>Next best action</p><span>{analysis.nextBestAction}</span></div></div>{analysis.ontologicalDistinction && <div className="executive-distinction"><CircleDot size={15} /><span><b>{analysis.ontologicalDistinction.label}</b> · {analysis.ontologicalDistinction.inquiry}</span></div>}</div>}</article><article className="executive-card executive-decision"><div className="executive-section-head executive-decision-head"><div><p className="executive-kicker">Decision journal</p><h2>Make a consequential decision reviewable.</h2></div><button className="executive-export" type="button" onClick={exportJournal} disabled={decisionExport.isFetching}><Download size={14} /> {decisionExport.isFetching ? "Preparing…" : "Export CSV"}</button></div><p className="executive-note">Good decisions can have poor outcomes. Capture the reasoning, then revisit expected versus actual.</p><div className="executive-reminder-control"><div><BellRing size={15} /><span><b>Weekly review email</b><small>Receive a private prompt only when one or more decisions are due.</small></span></div><div className="executive-reminder-fields"><select aria-label="Decision reminder day" value={reminderDay} onChange={(event) => setReminderDay(Number(event.target.value))}>{WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><select aria-label="Decision reminder time" value={reminderHour} onChange={(event) => setReminderHour(Number(event.target.value))}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{`${String(hour).padStart(2, "0")}:00`}</option>)}</select><select aria-label="Decision reminder time zone" value={reminderTimeZone} onChange={(event) => setReminderTimeZone(event.target.value)}><option value={reminderTimeZone}>{reminderTimeZone}</option><option value="Asia/Kolkata">Asia/Kolkata</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option><option value="America/Los_Angeles">America/Los_Angeles</option></select></div><div className="executive-reminder-actions"><button className="executive-text-button" type="button" disabled={!decisionReviewReminder?.enabled || saveDecisionReviewReminder.isPending} onClick={() => saveDecisionReviewReminder.mutate({ enabled: false, localDayOfWeek: reminderDay, localHour: reminderHour, timeZone: reminderTimeZone })}>Pause</button><button className="executive-secondary" type="button" disabled={saveDecisionReviewReminder.isPending} onClick={() => saveDecisionReviewReminder.mutate({ enabled: true, localDayOfWeek: reminderDay, localHour: reminderHour, timeZone: reminderTimeZone })}>{saveDecisionReviewReminder.isPending ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}{decisionReviewReminder?.enabled ? "Save reminder" : "Turn on reminder"}</button></div></div><input value={decision} onChange={(event) => setDecision(event.target.value)} placeholder="What are you deciding?" /><textarea value={decisionContext} onChange={(event) => setDecisionContext(event.target.value)} placeholder="Why now? What is the context?" /><label className="executive-date">Review date<input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></label><button className="executive-secondary" disabled={decision.trim().length < 5 || decisionContext.trim().length < 8 || createDecision.isPending} onClick={() => createDecision.mutate({ decision, context: decisionContext, reviewDate: reviewDate ? new Date(`${reviewDate}T00:00:00`) : undefined })}>{createDecision.isPending ? <><Loader2 size={15} className="animate-spin" /> Recording…</> : "Record decision"}</button><div className="executive-journal-list">{workspace?.decisions?.length ? workspace.decisions.map((entry) => <div key={entry.id}><span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><b>{entry.decision}</b></div>) : <p>No decisions recorded yet. Start with a choice you will want to revisit in 30–90 days.</p>}</div></article></section>
      <footer className="executive-footer"><TriangleAlert size={14} /><span>LevelNext helps you see more and think better. It does not make consequential business decisions on your behalf.</span></footer>
    </div>
  </main>;
}
