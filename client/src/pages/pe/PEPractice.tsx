import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Send, Zap, Plus, Star, CheckCircle2, AlertCircle, Loader2, ArrowRight, Mic, MicOff, Volume2, VolumeX, Square } from "lucide-react";
import { toast } from "sonner";

interface PracticeMessage {
  role: "user" | "counterpart";
  content: string;
  timestamp?: string;
}

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

const PERSONALITIES = [
  { id: "realistic", label: "Realistic", description: "A typical professional" },
  { id: "resistant", label: "Resistant", description: "Defensive, pushes back" },
  { id: "emotional", label: "Emotional", description: "Gets upset easily" },
  { id: "passive", label: "Passive", description: "Disengaged, minimal responses" },
  { id: "aggressive", label: "Aggressive", description: "Challenges everything" },
];

const VOICE_OPTIONS = [
  { id: "nova", label: "Nova (OpenAI)", provider: "openai" },
  { id: "shimmer", label: "Shimmer (OpenAI)", provider: "openai" },
  { id: "alloy", label: "Alloy (OpenAI)", provider: "openai" },
  { id: "shubh", label: "Shubh (Sarvam)", provider: "sarvam" },
  { id: "sumit", label: "Sumit (Sarvam)", provider: "sarvam" },
  { id: "simran", label: "Simran (Sarvam)", provider: "sarvam" },
];

const NUM_BARS = 7;

