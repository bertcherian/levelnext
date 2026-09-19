import React, { useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  FlaskConical,
  Layers3,
  MessageCircle,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { careerStages } from "./landingData";
import "./landing.css";

const pilotUrl = "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=60_day_pilot";
const talkUrl = "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=talk_to_levelnext";

const impactRows = [
  { gap: "Poor delegation", consequence: "Manager bottlenecks", icon: UsersRound, label: "Delegation and team capacity" },
  { gap: "Weak coaching", consequence: "Dependent teams", icon: MessageCircle, label: "Coaching and team independence" },
  { gap: "Avoided feedback", consequence: "Persistent performance problems", icon: ShieldCheck, label: "Feedback and performance" },
  { gap: "Weak influence", consequence: "Slower decisions", icon: TrendingUp, label: "Influence and decision speed" },
  { gap: "Operational thinking", consequence: "Less strategic capacity", icon: Activity, label: "Strategic capacity and operating rhythm" },
] as const;

const pilotSteps = [
  ["01", "BASELINE", "Identify the behaviours that matter and measure the current state."],
  ["02", "CHANGE", "Participants practise, apply and improve through LevelNext."],
  ["03", "MEASURE", "Assess what changed after 60 days."],
  ["04", "DECIDE", "Review the evidence and decide whether to scale."],
] as const;

const pilotIncludes = ["20–50 participants", "Multiple employee levels", "Pre/post diagnostics", "AI coaching + simulations", "Real-work behaviour actions", "Outcome report"] as const;

function PilotButton({ children = "Start a 60-day pilot", className = "" }: { children?: React.ReactNode; className?: string }) {
  return <a className={`ln-button ${className}`.trim()} href={pilotUrl} target="_blank" rel="noreferrer">{children} <ArrowRight size={16} aria-hidden="true" /></a>;
}

function SectionEyebrow({ icon: Icon, children, light = false }: { icon: React.ElementType; children: React.ReactNode; light?: boolean }) {
  return <p className={`ln-eyebrow ${light ? "ln-eyebrow--gold" : ""}`}><span className="ln-eyebrow__icon"><Icon size={14} strokeWidth={2} aria-hidden="true" /></span>{children}</p>;
}

function SectionHeading({ id, first, second }: { id?: string; first: string; second: string }) {
  return <h2 id={id} className="ln-section-heading"><span>{first}</span><em>{second}</em></h2>;
}

function PilotVisual() {
  const stages = [
    ["01", "Baseline", "Measure"],
    ["02", "Practice", "Apply"],
    ["03", "Evidence", "Review"],
  ] as const;

  return <div className="ln-pilot-visual" aria-label="60-day pilot journey: baseline, practice, evidence, and illustrative growth">
    <div className="ln-pilot-visual__header"><span><Target size={15} aria-hidden="true" /> 60-day pilot journey</span><b>Manager cohort</b></div>
    <div className="ln-pilot-visual__body"><div className="ln-pilot-visual__track">{stages.map(([number, title, detail], index) => <div className="ln-pilot-visual__stage" key={number}><span className="ln-pilot-visual__number">{number}</span><div><strong>{title}</strong><small>{detail}</small></div>{index < stages.length - 1 && <i aria-hidden="true" />}</div>)}</div><div className="ln-pilot-visual__chart" aria-label="Illustrative behaviour-change signal rising from baseline to day 60"><div className="ln-pilot-visual__chart-title"><span><TrendingUp size={14} aria-hidden="true" /> Growth in action</span><b>Illustrative</b></div><svg viewBox="0 0 260 112" role="img" aria-label="A rising line from baseline through practice to day 60"><g className="ln-pilot-visual__chart-grid"><line x1="10" y1="18" x2="250" y2="18" /><line x1="10" y1="52" x2="250" y2="52" /><line x1="10" y1="86" x2="250" y2="86" /></g><polyline className="ln-pilot-visual__chart-line" points="10,84 48,80 82,76 115,62 148,65 182,48 214,34 250,20" /><circle cx="10" cy="84" r="3" /><circle cx="148" cy="65" r="3" /><circle cx="250" cy="20" r="3" /></svg><div className="ln-pilot-visual__chart-labels"><span>Baseline</span><span>Day 30</span><span>Day 60</span></div></div></div>
    <div className="ln-pilot-visual__footer"><span><BarChart3 size={14} aria-hidden="true" /> Pre / post visibility</span><span><CalendarClock size={14} aria-hidden="true" /> 8 weeks of action</span></div>
  </div>;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);

  return <main className="ln-landing" id="top">
    <header className="ln-nav"><a className="ln-brand" href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a><nav className="ln-nav__links" aria-label="Primary navigation"><a href="#who-its-for">Who it’s for</a><a href="#pilot">Pilot</a></nav><div className="ln-nav__actions"><a className="ln-login" href="/login?returnTo=%2Fleader">Login</a><PilotButton className="ln-button--nav" /></div><button type="button" className="ln-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button></header>
    {mobileMenuOpen && <nav className="ln-mobile-nav" id="mobile-navigation" aria-label="Mobile navigation"><a href="#who-its-for" onClick={closeMenu}>Who it’s for</a><a href="#pilot" onClick={closeMenu}>Pilot</a><a href="/login?returnTo=%2Fleader" onClick={closeMenu}>Login</a><PilotButton className="ln-button--mobile" /></nav>}

    <section className="ln-hero" aria-labelledby="hero-title"><div className="ln-grid" aria-hidden="true" /><div className="ln-hero__content ln-section-frame"><div className="ln-hero__copy-block"><SectionEyebrow icon={Sparkles} light>Human + AI behaviour change</SectionEyebrow><h1 id="hero-title"><span>Trained your Managers?</span><em>But nothing changed, right?</em></h1><p className="ln-hero__subhead">LevelNext turns leadership development into measurable behaviour change — through AI coaching, Human touch, Practice and Real-Work Actions.</p><div className="ln-hero__actions"><PilotButton /><a className="ln-button ln-button--ghost" href="#pilot">See the pilot <ArrowRight size={16} /></a></div><p className="ln-proofline"><span>20–50 people</span><i /><span>Measure before &amp; after</span><i /><span>Scale only if it works</span></p><PilotVisual /></div></div></section>

    <section className="ln-impact" aria-labelledby="impact-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={TrendingUp} light>The business impact</SectionEyebrow><SectionHeading id="impact-title" first="Small action gaps." second="Big business costs." /><p>Leadership capability isn’t an HR issue when it starts affecting execution.</p></div><div className="ln-impact-list">{impactRows.map(({ gap, consequence, icon: Icon, label }, index) => <div key={gap}><span className="ln-impact-list__number">0{index + 1}</span><span className="ln-impact-list__visual" aria-label={label}><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span><strong>{gap}</strong><ArrowRight size={18} /><b>{consequence}</b></div>)}</div></div></section>

    <section className="ln-human-support" aria-labelledby="human-support-title"><div className="ln-section-frame ln-human-support__frame"><div className="ln-human-support__intro"><SectionEyebrow icon={UsersRound} light>AI + human support</SectionEyebrow><SectionHeading id="human-support-title" first="AI helps you practise." second="A human supports you." /><p>Every person in a LevelNext programme is assigned a Success Partner—a real person who stays close to their journey, not just their dashboard.</p></div><div className="ln-human-support__commitments"><article><span><UsersRound size={18} aria-hidden="true" /></span><div><h3>Support</h3><p>Help participants turn insight into a practical next step at work.</p></div></article><article><span><Sparkles size={18} aria-hidden="true" /></span><div><h3>Encourage</h3><p>Keep momentum going when everyday priorities get in the way.</p></div></article><article><span><ShieldCheck size={18} aria-hidden="true" /></span><div><h3>Provide accountability</h3><p>Offer the human follow-through that helps each person succeed.</p></div></article></div></div></section>

    <section className="ln-platform" id="who-its-for" aria-labelledby="platform-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={Layers3} light>One platform for every stage</SectionEyebrow><SectionHeading id="platform-title" first="One platform." second="Every career stage." /><p>Different roles. Different challenges. One way to turn development into behaviour change.</p></div><div className="ln-career-path">{careerStages.map((stage, index) => <a href={stage.href} key={stage.key}><span>0{index + 1}</span><strong>{stage.shortName}</strong><small>{stage.audience}</small><ArrowRight size={15} /></a>)}</div></div></section>

    <section className="ln-pilot" id="pilot" aria-labelledby="pilot-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={FlaskConical}>The 60-day pilot</SectionEyebrow><SectionHeading id="pilot-title" first="Don’t take our word." second="Test it for 60 days." /><p>Start with a defined population and a measurable behaviour challenge. Learn what changes before you decide what to scale.</p></div><div className="ln-pilot-layout"><div className="ln-pilot-steps">{pilotSteps.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div><aside className="ln-pilot-card"><SectionEyebrow icon={Activity} light>Designed for evidence</SectionEyebrow><h3>A focused test of behaviour change.</h3><ul>{pilotIncludes.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul><PilotButton /><small>Measure first. Change behaviour. Measure again. Scale what works.</small></aside></div></div></section>

    <section className="ln-final-cta" aria-labelledby="final-title"><div className="ln-grid" aria-hidden="true" /><div className="ln-section-frame"><SectionEyebrow icon={CalendarClock} light>Your next 60 days</SectionEyebrow><SectionHeading id="final-title" first="What could change" second="in 60 days?" /><p>Choose 20–50 people. Identify the behaviours that matter. Let LevelNext help them practise and apply them. Then measure what changed.</p><div className="ln-final-cta__actions"><PilotButton>Start your pilot</PilotButton><a className="ln-button ln-button--ghost" href={talkUrl} target="_blank" rel="noreferrer">Talk to LevelNext</a></div></div></section>

    <footer className="ln-footer"><div className="ln-section-frame ln-footer__frame"><div className="ln-footer__brand"><a href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a><p>The platform that turns leadership development into measurable behaviour change.</p></div><div className="ln-footer__links"><div><p>Explore</p><a href="#who-its-for">Who it’s for</a><a href="#pilot">60-day pilot</a></div><div><p>For people</p><a href="/early-career">Early Career</a><a href="/pe">Professionals</a><a href="/manager-effectiveness">Managers</a><a href="/leader">Leaders</a><a href="/executive">Executives</a></div></div><p className="ln-footer__meta">LevelNext — A Meta Results Platform <a href="#top">Back to top <ChevronDown size={13} /></a></p></div></footer>
  </main>;
}

export { PilotButton, PilotVisual, SectionEyebrow, SectionHeading };
export { impactRows, pilotSteps, pilotIncludes, pilotUrl, talkUrl };
