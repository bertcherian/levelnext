import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BrainCircuit, CheckCircle2, CircleHelp, Compass, Gauge, History, MessageSquareText, Mic2, Sparkles, Target, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { V3_INTENT_MODES, type V3IntentMode, type V3RouteTarget } from "@shared/modules/v3SituationRouting";

const INTENTS: Array<{ value: V3IntentMode; label: string; description: string; icon: typeof MessageSquareText }> = [
  { value: "talk_it_through", label: "Talk it through", description: "Make sense of what is happening", icon: MessageSquareText },
  { value: "perspective", label: "Give me perspective", description: "See the moment differently", icon: Compass },
  { value: "decide", label: "Help me decide", description: "Choose the next useful move", icon: Target },
  { value: "prepare", label: "Help me prepare", description: "Get ready for a real conversation", icon: Mic2 },
  { value: "practice", label: "Let me practise", description: "Rehearse before it matters", icon: Zap },
  { value: "challenge", label: "Challenge my thinking", description: "Test the assumptions in play", icon: BrainCircuit },
  { value: "teach", label: "Teach me the pattern", description: "Build the capability behind it", icon: Gauge },
  { value: "listen", label: "Just listen", description: "Start without prescribing", icon: CircleHelp },
];

const EXAMPLES = [
  "I need to give a strong performer feedback without making them defensive.",
  "My team keeps bringing decisions back to me after I delegate them.",
  "I have to push back on a senior stakeholder who keeps changing the priority.",
  "Everything feels urgent and I cannot protect time for strategic work.",
];

const ROUTE_META: Record<V3RouteTarget, { label: string; description: string; icon: typeof MessageSquareText; accent: string }> = {
  coach: { label: "Start with Coach", description: "Make the situation clearer and choose a grounded next move.", icon: MessageSquareText, accent: "#0F9F7A" },
  practice_partner: { label: "Open Practice Partner", description: "Build a tailored rehearsal around the situation you described.", icon: Zap, accent: "#A47618" },
  simulator: { label: "Open Voice Simulator", description: "Rehearse the conversation with a realistic stakeholder before you enter it.", icon: Mic2, accent: "#A47618" },
  diagnostic: { label: "Explore the pattern", description: "Use a short diagnostic to understand the capability behind this moment.", icon: Gauge, accent: "#0F9F7A" },
  clarify: { label: "Clarify the moment", description: "One more detail will help LevelNext avoid prescribing the wrong tool.", icon: CircleHelp, accent: "#A47618" },
};

