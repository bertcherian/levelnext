import React, { FormEvent, useState } from "react";
import { ArrowRight, Check, CircleDot, Compass, Eye, LockKeyhole, Mail, Play, ShieldCheck, Sparkles, UsersRound, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./engineeringDemo.css";
import "./engineeringDemoExtensions.css";

const VIEWS = [
  { id: "diagnostic", label: "Diagnostic", icon: CircleDot },
  { id: "profile", label: "Operating Profile", icon: Compass },
  { id: "partner", label: "Partner support", icon: UsersRound },
] as const;

type DemoView = (typeof VIEWS)[number]["id"];

export default function EngineeringDemo() {
  const [view, setView] = useState<DemoView>("diagnostic");
  const [form, setForm] = useState({ name: "", email: "", company: "", jobTitle: "", enquiry: "", consent: false });
  const [submitted, setSubmitted] = useState(false);
  const captureLead = trpc.leads.captureDemoLead.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.consent || captureLead.isPending) return;
    await captureLead.mutateAsync({
      name: form.name,
      email: form.email,
      company: form.company,
      jobTitle: form.jobTitle || undefined,
      enquiry: form.enquiry || undefined,
      consent: true,
    });
  }

  return (
    <main className="ei-demo">
      <header className="ei-demo__nav">
        <a href="/" className="ei-demo__brand" aria-label="Return to LevelNext home"><img src="/logo.png" alt="LevelNext" /></a>
        <div className="ei-demo__nav-copy"><span>Tech Intelligence</span><strong>Interactive product walkthrough</strong></div>
        <a href="/engineering/diagnostic" className="ei-demo__open-tool">Open the tool <ArrowRight size={15} /></a>
      </header>

      <section className="ei-demo__hero">
        <div><p className="ei-demo__eyebrow"><Play size={13} fill="currentColor" /> Product demo</p><h1>See how insight becomes<br /><em>a better next move.</em></h1><p>This walkthrough illustrates the Tech Intelligence experience. It contains no personal data and does not create a participant record.</p></div>
        <aside><ShieldCheck size={23} /><div><strong>Developmental by design</strong><span>Private reflection stays with the participant. Sharing a Mission with a Success Partner is optional.</span></div></aside>
      </section>

      <section className="ei-demo__shell" aria-label="Tech Intelligence product demo">
        <div className="ei-demo__tabs" role="tablist" aria-label="Demo screens">
          {VIEWS.map((item) => { const Icon = item.icon; const active = view === item.id; return <button type="button" key={item.id} role="tab" aria-selected={active} className={active ? "is-active" : ""} onClick={() => setView(item.id)}><Icon size={16} /> {item.label}</button>; })}
        </div>
        <div className="ei-demo__canvas">
          {view === "diagnostic" && <DiagnosticPreview />}
          {view === "profile" && <ProfilePreview />}
          {view === "partner" && <PartnerPreview />}
        </div>
      </section>

      <section className="ei-demo__video" aria-labelledby="demo-video-title">
        <div className="ei-demo__video-poster" role="img" aria-label="Placeholder for the narrated Tech Intelligence product video">
          <div className="ei-demo__video-play"><Play size={20} fill="currentColor" /></div>
          <div className="ei-demo__video-lines"><i /><i /><i /></div>
          <span>Video placeholder</span>
        </div>
        <div className="ei-demo__video-copy"><p className="ei-demo__eyebrow"><Video size={13} /> Narrated walkthrough</p><h2 id="demo-video-title">A guided product story is coming next.</h2><p>This reserved placement is ready for a short narrated overview of the diagnostic, Operating Profile, and Success Partner workflow. It will be embedded here once approved footage is available.</p><span><LockKeyhole size={13} /> No video is loaded or tracked in this preview.</span></div>
      </section>

      <section className="ei-demo__lead" id="demo-enquiry" aria-labelledby="demo-enquiry-title">
        <div className="ei-demo__lead-intro"><p className="ei-demo__eyebrow"><Mail size={13} /> Explore for your organisation</p><h2 id="demo-enquiry-title">Would a focused pilot help you see what changes?</h2><p>Share your details and we will follow up about a LevelNext demonstration or pilot conversation. Submitting this form does not create a LevelNext participant account.</p></div>
        {submitted ? <div className="ei-demo__lead-success" role="status"><Check size={23} /><div><strong>Thank you—your request has been received.</strong><span>We will use the details you shared only to follow up about this demo or a LevelNext pilot.</span></div></div> : <form className="ei-demo__lead-form" onSubmit={submitLead}>
          <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={200} required autoComplete="name" /></label>
          <label>Work email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required autoComplete="email" /></label>
          <label>Organisation<input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} minLength={2} maxLength={255} required autoComplete="organization" /></label>
          <label>Role <span>Optional</span><input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} maxLength={200} autoComplete="organization-title" /></label>
          <label className="ei-demo__lead-form-wide">What would you like to explore? <span>Optional</span><textarea value={form.enquiry} onChange={(event) => setForm({ ...form, enquiry: event.target.value })} maxLength={2000} rows={3} placeholder="For example, a pilot for a specific leadership population or capability priority." /></label>
          <label className="ei-demo__consent"><input checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} type="checkbox" required /><span>I agree that Meta Results may contact me about this LevelNext demo or pilot. I can opt out of future communications at any time.</span></label>
          {captureLead.error && <p className="ei-demo__lead-error" role="alert">{captureLead.error.message}</p>}
          <button className="ei-demo__lead-submit" disabled={!form.consent || captureLead.isPending} type="submit">{captureLead.isPending ? "Sending request…" : "Request a conversation"} <ArrowRight size={15} /></button>
        </form>}
      </section>

      <section className="ei-demo__next">
        <div><span>Next</span><h2>Ready to explore it in context?</h2><p>Log in to access an enrolled programme or speak with Meta Results about a LevelNext pilot for your organisation.</p></div>
        <div className="ei-demo__next-actions"><a href="/login?returnTo=%2Fengineering%2Fdiagnostic">Log in <ArrowRight size={15} /></a><a href="https://tidycal.com/metaresults/pilot?utm_source=levelnext&utm_medium=demo" target="_blank" rel="noreferrer">Discuss a pilot <ArrowRight size={15} /></a></div>
      </section>
    </main>
  );
}

