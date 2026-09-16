import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { BrainCircuit, CheckCircle2, ChevronDown, Loader2, LockKeyhole, MessageCircleHeart, Sparkles } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import EngineeringPageHeader from "@/components/engineering/EngineeringPageHeader";
import EngineScoreBar from "@/components/engineering/EngineScoreBar";
import MissionCard from "@/components/engineering/MissionCard";

export default function EngineeringOperatingProfile() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const profileQuery = trpc.engineering.getOperatingProfile.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });
  const saveContext = trpc.engineering.saveProfileContext.useMutation({ onSuccess: () => utils.engineering.getOperatingProfile.invalidate() });
  const updateMission = trpc.engineering.updateMission.useMutation({ onSuccess: () => utils.engineering.getOperatingProfile.invalidate() });
  const analyse = trpc.engineering.analyseSelfLeadership.useMutation({ onSuccess: () => utils.engineering.getOperatingProfile.invalidate() });
  const rateReflection = trpc.engineering.rateSelfLeadership.useMutation({ onSuccess: () => utils.engineering.getOperatingProfile.invalidate() });
  const [editingProfile, setEditingProfile] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [roleTitle, setRoleTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [engineeringLevel, setEngineeringLevel] = useState("");
  const [aspiration, setAspiration] = useState("");
  const [situation, setSituation] = useState("");
  const [observedBehaviour, setObservedBehaviour] = useState("");

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/login?returnTo=%2Fengineering%2Fprofile"); }, [isAuthenticated, loading, navigate]);
  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (profile) { setRoleTitle(profile.roleTitle ?? ""); setDiscipline(profile.discipline ?? ""); setEngineeringLevel(profile.engineeringLevel ?? ""); setAspiration(profile.aspiration ?? ""); }
  }, [profileQuery.data?.profile]);

  const result = profileQuery.data?.latestResult;
  const engineScores = useMemo(() => Object.entries((result?.engineScores ?? {}) as Record<string, number>).sort(([, first], [, second]) => second - first), [result?.engineScores]);
  const mission = profileQuery.data?.missions?.[0];
  const latestReflection = analyse.data?.analysis;

  async function saveProfile() {
    await saveContext.mutateAsync({ roleTitle: roleTitle || undefined, discipline: discipline || undefined, engineeringLevel: engineeringLevel || undefined, aspiration: aspiration || undefined });
    setEditingProfile(false);
  }

  async function requestReflection() {
    if (situation.trim().length < 10) return;
    await analyse.mutateAsync({ situation, observedBehaviour: observedBehaviour || undefined, careerStage: "professional", role: roleTitle || undefined });
  }

  if (loading || profileQuery.isLoading) return <PlatformLayout title="Tech Intelligence"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><div className="h-12 w-80 animate-pulse rounded-xl bg-slate-200" /><div className="mt-8 grid gap-5 lg:grid-cols-3"><div className="h-72 animate-pulse rounded-3xl bg-slate-100 lg:col-span-2" /><div className="h-72 animate-pulse rounded-3xl bg-slate-100" /></div></div></PlatformLayout>;

  if (profileQuery.error) return <PlatformLayout title="Tech Intelligence"><div className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><EngineeringPageHeader eyebrow="Tech Intelligence" title="Operating Profile" description="Your personal development intelligence across the work you do." /><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{profileQuery.error.message}</div></div></PlatformLayout>;

  if (!result) {
    return <PlatformLayout title="Tech Intelligence"><main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8"><EngineeringPageHeader eyebrow="Tech Intelligence" title="Your Operating Profile" description="A living view of how you develop impact across self, teams, systems, and business." /><section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(16,36,62,0.08)]"><BrainCircuit className="mx-auto text-[#D4A900]" size={36} /><h2 className="mt-4 text-xl font-bold text-[#10243E]">Your profile begins with a diagnostic</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Complete the Tech Impact Diagnostic to create a developmental baseline and a practical Mission.</p><Link href="/engineering/diagnostic"><Button className="mt-6 bg-[#10243E] text-white hover:bg-[#18395F]">Start diagnostic</Button></Link></section></main></PlatformLayout>;
  }

  return (
    <PlatformLayout title="Tech Intelligence">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <EngineeringPageHeader eyebrow="Tech Intelligence" title="Your Operating Profile" description="A living developmental view: what is currently available to you, where your impact is extending, and one practical edge to work on next." />
        <section className="overflow-hidden rounded-3xl bg-[#10243E] shadow-[0_20px_50px_rgba(16,36,62,0.14)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F0C73B]">Current impact pattern</p>
              <h2 className="mt-2 text-3xl font-bold text-white">{result.impactPattern}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Your present impact radius is <strong className="text-white">{result.impactRadius}</strong>. This is not a ranking—it is a working hypothesis based on this diagnostic, designed to be refined by real workplace evidence.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#F0C73B]">Growth edge</p>
              <p className="mt-2 text-base font-semibold text-white">{(result.growthEdge as { statement: string }).statement}</p>
              <p className="mt-3 text-xs leading-5 text-slate-300">Built from a deterministic instrument. Your profile develops through action, reflection, and evidence—not another static score.</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#10243E]">Tech Intelligence engines</h2><p className="mt-0.5 text-xs text-slate-500">Signals describe current range, not fixed capability.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Assessment {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
            <div className="grid gap-3 sm:grid-cols-2">{engineScores.map(([engine, score]) => <EngineScoreBar key={engine} engine={engine} score={score} />)}</div>
          </section>
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#A37C00]">Profile context</p><h2 className="mt-1 text-base font-bold text-[#10243E]">Make the view more specific</h2></div><Button size="sm" variant="ghost" onClick={() => setEditingProfile((value) => !value)} className="text-xs text-[#10243E]">{editingProfile ? "Close" : "Edit"}</Button></div>
            {!editingProfile ? <div className="mt-4 space-y-2 text-sm"><p className="text-slate-500"><span className="font-medium text-[#10243E]">Role:</span> {profileQuery.data?.profile?.roleTitle || "Add your role"}</p><p className="text-slate-500"><span className="font-medium text-[#10243E]">Discipline:</span> {profileQuery.data?.profile?.discipline || "Add your discipline"}</p><p className="text-slate-500"><span className="font-medium text-[#10243E]">Direction:</span> {profileQuery.data?.profile?.aspiration || "Add the impact you want to build"}</p></div> : <div className="mt-4 space-y-3"><div><Label htmlFor="ei-role">Role title</Label><Input id="ei-role" className="mt-1" value={roleTitle} onChange={(event) => setRoleTitle(event.target.value)} placeholder="e.g. Senior Backend Engineer" /></div><div><Label htmlFor="ei-discipline">Engineering discipline</Label><Input id="ei-discipline" className="mt-1" value={discipline} onChange={(event) => setDiscipline(event.target.value)} placeholder="e.g. Platform engineering" /></div><div><Label htmlFor="ei-level">Current level</Label><Input id="ei-level" className="mt-1" value={engineeringLevel} onChange={(event) => setEngineeringLevel(event.target.value)} placeholder="e.g. Senior / Staff" /></div><div><Label htmlFor="ei-direction">Impact direction</Label><Input id="ei-direction" className="mt-1" value={aspiration} onChange={(event) => setAspiration(event.target.value)} placeholder="e.g. Lead more cross-team decisions" /></div><Button disabled={saveContext.isPending} onClick={saveProfile} className="w-full bg-[#10243E] text-white">{saveContext.isPending && <Loader2 className="mr-2 animate-spin" size={15} />} Save context</Button></div>}
          </aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            {mission && <MissionCard mission={mission} busy={updateMission.isPending} onStatus={(status) => updateMission.mutate({ missionId: mission.id, status })} onVisibility={(partnerVisible) => updateMission.mutate({ missionId: mission.id, partnerVisible })} />}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <button type="button" onClick={() => setReflectionOpen((value) => !value)} className="flex w-full items-center justify-between text-left"><span><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#A37C00]"><MessageCircleHeart size={15} /> Private Self-Leadership reflection</span><span className="mt-1 block text-base font-bold text-[#10243E]">Think through a real workplace moment</span></span><ChevronDown className={`text-slate-400 transition-transform ${reflectionOpen ? "rotate-180" : ""}`} size={20} /></button>
            <p className="mt-2 text-sm leading-6 text-slate-600">Explore the difference between a knowing, seeing, or choosing challenge. The reflection is private to you and does not appear in your Partner workspace.</p>
            {reflectionOpen && <div className="mt-5 space-y-3 border-t border-slate-100 pt-5"><div><Label htmlFor="ei-situation">What happened?</Label><Textarea id="ei-situation" value={situation} onChange={(event) => setSituation(event.target.value)} className="mt-1 min-h-28" placeholder="Describe one specific workplace moment and what mattered." /></div><div><Label htmlFor="ei-observation">What did you notice about how you responded? <span className="font-normal text-slate-400">Optional</span></Label><Textarea id="ei-observation" value={observedBehaviour} onChange={(event) => setObservedBehaviour(event.target.value)} className="mt-1 min-h-20" placeholder="Describe observable behaviour, not a judgment about yourself." /></div><Button disabled={analyse.isPending || situation.trim().length < 10} onClick={requestReflection} className="bg-[#10243E] text-white"><Sparkles className="mr-2" size={15} /> {analyse.isPending ? "Building your reflection…" : "Create a private reflection"}</Button>
              {latestReflection && <div className="rounded-xl border border-[#E7D69A] bg-[#FFFDF5] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#A37C00]">What we are noticing</p><p className="mt-2 text-sm font-semibold text-[#10243E]">{latestReflection.mirror.whatWeAreNoticing}</p><p className="mt-2 text-sm leading-6 text-slate-600">{latestReflection.mirror.whyItMayMatter}</p><div className="mt-3 rounded-lg bg-white p-3"><p className="text-xs font-semibold text-slate-500">One experiment</p><p className="mt-1 text-sm text-[#10243E]">{latestReflection.microExperiment}</p></div></div>}
            </div>}
            {(profileQuery.data?.mirrors?.length ?? 0) > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-500">Recent private reflections</p><div className="mt-2 space-y-2">{profileQuery.data?.mirrors?.slice(0, 3).map((mirror) => <div key={mirror.id} className="flex gap-2 rounded-lg bg-slate-50 p-2.5"><LockKeyhole className="mt-0.5 shrink-0 text-slate-400" size={14} /><div className="min-w-0"><p className="truncate text-xs font-medium text-[#10243E]">{mirror.analysis.mirror?.whatWeAreNoticing ?? mirror.situation}</p><div className="mt-1 flex gap-2"><span className="text-[10px] text-slate-500">{mirror.primaryDimension.replace(/_/g, " ")}</span>{mirror.relevance ? <button onClick={() => rateReflection.mutate({ mirrorId: mirror.id, relevance: mirror.relevance === "up" ? "down" : "up" })} className="text-[10px] font-semibold text-[#A37C00]">Marked {mirror.relevance === "up" ? "relevant" : "not relevant"}</button> : null}</div></div></div>)}</div></div>}
          </section>
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-slate-500"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" /> Your diagnostic and Self-Leadership reflections are owned by you. Sharing a Mission focus with a Success Partner is optional and reversible.</p>
      </main>
    </PlatformLayout>
  );
}
