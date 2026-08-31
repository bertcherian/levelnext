import React, { useState } from "react";
import { ArrowRight, Brain, CheckCircle2, ChevronDown, Compass, Menu, MessageSquare, Play, Scale, Search, Sparkles, TrendingUp, X } from "lucide-react";
import {
  careerStages,
  defaultStageIndex,
  getCareerStage,
} from "./landingData";
import { getAudienceIndexFromSearch } from "./landingAudience";
import "./landing.css";
import "./landingProof.css";

const organisationConversationUrl =
  "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=organisation";

const audienceOptions = [
  { label: "Early career", description: "Build a strong foundation for the first critical years of work.", href: "/early-career", cta: "Explore Early Career Intelligence", external: false },
  { label: "Professional", description: "Strengthen ownership, judgment, execution and influence in your role.", href: "/pe", cta: "Explore Professional Intelligence", external: false },
  { label: "Manager", description: "Build the operating rhythm to lead people, performance and change.", href: "/manager-effectiveness", cta: "Explore Manager Effectiveness", external: false },
  { label: "Leader", description: "Lead through complexity with greater alignment, courage and enterprise impact.", href: "/home", cta: "Explore Leader Intelligence", external: false },
  { label: "Executive", description: "Lead strategic choices with a private intelligence cockpit for mandate, decisions, and enterprise impact.", href: "/executive", cta: "Explore Executive Intelligence", external: false },
  { label: "Organisation", description: "Create one connected capability path for critical populations and priorities.", href: organisationConversationUrl, cta: "Explore for organisations", external: true },
] as const;

const intelligenceCoreSteps = [
  { label: "Diagnostics", description: "Reveal the capability signals that matter now.", icon: Search },
  { label: "Judgement", description: "Interpret evidence in the context of the role and moment.", icon: Scale },
  { label: "Recommendations", description: "Focus effort on the next move with the greatest value.", icon: Compass },
  { label: "AI Coaching", description: "Turn insight into perspective, practice, and confidence.", icon: MessageSquare },
  { label: "Simulations", description: "Rehearse high-stakes moments before they happen.", icon: Sparkles },
  { label: "Actions", description: "Embed a focused development move in real work.", icon: CheckCircle2 },
  { label: "Outcomes", description: "Make the change visible in stronger choices and results.", icon: TrendingUp },
  { label: "Learning", description: "Use what works to guide the next level of growth.", icon: Brain },
] as const;

function sectionLink(id: string) {
  return `#${id}`;
}

