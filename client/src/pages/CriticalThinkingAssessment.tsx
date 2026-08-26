import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getCriticalThinkingProgress } from "@/lib/criticalThinkingProgress";
import { ChevronLeft, ChevronRight, CircleAlert, Loader2, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

type Section = "behaviour" | "scenarios" | "environment" | "reflection";
const sections: Array<{ id: Section; label: string; helper: string }> = [
  { id: "behaviour", label: "Decision practices", helper: "28 workplace behaviours across seven decision capabilities." },
  { id: "scenarios", label: "Applied judgment", helper: "Eight realistic decisions. Choose a response and state your confidence." },
  { id: "environment", label: "Decision environment", helper: "Ten observations about conditions that enable or constrain sound decisions." },
  { id: "reflection", label: "Development reflection", helper: "Three short prompts to guide a private 30-day development plan." },
];

export default function CriticalThinkingAssessment() {
  const [, params] = useRoute("/critical-thinking/assessment/:campaignId");
  const campaignId = Number(params?.campaignId);
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { data: instrument } = trpc.criticalThinking.getInstrument.useQuery(undefined, { enabled: !!user });
  const start = trpc.criticalThinking.start.useMutation();
  const save = trpc.criticalThinking.saveProgress.useMutation();
  const submit = trpc.criticalThinking.submit.useMutation({ onSuccess: (result) => setLocation(`/critical-thinking/report/${result.reportId}`) });
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [activeSection, setActiveSection] = useState<Section>("behaviour");
  const [behaviour, setBehaviour] = useState<Record<string, number>>({});
  const [scenarios, setScenarios] = useState<Record<string, { optionId: string; confidence: number }>>({});
  const [environment, setEnvironment] = useState<Record<string, number>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const activeIndex = sections.findIndex((section) => section.id === activeSection);

  useEffect(() => {
    if (!user || !Number.isFinite(campaignId) || campaignId <= 0 || start.isPending || assessmentId) return;
    start.mutate({ campaignId }, { onSuccess: ({ assessment, campaign }) => {
      setAssessmentId(assessment.id); setCampaignName(campaign.name); setBehaviour(assessment.behaviourResponses ?? {}); setScenarios(assessment.scenarioResponses ?? {}); setEnvironment(assessment.environmentResponses ?? {}); setReflections(assessment.reflections ?? {}); setActiveSection(assessment.currentSection === "profile" || assessment.currentSection === "complete" ? "behaviour" : assessment.currentSection);
    }, onError: (reason) => setError(reason.message) });
  }, [user, campaignId, assessmentId, start]);

  const responsePayload = useMemo(() => ({ assessmentId: assessmentId ?? 0, currentSection: activeSection, behaviourResponses: behaviour, scenarioResponses: scenarios, environmentResponses: environment, reflections }), [assessmentId, activeSection, behaviour, scenarios, environment, reflections]);
  const questionProgress = useMemo(() => instrument ? getCriticalThinkingProgress(instrument, { behaviour, scenarios, environment, reflections }) : null, [instrument, behaviour, scenarios, environment, reflections]);
  const persist = (next?: Section) => {
    if (!assessmentId) return;
    setError(null);
    save.mutate({ ...responsePayload, currentSection: next ?? activeSection }, { onSuccess: () => next && setActiveSection(next), onError: (reason) => setError(reason.message) });
  };
  const goNext = () => { const next = sections[activeIndex + 1]?.id; if (next) persist(next); };
  const goPrevious = () => { const previous = sections[activeIndex - 1]?.id; if (previous) setActiveSection(previous); };
  const complete = () => { setError(null); submit.mutate(responsePayload, { onError: (reason) => setError(reason.message) }); };

  if (error && !assessmentId) return <div className="grid min-h-screen place-items-center bg-[var(--color-ln-ivory)] p-6"><Card className="max-w-lg"><CardHeader><CardTitle>Diagnostic access unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => setLocation("/critical-thinking")}>Return to diagnostic home</Button></CardContent></Card></div>;
  if (loading || !instrument || !assessmentId) return <div className="grid min-h-screen place-items-center bg-[var(--color-ln-ivory)]"><div className="flex items-center gap-3 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-[#12345A]" />Preparing your diagnostic…</div></div>;

  return <main className="min-h-screen bg-[var(--color-ln-ivory)]"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"><img src="/logo.png" alt="LevelNext" className="h-8 w-auto" /><div className="text-right"><p className="text-xs font-semibold uppercase tracking-widest text-[#12345A]">Critical Thinking in Decision Making</p><p className="text-sm text-slate-500">{campaignName}</p></div></div></header><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3 bg-[#12345A]">Section {activeIndex + 1} of {sections.length}</Badge><h1 className="text-3xl font-bold">{sections[activeIndex].label}</h1><p className="mt-2 max-w-2xl text-slate-600">{sections[activeIndex].helper}</p></div><div className="w-full rounded-xl border border-[#12345A]/10 bg-white p-4 sm:w-80"><div className="mb-2 flex items-baseline justify-between gap-3"><span className="text-sm font-semibold text-[#12345A]">Assessment progress</span><span className="text-xs text-slate-500">{questionProgress?.percent ?? 0}% complete</span></div><Progress value={questionProgress?.percent ?? 0} /><p className="mt-2 text-xs text-slate-600"><strong>{questionProgress?.completed ?? 0}</strong> of {questionProgress?.total ?? 0} items answered · <strong>{questionProgress?.remaining ?? 0}</strong> left</p></div></div><div className="mb-7 rounded-xl border border-[#F2B705]/30 bg-[#fff8db] p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#12345A]" />There are no ‘always right’ answers. Use the context given, choose the most defensible next response, and avoid adding confidential detail in reflection responses.</div>{error && <div className="mb-6 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><CircleAlert className="h-5 w-5 shrink-0" />{error}</div>}
  {activeSection === "behaviour" && <BehaviourSection instrument={instrument} values={behaviour} onChange={(id, value) => setBehaviour((current) => ({ ...current, [id]: value }))} />}
  {activeSection === "scenarios" && <ScenarioSection instrument={instrument} values={scenarios} onChange={(id, value) => setScenarios((current) => ({ ...current, [id]: value }))} />}
  {activeSection === "environment" && <EnvironmentSection instrument={instrument} values={environment} onChange={(id, value) => setEnvironment((current) => ({ ...current, [id]: value }))} />}
  {activeSection === "reflection" && <ReflectionSection instrument={instrument} values={reflections} onChange={(id, value) => setReflections((current) => ({ ...current, [id]: value }))} />}
  <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t pt-6"><Button variant="outline" disabled={activeIndex === 0 || save.isPending || submit.isPending} onClick={goPrevious}><ChevronLeft className="mr-1 h-4 w-4" />Back</Button><Button variant="ghost" disabled={save.isPending || submit.isPending} onClick={() => persist()}><Save className="mr-2 h-4 w-4" />Save and continue later</Button>{activeIndex < sections.length - 1 ? <Button disabled={save.isPending || submit.isPending} onClick={goNext}>Save and continue<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button className="bg-[#12345A]" disabled={submit.isPending || save.isPending} onClick={complete}>{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create my developmental report<ChevronRight className="ml-1 h-4 w-4" /></Button>}</div></div></main>;
}

function Scale({ itemId, value, options, onChange }: { itemId: string; value?: number; options: readonly { value: number; label: string }[]; onChange: (value: number) => void }) { return <RadioGroup value={value?.toString()} onValueChange={(next) => onChange(Number(next))} className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{options.map((option) => <Label key={option.value} htmlFor={`${itemId}-${option.value}`} className={`flex min-h-16 cursor-pointer flex-col justify-between rounded-lg border p-3 text-xs transition-colors ${value === option.value ? "border-[#12345A] bg-[#12345A]/5" : "bg-white hover:border-[#12345A]/40"}`}><RadioGroupItem value={option.value.toString()} id={`${itemId}-${option.value}`} className="sr-only" /><span className="font-semibold text-[#12345A]">{option.value === 0 ? "N/A" : option.value}</span><span className="leading-4 text-slate-600">{option.label}</span></Label>)}</RadioGroup>; }
function BehaviourSection({ instrument, values, onChange }: { instrument: any; values: Record<string, number>; onChange: (id: string, value: number) => void }) { return <div className="space-y-6">{instrument.dimensions.map((dimension: any) => <Card key={dimension.id}><CardHeader><CardTitle className="text-lg text-[#12345A]">{dimension.label}</CardTitle><CardDescription>{dimension.definition}</CardDescription></CardHeader><CardContent className="space-y-6">{instrument.behaviourItems.filter((item: any) => item.dimensionId === dimension.id).map((item: any, index: number) => <div key={item.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0"><p className="font-medium leading-6"><span className="mr-2 text-sm text-slate-400">{index + 1}.</span>{item.wording}</p><Scale itemId={item.id} value={values[item.id]} options={instrument.responseScale} onChange={(value) => onChange(item.id, value)} /></div>)}</CardContent></Card>)}</div>; }
function ScenarioSection({ instrument, values, onChange }: { instrument: any; values: Record<string, { optionId: string; confidence: number }>; onChange: (id: string, value: { optionId: string; confidence: number }) => void }) { return <div className="space-y-6">{instrument.scenarios.map((scenario: any, index: number) => { const current = values[scenario.id] ?? { optionId: "", confidence: 50 }; return <Card key={scenario.id}><CardHeader><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Scenario {index + 1}</Badge><Badge className="bg-[#F2B705] text-[#12345A] hover:bg-[#F2B705]">{scenario.context}</Badge></div><CardTitle className="pt-2 text-xl">{scenario.title}</CardTitle><CardDescription className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{scenario.text}</CardDescription></CardHeader><CardContent><div className="mb-5 grid gap-3 rounded-lg border border-[#12345A]/10 bg-[#12345A]/[0.03] p-4 text-xs text-slate-600 sm:grid-cols-3"><span><strong>Reversibility:</strong> {scenario.reversibility}</span><span><strong>Cost of delay:</strong> {scenario.delayCost}</span><span><strong>Pressures:</strong> {scenario.embeddedRisks.join(", ")}</span></div><RadioGroup value={current.optionId} onValueChange={(optionId) => onChange(scenario.id, { ...current, optionId })} className="space-y-3">{scenario.options.map((option: any) => <Label key={option.id} htmlFor={`${scenario.id}-${option.id}`} className={`flex cursor-pointer gap-3 rounded-lg border p-4 leading-6 transition-colors ${current.optionId === option.id ? "border-[#12345A] bg-[#12345A]/5" : "hover:border-[#12345A]/40"}`}><RadioGroupItem value={option.id} id={`${scenario.id}-${option.id}`} className="mt-1" /><span>{option.label}</span></Label>)}</RadioGroup><div className="mt-6 rounded-lg bg-[#fff8db] p-4"><div className="mb-3 flex justify-between gap-3 text-sm font-medium"><span>How confident are you that this is the best response?</span><span className="text-[#12345A]">{current.confidence}%</span></div><Slider value={[current.confidence]} min={0} max={100} step={5} onValueChange={([confidence]) => onChange(scenario.id, { ...current, confidence })} /></div></CardContent></Card>})}</div>; }
function EnvironmentSection({ instrument, values, onChange }: { instrument: any; values: Record<string, number>; onChange: (id: string, value: number) => void }) { return <Card><CardHeader><CardTitle>How does your decision environment operate?</CardTitle><CardDescription>These results are reported separately. A constraining environment does not reduce your individual capability score.</CardDescription></CardHeader><CardContent className="space-y-7">{instrument.environmentItems.map((item: any, index: number) => <div key={item.id} className="border-b border-slate-100 pb-7 last:border-0"><p className="font-medium leading-6"><span className="mr-2 text-sm text-slate-400">{index + 1}.</span>{item.wording}</p><Scale itemId={item.id} value={values[item.id]} options={instrument.environmentScale} onChange={(value) => onChange(item.id, value)} /></div>)}</CardContent></Card>; }
function ReflectionSection({ instrument, values, onChange }: { instrument: any; values: Record<string, string>; onChange: (id: string, value: string) => void }) { return <Card><CardHeader><CardTitle>Turn insight into a 30-day experiment</CardTitle><CardDescription>Keep your examples non-confidential. These answers are for your private developmental report.</CardDescription></CardHeader><CardContent className="space-y-6">{instrument.reflectiveQuestions.map((question: any, index: number) => <div key={question.id}><Label htmlFor={question.id} className="text-base leading-6">{index + 1}. {question.prompt}</Label><Textarea id={question.id} value={values[question.id] ?? ""} onChange={(event) => onChange(question.id, event.target.value)} className="mt-3 min-h-30 bg-white" placeholder="Write a brief, non-confidential reflection…" /></div>)}</CardContent></Card>; }
