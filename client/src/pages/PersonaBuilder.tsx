import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, CalendarCheck2, CheckCircle2, CircleAlert, LockKeyhole, MessageSquareText, Mic, Sparkles, Target, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import type { PersonaCandidate, PersonaPattern } from "@shared/modules/personaBuilder";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";
const IVORY = "#F8F5F0";

function CandidateCard({ candidate, selected, onSelect }: { candidate: PersonaCandidate; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`rounded-2xl border p-5 text-left transition ${selected ? "border-[#D4AF37] bg-[#FFF9E8] shadow-md" : "border-slate-200 bg-white hover:border-[#D4AF37]/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9B7A17]">Candidate Persona</p>
          <h3 className="mt-2 text-xl font-semibold text-[#0A1A2F]">{candidate.name}</h3>
        </div>
        {selected && <CheckCircle2 className="mt-1 h-5 w-5 text-[#9B7A17]" aria-label="Selected" />}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{candidate.purpose}</p>
      <div className="mt-4 rounded-xl bg-[#0A1A2F]/[0.04] p-3 text-sm text-slate-700"><strong className="text-[#0A1A2F]">I see:</strong> {candidate.observer}</div>
      <div className="mt-4 flex flex-wrap gap-2">{candidate.powers.map((power) => <Badge key={power} variant="outline" className="border-[#D4AF37]/60 text-[#6D5510]">{power}</Badge>)}</div>
      <p className="mt-4 text-sm font-semibold text-[#0A1A2F]">Signature move: <span className="font-normal text-slate-700">{candidate.signatureMove}</span></p>
      <p className="mt-2 text-xs leading-5 text-slate-500">Boundary: {candidate.contextBoundaries[0]}</p>
    </button>
  );
}

export default function PersonaBuilder() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const homeQuery = trpc.personaBuilder.getHome.useQuery(undefined, { enabled: isAuthenticated });
  const home = homeQuery.data;
  const [situation, setSituation] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [role, setRole] = useState("Manager");
  const [episode, setEpisode] = useState("");
  const [commitment, setCommitment] = useState("");
  const [observableBehavior, setObservableBehavior] = useState("");
  const [reflection, setReflection] = useState("");
  const [outcome, setOutcome] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [overallShift, setOverallShift] = useState("");
  const [whatChanged, setWhatChanged] = useState("");
  const [whatDidNotChange, setWhatDidNotChange] = useState("");
  const [nextExperiment, setNextExperiment] = useState("");
  const [rating, setRating] = useState(3);
  const [nextChoice, setNextChoice] = useState<"continue_persona" | "retire_persona" | "switch_intervention" | "pause">("continue_persona");

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login?returnTo=%2Fpersona");
  }, [isAuthenticated, loading, navigate]);

  const startMutation = trpc.personaBuilder.startJourney.useMutation({ onSuccess: () => utils.personaBuilder.getHome.invalidate() });
  const episodeMutation = trpc.personaBuilder.addEpisode.useMutation({ onSuccess: () => { setEpisode(""); void utils.personaBuilder.getHome.invalidate(); } });
  const patternMutation = trpc.personaBuilder.analysePattern.useMutation({ onSuccess: () => utils.personaBuilder.getHome.invalidate() });
  const commitmentMutation = trpc.personaBuilder.createCommitment.useMutation({ onSuccess: () => { setCommitment(""); setObservableBehavior(""); void utils.personaBuilder.getHome.invalidate(); } });
  const candidatesMutation = trpc.personaBuilder.generateCandidates.useMutation({ onSuccess: () => utils.personaBuilder.getHome.invalidate() });
  const selectMutation = trpc.personaBuilder.selectPersona.useMutation({ onSuccess: () => utils.personaBuilder.getHome.invalidate() });
  const repMutation = trpc.personaBuilder.createRep.useMutation({ onSuccess: () => utils.personaBuilder.getHome.invalidate() });
  const checkinMutation = trpc.personaBuilder.recordCheckin.useMutation({ onSuccess: () => { setReflection(""); setOutcome(""); void utils.personaBuilder.getHome.invalidate(); } });
  const completionReviewMutation = trpc.personaBuilder.createCompletionReview.useMutation({ onSuccess: () => void utils.personaBuilder.getHome.invalidate() });

  const pattern = useMemo(() => (home?.pattern?.pattern ?? null) as PersonaPattern | null, [home?.pattern?.pattern]);
  const candidates = useMemo(() => (home?.personaCandidates ?? []).map((row) => row.persona as PersonaCandidate), [home?.personaCandidates]);
  const selectedPersona = home?.persona?.persona as PersonaCandidate | undefined;
  const currentJourneyId = home?.journey?.id;
  const day14 = home?.timeline?.find((day) => day.dayNumber === 14);
  const journeyIsComplete = home?.journey?.status === "completed";
  const errorMessage = [startMutation.error, episodeMutation.error, patternMutation.error, commitmentMutation.error, candidatesMutation.error, selectMutation.error, repMutation.error, checkinMutation.error, completionReviewMutation.error].find(Boolean)?.message;

  if (loading || (isAuthenticated && homeQuery.isLoading)) {
    return <div className="grid min-h-screen place-items-center bg-[#F8F5F0] text-[#0A1A2F]">Loading your private practice space…</div>;
  }
  if (!isAuthenticated) return null;

  const submitStart = (event: React.FormEvent) => {
    event.preventDefault();
    startMutation.mutate({ situation, desiredOutcome, role, sourceApp: "persona_builder" });
  };
  const stage = home?.journey?.currentStage;
  const launchPracticePartner = (repId: number) => navigate(`/manager/practice?personaRepId=${repId}&journeyId=${currentJourneyId}`);
  const launchSimulator = (repId: number) => navigate(`/manager/simulate?personaRepId=${repId}&journeyId=${currentJourneyId}`);

  return (
    <main className="min-h-screen bg-[#F8F5F0] text-[#1C1C1C]">
      <header className="border-b border-[#0A1A2F]/10 bg-[#0A1A2F] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3"><img src="/logo.png" alt="LevelNext" className="h-8 w-auto" /><span className="hidden border-l border-white/20 pl-3 text-sm text-white/70 sm:inline">Persona Builder</span></Link>
          <Link href="/manager" className="text-sm font-semibold text-[#F1D77A] hover:text-white">Back to workspace</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9B7A17]"><Sparkles className="h-4 w-4" /> Show up differently when it matters</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#0A1A2F] sm:text-5xl">Find the Moment. Test the next move.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Persona Builder helps you understand one important situation, choose the smallest useful shift, practise it, and gather evidence from real work. A Persona is only used when it helps; sometimes the better answer is skill, information, state, or context.</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span className="rounded-full bg-[#0A1A2F] px-3 py-1.5 text-white">1 Moment</span><ArrowRight className="h-3.5 w-3.5" /><span className="rounded-full border border-slate-300 px-3 py-1.5">1 Shift</span><ArrowRight className="h-3.5 w-3.5" /><span className="rounded-full border border-slate-300 px-3 py-1.5">1 Rep</span><ArrowRight className="h-3.5 w-3.5" /><span className="rounded-full border border-slate-300 px-3 py-1.5">Evidence</span></div>

        {errorMessage && <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}</div>}

        {!home?.journey ? (
          <Card className="mt-10 max-w-3xl border-[#0A1A2F]/10 bg-white shadow-sm">
            <CardHeader><CardTitle className="text-2xl text-[#0A1A2F]">Where do you want to show up differently?</CardTitle><CardDescription>Start with one real situation, not a Persona name. Choose a moment you expect to encounter again.</CardDescription></CardHeader>
            <CardContent><form onSubmit={submitStart} className="space-y-5">
              <div><Label htmlFor="persona-situation">The situation</Label><Textarea id="persona-situation" value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="For example: When a senior stakeholder challenges my recommendation…" className="mt-2 min-h-28" required /></div>
              <div><Label htmlFor="persona-outcome">What important outcome would improve?</Label><Textarea id="persona-outcome" value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} placeholder="For example: Make a clearer decision without becoming defensive…" className="mt-2 min-h-24" required /></div>
              <div><Label htmlFor="persona-role">Your role in this situation</Label><Input id="persona-role" value={role} onChange={(event) => setRole(event.target.value)} className="mt-2" /></div>
              <Button type="submit" disabled={startMutation.isPending} className="bg-[#0A1A2F] text-white hover:bg-[#12345A]">{startMutation.isPending ? "Starting…" : "Start with this Moment"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form></CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div className="space-y-6">
              <Card className="border-[#0A1A2F]/10 bg-white shadow-sm"><CardHeader><div className="flex items-center justify-between gap-3"><div><CardDescription className="font-bold uppercase tracking-[0.14em] text-[#9B7A17]">Current Moment</CardDescription><CardTitle className="mt-2 text-2xl text-[#0A1A2F]">{home.moment?.situation}</CardTitle></div><Badge className="bg-[#0A1A2F] text-white">Day 0–14</Badge></div></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600"><strong className="text-[#0A1A2F]">Outcome:</strong> {home.moment?.desiredOutcome}</p><div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" /> Private to you unless you explicitly share it.</div></CardContent></Card>

              {home.episodes.length === 0 && <Card className="border-[#D4AF37]/40 bg-[#FFFDF5]"><CardHeader><CardTitle className="text-xl text-[#0A1A2F]">Tell me about the last time this happened.</CardTitle><CardDescription>Describe what happened, who was there, what you did or avoided, and what happened next.</CardDescription></CardHeader><CardContent><Textarea value={episode} onChange={(event) => setEpisode(event.target.value)} placeholder="Write the episode in your own words…" className="min-h-36 bg-white" /><Button onClick={() => episodeMutation.mutate({ journeyId: currentJourneyId!, episodeText: episode })} disabled={episode.length < 20 || episodeMutation.isPending} className="mt-4 bg-[#D4AF37] text-[#0A1A2F] hover:bg-[#E7C95A]">{episodeMutation.isPending ? "Saving…" : "Save this real episode"}</Button></CardContent></Card>}

              {home.episodes.length > 0 && !pattern && <Card className="border-[#D4AF37]/40 bg-[#FFFDF5]"><CardHeader><CardTitle className="text-xl text-[#0A1A2F]">Ready to look at the pattern?</CardTitle><CardDescription>The system will show a tentative interpretation. You remain the authority on whether it fits.</CardDescription></CardHeader><CardContent><div className="rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">Your episode is stored as <strong>user-stated</strong> material. No interpretation has been saved as fact.</div><Button onClick={() => patternMutation.mutate({ journeyId: currentJourneyId! })} disabled={patternMutation.isPending} className="mt-4 bg-[#0A1A2F] text-white hover:bg-[#12345A]">{patternMutation.isPending ? "Thinking…" : "Show me a working hypothesis"}</Button></CardContent></Card>}

              {pattern && <PatternCard pattern={pattern} />}

              {pattern && home.commitments.length === 0 && <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardTitle className="text-xl text-[#0A1A2F]">What will you stand for here?</CardTitle><CardDescription>Turn a trait into a choice that can guide one observable behavior.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="commitment">Your Commitment</Label><Input id="commitment" value={commitment} onChange={(event) => setCommitment(event.target.value)} placeholder="Contribution over proving" className="mt-2" /></div><div><Label htmlFor="observable-behavior">What would honoring it look like?</Label><Textarea id="observable-behavior" value={observableBehavior} onChange={(event) => setObservableBehavior(event.target.value)} placeholder="Ask one clarifying question before explaining." className="mt-2 min-h-24" /></div><Button onClick={() => commitmentMutation.mutate({ journeyId: currentJourneyId!, statement: commitment, observableBehavior })} disabled={commitment.length < 5 || observableBehavior.length < 5 || commitmentMutation.isPending} className="bg-[#0A1A2F] text-white hover:bg-[#12345A]">{commitmentMutation.isPending ? "Saving…" : "Confirm this Commitment"}</Button></CardContent></Card>}

              {pattern?.intervention === "persona" && home.commitments.length > 0 && !home.persona && candidates.length === 0 && <Card className="border-[#D4AF37]/40 bg-[#FFFDF5]"><CardHeader><CardTitle className="text-xl text-[#0A1A2F]">A Persona may help access this behavior.</CardTitle><CardDescription>These candidates will be grounded in your Moment and Commitment. They are scaffolds, not replacements for you.</CardDescription></CardHeader><CardContent><Button onClick={() => candidatesMutation.mutate({ journeyId: currentJourneyId! })} disabled={candidatesMutation.isPending} className="bg-[#D4AF37] text-[#0A1A2F] hover:bg-[#E7C95A]">{candidatesMutation.isPending ? "Creating options…" : "Create three useful options"}</Button></CardContent></Card>}

              {candidates.length > 0 && !home.persona && <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardTitle className="text-xl text-[#0A1A2F]">Which would have helped in the actual situation?</CardTitle><CardDescription>Choose the behavior, not the most attractive name.</CardDescription></CardHeader><CardContent className="grid gap-4">{candidates.map((candidate, index) => <CandidateCard key={`${candidate.name}-${index}`} candidate={candidate} selected={selectedCandidate === index} onSelect={() => setSelectedCandidate(index)} />)}<Button onClick={() => selectedCandidate !== null && selectMutation.mutate({ journeyId: currentJourneyId!, candidateIndex: selectedCandidate })} disabled={selectedCandidate === null || selectMutation.isPending} className="bg-[#0A1A2F] text-white hover:bg-[#12345A]">{selectMutation.isPending ? "Selecting…" : "Use this Persona as a scaffold"}</Button></CardContent></Card>}

              {home.persona && !home.rep && !journeyIsComplete && <Card className="border-[#D4AF37]/50 bg-[#FFFDF5]"><CardHeader><CardTitle className="text-xl text-[#0A1A2F]">Make it real with one Rep.</CardTitle><CardDescription>Your Persona has no value until it produces observable behavior.</CardDescription></CardHeader><CardContent><Button onClick={() => repMutation.mutate({ journeyId: currentJourneyId! })} disabled={repMutation.isPending} className="bg-[#D4AF37] text-[#0A1A2F] hover:bg-[#E7C95A]"><Zap className="mr-2 h-4 w-4" />{repMutation.isPending ? "Designing the Rep…" : "Create today’s Rep"}</Button></CardContent></Card>}

              {home.rep && !journeyIsComplete && <>
                <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.14em] text-[#9B7A17]">Rehearse before reality</CardDescription><CardTitle className="mt-2 text-xl text-[#0A1A2F]">Put this Rep under useful pressure.</CardTitle><CardDescription>Practice is linked to this day. It helps you test language and composure; it does not replace real-world evidence.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => launchPracticePartner(home.rep!.id)}><MessageSquareText className="mr-2 h-4 w-4" />Practice Partner</Button><Button type="button" className="bg-[#0A1A2F] text-white hover:bg-[#12345A]" onClick={() => launchSimulator(home.rep!.id)}><Mic className="mr-2 h-4 w-4" />Voice Simulator</Button></CardContent></Card>
                <RepCard rep={home.rep} reflection={reflection} outcome={outcome} setReflection={setReflection} setOutcome={setOutcome} onSubmit={(opportunityStatus, executionStatus) => checkinMutation.mutate({ repId: home.rep!.id, opportunityStatus, executionStatus, reflection, outcome })} pending={checkinMutation.isPending} />
              </>}

              {day14?.status === "complete" && !home.completionReview && <CompletionReviewCard overallShift={overallShift} whatChanged={whatChanged} whatDidNotChange={whatDidNotChange} nextExperiment={nextExperiment} rating={rating} nextChoice={nextChoice} setOverallShift={setOverallShift} setWhatChanged={setWhatChanged} setWhatDidNotChange={setWhatDidNotChange} setNextExperiment={setNextExperiment} setRating={setRating} setNextChoice={setNextChoice} onSubmit={() => completionReviewMutation.mutate({ journeyId: currentJourneyId!, overallShift, whatChanged, whatDidNotChange, nextExperiment, rating, nextChoice })} pending={completionReviewMutation.isPending} />}

              {home.completionReview && <Card className="border-emerald-200 bg-emerald-50"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.14em] text-emerald-700">14-day review complete</CardDescription><CardTitle className="mt-2 text-xl text-emerald-950">{home.completionReview.overallShift}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-emerald-900"><p><strong>What changed:</strong> {home.completionReview.whatChanged}</p><p><strong>Next experiment:</strong> {home.completionReview.nextExperiment}</p></CardContent></Card>}
            </div>

            <aside className="space-y-6">
              <Card className="border-[#0A1A2F]/10 bg-[#0A1A2F] text-white shadow-sm"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.14em] text-[#F1D77A]">Your current stage</CardDescription><CardTitle className="mt-2 text-2xl text-white">{stage === "completed" ? "Review the shift" : stage === "evidence" ? "Test it in reality" : stage === "persona" ? "Choose the useful scaffold" : stage === "commitment" ? "Choose what you stand for" : "Understand the Moment"}</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3 text-sm text-white/75"><Target className="h-5 w-5 text-[#D4AF37]" /> One situation. One next move. No personality scores.</div></CardContent></Card>
              {home.timeline && <JourneyTimeline days={home.timeline} />}
              <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardTitle className="text-lg text-[#0A1A2F]">What we will protect</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-slate-600"><p>AI interpretations remain hypotheses until you confirm or correct them.</p><p>Evidence is labeled by source. Self-report is not presented as objective observation.</p><p>If a Persona is not the right intervention, the system will say so.</p></CardContent></Card>
              {home.evidence.length > 0 && <Card className="border-emerald-200 bg-emerald-50"><CardHeader><CardTitle className="text-lg text-emerald-950">Evidence gathered</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-emerald-900">{home.evidence.length} workplace evidence item{home.evidence.length === 1 ? "" : "s"} recorded. Your next step is to learn from what happened, not to chase a streak.</p></CardContent></Card>}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function PatternCard({ pattern }: { pattern: PersonaPattern }) {
  return <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.14em] text-[#9B7A17]">Working hypothesis</CardDescription><CardTitle className="mt-2 text-xl text-[#0A1A2F]">What may be happening</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-slate-700"><div><strong className="text-[#0A1A2F]">Possible pattern:</strong> {pattern.possiblePattern}</div><div><strong className="text-[#0A1A2F]">Current observer:</strong> {pattern.currentObserver}</div><div><strong className="text-[#0A1A2F]">Alternative meanings:</strong><ul className="mt-2 list-disc space-y-1 pl-5">{pattern.alternatives.map((alternative) => <li key={alternative}>{alternative}</li>)}</ul></div><div className="rounded-xl bg-[#F8F5F0] p-3 text-xs text-slate-600"><strong>Guardrail:</strong> {pattern.safetyNote}</div><Badge variant="outline" className="border-[#D4AF37]/70 text-[#6D5510]">Suggested first intervention: {pattern.intervention}</Badge></CardContent></Card>;
}

function JourneyTimeline({ days }: { days: Array<{ id: number; dayNumber: number; title: string; focus: string; status: "locked" | "in_progress" | "complete" | "skipped"; adaptation?: { decision?: string } | null; practiceSessionId?: number | null; simulatorSessionId?: number | null; evidenceCount: number }> }) {
  const completeCount = days.filter((day) => day.status === "complete").length;
  return <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardDescription className="flex items-center gap-2 font-bold uppercase tracking-[0.14em] text-[#9B7A17]"><CalendarCheck2 className="h-4 w-4" />Adaptive 14-day journey</CardDescription><CardTitle className="mt-2 text-lg text-[#0A1A2F]">{completeCount} of 14 days completed</CardTitle><CardDescription>Each check-in either advances, repeats, simplifies, or raises the next Rep. Calendar time never substitutes for evidence.</CardDescription></CardHeader><CardContent><div className="space-y-2">{days.map((day) => <div key={day.id} className={`rounded-xl border p-3 ${day.status === "in_progress" ? "border-[#D4AF37] bg-[#FFFDF5]" : day.status === "complete" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><div className="flex items-start gap-3"><div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${day.status === "complete" ? "bg-emerald-700 text-white" : day.status === "in_progress" ? "bg-[#0A1A2F] text-white" : "bg-slate-200 text-slate-500"}`}>{day.status === "complete" ? "✓" : day.dayNumber}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#0A1A2F]">{day.title}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{day.focus}</p>{day.adaptation?.decision && <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#9B7A17]">Adaptive choice: {day.adaptation.decision.replaceAll("_", " ")}</p>}{(day.practiceSessionId || day.simulatorSessionId || day.evidenceCount > 0) && <p className="mt-1 text-[10px] text-slate-500">{day.practiceSessionId ? "Practice linked" : ""}{day.practiceSessionId && day.simulatorSessionId ? " · " : ""}{day.simulatorSessionId ? "Simulation linked" : ""}{(day.practiceSessionId || day.simulatorSessionId) && day.evidenceCount > 0 ? " · " : ""}{day.evidenceCount > 0 ? `${day.evidenceCount} evidence item${day.evidenceCount === 1 ? "" : "s"}` : ""}</p>}</div></div></div>)}</div></CardContent></Card>;
}

function CompletionReviewCard({ overallShift, whatChanged, whatDidNotChange, nextExperiment, rating, nextChoice, setOverallShift, setWhatChanged, setWhatDidNotChange, setNextExperiment, setRating, setNextChoice, onSubmit, pending }: { overallShift: string; whatChanged: string; whatDidNotChange: string; nextExperiment: string; rating: number; nextChoice: "continue_persona" | "retire_persona" | "switch_intervention" | "pause"; setOverallShift: (value: string) => void; setWhatChanged: (value: string) => void; setWhatDidNotChange: (value: string) => void; setNextExperiment: (value: string) => void; setRating: (value: number) => void; setNextChoice: (value: "continue_persona" | "retire_persona" | "switch_intervention" | "pause") => void; onSubmit: () => void; pending: boolean }) {
  const ready = overallShift.length >= 10 && whatChanged.length >= 10 && whatDidNotChange.length >= 10 && nextExperiment.length >= 10;
  return <Card className="border-[#D4AF37]/60 bg-[#FFFDF5]"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.14em] text-[#9B7A17]">Day 14 completion review</CardDescription><CardTitle className="mt-2 text-2xl text-[#0A1A2F]">Decide what is actually changing.</CardTitle><CardDescription>Rate the evidence honestly. A completed journey is not a claim of permanent transformation.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="review-shift">What is the overall shift you notice?</Label><Textarea id="review-shift" value={overallShift} onChange={(event) => setOverallShift(event.target.value)} className="mt-2 min-h-20 bg-white" placeholder="Describe the behavioral shift, not a personality label." /></div><div><Label htmlFor="review-changed">What changed in observable terms?</Label><Textarea id="review-changed" value={whatChanged} onChange={(event) => setWhatChanged(event.target.value)} className="mt-2 min-h-20 bg-white" placeholder="What did you do, say, or produce differently?" /></div><div><Label htmlFor="review-not-changed">What did not change yet?</Label><Textarea id="review-not-changed" value={whatDidNotChange} onChange={(event) => setWhatDidNotChange(event.target.value)} className="mt-2 min-h-20 bg-white" placeholder="Name the remaining difficulty without self-judgment." /></div><div><Label htmlFor="review-next">What is the next experiment?</Label><Textarea id="review-next" value={nextExperiment} onChange={(event) => setNextExperiment(event.target.value)} className="mt-2 min-h-20 bg-white" placeholder="Choose one follow-on action that would test transfer." /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="review-rating">Evidence rating (1–5)</Label><Input id="review-rating" type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Math.min(5, Math.max(1, Number(event.target.value) || 1)))} className="mt-2 bg-white" /></div><div><Label htmlFor="review-choice">What comes next?</Label><select id="review-choice" value={nextChoice} onChange={(event) => setNextChoice(event.target.value as typeof nextChoice)} className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-[#0A1A2F]"><option value="continue_persona">Continue the Persona scaffold</option><option value="retire_persona">Retire the Persona; keep the behavior</option><option value="switch_intervention">Switch to another intervention</option><option value="pause">Pause and observe</option></select></div></div><Button type="button" onClick={onSubmit} disabled={!ready || pending} className="bg-[#0A1A2F] text-white hover:bg-[#12345A]">{pending ? "Completing…" : "Complete 14-day review"}</Button></CardContent></Card>;
}

function RepCard({ rep, reflection, outcome, setReflection, setOutcome, onSubmit, pending }: { rep: { id: number; instruction: string; trigger: string; successSignal: string; fallbackIfUnsafe: string }; reflection: string; outcome: string; setReflection: (value: string) => void; setOutcome: (value: string) => void; onSubmit: (opportunityStatus: "arose" | "did_not_arise" | "unclear", executionStatus: "yes" | "partly" | "no" | "not_applicable") => void; pending: boolean }) {
  const [opportunity, setOpportunity] = useState<"arose" | "did_not_arise" | "unclear" | null>(null);
  const [execution, setExecution] = useState<"yes" | "partly" | "no" | null>(null);
  return <Card className="border-[#D4AF37]/60 bg-[#FFFDF5]"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.14em] text-[#9B7A17]">Today’s Rep</CardDescription><CardTitle className="mt-2 text-2xl text-[#0A1A2F]">{rep.instruction}</CardTitle><CardDescription>{rep.trigger}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="rounded-xl border border-[#D4AF37]/30 bg-white p-4 text-sm leading-6 text-slate-700"><strong className="text-[#0A1A2F]">Look for:</strong> {rep.successSignal}<br /><strong className="text-[#0A1A2F]">If unsafe:</strong> {rep.fallbackIfUnsafe}</div><div><p className="text-sm font-semibold text-[#0A1A2F]">Did the opportunity arise?</p><div className="mt-2 flex flex-wrap gap-2">{(["arose", "did_not_arise", "unclear"] as const).map((value) => <Button key={value} type="button" variant={opportunity === value ? "default" : "outline"} onClick={() => { setOpportunity(value); setExecution(null); }} className={opportunity === value ? "bg-[#0A1A2F] text-white" : ""}>{value === "arose" ? "Yes" : value === "did_not_arise" ? "Not this time" : "Not sure"}</Button>)}</div></div>{opportunity === "arose" && <><div><p className="text-sm font-semibold text-[#0A1A2F]">Did you do the Rep?</p><div className="mt-2 flex flex-wrap gap-2">{(["yes", "partly", "no"] as const).map((value) => <Button key={value} type="button" onClick={() => setExecution(value)} variant={execution === value ? "default" : "outline"} className={execution === value ? "bg-[#0A1A2F] text-white" : ""}>{value === "yes" ? "Yes" : value === "partly" ? "Partly" : "No"}</Button>)}</div></div>{execution && <div><Label htmlFor="rep-reflection">What happened?</Label><Textarea id="rep-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Keep this short and concrete." className="mt-2 min-h-20 bg-white" /><Label htmlFor="rep-outcome" className="mt-3 block">What was the outcome?</Label><Textarea id="rep-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="What changed, if anything?" className="mt-2 min-h-20 bg-white" /><Button onClick={() => onSubmit("arose", execution)} disabled={pending} className="mt-4 bg-[#0A1A2F] text-white hover:bg-[#12345A]">{pending ? "Recording…" : "Record this Rep"}</Button></div>}</>}{opportunity && opportunity !== "arose" && <Button onClick={() => onSubmit(opportunity, "not_applicable")} disabled={pending} variant="outline">Record that the opportunity did not arise</Button>}</CardContent></Card>;
}
