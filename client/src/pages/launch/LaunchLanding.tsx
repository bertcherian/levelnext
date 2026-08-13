import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  Brain,
  Briefcase,
  CheckCircle2,
  FileText,
  Map,
  Mic,
  Rocket,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import "./launchLanding.css";

const LOGO_URL = "/manus-storage/LevelNext_logo_transparent_c21f58d5.png";

const missions = [
  { icon: Target, label: "Career Compass", desc: "Turn uncertainty into a credible direction and a first move.", tone: "blue" },
  { icon: Brain, label: "Story Builder", desc: "Shape a clear professional narrative for conversations and LinkedIn.", tone: "mint" },
  { icon: Zap, label: "Skill Sprint", desc: "Build work habits that help you show up with more confidence.", tone: "yellow" },
  { icon: FileText, label: "Resume Makeover", desc: "Create a practical, role-ready resume that reflects your strengths.", tone: "pink" },
  { icon: Mic, label: "Interview Intelligence", desc: "Practise the conversations that decide whether you move forward.", tone: "mint" },
  { icon: Users, label: "Negotiation Practice", desc: "Prepare to advocate for yourself when the offer conversation arrives.", tone: "blue" },
  { icon: Briefcase, label: "Application System", desc: "Organise your search so momentum is deliberate—not accidental.", tone: "yellow" },
];

const outcomes = [
  { icon: Target, title: "A clearer target", copy: "Know which roles, environments and next moves deserve your energy." },
  { icon: FileText, title: "A stronger signal", copy: "Leave with the words, stories and assets that make your value easier to see." },
  { icon: Mic, title: "More practice", copy: "Rehearse high-stakes conversations before the real opportunity appears." },
  { icon: Map, title: "A system to act", copy: "Replace random effort with a trackable launch plan you can keep moving." },
];

