/**
 * Next Chapter — Identity & Leadership OS
 *
 * The first-entry experience for new LevelNext users.
 * A conversational identity architecture journey across 6 stages and 16 modules.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  Send,
  Sparkles,
  CheckCircle2,
  Circle,
  Lock,
  FileText,
  RefreshCw,
  BookOpen,
  ArrowRight,
  FlaskConical,
  Lightbulb,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Stage / Module definitions (mirrors server) ─────────────────────────────
const STAGES = [
  { id: 1, name: "Discover",  modules: [1, 2],       color: "#D4AF37" },
  { id: 2, name: "Design",    modules: [3, 4, 5, 6, 7], color: "#4A90D9" },
  { id: 3, name: "Build",     modules: [8, 9],        color: "#5BA85A" },
  { id: 4, name: "Practice",  modules: [10, 11],      color: "#E07B39" },
  { id: 5, name: "Lead",      modules: [12, 13, 14],  color: "#9B59B6" },
  { id: 6, name: "Reflect",   modules: [15, 16],      color: "#E74C3C" },
];

const MODULE_NAMES: Record<number, string> = {
  1: "Understanding Today",
  2: "Enterprise Context",
  3: "Designing the Next Chapter",
  4: "Future Identity Blueprint",
  5: "Rewrite the Story",
  6: "Purpose",
  7: "Leadership Manifesto",
  8: "Capability Architecture",
  9: "Relationship Architecture",
  10: "Leadership Operating System",
  11: "Identity Experiments",
  12: "Executive Reputation",
  13: "Leadership Impact",
  14: "Legacy",
  15: "Transformation Dashboard",
  16: "Reflection Cycle",
};

const DELIVERABLE_NAMES: Record<number, string> = {
  1: "Current Identity Profile",
  2: "Future Leadership Context Map",
  3: "Next Chapter Vision",
  4: "Future Identity Blueprint",
  5: "Leadership Narrative",
  6: "Purpose Statement",
  7: "Leadership Manifesto",
  8: "Capability Architecture",
  9: "Relationship Investment Plan",
  10: "Leadership Operating System",
  11: "Identity Experiment Log",
  12: "Executive Reputation Strategy",
  13: "Leadership Impact Scorecard",
  14: "Legacy Statement",
  15: "Transformation Roadmap",
  16: "Monthly Reflection Journal",
};

// ─── Per-module example answers to help users who feel stuck ─────────────────
const MODULE_EXAMPLES: Record<number, string> = {
  1: "For 15 years I've been the person who fixes things fast — my bias for action has driven results. But I'm noticing it now stops me from listening deeply or letting my team lead. I jump in too quickly and solve problems they should be solving themselves.",
  2: "My company is moving from product-led to platform-led growth over the next three years. That means I need to shift from being a strong individual contributor to building ecosystems, influencing without authority, and thinking across business units — not just my own P&L.",
  3: "Three years from now I'm a VP leading a cross-functional transformation. I'm known for building leaders, not just delivering results. I'm in the room where strategy is set, not just where it's executed. I'm solving problems that span the organisation, not just my function.",
  4: "I need to shift from 'expert who has the answers' to 'leader who asks the right questions.' I need to become someone who is comfortable with ambiguity, who builds trust across functions, and who is seen as a strategic voice — not just a functional head.",
  5: "My limiting belief is: 'I'm not political enough to succeed at the next level.' But the truth is I've been confusing politics with influence. The rewrite is: I build genuine relationships and trust, and that is the most powerful form of influence.",
  6: "My purpose is to build leaders who build organisations that outlast them. Every leader I develop multiplies my impact. I'm not here to be the best leader in the room — I'm here to make the room full of great leaders.",
  7: "I believe leadership is a privilege, not a title. I commit to radical honesty, to developing others before myself, to making decisions I can defend publicly, and to leaving every team I lead stronger than I found it.",
  8: "My biggest capability gap is executive communication — I can think strategically but I struggle to land the message with the board. I also need to build my commercial acumen; I understand my function deeply but not the full P&L.",
  9: "I need to invest in three relationships: my CFO (I need her as an ally for budget decisions), a mentor two levels above me (I need a different perspective on my career), and two peers in other functions (I'm too siloed in my own team).",
  10: "I operate in reactive mode too often. My new operating system: Monday morning I set three priorities for the week and protect 90 minutes of deep thinking time daily. I delegate decisions below my level and only escalate when genuinely stuck.",
  11: "My experiment this week: In every meeting I will speak last, not first. I want to test whether my team makes better decisions when I hold back my view. I'll track what changes in the quality of discussion and whether they feel more ownership.",
  12: "I want to be known as the leader who builds other leaders. Currently I'm known as the person who delivers results — which is good — but I want my reputation to include: develops talent, thinks strategically, and is trusted across the organisation.",
  13: "In the last year my team's engagement score went from 62 to 78. Two people I developed got promoted. We delivered the platform migration six weeks early. But my impact on the broader organisation is still limited — I haven't influenced outside my function.",
  14: "I want to be remembered as someone who made the people around them better. Not for the projects I delivered, but for the leaders I built. I want the people who worked for me to say: working with them changed how I lead.",
  15: "My transformation roadmap has three tracks: capability (executive communication and commercial acumen), relationships (building my network two levels up), and visibility (presenting at the leadership forum quarterly). I'll review progress monthly.",
  16: "This month I made progress on listening before speaking — I can feel the difference in team meetings. What I'm still working on: I default to my old identity under pressure. When a project goes wrong I still jump in and fix it instead of coaching my team through it.",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  id?: number;
}

// ─── Generate a session ID ────────────────────────────────────────────────────
function generateSessionId(): string {
  return `nc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Stage Progress Sidebar ───────────────────────────────────────────────────
function StageSidebar({
  currentModule,
  completedModules,
  onSelectModule,
}: {
  currentModule: number;
  completedModules: number[];
  onSelectModule: (module: number) => void;
}) {
  const [expandedStage, setExpandedStage] = useState<number | null>(
    STAGES.find((s) => s.modules.includes(currentModule))?.id ?? 1
  );

  return (
    <div
      className="flex flex-col gap-1 py-4"
      style={{ background: "var(--color-ln-navy)" }}
    >
      <div className="px-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "var(--color-ln-yellow)" }} />
          <span className="text-xs font-semibold tracking-wider uppercase text-white/60">
            Journey Progress
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedModules.length / 16) * 100}%`,
                background: "var(--color-ln-yellow)",
              }}
            />
          </div>
          <span className="text-xs text-white/40">{completedModules.length}/16</span>
        </div>
      </div>

      {STAGES.map((stage) => {
        const isExpanded = expandedStage === stage.id;
        const stageCompleted = stage.modules.every((m) => completedModules.includes(m));
        const stageActive = stage.modules.includes(currentModule);
        const stageAccessible = stage.modules[0] <= currentModule || completedModules.includes(stage.modules[0] - 1) || stage.id === 1;

        return (
          <div key={stage.id}>
            {/* Stage header */}
            <button
              onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                stageActive ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{
                  background: stageCompleted ? stage.color : stageActive ? stage.color + "33" : "transparent",
                  border: `1.5px solid ${stageCompleted || stageActive ? stage.color : "rgba(255,255,255,0.2)"}`,
                  color: stageCompleted || stageActive ? stage.color : "rgba(255,255,255,0.4)",
                }}
              >
                {stageCompleted ? "✓" : stage.id}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold flex-1",
                  stageActive ? "text-white" : stageCompleted ? "text-white/70" : "text-white/40"
                )}
              >
                {stage.name}
              </span>
              <span className="text-white/30 text-[10px]">
                {stage.modules.filter((m) => completedModules.includes(m)).length}/{stage.modules.length}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-white/30" />
              ) : (
                <ChevronRight className="h-3 w-3 text-white/30" />
              )}
            </button>

            {/* Module list */}
            {isExpanded && (
              <div className="pl-4 pr-2 pb-1">
                {stage.modules.map((modNum) => {
                  const isCompleted = completedModules.includes(modNum);
                  const isCurrent = modNum === currentModule;
                  const isAccessible = modNum <= currentModule;

                  return (
                    <button
                      key={modNum}
                      onClick={() => isAccessible && onSelectModule(modNum)}
                      disabled={!isAccessible}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5",
                        isCurrent ? "bg-white/15" : isAccessible ? "hover:bg-white/8 cursor-pointer" : "cursor-not-allowed opacity-40"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: stage.color }} />
                      ) : isCurrent ? (
                        <div
                          className="h-3.5 w-3.5 rounded-full flex-shrink-0 animate-pulse"
                          style={{ background: stage.color }}
                        />
                      ) : isAccessible ? (
                        <Circle className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
                      ) : (
                        <Lock className="h-3 w-3 flex-shrink-0 text-white/20" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-[11px] font-medium truncate",
                            isCurrent ? "text-white" : isCompleted ? "text-white/60" : "text-white/40"
                          )}
                        >
                          {modNum}. {MODULE_NAMES[modNum]}
                        </div>
                        {(isCompleted || isCurrent) && (
                          <div className="text-[9px] text-white/30 truncate mt-0.5">
                            {DELIVERABLE_NAMES[modNum]}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Deliverable Card ─────────────────────────────────────────────────────────
function DeliverableCard({
  moduleNumber,
  content,
  deliverableType,
  onContinue,
}: {
  moduleNumber: number;
  content: Record<string, any>;
  deliverableType: string;
  onContinue: () => void;
}) {
  const stage = STAGES.find((s) => s.modules.includes(moduleNumber));

  return (
    <div
      className="rounded-2xl border p-5 my-4"
      style={{
        background: "var(--color-ln-navy)",
        borderColor: stage ? stage.color + "40" : "rgba(212,175,55,0.25)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4" style={{ color: stage?.color ?? "var(--color-ln-yellow)" }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: stage?.color ?? "var(--color-ln-yellow)" }}
        >
          {deliverableType}
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] border-white/20 text-white/50">
          Module {moduleNumber}
        </Badge>
      </div>

      {content.summary && (
        <p className="text-sm text-white/80 mb-4 leading-relaxed">{content.summary}</p>
      )}

      {content.identityStatement && (
        <div
          className="rounded-xl p-4 mb-4 text-sm font-medium text-white"
          style={{ background: (stage?.color ?? "#D4AF37") + "22", borderLeft: `3px solid ${stage?.color ?? "#D4AF37"}` }}
        >
          "{content.identityStatement}"
        </div>
      )}

      {content.vision && (
        <div
          className="rounded-xl p-4 mb-4 text-sm font-medium text-white"
          style={{ background: (stage?.color ?? "#D4AF37") + "22", borderLeft: `3px solid ${stage?.color ?? "#D4AF37"}` }}
        >
          "{content.vision}"
        </div>
      )}

      {content.purpose && (
        <div
          className="rounded-xl p-4 mb-4 text-sm font-medium text-white"
          style={{ background: (stage?.color ?? "#D4AF37") + "22", borderLeft: `3px solid ${stage?.color ?? "#D4AF37"}` }}
        >
          "{content.purpose}"
        </div>
      )}

      {content.keyInsights && Array.isArray(content.keyInsights) && content.keyInsights.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Key Insights</div>
          <ul className="space-y-1.5">
            {content.keyInsights.map((insight: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                <span style={{ color: stage?.color ?? "#D4AF37" }} className="mt-0.5 flex-shrink-0">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.experiment && (
        <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Identity Experiment</div>
          <p className="text-xs text-white/60 leading-relaxed">{content.experiment}</p>
        </div>
      )}

      <Button
        onClick={onContinue}
        className="w-full h-10 text-sm font-semibold"
        style={{ background: stage?.color ?? "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
      >
        Continue to Next Module
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NextChapter() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [currentModule, setCurrentModule] = useState(1);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState(() => generateSessionId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [deliverable, setDeliverable] = useState<{ content: Record<string, any>; deliverableType: string } | null>(null);
  const [showDeliverable, setShowDeliverable] = useState(false);
  const [isGeneratingDeliverable, setIsGeneratingDeliverable] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [currentExperiment, setCurrentExperiment] = useState<string | null>(null);
  const [experimentAcknowledged, setExperimentAcknowledged] = useState(false);
  const [showExperimentCard, setShowExperimentCard] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── tRPC hooks ──────────────────────────────────────────────────────────────
  const { data: profile, refetch: refetchProfile } = trpc.nextChapter.getProfile.useQuery(undefined, {
    staleTime: 0,
  });

  // Check if baseline ICA has been completed
  const { data: assessments, isLoading: assessmentsLoading } = trpc.nextChapter.getIdentityAssessments.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
  });

  const startSessionMutation = trpc.nextChapter.startSession.useMutation();
  const sendMessageMutation = trpc.nextChapter.sendMessage.useMutation();
  const generateDeliverableMutation = trpc.nextChapter.generateDeliverable.useMutation();
  const completeModuleMutation = trpc.nextChapter.completeModule.useMutation();
  const acknowledgeExperimentMutation = trpc.nextChapter.acknowledgeExperiment.useMutation();

  // ── ICA gate: redirect to assessment if no baseline found ───────────────────
  useEffect(() => {
    if (assessmentsLoading) return;
    if (!assessments) return;
    const hasBaseline = assessments.some((a) => a.assessmentType === "baseline");
    if (!hasBaseline) {
      navigate("/next-chapter/identity-assessment");
    }
  }, [assessments, assessmentsLoading]);

  // ── Load profile and initialise ─────────────────────────────────────────────
  useEffect(() => {
    if (profileLoaded) return;
    if (assessmentsLoading) return; // wait for ICA gate check first
    startSessionMutation.mutate(
      { moduleNumber: undefined },
      {
        onSuccess: (data) => {
          setCurrentModule(data.moduleNumber);
          setCompletedModules((data.profile?.completedModules as number[] | null) ?? []);
          setProfileLoaded(true);
          // Store experiment for this module
          if (data.experiment) {
            setCurrentExperiment(data.experiment);
            setExperimentAcknowledged(false);
            setShowExperimentCard(false);
          }
          // Show opening prompt as first assistant message
          if (messages.length === 0) {
            setMessages([
              {
                role: "assistant",
                content: data.openingPrompt,
              },
            ]);
          }
        },
      }
    );
  }, [profileLoaded]);

  // ── Auto-scroll to bottom ───────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showDeliverable]);

  // ── Handle module switch ────────────────────────────────────────────────────
  const handleSelectModule = useCallback(
    (modNum: number) => {
      if (modNum === currentModule) return;
      setCurrentModule(modNum);
      setSessionId(generateSessionId());
      setMessages([]);
      setDeliverable(null);
      setShowDeliverable(false);
      startSessionMutation.mutate(
        { moduleNumber: modNum },
        {
          onSuccess: (data) => {
            if (data.experiment) {
              setCurrentExperiment(data.experiment);
              setExperimentAcknowledged(false);
              setShowExperimentCard(false);
            }
            setMessages([{ role: "assistant", content: data.openingPrompt }]);
          },
        }
      );
    },
    [currentModule]
  );

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    setInputText("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsTyping(true);

    sendMessageMutation.mutate(
      { message: text, moduleNumber: currentModule, sessionId },
      {
        onSuccess: (data) => {
          setIsTyping(false);
          setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
          // After 3 user messages, surface the experiment card if not yet acknowledged
          const userMsgCount = messages.filter((m) => m.role === "user").length + 1;
          if (userMsgCount >= 3 && currentExperiment && !experimentAcknowledged) {
            setShowExperimentCard(true);
          }
        },
        onError: () => {
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "I'm sorry, I encountered an issue. Please try again." },
          ]);
        },
      }
    );
  }, [inputText, isTyping, currentModule, sessionId]);

  // ── Generate deliverable ────────────────────────────────────────────────────
  const handleGenerateDeliverable = useCallback(() => {
    setIsGeneratingDeliverable(true);
    generateDeliverableMutation.mutate(
      { moduleNumber: currentModule, sessionId },
      {
        onSuccess: (data) => {
          setIsGeneratingDeliverable(false);
          setDeliverable({ content: data.content as Record<string, any>, deliverableType: data.deliverableType ?? "" });
          setShowDeliverable(true);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I've generated your **${data.deliverableType}** based on our conversation. Review it below — this becomes part of your Next Chapter Portfolio.`,
            },
          ]);
        },
        onError: () => {
          setIsGeneratingDeliverable(false);
        },
      }
    );
  }, [currentModule, sessionId]);

  // ── Continue to next module ─────────────────────────────────────────────────
  const handleContinueToNext = useCallback(() => {
    completeModuleMutation.mutate(
      { moduleNumber: currentModule },
      {
        onSuccess: (data) => {
          setCompletedModules(data.completedModules as number[]);
          setShowDeliverable(false);
          setDeliverable(null);
          const nextMod = Math.min(currentModule + 1, 16);
          handleSelectModule(nextMod);
          refetchProfile();
        },
      }
    );
  }, [currentModule, handleSelectModule]);

  // ── Keyboard shortcut ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stage = STAGES.find((s) => s.modules.includes(currentModule));
  const moduleProgress = completedModules.length;
  const isModuleComplete = completedModules.includes(currentModule);
  const hasEnoughForDeliverable = messages.filter((m) => m.role === "user").length >= 3;

  return (
    <PlatformLayout>
      <div className="flex h-full min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        {/* ── Left: Stage/Module Progress Sidebar ── */}
        <div
          className="hidden lg:flex flex-col w-56 flex-shrink-0 overflow-y-auto border-r"
          style={{
            background: "var(--color-ln-navy)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <StageSidebar
            currentModule={currentModule}
            completedModules={completedModules}
            onSelectModule={handleSelectModule}
          />

          {/* Portfolio link */}
          <div className="mt-auto p-4 border-t border-white/10">
            <button
              onClick={() => navigate("/next-chapter/portfolio")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium">My Portfolio</span>
              <span
                className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                {moduleProgress}
              </span>
            </button>
          </div>
        </div>

        {/* ── Right: Chat Interface ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0"
            style={{
              background: "var(--color-ln-navy)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: (stage?.color ?? "#D4AF37") + "22", border: `1.5px solid ${stage?.color ?? "#D4AF37"}` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: stage?.color ?? "#D4AF37" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Next Chapter</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: (stage?.color ?? "#D4AF37") + "22", color: stage?.color ?? "#D4AF37" }}
                >
                  {stage?.name ?? "Discover"} · Stage {stage?.id ?? 1}
                </span>
              </div>
              <div className="text-xs text-white/40 truncate">
                Module {currentModule}: {MODULE_NAMES[currentModule]}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Generate deliverable button */}
              {!isModuleComplete && hasEnoughForDeliverable && !showDeliverable && (
                <Button
                  size="sm"
                  onClick={handleGenerateDeliverable}
                  disabled={isGeneratingDeliverable}
                  className="h-8 text-xs font-semibold"
                  style={{ background: stage?.color ?? "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                >
                  {isGeneratingDeliverable ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <FileText className="mr-1.5 h-3 w-3" />
                      Generate {DELIVERABLE_NAMES[currentModule]}
                    </>
                  )}
                </Button>
              )}
              {isModuleComplete && (
                <Badge
                  className="text-[10px] font-semibold"
                  style={{ background: (stage?.color ?? "#D4AF37") + "22", color: stage?.color ?? "#D4AF37", border: `1px solid ${stage?.color ?? "#D4AF37"}40` }}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5"
                    style={{
                      background: (stage?.color ?? "#D4AF37") + "22",
                      border: `1.5px solid ${stage?.color ?? "#D4AF37"}`,
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" style={{ color: stage?.color ?? "#D4AF37" }} />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm"
                  )}
                  style={
                    msg.role === "user"
                      ? { background: "var(--color-ln-navy)", color: "white" }
                      : { background: "white", color: "#1C1C1C", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  }
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-white" style={{ color: "white" }}>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5"
                  style={{
                    background: (stage?.color ?? "#D4AF37") + "22",
                    border: `1.5px solid ${stage?.color ?? "#D4AF37"}`,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: stage?.color ?? "#D4AF37" }} />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                >
                  <div className="flex gap-1 items-center h-5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{
                          background: stage?.color ?? "#D4AF37",
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Experiment Commitment Card */}
            {showExperimentCard && currentExperiment && !experimentAcknowledged && (
              <div
                className="rounded-2xl border p-5 my-2"
                style={{ background: "var(--color-ln-navy)", borderColor: (stage?.color ?? "#D4AF37") + "40" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <FlaskConical className="h-4 w-4" style={{ color: stage?.color ?? "#D4AF37" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: stage?.color ?? "#D4AF37" }}>
                    Identity Experiment
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-4">{currentExperiment}</p>
                <p className="text-xs text-white/40 mb-4">
                  This is not homework — it is an identity test. Come back next session and tell me what happened.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setExperimentAcknowledged(true);
                    setShowExperimentCard(false);
                    acknowledgeExperimentMutation.mutate({ moduleNumber: currentModule });
                  }}
                  className="h-8 text-xs font-semibold"
                  style={{ background: stage?.color ?? "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                >
                  I'll do it
                  <CheckCircle2 className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Deliverable card */}
            {showDeliverable && deliverable && (
              <DeliverableCard
                moduleNumber={currentModule}
                content={deliverable.content}
                deliverableType={deliverable.deliverableType}
                onContinue={handleContinueToNext}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            className="flex-shrink-0 px-4 py-4 border-t"
            style={{ background: "white", borderColor: "rgba(0,0,0,0.08)" }}
          >
                        {/* Current question prompt — always visible above the input */}
            {(() => {
              const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
              const rawText = lastAssistant?.content ?? `Module ${currentModule}: ${MODULE_NAMES[currentModule]} — share your thoughts to begin.`;
              const lines = rawText.replace(/\*\*/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
              const promptText = lines[lines.length - 1] ?? rawText;
              const exampleText = MODULE_EXAMPLES[currentModule];
              return (
                <div className="mb-3">
                  <div
                    className="px-3 py-2.5 rounded-xl flex items-start gap-2"
                    style={{
                      background: (stage?.color ?? "#D4AF37") + "12",
                      border: `1px solid ${stage?.color ?? "#D4AF37"}30`,
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: stage?.color ?? "#D4AF37" }} />
                    <span className="text-xs leading-relaxed flex-1" style={{ color: "#1C1C1C" }}>
                      {promptText}
                    </span>
                    {exampleText && (
                      <button
                        onClick={() => setShowExample((v) => !v)}
                        className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1 transition-all"
                        style={{
                          background: showExample ? (stage?.color ?? "#D4AF37") : (stage?.color ?? "#D4AF37") + "20",
                          color: showExample ? "white" : stage?.color ?? "#D4AF37",
                        }}
                        title="See a sample answer for inspiration"
                      >
                        <Lightbulb className="h-2.5 w-2.5" />
                        {showExample ? "Hide" : "Example"}
                      </button>
                    )}
                  </div>
                  {/* Example answer panel */}
                  {showExample && exampleText && (
                    <div
                      className="mt-2 px-3 py-2.5 rounded-xl text-xs leading-relaxed"
                      style={{
                        background: "#2D2200",
                        border: `1px solid ${stage?.color ?? "#D4AF37"}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="h-3 w-3" style={{ color: stage?.color ?? "#D4AF37" }} />
                        <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: stage?.color ?? "#D4AF37" }}>Sample answer for inspiration</span>
                        <button onClick={() => setShowExample(false)} className="ml-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p style={{ color: "#F5E6B0", lineHeight: "1.6" }}>{exampleText}</p>
                      <p className="mt-1.5 text-[10px] italic" style={{ color: "rgba(255,255,255,0.4)" }}>This is just an example — your answer will be unique to your journey.</p>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts here — be honest and specific…"
                className="flex-1 min-h-[64px] max-h-[140px] resize-none rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-offset-0"
                style={{
                  background: "white",
                  border: `2px solid ${stage?.color ?? "#D4AF37"}`,
                  color: "#1C1C1C",
                  boxShadow: `0 0 0 3px ${(stage?.color ?? "#D4AF37")}18`,
                } as React.CSSProperties}
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                className="h-[52px] w-[52px] rounded-xl flex-shrink-0 p-0"
                style={{
                  background: inputText.trim() && !isTyping ? (stage?.color ?? "var(--color-ln-yellow)") : "rgba(0,0,0,0.08)",
                  color: inputText.trim() && !isTyping ? "var(--color-ln-navy)" : "rgba(0,0,0,0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {/* Character counter + progress nudge */}
            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>
                Press Enter to send · Shift+Enter for new line
              </p>
              <div className="flex items-center gap-2">
                {inputText.length > 0 && (
                  <span
                    className="text-[10px] font-medium"
                    style={{
                      color: inputText.length < 80
                        ? "#E07B39"
                        : inputText.length < 200
                        ? "#D4AF37"
                        : "#5BA85A",
                    }}
                  >
                    {inputText.length < 80
                      ? `${inputText.length} chars — try to add more detail`
                      : inputText.length < 200
                      ? `${inputText.length} chars — good, keep going`
                      : `${inputText.length} chars — great depth ✔`}
                  </span>
                )}
                {inputText.length === 0 && (
                  <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.25)" }}>Aim for 2–3 sentences</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