function getStageIndexFromSearch(search: string) {
  const requestedStage = new URLSearchParams(search).get("stage")?.trim().toLowerCase();
  const requestedIndex = careerStages.findIndex((item) => item.key === requestedStage);
  return requestedIndex >= 0 ? requestedIndex : defaultStageIndex;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStage, setActiveStage] = useState(() => typeof window === "undefined" ? defaultStageIndex : getStageIndexFromSearch(window.location.search));
  const [activeAudience, setActiveAudience] = useState(() => typeof window === "undefined" ? 0 : getAudienceIndexFromSearch(window.location.search));
  const stage = getCareerStage(activeStage);
  const audience = audienceOptions[activeAudience];

  return (
    <main className="ln-landing" id="top">
      <header className="ln-nav">
        <a className="ln-brand" href="/" aria-label="LevelNext home"><img src="/logo.png" alt="LevelNext" /></a>
        <nav className="ln-nav__links" aria-label="Primary navigation">
          <a href={sectionLink("platform")}>Platform</a>
          <a href={sectionLink("intelligence-core")}>Intelligence Core</a>
          <a href={sectionLink("organisations")}>For Organisations</a>
        </nav>
        <div className="ln-nav__actions"><a className="ln-demo-link" href="/demo"><Play size={13} fill="currentColor" /> View demo</a><a className="ln-login" href="/login?returnTo=%2Fhome">Login</a></div>
        <button type="button" className="ln-menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </header>

      {mobileMenuOpen && <nav className="ln-mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
        <a href={sectionLink("platform")} onClick={() => setMobileMenuOpen(false)}>Platform</a>
        <a href={sectionLink("intelligence-core")} onClick={() => setMobileMenuOpen(false)}>Intelligence Core</a>
        <a href={sectionLink("organisations")} onClick={() => setMobileMenuOpen(false)}>For Organisations</a>
        <a href="/demo" onClick={() => setMobileMenuOpen(false)}>View demo</a>
        <a href="/login?returnTo=%2Fhome" onClick={() => setMobileMenuOpen(false)}>Login</a>
      </nav>}

      <section className="ln-hero ln-hero--simple">
        <div className="ln-grid" aria-hidden="true" />
        <div className="ln-hero__content">
          <p className="ln-hero__overline">The Leadership Intelligence Platform</p>
          <h1>Professional intelligence<br /><em>for what comes next.</em></h1>
          <p className="ln-hero__copy">LevelNext helps people build the judgment and everyday capability required for the level they are stepping into. Through context-aware diagnostics, guided practice, and real-work action, it helps that learning become visible in the work.</p>
          <div className="ln-hero__actions"><a className="ln-button" href="/demo"><Play size={15} fill="currentColor" /> View the demo</a><a className="ln-button ln-button--ghost" href={sectionLink("platform")}>Explore the platform <ArrowRight size={17} /></a></div>
          <div className="ln-audience-selector">
            <p>Who it is for</p>
            <div className="ln-audience-selector__choices" role="tablist" aria-label="Who LevelNext is for">
              {audienceOptions.map((option, index) => <button type="button" role="tab" key={option.label} aria-selected={activeAudience === index} className={activeAudience === index ? "is-selected" : ""} onClick={() => setActiveAudience(index)}>{option.label}</button>)}
            </div>
            <div className="ln-audience-selector__answer" key={audience.label} aria-live="polite"><span>{audience.description}</span><a href={audience.href} target={audience.external ? "_blank" : undefined} rel={audience.external ? "noreferrer" : undefined}>{audience.cta} <ArrowRight size={14} /></a></div>
          </div>
        </div>
      </section>

      <section className="ln-problem ln-problem--simple" aria-labelledby="problem-title">
        <div className="ln-section-frame ln-problem__frame">
          <p className="ln-eyebrow">The problem</p>
          <h2 id="problem-title">Work keeps changing.</h2>
          <div className="ln-problem__statements"><p>Each career transition changes the judgment, relationships and responsibility the work demands.</p><p>Development should respond to that change.</p></div>
          <div className="ln-problem__answer"><strong>LevelNext starts with the person and the moment.</strong><p>Then it turns that insight into focused action in the flow of work.</p></div>
        </div>
      </section>

      <section className="ln-stages" id="platform" aria-labelledby="journey-title">
        <div className="ln-section-frame">
          <div className="ln-section-heading"><p className="ln-eyebrow ln-eyebrow--gold"><span /> The platform</p><h2 id="journey-title">A clearer next move.<br /><em>At every career stage.</em></h2><p>Choose the experience that fits the professional challenge in front of you.</p></div>
          <div className="ln-stage-picker" role="tablist" aria-label="LevelNext experiences">
            {careerStages.map((item, index) => <button type="button" role="tab" key={item.key} aria-selected={activeStage === index} className={activeStage === index ? "is-selected" : ""} onClick={() => setActiveStage(index)}><span>{item.number}</span>{item.shortName}</button>)}
          </div>
          <article className={`ln-stage-showcase ln-stage-showcase--${stage.key}`}>
            <div className="ln-stage-showcase__copy"><p className="ln-stage-showcase__number">{stage.number} / {stage.name}</p><h3>{stage.tagline}</h3><p className="ln-stage-showcase__description">{stage.description}</p><p className="ln-stage-showcase__audience">For {stage.audience}</p><a className="ln-text-link" href={stage.href}>{stage.ctaLabel} <ArrowRight size={16} /></a></div>
            <StageVisual stage={stage.key} />
          </article>
        </div>
      </section>

      <section className="ln-loop ln-loop--simple" id="how-it-works" aria-labelledby="loop-title">
        <div className="ln-section-frame ln-loop__frame">
          <div className="ln-loop__intro"><p className="ln-eyebrow">How it works</p><h2 id="loop-title">Insight that<br /><em>becomes action.</em></h2><p>One practical loop connects what matters, what to do next, and whether change is taking hold.</p></div>
          <div className="ln-loop__capabilities">
            <article><span>01</span><h3>See clearly</h3><p>Role-relevant diagnostics reveal where focused development matters most.</p></article>
            <article><span>02</span><h3>Practise deliberately</h3><p>Guide turns insight into better conversations, decisions and habits.</p></article>
            <article><span>03</span><h3>Learn what works</h3><p>Signals from real work inform the next development move.</p></article>
          </div>
        </div>
      </section>

      <section className="ln-core ln-core--simple" id="intelligence-core" aria-labelledby="core-title">
        <div className="ln-section-frame">
          <div className="ln-section-heading ln-section-heading--center"><p className="ln-eyebrow">The intelligence core</p><h2 id="core-title">One system.<br /><em>Many next-level moments.</em></h2><p>The same intelligence architecture adapts to a person’s stage, context and challenge.</p></div>
          <div className="ln-core__simple-list" aria-label="LevelNext Intelligence Core workflow">
            <div className="ln-core__simple-primary">
              {intelligenceCoreSteps.slice(0, 6).map((step, index) => {
                const Icon = step.icon;
                return <article className="ln-core__step" key={step.label}>
                  <span className="ln-core__step-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="ln-core__step-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></div>
                  <h3>{step.label}</h3>
                  <p>{step.description}</p>
                </article>;
              })}
            </div>
            <div className="ln-core__simple-outcomes">
              {intelligenceCoreSteps.slice(6).map((step, index) => {
                const Icon = step.icon;
                return <article className="ln-core__step ln-core__step--outcome" key={step.label}>
                  <span className="ln-core__step-index">{String(index + 7).padStart(2, "0")}</span>
                  <div className="ln-core__step-icon"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /></div>
                  <h3>{step.label}</h3>
                  <p>{step.description}</p>
                </article>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="ln-enterprise ln-enterprise--simple" id="organisations" aria-labelledby="enterprise-title">
        <div className="ln-section-frame ln-enterprise__frame ln-enterprise__frame--simple">
          <div className="ln-enterprise__heading"><p className="ln-eyebrow ln-eyebrow--gold"><span /> For organisations</p><h2 id="enterprise-title">Capability development<br /><em>that fits the work.</em></h2><p>Give critical populations the right insight, practice and visibility without assembling disconnected programmes.</p></div>
          <div className="ln-enterprise__benefits"><article><span>01</span><h3>Focus</h3><p>Make the capability priority and the people carrying it visible.</p></article><article><span>02</span><h3>Activate</h3><p>Give each person a development move connected to real work.</p></article><article><span>03</span><h3>Learn</h3><p>Use aggregate signals to improve the next intervention.</p></article></div>
          <div className="ln-enterprise__actions"><a className="ln-button" href={organisationConversationUrl} target="_blank" rel="noreferrer">Explore for organisations <ArrowRight size={17} /></a></div>
        </div>
      </section>

      <section className="ln-proof" id="pilot-evidence" aria-labelledby="pilot-evidence-title">
        <div className="ln-section-frame ln-proof__frame">
          <div className="ln-proof__intro"><p className="ln-eyebrow"><span /> Pilot evidence</p><h2 id="pilot-evidence-title">What would a LevelNext pilot<br /><em>make visible for your organisation?</em></h2><p>A pilot is designed to create useful evidence about the development challenge in front of you—not generic claims about transformation.</p><a className="ln-text-link" href={organisationConversationUrl} target="_blank" rel="noreferrer">Discuss a pilot <ArrowRight size={16} /></a></div>
          <div className="ln-proof__cards">
            <article><span>01</span><h3>Readiness signals</h3><p>Identify the capability patterns and next-level transitions that deserve the most deliberate focus.</p></article>
            <article><span>02</span><h3>Practice adoption</h3><p>Understand which focused, real-work experiments participants are choosing and putting into practice.</p></article>
            <article><span>03</span><h3>Support rhythm</h3><p>Learn where human coaching or manager support can best help participants turn insight into follow-through.</p></article>
          </div>
          <aside className="ln-proof__note"><p>Case studies &amp; outcomes</p><strong>Client-approved outcome stories will appear here as pilots mature.</strong><span>Until then, LevelNext will show the product experience and pilot learning agenda—not unverified results or anonymous testimonials.</span></aside>
        </div>
      </section>

      <section className="ln-final-cta">
        <div className="ln-grid" aria-hidden="true" />
        <div className="ln-section-frame ln-final-cta__frame"><p className="ln-eyebrow ln-eyebrow--gold"><span /> Your next level</p><h2>Your people already have a next level.<br /><em>Help them get ready for it.</em></h2><div className="ln-final-cta__actions"><a className="ln-button" href={organisationConversationUrl} target="_blank" rel="noreferrer">Start a conversation <ArrowRight size={17} /></a></div></div>
      </section>

      <footer className="ln-footer"><div className="ln-section-frame ln-footer__frame"><div className="ln-footer__brand"><img src="/logo.png" alt="LevelNext" /><p>Professional Intelligence for what’s next.</p></div><div className="ln-footer__links"><div><p>Platform</p><a href="/early-career">Early Career Intelligence</a><a href="/pe">Professional Intelligence</a><a href="/manager-effectiveness">Manager Effectiveness</a><a href="/home">Leader Intelligence</a><a href="/executive">Executive Intelligence</a></div><div><p>Organisations</p><a href={organisationConversationUrl} target="_blank" rel="noreferrer">Enterprise</a><a href={sectionLink("how-it-works")}>How it works</a><a href={sectionLink("intelligence-core")}>Intelligence Core</a></div></div><p className="ln-footer__meta">LevelNext — A Meta Results Platform <a href="#top">Back to top <ChevronDown size={13} /></a></p></div></footer>
    </main>
  );
}

const professionalCapabilities = [
  ["Communication", "Make intent, risk and progress easy to understand."],
  ["Ownership", "Follow through on commitments without waiting to be chased."],
  ["Execution", "Turn priorities into reliable, visible progress."],
  ["Collaboration", "Work across people and dependencies to move work forward."],
  ["Judgement", "Use evidence and context to make sound trade-offs."],
  ["Influence", "Build alignment without relying on formal authority."],
  ["Adaptability", "Respond constructively as scope and context shift."],
] as const;

function ConnectedStageMap({ kind, core, caption, capabilities }: { kind: "manager" | "executive"; core: string; caption: string; capabilities: readonly string[] }) {
  return <div className={`ln-stage-map ln-stage-map--${kind}`} aria-label={`${core} connected capability map`}><svg className="ln-stage-map__routes" viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"><path d="M300 180 L300 48 M300 180 L495 94 M300 180 L516 248 M300 180 L84 248 M300 180 L105 94" /></svg><div className="ln-stage-map__core"><span>LevelNext</span><strong>{core}</strong><i /></div>{capabilities.map((capability, index) => <div className={`ln-stage-map__node ln-stage-map__node--${index + 1}`} key={capability}><b>{String(index + 1).padStart(2, "0")}</b><span>{capability}</span></div>)}<p>{caption}</p></div>;
}

function ProfessionalVisual() {
  return <div className="ln-professional-visual" aria-label="Professional Intelligence capability map showing seven connected work capabilities"><svg className="ln-professional-visual__routes" viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"><path d="M300 180 L300 48 M300 180 L498 91 M300 180 L525 224 M300 180 L300 314 M300 180 L76 224 M300 180 L61 174 M300 180 L102 91" /></svg><div className="ln-professional-visual__core"><span>Professional</span><strong>Intelligence</strong><i /></div>{professionalCapabilities.map(([capability, explanation], index) => <button type="button" className={`ln-professional-visual__cap ln-professional-visual__cap--${capability.toLowerCase()}`} key={capability} aria-label={`${capability}: ${explanation}`}><b>{String(index + 1).padStart(2, "0")}</b><span>{capability}</span><span className="ln-professional-visual__tooltip" role="tooltip">{explanation}</span></button>)}<p className="ln-professional-visual__caption">Hover or focus a capability to see how it supports reliable execution.</p></div>;
}

function StageVisual({ stage }: { stage: string }) {
  if (stage === "early-career") return <div className="ln-early-career-visual" aria-label="Preview of LevelNext Early Career Intelligence"><span>Orient</span><span>Deliver</span><span>Connect</span><span>Grow</span><i /><b>First 1,000 Days</b><p>Real-work intelligence for the earliest stage of a career.</p></div>;
  if (stage === "manager") return <ConnectedStageMap kind="manager" core="Manager Intelligence" caption="Better management comes from making these leadership moves work together." capabilities={["Clarity", "Coaching", "Trust", "Accountability", "Momentum"]} />;
  if (stage === "leader") return <div className="ln-leader-visual" aria-label="An expanding organisational network"><span className="ln-leader-visual__centre">Leader</span><i className="ln-leader-visual__node ln-leader-visual__node--1">Team</i><i className="ln-leader-visual__node ln-leader-visual__node--2">Functions</i><i className="ln-leader-visual__node ln-leader-visual__node--3">Stakeholders</i><i className="ln-leader-visual__node ln-leader-visual__node--4">Enterprise</i></div>;
  if (stage === "executive") return <ConnectedStageMap kind="executive" core="Executive Intelligence" caption="Enterprise impact depends on holding mandate, choices and stakeholders together." capabilities={["Mandate", "Choices", "Stakeholders", "Enterprise", "Impact"]} />;
  return <ProfessionalVisual />;
}
