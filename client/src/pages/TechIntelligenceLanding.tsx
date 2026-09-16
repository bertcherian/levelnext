import React, { useState } from "react";
import { ArrowRight, Bot, Calculator, CalendarClock, CheckCircle2, ChevronRight, Compass, Cpu, Download, Eye, FileText, GitPullRequest, Layers3, LockKeyhole, Menu, Play, ShieldCheck, Sparkles, UsersRound, X } from "lucide-react";
import { calculateTechGapCost } from "../../../shared/modules/techIntelligenceCalculator";
import "./techIntelligenceLanding.css";
import "./techIntelligenceEnhancements.css";

const LEVELNEXT_LOGO_URL = "/logo.png";

const GAP_SCENARIOS = [
  {
    id: "delivery",
    label: "Delivery friction",
    current: "Strong individual contributors carry the hard technical work, but decisions wait for a small number of people to unblock them.",
    consequence: "The hidden cost is not a lack of effort. It is repeated escalation, slower handoffs, and senior expertise becoming the default queue.",
    shift: "Technical professionals learn to clarify decisions, build alignment, and turn expertise into wider system capability.",
  },
  {
    id: "decisions",
    label: "Decision friction",
    current: "Teams move quickly into solutions without making trade-offs, stakeholders, constraints, or evidence explicit.",
    consequence: "The hidden cost is avoidable rework—often discovered after commitment rather than when the decision could still change.",
    shift: "Practitioners build the judgment to frame the problem, test assumptions, and make technical choices easier to understand and act on.",
  },
  {
    id: "leadership",
    label: "Leadership friction",
    current: "New technical leaders are promoted for expertise, then asked to influence across functions, coach others, and navigate ambiguity without a practice rhythm.",
    consequence: "The hidden cost is a manager who keeps solving rather than multiplying capability, while talented people wait for direction.",
    shift: "Emerging leaders develop range through private reflection, structured practice, real-work Missions, and human Success Partner support.",
  },
] as const;

const PLATFORM_CAPABILITIES = [
  { icon: Compass, name: "Tech Impact Diagnostic", detail: "Make the current pattern visible across self-leadership, collaboration, problem framing, systems thinking, business impact, and human–AI judgment." },
  { icon: Bot, name: "Private AI Coaching", detail: "Turn live workplace moments into a private reflection, one thoughtful question, and a grounded next choice." },
  { icon: GitPullRequest, name: "Practice Studio", detail: "Rehearse difficult technical conversations, stakeholder trade-offs, and influence moves before the moment matters." },
  { icon: Layers3, name: "Technical Playbooks", detail: "Give teams reusable prompts and frameworks for decision quality, collaboration, technical leadership, and execution." },
  { icon: Sparkles, name: "Real-Work Missions", detail: "Translate an insight into one bounded workplace experiment that can be attempted, reflected on, and refined." },
  { icon: UsersRound, name: "Success Partner Support", detail: "Enable human support around participant-shared Mission context—never private reflections or diagnostic answers." },
] as const;

const RESOURCE_LIBRARY = [
  { type: "Downloadable evidence brief", title: "External Coaching Evidence Brief", detail: "A source-attributed PDF that distinguishes published coaching research and external cases from any LevelNext-specific result claim.", status: "Download PDF", href: "/manus-storage/levelnext-tech-intelligence-external-coaching-evidence-brief_0237fd4c.pdf", action: "Download briefing", download: true },
  { type: "Published ICF case example", title: "Microsoft coaching ecosystem", detail: "An ICF-published article describes estimated cost savings above USD 77m and 670.4% ROI for Microsoft Customer and Partner Solutions’ coaching ecosystem. This is an external case example, not a LevelNext benchmark or forecast.", status: "External source", href: "https://coachingfederation.org/blog/the-roi-of-coaching-why-its-worth-the-investment/", action: "Read the ICF article", download: false },
  { type: "Published coaching-culture evidence", title: "Engagement and coaching", detail: "ICF reports that 72% of respondents to the 2023 ICF/HCI study acknowledged a relationship between coaching and increased employee engagement. This is survey-based external evidence, not a LevelNext outcome claim.", status: "External source", href: "https://coachingfederation.org/blog/coaching-statistics-the-roi-of-coaching-in-2024/", action: "Read the ICF article", download: false },
] as const;