export default function PEPractice() {
  const [view, setView] = useState<"scenarios" | "session" | "feedback">("scenarios");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [personality, setPersonality] = useState("realistic");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [voiceError, setVoiceError] = useState<"unsupported" | "permission" | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(NUM_BARS).fill(3));
  const [selectedVoice, setSelectedVoice] = useState<string>("nova");

  // Refs
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const scenarios = trpc.pei.getPracticeScenarios.useQuery();
  const startSession = trpc.pei.startPracticeSession.useMutation();
  const sendMessage = trpc.pei.sendPracticeMessage.useMutation();
  const endSession = trpc.pei.endPracticeSession.useMutation();
  const pastSessions = trpc.pei.listPracticeSessions.useQuery();
  const ttsMutation = trpc.pei.tts.useMutation({
    onSuccess: (data) => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      currentAudioRef.current = audio;
      setIsSpeaking(true);
      audio.play();
      audio.onended = () => setIsSpeaking(false);
    },
    onError: () => {
      setIsSpeaking(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  // ── Waveform animation ──────────────────────────────────────────────────────
  const startWaveform = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: NUM_BARS }, (_, i) => {
          const idx = Math.floor((i / NUM_BARS) * (dataArray.length / 2));
          const raw = dataArray[idx] / 255;
          return Math.max(3, Math.round(raw * 28));
        });
        setWaveformBars(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch { /* fallback to CSS pulse */ }
  };

  const stopWaveform = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setWaveformBars(Array(NUM_BARS).fill(3));
  };

  // ── Speech recognition ──────────────────────────────────────────────────────
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceError("unsupported"); return; }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setVoiceError("permission"); return; }
    await startWaveform();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      let interim = ""; let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInterimText(interim);
      if (final) { setInput(prev => (prev + " " + final).trim()); setInterimText(""); }
    };
    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") setVoiceError("permission");
      setIsListening(false); setInterimText(""); stopWaveform();
    };
    recognition.onend = () => { setIsListening(false); setInterimText(""); stopWaveform(); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
    stopWaveform();
  };

  // ── TTS playback ────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!ttsEnabled) return;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
    ttsMutation.mutate({ text, voice: selectedVoice as any });
  }, [ttsEnabled, selectedVoice, ttsMutation]);

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
  };

  // Cleanup
  useEffect(() => () => { stopWaveform(); stopSpeaking(); }, []);

  const handleStart = async () => {
    if (!selectedScenario) return;
    setStarting(true);
    try {
      const result = await startSession.mutateAsync({
        scenarioId: selectedScenario,
        scenarioLabel: selectedLabel,
        counterpartPersonality: personality,
      });
      setSessionId(result.id);
      setMessages([{ role: "counterpart", content: result.opening }]);
      setView("session");
      if (ttsEnabled) setTimeout(() => speak(result.opening), 300);
    } catch { toast.error("Failed to start practice session"); }
    finally { setStarting(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || sending) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setSending(true);
    try {
      const result = await sendMessage.mutateAsync({ sessionId, message: userMessage });
      setMessages((prev) => [...prev, { role: "counterpart", content: result.reply }]);
      if (ttsEnabled) setTimeout(() => speak(result.reply), 200);
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    stopSpeaking();
    if (isListening) stopListening();
    setEnding(true);
    try {
      const result = await endSession.mutateAsync({ sessionId });
      setFeedback(result);
      setView("feedback");
    } catch { toast.error("Failed to end session"); }
    finally { setEnding(false); }
  };

  const handleReset = () => {
    stopSpeaking();
    setSessionId(null); setMessages([]); setFeedback(null);
    setSelectedScenario(""); setSelectedLabel(""); setView("scenarios");
  };

  // ─── SCENARIO SELECTION ────────────────────────────────────────────────────
  if (view === "scenarios") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>AI Practice Partner</h1>
          <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Role-play high-stakes professional conversations with an AI counterpart. Voice-enabled for realistic practice.
          </p>
        </div>

        {/* Voice settings */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Voice Settings</h3>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: ttsEnabled ? "oklch(from #22c55e l c h / 0.12)" : "oklch(96% 0.02 248.6)",
                color: ttsEnabled ? "#22c55e" : "oklch(55% 0.02 248.6)",
              }}
            >
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {ttsEnabled ? "Voice On" : "Voice Off"}
            </button>
          </div>
          {ttsEnabled && (
            <div className="flex flex-wrap gap-2">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    background: selectedVoice === v.id ? "var(--color-ln-navy)" : "oklch(96% 0.02 248.6)",
                    color: selectedVoice === v.id ? "#d4af37" : "oklch(40% 0.02 248.6)",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: "oklch(55% 0.02 248.6)" }}>
            Voice input uses your browser's speech recognition. Voice output uses {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.provider === "sarvam" ? "Sarvam AI" : "OpenAI"} TTS.
          </p>
        </div>

        {/* Personality selector */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ln-navy)" }}>Counterpart Personality</h3>
          <div className="flex flex-wrap gap-2">
            {PERSONALITIES.map((p) => (
              <button key={p.id} onClick={() => setPersonality(p.id)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: personality === p.id ? "var(--color-ln-navy)" : "oklch(96% 0.02 248.6)",
                  color: personality === p.id ? "#d4af37" : "oklch(40% 0.02 248.6)",
                }}>{p.label}</button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "oklch(55% 0.02 248.6)" }}>{PERSONALITIES.find((p) => p.id === personality)?.description}</p>
        </div>

        {/* Scenario grid */}
        <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ln-navy)" }}>Choose a Scenario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenarios.data?.map((s) => (
            <button key={s.id} onClick={() => { setSelectedScenario(s.id); setSelectedLabel(s.label); }}
              className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-150 hover:scale-[1.01]"
              style={{
                background: selectedScenario === s.id ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "white",
                border: selectedScenario === s.id ? "2px solid var(--color-ln-navy)" : "1px solid oklch(90% 0.02 248.6)",
              }}>
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>{s.description}</p>
              </div>
            </button>
          ))}
        </div>

        {selectedScenario && (
          <div className="mt-6 text-center">
            <Button onClick={handleStart} disabled={starting} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }} className="px-8">
              {starting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Starting...</> : <>Start Practice <ArrowRight size={16} className="ml-1" /></>}
            </Button>
          </div>
        )}

        {pastSessions.data && pastSessions.data.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ln-navy)" }}>Past Practice Sessions</h3>
            <div className="space-y-2">
              {pastSessions.data.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "white", border: "1px solid oklch(90% 0.02 248.6)" }}>
                  <Zap size={16} style={{ color: "#d4af37" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{s.scenario}</p>
                    <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      {new Date(s.createdAt).toLocaleDateString()} · {s.status}
                      {s.coachingFeedback?.overallRating && ` · Rating: ${s.coachingFeedback.overallRating}/5`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ACTIVE PRACTICE SESSION ───────────────────────────────────────────────
  if (view === "session") {
    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b" style={{ borderColor: "oklch(90% 0.02 248.6)", background: "white" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "oklch(from #d4af37 l c h / 0.12)" }}>
              <Zap size={16} style={{ color: "#d4af37" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{selectedLabel}</p>
              <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Practice Session · {PERSONALITIES.find((p) => p.id === personality)?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* TTS toggle */}
            <button onClick={() => { if (ttsEnabled) stopSpeaking(); setTtsEnabled(!ttsEnabled); }}
              className="p-2 rounded-lg transition-colors duration-150"
              style={{ color: ttsEnabled ? "#d4af37" : "oklch(65% 0.02 248.6)", background: ttsEnabled ? "oklch(from #d4af37 l c h / 0.08)" : "transparent" }}
              title={ttsEnabled ? "Mute counterpart voice" : "Unmute counterpart voice"}
            >
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            {/* Stop speaking */}
            {isSpeaking && (
              <button onClick={stopSpeaking} className="p-2 rounded-lg animate-pulse" style={{ color: "#d4af37" }} title="Stop voice">
                <Square size={14} />
              </button>
            )}
            <Button variant="outline" size="sm" onClick={handleEnd} disabled={ending || messages.length < 2}>
              {ending ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
              End & Get Feedback
            </Button>
          </div>
        </div>

        {/* Voice error banner */}
        {voiceError && (
          <div className="px-4 py-2 text-xs text-center" style={{ background: "oklch(from #ef4444 l c h / 0.08)", color: "#ef4444" }}>
            {voiceError === "unsupported" ? "Voice input not supported in this browser. Use text input instead." : "Microphone permission denied. Please allow mic access for voice input."}
            <button onClick={() => setVoiceError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="flex" style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div className="max-w-[80%]">
                <p className="text-xs mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  {msg.role === "user" ? "You" : "Counterpart"}
                  {msg.role === "counterpart" && isSpeaking && i === messages.length - 1 && " 🔊"}
                </p>
                <div className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: msg.role === "user" ? "var(--color-ln-navy)" : "oklch(from #d4af37 l c h / 0.1)",
                    color: msg.role === "user" ? "white" : "var(--color-ln-navy)",
                  }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex" style={{ justifyContent: "flex-start" }}>
              <div className="rounded-2xl px-4 py-3" style={{ background: "oklch(from #d4af37 l c h / 0.1)" }}>
                <Loader2 size={16} className="animate-spin" style={{ color: "#d4af37" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 md:px-8 py-4 border-t" style={{ borderColor: "oklch(90% 0.02 248.6)", background: "white" }}>
          {/* Waveform indicator */}
          {isListening && (
            <div className="flex items-center justify-center gap-1 mb-2 h-8">
              {waveformBars.map((h, i) => (
                <div key={i} className="rounded-full transition-all duration-75" style={{ width: 3, height: h, background: "#d4af37" }} />
              ))}
            </div>
          )}
          {/* Interim text */}
          {interimText && (
            <p className="text-xs mb-2 italic" style={{ color: "oklch(55% 0.02 248.6)" }}>"{interimText}"</p>
          )}
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-150"
              style={{
                background: isListening ? "oklch(from #ef4444 l c h / 0.12)" : "oklch(from var(--color-ln-navy) l c h / 0.08)",
                color: isListening ? "#ef4444" : "var(--color-ln-navy)",
              }}
              title={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {/* Text input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isListening ? "Listening..." : "Type or speak your response..."}
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
            {/* Send button */}
            <Button onClick={handleSend} disabled={!input.trim() || sending} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }} className="flex-shrink-0">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── FEEDBACK VIEW ─────────────────────────────────────────────────────────
  if (view === "feedback" && feedback) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: "oklch(from #d4af37 l c h / 0.12)" }}>
            <Star size={28} style={{ color: "#d4af37" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Practice Feedback</h1>
          <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>{selectedLabel}</p>
        </div>

        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#d4af37" }}>Overall Rating</p>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={28}
                style={{ color: star <= (feedback.overallRating ?? 3) ? "#d4af37" : "oklch(from white 20% 0 0 / 0.2)" }}
                fill={star <= (feedback.overallRating ?? 3) ? "#d4af37" : "none"} />
            ))}
          </div>
          {feedback.headline && <p className="text-sm mt-3" style={{ color: "oklch(75% 0.02 248.6)" }}>{feedback.headline}</p>}
        </div>

        {feedback.strengths?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "#22c55e" }}>What You Did Well</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((s: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.improvements?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "#f97316" }}>Areas to Improve</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((s: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#f97316" }} />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.keyMoment && (
          <div className="rounded-2xl p-5" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Key Moment</p>
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{feedback.keyMoment}</p>
          </div>
        )}

        {feedback.coachingInsight && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#d4af37" }}>Coaching Insight</p>
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{feedback.coachingInsight}</p>
          </div>
        )}

        {feedback.nextPractice && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6366f1" }}>Next Practice Suggestion</p>
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{feedback.nextPractice}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          <Button onClick={handleReset} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
            <Plus size={14} className="mr-1" /> New Practice Session
          </Button>
          <a href="/pe"><Button variant="outline" style={{ borderColor: "var(--color-ln-navy)", color: "var(--color-ln-navy)" }}>Back to Home</Button></a>
        </div>
      </div>
    );
  }

  return null;
}
