import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Volume2, VolumeX, Square, Loader2, ChevronRight, AlertCircle, X } from "lucide-react";

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

const PLATFORM_ACCENT: Record<string, string> = {
  leadership: "#D4AF37",
  manager: "#D4AF37",
  career: "#D4AF37",
  young: "#818cf8",
};

const PLATFORM_BG: Record<string, string> = {
  leadership: "#0A1A2F",
  manager: "#0A1A2F",
  career: "#0A1A2F",
  young: "#1a1a3a",
};

const NUM_BARS = 7;

type Message = { role: "user" | "assistant"; content: string; timestamp: number };

export default function SimulatorSession() {
  const [, params] = useRoute("/simulator/:sessionId");
  const [, navigate] = useLocation();
  const sessionId = parseInt(params?.sessionId ?? "0");

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [interimText, setInterimText] = useState("");
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(NUM_BARS).fill(3));
  const [voiceError, setVoiceError] = useState<"unsupported" | "permission" | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const { data: session, isLoading } = trpc.simulator.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: false }
  );

  const ttsMutation = trpc.simulator.tts.useMutation({
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
      // Fallback to browser TTS if OpenAI fails
      setIsSpeaking(false);
    },
  });

  const sendMutation = trpc.simulator.sendMessage.useMutation({
    onSuccess: (data) => {
      const assistantMsg: Message = { role: "assistant", content: data.reply, timestamp: Date.now() };
      setLocalMessages(prev => [...prev, assistantMsg]);
      if (ttsEnabled) speak(data.reply);
    },
  });

  const endMutation = trpc.simulator.endSession.useMutation({
    onSuccess: (data) => navigate(`/simulator/${data.sessionId}/debrief`),
  });

  useEffect(() => {
    if (session?.messages && localMessages.length === 0) {
      setLocalMessages((session.messages as Message[]) ?? []);
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, interimText]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled) return;
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
    // Use the voice chosen by the user at session start, or fall back to stakeholder-based selection
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
    type VoiceId = typeof validVoices[number];
    let voice: VoiceId = "onyx";
    if (session?.voice && validVoices.includes(session.voice as VoiceId)) {
      voice = session.voice as VoiceId;
    } else {
      const stakeholder = (session?.stakeholder ?? "").toLowerCase();
      if (stakeholder.includes("vp") || stakeholder.includes("director") || stakeholder.includes("ceo") || stakeholder.includes("senior")) {
        voice = "echo";
      } else if (stakeholder.includes("hr") || stakeholder.includes("partner") || stakeholder.includes("peer")) {
        voice = "nova";
      }
    }
    ttsMutation.mutate({ text, voice });
  }, [ttsEnabled, session?.voice, session?.stakeholder, ttsMutation]);

  useEffect(() => {
    if (session && localMessages.length === 1 && localMessages[0].role === "assistant" && ttsEnabled) {
      setTimeout(() => speak(localMessages[0].content), 500);
    }
  }, [session, localMessages.length]);

  // ── Waveform animation loop ────────────────────────────────────────────────
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
        // Sample NUM_BARS evenly-spaced bins from the lower half of the spectrum
        const bars = Array.from({ length: NUM_BARS }, (_, i) => {
          const idx = Math.floor((i / NUM_BARS) * (dataArray.length / 2));
          const raw = dataArray[idx] / 255; // 0–1
          return Math.max(3, Math.round(raw * 28)); // min 3px, max 28px
        });
        setWaveformBars(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // getUserMedia failed — fall back to CSS pulse, no waveform
    }
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

  // ── Speech recognition ─────────────────────────────────────────────────────
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("unsupported");
      return;
    }
    // Request mic permission explicitly so we can surface a clear error
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceError("permission");
      return;
    }
    await startWaveform();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimText(interim);
      if (final) {
        setInputText(prev => (prev + " " + final).trim());
        setInterimText("");
      }
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

  // Cleanup on unmount
  useEffect(() => () => { stopWaveform(); }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    setLocalMessages(prev => [...prev, userMsg]);
    setInputText("");
    sendMutation.mutate({ sessionId, message: text });
  };

  const handleEnd = () => {
    setIsEnding(true);
    window.speechSynthesis?.cancel();
    endMutation.mutate({ sessionId });
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1A2F]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  const platform = session.platform as string;
  const accent = PLATFORM_ACCENT[platform] ?? "#D4AF37";
  const bg = PLATFORM_BG[platform] ?? "#0A1A2F";

  return (
    <div className="flex flex-col h-screen" style={{ background: bg }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: accent }}>
              {session.conversationType}
            </p>
            <p className="text-white/60 text-xs">
              Speaking with {session.characterName} · {session.stakeholder}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <button
                onClick={() => {
                  if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                    setIsSpeaking(false);
                  }
                }}
                className="p-2 rounded-lg animate-pulse hover:text-white transition-colors" style={{ color: accent }}
                title="Stop speaking"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            {ttsMutation.isPending && !isSpeaking && (
              <span className="p-2 text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" />
              </span>
            )}
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled && currentAudioRef.current) {
                  currentAudioRef.current.pause();
                  currentAudioRef.current = null;
                  setIsSpeaking(false);
                }
              }}
              className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors"
              title={ttsEnabled ? "Mute AI voice" : "Enable AI voice (OpenAI TTS)"}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <Button
              onClick={handleEnd}
              disabled={isEnding || endMutation.isPending}
              variant="outline"
              size="sm"
              className="border-white/20 text-white/70 hover:text-white text-xs"
            >
              {isEnding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Square className="w-3 h-3 mr-1" />}
              End & Get Debrief
            </Button>
          </div>
        </div>
      </div>

      {/* Character summary card */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5" style={{ background: accent + "08" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4 flex-wrap">
            {/* Character avatar + identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: accent, color: bg }}>
                {(session.characterName as string)?.[0] ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{session.characterName}</p>
                <p className="text-white/50 text-xs leading-tight">{session.stakeholder}</p>
              </div>
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch" style={{ background: accent + "30" }} />
            {/* Character style */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: accent + "99" }}>Character style</p>
              <p className="text-white/70 text-xs leading-snug">{session.characterStyle}</p>
            </div>
            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch" style={{ background: accent + "30" }} />
            {/* Objective + time */}
            <div className="min-w-0 max-w-xs">
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: accent + "99" }}>Your objective</p>
              <p className="text-white/70 text-xs leading-snug">{session.objective}</p>
              <p className="text-white/30 text-[10px] mt-1">⏱ ~{session.estimatedMinutes} min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {localMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-1"
                  style={{ background: accent, color: bg }}>
                  {(session.characterName as string)?.[0] ?? "A"}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "text-white rounded-br-sm" : "text-white/90 rounded-bl-sm"
                }`}
                style={{
                  background: msg.role === "user" ? accent + "25" : "rgba(255,255,255,0.07)",
                  borderLeft: msg.role === "assistant" ? `3px solid ${accent}40` : undefined,
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {interimText && (
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white/40 italic"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                {interimText}...
              </div>
            </div>
          )}

          {sendMutation.isPending && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0"
                style={{ background: accent, color: bg }}>
                {(session.characterName as string)?.[0] ?? "A"}
              </div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 text-white/40 text-sm"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">

            {/* Mic button with double pulse rings + waveform */}
            <div className="relative flex-shrink-0 flex flex-col items-center">
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: accent }} />
                  <span className="absolute inset-[-5px] rounded-full animate-ping opacity-15" style={{ background: accent, animationDelay: "200ms" }} />
                </>
              )}
              <button
                onClick={() => isListening ? stopListening() : startListening()}
                className="relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150"
                style={{
                  background: isListening ? accent : "rgba(255,255,255,0.1)",
                  color: isListening ? bg : "white",
                  transform: isListening ? "scale(1.08)" : "scale(1)",
                  boxShadow: isListening ? `0 0 0 4px ${accent}30` : "none",
                }}
                title={isListening ? "Click to stop listening" : "Click to start speaking"}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 opacity-60" />}
              </button>

              {/* Live waveform bars shown below the button while listening */}
              {isListening && (
                <div className="flex items-end gap-[2px] mt-1.5 h-7">
                  {waveformBars.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-75"
                      style={{
                        width: "3px",
                        height: `${h}px`,
                        background: accent,
                        opacity: 0.85,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={isListening ? "Listening..." : "Type your response or hold the mic to speak..."}
                rows={1}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || sendMutation.isPending}
              className="flex-shrink-0 w-11 h-11 p-0 rounded-full"
              style={{ background: accent, color: bg }}
            >
              {sendMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </Button>
          </div>

          {/* Voice error banner */}
          {voiceError && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 mt-2 text-sm" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
              <div className="flex-1">
                {voiceError === "unsupported" ? (
                  <>
                    <p className="font-semibold text-white/80 text-xs">Browser not supported</p>
                    <p className="text-white/50 text-xs mt-0.5">Voice input requires Chrome or Edge. Switch browsers, or type your response instead.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-white/80 text-xs">Microphone access denied</p>
                    <p className="text-white/50 text-xs mt-0.5">Click the 🔒 lock icon in your browser address bar → Site settings → Allow Microphone. Then refresh and try again. You can still type below.</p>
                  </>
                )}
              </div>
              <button onClick={() => setVoiceError(null)} className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors">
                <X size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <p style={{ color: isListening ? accent : "rgba(255,255,255,0.25)" }} className="text-xs">{isListening ? "🔴 Listening — click mic to stop" : "Click mic to speak · Enter to send · Shift+Enter for new line"}</p>
            <button
              onClick={handleEnd}
              disabled={isEnding}
              className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors"
            >
              Finish session <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
