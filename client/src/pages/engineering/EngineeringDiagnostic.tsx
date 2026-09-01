import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Loader2, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import EngineeringPageHeader from "@/components/engineering/EngineeringPageHeader";

const SCALE = [
  { value: 1, label: "Rarely", helper: "This is not yet a reliable habit." },
  { value: 2, label: "Occasionally", helper: "I can do this in familiar situations." },
  { value: 3, label: "Sometimes", helper: "I use it with uneven consistency." },
  { value: 4, label: "Often", helper: "It is available in most relevant moments." },
  { value: 5, label: "Consistently", helper: "I use it deliberately and reliably." },
];

export default function EngineeringDiagnostic() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const stateQuery = trpc.engineering.getDiagnosticState.useQuery(undefined, { enabled: isAuthenticated });
  const startMutation = trpc.engineering.startDiagnostic.useMutation();
  const saveMutation = trpc.engineering.saveDiagnosticResponse.useMutation();
  const completeMutation = trpc.engineering.completeDiagnostic.useMutation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const session = stateQuery.data?.session;
    if (session && session.id !== sessionId) {
      setSessionId(session.id);
      setIndex(session.currentQuestionIndex);
      setAnswers(session.answers);
    }
  }, [sessionId, stateQuery.data?.session]);

  const questions = stateQuery.data?.questions ?? [];
  const question = questions[index];
  const selected = question ? answers[question.code] : undefined;
  const progress = questions.length ? Math.round(((index + (selected ? 1 : 0)) / questions.length) * 100) : 0;
  const isLast = index === questions.length - 1;
  const canAdvance = Boolean(sessionId && selected);

  const resumeLabel = stateQuery.data?.session ? "Resume diagnostic" : "Begin diagnostic";
  const currentDescriptor = useMemo(() => question?.detail ?? "Tech Intelligence", [question]);

  async function startOrResume() {
    const result = await startMutation.mutateAsync();
    setSessionId(result.sessionId);
    setIndex(result.currentQuestionIndex);
    await utils.engineering.getDiagnosticState.invalidate();
  }

  async function advance() {
    if (!sessionId || !question || !selected) return;
    setSaving(true);
    try {
      await saveMutation.mutateAsync({ sessionId, questionCode: question.code, answerValue: selected });
      if (isLast) {
        await completeMutation.mutateAsync({ sessionId });
        await utils.engineering.getOperatingProfile.invalidate();
        navigate("/engineering/profile");
      } else {
        setIndex((value) => value + 1);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || stateQuery.isLoading) {
    return <PlatformLayout title="Tech Intelligence"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Skeleton className="h-10 w-72" /><Skeleton className="mt-8 h-[440px] rounded-3xl" /></div></PlatformLayout>;
  }

  if (stateQuery.error) {
    return <PlatformLayout title="Tech Intelligence"><div className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><EngineeringPageHeader eyebrow="Tech Intelligence" title="Your diagnostic needs organisation access" description="This experience is configured for members of an organisation programme." /><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><CircleAlert className="mb-2" size={20} /> {stateQuery.error.message}</div></div></PlatformLayout>;
  }

  return (
    <PlatformLayout title="Tech Intelligence">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <EngineeringPageHeader eyebrow="Tech Intelligence" title="Tech Impact Diagnostic" description="A focused reflection on how you work across self, teams, systems, and business context. This is developmental intelligence, not a performance rating." />

        {!sessionId ? (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(16,36,62,0.08)]">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 sm:p-9">
                <p className="text-sm font-semibold text-[#A37C00]">12 reflective prompts · approximately 6 minutes</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#10243E]">Find the next place to practise, not a label to live up to.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Your answers create an Operating Profile that shows developmental signals across six Tech Intelligence engines and a single practical Mission. You can pause and resume; your raw responses are private.</p>
                <Button disabled={startMutation.isPending} onClick={startOrResume} className="mt-6 h-11 bg-[#10243E] px-5 font-semibold text-white hover:bg-[#18395F]">
                  {startMutation.isPending ? <Loader2 className="mr-2 animate-spin" size={16} /> : <ChevronRight className="mr-2" size={16} />} {resumeLabel}
                </Button>
              </div>
              <div className="bg-[#10243E] p-6 text-white sm:p-9">
                <ShieldCheck className="text-[#F0C73B]" size={28} />
                <h3 className="mt-5 text-lg font-bold">Your privacy boundary</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Success Partners do not see your answers, private Self-Leadership reflections, or personal engine scores. You decide separately whether to share a Mission focus.</p>
                <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-3 text-xs leading-5 text-slate-300">Answer for the way you most often operate today—not the ideal version of you on a particularly good week.</div>
              </div>
            </div>
          </section>
        ) : question ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(16,36,62,0.08)] sm:p-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A37C00]">Question {index + 1} of {questions.length}</p>
                <p className="mt-1 text-xs text-slate-500">{currentDescriptor}</p>
              </div>
              <div className="w-full sm:w-48">
                <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500"><span>Progress</span><span>{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#D4A900] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold leading-tight text-[#10243E] sm:text-3xl">{question.prompt}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Choose the response that is most true across real work situations. There is no ideal answer.</p>
              <div className="mt-7 grid gap-2.5" role="radiogroup" aria-label={question.prompt}>
                {SCALE.map((option) => {
                  const active = selected === option.value;
                  return <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => setAnswers((current) => ({ ...current, [question.code]: option.value }))} className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.99] ${active ? "border-[#10243E] bg-[#F5F8FC] shadow-sm" : "border-slate-200 bg-white hover:border-[#D4A900] hover:bg-[#FFFDF5]"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${active ? "bg-[#10243E] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-[#FFF0B8]"}`}>{option.value}</span>
                    <span className="min-w-0"><span className="block text-sm font-semibold text-[#10243E]">{option.label}</span><span className="mt-0.5 block text-xs text-slate-500">{option.helper}</span></span>
                    {active && <CheckCircle2 className="ml-auto shrink-0 text-[#D4A900]" size={19} />}
                  </button>;
                })}
              </div>
            </div>
            <div className="mt-9 flex items-center justify-between border-t border-slate-100 pt-5">
              <Button disabled={index === 0 || saving} onClick={() => setIndex((value) => value - 1)} variant="ghost" className="text-slate-600"><ChevronLeft size={16} className="mr-1" /> Back</Button>
              <Button disabled={!canAdvance || saving} onClick={advance} className="bg-[#10243E] text-white hover:bg-[#18395F]">
                {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : isLast ? <CheckCircle2 className="mr-2" size={16} /> : null}
                {isLast ? "Create my Operating Profile" : "Save and continue"} {!isLast && !saving && <ChevronRight className="ml-1" size={16} />}
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><LockKeyhole size={13} /> Answers are saved only when you continue, and remain private to you.</p>
          </section>
        ) : null}
      </main>
    </PlatformLayout>
  );
}