function routeHref(route: V3RouteTarget, situation: string, label: string): string {
  const encodedSituation = encodeURIComponent(situation);
  const encodedLabel = encodeURIComponent(label);
  if (route === "practice_partner") return `/practice?screen=scenario-setup&playbook_issue=${encodedSituation}`;
  if (route === "simulator") return `/manager/simulate?sample=voice-simulator&ei_behavior=${encodedLabel}&ei_move=${encodeURIComponent("name the observable facts, ask one clarifying question, and agree the next action")}&ei_goal=${encodeURIComponent("the stakeholder understands the outcome and the next action is explicit")}`;
  if (route === "diagnostic") return "/manager/diagnostics";
  return "/manager/coach";
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string };
};

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: BrowserSpeechRecognitionResult;
  };
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export default function V3Today() {
  const [, navigate] = useLocation();
  const [situation, setSituation] = useState("");
  const [intent, setIntent] = useState<V3IntentMode>("talk_it_through");
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceFinalTextRef = useRef("");
  const [result, setResult] = useState<ReturnType<typeof trpc.v3Situation.capture.useMutation>["data"]>(undefined);
  const recent = trpc.v3Situation.listRecent.useQuery(undefined, { retry: 1 });
  const capture = trpc.v3Situation.capture.useMutation({
    onSuccess: (data) => {
      setResult(data);
      void recent.refetch();
    },
    onError: (error) => toast.error(error.message || "We could not capture that situation. Please try again."),
  });

  const selectedIntent = useMemo(() => INTENTS.find((item) => item.value === intent) ?? INTENTS[0], [intent]);
  const route = result ? ROUTE_META[result.route] : null;
  const RouteIcon = route?.icon ?? Sparkles;

  useEffect(() => {
    setVoiceSupported(Boolean(getSpeechRecognitionConstructor()));
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  const stopVoiceCapture = () => {
    recognitionRef.current?.stop();
  };

  const startVoiceCapture = () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceStatus("Voice input is not available in this browser. You can still type your situation.");
      return;
    }
    if (isListening) {
      stopVoiceCapture();
      return;
    }

    const recognition = new SpeechRecognition();
    voiceFinalTextRef.current = situation.trim();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-IN";
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus("Listening… speak naturally, then tap the microphone again to finish.");
    };
    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = voiceFinalTextRef.current;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index]?.[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;
        if (event.results[index].isFinal) {
          finalText = `${finalText} ${transcript}`.trim();
        } else {
          interimText = `${interimText} ${transcript}`.trim();
        }
      }
      voiceFinalTextRef.current = finalText;
      setSituation(`${finalText} ${interimText}`.trim());
      setResult(undefined);
    };
    recognition.onerror = (event) => {
      const error = event.error;
      const message = error === "not-allowed" || error === "service-not-allowed"
        ? "Microphone access was blocked. Allow microphone access in your browser settings, then try again."
        : error === "no-speech"
          ? "No speech was detected. Try again when you are ready."
          : "Voice input is unavailable right now. You can continue by typing your situation.";
      setVoiceStatus(message);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setSituation(voiceFinalTextRef.current);
      setVoiceStatus(voiceFinalTextRef.current ? "Voice note added. Edit the text if you want, then find your next move." : null);
    };
    recognitionRef.current = recognition;
    setVoiceStatus("Starting microphone…");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus("Your microphone could not start. Please try again or type your situation.");
    }
  };

  const handleSubmit = () => {
    const trimmed = situation.trim();
    if (trimmed.length < 12) {
      toast.error("Add a little more context about the moment you need to handle.");
      return;
    }
    capture.mutate({ situation: trimmed, intent });
  };

  const openNextStep = () => {
    if (!result) return;
    if (result.route === "clarify") {
      navigate("/manager/coach");
      return;
    }
    navigate(routeHref(result.route, result.situation, result.situationLabel));
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10 lg:py-9" style={{ background: "var(--color-ln-ivory)" }}>
      <style>{`@keyframes v3VoiceWave { 0%, 100% { transform: scaleY(.35); opacity: .55; } 50% { transform: scaleY(1); opacity: 1; } } @media (prefers-reduced-motion: reduce) { .v3-voice-wave-bar { animation: none !important; transform: scaleY(.7); opacity: .8; } }`}</style>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A47618]">V3 · Situation intelligence</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#0A1A2F] sm:text-4xl">What are you dealing with today?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Start with the real moment. LevelNext will help you understand it, choose the smallest useful intervention, and move toward a better response.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Sparkles size={15} className="text-[#A47618]" /> Private to you · no diagnostic gate</div>
        </header>

        <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
          <section className="rounded-3xl border border-[#D4AF37]/60 bg-white p-5 shadow-[0_18px_60px_rgba(10,26,47,0.08)] sm:p-7" aria-labelledby="situation-heading">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0A1A2F] text-[#D4AF37]"><MessageSquareText size={19} /></div>
              <div>
                <h2 id="situation-heading" className="text-lg font-semibold text-[#0A1A2F]">Bring a live workplace situation</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">A few honest sentences are enough. You can refine the details with Coach later.</p>
              </div>
            </div>

            <div className="relative mt-6">
              <Textarea value={situation} onChange={(event) => { setSituation(event.target.value); setResult(undefined); setVoiceStatus(null); }} placeholder="For example: I need to challenge a senior stakeholder who keeps changing the priority, but I do not want the relationship to become political." className="min-h-36 resize-y border-slate-200 bg-[#FFFEFA] pb-14 pr-14 text-sm leading-6 text-[#0A1A2F] shadow-none focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20" aria-label="Describe your workplace situation" />
              <button type="button" onClick={startVoiceCapture} disabled={voiceSupported === false} aria-label={isListening ? "Stop voice input" : "Use voice input"} aria-pressed={isListening} className={`absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 ${isListening ? "border-red-300 bg-red-50 text-red-600 shadow-sm" : voiceSupported === false ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300" : "border-[#D4AF37]/70 bg-[#FFF9E8] text-[#A47618] hover:border-[#D4AF37] hover:bg-[#FFF4C7]"}`}>
                <Mic2 size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 flex min-h-5 items-start justify-between gap-3 text-xs" aria-live="polite">
              <p className={isListening ? "font-semibold text-red-600" : "text-slate-500"}>{voiceStatus ?? (voiceSupported === false ? "Voice input is not available in this browser. You can still type." : "Speak your situation with the microphone, or type it below.")}</p>
              {isListening && <button type="button" onClick={stopVoiceCapture} className="shrink-0 font-semibold text-[#0A1A2F] underline underline-offset-2">Finish voice note</button>}
            </div>
            {isListening && <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#D4AF37]/40 bg-[#FFF9E8] px-3 py-2.5" role="status" aria-label="Audio waveform: microphone is listening"><div className="flex h-6 items-center gap-1" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((bar) => <span key={bar} className="v3-voice-wave-bar block w-1 rounded-full bg-[#D4AF37]" style={{ height: `${10 + ((bar * 7) % 13)}px`, animation: `v3VoiceWave ${620 + (bar % 4) * 90}ms ease-in-out ${bar * 70}ms infinite` }} />)}</div><span className="text-xs font-semibold text-[#A47618]">Live audio · speak naturally</span></div>}

            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A47618]">What would help most?</p><span className="text-xs text-slate-400">Optional direction</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {INTENTS.map((item) => {
                  const Icon = item.icon;
                  const active = item.value === intent;
                  return <button key={item.value} type="button" onClick={() => setIntent(item.value)} className={`flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-150 ${active ? "border-[#D4AF37] bg-[#FFF9E8] shadow-sm" : "border-slate-200 bg-white hover:border-[#D4AF37]/60 hover:bg-[#FFFCF2]"}`} aria-pressed={active}>
                    <Icon size={17} className={active ? "mt-0.5 shrink-0 text-[#A47618]" : "mt-0.5 shrink-0 text-slate-400"} />
                    <span className="min-w-0"><span className="block text-sm font-semibold text-[#0A1A2F]">{item.label}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{item.description}</span></span>
                  </button>;
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Selected: <span className="font-semibold text-[#0A1A2F]">{selectedIntent.label}</span></p><Button onClick={handleSubmit} disabled={capture.isPending} className="h-11 rounded-xl bg-[#0A1A2F] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#122B49]">{capture.isPending ? "Finding the right next step…" : "Find my next move"}<ArrowRight size={16} className="ml-2" /></Button></div>

            {!result && <div className="mt-7 border-t border-slate-100 pt-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Try one of these</p><div className="mt-3 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} type="button" onClick={() => setSituation(example)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-4 text-slate-600 transition-colors hover:border-[#D4AF37] hover:text-[#0A1A2F]">{example}</button>)}</div></div>}
          </section>

          <aside className="space-y-5">
            {result ? <section className="rounded-3xl border border-[#D4AF37] bg-[#0A1A2F] p-5 text-white shadow-[0_18px_60px_rgba(10,26,47,0.16)] sm:p-6" aria-live="polite">
              <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${route?.accent ?? "#D4AF37"}24`, color: route?.accent ?? "#D4AF37" }}><RouteIcon size={19} /></div><span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">Decision recorded</span></div>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{result.situationLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{route?.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{route?.description}</p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xs font-semibold text-white">Why this route</p><p className="mt-1 text-xs leading-5 text-slate-300">{result.rationale}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400"><span className="rounded-full bg-white/10 px-2 py-1">{Math.round(result.confidence * 100)}% confidence</span><span className="rounded-full bg-white/10 px-2 py-1">{result.decisionMethod}</span></div></div>
              {result.clarificationPrompt && <div className="mt-4 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4 text-xs leading-5 text-[#FFF6D5]"><span className="font-semibold">One useful question:</span> {result.clarificationPrompt}</div>}
              <Button onClick={openNextStep} className="mt-5 h-11 w-full rounded-xl bg-[#D4AF37] font-semibold text-[#0A1A2F] hover:bg-[#E7CA72]">{result.route === "clarify" ? "Continue with Coach" : `Open ${route?.label.replace("Start with ", "")}`}<ArrowRight size={16} className="ml-2" /></Button>
              <p className="mt-3 text-center text-[10px] text-slate-500">Trace {result.traceId.slice(0, 8)} · private decision record</p>
            </section> : <section className="rounded-3xl border border-slate-200 bg-[#F8F5F0] p-5 sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37]/20 text-[#A47618]"><Sparkles size={19} /></div><h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#0A1A2F]">The platform should meet the moment, not make you hunt for a module.</h2><p className="mt-3 text-sm leading-6 text-slate-600">This is the first V3 path: connect the situation to the smallest useful next move while keeping your context private.</p><div className="mt-5 space-y-3 text-xs text-slate-600"><p className="flex gap-2"><CheckCircle2 size={15} className="shrink-0 text-[#0F9F7A]" /> No diagnostic required to begin.</p><p className="flex gap-2"><CheckCircle2 size={15} className="shrink-0 text-[#0F9F7A]" /> The decision is explainable and correctable.</p><p className="flex gap-2"><CheckCircle2 size={15} className="shrink-0 text-[#0F9F7A]" /> Practice and real-world action remain connected.</p></div></section>}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><History size={16} className="text-[#A47618]" /><h2 className="text-sm font-semibold text-[#0A1A2F]">Recent situations</h2></div><span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Private</span></div>{recent.isLoading ? <p className="mt-4 text-xs text-slate-400">Loading your recent moments…</p> : recent.isError ? <p className="mt-4 text-xs leading-5 text-slate-500">Recent history is temporarily unavailable. You can still capture a new situation.</p> : recent.data?.length ? <div className="mt-4 space-y-3">{recent.data.slice(0, 4).map(({ intake, decision }) => <button key={intake.id} type="button" onClick={() => { setSituation(intake.situation); setIntent(intake.intent as V3IntentMode); setResult(undefined); }} className="block w-full rounded-2xl border border-slate-100 bg-[#FFFEFA] p-3 text-left transition-colors hover:border-[#D4AF37]/70"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A47618]">{intake.situationLabel}</span><span className="text-[10px] text-slate-400">{formatDate(intake.createdAt)}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{intake.situation}</p><p className="mt-2 text-[10px] font-semibold text-[#0F9F7A]">{decision ? ROUTE_META[decision.route].label : "Open situation"}</p></button>)}</div> : <p className="mt-4 text-xs leading-5 text-slate-500">Your captured situations will appear here so you can return to the moments that matter.</p>}</section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export { V3_INTENT_MODES };
