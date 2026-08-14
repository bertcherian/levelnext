import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Send, Loader2, CheckCircle2, ChevronRight, RotateCcw, Mic, MicOff, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

type View = "scenarios" | "chat" | "debrief";

export default function ManagerPractice() {
  const [view, setView] = useState<View>("scenarios");
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [debrief, setDebrief] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [voiceError, setVoiceError] = useState<"unsupported" | "permission" | null>(null);
  const [waveBars, setWaveBars] = useState<number[]>([3, 3, 3, 3, 3]);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: scenarios } = trpc.mep.getPracticeScenarios.useQuery();
  const { data: pastSessions } = trpc.mep.listPracticeSessions.useQuery();

  const startSession = trpc.mep.startPracticeSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.id);
      setMessages([{ role: "assistant", content: data.opening }]);
      setView("chat");
    },
    onError: () => toast.error("Could not start practice session."),
  });

  const sendMessage = trpc.mep.sendPracticeMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setSending(false);
    },
    onError: () => {
      toast.error("Could not send message.");
      setSending(false);
    },
  });

  const endSession = trpc.mep.endPracticeSession.useMutation({
    onSuccess: (data) => {
      setDebrief(data.debrief ?? data);
      setView("debrief");
    },
    onError: () => toast.error("Could not end session."),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Waveform animation ────────────────────────────────────────────────────
  const startWave = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const bars = Array.from({ length: 5 }, (_, i) => {
          const idx = Math.floor((i / 5) * (data.length / 2));
          return Math.max(3, Math.round((data[idx] / 255) * 24));
        });
        setWaveBars(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // getUserMedia denied — fall back to CSS pulse only
    }
  };

  const stopWave = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setWaveBars([3, 3, 3, 3, 3]);
  };

  // ── Voice recognition (click-to-toggle) ──────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText("");
    stopWave();
  }, []);

  const startListening = useCallback(() => {
    if (isListening) { stopListening(); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("unsupported");
      return;
    }
    // Request mic permission first so we can surface a clear error
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(() => {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";
        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else interim += event.results[i][0].transcript;
          }
          setInterimText(interim);
          if (final) { setInput(prev => (prev + " " + final).trim()); setInterimText(""); }
        };
        recognition.onerror = (e: any) => {
          if (e.error === "not-allowed") setVoiceError("permission");
          setIsListening(false); setInterimText(""); stopWave();
        };
        recognition.onend = () => { setIsListening(false); setInterimText(""); stopWave(); };
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        startWave();
      })
      .catch(() => { setVoiceError("permission"); });
  }, [isListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => () => { recognitionRef.current?.stop(); stopWave(); }, []);

  const handleStart = (scenario: any) => {
    setActiveScenario(scenario);
    setMessages([]);
    setSessionId(null);
    startSession.mutate({
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      counterpartPersonality: "realistic",
    });
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || !sessionId) return;
    if (isListening) stopListening();
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    sendMessage.mutate({ sessionId, message: msg });
  };

  const handleEnd = () => {
    if (!sessionId) return;
    if (isListening) stopListening();
    endSession.mutate({ sessionId });
  };

  // ── Scenarios view ────────────────────────────────────────────────────────
  if (view === "scenarios") {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>AI Practice Partner</h1>
            <p className="text-sm mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
              Role-play difficult management conversations before they happen. Get real-time feedback and a debrief.
            </p>
          </div>

          {/* Voice Practice Simulator Banner */}
          <a
            href="/manager/simulate"
            className="flex items-center justify-between rounded-xl px-4 py-3 border cursor-pointer group"
            style={{ background: 'linear-gradient(135deg, #0A1A2F 0%, #1a2f4f 100%)', borderColor: '#D4AF3740', textDecoration: 'none', display: 'flex' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#D4AF3720' }}>
                <Mic size={16} style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">NEW — Voice Practice Simulator</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Describe your challenge. AI builds a live scenario. Practice with voice.</p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </a>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios?.map((s: any) => (
              <div
                key={s.id}
                className="rounded-2xl p-5 border"
                style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(from #fb923c l c h / 0.1)", border: "1px solid oklch(from #fb923c l c h / 0.2)" }}
                  >
                    <Zap size={16} style={{ color: "#fb923c" }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#fb923c" }}>
                      {s.difficulty ?? "Intermediate"}
                    </span>
                    <h3 className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-ln-navy)" }}>{s.label}</h3>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(45% 0.02 248.6)" }}>
                  {s.description}
                </p>
                <Button
                  size="sm"
                  className="w-full text-xs font-semibold"
                  style={{ background: "#fb923c", color: "white" }}
                  onClick={() => handleStart(s)}
                  disabled={startSession.isPending}
                >
                  {startSession.isPending && activeScenario?.id === s.id
                    ? <><Loader2 size={12} className="mr-1.5 animate-spin" /> Starting…</>
                    : <>Start Practice <ChevronRight size={12} className="ml-1" /></>}
                </Button>
              </div>
            ))}
          </div>

          {pastSessions && pastSessions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>
                Past Sessions ({pastSessions.length})
              </h2>
              <div className="space-y-2">
                {pastSessions.slice(0, 5).map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
                  >
                    <CheckCircle2 size={14} style={{ color: "#34d399" }} className="flex-shrink-0" />
                    <p className="text-xs flex-1" style={{ color: "var(--color-ln-navy)" }}>{s.scenario}</p>
                    <p className="text-[10px]" style={{ color: "oklch(60% 0.02 248.6)" }}>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Chat view ─────────────────────────────────────────────────────────────
  if (view === "chat") {
    const displayValue = isListening && interimText
      ? (input ? input + " " + interimText : interimText)
      : input;

    return (
      <div className="flex h-screen flex-col" style={{ background: "var(--color-ln-ivory)" }}>
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#fb923c" }}>
              Practice Session
            </p>
            <h1 className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>
              {activeScenario?.label}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
              {activeScenario?.userRoleLabel ?? "You are the manager"} · AI plays: {activeScenario?.rolePlayAs ?? "Team Member"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={handleEnd}
            disabled={endSession.isPending}
          >
            {endSession.isPending ? <Loader2 size={12} className="mr-1 animate-spin" /> : null}
            End & Get Feedback
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm")}
                style={msg.role === "user"
                  ? { background: "var(--color-ln-navy)", color: "white" }
                  : { background: "white", color: "oklch(25% 0.02 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                {msg.role === "assistant" && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#fb923c" }}>
                    {activeScenario?.rolePlayAs ?? "Team Member"}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
                <Loader2 size={14} className="animate-spin" style={{ color: "#fb923c" }} />
                <span className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Responding…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Voice error banner */}
        {voiceError && (
          <div className="px-4 pt-3 max-w-3xl mx-auto">
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#fef3c7", border: "1px solid #fcd34d" }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#d97706" }} />
              <div className="flex-1">
                {voiceError === "unsupported" ? (
                  <>
                    <p className="font-semibold" style={{ color: "#92400e" }}>Browser not supported</p>
                    <p className="text-xs mt-0.5" style={{ color: "#78350f" }}>Voice input requires Chrome or Edge. Please switch browsers, or type your response instead.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold" style={{ color: "#92400e" }}>Microphone access denied</p>
                    <p className="text-xs mt-0.5" style={{ color: "#78350f" }}>To enable voice: click the 🔒 lock icon in your browser's address bar → Site settings → Allow Microphone. Then refresh and try again. You can still type your response below.</p>
                  </>
                )}
              </div>
              <button onClick={() => setVoiceError(null)} className="flex-shrink-0 p-0.5 rounded hover:bg-amber-200 transition-colors">
                <X size={14} style={{ color: "#92400e" }} />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t flex-shrink-0" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex gap-2 max-w-3xl mx-auto items-end">
            {/* Voice toggle button with pulse rings + wave bars */}
            <div className="relative flex-shrink-0 flex flex-col items-center">
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ background: "#fb923c" }} />
                  <span className="absolute inset-[-4px] rounded-full animate-ping opacity-15" style={{ background: "#fb923c", animationDelay: "150ms" }} />
                </>
              )}
              <button
                onClick={startListening}
                disabled={sending}
                className="relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150"
                style={{
                  background: isListening ? "#fb923c" : "oklch(93% 0.01 248.6)",
                  color: isListening ? "white" : "oklch(45% 0.02 248.6)",
                  boxShadow: isListening ? "0 0 0 3px #fb923c30" : "none",
                  transform: isListening ? "scale(1.08)" : "scale(1)",
                }}
                title={isListening ? "Click to stop listening" : "Click to speak"}
              >
                {isListening ? <Mic size={16} /> : <MicOff size={16} className="opacity-60" />}
              </button>
              {isListening && (
                <div className="flex items-end gap-[2px] mt-1 h-5">
                  {waveBars.map((h, i) => (
                    <div key={i} className="rounded-full transition-all duration-75"
                      style={{ width: "3px", height: `${h}px`, background: "#fb923c", opacity: 0.85 }} />
                  ))}
                </div>
              )}
            </div>

            <Textarea
              value={displayValue}
              onChange={(e) => { if (!isListening) setInput(e.target.value); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isListening ? "Listening… speak now" : "Respond as yourself, the manager… or click mic to speak"}
              className="flex-1 resize-none text-sm min-h-[44px] max-h-32"
              rows={1}
              disabled={sending}
              readOnly={isListening}
              style={isListening ? { borderColor: "#fb923c", outline: "none", boxShadow: "0 0 0 2px #fb923c20" } : {}}
            />

            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 h-11 w-11"
              style={{ background: "#fb923c", color: "white" }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <p className="text-[11px] mt-1.5 max-w-3xl mx-auto" style={{ color: isListening ? "#fb923c" : "oklch(65% 0.02 248.6)" }}>
            {isListening ? "🔴 Listening — click mic again to stop · Enter to send" : "Click mic to speak · Enter to send · Shift+Enter for new line"}
          </p>
        </div>
      </div>
    );
  }

  // ── Debrief view ──────────────────────────────────────────────────────────
  if (view === "debrief" && debrief) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div
            className="rounded-2xl px-6 py-6 text-center"
            style={{ background: "var(--color-ln-navy)" }}
          >
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "#fb923c" }} />
            <h1 className="text-lg font-bold text-white mb-1">Practice Session Complete</h1>
            <p className="text-sm" style={{ color: "oklch(70% 0.02 248.6)" }}>{activeScenario?.label}</p>
            {debrief.overallScore && (
              <div className="mt-4">
                <p className="text-3xl font-bold" style={{ color: "#fb923c" }}>{debrief.overallScore}<span className="text-base font-normal text-white/50">/100</span></p>
                <p className="text-xs mt-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Overall Performance</p>
              </div>
            )}
          </div>

          {debrief.summary && (
            <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#fb923c" }}>Summary</h2>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{debrief.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debrief.strengths && debrief.strengths.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(from #34d399 l c h / 0.06)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#34d399" }}>What Worked</h3>
                <ul className="space-y-1.5">
                  {debrief.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: "oklch(30% 0.02 248.6)" }}>
                      <span style={{ color: "#34d399" }}>✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {debrief.improvements && debrief.improvements.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "oklch(from #f59e0b l c h / 0.06)", border: "1px solid oklch(from #f59e0b l c h / 0.2)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f59e0b" }}>To Improve</h3>
                <ul className="space-y-1.5">
                  {debrief.improvements.map((s: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: "oklch(30% 0.02 248.6)" }}>
                      <span style={{ color: "#f59e0b" }}>→</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {debrief.keyTakeaway && (
            <div className="rounded-2xl px-5 py-4" style={{ background: "oklch(from #fb923c l c h / 0.06)", border: "1px solid oklch(from #fb923c l c h / 0.2)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#fb923c" }}>Key Takeaway</p>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(30% 0.02 248.6)" }}>{debrief.keyTakeaway}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 font-semibold"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
              onClick={() => { setView("scenarios"); setDebrief(null); setActiveScenario(null); }}
            >
              <RotateCcw size={14} className="mr-2" /> Practice Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
