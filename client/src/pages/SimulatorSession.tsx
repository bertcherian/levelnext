import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Mic, MicOff, Send, StopCircle, Volume2, VolumeX, ChevronLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ── Voice helpers ─────────────────────────────────────────────────────────────
interface IRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => IRecognition;
    webkitSpeechRecognition: new () => IRecognition;
  }
}
function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<IRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() =>
    typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const start = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript || "";
      if (transcript) onResult(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, onResult]);
  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);
  return { isListening, isSupported, start, stop };
}

function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("google"))
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, ttsEnabled, setTtsEnabled, speak, stop };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SimulatorSession() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = parseInt(params.sessionId || "0");
  const [, navigate] = useLocation();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "character"; content: string }>>([]);
  const [isEnding, setIsEnding] = useState(false);
  const [missionData, setMissionData] = useState<any>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = trpc.simulator.getSession.useQuery({ sessionId });

  const sendMessage = trpc.simulator.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "character", content: data.characterResponse }]);
      setTurnCount(data.turnCount);
      if (tts.ttsEnabled) tts.speak(data.characterResponse);
    },
    onError: () => toast.error("Failed to get a response. Please try again."),
  });

  const endSession = trpc.simulator.endSession.useMutation({
    onSuccess: () => {
      navigate(`/simulator/${sessionId}/debrief` as any);
    },
    onError: () => toast.error("Could not generate debrief. Please try again."),
  });

  const tts = useTTS();

  const handleVoiceResult = useCallback((text: string) => {
    setInputText(text);
  }, []);

  const voice = useSpeechRecognition(handleVoiceResult);

  // Load mission data and opening line
  useEffect(() => {
    if (session && !sessionStarted) {
      setSessionStarted(true);
      // Fetch mission details to get opening line
      fetch(`/api/trpc/simulator.getMission?input=${encodeURIComponent(JSON.stringify({ missionId: session.missionId }))}`)
        .then(r => r.json())
        .then(data => {
          const mission = data?.result?.data;
          if (mission) {
            setMissionData(mission);
            const opening = { role: "character" as const, content: mission.openingLine };
            setMessages([opening]);
            if (tts.ttsEnabled) setTimeout(() => tts.speak(mission.openingLine), 500);
          }
        })
        .catch(() => {
          // Fallback: just start with empty messages
        });
    }
  }, [session, sessionStarted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || sendMessage.isPending) return;
    const userMsg = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    sendMessage.mutate({ sessionId, userMessage: userMsg });
  };

  const handleEnd = () => {
    if (messages.length < 3) {
      toast.error("Have at least 2-3 exchanges before ending the session for a meaningful debrief.");
      return;
    }
    setIsEnding(true);
    tts.stop();
    endSession.mutate({ sessionId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (sessionLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F8F5F0" }}>
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F5F0", gap: 16 }}>
        <AlertCircle size={40} color="#ef4444" />
        <p style={{ color: "#333", fontSize: 16 }}>Session not found.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const NAVY = "#0A1A2F";
  const GOLD = "#D4AF37";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#F8F5F0" }}>
      {/* Top bar */}
      <div style={{ background: NAVY, color: "#fff", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
              Practice Simulator
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{session.missionTitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* TTS toggle */}
          <button
            onClick={() => { tts.setTtsEnabled(!tts.ttsEnabled); tts.stop(); }}
            title={tts.ttsEnabled ? "Mute character voice" : "Enable character voice"}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            {tts.ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {tts.ttsEnabled ? "Voice On" : "Voice Off"}
          </button>
          {/* Turn counter */}
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: 8 }}>
            {Math.floor(messages.filter(m => m.role === "user").length)} exchanges
          </span>
          {/* End session */}
          <Button
            onClick={handleEnd}
            disabled={isEnding || endSession.isPending}
            style={{ background: GOLD, color: NAVY, fontWeight: 700, border: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          >
            {isEnding ? <Spinner /> : <StopCircle size={14} />}
            {isEnding ? "Generating Debrief..." : "End & Debrief"}
          </Button>
        </div>
      </div>

      {/* Character info bar */}
      {session.characterName && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0.6rem 1.5rem", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>
              {session.characterName.split(" ").map((n: string) => n[0]).join("")}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{session.characterName}</span>
            <span style={{ fontSize: 13, color: "#666", marginLeft: 6 }}>· {session.characterRole}</span>
          </div>
          {missionData && (
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#888", fontStyle: "italic" }}>
              {missionData.context?.slice(0, 80)}...
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem", color: "#888" }}>
            <Spinner />
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            {msg.role === "character" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>
                  {session.characterName?.split(" ").map((n: string) => n[0]).join("") || "C"}
                </span>
              </div>
            )}
            <div
              style={{
                maxWidth: "70%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? NAVY : "#fff",
                color: msg.role === "user" ? "#fff" : "#1a1a1a",
                fontSize: 15,
                lineHeight: 1.55,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: msg.role === "character" ? "1px solid #e5e7eb" : "none",
              }}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: NAVY, fontSize: 11, fontWeight: 700 }}>You</span>
              </div>
            )}
          </div>
        ))}
        {sendMessage.isPending && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>
                {session.characterName?.split(" ").map((n: string) => n[0]).join("") || "C"}
              </span>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ccc", animation: "pulse 1.2s infinite" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ccc", animation: "pulse 1.2s 0.2s infinite" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ccc", animation: "pulse 1.2s 0.4s infinite" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "1rem 1.5rem", flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          {/* Voice button */}
          {voice.isSupported && (
            <button
              onClick={voice.isListening ? voice.stop : voice.start}
              disabled={sendMessage.isPending}
              title={voice.isListening ? "Stop listening" : "Speak your response"}
              style={{
                width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                background: voice.isListening ? "#ef4444" : "#f3f4f6",
                color: voice.isListening ? "#fff" : "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.2s",
              }}
            >
              {voice.isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          {/* Text input */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voice.isListening ? "Listening... speak now" : "Type your response or use the mic..."}
            rows={2}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb",
              fontSize: 15, resize: "none", outline: "none", fontFamily: "inherit",
              background: voice.isListening ? "#fef2f2" : "#fff",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = GOLD}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
              background: inputText.trim() ? NAVY : "#e5e7eb",
              color: inputText.trim() ? "#fff" : "#aaa",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.2s",
            }}
          >
            {sendMessage.isPending ? <Spinner /> : <Send size={18} />}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 8 }}>
          Press Enter to send · Shift+Enter for new line · Click "End & Debrief" when ready
        </p>
      </div>
    </div>
  );
}
