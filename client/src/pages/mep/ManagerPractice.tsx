import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Send, Loader2, CheckCircle2, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type View = "scenarios" | "chat" | "debrief";

export default function ManagerPractice() {
  const [view, setView] = useState<View>("scenarios");
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [debrief, setDebrief] = useState<any>(null);
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
      setDebrief(data.debrief);
      setView("debrief");
    },
    onError: () => toast.error("Could not end session."),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    sendMessage.mutate({ sessionId, message: msg });
  };

  const handleEnd = () => {
    if (!sessionId) return;
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

        {/* Input */}
        <div className="px-4 py-3 border-t flex-shrink-0" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Respond as the manager…"
              className="flex-1 resize-none text-sm min-h-[44px] max-h-32"
              rows={1}
              disabled={sending}
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
              <p className="text-sm" style={{ color: "oklch(30% 0.02 248.6)" }}>{debrief.keyTakeaway}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setView("scenarios")}>
              <RotateCcw size={12} className="mr-1.5" /> Try Another Scenario
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs font-semibold"
              style={{ background: "#fb923c", color: "white" }}
              onClick={() => { setView("scenarios"); setTimeout(() => handleStart(activeScenario), 50); }}
            >
              Retry This Scenario
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
