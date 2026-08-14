import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { trpc } from "@/lib/trpc";
import { downloadDecisionJournal } from "@/lib/decisionJournalExport";
import {
  AlertCircle, ArrowRight, BellRing, BrainCircuit, Check, ChevronRight, Compass,
  Download, LayoutDashboard, Loader2, Menu, NotebookPen, RefreshCw, Scale,
  ShieldCheck, Sparkles, Target, Waypoints, X,
} from "lucide-react";
import type { ExecutivePriority } from "../../../shared/modules/executiveIntelligence";
import "./executive.css";

const LEVELNEXT_LOGO_URL = "/logo.png";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Section = "overview" | "think" | "decisions" | "mandate" | "context";
type Action = "prepare" | "think" | "challenge" | "debrief";
type PriorityDraft = Pick<ExecutivePriority, "title" | "area" | "outcome" | "progress"> & { id: string };

const EMPTY_PRIORITIES: PriorityDraft[] = [
  { id: "priority-1", title: "", area: "business_outcome", outcome: "", progress: "active" },
  { id: "priority-2", title: "", area: "strategic_choice", outcome: "", progress: "active" },
  { id: "priority-3", title: "", area: "organisation", outcome: "", progress: "not_started" },
];

const PRIORITY_AREAS = [["business_outcome", "Business outcome"], ["strategic_choice", "Strategic choice"], ["transformation", "Transformation"], ["organisation", "Organisation"], ["stakeholder", "Stakeholder"], ["leadership_shift", "Leadership shift"]] as const;
const ACTIONS: { id: Action; title: string; text: string; icon: typeof Compass }[] = [
  { id: "prepare", title: "Prepare me", text: "Pressure-test a consequential conversation.", icon: Compass },
  { id: "think", title: "Think with me", text: "Examine an ambiguous business situation.", icon: BrainCircuit },
  { id: "challenge", title: "Challenge my decision", text: "Test assumptions and trade-offs before commitment.", icon: Scale },
  { id: "debrief", title: "Debrief with me", text: "Turn an event into evidence for the next move.", icon: Sparkles },
];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function ExecutiveLoadingState() {
  return <main className="exec-shell"><aside className="exec-sidebar exec-sidebar--loading"><span className="exec-skeleton exec-skeleton--logo" /><span className="exec-skeleton exec-skeleton--nav" /><span className="exec-skeleton exec-skeleton--nav" /><span className="exec-skeleton exec-skeleton--nav" /></aside><section className="exec-main"><div className="exec-loading" aria-live="polite" aria-busy="true"><span className="exec-skeleton exec-skeleton--eyebrow" /><span className="exec-skeleton exec-skeleton--title" /><span className="exec-skeleton exec-skeleton--copy" /><span className="exec-skeleton exec-skeleton--panel" /></div></section></main>;
}

