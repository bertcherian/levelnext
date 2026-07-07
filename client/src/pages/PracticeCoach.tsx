import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Star,
  BookOpen,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  User,
  Bot,
  Pencil,
  CheckCircle,
  ArrowLeft,
  History,
  Zap,
  Shield,
  Award,
} from "lucide-react";
import type { PracticeScenario, PracticeMessage, PracticeFeedback } from "../../../drizzle/schema";

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | "home"
  | "coaching"
  | "scenario-setup"
  | "roleplay"
  | "feedback"
  | "history";

const SUGGESTION_CHIPS = [
  "Give feedback to a defensive team member",
  "Push back on an unrealistic deadline",
  "Pitch an idea to a senior executive",
  "Ask for a promotion",
  "Handle a difficult stakeholder",
  "Say no without damaging the relationship",
  "Prepare for a skip-level meeting",
  "Have an accountability conversation",
  "Present bad news to leadership",
  "Influence a peer without authority",
  "Handle a difficult client",
  "Reset expectations with a team member",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Hard: "bg-orange-100 text-orange-800 border-orange-200",
  Executive: "bg-purple-100 text-purple-800 border-purple-200",
};

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
};

// ── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen({
  onCoachFirst,
  onSimulateFirst,
  onHistory,
}: {
  onCoachFirst: (issue: string) => void;
  onSimulateFirst: (issue: string) => void;
  onHistory: () => void;
}) {
  const [issue, setIssue] = useState("");

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#12345A] text-white px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-[#F2B705]" />
              <span className="text-[#F2B705] text-sm font-semibold tracking-wide uppercase">AI Practice Coach</span>
            </div>
            <h1 className="text-2xl font-bold leading-tight">Practice leadership conversations<br />before they matter.</h1>
            <p className="text-blue-200 text-sm mt-1">Prepare for difficult feedback, stakeholder influence, executive presence, and more.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHistory}
            className="text-blue-200 hover:text-white hover:bg-white/10 gap-2 hidden sm:flex"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-[#12345A] mb-2">
            Describe your leadership situation
          </label>
          <Textarea
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="I need to give feedback to a senior team member who becomes defensive…"
            className="min-h-[100px] text-base border-gray-200 focus:border-[#12345A] resize-none"
          />
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => issue.trim() && onSimulateFirst(issue.trim())}
              disabled={!issue.trim()}
              className="flex-1 bg-[#12345A] hover:bg-[#0e2a47] text-white font-semibold h-11"
            >
              <Play className="h-4 w-4 mr-2" />
              Create Practice Simulation
            </Button>
            <Button
              onClick={() => issue.trim() && onCoachFirst(issue.trim())}
              disabled={!issue.trim()}
              variant="outline"
              className="flex-1 border-[#12345A] text-[#12345A] hover:bg-[#12345A]/5 font-semibold h-11"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Coach Me First
            </Button>
          </div>
        </div>

        {/* Suggestion chips */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Common leadership situations</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setIssue(chip)}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-[#12345A] hover:text-[#12345A] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { icon: MessageSquare, title: "AI Coaching", desc: "Structured questions to clarify the real issue" },
            { icon: Shield, title: "Safe Practice", desc: "Realistic avatar that pushes back like a real person" },
            { icon: Award, title: "Scored Feedback", desc: "Specific feedback with better phrases to use" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-4 border border-gray-100 text-center">
              <div className="w-10 h-10 rounded-full bg-[#12345A]/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="h-5 w-5 text-[#12345A]" />
              </div>
              <p className="text-sm font-semibold text-[#12345A]">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Coaching Screen ───────────────────────────────────────────────────────────
function CoachingScreen({
  sessionId,
  issueText,
  onScenarioReady,
  onBack,
}: {
  sessionId: number;
  issueText: string;
  onScenarioReady: (summary?: string) => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [input, setInput] = useState("");
  const [coachingSummary, setCoachingSummary] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.practice.sendCoachMessage.useMutation();

  // Auto-start with first coaching question
  useEffect(() => {
    if (autoStarted) return;
    setAutoStarted(true);
    setIsLoading(true);
    sendMessage.mutate(
      { sessionId, message: `I need help with: ${issueText}` },
      {
        onSuccess: (data) => {
          setMessages(data.messages);
          if (data.coachingSummary) setCoachingSummary(data.coachingSummary);
          setIsLoading(false);
        },
        onError: () => { setIsLoading(false); toast.error("Failed to start coaching session"); },
      }
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    setIsLoading(true);
    sendMessage.mutate(
      { sessionId, message: msg },
      {
        onSuccess: (data) => {
          setMessages(data.messages);
          if (data.coachingSummary) setCoachingSummary(data.coachingSummary);
          setIsLoading(false);
        },
        onError: () => { setIsLoading(false); toast.error("Failed to send message"); },
      }
    );
  };

  const cleanContent = (content: string) =>
    content.replace(/<COACHING_SUMMARY>[\s\S]*?<\/COACHING_SUMMARY>/g, "").trim();

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col">
      {/* Header */}
      <div className="bg-[#12345A] text-white px-6 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-blue-200 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#F2B705]" />
            <span className="font-semibold">Coach Me First</span>
          </div>
          <p className="text-blue-200 text-xs truncate max-w-sm">{issueText}</p>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-[#F2B705] flex items-center justify-center text-[#12345A] font-bold text-xs">1</div>
            <span className="text-[#F2B705] font-medium hidden sm:inline">Coach</span>
          </div>
          <div className="w-4 h-px bg-white/30" />
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">2</div>
            <span className="text-blue-200 hidden sm:inline">Setup</span>
          </div>
          <div className="w-4 h-px bg-white/30" />
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">3</div>
            <span className="text-blue-200 hidden sm:inline">Practice</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full">
        {messages.filter(m => m.role !== "user" || messages.indexOf(m) > 0).map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="w-8 h-8 rounded-full bg-[#12345A] flex items-center justify-center mr-2 mt-1 shrink-0">
                <Bot className="h-4 w-4 text-[#F2B705]" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#12345A] text-white rounded-br-sm"
                : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
            }`}>
              {msg.role === "user" ? msg.content : cleanContent(msg.content)}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-[#F2B705] flex items-center justify-center ml-2 mt-1 shrink-0">
                <User className="h-4 w-4 text-[#12345A]" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-[#12345A] flex items-center justify-center mr-2 shrink-0">
              <Bot className="h-4 w-4 text-[#F2B705]" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Coaching summary card */}
        {coachingSummary && (
          <div className="bg-[#12345A] text-white rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-[#F2B705]" />
              <span className="font-semibold text-sm">Coaching Summary</span>
            </div>
            <div className="space-y-2 text-sm text-blue-100">
              {coachingSummary.realIssue && <p><span className="text-white font-medium">Real issue:</span> {coachingSummary.realIssue}</p>}
              {coachingSummary.leadershipGap && <p><span className="text-white font-medium">Leadership gap:</span> {coachingSummary.leadershipGap}</p>}
              {coachingSummary.recommendedApproach && <p><span className="text-white font-medium">Approach:</span> {coachingSummary.recommendedApproach}</p>}
            </div>
            <Button
              onClick={() => onScenarioReady(JSON.stringify(coachingSummary))}
              className="mt-4 w-full bg-[#F2B705] hover:bg-[#d4a004] text-[#12345A] font-semibold"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Role Play
            </Button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!coachingSummary && (
        <div className="border-t bg-white px-4 py-3 max-w-3xl mx-auto w-full">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Your response…"
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-[#12345A] hover:bg-[#0e2a47] text-white h-11 px-4 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </div>
  );
}

// ── Scenario Setup Screen ─────────────────────────────────────────────────────
function ScenarioSetupScreen({
  sessionId,
  coachingSummary,
  onStartRolePlay,
  onBack,
}: {
  sessionId: number;
  coachingSummary?: string;
  onStartRolePlay: (attemptId: number) => void;
  onBack: () => void;
}) {
  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScenario, setEditedScenario] = useState<PracticeScenario | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const generateScenario = trpc.practice.generateScenario.useMutation();
  const updateScenario = trpc.practice.updateScenario.useMutation();
  const startAttempt = trpc.practice.startAttempt.useMutation();

  useEffect(() => {
    generateScenario.mutate(
      { sessionId, coachingSummary },
      {
        onSuccess: (data) => { setScenario(data.scenario); setEditedScenario(data.scenario); setIsGenerating(false); },
        onError: () => { setIsGenerating(false); toast.error("Failed to generate scenario"); },
      }
    );
  }, []);

  const handleSaveEdit = () => {
    if (!editedScenario) return;
    updateScenario.mutate(
      { sessionId, scenario: editedScenario },
      {
        onSuccess: () => { setScenario(editedScenario); setIsEditing(false); toast.success("Scenario updated"); },
        onError: () => toast.error("Failed to update scenario"),
      }
    );
  };

  const handleStart = () => {
    startAttempt.mutate(
      { sessionId },
      {
        onSuccess: (data) => onStartRolePlay(data.attemptId),
        onError: () => toast.error("Failed to start simulation"),
      }
    );
  };

  const DIFFICULTIES: Array<"Easy" | "Medium" | "Hard" | "Executive"> = ["Easy", "Medium", "Hard", "Executive"];

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#12345A] border-t-[#F2B705] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#12345A] font-semibold">Generating your simulation…</p>
          <p className="text-gray-500 text-sm mt-1">Creating a realistic scenario based on your situation</p>
        </div>
      </div>
    );
  }

  if (!scenario) return null;

  const s = isEditing ? editedScenario! : scenario;

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#12345A] text-white px-6 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-blue-200 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#F2B705]" />
            <span className="font-semibold">Simulation Setup</span>
          </div>
          <p className="text-blue-200 text-xs">Review and edit your scenario before starting</p>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">1</div>
            <span className="text-blue-200 hidden sm:inline">Coach</span>
          </div>
          <div className="w-4 h-px bg-white/30" />
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-[#F2B705] flex items-center justify-center text-[#12345A] font-bold text-xs">2</div>
            <span className="text-[#F2B705] font-medium hidden sm:inline">Setup</span>
          </div>
          <div className="w-4 h-px bg-white/30" />
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">3</div>
            <span className="text-blue-200 hidden sm:inline">Practice</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Scenario card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="bg-[#12345A]/5 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs border ${DIFFICULTY_COLORS[s.difficultyLevel]}`}>{s.difficultyLevel}</Badge>
              <span className="text-sm font-semibold text-[#12345A]">{s.conversationType}</span>
            </div>
            <button
              onClick={() => { setIsEditing(!isEditing); setEditedScenario(scenario); }}
              className="text-gray-400 hover:text-[#12345A] transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Your Role", value: s.userRole, field: "userRole" },
              { label: "Avatar Role", value: s.avatarRole, field: "avatarRole" },
              { label: "Relationship", value: s.relationship, field: "relationship" },
              { label: "Avatar Personality", value: s.avatarPersonality, field: "avatarPersonality" },
              { label: "Category", value: s.category, field: "category" },
            ].map(({ label, value, field }) => (
              <div key={field}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                {isEditing ? (
                  <input
                    value={(editedScenario as any)?.[field] ?? ""}
                    onChange={(e) => setEditedScenario(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#12345A]"
                  />
                ) : (
                  <p className="text-[#12345A] font-medium">{value}</p>
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div className="p-5 space-y-3 text-sm">
            {[
              { label: "Context", value: s.context, field: "context", multiline: true },
              { label: "Stakes", value: s.stakes, field: "stakes", multiline: true },
              { label: "Desired Outcome", value: s.desiredOutcome, field: "desiredOutcome", multiline: true },
              { label: "Success Criteria", value: s.successCriteria, field: "successCriteria", multiline: true },
            ].map(({ label, value, field, multiline }) => (
              <div key={field}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
                {isEditing ? (
                  <textarea
                    value={(editedScenario as any)?.[field] ?? ""}
                    onChange={(e) => setEditedScenario(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#12345A] resize-none"
                  />
                ) : (
                  <p className="text-gray-700">{value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Difficulty selector */}
          {isEditing && (
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Difficulty</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setEditedScenario(prev => prev ? { ...prev, difficultyLevel: d } : null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      editedScenario?.difficultyLevel === d
                        ? "border-[#12345A] bg-[#12345A] text-white"
                        : "border-gray-200 text-gray-600 hover:border-[#12345A]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isEditing ? (
          <div className="flex gap-3">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="flex-1 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateScenario.isPending}
              className="flex-1 bg-[#12345A] hover:bg-[#0e2a47] text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleStart}
            disabled={startAttempt.isPending}
            className="w-full bg-[#F2B705] hover:bg-[#d4a004] text-[#12345A] font-bold h-12 text-base"
          >
            {startAttempt.isPending ? (
              <div className="w-5 h-5 border-2 border-[#12345A] border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            Start Role Play
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Role Play Screen ──────────────────────────────────────────────────────────
function RolePlayScreen({
  sessionId,
  attemptId,
  onEndSimulation,
  onBack,
}: {
  sessionId: number;
  attemptId: number;
  onEndSimulation: (attemptId: number) => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [coachingNote, setCoachingNote] = useState<string | null>(null);
  const [isEndingSimulation, setIsEndingSimulation] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sessionQuery = trpc.practice.getSession.useQuery({ sessionId });
  const sendMessage = trpc.practice.sendRolePlayMessage.useMutation();
  const pauseForCoaching = trpc.practice.pauseForCoaching.useMutation();
  const endSimulation = trpc.practice.endSimulation.useMutation();

  const scenario = sessionQuery.data?.scenario as PracticeScenario | null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, coachingNote]);

  const handleSend = () => {
    if (!input.trim() || isLoading || isPaused) return;
    const msg = input.trim();
    setInput("");
    setIsLoading(true);
    sendMessage.mutate(
      { attemptId, message: msg },
      {
        onSuccess: (data) => {
          setMessages(data.transcript);
          setTurnCount(prev => prev + 1);
          setIsLoading(false);
        },
        onError: () => { setIsLoading(false); toast.error("Failed to send message"); },
      }
    );
  };

  const handlePauseForCoaching = () => {
    setIsPaused(true);
    pauseForCoaching.mutate(
      { attemptId },
      {
        onSuccess: (data) => setCoachingNote(data.coaching),
        onError: () => { setIsPaused(false); toast.error("Failed to get coaching"); },
      }
    );
  };

  const handleResume = () => {
    setIsPaused(false);
    setCoachingNote(null);
  };

  const handleEnd = () => {
    if (messages.length < 2) {
      toast.error("Have at least one exchange before ending");
      return;
    }
    setIsEndingSimulation(true);
    endSimulation.mutate(
      { attemptId },
      {
        onSuccess: () => onEndSimulation(attemptId),
        onError: () => { setIsEndingSimulation(false); toast.error("Failed to generate feedback"); },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col">
      {/* Header */}
      <div className="bg-[#12345A] text-white px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-blue-200 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          {scenario ? (
            <>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#F2B705] shrink-0" />
                <span className="font-semibold text-sm truncate">{scenario.avatarRole}</span>
                <Badge className={`text-xs border shrink-0 ${DIFFICULTY_COLORS[scenario.difficultyLevel]}`}>{scenario.difficultyLevel}</Badge>
              </div>
              <p className="text-blue-200 text-xs truncate">{scenario.conversationType} · {scenario.avatarPersonality}</p>
            </>
          ) : (
            <span className="font-semibold">Role Play</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-blue-200">{turnCount} turns</span>
          <Button
            onClick={handlePauseForCoaching}
            disabled={isLoading || isPaused || messages.length === 0}
            size="sm"
            variant="ghost"
            className="text-[#F2B705] hover:bg-white/10 text-xs gap-1.5 h-8"
          >
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
          <Button
            onClick={handleEnd}
            disabled={isEndingSimulation || messages.length < 2}
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white text-xs h-8"
          >
            {isEndingSimulation ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "End & Get Feedback"
            )}
          </Button>
        </div>
      </div>

      {/* Context banner */}
      {scenario && messages.length === 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 text-sm text-amber-800 max-w-3xl mx-auto w-full">
          <p className="font-medium mb-0.5">Scenario context</p>
          <p className="text-xs">{scenario.context}</p>
          <p className="text-xs mt-1 font-medium">Your goal: {scenario.desiredOutcome}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#12345A] flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-[#F2B705]" />
            </div>
            <p className="text-[#12345A] font-semibold">Start the conversation</p>
            <p className="text-gray-500 text-sm mt-1">Type your opening message to begin the role play</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "avatar" && (
              <div className="w-8 h-8 rounded-full bg-[#12345A] flex items-center justify-center mr-2 mt-1 shrink-0">
                <Bot className="h-4 w-4 text-[#F2B705]" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[#12345A] text-white rounded-br-sm"
                : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-[#F2B705] flex items-center justify-center ml-2 mt-1 shrink-0">
                <User className="h-4 w-4 text-[#12345A]" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="w-8 h-8 rounded-full bg-[#12345A] flex items-center justify-center mr-2 shrink-0">
              <Bot className="h-4 w-4 text-[#F2B705]" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Coaching pause overlay */}
        {isPaused && (
          <div className="bg-[#12345A] text-white rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-[#F2B705]" />
              <span className="font-semibold text-sm">Coach's Note</span>
            </div>
            {coachingNote ? (
              <>
                <p className="text-blue-100 text-sm leading-relaxed">{coachingNote}</p>
                <Button
                  onClick={handleResume}
                  className="mt-4 w-full bg-[#F2B705] hover:bg-[#d4a004] text-[#12345A] font-semibold"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Role Play
                </Button>
              </>
            ) : (
              <div className="flex gap-1 py-2">
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isPaused && (
        <div className="border-t bg-white px-4 py-3 max-w-3xl mx-auto w-full">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Your response in the conversation…"
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              disabled={isLoading || isEndingSimulation}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isEndingSimulation}
              className="bg-[#12345A] hover:bg-[#0e2a47] text-white h-11 px-4 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feedback Screen ───────────────────────────────────────────────────────────
function FeedbackScreen({
  attemptId,
  sessionId,
  onRetry,
  onNewSession,
  onHistory,
}: {
  attemptId: number;
  sessionId: number;
  onRetry: () => void;
  onNewSession: () => void;
  onHistory: () => void;
}) {
  const [reflection, setReflection] = useState("");
  const [actionCommitment, setActionCommitment] = useState("");
  const [saved, setSaved] = useState(false);

  const attemptQuery = trpc.practice.getAttempt.useQuery({ attemptId });
  const sessionQuery = trpc.practice.getSession.useQuery({ sessionId });
  const attemptsQuery = trpc.practice.getSessionAttempts.useQuery({ sessionId });
  const saveReflection = trpc.practice.saveReflection.useMutation();

  const attempt = attemptQuery.data;
  const scenario = sessionQuery.data?.scenario as PracticeScenario | null;
  const feedback = attempt?.feedback as PracticeFeedback | null;
  const allAttempts = attemptsQuery.data ?? [];

  if (!attempt || !feedback) {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#12345A] border-t-[#F2B705] rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = () => {
    saveReflection.mutate(
      { attemptId, reflection, actionCommitment },
      { onSuccess: () => setSaved(true) }
    );
  };

  const scoreColor = SCORE_COLOR(feedback.overallScore);

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#12345A] text-white px-6 py-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#F2B705]" />
            <span className="font-semibold">Feedback Report</span>
          </div>
          {scenario && <p className="text-blue-200 text-xs">{scenario.conversationType} · Attempt {attempt.attemptNumber}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onHistory} className="text-blue-200 hover:text-white gap-1.5">
          <History className="h-4 w-4" />
          History
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Overall score */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Overall Score</p>
          <div className={`text-6xl font-bold ${scoreColor} mb-1`}>{feedback.overallScore}</div>
          <p className="text-gray-400 text-sm">out of 100</p>
          <Progress value={feedback.overallScore} className="mt-3 h-2" />
        </div>

        {/* Dimension scores */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-[#12345A] mb-4 text-sm uppercase tracking-wide">Dimension Scores</h3>
          <div className="space-y-3">
            {feedback.dimensionScores.map((d) => (
              <div key={d.dimension}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{d.dimension}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= d.score ? "text-[#F2B705] fill-[#F2B705]" : "text-gray-200"}`}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{d.score}/5</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{d.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback sections */}
        {[
          { icon: CheckCircle, color: "text-emerald-600", label: "What Worked", content: feedback.whatWorked },
          { icon: Target, color: "text-red-500", label: "What Did Not Work", content: feedback.whatDidNotWork },
          { icon: Lightbulb, color: "text-amber-500", label: "Missed Opportunities", content: feedback.missedOpportunities },
          { icon: MessageSquare, color: "text-blue-500", label: "What the Other Person Heard", content: feedback.whatOtherPersonHeard },
          { icon: TrendingUp, color: "text-purple-500", label: "Where the Conversation Shifted", content: feedback.whereConversationShifted },
        ].map(({ icon: Icon, color, label, content }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <h3 className="font-semibold text-[#12345A] text-sm">{label}</h3>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{content}</p>
          </div>
        ))}

        {/* Stronger phrases */}
        {feedback.strongerPhrases.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-[#12345A]" />
              <h3 className="font-semibold text-[#12345A] text-sm">Stronger Phrases You Could Have Used</h3>
            </div>
            <div className="space-y-2">
              {feedback.strongerPhrases.map((phrase, i) => (
                <div key={i} className="bg-[#12345A]/5 rounded-lg px-3 py-2 text-sm text-[#12345A] italic">
                  "{phrase}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* One behaviour to improve */}
        <div className="bg-[#12345A] text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-[#F2B705]" />
            <h3 className="font-semibold text-sm">One Behaviour to Improve Next Time</h3>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">{feedback.oneBehaviourToImprove}</p>
        </div>

        {/* Real-world action */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm">Suggested Real-World Action</h3>
          </div>
          <p className="text-amber-700 text-sm leading-relaxed">{feedback.suggestedRealWorldAction}</p>
        </div>

        {/* Attempt progress */}
        {allAttempts.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-[#12345A] text-sm mb-3">Your Progress</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left pb-2">Attempt</th>
                    <th className="text-left pb-2">Score</th>
                    <th className="text-left pb-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttempts.filter(a => a.overallScore !== null).map((a, i, arr) => {
                    const prev = arr[i - 1];
                    const change = prev ? (a.overallScore ?? 0) - (prev.overallScore ?? 0) : null;
                    return (
                      <tr key={a.id} className="border-t border-gray-50">
                        <td className="py-2 text-gray-600">Attempt {a.attemptNumber}</td>
                        <td className={`py-2 font-semibold ${SCORE_COLOR(a.overallScore ?? 0)}`}>{a.overallScore}</td>
                        <td className="py-2">
                          {change !== null && (
                            <span className={change >= 0 ? "text-emerald-600" : "text-red-500"}>
                              {change >= 0 ? "+" : ""}{change}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reflection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-[#12345A] text-sm mb-3">Save Your Reflection</h3>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What did you learn from this practice?"
            className="min-h-[80px] text-sm mb-3 resize-none"
          />
          <Textarea
            value={actionCommitment}
            onChange={(e) => setActionCommitment(e.target.value)}
            placeholder="What will you do differently in the real conversation?"
            className="min-h-[80px] text-sm mb-3 resize-none"
          />
          <Button
            onClick={handleSave}
            disabled={saved || saveReflection.isPending}
            variant="outline"
            className="w-full border-[#12345A] text-[#12345A]"
          >
            {saved ? <><CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />Saved</> : "Save Reflection"}
          </Button>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          <Button
            onClick={onRetry}
            className="bg-[#12345A] hover:bg-[#0e2a47] text-white font-semibold"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Scenario
          </Button>
          <Button
            onClick={onNewSession}
            className="bg-[#F2B705] hover:bg-[#d4a004] text-[#12345A] font-semibold"
          >
            <Play className="h-4 w-4 mr-2" />
            New Practice
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Practice History Screen ───────────────────────────────────────────────────
function HistoryScreen({ onBack, onResume }: { onBack: () => void; onResume: (sessionId: number) => void }) {
  const historyQuery = trpc.practice.getHistory.useQuery();
  const data = historyQuery.data;

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      <div className="bg-[#12345A] text-white px-6 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-blue-200 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#F2B705]" />
            <span className="font-semibold">My Leadership Practice History</span>
          </div>
          <p className="text-blue-200 text-xs">Track your improvement over time</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {historyQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#12345A] border-t-[#F2B705] rounded-full animate-spin" />
          </div>
        ) : !data || data.sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#12345A]/10 flex items-center justify-center mx-auto mb-4">
              <History className="h-8 w-8 text-[#12345A]" />
            </div>
            <p className="text-[#12345A] font-semibold text-lg">No practice sessions yet</p>
            <p className="text-gray-500 text-sm mt-1">Complete your first simulation to see your history here</p>
            <Button onClick={onBack} className="mt-4 bg-[#12345A] text-white">Start Practising</Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Sessions", value: data.sessions.length, icon: BookOpen },
                { label: "Attempts", value: data.totalAttempts, icon: RotateCcw },
                { label: "Avg Score", value: data.averageScore ?? "—", icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                  <Icon className="h-5 w-5 text-[#12345A] mx-auto mb-1" />
                  <p className="text-2xl font-bold text-[#12345A]">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Session list */}
            <div className="space-y-3">
              {data.sessions.map((session) => {
                const scenario = session.scenario as PracticeScenario | null;
                const sessionAttempts = (data.attempts ?? []).filter(a => a.sessionId === session.id);
                const bestScore = sessionAttempts.reduce((max, a) => Math.max(max, a.overallScore ?? 0), 0);
                return (
                  <div key={session.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#12345A] truncate">
                          {scenario?.conversationType ?? "Practice Session"}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{session.issueText}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {scenario && (
                            <Badge className={`text-xs border ${DIFFICULTY_COLORS[scenario.difficultyLevel]}`}>
                              {scenario.difficultyLevel}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" />
                            {sessionAttempts.length} attempt{sessionAttempts.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {bestScore > 0 && (
                          <div className={`text-2xl font-bold ${SCORE_COLOR(bestScore)}`}>{bestScore}</div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResume(session.id)}
                          className="mt-1 text-xs border-[#12345A] text-[#12345A] h-7"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main PracticeCoach Component ──────────────────────────────────────────────
export default function PracticeCoach() {
  const [screen, setScreen] = useState<Screen>("home");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [issueText, setIssueText] = useState("");
  const [coachingSummary, setCoachingSummary] = useState<string | undefined>(undefined);

  const createSession = trpc.practice.createSession.useMutation();

  const handleCoachFirst = async (issue: string) => {
    setIssueText(issue);
    createSession.mutate(
      { issueText: issue },
      {
        onSuccess: (data) => { setSessionId(data.sessionId); setScreen("coaching"); },
        onError: () => toast.error("Failed to start session"),
      }
    );
  };

  const handleSimulateFirst = async (issue: string) => {
    setIssueText(issue);
    createSession.mutate(
      { issueText: issue },
      {
        onSuccess: (data) => { setSessionId(data.sessionId); setCoachingSummary(undefined); setScreen("scenario-setup"); },
        onError: () => toast.error("Failed to start session"),
      }
    );
  };

  const handleCoachingComplete = (summary?: string) => {
    setCoachingSummary(summary);
    setScreen("scenario-setup");
  };

  const handleStartRolePlay = (newAttemptId: number) => {
    setAttemptId(newAttemptId);
    setScreen("roleplay");
  };

  const handleEndSimulation = (endedAttemptId: number) => {
    setAttemptId(endedAttemptId);
    setScreen("feedback");
  };

  const handleRetry = () => {
    if (!sessionId) return;
    setScreen("scenario-setup");
  };

  const handleNewSession = () => {
    setSessionId(null);
    setAttemptId(null);
    setIssueText("");
    setCoachingSummary(undefined);
    setScreen("home");
  };

  const handleResumeSession = (resumeSessionId: number) => {
    setSessionId(resumeSessionId);
    setScreen("scenario-setup");
  };

  if (screen === "home") {
    return (
      <HomeScreen
        onCoachFirst={handleCoachFirst}
        onSimulateFirst={handleSimulateFirst}
        onHistory={() => setScreen("history")}
      />
    );
  }

  if (screen === "coaching" && sessionId) {
    return (
      <CoachingScreen
        sessionId={sessionId}
        issueText={issueText}
        onScenarioReady={handleCoachingComplete}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "scenario-setup" && sessionId) {
    return (
      <ScenarioSetupScreen
        sessionId={sessionId}
        coachingSummary={coachingSummary}
        onStartRolePlay={handleStartRolePlay}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "roleplay" && sessionId && attemptId) {
    return (
      <RolePlayScreen
        sessionId={sessionId}
        attemptId={attemptId}
        onEndSimulation={handleEndSimulation}
        onBack={() => setScreen("scenario-setup")}
      />
    );
  }

  if (screen === "feedback" && sessionId && attemptId) {
    return (
      <FeedbackScreen
        attemptId={attemptId}
        sessionId={sessionId}
        onRetry={handleRetry}
        onNewSession={handleNewSession}
        onHistory={() => setScreen("history")}
      />
    );
  }

  if (screen === "history") {
    return (
      <HistoryScreen
        onBack={() => setScreen("home")}
        onResume={handleResumeSession}
      />
    );
  }

  return null;
}
