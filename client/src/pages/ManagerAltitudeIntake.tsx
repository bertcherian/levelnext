import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Layers3, Sparkles, Target } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { MANAGER_ALTITUDE_QUESTIONS, type ManagerAltitudeAnswer } from "@shared/modules/managerAltitude";

const ICONS = [Compass, Target, Layers3, Sparkles];
const ALTITUDE_LABELS = {
  foundation: "Building the foundation",
  building: "Building leadership altitude",
  scaling: "Scaling your influence",
  multiplying: "Multiplying leadership",
} as const;

export default function ManagerAltitudeIntake() {
  const [, navigate] = useLocation();
  const status = trpc.managerAltitude.getStatus.useQuery();
  const complete = trpc.managerAltitude.complete.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (error) => toast.error(error.message || "We could not save your starting point. Please try again."),
  });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const question = MANAGER_ALTITUDE_QUESTIONS[step];
  const selected = answers[question.id];
  const progress = Math.round(((step + 1) / MANAGER_ALTITUDE_QUESTIONS.length) * 100);
  const Icon = ICONS[step] ?? Compass;
  const existingResult = status.data;
  const result = submitted ? complete.data : existingResult;
  const resultLabel = result && "label" in result && typeof result.label === "string" ? result.label : result?.altitude ? ALTITUDE_LABELS[result.altitude] : "Your starting point";
  const resultFocus = result?.focus ?? "";
  const resultExplanation = result?.explanation ?? "";

  const answerSummary = useMemo(() => {
    if (!result) return null;
    return result.score <= 37 ? "Start small, make it observable, and build confidence through repetition." : result.score <= 62 ? "Choose one live leadership moment and practise a different response this week." : result.score <= 81 ? "Use your influence deliberately and make ownership travel across boundaries." : "Protect strategic capacity and help other leaders multiply their impact.";
  }, [result]);

  const choose = (value: string) => setAnswers((current) => ({ ...current, [question.id]: value }));
  const next = () => {
    if (!selected) {
      toast.error("Choose the answer that feels closest before continuing.");
      return;
    }
    if (step < MANAGER_ALTITUDE_QUESTIONS.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    complete.mutate({ answers: answers as ManagerAltitudeAnswer });
  };

  if (result) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="mx-auto max-w-3xl">
          <button type="button" onClick={() => navigate("/manager")} className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#0A1A2F] underline-offset-4 hover:underline"><ArrowLeft size={14} /> Back to Manager Home</button>
          <section className="overflow-hidden rounded-3xl border border-[#D4AF37]/70 bg-white shadow-[0_18px_60px_rgba(10,26,47,0.08)]">
            <div className="bg-[#0A1A2F] px-6 py-8 text-white sm:px-10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]"><CheckCircle2 size={24} /></div><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Starting point calibrated</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{resultLabel}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{resultExplanation}</p></div>
            <div className="space-y-5 px-6 py-7 sm:px-10"><div className="rounded-2xl border border-[#D4AF37]/40 bg-[#FFF9E8] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A47618]">Your first leverage point</p><p className="mt-2 text-base font-semibold text-[#0A1A2F]">{resultFocus}</p><p className="mt-2 text-sm leading-6 text-slate-600">{answerSummary}</p></div><p className="text-sm leading-6 text-slate-500">This is a development starting point, not a diagnostic score. LevelNext will use it to make your early practice and coaching recommendations more relevant. You can recalibrate it later as your role changes.</p><Button onClick={() => navigate("/manager")} className="h-11 rounded-xl bg-[#0A1A2F] px-5 text-sm font-semibold text-white hover:bg-[#122B49]">Continue to Manager Home <ArrowRight size={16} className="ml-2" /></Button></div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate("/manager")} className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#0A1A2F] underline-offset-4 hover:underline"><ArrowLeft size={14} /> Back to Manager Home</button>
        <header className="mb-7"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A47618]">60-second starting point</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0A1A2F] sm:text-4xl">Where are you starting from as a manager?</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Four quick questions help LevelNext calibrate your first development move before you take a diagnostic. There are no right answers.</p></header>
        <div className="mb-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${progress}%` }} /></div><span className="text-xs font-semibold text-slate-500">{step + 1} of {MANAGER_ALTITUDE_QUESTIONS.length}</span></div>
        <section className="rounded-3xl border border-[#D4AF37]/60 bg-white p-5 shadow-[0_18px_60px_rgba(10,26,47,0.08)] sm:p-8"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A1A2F] text-[#D4AF37]"><Icon size={21} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A47618]">Question {step + 1}</p><h2 className="mt-1 text-xl font-semibold text-[#0A1A2F]">{question.title}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{question.prompt}</p></div></div><div className="mt-7 space-y-3">{question.options.map((option) => { const active = selected === option.value; return <button type="button" key={option.value} onClick={() => choose(option.value)} aria-pressed={active} className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-150 ${active ? "border-[#D4AF37] bg-[#FFF9E8] shadow-sm" : "border-slate-200 bg-white hover:border-[#D4AF37]/60 hover:bg-[#FFFCF2]"}`}><span className="text-sm font-semibold text-[#0A1A2F]">{option.label}</span><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#D4AF37] bg-[#D4AF37]" : "border-slate-300"}`}>{active && <span className="h-2 w-2 rounded-full bg-[#0A1A2F]" />}</span></button>; })}</div><div className="mt-8 flex items-center justify-between gap-3"><p className="text-xs text-slate-400">Private to you · used to calibrate your starting point</p><Button onClick={next} disabled={complete.isPending} className="h-11 rounded-xl bg-[#0A1A2F] px-5 text-sm font-semibold text-white hover:bg-[#122B49]">{complete.isPending ? "Calibrating…" : step === MANAGER_ALTITUDE_QUESTIONS.length - 1 ? "See my starting point" : "Next question"}<ArrowRight size={16} className="ml-2" /></Button></div></section>
      </div>
    </main>
  );
}