function DiagnosticPreview() {
  return <div className="ei-demo__screen"><div className="ei-demo__screen-top"><div><span>Tech Intelligence</span><h2>Tech Impact Diagnostic</h2></div><div className="ei-demo__progress"><small>Question 7 of 12</small><i><b /></i></div></div><div className="ei-demo__question"><p className="ei-demo__label">Systems thinking: trade-offs</p><h3>How consistently do you consider downstream consequences, dependencies, and trade-offs before changing a technical system?</h3><p>Choose the response that is most true across real work situations. There is no ideal answer.</p><div className="ei-demo__scale">{[[1,"Rarely"],[2,"Occasionally"],[3,"Sometimes"],[4,"Often"],[5,"Consistently"]].map(([score, label]) => <div key={score} className={score === 4 ? "is-selected" : ""}><b>{score}</b><span>{label}</span>{score === 4 && <Check size={17} />}</div>)}</div></div><p className="ei-demo__privacy"><LockKeyhole size={14} /> Responses remain private to the participant.</p></div>;
}

function ProfilePreview() {
  const engines = [["Self-leadership",66],["Collaboration",74],["Problem framing",80],["Systems thinking",88],["Business impact",71],["Human–AI judgment",84]];
  return <div className="ei-demo__screen"><div className="ei-demo__profile-banner"><span>Current impact pattern</span><h2>Systems builder</h2><p>Your present impact radius is <b>system</b>. This is a developmental hypothesis, not a ranking.</p></div><div className="ei-demo__profile-grid"><div><h3>Engineering engines</h3><div className="ei-demo__engines">{engines.map(([name, score]) => <div key={name as string}><p><span>{name}</span><b>{score}<small>/100</small></b></p><i><b style={{ width: `${score}%` }} /></i></div>)}</div></div><div className="ei-demo__mission"><p>Current Mission</p><h3>Test a clearer architecture decision</h3><span>Before the next architecture discussion, ask one evidence-seeking question before committing to a design direction.</span><button type="button"><Sparkles size={14} /> Accept this Mission</button><small><Eye size={13} /> Sharing this focus with a Success Partner is optional.</small></div></div></div>;
}

function PartnerPreview() {
  return <div className="ei-demo__screen"><div className="ei-demo__partner-head"><div><p>Success Partner Workspace</p><h2>A small, human queue for follow-through.</h2></div><button type="button"><Sparkles size={14} /> Refresh respectful nudges</button></div><div className="ei-demo__partner-boundary"><ShieldCheck size={16} /> Only participant-shared Mission context appears here. Private reflections and diagnostic responses are never included.</div><article className="ei-demo__partner-card"><div><p>Assigned participant</p><h3>Participant</h3><section><strong>Shared Mission: Test a clearer architecture decision</strong><span>Before the next architecture discussion, ask one evidence-seeking question before committing to a design direction.</span><small>Status: accepted</small></section></div><aside><p>Suggested human nudge</p><h4>Offer a brief, participant-led coaching check-in.</h4><span><b>Why now:</b> a participant-shared Mission is approaching its focus window.</span><blockquote>“What would make your next step on this architecture decision feel more workable this week?”</blockquote><div><button type="button">Mark contacted</button><button type="button">Complete</button></div></aside></article></div>;
}