export default function ExecutiveIntelligence() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: workspace, isLoading, isFetching, error: workspaceError, refetch } = trpc.executiveIntelligence.getWorkspace.useQuery(undefined, { enabled: isAuthenticated, retry: 1 });
  const decisionExport = trpc.executiveIntelligence.exportDecisionJournal.useQuery(undefined, { enabled: false, retry: 1 });
  const { data: decisionReviewReminder } = trpc.executiveIntelligence.getDecisionReviewReminder.useQuery(undefined, { enabled: isAuthenticated });
  const [section, setSection] = useState<Section>("context");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<Action>("think");
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
    setSection("overview");
  }, [workspace?.profile]);

  useEffect(() => { if (workspace?.mandate?.priorities?.length) setPriorities(workspace.mandate.priorities as PriorityDraft[]); }, [workspace?.mandate?.priorities]);
  useEffect(() => { if (decisionReviewReminder) { setReminderDay(decisionReviewReminder.localDayOfWeek ?? 1); setReminderHour(decisionReviewReminder.localHour ?? 9); setReminderTimeZone(decisionReviewReminder.timeZone ?? "UTC"); } }, [decisionReviewReminder]);

  const saveContext = trpc.executiveIntelligence.saveContext.useMutation({ onSuccess: () => { utils.executiveIntelligence.getWorkspace.invalidate(); setSection("overview"); setFeedback("Executive context saved."); }, onError: (error) => setFeedback(error.message) });
  const saveMandate = trpc.executiveIntelligence.saveMandate.useMutation({ onSuccess: () => { utils.executiveIntelligence.getWorkspace.invalidate(); setFeedback("Living mandate saved."); }, onError: (error) => setFeedback(error.message) });
  const thinkWithMe = trpc.executiveIntelligence.thinkWithMe.useMutation({ onError: (error) => setFeedback(error.message) });
  const createDecision = trpc.executiveIntelligence.createDecision.useMutation({ onSuccess: () => { utils.executiveIntelligence.getWorkspace.invalidate(); setDecision(""); setDecisionContext(""); setReviewDate(""); setFeedback("Decision recorded for later review."); }, onError: (error) => setFeedback(error.message) });
  const saveDecisionReviewReminder = trpc.executiveIntelligence.saveDecisionReviewReminder.useMutation({ onSuccess: (result) => { utils.executiveIntelligence.getDecisionReviewReminder.invalidate(); setFeedback(result.enabled ? "Weekly review email saved." : "Decision-review email paused."); }, onError: (error) => setFeedback(error.message) });

  const selectSection = (next: Section) => { setSection(next); setMobileNavOpen(false); };
  const savedPriorities = (workspace?.mandate?.priorities ?? []) as ExecutivePriority[];
  const activePriorities = savedPriorities.filter((priority) => priority.progress !== "on_track").slice(0, 3);
  const reviewableDecisions = workspace?.reviewableDecisions ?? [];
  const contextComplete = Boolean(workspace?.profile?.roleTitle && workspace?.profile?.mandateStatement);
  const leadName = user?.name?.split(" ")[0] ?? "Executive";
  const priorityReady = priorities.filter((priority) => priority.title.trim()).length >= 3;
  const attentionTotal = attention.run + attention.transform + attention.build;
  const actionCopy = {
    prepare: { title: "Prepare for the room that matters.", placeholder: "What meeting, conversation, or commitment are you preparing for?", outcome: "What must move by the end of the conversation?", button: "Prepare the conversation" },
    think: { title: "Bring an issue that matters.", placeholder: "What is happening? Describe the business situation, choice, or tension in your own words.", outcome: "What would a useful outcome look like? (optional)", button: "Examine the situation" },
    challenge: { title: "Test the thinking before commitment hardens.", placeholder: "What decision, recommendation, or position do you want to pressure-test?", outcome: "What would a sound decision make possible? (optional)", button: "Challenge the decision" },
    debrief: { title: "Turn a significant event into learning.", placeholder: "What happened, and what response or outcome do you want to understand?", outcome: "What would you like to learn before the next comparable moment? (optional)", button: "Debrief the event" },
  }[activeAction];
  const analysis = thinkWithMe.data?.analysis;
  const updatePriority = (index: number, next: Partial<PriorityDraft>) => setPriorities((current) => current.map((priority, itemIndex) => itemIndex === index ? { ...priority, ...next } : priority));
  const exportJournal = async () => { const result = await decisionExport.refetch(); if (result.error) return setFeedback(result.error.message); if (!result.data?.length) return setFeedback("There are no decision records to export yet."); downloadDecisionJournal(result.data); setFeedback(`${result.data.length} decision record${result.data.length === 1 ? "" : "s"} exported as CSV.`); };

  if (loading || (isAuthenticated && isLoading)) return <ExecutiveLoadingState />;
  if (!loading && !isAuthenticated) return <main className="exec-access"><div className="exec-access-card"><img src={LEVELNEXT_LOGO_URL} alt="LevelNext" /><p>Executive Intelligence</p><h1>See more. Decide better. Lead what matters.</h1><span>Private intelligence for consequential business leadership.</span><button onClick={() => { window.location.href = getLoginUrl(); }}>Enter Executive Intelligence <ArrowRight size={16} /></button></div></main>;

  const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Executive view", icon: LayoutDashboard }, { id: "think", label: "Think with me", icon: BrainCircuit }, { id: "decisions", label: "Decision journal", icon: NotebookPen }, { id: "mandate", label: "Living mandate", icon: Target }, { id: "context", label: "Executive context", icon: ShieldCheck },
  ];

  return <main className="exec-shell">
    <aside className={`exec-sidebar ${mobileNavOpen ? "is-open" : ""}`} aria-label="Executive Intelligence navigation">
      <div className="exec-brand"><Link href="/home"><img src={LEVELNEXT_LOGO_URL} alt="LevelNext" /></Link><span>Executive<br /><b>Intelligence</b></span></div>
      <div className="exec-sidebar-label">Your workspace</div>
      <nav className="exec-nav">{navItems.map((item) => <button type="button" key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => selectSection(item.id)}><item.icon size={17} /><span>{item.label}</span>{item.id === "decisions" && reviewableDecisions.length > 0 && <i>{reviewableDecisions.length}</i>}</button>)}</nav>
      <div className="exec-sidebar-bottom"><PwaInstallButton /><span><ShieldCheck size={14} /> Private executive space</span><Link href="/guide">Open Guide <ChevronRight size={14} /></Link></div>
    </aside>
    <section className="exec-main">
      <header className="exec-topbar"><button className="exec-mobile-toggle" aria-label="Open executive navigation" onClick={() => setMobileNavOpen((open) => !open)}>{mobileNavOpen ? <X size={20} /> : <Menu size={20} />}</button><div><p>LevelNext Executive Intelligence</p><span>{transitionMode === "first_180_days" ? "First 180 days" : "Executive performance"}</span></div><button className="exec-topbar-link" type="button" onClick={() => selectSection("context")}>Update context</button></header>
      <div className="exec-content">
        {workspaceError && <section className="exec-alert exec-alert--error" role="alert"><AlertCircle size={17} /><span><b>We could not load your executive workspace.</b> {workspaceError.message}</span><button onClick={() => refetch()} disabled={isFetching}><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Try again</button></section>}
        {feedback && <section className="exec-alert" role="status"><Check size={17} /><span>{feedback}</span><button onClick={() => setFeedback(null)}>Dismiss</button></section>}

        {section === "overview" && <section className="exec-section"><div className="exec-hero"><div><p className="exec-kicker">Executive view</p><h1>{greeting()}, {leadName}.</h1><p>Focus on the choices, commitments, and conversations that genuinely move your mandate.</p></div><button className="exec-gold-button" onClick={() => selectSection("think")}><BrainCircuit size={16} /> Bring a live issue</button></div><div className="exec-overview-grid"><article className="exec-panel exec-panel--navy"><p className="exec-kicker">Your current focus</p><h2>{activePriorities[0]?.title ?? "Set your executive mandate"}</h2><span>{activePriorities[0] ? "A priority that deserves deliberate attention." : "Name the outcomes that will define this period of leadership."}</span><button onClick={() => selectSection("mandate")}>Open living mandate <ArrowRight size={14} /></button></article><article className="exec-panel"><p className="exec-kicker">Decision rhythm</p><strong>{reviewableDecisions.length}</strong><h3>decision{reviewableDecisions.length === 1 ? "" : "s"} ready for review</h3><span>Revisit the reasoning before the outcome rewrites the story.</span><button onClick={() => selectSection("decisions")}>Open journal <ArrowRight size={14} /></button></article><article className="exec-panel"><p className="exec-kicker">Context map</p><strong>{contextComplete ? "Ready" : "Start"}</strong><h3>{contextComplete ? "Your mandate is captured" : "Build your operating context"}</h3><span>Keep the intelligence layer grounded in the business you are actually leading.</span><button onClick={() => selectSection("context")}>Open context <ArrowRight size={14} /></button></article></div>{activePriorities.length > 1 && <section className="exec-list-panel"><div><p className="exec-kicker">Executive radar</p><h2>What else deserves attention</h2></div><div>{activePriorities.slice(1).map((priority) => <button key={priority.id} onClick={() => selectSection("mandate")}><span>{priority.area.replace(/_/g, " ")}</span><b>{priority.title}</b><ChevronRight size={15} /></button>)}</div></section>}</section>}

        {section === "think" && <section className="exec-section"><div className="exec-section-title"><p className="exec-kicker">Think with me</p><h1>Bring one live issue.</h1><span>The best executive thinking starts with a specific situation, not another dashboard.</span></div><div className="exec-action-grid">{ACTIONS.map((action) => <button key={action.id} className={activeAction === action.id ? "is-active" : ""} onClick={() => setActiveAction(action.id)}><action.icon size={18} /><b>{action.title}</b><span>{action.text}</span></button>)}</div><article className="exec-work-panel"><div><p className="exec-kicker">{ACTIONS.find((action) => action.id === activeAction)?.title}</p><h2>{actionCopy.title}</h2></div><textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder={actionCopy.placeholder} /><input value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} placeholder={actionCopy.outcome} /><button className="exec-navy-button" disabled={situation.trim().length < 12 || thinkWithMe.isPending} onClick={() => thinkWithMe.mutate({ situation, desiredOutcome: desiredOutcome || undefined, mode: activeAction })}>{thinkWithMe.isPending ? <><Loader2 size={15} className="animate-spin" /> Thinking…</> : <><Waypoints size={15} /> {actionCopy.button}</>}</button>{analysis && <div className="exec-analysis"><span>{analysis.primaryIntelligence.replace(/_/g, " ")} · {analysis.confidence} confidence</span><h3>{analysis.framing}</h3><div><p><b>Trade-off</b>{analysis.tradeOff}</p><p><b>Stakeholder lens</b>{analysis.stakeholderLens}</p><p><b>Next best action</b>{analysis.nextBestAction}</p></div></div>}</article></section>}

        {section === "decisions" && <section className="exec-section"><div className="exec-section-title exec-section-title--row"><div><p className="exec-kicker">Decision journal</p><h1>Make reasoning reviewable.</h1><span>Capture consequential choices before results create hindsight.</span></div><button className="exec-outline-button" onClick={exportJournal} disabled={decisionExport.isFetching}><Download size={15} /> {decisionExport.isFetching ? "Preparing…" : "Export CSV"}</button></div>{reviewableDecisions.length > 0 && <section className="exec-due-panel"><BellRing size={18} /><div><b>{reviewableDecisions.length} decision{reviewableDecisions.length === 1 ? "" : "s"} ready for a second look</b>{reviewableDecisions.map((entry) => <span key={entry.id}>{entry.decision} · {entry.reviewDate && new Date(entry.reviewDate) < new Date() ? "Overdue for review" : "Review due soon"}</span>)}</div></section>}<div className="exec-decision-layout"><article className="exec-work-panel"><p className="exec-kicker">Record a decision</p><h2>What will you want to revisit?</h2><input value={decision} onChange={(event) => setDecision(event.target.value)} placeholder="What are you deciding?" /><textarea value={decisionContext} onChange={(event) => setDecisionContext(event.target.value)} placeholder="Why now? What is the context?" /><label>Review date<input type="date" value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></label><button className="exec-navy-button" disabled={decision.trim().length < 5 || decisionContext.trim().length < 8 || createDecision.isPending} onClick={() => createDecision.mutate({ decision, context: decisionContext, reviewDate: reviewDate ? new Date(`${reviewDate}T00:00:00`) : undefined })}>{createDecision.isPending ? <><Loader2 size={15} className="animate-spin" /> Recording…</> : "Record decision"}</button></article><aside className="exec-reminder-panel"><BellRing size={18} /><h2>Weekly review email</h2><p>A private prompt, only when decisions are due.</p><select aria-label="Decision reminder day" value={reminderDay} onChange={(event) => setReminderDay(Number(event.target.value))}>{WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><select aria-label="Decision reminder time" value={reminderHour} onChange={(event) => setReminderHour(Number(event.target.value))}>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{`${String(hour).padStart(2, "0")}:00`}</option>)}</select><select aria-label="Decision reminder time zone" value={reminderTimeZone} onChange={(event) => setReminderTimeZone(event.target.value)}><option value={reminderTimeZone}>{reminderTimeZone}</option><option value="Asia/Kolkata">Asia/Kolkata</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select><div><button className="exec-text-button" disabled={!decisionReviewReminder?.enabled || saveDecisionReviewReminder.isPending} onClick={() => saveDecisionReviewReminder.mutate({ enabled: false, localDayOfWeek: reminderDay, localHour: reminderHour, timeZone: reminderTimeZone })}>Pause</button><button className="exec-gold-button" disabled={saveDecisionReviewReminder.isPending} onClick={() => saveDecisionReviewReminder.mutate({ enabled: true, localDayOfWeek: reminderDay, localHour: reminderHour, timeZone: reminderTimeZone })}>{decisionReviewReminder?.enabled ? "Save reminder" : "Turn on reminder"}</button></div></aside></div><section className="exec-journal"><p className="exec-kicker">Recent decisions</p>{workspace?.decisions?.length ? workspace.decisions.map((entry) => <div key={entry.id}><time>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><b>{entry.decision}</b></div>) : <span>No decisions recorded yet. Start with a choice you will want to revisit in 30–90 days.</span>}</section></section>}

        {section === "mandate" && <section className="exec-section"><div className="exec-section-title"><p className="exec-kicker">Living mandate</p><h1>What must genuinely move?</h1><span>Keep three to five outcomes visible; this is a lens for focus, not a scorecard.</span></div><div className="exec-mandate-layout"><article className="exec-work-panel"><div className="exec-panel-heading"><h2>Consequential outcomes</h2>{priorityReady && <button className="exec-text-button" onClick={() => saveMandate.mutate({ priorities: priorities.filter((priority) => priority.title.trim()) })}>{saveMandate.isPending ? "Saving…" : "Save mandate"}</button>}</div>{priorities.map((priority, index) => <div className="exec-priority-row" key={priority.id}><span>{index + 1}</span><input value={priority.title} onChange={(event) => updatePriority(index, { title: event.target.value })} placeholder="A consequence that matters to the business" /><select value={priority.area} onChange={(event) => updatePriority(index, { area: event.target.value as PriorityDraft["area"] })}>{PRIORITY_AREAS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>)}</article><aside className="exec-attention-panel"><p className="exec-kicker">Attention allocation</p><h2>Run. Transform. Build.</h2>{(["run", "transform", "build"] as const).map((item) => <label key={item}><span><b>{item}</b><em>{attention[item]}%</em></span><input type="range" min="0" max="100" value={attention[item]} onChange={(event) => setAttention((current) => ({ ...current, [item]: Number(event.target.value) }))} /></label>)}<div><span>Recorded allocation</span><b>{attentionTotal}%</b></div><small>Temporary imbalance can be exactly right.</small></aside></div></section>}

        {section === "context" && <section className="exec-section"><div className="exec-section-title"><p className="exec-kicker">Executive context</p><h1>Ground the intelligence.</h1><span>Qualitative business context helps the platform ask better questions. It is private to you.</span></div><article className="exec-work-panel exec-context-panel"><div className="exec-context-grid"><label>Role / title<input value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="e.g. Country Head, India" /></label><label>Executive role<select value={roleType} onChange={(event) => setRoleType(event.target.value as typeof roleType)}><option value="ceo_bu_head">CEO / Business head</option><option value="cfo">CFO / Finance</option><option value="chro">CHRO / People</option><option value="cio_cto">CIO / CTO</option><option value="coo">COO / Operations</option><option value="commercial_leader">Commercial leader</option><option value="other">Other executive role</option></select></label><label>Business / unit<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Growth business, APAC" /></label><label>Geography / market<input value={geography} onChange={(event) => setGeography(event.target.value)} placeholder="e.g. India, ASEAN, global" /></label><label className="exec-full">Business context<textarea value={businessDescription} onChange={(event) => setBusinessDescription(event.target.value)} placeholder="What is changing in the business, market, or enterprise environment?" /></label><label className="exec-full">Scope of responsibility<textarea value={scopeDescription} onChange={(event) => setScopeDescription(event.target.value)} placeholder="What business, functions, people, customers, or P&L are in your remit?" /></label><label className="exec-full">Why does this role exist right now?<textarea value={mandateStatement} onChange={(event) => setMandateStatement(event.target.value)} placeholder="Describe the enterprise outcome, change, or responsibility that defines this role." /></label><label className="exec-full">Stakeholder context<textarea value={stakeholderSummary} onChange={(event) => setStakeholderSummary(event.target.value)} placeholder="Board, CEO, peers, customers, investors, regulators, and critical relationships." /></label></div><div className="exec-form-footer"><span>{contextComplete ? "Context captured — refine it as the business changes." : "Start with your role and current mandate."}</span><button className="exec-navy-button" disabled={!roleTitle.trim() || !mandateStatement.trim() || saveContext.isPending} onClick={() => saveContext.mutate({ roleTitle, roleType, businessName, businessDescription, geography, scopeDescription, mandateStatement, stakeholderSummary, transitionMode, runAttention: attention.run, transformAttention: attention.transform, buildAttention: attention.build })}>{saveContext.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save context</button></div></article></section>}
      </div>
    </section>
  </main>;
}
