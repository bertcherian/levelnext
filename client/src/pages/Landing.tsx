import React, { useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Eye,
  FlaskConical,
  Layers3,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { careerStages } from "./landingData";
import "./landing.css";

const pilotUrl = "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=60_day_pilot";
const talkUrl = "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=talk_to_levelnext";

const gapRows = [
  ["They know they should delegate.", "But they still do it themselves."],
  ["They know they should coach.", "But they keep giving answers."],
  ["They know they should give feedback.", "But difficult conversations get postponed."],
  ["They know they should think strategically.", "But operations consume their day."],
  ["They know they should speak up.", "But important conversations remain unspoken."],
] as const;

const impactRows = [
  ["Poor delegation", "Manager bottlenecks"],
  ["Weak coaching", "Dependent teams"],
  ["Avoided feedback", "Persistent performance problems"],
  ["Weak influence", "Slower decisions"],
  ["Operational thinking", "Less strategic capacity"],
] as const;

const behaviourLoop = [
  ["DIAGNOSE", "Identify the behaviours that need to change."],
  ["PRACTISE", "Rehearse real situations with AI simulations."],
  ["APPLY", "Take small actions in actual work situations."],
  ["REFLECT", "Use AI coaching to learn from what happened."],
  ["IMPROVE", "Practise again with increasing challenge."],
  ["MEASURE", "Compare behaviour against the starting baseline."],
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

function ProductVisual() {
  return <div className="ln-product-visual" aria-label="LevelNext behaviour change dashboard showing baseline, practice, and measured progress">
    <div className="ln-product-visual__topbar"><span className="ln-product-visual__logo"><i /> LevelNext</span><span>Behaviour change cockpit</span><b>● Live pilot</b></div>
    <div className="ln-product-visual__body"><aside className="ln-product-visual__sidebar"><span className="is-active">Overview</span><span>Baseline</span><span>Practice</span><span>Real-work actions</span><span>Evidence</span></aside><div className="ln-product-visual__main"><p className="ln-product-visual__eyebrow">Manager cohort / 60-day pilot</p><h3>Make behaviour visible in the work.</h3><div className="ln-product-visual__metrics"><div><span>Baseline</span><strong>42</strong><small>behaviour signal</small></div><div><span>Actions logged</span><strong>68</strong><small>real-work moves</small></div><div><span>Rehearsal rhythm</span><strong>4.6<span>/5</span></strong><small>weekly practice</small></div></div><div className="ln-product-visual__chart"><div className="ln-product-visual__chart-title"><span>Development signal</span><small>Week 1 → Week 8</small></div><svg viewBox="0 0 520 130" role="img" aria-label="An upward development signal line"><path className="grid-line" d="M0 104H520M0 69H520M0 34H520" /><path className="chart-line" d="M0 96 C44 94, 54 87, 81 89 S126 75, 159 81 S204 62, 239 68 S277 51, 311 56 S354 43, 388 47 S430 27, 465 34 S497 17, 520 21" /><circle cx="520" cy="21" r="5" /></svg><div className="ln-product-visual__legend"><span><i className="legend-dot legend-dot--gold" />Behaviour in practice</span><span><i className="legend-dot legend-dot--muted" />Starting baseline</span></div></div></div></div>
  </div>;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);

  return <main className="ln-landing" id="top">
    <header className="ln-nav"><a className="ln-brand" href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a><nav className="ln-nav__links" aria-label="Primary navigation"><a href="#how-it-works">How it works</a><a href="#who-its-for">Who it’s for</a><a href="#pilot">Pilot</a><a href="#proof">About</a></nav><div className="ln-nav__actions"><a className="ln-login" href="/login?returnTo=%2Fleader">Login</a><PilotButton className="ln-button--nav" /></div><button type="button" className="ln-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button></header>
    {mobileMenuOpen && <nav className="ln-mobile-nav" id="mobile-navigation" aria-label="Mobile navigation"><a href="#how-it-works" onClick={closeMenu}>How it works</a><a href="#who-its-for" onClick={closeMenu}>Who it’s for</a><a href="#pilot" onClick={closeMenu}>Pilot</a><a href="#proof" onClick={closeMenu}>About</a><a href="/login?returnTo=%2Fleader" onClick={closeMenu}>Login</a><PilotButton className="ln-button--mobile" /></nav>}

    <section className="ln-hero" aria-labelledby="hero-title"><div className="ln-grid" aria-hidden="true" /><div className="ln-hero__content ln-section-frame"><div className="ln-hero__copy-block"><SectionEyebrow icon={Sparkles} light>Human + AI behaviour change</SectionEyebrow><h1 id="hero-title"><span>Trained your Managers?</span><em>But nothing changed, right?</em></h1><p className="ln-hero__subhead">LevelNext turns leadership development into measurable behaviour change — through AI coaching, Human touch, Practice and Real-Work Actions.</p><div className="ln-hero__actions"><PilotButton /><a className="ln-button ln-button--ghost" href="#how-it-works">See how it works <ArrowRight size={16} /></a></div><p className="ln-proofline"><span>20–50 people</span><i /><span>Measure before &amp; after</span><i /><span>Scale only if it works</span></p></div><ProductVisual /></div></section>

    <section className="ln-gap" aria-labelledby="gap-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={Eye}>The current state</SectionEyebrow><SectionHeading id="gap-title" first="Knowing isn’t the problem." second="Doing is." /><p>Most leadership development creates awareness. The harder question is whether that awareness survives the next meeting, decision or difficult conversation.</p></div><div className="ln-gap-list">{gapRows.map(([knowing, doing], index) => <article key={knowing}><span>0{index + 1}</span><p>{knowing}</p><strong>{doing}</strong></article>)}</div><p className="ln-gap-close">That’s the gap <b>LevelNext closes.</b></p></div></section>

    <section className="ln-impact" aria-labelledby="impact-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={TrendingUp} light>The business impact</SectionEyebrow><SectionHeading id="impact-title" first="Small behaviour gaps create" second="big business costs." /><p>Leadership capability isn’t an HR issue when it starts affecting execution.</p></div><div className="ln-impact-list">{impactRows.map(([gap, consequence], index) => <div key={gap}><span>0{index + 1}</span><strong>{gap}</strong><ArrowRight size={18} /><b>{consequence}</b></div>)}</div></div></section>

    <section className="ln-loop" id="how-it-works" aria-labelledby="loop-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={RefreshCw}>The behaviour-change engine</SectionEyebrow><SectionHeading id="loop-title" first="Don’t just teach it." second="Practise it." /><p>LevelNext connects insight to repeated action, so development happens in the work—not beside it.</p></div><div className="ln-loop-grid">{behaviourLoop.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div><div className="ln-loop-statement"><strong>10 minutes at a time.<em>On real work. Every week.</em></strong><PilotButton /></div></div></section>

    <section className="ln-human-support" aria-labelledby="human-support-title"><div className="ln-section-frame ln-human-support__frame"><div className="ln-human-support__intro"><SectionEyebrow icon={UsersRound} light>AI + human support</SectionEyebrow><SectionHeading id="human-support-title" first="AI helps you practise." second="A human helps it stick." /><p>Every person in a LevelNext programme is assigned a Success Partner—a real person who stays close to their journey, not just their dashboard.</p></div><div className="ln-human-support__commitments"><article><span><UsersRound size={18} aria-hidden="true" /></span><div><h3>Support</h3><p>Help participants turn insight into a practical next step at work.</p></div></article><article><span><Sparkles size={18} aria-hidden="true" /></span><div><h3>Encourage</h3><p>Keep momentum going when everyday priorities get in the way.</p></div></article><article><span><ShieldCheck size={18} aria-hidden="true" /></span><div><h3>Provide accountability</h3><p>Offer the human follow-through that helps each person succeed.</p></div></article></div></div></section>

    <section className="ln-platform" id="who-its-for" aria-labelledby="platform-title"><div className="ln-section-frame"><div className="ln-section-intro ln-section-intro--light"><SectionEyebrow icon={Layers3} light>One behaviour-change engine</SectionEyebrow><SectionHeading id="platform-title" first="One platform." second="Every career stage." /><p>Different roles. Different challenges. One way to turn development into behaviour change.</p></div><div className="ln-career-path">{careerStages.map((stage, index) => <a href={stage.href} key={stage.key}><span>0{index + 1}</span><strong>{stage.shortName}</strong><small>{stage.audience}</small><ArrowRight size={15} /></a>)}</div></div></section>

    <section className="ln-pilot" id="pilot" aria-labelledby="pilot-title"><div className="ln-section-frame"><div className="ln-section-intro"><SectionEyebrow icon={FlaskConical}>The 60-day pilot</SectionEyebrow><SectionHeading id="pilot-title" first="Don’t take our word for it." second="Test it for 60 days." /><p>Start with a defined population and a measurable behaviour challenge. Learn what changes before you decide what to scale.</p></div><div className="ln-pilot-layout"><div className="ln-pilot-steps">{pilotSteps.map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div><aside className="ln-pilot-card"><SectionEyebrow icon={Activity} light>Designed for evidence</SectionEyebrow><h3>A focused test of behaviour change.</h3><ul>{pilotIncludes.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul><PilotButton /><small>Measure first. Change behaviour. Measure again. Scale what works.</small></aside></div></div></section>

    <section className="ln-proof" id="proof" aria-labelledby="proof-title"><div className="ln-section-frame ln-proof__frame"><div><SectionEyebrow icon={ShieldCheck} light>The proof standard</SectionEyebrow><SectionHeading id="proof-title" first="Built on real" second="leadership development." /></div><div className="ln-proof__content"><p>LevelNext combines the judgement of experienced leadership practitioners with the consistency of AI coaching, simulations and real-work practice.</p><p>We will show client-approved outcome stories as pilots mature. Until then, the promise is deliberately simple: make the behaviour visible, make the change testable, and scale only what works.</p><a className="ln-text-link ln-text-link--light" href={talkUrl} target="_blank" rel="noreferrer">Talk to LevelNext <ArrowRight size={16} /></a></div></div></section>

    <section className="ln-final-cta" aria-labelledby="final-title"><div className="ln-grid" aria-hidden="true" /><div className="ln-section-frame"><SectionEyebrow icon={CalendarClock} light>Your next 60 days</SectionEyebrow><SectionHeading id="final-title" first="What could change" second="in 60 days?" /><p>Choose 20–50 people. Identify the behaviours that matter. Let LevelNext help them practise and apply them. Then measure what changed.</p><div className="ln-final-cta__actions"><PilotButton>Start your pilot</PilotButton><a className="ln-button ln-button--ghost" href={talkUrl} target="_blank" rel="noreferrer">Talk to LevelNext</a></div></div></section>

    <footer className="ln-footer"><div className="ln-section-frame ln-footer__frame"><div className="ln-footer__brand"><a href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a><p>The platform that turns leadership development into measurable behaviour change.</p></div><div className="ln-footer__links"><div><p>Explore</p><a href="#how-it-works">How it works</a><a href="#who-its-for">Who it’s for</a><a href="#pilot">60-day pilot</a><a href="#proof">About</a></div><div><p>For people</p><a href="/early-career">Early Career</a><a href="/pe">Professionals</a><a href="/manager-effectiveness">Managers</a><a href="/leader">Leaders</a><a href="/executive">Executives</a></div></div><p className="ln-footer__meta">LevelNext — A Meta Results Platform <a href="#top">Back to top <ChevronDown size={13} /></a></p></div></footer>
  </main>;
}

export { ProductVisual, PilotButton, SectionEyebrow, SectionHeading };
export { gapRows, impactRows, behaviourLoop, pilotSteps, pilotIncludes, pilotUrl, talkUrl };