const CALCULATOR_PRESETS = [
  {
    id: "platform-engineering",
    label: "Platform Engineering",
    detail: "Dependency-heavy teams with recurring escalation and handoff friction.",
    inputs: { teamSize: 120, annualFullyLoadedCost: 3200000, weeklyFrictionHours: 2.5, workingWeeks: 48, addressableImprovementPercent: 15 },
  },
  {
    id: "core-product-engineering",
    label: "Core Product Engineering",
    detail: "Product teams balancing delivery speed, trade-offs, and cross-functional alignment.",
    inputs: { teamSize: 80, annualFullyLoadedCost: 2800000, weeklyFrictionHours: 1.75, workingWeeks: 48, addressableImprovementPercent: 12 },
  },
  {
    id: "engineering-leadership-cohort",
    label: "Engineering Leadership Cohort",
    detail: "Emerging leaders building influence, coaching range, and decision quality.",
    inputs: { teamSize: 24, annualFullyLoadedCost: 4200000, weeklyFrictionHours: 3, workingWeeks: 46, addressableImprovementPercent: 20 },
  },
] as const;

export default function TechIntelligenceLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenarioId, setScenarioId] = useState<(typeof GAP_SCENARIOS)[number]["id"]>("delivery");
  const scenario = GAP_SCENARIOS.find((entry) => entry.id === scenarioId) ?? GAP_SCENARIOS[0];

  return (
    <main id="top" className="ti-page">
      <header className="ti-nav">
        <a href="/" className="ti-nav__brand" aria-label="LevelNext home"><img src={LEVELNEXT_LOGO_URL} alt="LevelNext" /></a>
        <nav className="ti-nav__links" aria-label="Tech Intelligence sections"><a href="#the-gap">The gap</a><a href="#cost-calculator">Calculator</a><a href="#platform">Platform</a><a href="#book-demo">Book a demo</a></nav>
        <div className="ti-nav__actions"><a href="/demo" className="ti-nav__demo"><Play size={12} fill="currentColor" /> View demo</a><a href="/login?returnTo=%2Fengineering%2Fdiagnostic" className="ti-nav__login">Log in</a></div>
        <button className="ti-nav__menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </header>
      {menuOpen && <nav className="ti-mobile-nav" aria-label="Tech Intelligence mobile sections"><a onClick={() => setMenuOpen(false)} href="#the-gap">The gap</a><a onClick={() => setMenuOpen(false)} href="#cost-calculator">Calculator</a><a onClick={() => setMenuOpen(false)} href="#platform">Platform</a><a onClick={() => setMenuOpen(false)} href="#book-demo">Book a demo</a><a onClick={() => setMenuOpen(false)} href="/demo">View demo</a></nav>}

      <section className="ti-hero">
        <div className="ti-wrap ti-hero__grid">
          <div className="ti-hero__copy"><p className="ti-kicker"><span /> A LevelNext platform experience</p><h1>When technical expertise<br />is not enough <em>to move the work.</em></h1><p className="ti-hero__lede">LevelNext Tech Intelligence helps technical professionals build the judgment, influence, and leadership range that turn strong work into wider impact.</p><div className="ti-hero__actions"><a href="#book-demo" className="ti-button ti-button--gold"><CalendarClock size={15} /> Book a personalised demo</a><a href="#the-gap" className="ti-button ti-button--line">Explore the gap <ArrowRight size={16} /></a></div><p className="ti-hero__note"><LockKeyhole size={13} /> Developmental by design. Private reflection stays private; shared support is participant-controlled.</p></div>
          <div className="ti-hero__visual" aria-label="Tech Intelligence development system illustration"><div className="ti-visual__node ti-visual__node--self"><span>01</span><b>Self</b></div><div className="ti-visual__node ti-visual__node--team"><span>02</span><b>Team</b></div><div className="ti-visual__node ti-visual__node--system"><span>03</span><b>System</b></div><div className="ti-visual__node ti-visual__node--business"><span>04</span><b>Business</b></div><div className="ti-visual__core"><Cpu size={26} /><strong>Tech<br />Intelligence</strong><small>Insight → practice → impact</small></div><div className="ti-visual__caption">A development system for the moments where technical work meets people, choices, and consequence.</div></div>
        </div>
      </section>

      <section className="ti-gap" id="the-gap">
        <div className="ti-wrap"><div className="ti-section-head"><p className="ti-kicker ti-kicker--dark"><span /> The current state</p><h2>What is the cost of<br /><em>leaving technical growth to chance?</em></h2><p>Most technical professionals do not need another generic leadership course. They need structured support at the exact moment expertise must become clearer judgment, stronger collaboration, and wider influence.</p></div>
          <div className="ti-gap__selector" role="tablist" aria-label="Technical development gaps">{GAP_SCENARIOS.map((entry, index) => <button key={entry.id} role="tab" aria-selected={scenarioId === entry.id} className={scenarioId === entry.id ? "is-active" : ""} onClick={() => setScenarioId(entry.id)}><span>0{index + 1}</span>{entry.label}<ChevronRight size={15} /></button>)}</div>
          <article className="ti-gap__card"><div className="ti-gap__current"><p>Current state</p><h3>{scenario.current}</h3></div><div className="ti-gap__consequence"><p>Business consequence</p><h3>{scenario.consequence}</h3></div><div className="ti-gap__future"><p>Future state</p><h3>{scenario.shift}</h3><a href="#platform">How the platform responds <ArrowRight size={15} /></a></div></article>
        </div>
      </section>

      <GapCostCalculator />

      <section className="ti-evidence" id="evidence">
        <div className="ti-wrap"><div className="ti-evidence__intro"><p className="ti-kicker"><span /> Why a coaching rhythm matters</p><h2>Technology change is not<br />just a skills agenda.</h2><p>It is a judgment-and-behaviour agenda. Tech Intelligence combines a technical work context with repeated reflection, practice, and targeted human support.</p></div><div className="ti-evidence__cards"><article><strong>39%</strong><p>of core skills are expected to change by 2030, according to the World Economic Forum’s 2025 employer research.<sup><a href="#source-1">1</a></sup></p></article><article><strong>63%</strong><p>of employers in the same study cited skills gaps as their key barrier to transformation.<sup><a href="#source-1">1</a></sup></p></article><article><strong>0.43–0.74<small>g</small></strong><p>is the range reported for coping and goal-directed self-regulation in prior coaching meta-analytic evidence.<sup><a href="#source-2">2</a></sup></p></article></div><p className="ti-evidence__caveat">The research supports thoughtful coaching as a developmental intervention. It is not a promise of a fixed return, productivity lift, or individual outcome.</p></div>
      </section>

      <section className="ti-platform" id="platform">
        <div className="ti-wrap"><div className="ti-platform__header"><div><p className="ti-kicker ti-kicker--dark"><span /> Part of LevelNext</p><h2>One platform. A technical<br /><em>professional’s real work.</em></h2></div><p>Tech Intelligence is not a separate app bolted onto a coaching programme. It is a specialised LevelNext experience that brings relevant diagnostics, AI coaching, practice, playbooks, Missions, and Success Partner support into one development rhythm.</p></div><div className="ti-platform__grid">{PLATFORM_CAPABILITIES.map((capability, index) => { const Icon = capability.icon; return <article key={capability.name}><div><span>0{index + 1}</span><Icon size={20} /></div><h3>{capability.name}</h3><p>{capability.detail}</p></article>; })}</div><div className="ti-platform__boundary"><ShieldCheck size={20} /><p><strong>Designed for trust.</strong> Success Partners work from participant-shared Mission context. Diagnostic answers and private AI reflections are not exposed in the support workflow.</p></div></div>
      </section>

      <section className="ti-resources" id="resources"><div className="ti-wrap"><div className="ti-resources__head"><div><p className="ti-kicker ti-kicker--dark"><span /> Buyer resources</p><h2>Evidence belongs in<br /><em>the buying conversation.</em></h2></div><p>These resources bring published external evidence into the conversation. They do not claim that LevelNext will reproduce an external organisation’s ROI, savings, or engagement results.</p></div><div className="ti-resources__grid">{RESOURCE_LIBRARY.map((resource) => <article key={resource.type}><div className="ti-resource__icon"><FileText size={20} /></div><p>{resource.type}</p><h3>{resource.title}</h3><span>{resource.detail}</span><div><em>{resource.status}</em><a href={resource.href} target="_blank" rel="noreferrer" {...(resource.download ? { download: "LevelNext-Tech-Intelligence-External-Coaching-Evidence-Brief.pdf" } : {})}>{resource.action} {resource.download ? <Download size={14} /> : <ArrowRight size={14} />}</a></div></article>)}</div><p className="ti-resources__note"><ShieldCheck size={14} /> The downloadable briefing contains cited external research and a pilot-measurement approach. We do not publish a Gartner ROI statistic without a directly verifiable public primary source, and we do not present third-party figures as LevelNext outcomes.</p></div></section>

      <section className="ti-journey"><div className="ti-wrap"><div className="ti-journey__lead"><p className="ti-kicker"><span /> From current state to future state</p><h2>Make the next<br /><em>right move visible.</em></h2></div><ol><li><span>01</span><div><h3>Understand the moment</h3><p>A Tech Impact Diagnostic and role context establish the current pattern—not a permanent label.</p></div></li><li><span>02</span><div><h3>Practise the choice</h3><p>AI coaching and scenario practice help technical professionals prepare for real conversations and decisions.</p></div></li><li><span>03</span><div><h3>Try it in the work</h3><p>A bounded Mission moves the development from insight to a workplace experiment.</p></div></li><li><span>04</span><div><h3>Learn with support</h3><p>Private reflection and opt-in Success Partner support strengthen follow-through without surveillance.</p></div></li></ol></div></section>

      <section className="ti-booking" id="book-demo"><div className="ti-wrap ti-booking__grid"><div className="ti-booking__copy"><p className="ti-kicker ti-kicker--dark"><span /> Personalised demonstration</p><h2>Bring a real<br /><em>technical development gap.</em></h2><p>Book a focused conversation to explore the technical population, transition, or operating challenge you want to make visible. The session is designed around your context—not a generic product tour.</p><div><CheckCircle2 size={17} /> A 30-minute personalised Tech Intelligence walkthrough</div><div><CheckCircle2 size={17} /> A starting hypothesis for your diagnostic and practice design</div><div><CheckCircle2 size={17} /> A clear next step, whether or not a pilot is the right answer</div></div><div className="ti-booking__widget"><div className="ti-booking__widget-label"><CalendarClock size={18} /><span>Live scheduling</span><small>Choose a convenient time with Meta Results.</small></div><DirectBookingCard /></div></div></section>

      <section className="ti-pilot" id="pilot"><div className="ti-wrap ti-pilot__grid"><div><p className="ti-kicker ti-kicker--dark"><span /> Pilot conversation</p><h2>Could Tech Intelligence<br /><em>change the conversations your technical leaders are having?</em></h2><p>Explore a focused LevelNext pilot for a technical leadership population, an engineering capability priority, or a critical career transition.</p></div><aside><div><CheckCircle2 size={19} /><span>Start with a defined development challenge</span></div><div><CheckCircle2 size={19} /><span>See patterns through a diagnostic and real-work practice</span></div><div><CheckCircle2 size={19} /><span>Decide what to scale from evidence—not activity</span></div><a href="#book-demo" className="ti-button ti-button--navy">Book a personalised demo <ArrowRight size={16} /></a></aside></div></section>

      <footer className="ti-footer"><div className="ti-wrap"><div className="ti-footer__brand"><img src={LEVELNEXT_LOGO_URL} alt="LevelNext" /><p>LevelNext Tech Intelligence is a specialist development experience within the LevelNext platform.</p></div><div className="ti-footer__sources"><p>Research sources</p><a id="source-1" href="https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/" target="_blank" rel="noreferrer">[1] World Economic Forum, <em>Future of Jobs Report 2025</em></a><a id="source-2" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10597717/" target="_blank" rel="noreferrer">[2] Cannon-Bowers et al., <em>Workplace coaching: a meta-analysis</em> (2023)</a><a id="source-3" href="https://coachingfederation.org/blog/coaching-statistics-the-roi-of-coaching-in-2024/" target="_blank" rel="noreferrer">[3] International Coaching Federation, <em>Coaching Statistics: The ROI of Coaching</em> (2024)</a><a id="source-4" href="https://coachingfederation.org/blog/the-roi-of-coaching-why-its-worth-the-investment/" target="_blank" rel="noreferrer">[4] International Coaching Federation, <em>The ROI of Coaching: Why It’s Worth the Investment</em> (2026)</a></div><a className="ti-footer__top" href="#top">Back to top ↑</a></div></footer>
    </main>
  );
}