export default function LaunchLanding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!stickyDismissed) setShowSticky(!entry.isIntersecting);
    });
    const hero = heroRef.current;
    if (hero) observer.observe(hero);
    return () => observer.disconnect();
  }, [stickyDismissed]);

  const handleStart = () => {
    if (user) {
      navigate("/launch/onboarding");
      return;
    }
    window.location.href = getLoginUrl();
  };

  const handleSignIn = () => {
    if (user) {
      navigate("/launch/home");
      return;
    }
    window.location.href = getLoginUrl();
  };

  return (
    <main className="launch-brutal">
      <nav className="launch-brutal__nav" aria-label="Launch Intelligence navigation">
        <div className="launch-brutal__shell launch-brutal__nav-inner">
          <a className="launch-brutal__brand" href="/launch" aria-label="Launch Intelligence home">
            <span className="launch-brutal__logo-tile" aria-hidden="true">
              <img src={LOGO_URL} alt="LevelNext" />
            </span>
            <span className="launch-brutal__brand-label">Launch Intelligence</span>
          </a>
          <div className="launch-brutal__nav-actions">
            <button className="launch-brutal__text-button" type="button" onClick={handleSignIn}>{user ? "Dashboard" : "Sign in"}</button>
            <button className="launch-brutal__button launch-brutal__button--small" type="button" onClick={handleStart}>{user ? "Continue your launch" : "Start free"} <ArrowRight size={15} /></button>
          </div>
        </div>
      </nav>

      <section className="launch-brutal__shell launch-brutal__hero" ref={heroRef} aria-labelledby="launch-hero-title">
        <div>
          <p className="launch-brutal__kicker"><i /> A seven-mission career sprint</p>
          <h1 id="launch-hero-title">Are your first<br />five years <em>building your advantage?</em></h1>
          <p className="launch-brutal__lede">Launch Intelligence is an AI-guided system for early-career professionals who want to turn potential into sharper choices, stronger proof and confident action.</p>
          <div className="launch-brutal__hero-actions">
            <button className="launch-brutal__button launch-brutal__button--blue" type="button" onClick={handleStart}><Rocket size={19} /> Start the 7-mission sprint <ArrowRight size={17} /></button>
            <a className="launch-brutal__button launch-brutal__button--plain" href="#missions">See the missions <ArrowRight size={17} /></a>
          </div>
          <p className="launch-brutal__microcopy">Start with one mission <span>•</span> Build at your pace <span>•</span> Keep the work you create</p>
        </div>

        <aside className="launch-brutal__board" aria-label="Launch Intelligence overview">
          <span className="launch-brutal__board-sticker">Not another generic career course</span>
          <h2>Your launch<br />stack.</h2>
          <div className="launch-brutal__board-list">
            <div><span>01</span><p><b>Choose your direction</b><br />Clarify the next role worth pursuing.</p></div>
            <div><span>02</span><p><b>Build visible proof</b><br />Create the assets and stories to be understood.</p></div>
            <div><span>03</span><p><b>Practise the moment</b><br />Prepare for applications, interviews and offers.</p></div>
          </div>
        </aside>
      </section>

      <section className="launch-brutal__signal" aria-label="Launch Intelligence operating principles">
        <div className="launch-brutal__shell launch-brutal__signal-inner">
          <div className="launch-brutal__signal-item"><strong>7</strong><span>career missions built around the moments that move a launch forward</span></div>
          <div className="launch-brutal__signal-item"><strong>AI</strong><span>guided practice that responds to the work you are trying to do</span></div>
          <div className="launch-brutal__signal-item"><strong>REAL</strong><span>assets, conversations and actions—not just content to consume</span></div>
        </div>
      </section>

      <section className="launch-brutal__section launch-brutal__shell" id="missions" aria-labelledby="missions-title">
        <div className="launch-brutal__section-head">
          <div><p className="launch-brutal__section-label">The mission board</p><h2 id="missions-title">Build the real things your next role needs.</h2></div>
          <p>Pick up the mission that is most urgent now. Each one leaves you with a stronger move for what comes next.</p>
        </div>
        <div className="launch-brutal__mission-grid">
          {missions.map((mission, index) => {
            const Icon = mission.icon;
            return <button key={mission.label} className={`launch-brutal__mission launch-brutal__mission--${mission.tone}`} type="button" onClick={handleStart} aria-label={`Start ${mission.label}`}><span className="launch-brutal__mission-index">{String(index + 1).padStart(2, "0")}</span><Icon size={26} strokeWidth={2.6} /><h3>{mission.label}</h3><p>{mission.desc}</p></button>;
          })}
        </div>
      </section>

      <section className="launch-brutal__section launch-brutal__section--ink" aria-labelledby="outputs-title">
        <div className="launch-brutal__shell">
          <div className="launch-brutal__section-head">
            <div><p className="launch-brutal__section-label">What you leave with</p><h2 id="outputs-title">Less guessing.<br />More evidence.</h2></div>
            <p>Launch turns career ambition into work you can use—in your profile, your application, your interview and your next decision.</p>
          </div>
          <div className="launch-brutal__outputs">
            {outcomes.map((outcome) => { const Icon = outcome.icon; return <article className="launch-brutal__output" key={outcome.title}><span className="launch-brutal__output-icon"><Icon size={22} strokeWidth={2.7} /></span><h3>{outcome.title}</h3><p>{outcome.copy}</p></article>; })}
          </div>
        </div>
      </section>

      <section className="launch-brutal__section launch-brutal__section--pink" aria-labelledby="how-title">
        <div className="launch-brutal__shell">
          <div className="launch-brutal__section-head">
            <div><p className="launch-brutal__section-label">How the sprint works</p><h2 id="how-title">Move one useful step at a time.</h2></div>
            <p>You do not need to have the whole career mapped. You need a better next move—and a way to keep building from it.</p>
          </div>
          <div className="launch-brutal__steps">
            <article className="launch-brutal__step"><p className="launch-brutal__step-number">01</p><h3>Start with the friction.</h3><p>Choose the career moment that needs attention: direction, positioning, skills, interviews or applications.</p></article>
            <article className="launch-brutal__step"><p className="launch-brutal__step-number">02</p><h3>Build with Navi.</h3><p>Use AI-guided prompts, feedback and practice to create a tangible asset or stronger decision.</p></article>
            <article className="launch-brutal__step"><p className="launch-brutal__step-number">03</p><h3>Use it in the real world.</h3><p>Take the work into a conversation, application, interview or next role—then return for your next mission.</p></article>
          </div>
        </div>
      </section>

      <section className="launch-brutal__conversion" aria-labelledby="conversion-title">
        <div className="launch-brutal__shell launch-brutal__conversion-inner">
          <div><p className="launch-brutal__section-label">Your first move is ready</p><h2 id="conversion-title">Stop waiting to feel ready.</h2></div>
          <div className="launch-brutal__conversion-card">
            <p>Choose your first mission. Launch Intelligence gives you a deliberate way to build career momentum from there.</p>
            <ul><li><CheckCircle2 size={17} /> Start with the career moment that matters most.</li><li><CheckCircle2 size={17} /> Build work you can actually use.</li><li><CheckCircle2 size={17} /> Continue when the next challenge appears.</li></ul>
            <button className="launch-brutal__button launch-brutal__button--blue" type="button" onClick={handleStart}><Rocket size={18} /> Start Launch Intelligence <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>

      <footer className="launch-brutal__footer">
        <div className="launch-brutal__shell launch-brutal__footer-inner">
          <div className="launch-brutal__footer-brand">
            <span className="launch-brutal__logo-tile">
              <img src={LOGO_URL} alt="LevelNext" />
            </span>
            <span>Launch Intelligence</span>
          </div>
          <p>Built by Meta Results for ambitious early-career professionals.</p>
        </div>
      </footer>

      {showSticky && !stickyDismissed && <aside className="launch-brutal__sticky" aria-label="Start Launch Intelligence"><span>Ready to make your next move?</span><button className="launch-brutal__button launch-brutal__button--small launch-brutal__button--blue" type="button" onClick={handleStart}>Start free <ArrowRight size={15} /></button><button className="launch-brutal__sticky-dismiss" type="button" onClick={() => setStickyDismissed(true)} aria-label="Dismiss start prompt"><X size={18} /></button></aside>}
    </main>
  );
}
