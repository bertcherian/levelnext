import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  FlaskConical,
  Gauge,
  History,
  Loader2,
  LockKeyhole,
  Play,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UsersRound,
} from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  getPilotlabScenarioCounts,
  PILOTLAB_DIMENSIONS,
  type PilotlabAgentTrajectory,
} from "@shared/modules/pilotlab";

const NAVY = "#0A1A2F";
const GOLD = "#D4AF37";
const IVORY = "#F8F5F0";

const trajectoryMeta: Record<PilotlabAgentTrajectory, { label: string; color: string }> = {
  resistant_breakthrough: { label: "Resistant → Breakthrough", color: "bg-amber-100 text-amber-800 border-amber-200" },
  false_positive: { label: "False Positive", color: "bg-rose-100 text-rose-800 border-rose-200" },
  improvement_relapse_recovery: { label: "Improvement → Relapse → Recovery", color: "bg-violet-100 text-violet-800 border-violet-200" },
  slow_compounder: { label: "Slow Compounder", color: "bg-sky-100 text-sky-800 border-sky-200" },
  already_strong: { label: "Already Strong", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

function statusTone(status: string) {
  if (status === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "running") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "failed") return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function severityTone(severity: string) {
  if (severity === "critical") return "bg-rose-100 text-rose-800 border-rose-200";
  if (severity === "significant") return "bg-orange-100 text-orange-800 border-orange-200";
  if (severity === "warning") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function metricLabel(key: string) {
  return key.replace(/^F\d+_/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Pilotlab() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const workspaceQuery = trpc.pilotlab.workspace.useQuery(undefined, { enabled: user?.role === "admin" });
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [runName, setRunName] = useState("60-day Manager Behaviour Pilot");
  const selectedRunQuery = trpc.pilotlab.runDetails.useQuery(
    { runId: selectedRunId ?? 0 },
    { enabled: user?.role === "admin" && Boolean(selectedRunId) },
  );
  const detail = selectedRunQuery.data ?? (selectedRunId === workspaceQuery.data?.latest?.run.id ? workspaceQuery.data.latest : undefined);

  useEffect(() => {
    if (!selectedRunId && workspaceQuery.data?.latest?.run.id) setSelectedRunId(workspaceQuery.data.latest.run.id);
  }, [selectedRunId, workspaceQuery.data?.latest?.run.id]);

  const createRunMutation = trpc.pilotlab.createRun.useMutation({
    onSuccess: (created) => {
      setSelectedRunId(created.run.id);
      void utils.pilotlab.workspace.invalidate();
      void utils.pilotlab.runDetails.invalidate();
    },
  });
  const advanceMutation = trpc.pilotlab.advanceTime.useMutation({
    onSuccess: () => {
      void utils.pilotlab.workspace.invalidate();
      void utils.pilotlab.runDetails.invalidate();
    },
  });

  const scenarioCounts = useMemo(() => getPilotlabScenarioCounts(), []);
  const progress = detail ? Math.round((detail.run.virtualDay / detail.run.virtualDurationDays) * 100) : 0;
  const error = workspaceQuery.error?.message ?? selectedRunQuery.error?.message ?? createRunMutation.error?.message ?? advanceMutation.error?.message;

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#F8F5F0] text-[#0A1A2F]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (user?.role !== "admin") {
    return <PlatformLayout title="Pilotlab"><main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-6"><Card className="w-full border-amber-200 bg-[#FFF9E8]"><CardHeader><div className="flex items-center gap-3"><LockKeyhole className="h-6 w-6 text-[#9B7A17]" /><div><CardTitle className="text-[#0A1A2F]">Pilotlab is restricted</CardTitle><CardDescription>Digital-twin runs contain controlled scenarios, audit findings, and simulated ground-truth data. Administrator access is required.</CardDescription></div></div></CardHeader><CardContent><Link href="/leader"><Button variant="outline">Return to LevelNext</Button></Link></CardContent></Card></main></PlatformLayout>;
  }

  return <PlatformLayout title="Pilotlab"><main className="min-h-screen bg-[#F8F5F0] px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="overflow-hidden rounded-[28px] bg-[#0A1A2F] px-6 py-7 text-white shadow-xl sm:px-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#E7CA72]"><FlaskConical className="h-4 w-4" /> LevelNext Pilotlab</div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Behavioral digital-twin testing—before a real pilot carries the risk.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">A controlled 60-day virtual environment that tests whether LevelNext detects, develops and evidences behavioral movement—without inventing evidence, leaking hidden truth, or converting simulation economics into ROI claims.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm"><ShieldCheck className="h-5 w-5 text-[#E7CA72]" /><span><strong className="block text-white">Assurance first</strong><span className="text-xs text-slate-300">Failures are useful findings.</span></span></div>
        </div>
      </header>

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /><span>{error}</span></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<UsersRound className="h-5 w-5" />} label="Manager agents" value="5" detail="Five distinct trajectories" />
        <Metric icon={<History className="h-5 w-5" />} label="Golden scenarios" value={String(scenarioCounts.total)} detail="15 + 15 + 15 + 5" />
        <Metric icon={<TimerReset className="h-5 w-5" />} label="Virtual calendar" value="60 days" detail="Compressed, causality retained" />
        <Metric icon={<ShieldAlert className="h-5 w-5" />} label="Information planes" value="3" detail="Truth, manager, LevelNext" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="border-[#0A1A2F]/10 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardDescription className="font-bold uppercase tracking-[0.13em] text-[#9B7A17]">Simulation controller</CardDescription><CardTitle className="mt-2 text-xl text-[#0A1A2F]">Controlled run queue</CardTitle></div>{detail && <Badge variant="outline" className={statusTone(detail.run.status)}>{detail.run.status}</Badge>}</div></CardHeader>
          <CardContent className="space-y-5 pt-5">
            {detail ? <>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-[#0A1A2F]">{detail.run.name}</p><p className="mt-1 text-xs text-slate-500">{detail.run.runCode} · started {new Date(detail.run.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => advanceMutation.mutate({ runId: detail.run.id, days: 7 })} disabled={advanceMutation.isPending || detail.run.status === "completed"}><CalendarClock className="mr-2 h-4 w-4" />Advance 7 days</Button><Button size="sm" onClick={() => advanceMutation.mutate({ runId: detail.run.id, days: 60 })} disabled={advanceMutation.isPending || detail.run.status === "completed"} className="bg-[#0A1A2F] text-white hover:bg-[#12345A]"><Play className="mr-2 h-4 w-4" />{advanceMutation.isPending ? "Simulating…" : detail.run.status === "completed" ? "Run complete" : "Run to Day 60"}</Button></div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-[#0A1A2F]">Virtual time</span><span className="text-slate-600">Day {detail.run.virtualDay} / {detail.run.virtualDurationDays}</span></div><Progress value={progress} className="h-2.5" /><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>{detail.run.scenariosExecuted} / {detail.run.scenariosTotal} Golden scenarios</span><span>{detail.run.interactions} traceable interactions</span><span>Ground truth remains auditor-only</span></div></div>
              <div className="grid gap-3 md:grid-cols-2">{detail.agents.map((agent) => { const state = agent.currentState as Record<string, unknown>; const meta = trajectoryMeta[agent.trajectory]; return <div key={agent.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-[#0A1A2F]">{agent.name}</p><p className="text-xs text-slate-500">{agent.role}</p></div><Badge variant="outline" className={`max-w-45 text-right text-[10px] ${meta.color}`}>{meta.label}</Badge></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><Signal label="Trust" value={Number(state.trust ?? 0)} /><Signal label="Load" value={Number(state.workload ?? 0)} /><Signal label="Evidence" value={Number(state.evidenceLevel ?? 1)} max={7} /></div></div>; })}</div>
            </> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center"><Bot className="mx-auto h-8 w-8 text-[#9B7A17]" /><p className="mt-3 font-semibold text-[#0A1A2F]">No simulation has been created.</p><p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Start a controlled run to seed five manager agents, the Golden 50 scenario library, and the three information planes. No real employee data is used.</p></div>}
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FFF9E8] p-4"><div className="flex flex-wrap items-end gap-3"><div className="min-w-55 flex-1"><Label htmlFor="pilotlab-run-name" className="text-xs font-semibold text-[#0A1A2F]">New controlled run</Label><Input id="pilotlab-run-name" value={runName} onChange={(event) => setRunName(event.target.value)} maxLength={160} className="mt-2 bg-white" /></div><Button onClick={() => createRunMutation.mutate({ name: runName })} disabled={createRunMutation.isPending || runName.trim().length < 3} className="bg-[#D4AF37] text-[#0A1A2F] hover:bg-[#E7CA72]"><Sparkles className="mr-2 h-4 w-4" />{createRunMutation.isPending ? "Creating…" : "Create controlled run"}</Button></div></div>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.13em] text-[#9B7A17]">Run history</CardDescription><CardTitle className="mt-2 text-lg text-[#0A1A2F]">Replayable simulations</CardTitle></CardHeader><CardContent className="space-y-2">{workspaceQuery.isLoading ? <div className="flex justify-center py-5"><Loader2 className="h-5 w-5 animate-spin" /></div> : workspaceQuery.data?.runs.length ? workspaceQuery.data.runs.map((run) => <button key={run.id} type="button" onClick={() => setSelectedRunId(run.id)} className={`w-full rounded-xl border p-3 text-left transition ${selectedRunId === run.id ? "border-[#D4AF37] bg-[#FFF9E8]" : "border-slate-200 hover:border-slate-300"}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-[#0A1A2F]">{run.runCode}</span><Badge variant="outline" className={`text-[10px] ${statusTone(run.status)}`}>{run.status}</Badge></div><p className="mt-1 truncate text-xs text-slate-500">{run.name}</p><p className="mt-2 text-[11px] text-slate-400">Day {run.virtualDay} · {run.scenariosExecuted}/{run.scenariosTotal} scenarios</p></button>) : <p className="py-3 text-sm text-slate-500">Runs will appear here after creation.</p>}</CardContent></Card>
          <Card className="border-[#0A1A2F]/10 bg-[#0A1A2F] text-white"><CardHeader><CardDescription className="flex items-center gap-2 font-bold uppercase tracking-[0.13em] text-[#E7CA72]"><EyeOff className="h-4 w-4" /> Information boundary</CardDescription><CardTitle className="mt-2 text-lg text-white">Truth is not coaching context.</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-slate-300"><p><strong className="text-white">Ground Truth</strong> is restricted to the auditor.</p><p><strong className="text-white">Manager Reality</strong> may omit, distort or disclose selectively.</p><p><strong className="text-white">LevelNext Reality</strong> contains only legitimate, permitted signals.</p></CardContent></Card>
        </aside>
      </section>

      {detail && <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.13em] text-[#9B7A17]">Independent auditor</CardDescription><CardTitle className="mt-2 text-xl text-[#0A1A2F]">Dimension results</CardTitle><CardDescription>Deterministic checks lead the verdict. Any qualitative review is supporting context, never the sole system-quality decision.</CardDescription></CardHeader><CardContent>{detail.summary.dimensions.length ? <div className="space-y-4">{detail.summary.dimensions.map((result) => <div key={result.dimension}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-[#0A1A2F]">{result.dimension}</span><span className="text-xs text-slate-500">{result.score}/100 · {result.failed} flagged</span></div><Progress value={result.score} className="h-2" /></div>)}</div> : <p className="text-sm text-slate-500">Complete the 60-day run to calculate the final dimension report.</p>}<div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><span className="font-semibold text-[#0A1A2F]">Sponsor conclusion: </span>{detail.summary.sponsorConclusion}</div></CardContent></Card>
        <Card className="border-[#0A1A2F]/10 bg-white"><CardHeader><CardDescription className="font-bold uppercase tracking-[0.13em] text-[#9B7A17]">Audit replay</CardDescription><CardTitle className="mt-2 text-xl text-[#0A1A2F]">Why did a test flag?</CardTitle></CardHeader><CardContent className="space-y-3">{detail.events.length ? detail.events.slice(-8).reverse().map((event) => <div key={event.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-[#0A1A2F]">{event.scenarioCode}</span><span className="text-xs text-slate-500">Day {event.virtualDay}</span></div>{event.failureCode ? <Badge variant="outline" className={severityTone(event.severity)}>{metricLabel(event.failureCode)}</Badge> : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="mr-1 h-3 w-3" />Checked</Badge>}</div><p className="mt-2 text-xs leading-5 text-slate-600">{String((event.evaluatorResult as Record<string, unknown> | null)?.rationale ?? "Trace recorded with permitted context only.")}</p></div>) : <p className="text-sm text-slate-500">Advance virtual time to create replayable interactions.</p>}</CardContent></Card>
      </section>}

      {detail && <section className="grid gap-4 md:grid-cols-3"><Guardrail icon={<LockKeyhole className="h-5 w-5" />} title="No information leakage" copy="The UI and LevelNext-context projection never expose stored ground truth or hidden manager state." /><Guardrail icon={<BrainCircuit className="h-5 w-5" />} title="Evidence ladder enforced" copy="Intent, practice and self-report remain distinct from corroborated behavior, outcomes and business impact." /><Guardrail icon={<Gauge className="h-5 w-5" />} title="No manufactured certainty" copy="Sponsor findings retain uncertainty and propose the next test instead of claiming real-world ROI." /></section>}
    </div>
  </main></PlatformLayout>;
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <Card className="border-[#0A1A2F]/10 bg-white"><CardContent className="flex gap-3 p-4"><div className="rounded-xl bg-[#0A1A2F]/[0.06] p-2.5 text-[#9B7A17]">{icon}</div><div><p className="text-2xl font-semibold text-[#0A1A2F]">{value}</p><p className="text-xs font-semibold text-slate-700">{label}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div></CardContent></Card>;
}

function Signal({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = Math.round((value / max) * 100);
  return <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-semibold text-[#0A1A2F]">{value}{max === 100 ? "%" : `/${max}`}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${percentage}%` }} /></div></div>;
}

function Guardrail({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <Card className="border-[#0A1A2F]/10 bg-white"><CardContent className="flex gap-3 p-5"><div className="text-[#9B7A17]">{icon}</div><div><p className="font-semibold text-[#0A1A2F]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{copy}</p></div></CardContent></Card>;
}
