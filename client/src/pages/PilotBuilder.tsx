import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ClipboardCheck, LockKeyhole, Sparkles, Users, WandSparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DRAFT_KEY = "levelnext_proof_pilot_draft";
const suggestions = [
  "Managers avoid difficult conversations",
  "Feedback happens too late",
  "People don’t take enough ownership",
  "Delegation isn’t working",
  "Stakeholder influence is weak",
  "Execution is slipping",
];

function parseEmails(value: string) {
  return value.split(/[\n,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean).filter((email, index, all) => all.indexOf(email) === index);
}

export default function PilotBuilder() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [problem, setProblem] = useState("");
  const [pilotName, setPilotName] = useState("30-Day Behaviour Change Proof");
  const [companyContext, setCompanyContext] = useState("");
  const [participants, setParticipants] = useState("");
  const [behaviours, setBehaviours] = useState<string[]>([]);
  const [draftToResume, setDraftToResume] = useState<ReturnType<typeof buildDraft> | null>(null);
  const [saved, setSaved] = useState(false);

  const previewInput = useMemo(() => ({ problem: problem.trim() || "Managers avoid difficult conversations" }), [problem]);
  const preview = trpc.behaviourChangeProof.previewPilot.useQuery(previewInput, { enabled: problem.trim().length >= 12 });
  const createPilot = trpc.behaviourChangeProof.createPilot.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem(DRAFT_KEY);
      setSaved(true);
      navigate(`/pilot/dashboard?pilotId=${data.pilot.id}`);
    },
  });
  const recommendations = preview.data ?? null;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) setDraftToResume(JSON.parse(stored) as ReturnType<typeof buildDraft>);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !draftToResume || createPilot.isPending || saved) return;
    setProblem(draftToResume.problem);
    setPilotName(draftToResume.pilotName);
    setCompanyContext(draftToResume.companyContext);
    setParticipants(draftToResume.participants);
    setBehaviours(draftToResume.behaviours);
    setStep(4);
    setDraftToResume(null);
  }, [createPilot, draftToResume, isAuthenticated, saved]);

  useEffect(() => {
    if (recommendations && behaviours.length === 0) setBehaviours(recommendations.targetBehaviours);
  }, [behaviours.length, recommendations]);

  const canContinue = problem.trim().length >= 12;
  const emailList = parseEmails(participants);

  const handleLaunch = () => {
    const draft = buildDraft({ problem, pilotName, companyContext, participants, behaviours });
    if (!isAuthenticated) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      window.location.href = "/login?returnTo=%2Fpilot";
      return;
    }
    const recommendation = recommendations;
    if (!recommendation) return;
    createPilot.mutate({
      name: pilotName.trim() || "30-Day Behaviour Change Proof",
      companyContext: companyContext.trim() || undefined,
      businessProblem: problem.trim(),
      targetBehaviours: behaviours.length ? behaviours : recommendation.targetBehaviours,
      observableActions: recommendation.observableActions,
      businessSignals: recommendation.businessSignals,
      baselineMethod: recommendation.defaults.baselineMethod,
      nudgeCadence: recommendation.defaults.nudgeCadence,
      observerPulse: recommendation.defaults.observerPulse,
    });
  };

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#1C1C1C]">
      <header className="border-b border-[#DCE3EA] bg-[#0A1A2F] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3"><img src="/logo.png" alt="LevelNext" className="h-9" /><span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37] sm:block">30-Day Behaviour Change Proof</span></a>
          <div className="flex items-center gap-3 text-xs text-white/65"><LockKeyhole size={14} /> Private by design</div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pt-20">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#A78418]">Self-service pilot builder</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#0A1A2F] md:text-6xl">Let’s prove whether behaviour can change.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Give us one business problem, 10–20 people and 30 days. LevelNext will help you identify the behaviours that matter, keep the loop moving, and show the evidence without overstating what it proves.</p>
        </div>

        <div className="mb-8 flex items-center gap-2" aria-label="Pilot setup progress">
          {[1, 2, 3, 4].map((item) => <div key={item} className={`h-2 flex-1 rounded-full ${item <= step ? "bg-[#D4AF37]" : "bg-[#DCE3EA]"}`} />)}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <Card className="border-[#DCE3EA] bg-white shadow-[0_20px_60px_rgba(10,26,47,0.08)]">
            <CardHeader className="border-b border-[#EEF1F4] px-6 pb-5 pt-6 md:px-8">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A78418]">Step {step} of 4</p><CardTitle className="mt-2 text-2xl text-[#0A1A2F]">{step === 1 ? "Tell us the problem" : step === 2 ? "Confirm the behaviours" : step === 3 ? "Add your people" : "Review and launch"}</CardTitle></div><span className="rounded-full bg-[#F8F5F0] px-3 py-1 text-xs font-semibold text-slate-600">No account needed yet</span></div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 py-7 md:px-8">
              {step === 1 && <div className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-[#0A1A2F]">What’s happening in your organization that you would like your people to handle differently?</span><Textarea value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="For example: our managers keep postponing difficult performance conversations." className="min-h-36 border-[#C9D4DF] bg-white text-base leading-7" autoFocus /></label><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Or start with a common problem</p><div className="flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setProblem(suggestion)} className="rounded-full border border-[#DCE3EA] bg-[#F8F5F0] px-3 py-2 text-left text-sm text-slate-700 transition hover:border-[#D4AF37] hover:bg-[#FFF8DF]">{suggestion}</button>)}</div></div><div className="flex items-center gap-2 text-xs text-slate-500"><Sparkles size={14} className="text-[#D4AF37]" /> LevelNext will turn your description into a usable first pilot.</div></div>}

              {step === 2 && recommendations && <div className="space-y-6"><div className="rounded-xl border border-[#D4AF37]/40 bg-[#FFF8DF] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A78418]">Here’s the pilot I’d recommend</p><h2 className="mt-2 text-xl font-bold text-[#0A1A2F]">{recommendations.businessProblem}</h2><p className="mt-3 text-sm leading-6 text-slate-700">{recommendations.likelyCauses[0]}</p></div><div><p className="mb-3 text-sm font-semibold text-[#0A1A2F]">Target behaviours — edit if needed</p><div className="space-y-2">{recommendations.targetBehaviours.map((behaviour) => <label key={behaviour} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#DCE3EA] bg-white p-3 text-sm"><input type="checkbox" checked={behaviours.includes(behaviour)} onChange={() => setBehaviours((current) => current.includes(behaviour) ? current.filter((item) => item !== behaviour) : current.length < 3 ? [...current, behaviour] : current)} className="h-4 w-4 accent-[#D4AF37]" />{behaviour}</label>)}</div><p className="mt-2 text-xs text-slate-500">Choose 1–3. Good defaults beat configuration.</p></div><div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-[#F8F5F0] p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A78418]">What we’ll look for</p><ul className="mt-2 space-y-2 text-sm text-slate-700">{recommendations.observableActions.map((action) => <li key={action} className="flex gap-2"><Check size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" />{action}</li>)}</ul></div><div className="rounded-lg bg-[#F8F5F0] p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A78418]">Possible business signals</p><ul className="mt-2 space-y-2 text-sm text-slate-700">{recommendations.businessSignals.map((signal) => <li key={signal} className="flex gap-2"><Check size={15} className="mt-0.5 flex-shrink-0 text-emerald-600" />{signal}</li>)}</ul></div></div></div>}

              {step === 3 && <div className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-semibold text-[#0A1A2F]">What should we call this pilot?</span><Input value={pilotName} onChange={(event) => setPilotName(event.target.value)} className="h-11 border-[#C9D4DF]" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-[#0A1A2F]">Company or team context <span className="font-normal text-slate-400">(optional)</span></span><Input value={companyContext} onChange={(event) => setCompanyContext(event.target.value)} placeholder="e.g. India Engineering Leadership Team" className="h-11 border-[#C9D4DF]" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-[#0A1A2F]">Paste participant email addresses</span><Textarea value={participants} onChange={(event) => setParticipants(event.target.value)} placeholder="one@email.com\nanother@email.com" className="min-h-36 border-[#C9D4DF]" /><span className="mt-2 block text-xs text-slate-500">You can also launch with zero people and add them from the dashboard.</span></label><div className="flex items-center gap-2 rounded-lg bg-[#EEF4F9] p-4 text-sm text-slate-700"><Users size={16} className="text-[#0A1A2F]" /> {emailList.length ? `${emailList.length} participant${emailList.length === 1 ? "" : "s"} ready to invite.` : "Recommended cohort: 10–20 people."}</div></div>}

              {step === 4 && recommendations && <div className="space-y-5"><div className="rounded-xl bg-[#0A1A2F] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">Your pilot is ready</p><h2 className="mt-2 text-2xl font-bold">{pilotName || "30-Day Behaviour Change Proof"}</h2><p className="mt-2 text-sm text-white/70">{problem}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-2xl font-bold">30</p><p className="text-xs text-white/60">days</p></div><div><p className="text-2xl font-bold">{behaviours.length || recommendations.targetBehaviours.length}</p><p className="text-xs text-white/60">target behaviours</p></div><div><p className="text-2xl font-bold">{emailList.length || "10–20"}</p><p className="text-xs text-white/60">participants</p></div></div></div><div className="space-y-3 rounded-xl border border-[#DCE3EA] p-5"><p className="text-sm font-semibold text-[#0A1A2F]">LevelNext will handle the defaults</p>{["Participant baseline before launch", "One useful action every 2–3 days", "Behaviour Rep before real-work application", "Day 15 pulse and Day 30 proof review"].map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-700"><Check size={15} className="text-emerald-600" />{item}</div>)}</div><p className="text-xs leading-5 text-slate-500">Private coaching and reflection stay private. The sponsor sees appropriate aggregated evidence, not personal coaching text. No causal or ROI claim is made from self-report alone.</p></div>}

              {step > 1 && <Button variant="ghost" type="button" onClick={() => setStep((current) => current - 1)} className="mr-2 text-slate-600"><ChevronLeft size={16} /> Back</Button>}
              {step < 4 ? <Button type="button" onClick={() => setStep((current) => current + 1)} disabled={step === 1 ? !canContinue : step === 2 ? behaviours.length === 0 : false} className="bg-[#D4AF37] text-[#0A1A2F] hover:bg-[#E4C35A]">Continue <ArrowRight size={16} /></Button> : <Button type="button" onClick={handleLaunch} disabled={createPilot.isPending} className="bg-[#D4AF37] text-[#0A1A2F] hover:bg-[#E4C35A]">{createPilot.isPending ? "Launching…" : isAuthenticated ? "Launch my pilot" : "Save and launch"} <ArrowRight size={16} /></Button>}
              {createPilot.error && <p className="mt-3 text-sm text-red-600">{createPilot.error.message}</p>}
            </CardContent>
          </Card>

          <aside className="space-y-4"><Card className="border-[#DCE3EA] bg-[#0A1A2F] text-white"><CardContent className="space-y-5 p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37] text-[#0A1A2F]"><WandSparkles size={21} /></div><h2 className="text-xl font-bold">The product proves the product.</h2><p className="text-sm leading-6 text-white/70">Participants practise real situations, apply one small action, and build evidence over time. Sponsors see what is moving and what still needs work.</p><div className="space-y-3 text-sm">{["Value before data extraction", "Real work over learning homework", "Evidence before expansion"].map((item) => <div key={item} className="flex gap-2"><Check size={15} className="mt-0.5 flex-shrink-0 text-[#D4AF37]" />{item}</div>)}</div></CardContent></Card><div className="rounded-xl border border-[#DCE3EA] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A78418]">What happens next</p><ol className="mt-3 space-y-3 text-sm text-slate-700"><li><b>1.</b> Confirm the behaviours</li><li><b>2.</b> Invite your people</li><li><b>3.</b> Watch the evidence build</li><li><b>4.</b> Decide what to expand on Day 30</li></ol></div></aside>
        </div>
      </section>
    </main>
  );
}

function buildDraft(input: { problem: string; pilotName: string; companyContext: string; participants: string; behaviours: string[] }) {
  return input;
}
