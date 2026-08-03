import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Send, Zap, Plus, Star, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface PracticeMessage {
  role: "user" | "counterpart";
  content: string;
  timestamp?: string;
}

const PERSONALITIES = [
  { id: "realistic", label: "Realistic", description: "A typical professional" },
  { id: "resistant", label: "Resistant", description: "Defensive, pushes back" },
  { id: "emotional", label: "Emotional", description: "Gets upset easily" },
  { id: "passive", label: "Passive", description: "Disengaged, minimal responses" },
  { id: "aggressive", label: "Aggressive", description: "Challenges everything" },
];

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

  const scenarios = trpc.pei.getPracticeScenarios.useQuery();
  const startSession = trpc.pei.startPracticeSession.useMutation();
  const sendMessage = trpc.pei.sendPracticeMessage.useMutation();
  const endSession = trpc.pei.endPracticeSession.useMutation();
  const pastSessions = trpc.pei.listPracticeSessions.useQuery();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch {
      toast.error("Failed to start practice session");
    } finally {
      setStarting(false);
    }
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
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    setEnding(true);
    try {
      const result = await endSession.mutateAsync({ sessionId });
      setFeedback(result);
      setView("feedback");
    } catch {
      toast.error("Failed to end session");
    } finally {
      setEnding(false);
    }
  };

  const handleReset = () => {
    setSessionId(null);
    setMessages([]);
    setFeedback(null);
    setSelectedScenario("");
    setSelectedLabel("");
    setView("scenarios");
  };

  // ─── SCENARIO SELECTION ────────────────────────────────────────────────────
  if (view === "scenarios") {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>AI Practice Partner</h1>
          <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Role-play high-stakes professional conversations with an AI counterpart. Get real-time coaching feedback.
          </p>
        </div>

        {/* Personality selector */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ln-navy)" }}>Counterpart Personality</h3>
          <div className="flex flex-wrap gap-2">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: personality === p.id ? "var(--color-ln-navy)" : "oklch(96% 0.02 248.6)",
                  color: personality === p.id ? "#d4af37" : "oklch(40% 0.02 248.6)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "oklch(55% 0.02 248.6)" }}>
            {PERSONALITIES.find((p) => p.id === personality)?.description}
          </p>
        </div>

        {/* Scenario grid */}
        <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ln-navy)" }}>Choose a Scenario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenarios.data?.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedScenario(s.id); setSelectedLabel(s.label); }}
              className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-150 hover:scale-[1.01]"
              style={{
                background: selectedScenario === s.id ? "oklch(from var(--color-ln-navy) l c h / 0.08)" : "white",
                border: selectedScenario === s.id ? "2px solid var(--color-ln-navy)" : "1px solid oklch(90% 0.02 248.6)",
              }}
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>{s.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Start button */}
        {selectedScenario && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleStart}
              disabled={starting}
              style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}
              className="px-8"
            >
              {starting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Starting...</> : <>Start Practice <ArrowRight size={16} className="ml-1" /></>}
            </Button>
          </div>
        )}

        {/* Past sessions */}
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
          <Button variant="outline" size="sm" onClick={handleEnd} disabled={ending || messages.length < 2}>
            {ending ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
            End & Get Feedback
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className="flex" style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div className="max-w-[80%]">
                <p className="text-xs mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
                  {msg.role === "user" ? "You" : "Counterpart"}
                </p>
                <div
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: msg.role === "user" ? "var(--color-ln-navy)" : "oklch(from #d4af37 l c h / 0.1)",
                    color: msg.role === "user" ? "white" : "var(--color-ln-navy)",
                  }}
                >
                  {msg.content}
                </div>
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
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Respond to your counterpart..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
            />
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

        {/* Overall rating */}
        <div className="rounded-2xl p-6 text-center" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#d4af37" }}>Overall Rating</p>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={28}
                style={{ color: star <= (feedback.overallRating ?? 3) ? "#d4af37" : "oklch(from white 20% 0 0 / 0.2)" }}
                fill={star <= (feedback.overallRating ?? 3) ? "#d4af37" : "none"}
              />
            ))}
          </div>
          {feedback.headline && (
            <p className="text-sm mt-3" style={{ color: "oklch(75% 0.02 248.6)" }}>{feedback.headline}</p>
          )}
        </div>

        {/* Strengths */}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "#22c55e" }}>What You Did Well</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((s: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {feedback.improvements && feedback.improvements.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "#f97316" }}>Areas to Improve</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((s: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--color-ln-navy)" }}>
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#f97316" }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key moment */}
        {feedback.keyMoment && (
          <div className="rounded-2xl p-5" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Key Moment</p>
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{feedback.keyMoment}</p>
          </div>
        )}

        {/* Coaching insight */}
        {feedback.coachingInsight && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#d4af37" }}>Coaching Insight</p>
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{feedback.coachingInsight}</p>
          </div>
        )}

        {/* Next practice */}
        {feedback.nextPractice && (
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#6366f1" }}>Next Practice Suggestion</p>
            <p className="text-sm" style={{ color: "var(--color-ln-navy)" }}>{feedback.nextPractice}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button onClick={handleReset} style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}>
            <Plus size={14} className="mr-1" /> New Practice Session
          </Button>
          <a href="/pe">
            <Button variant="outline" style={{ borderColor: "var(--color-ln-navy)", color: "var(--color-ln-navy)" }}>
              Back to Home
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return null;
}
