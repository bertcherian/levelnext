import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { Streamdown } from "streamdown";

export default function Guide() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: conversation, isLoading } = trpc.guide.getConversation.useQuery(undefined, { enabled: isAuthenticated });

  const sendMessage = trpc.guide.sendMessage.useMutation({
    onSuccess: () => {
      utils.guide.getConversation.invalidate();
      setInput("");
    },
    onError: () => toast.error("Guide is unavailable right now. Please try again."),
  });

  const clearConversation = trpc.guide.clearConversation.useMutation({
    onSuccess: () => utils.guide.getConversation.invalidate(),
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate({ message: input.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = conversation?.messages ?? [];
  const firstName = user?.name?.split(" ")[0] ?? "Leader";

  return (
    <PlatformLayout title="Guide">
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-ln-navy)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Guide</p>
              <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Your personal leadership coach</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => clearConversation.mutate()}
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ color: "var(--color-ln-muted)" }}
            >
              <RotateCcw size={12} /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ background: "var(--color-ln-ivory)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin" size={24} style={{ color: "var(--color-ln-muted)" }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: "var(--color-ln-navy)" }}>
                <span className="text-xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>
                Hello, {firstName}.
              </h2>
              <p className="text-sm max-w-sm" style={{ color: "var(--color-ln-muted)" }}>
                I'm Guide — your personal leadership coach inside LevelNext. I'm here to help you build your Edge through practical, daily coaching. What's on your mind today?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-md">
                {[
                  "What should I focus on today?",
                  "Help me prepare for a difficult conversation",
                  "What does my Edge profile tell you?",
                  "Give me a leadership mission for this week",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); }}
                    className="text-left text-sm px-4 py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: "white", border: "1px solid var(--color-ln-border)", color: "var(--color-ln-navy)" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1"
                      style={{ background: "var(--color-ln-navy)" }}>
                      <span className="text-xs font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    style={{
                      background: msg.role === "user" ? "var(--color-ln-navy)" : "white",
                      color: msg.role === "user" ? "white" : "var(--color-ln-text)",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                    {msg.role === "assistant" ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start animate-slide-up">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-3"
                    style={{ background: "var(--color-ln-navy)" }}>
                    <span className="text-xs font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "white", boxShadow: "var(--shadow-sm)" }}>
                    <div className="flex gap-1.5 items-center h-5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: "var(--color-ln-muted)", animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
          <div className="flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Guide anything about your leadership…"
              className="flex-1 resize-none min-h-[44px] max-h-[120px] text-sm"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="h-11 w-11 p-0 flex-shrink-0 rounded-xl"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              {sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--color-ln-muted)" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </PlatformLayout>
  );
}
