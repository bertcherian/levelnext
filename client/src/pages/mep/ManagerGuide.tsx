import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Send, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "My team member keeps missing deadlines. How do I address this?",
  "I'm struggling to give critical feedback without damaging the relationship.",
  "How do I manage a high performer who is difficult to work with?",
  "I have a team member who is disengaged. What should I do?",
  "How do I run more effective 1-on-1s?",
  "I'm new to management. Where do I start?",
];

export default function ManagerGuide() {
  const [activeSessId, setActiveSessId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions, refetch: refetchSessions } = trpc.mep.listGuideSessions.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.mep.getGuideMessages.useQuery(
    { sessionId: activeSessId! },
    { enabled: !!activeSessId }
  );

  const createSession = trpc.mep.createGuideSession.useMutation({
    onSuccess: (sess) => {
      setActiveSessId(sess.id);
      refetchSessions();
    },
    onError: () => toast.error("Could not start a new session."),
  });

  const sendMessage = trpc.mep.sendGuideMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setSending(false);
      setStreamedText("");
    },
    onError: () => {
      toast.error("Could not send message.");
      setSending(false);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedText]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setSending(true);

    let sessId = activeSessId;
    if (!sessId) {
      const sess = await createSession.mutateAsync({ title: msg.slice(0, 60) });
      sessId = sess.id;
    }
    await sendMessage.mutateAsync({ sessionId: sessId, message: msg });
  };

  return (
    <div className="flex h-screen" style={{ background: "var(--color-ln-ivory)" }}>

      {/* Sidebar */}
      <div
        className="hidden md:flex flex-col w-64 flex-shrink-0 border-r"
        style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
      >
        <div className="px-4 py-4 border-b" style={{ borderColor: "oklch(90% 0.01 248.6)" }}>
          <Button
            size="sm"
            className="w-full font-semibold text-xs"
            style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
            onClick={() => { setActiveSessId(null); setInput(""); }}
          >
            <Plus size={14} className="mr-1.5" />
            New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {sessions?.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: "oklch(60% 0.02 248.6)" }}>
              No conversations yet
            </p>
          )}
          {sessions?.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setActiveSessId(s.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all",
                activeSessId === s.id
                  ? "font-semibold"
                  : "hover:bg-gray-50"
              )}
              style={activeSessId === s.id
                ? { background: "oklch(from #34d399 l c h / 0.08)", color: "var(--color-ln-navy)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }
                : { color: "oklch(40% 0.02 248.6)" }}
            >
              <p className="truncate font-medium">{s.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "oklch(60% 0.02 248.6)" }}>
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(from #34d399 l c h / 0.12)", border: "1px solid oklch(from #34d399 l c h / 0.25)" }}
          >
            <MessageSquare size={15} style={{ color: "#34d399" }} />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>Manager Guide</h1>
            <p className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>
              AI coaching for your management challenges
            </p>
          </div>
          <div className="ml-auto md:hidden">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => { setActiveSessId(null); setInput(""); }}
            >
              <Plus size={12} className="mr-1" /> New
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!activeSessId && (
            <div className="max-w-2xl mx-auto space-y-6 pt-4">
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "oklch(from #34d399 l c h / 0.1)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}
                >
                  <MessageSquare size={24} style={{ color: "#34d399" }} />
                </div>
                <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>
                  What management challenge can I help you with?
                </h2>
                <p className="text-sm" style={{ color: "oklch(50% 0.02 248.6)" }}>
                  I'm your AI management coach — trained on real-world management science and coaching frameworks.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-left px-4 py-3 rounded-xl text-xs transition-all hover:shadow-sm flex items-center gap-2"
                    style={{ background: "white", border: "1px solid oklch(88% 0.01 248.6)", color: "oklch(35% 0.02 248.6)" }}
                  >
                    <ChevronRight size={12} style={{ color: "#34d399" }} className="flex-shrink-0" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                )}
                style={msg.role === "user"
                  ? { background: "var(--color-ln-navy)", color: "white" }
                  : { background: "white", color: "oklch(25% 0.02 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
              >
                <Loader2 size={14} className="animate-spin" style={{ color: "#34d399" }} />
                <span className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Thinking…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-4 py-3 border-t flex-shrink-0"
          style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}
        >
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe your management challenge…"
              className="flex-1 resize-none text-sm min-h-[44px] max-h-32"
              rows={1}
              disabled={sending}
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 h-11 w-11"
              style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: "oklch(65% 0.02 248.6)" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
