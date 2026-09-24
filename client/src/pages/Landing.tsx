import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FlaskConical,
  Gauge,
  Lightbulb,
  Menu,
  MessageCircle,
  MoveRight,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { generateLandingSummaryPdf } from "@/lib/landingSummaryPdf";
import "./landing.css";

const pilotUrl = "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=30_day_impact_test";
const talkUrl = "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=talk_to_levelnext";
type PilotScope = "small_cohort" | "business_unit";

function getPilotBookingUrl(selectedGaps: string[], pilotScope: PilotScope): string {
  const url = new URL(pilotUrl);
  if (selectedGaps.length) url.searchParams.set("manager_behaviours", selectedGaps.join(", "));
  url.searchParams.set("pilot_scope", pilotScope);
  return url.toString();
}

const behaviourGaps = [
  "Feedback comes too late",
  "Difficult conversations are avoided",
  "Managers don’t delegate enough",
  "Weak accountability",
  "Slow decision-making",
  "Too much escalation",
  "Low ownership",
  "Manager overload",
  "Rework",
  "Unwanted attrition",
] as const;

const beforeAfter = [
  ["Feedback delayed", "Feedback happens sooner"],
  ["Difficult conversations avoided", "Conversations addressed"],
  ["Manager solves everything", "Manager delegates outcomes"],
  ["Problems escalate upward", "Managers handle more"],
  ["Decisions postponed", "Decisions happen faster"],
] as const;

const personas = ["Early Career", "Individual Contributors", "Managers", "Leaders", "Executives"] as const;
const companySizePresets = [
  { label: "50 managers", managers: 50, teamSize: 6, hoursLost: 1.5 },
  { label: "100 managers", managers: 100, teamSize: 7, hoursLost: 1.5 },
  { label: "250 managers", managers: 250, teamSize: 8, hoursLost: 2 },
  { label: "500+ managers", managers: 500, teamSize: 10, hoursLost: 3 },
] as const;

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function PilotButton({ children = "Run a 30-Day Pilot Test", className = "", selectedGaps = [], pilotScope = "small_cohort" }: { children?: React.ReactNode; className?: string; selectedGaps?: string[]; pilotScope?: PilotScope }) {
  return <a className={`ln-button ${className}`.trim()} href={getPilotBookingUrl(selectedGaps, pilotScope)} target="_blank" rel="noreferrer">{children} <ArrowRight size={16} aria-hidden="true" /></a>;
}

