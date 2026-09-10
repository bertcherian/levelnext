import { useState } from "react";
import AcademyLayout from "../components/AcademyLayout";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  HelpCircle,
  Sparkles,
  Send,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Flame,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Streamdown } from "streamdown";

type MentorMode = "ask" | "explain" | "show" | "test" | "challenge";

interface MentorMessageItem {
  role: "user" | "assistant";
  content: string;
  whatWasCorrect?: string;
  specificGap?: string;
  suggestedNextAction?: string;
  citations?: string[];
}

export default function AcademyMentor() {
  const [mode, setMode] = useState<MentorMode>("ask");
  const [inputQuestion, setInputQuestion] = useState("");
  const [messages, setMessages] = useState<MentorMessageItem[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your LevelNext Product Mentor. Ask me why traditional offsites fade, how our Behavioural Intelligence Engine functions, or challenge me with an enterprise objection on privacy.",
      citations: ["levelnext-change-thesis", "engine-behavioural-intelligence"],
    },
  ]);

  const mentorMutation = trpc.academy.askMentor.useMutation();

  const handleSend = async () => {
    if (!inputQuestion.trim() || inputQuestion.trim().length < 5) {
      toast.error("Please enter a question with at least 5 characters.");
      return;
    }

    const questionText = inputQuestion.trim();
    setInputQuestion("");

    const newMessages: MentorMessageItem[] = [
      ...messages,
      { role: "user", content: questionText },
    ];
    setMessages(newMessages);

    try {
      const res = await mentorMutation.mutateAsync({
        question: questionText,
        mode,
      });

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: res.answer,
          whatWasCorrect: res.whatWasCorrect,
          specificGap: res.specificGap,
          suggestedNextAction: res.suggestedNextAction,
          citations: res.citations,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to reach Product Mentor.");
    }
  };

  const modesList: { key: MentorMode; label: string; desc: string }[] = [
    { key: "ask", label: "Ask Me", desc: "Direct answers on platform architecture" },
    { key: "explain", label: "Explain It", desc: "No-jargon explanation of core engines" },
    { key: "show", label: "Show Me", desc: "Point to actual screens and why layers" },
    { key: "test", label: "Test Me", desc: "Scenario questions on discrimination" },
    { key: "challenge", label: "Challenge Me", desc: "Simulate tough buyer/CHRO objections" },
  ];

  return (
    <AcademyLayout stageBadge="Product Mentor">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle size={14} /> AI Product Mentor
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Grounded Product Intelligence & Objections
          </h1>
          <p className="text-xs text-[#F8F5F0]/70">
            Powered by approved LevelNext knowledge. Rigorously differentiates from legacy training and validates workplace transfer.
          </p>
        </div>

        {/* 5 Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {modesList.map((m) => {
            const isSelected = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? "bg-[#D4AF37] text-[#0A1A2F] border-[#D4AF37] font-bold shadow-md"
                    : "bg-[#1C1C1C] border-white/10 text-[#F8F5F0]/70 hover:bg-white/5"
                }`}
              >
                <p className="text-xs">{m.label}</p>
                <p className={`text-[10px] leading-tight mt-0.5 ${isSelected ? "text-[#0A1A2F]/80" : "text-white/40"}`}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Conversation Stream */}
        <div className="bg-[#1C1C1C] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 min-h-[420px] max-h-[580px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-2 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#D4AF37] text-[#0A1A2F] font-semibold rounded-tr-none"
                    : "bg-white/5 border border-white/10 text-[#F8F5F0] rounded-tl-none space-y-3"
                }`}
              >
                <Streamdown>{msg.content}</Streamdown>

                {/* Structured Feedback Blocks if assistant */}
                {msg.role === "assistant" && (msg.whatWasCorrect || msg.specificGap || msg.suggestedNextAction) && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs">
                    {msg.whatWasCorrect && (
                      <p className="text-emerald-400 flex items-start gap-1.5">
                        <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
                        <span><strong>Accurate:</strong> {msg.whatWasCorrect}</span>
                      </p>
                    )}
                    {msg.specificGap && (
                      <p className="text-amber-400 flex items-start gap-1.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span><strong>Sharpen:</strong> {msg.specificGap}</span>
                      </p>
                    )}
                    {msg.suggestedNextAction && (
                      <p className="text-[#D4AF37] flex items-start gap-1.5 pt-1">
                        <ArrowRight size={13} className="shrink-0 mt-0.5" />
                        <span><strong>Next Move:</strong> {msg.suggestedNextAction}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Citations:</span>
                    {msg.citations.map((c, i) => (
                      <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[#D4AF37]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {mentorMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-[#D4AF37] py-2">
              <Sparkles size={14} className="animate-spin" />
              <span>Synthesizing grounded answer...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-[#1C1C1C] border border-[#D4AF37]/40 rounded-xl p-2 flex items-center gap-2 shadow-lg">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask in ${mode.toUpperCase()} mode (e.g. "How does the Behavioural Engine guarantee HR privacy?")`}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={mentorMutation.isPending || !inputQuestion.trim()}
            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#0A1A2F] text-xs font-bold hover:bg-[#c49f2e] transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send size={12} />
          </button>
        </div>
      </div>
    </AcademyLayout>
  );
}
