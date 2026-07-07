import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2, RotateCcw, Sparkles, Target, ChevronRight, BookOpen, MessageCircle, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { Streamdown } from "streamdown";

// Daily prompts rotate based on day of week
const DAILY_PROMPTS = [
  "What should I focus on to strengthen my Edge this week?",
  "Help me prepare for a high-stakes stakeholder conversation.",
  "What does my Edge profile tell you about my leadership blind spots?",
  "Give me a Mission for today that will build my executive presence.",
  "How can I communicate with more strategic clarity in my next leadership meeting?",
  "What's the most important growth edge I should be working on right now?",
  "Help me think through a difficult accountability conversation I need to have.",
];

const getDailyPrompts = () => {
  const day = new Date().getDay();
  const start = day % DAILY_PROMPTS.length;
  return [
    DAILY_PROMPTS[start % DAILY_PROMPTS.length],
    DAILY_PROMPTS[(start + 1) % DAILY_PROMPTS.length],
    DAILY_PROMPTS[(start + 2) % DAILY_PROMPTS.length],
    DAILY_PROMPTS[(start + 3) % DAILY_PROMPTS.length],
  ];
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getSessionLabel = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning Session";
  if (hour < 17) return "Afternoon Session";
  return "Evening Reflection";
};

type Message = { role: "user" | "assistant"; content: string; timestamp: string };
type FavoriteInsight = { id: string; content: string; savedAt: string; preview: string };

const FAVORITES_KEY = "levelnext_guide_favorites";

function loadFavorites(): FavoriteInsight[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
  } catch { return []; }
}

