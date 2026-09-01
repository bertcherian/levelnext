import React, { useState } from "react";
import { ArrowRight, Bot, CheckCircle2, ChevronRight, Compass, Cpu, Eye, GitPullRequest, Layers3, LockKeyhole, Menu, Play, ShieldCheck, Sparkles, UsersRound, X } from "lucide-react";
import "./techIntelligenceLanding.css";

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

export default function TechIntelligenceLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenarioId, setScenarioId] = useState<(typeof GAP_SCENARIOS)[number]["id"]>("delivery");
  const scenario = GAP_SCENARIOS.find((entry) => entry.id === scenarioId) ?? GAP_SCENARIOS[0];

  return (
    <main className="ti-page">
      <header className="ti-nav">
        <a href="/" className="ti-nav__brand" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a>
        <nav className="ti-nav__links" aria-label="Tech Intelligence sections"><a href="#the-gap">The gap</a><a href="#platform">Platform</a><a href="#evidence">Evidence</a><a href="#pilot">Pilot</a></nav>
        <div className="ti-nav__actions"><a href="/demo" className="ti-nav__demo"><Play size={12} fill="currentColor" /> View demo</a><a href="/login?returnTo=%2Fengineering%2Fdiagnostic" className="ti-nav__login">Log in</a></div>
        <button className="ti-nav__menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </header>
      {menuOpen && <nav className="ti-mobile-nav" aria-label="Tech Intelligence mobile sections"><a onClick={() => setMenuOpen(false)} href="#the-gap">The gap</a><a onClick={() => setMenuOpen(false)} href="#platform">Platform</a><a onClick={() => setMenuOpen(false)} href="#evidence">Evidence</a><a onClick={() => setMenuOpen(false)} href="#pilot">Pilot</a><a onClick={() => setMenuOpen(false)} href="/demo">View demo</a></nav>}

      <section className="ti-hero">
        <div className="ti-wrap ti-hero__grid">
          <div className="ti-hero__copy"><p className="ti-kicker"><span /> A LevelNext platform experience</p><h1>When technical expertise<br />is not enough <em>to move the work.</em></h1><p className="ti-hero__lede">LevelNext Tech Intelligence helps technical professionals build the judgment, influence, and leadership range that turn strong work into wider impact.</p><div className="ti-hero__actions"><a href="/demo" className="ti-button ti-button--gold"><Play size={14} fill="currentColor" /> See the experience</a><a href="#the-gap" className="ti-button ti-button--line">Explore the gap <ArrowRight size={16} /></a></div><p className="ti-hero__note"><LockKeyhole size={13} /> Developmental by design. Private reflection stays private; shared support is participant-controlled.</p></div>
          <div className="ti-hero__visual" aria-label="Tech Intelligence development system illustration"><div className="ti-visual__node ti-visual__node--self"><span>01</span><b>Self</b></div><div className="ti-visual__node ti-visual__node--team"><span>02</span><b>Team</b></div><div className="ti-visual__node ti-visual__node--system"><span>03</span><b>System</b></div><div className="ti-visual__node ti-visual__node--business"><span>04</span><b>Business</b></div><div className="ti-visual__core"><Cpu size={26} /><strong>Tech<br />Intelligence</strong><small>Insight → practice → impact</small></div><div className="ti-visual__caption">A development system for the moments where technical work meets people, choices, and consequence.</div></div>
        </div>
      </section>

      <section className="ti-gap" id="the-gap">
        <div className="ti-wrap"><div className="ti-section-head"><p className="ti-kicker ti-kicker--dark"><span /> The current state</p><h2>What is the cost of<br /><em>leaving technical growth to chance?</em></h2><p>Most technical professionals do not need another generic leadership course. They need structured support at the exact moment expertise must become clearer judgment, stronger collaboration, and wider influence.</p></div>
          <div className="ti-gap__selector" role="tablist" aria-label="Technical development gaps">{GAP_SCENARIOS.map((entry, index) => <button key={entry.id} role="tab" aria-selected={scenarioId === entry.id} className={scenarioId === entry.id ? "is-active" : ""} onClick={() => setScenarioId(entry.id)}><span>0{index + 1}</span>{entry.label}<ChevronRight size={15} /></button>)}</div>
          <article className="ti-gap__card"><div className="ti-gap__current"><p>Current state</p><h3>{scenario.current}</h3></div><div className="ti-gap__consequence"><p>Business consequence</p><h3>{scenario.consequence}</h3></div><div className="ti-gap__future"><p>Future state</p><h3>{scenario.shift}</h3><a href="#platform">How the platform responds <ArrowRight size={15} /></a></div></article>
        </div>
      </section>

      <section className="ti-evidence" id="evidence">
        <div className="ti-wrap"><div className="ti-evidence__intro"><p className="ti-kicker"><span /> Why a coaching rhythm matters</p><h2>Technology change is not<br />just a skills agenda.</h2><p>It is a judgment-and-behaviour agenda. Tech Intelligence combines a technical work context with repeated reflection, practice, and targeted human support.</p></div><div className="ti-evidence__cards"><article><strong>39%</strong><p>of core skills are expected to change by 2030, according to the World Economic Forum’s 2025 employer research.<sup><a href="#source-1">1</a></sup></p></article><article><strong>63%</strong><p>of employers in the same study cited skills gaps as their key barrier to transformation.<sup><a href="#source-1">1</a></sup></p></article><article><strong>0.43–0.74<small>g</small></strong><p>is the range reported for coping and goal-directed self-regulation in prior coaching meta-analytic evidence.<sup><a href="#source-2">2</a></sup></p></article></div><p className="ti-evidence__caveat">The research supports thoughtful coaching as a developmental intervention. It is not a promise of a fixed return, productivity lift, or individual outcome.</p></div>
      </section>

      <section className="ti-platform" id="platform">
        <div className="ti-wrap"><div className="ti-platform__header"><div><p className="ti-kicker ti-kicker--dark"><span /> Part of LevelNext</p><h2>One platform. A technical<br /><em>professional’s real work.</em></h2></div><p>Tech Intelligence is not a separate app bolted onto a coaching programme. It is a specialised LevelNext experience that brings relevant diagnostics, AI coaching, practice, playbooks, Missions, and Success Partner support into one development rhythm.</p></div><div className="ti-platform__grid">{PLATFORM_CAPABILITIES.map((capability, index) => { const Icon = capability.icon; return <article key={capability.name}><div><span>0{index + 1}</span><Icon size={20} /></div><h3>{capability.name}</h3><p>{capability.detail}</p></article>; })}</div><div className="ti-platform__boundary"><ShieldCheck size={20} /><p><strong>Designed for trust.</strong> Success Partners work from participant-shared Mission context. Diagnostic answers and private AI reflections are not exposed in the support workflow.</p></div></div>
      </section>

      <section className="ti-journey"><div className="ti-wrap"><div className="ti-journey__lead"><p className="ti-kicker"><span /> From current state to future state</p><h2>Make the next<br /><em>right move visible.</em></h2></div><ol><li><span>01</span><div><h3>Understand the moment</h3><p>A Tech Impact Diagnostic and role context establish the current pattern—not a permanent label.</p></div></li><li><span>02</span><div><h3>Practise the choice</h3><p>AI coaching and scenario practice help technical professionals prepare for real conversations and decisions.</p></div></li><li><span>03</span><div><h3>Try it in the work</h3><p>A bounded Mission moves the development from insight to a workplace experiment.</p></div></li><li><span>04</span><div><h3>Learn with support</h3><p>Private reflection and opt-in Success Partner support strengthen follow-through without surveillance.</p></div></li></ol></div></section>

      <section className="ti-pilot" id="pilot"><div className="ti-wrap ti-pilot__grid"><div><p className="ti-kicker ti-kicker--dark"><span /> Pilot conversation</p><h2>Could Tech Intelligence<br /><em>change the conversations your technical leaders are having?</em></h2><p>Explore a focused LevelNext pilot for a technical leadership population, an engineering capability priority, or a critical career transition.</p></div><aside><div><CheckCircle2 size={19} /><span>Start with a defined development challenge</span></div><div><CheckCircle2 size={19} /><span>See patterns through a diagnostic and real-work practice</span></div><div><CheckCircle2 size={19} /><span>Decide what to scale from evidence—not activity</span></div><a href="/demo#demo-enquiry" className="ti-button ti-button--navy">Discuss a Tech Intelligence pilot <ArrowRight size={16} /></a></aside></div></section>

      <footer className="ti-footer"><div className="ti-wrap"><div className="ti-footer__brand"><img src="/logo.png" alt="LevelNext" /><p>LevelNext Tech Intelligence is a specialist development experience within the LevelNext platform.</p></div><div className="ti-footer__sources"><p>Research sources</p><a id="source-1" href="https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/" target="_blank" rel="noreferrer">[1] World Economic Forum, <em>Future of Jobs Report 2025</em></a><a id="source-2" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10597717/" target="_blank" rel="noreferrer">[2] Cannon-Bowers et al., <em>Workplace coaching: a meta-analysis</em> (2023)</a></div><a className="ti-footer__top" href="#top">Back to top ↑</a></div></footer>
    </main>
  );
}
