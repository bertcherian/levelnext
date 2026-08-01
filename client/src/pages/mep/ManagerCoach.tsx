/**
 * Manager Coach — unified tabbed page combining:
 *   Tab 1: "Ask a Question"  (formerly Manager Guide — AI chat)
 *   Tab 2: "Scenario Playbooks" (formerly Manager Playbook)
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, BookOpen, Plus, Send, Loader2, ChevronRight,
  MessageSquareWarning, TrendingDown, GitBranch, Users, Zap,
  ShieldAlert, Clock, Sparkles, Trophy, CircleDot, XCircle,
  HelpCircle, CheckCircle2, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Shared constants ──────────────────────────────────────────────────────────

const STARTER_PROMPTS = [
  "My team member keeps missing deadlines. How do I address this?",
  "I'm struggling to give critical feedback without damaging the relationship.",
  "How do I manage a high performer who is difficult to work with?",
  "I have a team member who is disengaged. What should I do?",
  "How do I run more effective 1-on-1s?",
  "I'm new to management. Where do I start?",
];

const PLAYBOOK_TYPES = [
  { code: "difficult_conversation" as const, label: "Difficult Conversation", description: "Navigate a high-stakes conversation you've been avoiding", icon: MessageSquareWarning, color: "#f87171", bgAlpha: "oklch(from #f87171 l c h / 0.08)", borderAlpha: "oklch(from #f87171 l c h / 0.25)" },
  { code: "performance_gap" as const, label: "Performance Gap", description: "Address consistent underperformance with clarity and compassion", icon: TrendingDown, color: "#f59e0b", bgAlpha: "oklch(from #f59e0b l c h / 0.08)", borderAlpha: "oklch(from #f59e0b l c h / 0.25)" },
  { code: "delegation_breakdown" as const, label: "Delegation Breakdown", description: "Stop doing everything yourself — build real team ownership", icon: GitBranch, color: "#60a5fa", bgAlpha: "oklch(from #60a5fa l c h / 0.08)", borderAlpha: "oklch(from #60a5fa l c h / 0.25)" },
  { code: "team_conflict" as const, label: "Team Conflict", description: "Resolve interpersonal friction before it damages the team", icon: Users, color: "#a78bfa", bgAlpha: "oklch(from #a78bfa l c h / 0.08)", borderAlpha: "oklch(from #a78bfa l c h / 0.25)" },
  { code: "motivation_engagement" as const, label: "Motivation & Engagement", description: "Re-engage a disengaged team member who has lost their spark", icon: Zap, color: "#34d399", bgAlpha: "oklch(from #34d399 l c h / 0.08)", borderAlpha: "oklch(from #34d399 l c h / 0.25)" },
  { code: "feedback_resistance" as const, label: "Feedback Resistance", description: "Give feedback that lands even with defensive or dismissive people", icon: ShieldAlert, color: "#fb923c", bgAlpha: "oklch(from #fb923c l c h / 0.08)", borderAlpha: "oklch(from #fb923c l c h / 0.25)" },
] as const;

type PlaybookTypeCode = typeof PLAYBOOK_TYPES[number]["code"];

function getTypeConfig(code: string) {
  return PLAYBOOK_TYPES.find((t) => t.code === code) ?? PLAYBOOK_TYPES[0];
}

function getPlaceholder(type: PlaybookTypeCode): string {
  const map: Record<PlaybookTypeCode, string> = {
    difficult_conversation: "e.g. I need to tell a long-tenured team member that their attitude is affecting the team, but they're very sensitive to feedback…",
    performance_gap: "e.g. My developer has missed 3 sprint commitments in a row. I've had informal chats but nothing has changed…",
    delegation_breakdown: "e.g. I find myself redoing work my team submits because it's not up to standard. I'm working 60-hour weeks…",
    team_conflict: "e.g. Two of my senior engineers are barely speaking after a disagreement in a design review. The tension is affecting the whole team…",
    motivation_engagement: "e.g. My top performer has gone quiet, stopped volunteering for projects, and seems to be just going through the motions…",
    feedback_resistance: "e.g. Whenever I give feedback, my team member gets defensive and turns it back on me or the process…",
  };
  return map[type] ?? "Describe the situation in as much detail as you can…";
}

// ── Ask a Question (Guide) tab ────────────────────────────────────────────────

function AskTab() {
  const [activeSessId, setActiveSessId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions, refetch: refetchSessions } = trpc.mep.listGuideSessions.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.mep.getGuideMessages.useQuery(
    { sessionId: activeSessId! },
    { enabled: !!activeSessId }
  );

  const createSession = trpc.mep.createGuideSession.useMutation({
    onSuccess: (sess) => { setActiveSessId(sess.id); refetchSessions(); },
    onError: () => toast.error("Could not start a new session."),
  });

  const sendMessage = trpc.mep.sendGuideMessage.useMutation({
    onSuccess: () => { refetchMessages(); setSending(false); },
    onError: () => { toast.error("Could not send message."); setSending(false); },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex" style={{ height: "calc(100vh - 120px)" }}>
      {/* Session sidebar */}
      <div className="hidden md:flex flex-col w-56 flex-shrink-0 border-r" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
        <div className="px-3 py-3 border-b" style={{ borderColor: "oklch(90% 0.01 248.6)" }}>
          <Button size="sm" className="w-full font-semibold text-xs" style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
            onClick={() => { setActiveSessId(null); setInput(""); }}>
            <Plus size={13} className="mr-1.5" /> New Conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {sessions?.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: "oklch(60% 0.02 248.6)" }}>No conversations yet</p>
          )}
          {sessions?.map((s: any) => (
            <button key={s.id} onClick={() => setActiveSessId(s.id)}
              className={cn("w-full text-left px-3 py-2 rounded-lg text-xs transition-all", activeSessId === s.id ? "font-semibold" : "hover:bg-gray-50")}
              style={activeSessId === s.id
                ? { background: "oklch(from #34d399 l c h / 0.08)", color: "var(--color-ln-navy)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }
                : { color: "oklch(40% 0.02 248.6)" }}>
              <p className="truncate font-medium">{s.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "oklch(60% 0.02 248.6)" }}>{new Date(s.createdAt).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!activeSessId && (
            <div className="max-w-2xl mx-auto space-y-5 pt-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "oklch(from #34d399 l c h / 0.1)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}>
                  <MessageSquare size={22} style={{ color: "#34d399" }} />
                </div>
                <h2 className="text-base font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>What management challenge can I help you with?</h2>
                <p className="text-xs" style={{ color: "oklch(50% 0.02 248.6)" }}>AI management coach — trained on real-world management science and coaching frameworks.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((p) => (
                  <button key={p} onClick={() => handleSend(p)}
                    className="text-left px-3 py-2.5 rounded-xl text-xs transition-all hover:shadow-sm flex items-center gap-2"
                    style={{ background: "white", border: "1px solid oklch(88% 0.01 248.6)", color: "oklch(35% 0.02 248.6)" }}>
                    <ChevronRight size={11} style={{ color: "#34d399" }} className="flex-shrink-0" />{p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages?.map((msg: any) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed", msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm")}
                style={msg.role === "user"
                  ? { background: "var(--color-ln-navy)", color: "white" }
                  : { background: "white", color: "oklch(25% 0.02 248.6)", border: "1px solid oklch(90% 0.01 248.6)" }}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2"
                style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
                <Loader2 size={13} className="animate-spin" style={{ color: "#34d399" }} />
                <span className="text-xs" style={{ color: "oklch(55% 0.02 248.6)" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* Input */}
        <div className="px-4 py-3 border-t flex-shrink-0" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex gap-2 max-w-3xl mx-auto">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Describe your management challenge…"
              className="flex-1 resize-none text-sm min-h-[44px] max-h-32" rows={1} disabled={sending} />
            <Button size="icon" onClick={() => handleSend()} disabled={!input.trim() || sending}
              className="flex-shrink-0 h-11 w-11" style={{ background: "#34d399", color: "var(--color-ln-navy)" }}>
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </Button>
          </div>
          <p className="text-[10px] text-center mt-1.5" style={{ color: "oklch(65% 0.02 248.6)" }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

// ── Scenario Playbooks tab ────────────────────────────────────────────────────

type PlaybookView = "list" | "new" | "session";

function PlaybooksTab() {
  const [view, setView] = useState<PlaybookView>("list");
  const [situation, setSituation] = useState("");
  const [selectedType, setSelectedType] = useState<PlaybookTypeCode>("difficult_conversation");
  const [generating, setGenerating] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [reflectionData, setReflectionData] = useState({ whatHappened: "", whatWorked: "", whatDidnt: "", outcome: "" as "" | "win" | "partial" | "loss" | "unclear" });
  const [savingReflection, setSavingReflection] = useState(false);

  const { data: sessions, refetch } = trpc.mep.listPlaybookSessions.useQuery();

  const generateMutation = trpc.mep.generatePlaybook.useMutation({
    onSuccess: (data) => { setActiveSession(data); setView("session"); refetch(); setGenerating(false); },
    onError: () => { toast.error("Could not generate playbook. Please try again."); setGenerating(false); },
  });

  const getSession = trpc.mep.getPlaybookSession.useQuery(
    { id: activeSession?.id ?? 0 },
    { enabled: !!activeSession?.id && view === "session" }
  );

  const saveReflectionMutation = trpc.mep.savePlaybookReflection.useMutation({
    onSuccess: (data) => {
      setActiveSession((prev: any) => prev ? { ...prev, reflection: data.reflection } : prev);
      setSavingReflection(false);
      setShowReflectionForm(false);
      refetch();
      toast.success("Reflection saved. Coaching insight generated.");
    },
    onError: () => { toast.error("Could not save reflection."); setSavingReflection(false); },
  });

  const displaySession = getSession.data ?? activeSession;

  const handleGenerate = async () => {
    if (!situation.trim()) { toast.error("Please describe your situation."); return; }
    setGenerating(true);
    await generateMutation.mutateAsync({ situation: situation.trim(), playbookType: selectedType });
  };

  const handleSaveReflection = () => {
    if (!displaySession?.id) return;
    setSavingReflection(true);
    saveReflectionMutation.mutate({
      sessionId: displaySession.id,
      whatHappened: reflectionData.whatHappened || undefined,
      whatWorked: reflectionData.whatWorked || undefined,
      whatDidnt: reflectionData.whatDidnt || undefined,
      outcome: (reflectionData.outcome || "unclear") as "win" | "partial" | "loss" | "unclear",
    });
  };

  // ── List view ──
  if (view === "list") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>Scenario Playbooks</h2>
            <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>Situation-specific plays for your toughest management challenges</p>
          </div>
          <Button size="sm" className="font-semibold text-xs" style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
            onClick={() => { setSituation(""); setView("new"); }}>
            <Plus size={13} className="mr-1.5" /> New Play
          </Button>
        </div>

        {(!sessions || sessions.length === 0) && (
          <div className="rounded-2xl px-6 py-10 text-center" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
            <BookOpen size={28} className="mx-auto mb-3" style={{ color: "oklch(70% 0.01 248.6)" }} />
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Your playbook is empty</h3>
            <p className="text-xs mb-4" style={{ color: "oklch(55% 0.02 248.6)" }}>Choose a situation type and describe what's happening. Get a tailored play with scripts, actions, and coaching questions.</p>
            <Button size="sm" style={{ background: "#34d399", color: "var(--color-ln-navy)" }} onClick={() => setView("new")}>Create Your First Play</Button>
          </div>
        )}

        <div className="space-y-3">
          {sessions?.map((s: any) => {
            const typeCode = s.playbook?.playbookType ?? "";
            const typeConfig = getTypeConfig(typeCode);
            const Icon = typeConfig.icon;
            return (
              <button key={s.id} onClick={() => { setActiveSession(s); setView("session"); }}
                className="w-full text-left rounded-2xl p-4 border transition-all hover:shadow-sm"
                style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: typeConfig.bgAlpha, border: `1px solid ${typeConfig.borderAlpha}` }}>
                    <Icon size={14} style={{ color: typeConfig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: typeConfig.color }}>{typeConfig.label}</span>
                    <p className="text-sm font-medium truncate mt-0.5" style={{ color: "var(--color-ln-navy)" }}>{s.situation}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={10} style={{ color: "oklch(60% 0.02 248.6)" }} />
                      <span className="text-[10px]" style={{ color: "oklch(60% 0.02 248.6)" }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight size={13} style={{ color: "oklch(60% 0.02 248.6)" }} className="flex-shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── New play form ──
  if (view === "new") {
    const activeTypeConfig = getTypeConfig(selectedType);
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div>
          <button className="text-xs mb-3 flex items-center gap-1" style={{ color: "oklch(55% 0.02 248.6)" }} onClick={() => setView("list")}>← Back to Playbooks</button>
          <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>New Management Play</h2>
          <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>Choose the type of situation, then describe what's happening.</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>What kind of situation is this?</label>
          <div className="grid grid-cols-2 gap-2.5">
            {PLAYBOOK_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.code;
              return (
                <button key={type.code} onClick={() => setSelectedType(type.code)}
                  className="text-left rounded-xl p-3 border-2 transition-all"
                  style={isSelected ? { background: type.bgAlpha, borderColor: type.color } : { background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? type.bgAlpha : "oklch(95% 0.01 248.6)" }}>
                      <Icon size={12} style={{ color: isSelected ? type.color : "oklch(50% 0.02 248.6)" }} />
                    </div>
                    <span className="text-xs font-semibold leading-tight" style={{ color: isSelected ? type.color : "var(--color-ln-navy)" }}>{type.label}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: "oklch(50% 0.02 248.6)" }}>{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>Describe Your Situation</label>
            <Textarea value={situation} onChange={(e) => setSituation(e.target.value)}
              placeholder={getPlaceholder(selectedType)} className="text-sm min-h-[100px] resize-none" disabled={generating} />
            <p className="text-[10px] mt-1" style={{ color: "oklch(60% 0.02 248.6)" }}>The more specific you are, the more tailored the play will be.</p>
          </div>
          <Button className="w-full font-semibold" onClick={handleGenerate} disabled={generating || !situation.trim()}
            style={{ background: activeTypeConfig.color, color: "var(--color-ln-navy)" }}>
            {generating ? <><Loader2 size={14} className="mr-2 animate-spin" />Generating your play…</> : <>Generate {activeTypeConfig.label} Play <ChevronRight size={14} className="ml-1" /></>}
          </Button>
        </div>
      </div>
    );
  }

  // ── Session / play view ──
  if (view === "session" && displaySession) {
    const play = displaySession.playbook ?? {};
    const typeCode = play.playbookType ?? "";
    const typeConfig = getTypeConfig(typeCode);
    const Icon = typeConfig.icon;
    const hasReflection = !!(displaySession.reflection as any)?.reflectionInsight;

    const renderSection = (title: string, content: string | undefined, accent: string) => {
      if (!content) return null;
      return (
        <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: accent }}>{title}</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(25% 0.02 248.6)" }}>{content}</p>
        </div>
      );
    };

    const renderList = (title: string, items: string[] | undefined, accent: string, icon?: React.ReactNode) => {
      if (!items?.length) return null;
      return (
        <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>{title}</p>
          <ul className="space-y-2">
            {items.map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5">
                {icon ?? <CheckCircle2 size={13} style={{ color: accent }} className="mt-0.5 flex-shrink-0" />}
                <span className="text-sm leading-relaxed" style={{ color: "oklch(25% 0.02 248.6)" }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button className="text-xs flex items-center gap-1" style={{ color: "oklch(55% 0.02 248.6)" }} onClick={() => setView("list")}>← Back</button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: typeConfig.bgAlpha, border: `1px solid ${typeConfig.borderAlpha}` }}>
              <Icon size={13} style={{ color: typeConfig.color }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: typeConfig.color }}>{typeConfig.label}</span>
          </div>
          <button onClick={() => { setSituation(""); setSelectedType(typeCode as PlaybookTypeCode); setView("new"); }}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg"
            style={{ background: "oklch(from #34d399 l c h / 0.1)", color: "#059669" }}>
            <RotateCcw size={11} /> New Play
          </button>
        </div>

        {/* Headline */}
        {play.headline && (
          <div className="rounded-xl px-5 py-4" style={{ background: typeConfig.bgAlpha, border: `1px solid ${typeConfig.borderAlpha}` }}>
            <p className="text-base font-bold leading-snug" style={{ color: "var(--color-ln-navy)" }}>{play.headline}</p>
          </div>
        )}

        {renderSection("Diagnosis", play.diagnosis, typeConfig.color)}
        {renderList("Immediate Actions", play.immediateActions, "#34d399")}
        {renderSection("Conversation Script", play.conversationScript, "#60a5fa")}
        {renderList("Coaching Questions", play.coachingQuestions, "#a78bfa", <HelpCircle size={13} style={{ color: "#a78bfa" }} className="mt-0.5 flex-shrink-0" />)}
        {renderList("Success Indicators", play.successIndicators, "#34d399", <CircleDot size={13} style={{ color: "#34d399" }} className="mt-0.5 flex-shrink-0" />)}
        {renderList("Watch-outs", play.watchOuts, "#f87171", <XCircle size={13} style={{ color: "#f87171" }} className="mt-0.5 flex-shrink-0" />)}
        {renderSection("Manager Mindset", play.managerMindset, "#f59e0b")}

        {/* Reflection section */}
        {hasReflection ? (
          <div className="rounded-xl p-4 space-y-3" style={{ background: "oklch(from #a78bfa l c h / 0.06)", border: "1px solid oklch(from #a78bfa l c h / 0.2)" }}>
            <div className="flex items-center gap-2">
              <Trophy size={14} style={{ color: "#a78bfa" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a78bfa" }}>Coaching Insight</p>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "oklch(25% 0.02 248.6)" }}>
              {(displaySession.reflection as any)?.reflectionInsight}
            </p>
          </div>
        ) : (
          !showReflectionForm ? (
            <div className="rounded-xl p-4 flex items-center justify-between gap-3"
              style={{ background: "oklch(from #a78bfa l c h / 0.06)", border: "1px solid oklch(from #a78bfa l c h / 0.2)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: "#a78bfa" }} />
                <p className="text-xs" style={{ color: "oklch(40% 0.02 248.6)" }}>Reflect on this play to get a personalised coaching insight</p>
              </div>
              <button onClick={() => setShowReflectionForm(true)}
                className="text-xs font-semibold flex-shrink-0 px-3 py-1.5 rounded-lg"
                style={{ background: "#a78bfa", color: "white" }}>
                Add Reflection
              </button>
            </div>
          ) : (
            <div className="rounded-xl p-5 space-y-4" style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>How did it go?</p>
              {[
                { key: "whatHappened", label: "What happened?" },
                { key: "whatWorked", label: "What worked well?" },
                { key: "whatDidnt", label: "What didn't work?" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "oklch(45% 0.02 248.6)" }}>{label}</label>
                  <Textarea value={(reflectionData as any)[key]} onChange={(e) => setReflectionData((p) => ({ ...p, [key]: e.target.value }))}
                    className="text-sm resize-none" rows={2} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: "oklch(45% 0.02 248.6)" }}>Overall outcome</label>
                <div className="flex gap-2 flex-wrap">
                  {(["win", "partial", "loss", "unclear"] as const).map((o) => (
                    <button key={o} onClick={() => setReflectionData((p) => ({ ...p, outcome: o }))}
                      className="text-xs px-3 py-1.5 rounded-lg border-2 font-semibold capitalize transition-all"
                      style={reflectionData.outcome === o
                        ? { background: "#a78bfa", borderColor: "#a78bfa", color: "white" }
                        : { background: "white", borderColor: "oklch(85% 0.01 248.6)", color: "oklch(45% 0.02 248.6)" }}>
                      {o === "win" ? "🏆 Win" : o === "partial" ? "🤝 Partial" : o === "loss" ? "📉 Didn't work" : "🤔 Unclear"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 font-semibold" onClick={handleSaveReflection} disabled={savingReflection}
                  style={{ background: "#a78bfa", color: "white" }}>
                  {savingReflection ? <><Loader2 size={14} className="mr-2 animate-spin" />Saving…</> : <>Save & Get Coaching Insight</>}
                </Button>
                <Button variant="outline" onClick={() => setShowReflectionForm(false)}>Cancel</Button>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  return null;
}

// ── Main ManagerCoach component ───────────────────────────────────────────────

type CoachTab = "ask" | "playbooks";

export default function ManagerCoach() {
  const [activeTab, setActiveTab] = useState<CoachTab>("ask");

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Tab bar */}
      <div className="flex-shrink-0 border-b px-4" style={{ background: "white", borderColor: "oklch(90% 0.01 248.6)" }}>
        <div className="flex items-center gap-1 max-w-5xl mx-auto">
          {[
            { key: "ask" as CoachTab, label: "Ask a Question", icon: MessageSquare },
            { key: "playbooks" as CoachTab, label: "Scenario Playbooks", icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all"
              style={activeTab === key
                ? { borderColor: "#34d399", color: "var(--color-ln-navy)" }
                : { borderColor: "transparent", color: "oklch(55% 0.02 248.6)" }}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ask" ? <AskTab /> : <PlaybooksTab />}
      </div>
    </div>
  );
}
