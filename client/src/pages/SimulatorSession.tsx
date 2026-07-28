import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Volume2, VolumeX, Square, Loader2, ChevronRight } from "lucide-react";

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
  manager: "#4ade80",
  career: "#D4AF37",
  young: "#818cf8",
};

const PLATFORM_BG: Record<string, string> = {
  leadership: "#0A1A2F",
  manager: "#1a3a2a",
  career: "#0A1A2F",
  young: "#1a1a3a",
};

type Message = { role: "user" | "assistant"; content: string; timestamp: number };

export default function SimulatorSession() {
  const [, params] = useRoute("/simulator/:sessionId");
  const [, navigate] = useLocation();
  const sessionId = parseInt(params?.sessionId ?? "0");

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading } = trpc.simulator.getSession.useQuery(
    { sessionId },
    { enabled: !!sessionId, refetchInterval: false }
  );

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
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  useEffect(() => {
    if (session && localMessages.length === 1 && localMessages[0].role === "assistant" && ttsEnabled) {
      setTimeout(() => speak(localMessages[0].content), 500);
    }
  }, [session, localMessages.length]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
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

    recognition.onerror = () => { setIsListening(false); setInterimText(""); };
    recognition.onend = () => { setIsListening(false); setInterimText(""); };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  };

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
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors"
              title={ttsEnabled ? "Mute voice" : "Enable voice"}
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

      {/* Objective bar */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/5" style={{ background: accent + "08" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs" style={{ color: accent + "cc" }}>
            <span className="font-medium">Your objective:</span>{" "}
            <span className="text-white/60">{session.objective}</span>
          </p>
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
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isListening ? accent : "rgba(255,255,255,0.1)",
                color: isListening ? bg : "white",
                transform: isListening ? "scale(1.1)" : "scale(1)",
              }}
              title="Hold to speak"
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 opacity-60" />}
            </button>

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

          <div className="flex items-center justify-between mt-2">
            <p className="text-white/25 text-xs">Hold mic to speak · Enter to send · Shift+Enter for new line</p>
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
