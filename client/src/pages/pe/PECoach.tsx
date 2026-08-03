import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Plus, Sparkles, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function PECoach() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starters = trpc.pei.getCoachStarters.useQuery();
  const sessions = trpc.pei.getCoachSessions.useQuery();
  const startSession = trpc.pei.startCoachSession.useMutation();
  const sendMessage = trpc.pei.sendCoachMessage.useMutation();
  const sessionMessages = trpc.pei.getCoachMessages.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (sessionMessages.data) {
      setMessages(
        sessionMessages.data.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
  }, [sessionMessages.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartSession = async (context?: string) => {
    setStarting(true);
    try {
      const result = await startSession.mutateAsync({
        context: context,
        title: context?.slice(0, 80) ?? "Coaching Session",
      });
      setSessionId(result.sessionId);
      setMessages([{ role: "assistant", content: result.opening }]);
    } catch {
      toast.error("Failed to start coaching session");
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
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // ─── Session List View (no active session) ────────────────────────────────
  if (!sessionId) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>AI Professional Coach</h1>
          <p className="text-sm mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>
            Your personal AI coach, trained on your PEI data and professional context.
          </p>
        </div>

        {/* Start new session */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
          <h2 className="font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>Start a new coaching session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {starters.data?.map((s, i) => (
              <button
                key={i}
                onClick={() => handleStartSession(s.label)}
                disabled={starting}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150 hover:scale-[1.01]"
                style={{
                  background: "oklch(96% 0.02 248.6)",
                  border: "2px solid transparent",
                  color: "var(--color-ln-navy)",
                  cursor: starting ? "not-allowed" : "pointer",
                  opacity: starting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "oklch(from var(--color-ln-navy) l c h / 0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "oklch(96% 0.02 248.6)"; }}
              >
                <span className="text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button
              onClick={() => handleStartSession()}
              disabled={starting}
              style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}
            >
              {starting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Starting...</> : <><Plus size={14} className="mr-1" /> Start Blank Session</>}
            </Button>
          </div>
        </div>

        {/* Recent sessions */}
        {sessions.data && sessions.data.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ln-navy)" }}>Recent Sessions</h3>
            <div className="space-y-2">
              {sessions.data.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSessionId(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 hover:scale-[1.005]"
                  style={{ background: "white", border: "1px solid oklch(90% 0.02 248.6)" }}
                >
                  <MessageSquare size={16} style={{ color: "oklch(55% 0.02 248.6)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-ln-navy)" }}>{s.title}</p>
                    <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
                      {new Date(s.updatedAt).toLocaleDateString()} · {new Date(s.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Active Chat View ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen" style={{ maxHeight: "calc(100vh - 0px)" }}>
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b" style={{ borderColor: "oklch(90% 0.02 248.6)", background: "white" }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "var(--color-ln-navy)" }}>
            <Sparkles size={16} style={{ color: "#d4af37" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>AI Professional Coach</p>
            <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Context-aware coaching session</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setSessionId(null); setMessages([]); }}>
          New Session
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="flex"
            style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
          >
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3"
              style={{
                background: msg.role === "user" ? "var(--color-ln-navy)" : "white",
                color: msg.role === "user" ? "white" : "var(--color-ln-navy)",
                border: msg.role === "user" ? "none" : "1px solid oklch(90% 0.02 248.6)",
              }}
            >
              {msg.role === "assistant" ? (
                <Streamdown>{msg.content}</Streamdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex" style={{ justifyContent: "flex-start" }}>
            <div className="rounded-2xl px-4 py-3 bg-white border" style={{ borderColor: "oklch(90% 0.02 248.6)" }}>
              <Loader2 size={16} className="animate-spin" style={{ color: "oklch(55% 0.02 248.6)" }} />
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
            placeholder="Ask your coach anything..."
            disabled={sending}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: "oklch(85% 0.02 248.6)", outline: "none" }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ background: "var(--color-ln-navy)", color: "#d4af37" }}
            className="flex-shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