function GapCostCalculator() {
  const [inputs, setInputs] = useState({ teamSize: 75, annualFullyLoadedCost: 2400000, weeklyFrictionHours: 2, workingWeeks: 48, addressableImprovementPercent: 15 });
  const [selectedPresetId, setSelectedPresetId] = useState<string>("custom");
  const result = calculateTechGapCost(inputs);
  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const edit = (field: keyof typeof inputs, value: string) => {
    setSelectedPresetId("custom");
    setInputs((current) => ({ ...current, [field]: Number.isFinite(Number(value)) ? Number(value) : 0 }));
  };
  const applyPreset = (preset: (typeof CALCULATOR_PRESETS)[number]) => {
    setSelectedPresetId(preset.id);
    setInputs({ ...preset.inputs });
  };
  return <section className="ti-calculator" id="cost-calculator"><div className="ti-wrap ti-calculator__grid"><div className="ti-calculator__intro"><p className="ti-kicker ti-calculator__kicker"><span /> Cost Calculator for Not Coaching</p><h2>What is the<br /><em>exposure of the current state?</em></h2><p>Use your own planning assumptions to make the cost of repeated escalation, rework, or decision delay easier to discuss. This is an illustrative exposure calculation, not a savings forecast or ROI promise.</p><div className="ti-calculator__assumption"><Calculator size={18} /><span>Assumes a 40-hour week and makes every input visible for discussion.</span></div></div><div className="ti-calculator__panel"><div className="mb-5 rounded-2xl border border-[#DFD8CC] bg-[#FFFDF7] p-4"><div className="flex flex-col gap-1"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#102A43]">Start with an illustrative profile</p><p className="text-xs leading-5 text-black/70">Choose a technical persona, then edit any assumption below. These are planning starting points—not forecasts.</p></div><div className="mt-3 grid gap-2 sm:grid-cols-3">{CALCULATOR_PRESETS.map((preset) => <button key={preset.id} type="button" aria-pressed={selectedPresetId === preset.id} title={preset.detail} onClick={() => applyPreset(preset)} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${selectedPresetId === preset.id ? "border-[#102A43] bg-[#102A43] text-white" : "border-[#D8D0C1] bg-white text-[#102A43] hover:border-[#D9B343]"}`}>{preset.label}</button>)}</div><p className="mt-2 text-[11px] text-black/60">{selectedPresetId === "custom" ? "Custom inputs selected" : "Preset selected — all values remain editable"}</p></div><div className="ti-calculator__inputs"><CalculatorInput label="Technical population" suffix="people" value={inputs.teamSize} min={1} max={10000} onChange={(value) => edit("teamSize", value)} /><CalculatorInput label="Annual fully-loaded cost" prefix="₹" value={inputs.annualFullyLoadedCost} min={0} max={100000000} step={100000} onChange={(value) => edit("annualFullyLoadedCost", value)} /><CalculatorInput label="Weekly friction per person" suffix="hours" value={inputs.weeklyFrictionHours} min={0} max={40} step={0.5} onChange={(value) => edit("weeklyFrictionHours", value)} /><CalculatorInput label="Working weeks" suffix="weeks" value={inputs.workingWeeks} min={1} max={52} onChange={(value) => edit("workingWeeks", value)} /><CalculatorInput label="Addressable improvement" suffix="%" value={inputs.addressableImprovementPercent} min={0} max={100} step={1} onChange={(value) => edit("addressableImprovementPercent", value)} /></div><div className="ti-calculator__result"><p>Illustrative annual friction exposure</p><strong>{currency.format(result.annualFrictionExposure)}</strong><span>Approx. {result.capacityDays.toLocaleString("en-IN")} person-days per year in the selected friction scenario.</span><hr /><p>Addressable exposure at your assumption</p><b>{currency.format(result.addressableExposure)}</b><small>This is a discussion input. It is not a prediction of savings, performance, or return on investment.</small></div></div></div></section>;
}

function CalculatorInput({ label, value, onChange, prefix, suffix, min, max, step = 1 }: { label: string; value: number; onChange: (value: string) => void; prefix?: string; suffix?: string; min: number; max: number; step?: number }) {
  return <label className="ti-calc-input"><span>{label}</span><div>{prefix && <i>{prefix}</i>}<input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(event.target.value)} />{suffix && <em>{suffix}</em>}</div></label>;
}

function DirectBookingCard() {
  return <div className="ti-booking__direct-card">
    <CalendarClock size={28} aria-hidden="true" />
    <p>Book your 30-minute personalised walkthrough.</p>
    <span>Choose a convenient time in the secure Meta Results booking calendar. It opens in a new tab.</span>
    <a className="ti-booking__primary" href="https://tidycal.com/metaresults/pilot" target="_blank" rel="noreferrer">Open secure booking calendar <ArrowRight size={17} /></a>
  </div>;
}
