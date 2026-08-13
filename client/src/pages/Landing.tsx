import * as React from "react";
import { useState, type CSSProperties, type PointerEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import {
  careerStages,
  defaultStageIndex,
  getCareerStage,
  getPersonalisationAnswer,
  intelligenceCore,
  intelligenceLoop,
  personalisationLevels,
  type PersonalisationLevel,
} from "./landingData";
import "./landing.css";

const organisationConversationUrl =
  "https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=landing&utm_campaign=organisation";

function sectionLink(id: string) {
  return `#${id}`;
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStage, setActiveStage] = useState(defaultStageIndex);
  const [activeCoreOutcome, setActiveCoreOutcome] = useState<number | null>(null);
  const [activeLevel, setActiveLevel] = useState<PersonalisationLevel>("Professional");
  const [pointer, setPointer] = useState({ x: 68, y: 46 });

  const updateHeroPointer = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const heroStyle = {
    "--pointer-x": `${pointer.x}%`,
    "--pointer-y": `${pointer.y}%`,
  } as CSSProperties;

  const stage = getCareerStage(activeStage);

  return (
    <main className="ln-landing" id="top">
      <header className="ln-nav">
        <a className="ln-brand" href="/" aria-label="LevelNext home">
          <img src="/logo.png" alt="LevelNext" />
        </a>

        <nav className="ln-nav__links" aria-label="Primary navigation">
          <a href={sectionLink("platform")}>Platform</a>
          <a href={sectionLink("intelligence-core")}>Intelligence Core</a>
          <a href={sectionLink("organisations")}>For Organisations</a>
          <a href={sectionLink("how-it-works")}>How It Works</a>
          <a href={sectionLink("resources")}>Resources</a>
        </nav>

        <div className="ln-nav__actions">
          <a className="ln-login" href="/login?returnTo=%2Fhome">Login</a>
          <a className="ln-button ln-button--small" href={sectionLink("platform")}>
            Explore LevelNext <ArrowRight size={15} />
          </a>
        </div>

        <button
          type="button"
          className="ln-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <nav className="ln-mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
          <a href={sectionLink("platform")} onClick={() => setMobileMenuOpen(false)}>Platform</a>
          <a href={sectionLink("intelligence-core")} onClick={() => setMobileMenuOpen(false)}>Intelligence Core</a>
          <a href={sectionLink("organisations")} onClick={() => setMobileMenuOpen(false)}>For Organisations</a>
          <a href={sectionLink("how-it-works")} onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href={sectionLink("resources")} onClick={() => setMobileMenuOpen(false)}>Resources</a>
          <a href="/login?returnTo=%2Fhome" onClick={() => setMobileMenuOpen(false)}>Login</a>
        </nav>
      )}

      <section className="ln-hero" onPointerMove={updateHeroPointer} style={heroStyle}>
        <div className="ln-grid" aria-hidden="true" />
        <div className="ln-hero__spotlight" aria-hidden="true" />
        <div className="ln-hero__content">
          <p className="ln-eyebrow ln-eyebrow--gold"><span /> Professional Intelligence</p>
          <h1>Your Next Level Changes<br /><em>what success demands.</em></h1>
          <p className="ln-hero__copy">
            From early career to enterprise leadership, LevelNext builds the intelligence, judgment and everyday capabilities you need for the level you’re stepping into.
          </p>
          <div className="ln-hero__actions">
            <a className="ln-button" href={sectionLink("platform")}>Explore LevelNext <ArrowRight size={17} /></a>
            <a className="ln-text-link ln-text-link--light" href={sectionLink("organisations")}>LevelNext for Organisations <ArrowRight size={16} /></a>
          </div>
        </div>

        <div className="ln-journey ln-journey--hero" aria-label="The LevelNext professional journey">
          <div className="ln-journey__line" aria-hidden="true"><i /></div>
          <div className="ln-journey__stages">
            {careerStages.map((item, index) => (
              <button
                type="button"
                key={item.key}
                className={`ln-journey-node ${index === activeStage ? "is-active" : ""}`}
                onMouseEnter={() => setActiveStage(index)}
                onFocus={() => setActiveStage(index)}
                onClick={() => setActiveStage(index)}
              >
                <span className="ln-journey-node__point"><i /></span>
                <span className="ln-journey-node__name">{item.shortName}</span>
                <span className="ln-journey-node__tagline">{item.journeyLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ln-problem" aria-labelledby="problem-title">
        <div className="ln-section-frame ln-problem__frame">
          <p className="ln-eyebrow">The problem</p>
          <h2 id="problem-title">Work keeps changing.</h2>
          <div className="ln-problem__statements">
            <p>The challenge changes when you start work.</p>
            <p>It changes when you become responsible for outcomes.</p>
            <p>It changes again when you become responsible for people.</p>
            <p>And again when you begin leading across an organisation.</p>
          </div>
          <div className="ln-problem__answer">
            <strong>Why should your development stay the same?</strong>
            <p>Traditional learning platforms start with content. <b>LevelNext starts with the individual.</b></p>
          </div>
        </div>
      </section>

      <section className="ln-stages" id="platform" aria-labelledby="journey-title">
        <div className="ln-section-frame">
          <div className="ln-section-heading">
            <p className="ln-eyebrow ln-eyebrow--gold"><span /> The journey</p>
            <h2 id="journey-title">Four Career Chapters.<br /><em>Different Capabilities.</em></h2>
            <p>LevelNext understands where each person is in their career, then builds the capabilities they need to succeed there — and prepare for what comes next.</p>
          </div>
          <div className="ln-stage-quickfilter" aria-label="Quick filter to your career stage">
            <p className="ln-stage-quickfilter__label">Find your stage:</p>
            <div className="ln-stage-quickfilter__chips">
              {careerStages.map((item, index) => (
                <button
                  type="button"
                  key={item.key}
                  aria-pressed={activeStage === index}
                  className={`ln-stage-quickfilter__chip ${activeStage === index ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveStage(index);
                    if (typeof document !== "undefined") {
                      const el = document.getElementById("platform");
                      if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                >
                  <span className="ln-stage-quickfilter__chip-num">{item.number}</span>
                  <span className="ln-stage-quickfilter__chip-name">{item.shortName}</span>
                  <span className="ln-stage-quickfilter__chip-audience">{item.audience.split(" · ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ln-stage-picker" role="tablist" aria-label="LevelNext experiences">
            {careerStages.map((item, index) => (
              <button
                type="button"
                role="tab"
                key={item.key}
                aria-selected={activeStage === index}
                className={activeStage === index ? "is-selected" : ""}
                onClick={() => setActiveStage(index)}
              >
                <span>{item.number}</span>{item.shortName}
              </button>
            ))}
          </div>

          <article className={`ln-stage-showcase ln-stage-showcase--${stage.key}`}>
            <div className="ln-stage-showcase__copy">
              <p className="ln-stage-showcase__number">{stage.number} / {stage.name}</p>
              <h3>{stage.tagline}</h3>
              <p className="ln-stage-showcase__description">{stage.description}</p>
              <p className="ln-stage-showcase__outcome"><span>Enterprise outcome</span>{stage.buyerOutcome}</p>
              <p className="ln-stage-showcase__audience">For {stage.audience}</p>
              <div className="ln-stage-showcase__focus">
                {stage.focus.map((item) => <span key={item}>{item}</span>)}
              </div>
              <a className="ln-text-link" href={stage.href}>{stage.ctaLabel} <ArrowRight size={16} /></a>
            </div>
            <StageVisual stage={stage.key} />
          </article>
        </div>
      </section>

      <section className="ln-difference" id="how-it-works" aria-labelledby="difference-title">
        <div className="ln-section-frame">
          <p className="ln-eyebrow ln-eyebrow--gold"><span /> Why LevelNext</p>
          <h2 id="difference-title"><span>Learning tells you what to learn.</span><em>LevelNext figures out what<br />you need next.</em></h2>
          <div className="ln-difference__divider" aria-hidden="true"><i /></div>
          <p className="ln-difference__closing">Insight is useful. <b>Action changes things.</b></p>
        </div>
      </section>

      <section className="ln-loop" id="intelligence-loop" aria-labelledby="loop-title">
        <div className="ln-section-frame ln-loop__frame">
          <div className="ln-loop__intro">
            <p className="ln-eyebrow">The intelligence loop</p>
            <h2 id="loop-title">Intelligence that<br /><em>turns into action.</em></h2>
            <p>LevelNext continuously turns insight into action—and action into better intelligence.</p>
          </div>
          <div className="ln-loop__visual" aria-label="LevelNext intelligence loop">
            <div className="ln-loop__orbit ln-loop__orbit--outer" />
            <div className="ln-loop__orbit ln-loop__orbit--inner" />
            <div className="ln-loop__centre"><Sparkles size={20} /><span>Level<br />Next</span></div>
            {intelligenceLoop.map((step, index) => (
              <span className={`ln-loop__step ln-loop__step--${index + 1}`} key={step}>{step}</span>
            ))}
          </div>
          <div className="ln-loop__capabilities">
            <article data-tip="Pinpoint exactly where to focus first"><span>01</span><h3>Diagnostics</h3><p>Understand what’s really happening.</p></article>
            <article data-tip="Practise real conversations before they happen"><span>02</span><h3>AI Coaching &amp; Practice</h3><p>Turn insight into better decisions and behaviours.</p></article>
            <article data-tip="Track whether behaviours are actually changing"><span>03</span><h3>Outcomes</h3><p>See whether change is actually happening.</p></article>
          </div>
        </div>
      </section>

      <section className="ln-core" id="intelligence-core" aria-labelledby="core-title">
        <div className="ln-section-frame">
          <div className="ln-section-heading ln-section-heading--center">
            <p className="ln-eyebrow">The architecture</p>
            <h2 id="core-title">Different challenges.<br /><em>One Intelligence Core.</em></h2>
            <p>Every experience adapts to the stage, while drawing on a common intelligence architecture.</p>
          </div>
          <div className="ln-core__visual" aria-label="LevelNext Intelligence Core visualisation">
            <div className="ln-core__products" aria-label="LevelNext experiences and their enterprise outcomes">
              {careerStages.map((item, index) => (
                <button
                  type="button"
                  key={item.key}
                  className={`ln-core__product-card ${activeCoreOutcome === index ? "is-outcome-open" : ""} ${activeStage === index ? "is-stage-active" : ""}`}
                  aria-pressed={activeCoreOutcome === index}
                  aria-label={`${item.name}: ${item.buyerOutcome}`}
                  onMouseEnter={() => setActiveCoreOutcome(index)}
                  onMouseLeave={() => setActiveCoreOutcome(null)}
                  onFocus={() => setActiveCoreOutcome(index)}
                  onBlur={() => setActiveCoreOutcome(null)}
                  onClick={() => {
                    setActiveStage(index);
                    setActiveCoreOutcome(index);
                  }}
                >
                  <span className="ln-core__product-name">{item.name}</span>
                  <span className="ln-core__product-outcome"><b>Enterprise outcome</b>{item.buyerOutcome}</span>
                </button>
              ))}
            </div>
            <div className="ln-core__signals" aria-hidden="true">
              {careerStages.map((item, index) => <i className={activeStage === index ? "is-active" : ""} key={item.key} />)}
            </div>
            <div className="ln-core__base">
              <p>LevelNext <b>Intelligence Core</b></p>
              <p className="ln-core__cue">Select an experience above to reveal its enterprise outcome.</p>
              <div>{intelligenceCore.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ln-enterprise" id="organisations" aria-labelledby="enterprise-title">
        <div className="ln-section-frame ln-enterprise__frame">
          <div className="ln-enterprise__heading">
            <p className="ln-eyebrow ln-eyebrow--gold"><span /> For organisations</p>
            <h2 id="enterprise-title">One platform.<br /><em>Across your talent pipeline.</em></h2>
            <p>Develop capability across levels without stitching together disconnected programmes, diagnostics, coaching tools and learning platforms.</p>
          </div>
          <div className="ln-enterprise__pipeline" aria-label="Organisational talent pipeline">
            {careerStages.map((item) => (
              <a
                key={item.key}
                className="ln-enterprise__stage"
                href={item.href}
                aria-label={`${item.ctaLabel}: ${item.pipelineMicrocopy}`}
              >
                <span>{item.audience.toUpperCase()}</span>
                <b>{item.shortName}</b>
                <p>{item.pipelineMicrocopy}</p>
              </a>
            ))}
            <div className="ln-enterprise__core-label"><span>LevelNext Intelligence Core</span><b>Organisational Intelligence</b></div>
          </div>
          <div className="ln-value-grid">
            {[
              ["Know", "Where capability gaps actually exist.", "Surface hidden capability gaps across your pipeline"],
              ["Act", "Give each person the right intervention at the right moment.", "Deliver the right development at the right time"],
              ["Develop", "Turn everyday work into development.", "Make growth a byproduct of doing the job"],
              ["Measure", "Understand whether behaviours and outcomes are changing.", "Prove ROI with behavioural data, not just feedback"],
            ].map(([label, copy, tip], index) => <article key={label} data-tip={tip}><span>{String(index + 1).padStart(2, "0")}</span><h3>{label}</h3><p>{copy}</p></article>)}
          </div>
          <div className="ln-enterprise__actions">
            <a className="ln-button" href={organisationConversationUrl} target="_blank" rel="noreferrer">Explore LevelNext for Organisations <ArrowRight size={17} /></a>
            <a className="ln-text-link ln-text-link--light" href={organisationConversationUrl} target="_blank" rel="noreferrer">Talk to us <ArrowRight size={16} /></a>
          </div>
        </div>
      </section>

      <section className="ln-implementation" aria-labelledby="implementation-title">
        <div className="ln-section-frame">
          <div className="ln-implementation__heading">
            <p className="ln-eyebrow">Implementation path</p>
            <h2 id="implementation-title">From a business priority<br /><em>to observable capability.</em></h2>
            <p>Use LevelNext to connect a business-critical capability priority with targeted development, real-work practice and leadership visibility.</p>
          </div>
          <div className="ln-implementation__grid">
            <article className="ln-implementation__case">
              <span>Illustrative organisation scenario</span>
              <h3>Prepare new managers before a fast-growing business unit changes how teams operate.</h3>
              <p>Rather than begin with a generic programme, leaders align on the management moments that matter, establish a baseline and activate the Manager Effectiveness experience for the groups carrying the change.</p>
              <div className="ln-implementation__signals">
                <p>Leaders can observe</p>
                <ul>
                  <li>Where confidence and capability differ across the manager cohort.</li>
                  <li>Which operating habits are gaining traction in real work.</li>
                  <li>Where the next intervention or leadership conversation is needed.</li>
                </ul>
              </div>
              <small>This is an illustrative implementation scenario, not a customer case study or a claim of client results.</small>
            </article>
            <ol className="ln-implementation__path" aria-label="Typical LevelNext implementation path">
              <li><span>01</span><div><b>Align the priority</b><p>Identify the business context, critical population and the behaviours that will make a practical difference.</p></div></li>
              <li><span>02</span><div><b>Establish the baseline</b><p>Use role-relevant diagnostics to make capability patterns visible before choosing interventions.</p></div></li>
              <li><span>03</span><div><b>Activate in the flow of work</b><p>Give people targeted guidance, practice and action prompts that connect directly to their role.</p></div></li>
              <li><span>04</span><div><b>Learn and tune</b><p>Review engagement and capability signals with sponsors, then adapt the next development move.</p></div></li>
            </ol>
          </div>
          <div className="ln-implementation__actions">
            <a className="ln-button ln-button--gold" href={organisationConversationUrl} target="_blank" rel="noreferrer">Map your capability priority <ArrowRight size={17} /></a>
            <p>Designed for a focused cohort, a strategic capability initiative or an enterprise-wide talent pipeline.</p>
          </div>
        </div>
      </section>

      <section className="ln-personalisation" aria-labelledby="personalisation-title">
        <div className="ln-section-frame ln-personalisation__frame">
          <div>
            <p className="ln-eyebrow">Personalisation</p>
            <h2 id="personalisation-title">The same situation.<br /><em>A different answer at every level.</em></h2>
          </div>
          <div className="ln-personalisation__scenario">
            <p className="ln-personalisation__caption">The situation</p>
            <h3>“A critical project is falling behind.”</h3>
            <div className="ln-personalisation__tabs" role="tablist" aria-label="Professional intelligence by career level">
              {personalisationLevels.map((level) => (
                <button type="button" role="tab" aria-selected={activeLevel === level} onClick={() => setActiveLevel(level)} className={activeLevel === level ? "is-selected" : ""} key={level}>{level}</button>
              ))}
            </div>
            <div className="ln-personalisation__answer"><span>LevelNext asks:</span><p>{getPersonalisationAnswer(activeLevel)}</p></div>
            <p className="ln-personalisation__conclusion">That’s <b>Professional Intelligence.</b></p>
            <div className="ln-personalisation__cta">
              <a className="ln-button ln-button--gold" href="/signup?platform=leadership&utm_source=landing&utm_medium=narrative_cta&utm_campaign=signup">Start your diagnosis <ArrowRight size={16} /></a>
              <a className="ln-text-link" href={sectionLink("platform")}>Explore the platform <ArrowRight size={15} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="ln-ecosystem" id="resources" aria-labelledby="ecosystem-title">
        <div className="ln-section-frame">
          <p className="ln-eyebrow ln-eyebrow--gold"><span /> The ecosystem</p>
          <h2 id="ecosystem-title">One B2B platform.<br /><em>Four intelligence experiences.</em></h2>
          <div className="ln-ecosystem__map" aria-label="LevelNext ecosystem map">
            <div className="ln-ecosystem__brand">LevelNext <span>Professional Intelligence</span></div>
            <div className="ln-ecosystem__columns">
              {careerStages.map((item) => (
                <div key={item.key}><p>{item.audience}</p><b>{item.name}</b></div>
              ))}
            </div>
            <div className="ln-ecosystem__foundation"><span>LevelNext Intelligence Core</span><b>Organisational Intelligence</b></div>
          </div>
        </div>
      </section>

      <section className="ln-final-cta">
        <div className="ln-grid" aria-hidden="true" />
        <div className="ln-section-frame ln-final-cta__frame">
          <p className="ln-eyebrow ln-eyebrow--gold"><span /> Your next level</p>
          <h2>Your people already have a next level.<br /><em>Help them get ready for it.</em></h2>
          <div className="ln-final-cta__actions">
            <a className="ln-button" href={sectionLink("platform")}>Explore LevelNext <ArrowRight size={17} /></a>
            <a className="ln-text-link ln-text-link--light" href={organisationConversationUrl} target="_blank" rel="noreferrer">Talk to us <ArrowRight size={16} /></a>
          </div>
        </div>
      </section>

      <footer className="ln-footer">
        <div className="ln-section-frame ln-footer__frame">
          <div className="ln-footer__brand"><img src="/logo.png" alt="LevelNext" /><p>Professional Intelligence for what’s next.</p></div>
          <div className="ln-footer__links">
            <div><p>Platform</p><a href="/early-career">Early Career Intelligence</a><a href="/pe">Professional Intelligence</a><a href="/manager-effectiveness">Manager Effectiveness</a><a href="/signup?experience=leader">Leader Intelligence</a></div>
            <div><p>Organisations</p><a href={organisationConversationUrl} target="_blank" rel="noreferrer">Enterprise</a><a href={sectionLink("how-it-works")}>Diagnostics</a><a href={sectionLink("how-it-works")}>AI Coaching</a></div>
            <div><p>Company</p><a href={organisationConversationUrl} target="_blank" rel="noreferrer">About</a><a href={sectionLink("resources")}>Insights</a><a href={organisationConversationUrl} target="_blank" rel="noreferrer">Contact</a></div>
          </div>
          <p className="ln-footer__meta">LevelNext — A Meta Results Platform <a href="#top">Back to top <ChevronDown size={13} /></a></p>
        </div>
      </footer>
    </main>
  );
}

function StageVisual({ stage }: { stage: string }) {
  if (stage === "early-career") {
    return <div className="ln-early-career-visual" aria-label="Preview of LevelNext Early Career Intelligence"><span>Orient</span><span>Deliver</span><span>Connect</span><span>Grow</span><i /><b>First 1,000 Days</b><p>Real-work intelligence for the earliest stage of a career.</p></div>;
  }
  if (stage === "manager") {
    return <div className="ln-manager-visual" aria-label="The management transition from tasks to people and outcomes"><div className="ln-manager-visual__before"><b>Me</b><span>Tasks</span></div><div className="ln-manager-visual__arrow">→</div><div className="ln-manager-visual__after"><b>Manager</b><span>People</span><span>Outcomes</span></div></div>;
  }
  if (stage === "leader") {
    return <div className="ln-leader-visual" aria-label="An expanding organisational network"><span className="ln-leader-visual__centre">Leader</span><i className="ln-leader-visual__node ln-leader-visual__node--1">Team</i><i className="ln-leader-visual__node ln-leader-visual__node--2">Functions</i><i className="ln-leader-visual__node ln-leader-visual__node--3">Stakeholders</i><i className="ln-leader-visual__node ln-leader-visual__node--4">Enterprise</i></div>;
  }
  return <div className="ln-professional-visual" aria-label="Professional effectiveness focus areas"><span>Communication</span><span>Ownership</span><span>Execution</span><span>Collaboration</span><span>Judgement</span><span>Influence</span><span>Adaptability</span><i /></div>;
}
