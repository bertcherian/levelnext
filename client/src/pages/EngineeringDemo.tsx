import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleDot, Compass, Eye, LockKeyhole, Play, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import "./engineeringDemo.css";

const VIEWS = [
  { id: "diagnostic", label: "Diagnostic", icon: CircleDot },
  { id: "profile", label: "Operating Profile", icon: Compass },
  { id: "partner", label: "Partner support", icon: UsersRound },
] as const;

type DemoView = (typeof VIEWS)[number]["id"];

export default function EngineeringDemo() {
  const [view, setView] = useState<DemoView>("diagnostic");

  return (
    <main className="ei-demo">
      <header className="ei-demo__nav">
        <a href="/" className="ei-demo__brand" aria-label="Return to LevelNext home"><img src="/logo.png" alt="LevelNext" /></a>
        <div className="ei-demo__nav-copy"><span>Engineering Intelligence</span><strong>Interactive product walkthrough</strong></div>
        <a href="/engineering/diagnostic" className="ei-demo__open-tool">Open the tool <ArrowRight size={15} /></a>
      </header>

      <section className="ei-demo__hero">
        <div><p className="ei-demo__eyebrow"><Play size={13} fill="currentColor" /> Product demo</p><h1>See how insight becomes<br /><em>a better next move.</em></h1><p>This walkthrough illustrates the Engineering Intelligence experience. It contains no personal data and does not create a participant record.</p></div>
        <aside><ShieldCheck size={23} /><div><strong>Developmental by design</strong><span>Private reflection stays with the participant. Sharing a Mission with a Success Partner is optional.</span></div></aside>
      </section>

      <section className="ei-demo__shell" aria-label="Engineering Intelligence product demo">
        <div className="ei-demo__tabs" role="tablist" aria-label="Demo screens">
          {VIEWS.map((item) => { const Icon = item.icon; const active = view === item.id; return <button type="button" key={item.id} role="tab" aria-selected={active} className={active ? "is-active" : ""} onClick={() => setView(item.id)}><Icon size={16} /> {item.label}</button>; })}
        </div>
        <div className="ei-demo__canvas">
          {view === "diagnostic" && <DiagnosticPreview />}
          {view === "profile" && <ProfilePreview />}
          {view === "partner" && <PartnerPreview />}
        </div>
      </section>

      <section className="ei-demo__next">
        <div><span>Next</span><h2>Ready to explore it in context?</h2><p>Log in to access an enrolled programme or speak with Meta Results about a LevelNext pilot for your organisation.</p></div>
        <div className="ei-demo__next-actions"><a href="/login?returnTo=%2Fengineering%2Fdiagnostic">Log in <ArrowRight size={15} /></a><a href="https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=demo" target="_blank" rel="noreferrer">Discuss a pilot <ArrowRight size={15} /></a></div>
      </section>
    </main>
  );
}

function DiagnosticPreview() {
  return <div className="ei-demo__screen"><div className="ei-demo__screen-top"><div><span>Engineering Intelligence</span><h2>Engineering Impact Diagnostic</h2></div><div className="ei-demo__progress"><small>Question 7 of 12</small><i><b /></i></div></div><div className="ei-demo__question"><p className="ei-demo__label">Systems thinking: trade-offs</p><h3>How consistently do you consider downstream consequences, dependencies, and trade-offs before changing a technical system?</h3><p>Choose the response that is most true across real work situations. There is no ideal answer.</p><div className="ei-demo__scale">{[[1,"Rarely"],[2,"Occasionally"],[3,"Sometimes"],[4,"Often"],[5,"Consistently"]].map(([score, label]) => <div key={score} className={score === 4 ? "is-selected" : ""}><b>{score}</b><span>{label}</span>{score === 4 && <Check size={17} />}</div>)}</div></div><p className="ei-demo__privacy"><LockKeyhole size={14} /> Responses remain private to the participant.</p></div>;
}

function ProfilePreview() {
  const engines = [["Self-leadership",66],["Collaboration",74],["Problem framing",80],["Systems thinking",88],["Business impact",71],["Human–AI judgment",84]];
  return <div className="ei-demo__screen"><div className="ei-demo__profile-banner"><span>Current impact pattern</span><h2>Systems builder</h2><p>Your present impact radius is <b>system</b>. This is a developmental hypothesis, not a ranking.</p></div><div className="ei-demo__profile-grid"><div><h3>Engineering engines</h3><div className="ei-demo__engines">{engines.map(([name, score]) => <div key={name as string}><p><span>{name}</span><b>{score}<small>/100</small></b></p><i><b style={{ width: `${score}%` }} /></i></div>)}</div></div><div className="ei-demo__mission"><p>Current Mission</p><h3>Test a clearer architecture decision</h3><span>Before the next architecture discussion, ask one evidence-seeking question before committing to a design direction.</span><button type="button"><Sparkles size={14} /> Accept this Mission</button><small><Eye size={13} /> Sharing this focus with a Success Partner is optional.</small></div></div></div>;
}

function PartnerPreview() {
  return <div className="ei-demo__screen"><div className="ei-demo__partner-head"><div><p>Success Partner Workspace</p><h2>A small, human queue for follow-through.</h2></div><button type="button"><Sparkles size={14} /> Refresh respectful nudges</button></div><div className="ei-demo__partner-boundary"><ShieldCheck size={16} /> Only participant-shared Mission context appears here. Private reflections and diagnostic responses are never included.</div><article className="ei-demo__partner-card"><div><p>Assigned participant</p><h3>Participant</h3><section><strong>Shared Mission: Test a clearer architecture decision</strong><span>Before the next architecture discussion, ask one evidence-seeking question before committing to a design direction.</span><small>Status: accepted</small></section></div><aside><p>Suggested human nudge</p><h4>Offer a brief, participant-led coaching check-in.</h4><span><b>Why now:</b> a participant-shared Mission is approaching its focus window.</span><blockquote>“What would make your next step on this architecture decision feel more workable this week?”</blockquote><div><button type="button">Mark contacted</button><button type="button">Complete</button></div></aside></article></div>;
}