function saveFavorites(favs: FavoriteInsight[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export default function Guide() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [view, setView] = useState<"home" | "chat">("home");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const { data: conversation, isLoading: convLoading } = trpc.guide.getConversation.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: graphData } = trpc.leadershipGraph.get.useQuery(
    undefined,
    { enabled: isAuthenticated, staleTime: 0, refetchOnMount: true }
  );

  const sendMessage = trpc.guide.sendMessage.useMutation({
    onSuccess: () => {
      utils.guide.getConversation.invalidate();
      setInput("");
    },
    onError: () => toast.error("Guide is unavailable right now. Please try again."),
  });

  const clearConversation = trpc.guide.clearConversation.useMutation({
    onSuccess: () => {
      utils.guide.getConversation.invalidate();
      setView("home");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages, view]);

  // Auto-switch to chat if there are existing messages
  useEffect(() => {
    if (!convLoading && conversation?.messages && conversation.messages.length > 0) {
      setView("chat");
    }
  }, [convLoading, conversation]);

  const handleSend = (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || sendMessage.isPending) return;
    setView("chat");
    sendMessage.mutate({ message: text });
    if (!msg) setInput("");
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setView("chat");
    sendMessage.mutate({ message: prompt });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = (conversation?.messages ?? []) as Message[];
  const firstName = user?.name?.split(" ")[0] ?? "Leader";
  const graph = graphData as any;
  const hasEci = graph?.modules?.ECI;
  const hasLii = graph?.modules?.LII;
  const hasGcc = graph?.modules?.GCC;
  const eciArchetype = hasEci ? graph.modules.ECI.archetype : null;
  const eciArchetypeLabel = hasEci ? graph.modules.ECI.archetypeLabel : null;
  const eciEdge = hasEci ? Math.round(graph.modules.ECI.edgeScore ?? 0) : null;
  const liiArchetype = hasLii ? graph.modules.LII.archetype : null;
  const liiArchetypeLabel = hasLii ? graph.modules.LII.archetypeLabel : null;
  const liiEdge = hasLii ? Math.round(graph.modules.LII.edgeScore ?? 0) : null;
  const gccArchetypeLabel = hasGcc ? graph.modules.GCC.archetypeLabel : null;
  const gccArchetype = hasGcc ? graph.modules.GCC.archetype : null;
  const gccEdge = hasGcc ? Math.round(graph.modules.GCC.edgeScore ?? 0) : null;
  const compositeEdge = graph?.compositeEdge ? Math.round(graph.compositeEdge) : null;
  const sessionCount = messages.length > 0 ? Math.ceil(messages.length / 4) : 0;
  const dailyPrompts = getDailyPrompts();

  // Follow-up questions from latest report
  const { data: reportsData } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });
  const latestReport = reportsData?.[0];
  const [favorites, setFavorites] = useState<FavoriteInsight[]>(() => loadFavorites());
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpGenerated, setFollowUpGenerated] = useState(false);

  const generateFollowUp = trpc.guide.generateFollowUpQuestions.useMutation({
    onSuccess: (data) => {
      setFollowUpQuestions(data.questions);
      setFollowUpLoading(false);
      setFollowUpGenerated(true);
    },
    onError: () => {
      setFollowUpLoading(false);
      toast.error("Could not generate follow-up questions. Please try again.");
    },
  });

  const handleSaveToFavorites = (msg: Message) => {
    const existing = loadFavorites();
    const alreadySaved = existing.some(f => f.id === msg.timestamp);
    if (alreadySaved) {
      const updated = existing.filter(f => f.id !== msg.timestamp);
      saveFavorites(updated);
      setFavorites(updated);
      toast.success("Removed from Saved Insights");
    } else {
      const newFav: FavoriteInsight = {
        id: msg.timestamp,
        content: msg.content,
        savedAt: new Date().toISOString(),
        preview: msg.content.replace(/[#*`]/g, "").slice(0, 120) + (msg.content.length > 120 ? "…" : ""),
      };
      const updated = [newFav, ...existing].slice(0, 20); // max 20 saved
      saveFavorites(updated);
      setFavorites(updated);
      toast.success("Saved to Insights");
    }
  };

  const handleDeleteFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    saveFavorites(updated);
    setFavorites(updated);
  };

  const handleGenerateFollowUp = () => {
    if (!latestReport?.id) return;
    setFollowUpLoading(true);
    generateFollowUp.mutate({ reportId: latestReport.id });
  };

  if (loading || convLoading) {
    return (
      <PlatformLayout title="Guide">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={24} style={{ color: "var(--color-ln-muted)" }} />
        </div>
      </PlatformLayout>
    );
  }

  // ── Guide Home View ──────────────────────────────────────────────────────────
  if (view === "home") {
    return (
      <PlatformLayout title="Guide">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">

          {/* Guide Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-ln-navy)" }}>
              <span className="text-2xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Guide</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "oklch(95% 0.02 248.6)", color: "var(--color-ln-navy)" }}>
                  {getSessionLabel()}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                {getGreeting()}, {firstName}. I'm here to help you build your Edge — one conversation at a time.
              </p>
            </div>
          </div>

          {/* Edge Context Card — shows all completed modules */}
          {(hasEci || hasLii || hasGcc) && (
            <div className="rounded-2xl p-5 border"
              style={{ background: "var(--color-ln-navy)", borderColor: "var(--color-ln-navy)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-yellow)" }}>
                  Your Current Edge
                </p>
                {compositeEdge && (
                  <span className="text-2xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>
                    {compositeEdge}
                  </span>
                )}
              </div>

              {/* ECI module row */}
              {hasEci && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(25% 0.072 248.6)" }}>
                    <span className="text-base">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {eciArchetypeLabel ?? eciArchetype?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(70% 0.02 248.6)" }}>
                      Executive Communication · Edge {eciEdge}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePromptClick(`I completed the Executive Communication diagnostic and I'm a ${eciArchetypeLabel ?? eciArchetype}. Based on my profile, what are the 2-3 most important practices I should focus on this week?`)}
                    className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:opacity-80"
                    style={{ background: "oklch(30% 0.072 248.6)", color: "oklch(80% 0.02 248.6)" }}
                  >
                    Ask Guide <ChevronRight size={12} style={{ color: "var(--color-ln-yellow)" }} />
                  </button>
                </div>
              )}

              {/* LII module row */}
              {hasLii && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(25% 0.072 248.6)" }}>
                    <span className="text-base">🤝</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {liiArchetypeLabel ?? liiArchetype?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(70% 0.02 248.6)" }}>
                      Leadership Influence · Edge {liiEdge}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePromptClick(`I completed the Leadership Influence diagnostic and I'm a ${liiArchetypeLabel ?? liiArchetype}. What specific influence practices should I prioritise in the next 2 weeks?`)}
                    className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:opacity-80"
                    style={{ background: "oklch(30% 0.072 248.6)", color: "oklch(80% 0.02 248.6)" }}
                  >
                    Ask Guide <ChevronRight size={12} style={{ color: "var(--color-ln-yellow)" }} />
                  </button>
                </div>
              )}

              {/* GCC module row */}
              {hasGcc && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(25% 0.072 248.6)" }}>
                    <span className="text-base">🏢</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {gccArchetypeLabel ?? gccArchetype?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(70% 0.02 248.6)" }}>
                      GCC Readiness · Edge {gccEdge}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePromptClick(`I completed the GCC Readiness diagnostic and my organisation is a ${gccArchetypeLabel ?? gccArchetype}. What are the most critical leadership actions I should take to advance our GCC's strategic readiness?`)}
                    className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all hover:opacity-80"
                    style={{ background: "oklch(30% 0.072 248.6)", color: "oklch(80% 0.02 248.6)" }}
                  >
                    Ask Guide <ChevronRight size={12} style={{ color: "var(--color-ln-yellow)" }} />
                  </button>
                </div>
              )}

              {/* Session history indicator */}
              {sessionCount > 0 && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between"
                  style={{ borderColor: "oklch(30% 0.072 248.6)" }}>
                  <p className="text-xs" style={{ color: "oklch(60% 0.02 248.6)" }}>
                    {messages.length} message{messages.length !== 1 ? "s" : ""} in this session
                  </p>
                  <button
                    onClick={() => setView("chat")}
                    className="text-xs font-medium transition-all hover:opacity-80"
                    style={{ color: "var(--color-ln-yellow)" }}
                  >
                    Continue conversation →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Follow-up Questions from Latest Insight */}
          {latestReport && (
            <div className="rounded-2xl p-5"
              style={{ background: "white", border: "1.5px solid var(--color-ln-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} style={{ color: "var(--color-ln-navy)" }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                    Questions from Your Latest Insight
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", color: "var(--color-ln-navy)" }}>
                  {latestReport.moduleType === 'ECI' ? 'Exec Comm' : latestReport.moduleType === 'LII' ? 'Leadership Influence' : 'GCC Readiness'}
                </span>
              </div>

              {!followUpGenerated ? (
                <>
                  <p className="text-sm mb-4" style={{ color: "var(--color-ln-muted)" }}>
                    Guide can generate specific questions based on your{" "}
                    <strong style={{ color: "var(--color-ln-navy)" }}>
                      {(latestReport.archetype as string)?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </strong>{" "}archetype and results.
                  </p>
                  <button
                    onClick={handleGenerateFollowUp}
                    disabled={followUpLoading}
                    className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80 flex items-center gap-2"
                    style={{ background: "var(--color-ln-navy)", color: "white" }}
                  >
                    {followUpLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> Generating questions…</>
                    ) : (
                      <><Sparkles size={14} /> Generate My Follow-up Questions</>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  {followUpQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handlePromptClick(q)}
                      className="w-full text-left text-sm px-4 py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] group flex items-start gap-3"
                      style={{
                        background: "oklch(98% 0.01 248.6)",
                        border: "1px solid var(--color-ln-border)",
                        color: "var(--color-ln-navy)",
                      }}
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                        style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                        {i + 1}
                      </span>
                      <span className="leading-snug flex-1">{q}</span>
                      <ChevronRight size={14} className="flex-shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
                        style={{ color: "var(--color-ln-yellow)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Today's Suggested Conversations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: "var(--color-ln-yellow)" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                Today's Conversations
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dailyPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left text-sm px-4 py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] group"
                  style={{
                    background: "white",
                    border: "1.5px solid var(--color-ln-border)",
                    color: "var(--color-ln-navy)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <span className="leading-snug block">{prompt}</span>
                  <ChevronRight size={14} className="mt-2 transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--color-ln-yellow)" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Mission Prompt */}
          <div className="rounded-2xl p-5 border"
            style={{ background: "oklch(98% 0.01 248.6)", borderColor: "var(--color-ln-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                Request a Mission
              </p>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--color-ln-muted)" }}>
              Ask Guide to design a specific leadership practice for today or this week.
            </p>
            <button
              onClick={() => handlePromptClick("Give me a specific leadership Mission for today — something practical I can do in the next few hours to build my Edge.")}
              className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80 flex items-center gap-2"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              <Target size={14} /> Get Today's Mission
            </button>
          </div>

          {/* Saved Insights */}
          {favorites.length > 0 && (
            <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookmarkCheck size={14} style={{ color: "var(--color-ln-yellow)" }} />
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                    Saved Insights
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "oklch(95% 0.02 248.6)", color: "var(--color-ln-navy)" }}>
                  {favorites.length}
                </span>
              </div>
              <div className="space-y-2">
                {favorites.slice(0, 3).map((fav) => (
                  <div key={fav.id} className="flex items-start gap-3 p-3 rounded-xl group"
                    style={{ background: "var(--color-ln-ivory)", border: "1px solid var(--color-ln-border)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-ln-text)" }}>
                        {fav.preview}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-ln-muted)" }}>
                        {new Date(fav.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFavorite(fav.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 size={12} style={{ color: "var(--color-ln-muted)" }} />
                    </button>
                  </div>
                ))}
                {favorites.length > 3 && (
                  <p className="text-xs text-center pt-1" style={{ color: "var(--color-ln-muted)" }}>
                    +{favorites.length - 3} more saved insights
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Open Chat */}
          <div className="rounded-2xl p-5 border"
            style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-navy)" }}>
                Open Conversation
              </p>
            </div>
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Guide anything about your leadership…"
                className="flex-1 resize-none min-h-[44px] max-h-[100px] text-sm"
                rows={2}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || sendMessage.isPending}
                className="h-11 w-11 p-0 flex-shrink-0 rounded-xl self-end"
                style={{ background: "var(--color-ln-navy)", color: "white" }}
              >
                {sendMessage.isPending
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Send size={16} />}
              </Button>
            </div>
          </div>

        </div>
      </PlatformLayout>
    );
  }

  // ── Chat View ────────────────────────────────────────────────────────────────
  return (
    <PlatformLayout title="Guide">
      <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-3xl mx-auto">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-ln-navy)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--color-ln-navy)" }}>Guide</p>
              <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Your personal leadership coach</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("home")}
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-70 px-3 py-1.5 rounded-lg"
              style={{ color: "var(--color-ln-muted)", background: "var(--color-ln-ivory)" }}
            >
              Home
            </button>
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
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
          style={{ background: "var(--color-ln-ivory)" }}>
          {messages.length === 0 && sendMessage.isPending ? null : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--color-ln-navy)" }}>
                <span className="text-xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                Starting your session with Guide…
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 mt-1"
                      style={{ background: "var(--color-ln-navy)" }}>
                      <span className="text-xs font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
                    </div>
                  )}
                  <div className="group relative">
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                      style={{
                        background: msg.role === "user" ? "var(--color-ln-navy)" : "white",
                        color: msg.role === "user" ? "white" : "var(--color-ln-text)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      {msg.role === "assistant" ? (
                        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleSaveToFavorites(msg)}
                        className="absolute -bottom-2 right-0 opacity-0 group-hover:opacity-100 transition-all duration-150 p-1.5 rounded-lg"
                        style={{
                          background: favorites.some(f => f.id === msg.timestamp) ? "var(--color-ln-yellow)" : "white",
                          border: "1px solid var(--color-ln-border)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                        title={favorites.some(f => f.id === msg.timestamp) ? "Remove from Saved Insights" : "Save to Insights"}
                      >
                        {favorites.some(f => f.id === msg.timestamp)
                          ? <BookmarkCheck size={12} style={{ color: "var(--color-ln-navy)" }} />
                          : <Bookmark size={12} style={{ color: "var(--color-ln-muted)" }} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start animate-slide-up">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 mt-1"
                    style={{ background: "var(--color-ln-navy)" }}>
                    <span className="text-xs font-bold" style={{ color: "var(--color-ln-yellow)" }}>G</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4"
                    style={{ background: "white", boxShadow: "var(--shadow-sm)", minWidth: "80px" }}>
                    <div className="flex gap-1 items-end h-5">
                      {[0, 1, 2].map((j) => (
                        <div
                          key={j}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--color-ln-navy)",
                            opacity: 0.7,
                            animation: "guideTyping 1.2s ease-in-out infinite",
                            animationDelay: `${j * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--color-ln-muted)", fontSize: "10px" }}>
                      Guide is thinking…
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "var(--color-ln-border)", background: "white" }}>
          <div className="flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue your conversation with Guide…"
              className="flex-1 resize-none min-h-[44px] max-h-[120px] text-sm"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMessage.isPending}
              className="h-11 w-11 p-0 flex-shrink-0 rounded-xl"
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              {sendMessage.isPending
                ? <Loader2 size={16} className="animate-spin" />
                : <Send size={16} />}
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