function CostButton({ children = "Calculate Your Manager Ineffectiveness Cost", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <button type="button" className={`ln-button ln-button--ghost ${className}`.trim()} onClick={() => scrollToSection("calculator")}>{children} <ArrowRight size={16} aria-hidden="true" /></button>;
}

function CalculatorField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label><span>{label}</span><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} /><input className="ln-input-range" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${label} slider`} /></label>;
}

function SectionEyebrow({ icon: Icon, children, light = false }: { icon: React.ElementType; children: React.ReactNode; light?: boolean }) {
  return <p className={`ln-eyebrow ${light ? "ln-eyebrow--gold" : ""}`}><span className="ln-eyebrow__icon"><Icon size={14} strokeWidth={2} aria-hidden="true" /></span>{children}</p>;
}

function SectionHeading({ id, first, second }: { id?: string; first: string; second?: string }) {
  return <h2 id={id} className="ln-section-heading"><span>{first}</span>{second && <em>{second}</em>}</h2>;
}

function BusinessChain() {
  return <div className="ln-business-chain" aria-label="Poor management behaviour creates business cost">
    <div className="ln-chain-node ln-chain-node--behaviour"><span className="ln-chain-icon"><Gauge size={18} /></span><div><b>MANAGEMENT BEHAVIOUR</b><small>Delayed feedback · Poor delegation · Avoided conversations · Weak accountability</small></div></div>
    <ArrowDown className="ln-chain-arrow" aria-hidden="true" />
    <div className="ln-chain-node ln-chain-node--impact"><span className="ln-chain-icon"><TrendingDown size={18} /></span><div><b>BUSINESS IMPACT</b><small>Lost time · Rework · Slow execution · Escalation · Attrition</small></div></div>
    <p className="ln-chain-caption">Poor management behaviour has a business cost.</p>
  </div>;
}

function ConversationVisual() {
  return <div className="ln-conversation" aria-label="Example LevelNext conversation">
    <div className="ln-conversation__top"><span><MessageCircle size={15} /> LevelNext</span><small>Real situation → right help</small></div>
    <div className="ln-message ln-message--platform"><b>LevelNext</b><p>What are you dealing with today?</p></div>
    <div className="ln-message ln-message--manager"><b>Manager</b><p>“I’ve been putting off a difficult conversation with one of my team.”</p></div>
    <div className="ln-message ln-message--platform"><b>LevelNext</b><p>What’s making the conversation difficult?</p></div>
    <div className="ln-message ln-message--manager"><b>Manager</b><p>“I’m worried he’ll become defensive.”</p></div>
    <div className="ln-message ln-message--platform"><b>LevelNext</b><p>Let’s prepare for that. Talk it through or practise the conversation?</p><div className="ln-conversation__actions"><button type="button">Talk it through</button><button type="button">Practise it</button></div></div>
  </div>;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [managers, setManagers] = useState(250);
  const [teamSize, setTeamSize] = useState(8);
  const [hoursLost, setHoursLost] = useState(2);
  const [selectedGaps, setSelectedGaps] = useState<string[]>([]);
  const [pilotScope, setPilotScope] = useState<PilotScope>("small_cohort");
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);
  const estimatedRisk = useMemo(() => managers * teamSize * hoursLost * 52 * 500, [managers, teamSize, hoursLost]);
  const focus = selectedGaps.length ? selectedGaps.join(" • ") : "Choose up to three behaviours to expose the gap.";

  const toggleGap = (gap: string) => {
    setSelectedGaps((current) => current.includes(gap) ? current.filter((item) => item !== gap) : current.length < 3 ? [...current, gap] : current);
  };

  const handleTestBehaviours = () => {
    if (selectedGaps.length) scrollToSection("impact-test");
  };

  const applyPreset = (preset: (typeof companySizePresets)[number], index: number) => {
    setManagers(preset.managers);
    setTeamSize(preset.teamSize);
    setHoursLost(preset.hoursLost);
    setActivePreset(index);
  };

  const handleExportSummary = async () => {
    setIsExporting(true);
    try {
      await generateLandingSummaryPdf({ managers, teamSize, hoursLost, estimatedRisk, selectedGaps, pilotScope });
    } finally {
      setIsExporting(false);
    }
  };

  return <main className="ln-landing" id="top">
    <header className="ln-nav"><a className="ln-brand" href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a><nav className="ln-nav__links" aria-label="Primary navigation"><a href="#how-it-works">How It Works</a><a href="#impact-test">Impact Test</a><a href="#privacy">Evidence &amp; Privacy</a></nav><div className="ln-nav__actions"><button type="button" className="ln-nav__cost" onClick={() => scrollToSection("calculator")}>Calculate the Cost</button><a className="ln-login" href="/login?returnTo=%2Fleader">Login</a><PilotButton className="ln-button--nav" selectedGaps={selectedGaps} pilotScope={pilotScope} /></div><button type="button" className="ln-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button></header>
    {mobileMenuOpen && <nav className="ln-mobile-nav" id="mobile-navigation" aria-label="Mobile navigation"><a href="#how-it-works" onClick={closeMenu}>How It Works</a><a href="#impact-test" onClick={closeMenu}>Impact Test</a><a href="#privacy" onClick={closeMenu}>Evidence &amp; Privacy</a><button type="button" onClick={() => { closeMenu(); scrollToSection("calculator"); }}>Calculate the Cost</button><a href="/login?returnTo=%2Fleader" onClick={closeMenu}>Login</a><PilotButton className="ln-button--mobile" selectedGaps={selectedGaps} pilotScope={pilotScope} /></nav>}

    <section className="ln-hero" aria-labelledby="hero-title"><div className="ln-grid" aria-hidden="true" /><div className="ln-section-frame ln-hero__frame"><div className="ln-hero__copy"><SectionEyebrow icon={CircleDollarSign} light>Management performance leakage</SectionEyebrow><h1 id="hero-title">What are ineffective managers costing your business?</h1><p className="ln-hero__subhead">Delayed feedback. Avoided conversations. Poor delegation. Weak accountability. Slow decisions.</p><p className="ln-hero__lede">The cost shows up in lost time, rework, slower execution, manager overload and unwanted attrition.</p><div className="ln-hero__actions"><CostButton /><PilotButton selectedGaps={selectedGaps} pilotScope={pilotScope} /></div><p className="ln-hero__support">Identify the gap. Change the behaviour. Measure what moves.</p></div><BusinessChain /></div></section>

    <section className="ln-calculator" id="calculator" aria-labelledby="calculator-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={CircleDollarSign}>Make the hidden cost visible</SectionEyebrow><SectionHeading id="calculator-title" first="How much could manager performance leakage" second="be costing you?" /></div><div className="ln-preset-row" aria-label="Company size presets"><span>Quick baseline</span>{companySizePresets.map((preset, index) => <button key={preset.label} type="button" className={activePreset === index ? "is-active" : ""} aria-pressed={activePreset === index} onClick={() => applyPreset(preset, index)}>{preset.label}</button>)}</div><div className="ln-calculator__layout"><div className="ln-input-panel"><p className="ln-panel-label">Start with three inputs</p><CalculatorField label="Number of managers" min={1} max={100000} value={managers} onChange={(value) => { setManagers(value); setActivePreset(null); }} /><CalculatorField label="Average team size" min={1} max={100} value={teamSize} onChange={(value) => { setTeamSize(value); setActivePreset(null); }} /><CalculatorField label="Estimated avoidable hours lost per manager/team each week" min={0.5} max={40} step={0.5} value={hoursLost} onChange={(value) => { setHoursLost(value); setActivePreset(null); }} /></div><aside className="ln-cost-result"><span className="ln-cost-result__label">Estimated productivity capacity at risk</span><strong>{formatINR(estimatedRisk)}<small>/ year</small></strong><p>Indicative estimate based on your assumptions. Adjust the inputs to reflect your organization.</p><div className="ln-cost-result__actions"><button type="button" className="ln-text-link" onClick={() => scrollToSection("gap")}>Refine the Estimate <ArrowRight size={15} /></button><button type="button" className="ln-export-button" onClick={() => void handleExportSummary()} disabled={isExporting}><BarChart3 size={15} />{isExporting ? "Preparing PDF…" : "Export Summary"}</button></div></aside></div></div></section>

    <section className="ln-gap-selector" id="gap" aria-labelledby="gap-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={Target}>Diagnose the gap</SectionEyebrow><SectionHeading id="gap-title" first="Where does manager effectiveness" second="break down?" /><p>Select up to three behaviours. The point is not to label managers—it is to identify the business gap worth testing.</p></div><div className="ln-gap-grid">{behaviourGaps.map((gap) => <button key={gap} type="button" className={selectedGaps.includes(gap) ? "is-selected" : ""} onClick={() => toggleGap(gap)} aria-pressed={selectedGaps.includes(gap)}><span>{selectedGaps.includes(gap) ? <Check size={15} /> : <span className="ln-gap-dot" />}</span>{gap}</button>)}</div><div className="ln-gap-result"><div><span className="ln-gap-result__label">Your 30-Day Impact Test could focus on:</span><strong>{focus}</strong></div><button type="button" className="ln-button" onClick={handleTestBehaviours} disabled={!selectedGaps.length}>Test These Behaviours <ArrowRight size={16} /></button></div></div></section>

    <section className="ln-gap-story" id="how-it-works" aria-labelledby="gap-story-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={Lightbulb}>The gap</SectionEyebrow><SectionHeading id="gap-story-title" first="Your managers probably know" second="what they should do." /></div><div className="ln-know-do"><div><b>KNOWING</b><ul><li>Give feedback sooner.</li><li>Delegate outcomes.</li><li>Hold people accountable.</li><li>Challenge poor thinking.</li><li>Make decisions.</li><li>Have the difficult conversation.</li></ul></div><div className="ln-know-do__gap"><span>THE GAP</span><MoveRight size={30} /></div><div className="ln-know-do__doing"><b>DOING</b><p>The problem is doing it when the moment arrives.</p></div></div><p className="ln-gap-story__footer">Traditional development often happens away from the moment of performance. <strong>LevelNext works inside it.</strong></p></div></section>

    <section className="ln-show" aria-labelledby="show-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={MessageCircle} light>Show LevelNext</SectionEyebrow><SectionHeading id="show-title" first="Change behaviour where" second="the work actually happens." /></div><div className="ln-show__layout"><ConversationVisual /><div className="ln-show__side"><p className="ln-show__lead">No course to find. No pathway to choose.</p><p>LevelNext understands the person, their context and the situation—and serves up the help they need.</p><div className="ln-loop"><span>THINK</span><ArrowRight /><span>PRACTICE</span><ArrowRight /><span>COMMIT</span><ArrowRight /><span>ACT</span><ArrowRight /><span>FOLLOW UP</span></div><p className="ln-show__small">Sometimes listening. Sometimes coaching. Sometimes advice, challenge or practice. <strong>One LevelNext. Different help for every person and situation.</strong></p><div className="ln-personas">{personas.map((persona) => <span key={persona}>{persona}</span>)}</div></div></div></div></section>

    <section className="ln-change" aria-labelledby="change-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={TrendingUp}>Show the change</SectionEyebrow><SectionHeading id="change-title" first="What should change?" /></div><div className="ln-before-after">{beforeAfter.map(([before, after]) => <div key={before}><span>{before}</span><ArrowRight /><b>{after}</b></div>)}</div><p className="ln-change__note">These are behavioural movements LevelNext is designed to support and test—not exaggerated causal claims.</p></div></section>

    <section className="ln-measure" aria-labelledby="measure-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={BarChart3} light>Measure action</SectionEyebrow><SectionHeading id="measure-title" first="Don’t measure learning." second="Measure what people do differently." /></div><div className="ln-evidence-flow"><div><span>REAL SITUATION</span><small>Difficult conversation identified</small></div><ArrowDown /><div><span>PRACTICE</span><small>Conversation rehearsed</small></div><ArrowDown /><div><span>COMMITMENT</span><small>Real-world action agreed</small></div><ArrowDown /><div><span>ACTION</span><small>Conversation completed</small></div><ArrowDown /><div className="ln-evidence-flow__result"><span>EVIDENCE</span><small>Time to action: <strong>2 days</strong></small></div></div><div className="ln-time-to-action"><Clock3 size={21} /><div><b>TIME TO ACTION</b><p>Measure the time between recognizing an important situation and taking the required real-world action.</p></div></div></div></section>

    <section className="ln-privacy" id="privacy" aria-labelledby="privacy-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={ShieldCheck}>Privacy, kept short</SectionEyebrow><SectionHeading id="privacy-title" first="Private for the individual." second="Evidence for the organization." /></div><div className="ln-privacy__layout"><div><span>INDIVIDUAL</span><p>Private coaching<br />Reflection<br />Practice</p></div><div><span>ORGANIZATION</span><p>Participation<br />Approved measures<br />Aggregated behaviour evidence<br />Capability movement</p></div><blockquote>“Private coaching stays private.”<small>Organizations should see appropriate development evidence—not private coaching conversations.</small></blockquote></div></div></section>

    <section className="ln-impact-test" id="impact-test" aria-labelledby="impact-test-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={FlaskConical} light>Prove it before you scale it</SectionEyebrow><SectionHeading id="impact-test-title" first="Give us 30 days." second="Measure what moves." /><p>Choose three management behaviours affecting performance. Give LevelNext 30 days to demonstrate measurable movement.</p></div><div className="ln-impact-test__layout"><div className="ln-test-steps">{[["01", "IDENTIFY", "Choose 2–3 costly management behaviours."], ["02", "BASELINE", "Establish current behaviour and agreed success measures."], ["03", "CHANGE", "Work on real situations using coaching, practice, commitments and follow-through."], ["04", "MEASURE", "Assess behaviour movement, action and evidence."], ["05", "DECIDE", "Scale or stop."]].map(([number, title, copy]) => <article key={number}><span>{number}</span><div><b>{title}</b><p>{copy}</p></div></article>)}</div><aside className="ln-test-card"><h3>30-Day Manager Impact Test</h3><div className="ln-pilot-toggle" aria-label="Choose pilot size"><span className={pilotScope === "small_cohort" ? "is-active" : ""}>Small cohort</span><button type="button" role="switch" aria-checked={pilotScope === "business_unit"} aria-label="Choose pilot scope" onClick={() => setPilotScope((scope) => scope === "small_cohort" ? "business_unit" : "small_cohort")}><span /></button><span className={pilotScope === "business_unit" ? "is-active" : ""}>Business unit</span></div><p className="ln-pilot-scope-note">{pilotScope === "small_cohort" ? "A focused group of 20–30 managers." : "A larger 50+ manager business-unit test."}</p><ul><li><Check size={15} /> {pilotScope === "small_cohort" ? "20–30 managers" : "50+ managers"}</li><li><Check size={15} /> 30 days</li><li><Check size={15} /> 2–3 agreed behaviours</li><li><Check size={15} /> Named executive sponsor</li><li><Check size={15} /> Baseline before launch</li><li><Check size={15} /> Day-30 Impact Review booked before launch</li></ul><PilotButton selectedGaps={selectedGaps} pilotScope={pilotScope} /><small>Scale what works. Stop what doesn’t.</small></aside></div></div></section>

    <section className="ln-final-cta" aria-labelledby="final-title"><div className="ln-grid" aria-hidden="true" /><div className="ln-section-frame"><SectionEyebrow icon={Target} light>The controlled business experiment</SectionEyebrow><SectionHeading id="final-title" first="Pick three behaviours." second="Give us 30 days." /><p>See whether LevelNext can move management behaviour before you decide to scale.</p><div className="ln-final-cta__actions"><PilotButton>Run a 30-Day Pilot Test</PilotButton><CostButton>Calculate Your Manager Ineffectiveness Cost</CostButton></div><strong className="ln-final-cta__close">Scale what works. Stop what doesn’t.</strong></div></section>

    <footer className="ln-footer"><div className="ln-section-frame ln-footer__frame"><div className="ln-footer__brand"><a href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a><p>A management effectiveness platform that changes behaviour in the flow of real work.</p></div><div className="ln-footer__links"><div><p>Explore</p><a href="#how-it-works">How It Works</a><a href="#impact-test">Impact Test</a><a href="#privacy">Evidence &amp; Privacy</a></div><div><p>Action</p><button type="button" onClick={() => scrollToSection("calculator")}>Calculate the Cost</button><a href={talkUrl} target="_blank" rel="noreferrer">Talk to LevelNext</a></div></div><p className="ln-footer__meta">LevelNext — A Meta Results Platform <a href="#top">Back to top <ChevronDown size={13} /></a></p></div></footer>
  </main>;
}

export { PilotButton, CostButton, BusinessChain, ConversationVisual, SectionEyebrow, SectionHeading, behaviourGaps, pilotUrl, talkUrl, formatINR };
