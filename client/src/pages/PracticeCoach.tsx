import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageSquare,
  Play,
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
  CheckCircle,
  ArrowLeft,
  History,
  Zap,
  Shield,
  Award,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  Pencil,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Brain,
  Sparkles,
  Lock,
  Send,
  Pause,
  LayoutDashboard,
  ListChecks,
  Settings,
} from "lucide-react";
import type {
  PracticeScenario,
  PracticeMessage,
  PracticeFeedback,
  BeforeMeetingBriefData,
  AfterMeetingDebriefData,
  ImprovedMessageData,
  ConversationScriptData,
  GrowthPlanData,
} from "../../../drizzle/schema";

// ── Types ─────────────────────────────────────────────────────────────────────
type Screen =
  | "home"
  | "coaching"
  | "scenario-setup"
  | "roleplay"
  | "feedback"
  | "history"
  | "before-meeting-form"
  | "before-meeting-brief"
  | "after-meeting-form"
  | "after-meeting-debrief"
  | "say-it-better"
  | "script-builder"
  | "growth-profile"
  | "coach-brief"
  | "privacy-settings"
  | "create-commitment"
  | "practice-plan";

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

const SCRIPT_TYPES = [
  "Give difficult feedback",
  "Have an accountability conversation",
  "Push back on an unrealistic request",
  "Ask for a promotion or raise",
  "Address a performance issue",
  "Influence without authority",
  "Pitch a strategic idea",
  "Navigate a conflict between team members",
  "Reset a relationship after a difficult moment",
  "Say no professionally",
  "Deliver bad news",
  "Align a resistant stakeholder",
  "Request resources or budget",
  "Have a skip-level conversation",
  "Address a trust breakdown",
];

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
};

const DEBRIEF_QUESTIONS = [
  "What was the purpose of this conversation and what outcome were you hoping for?",
  "How did the conversation actually go? What happened?",
  "What was the moment the conversation shifted — positively or negatively?",
  "What did you handle well?",
  "What would you do differently?",
  "What do you think the other person heard vs what you intended?",
];

// ── Shared Back Button ────────────────────────────────────────────────────────
function BackButton({ onBack, label = "Back" }: { onBack: () => void; label?: string }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm text-[var(--color-ln-navy)]/60 hover:text-[var(--color-ln-navy)] transition-colors mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded hover:bg-gray-100 transition-colors" title="Copy">
      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, children, accent = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'border-[var(--color-ln-gold)]/30 bg-[var(--color-ln-gold)]/5' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accent ? 'text-[var(--color-ln-gold)]' : 'text-[var(--color-ln-navy)]'}`} />
        <span className="text-sm font-semibold text-[var(--color-ln-navy)]">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Score Badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : score >= 60 ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {label && <span className="opacity-70">{label}</span>}
      {score}/10
    </span>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen({
  onCoachFirst,
  onSimulateFirst,
  onBeforeMeeting,
  onAfterMeeting,
  onSayItBetter,
  onScriptBuilder,
  onHistory,
  onCreateCommitment,
  onPracticePlan,
}: {
  onCoachFirst: (issue: string) => void;
  onSimulateFirst: (issue: string) => void;
  onBeforeMeeting: () => void;
  onAfterMeeting: () => void;
  onSayItBetter: () => void;
  onScriptBuilder: () => void;
  onHistory: () => void;
  onCreateCommitment: () => void;
  onPracticePlan: () => void;
}) {
  const [issue, setIssue] = useState("");
  const [showAllChips, setShowAllChips] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  const LEADERSHIP_TOPICS = [
    "Executive Presence",
    "Stakeholder Influence",
    "Difficult Conversations",
    "Strategic Communication",
    "Managing Up",
    "Cross-Cultural Leadership",
    "Conflict Resolution",
    "Giving Feedback",
    "Negotiation",
    "Change Leadership",
    "Team Alignment",
    "Accountability",
    "Resilience & Composure",
    "Coaching & Developing Others",
    "Influence Without Authority",
  ];

  const { data: memory } = trpc.leadershipCoach.getMemory.useQuery();
  const { data: commitments } = trpc.leadershipCoach.getCommitments.useQuery();
  const { data: recommendations } = trpc.leadershipCoach.getPersonalisedRecommendations.useQuery();
  const [refreshedRecs, setRefreshedRecs] = useState<Array<{ module: string; score: number; reason: string; scenarios: string[] }> | null>(null);
  const refreshRecs = trpc.leadershipCoach.refreshRecommendations.useMutation({
    onSuccess: (data) => { if (data && data.length > 0) { setRefreshedRecs(data); toast.success('Fresh suggestions generated!'); } else { toast.error('No suggestions returned. Try again.'); } },
    onError: () => toast.error('Could not refresh suggestions. Try again.'),
  });
  const activeRecs = refreshedRecs ?? recommendations;

  // Close dropdown on outside click
  useEffect(() => {
    if (!topicDropdownOpen) return;
    const handler = () => setTopicDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [topicDropdownOpen]);

  const pendingCommitments = commitments?.filter(c => c.status === 'pending').slice(0, 3) ?? [];

  const MODE_BUTTONS = [
    {
      id: 'coach-first',
      icon: Brain,
      label: 'Coach Me First',
      sub: 'Understand the real issue before practising',
      color: 'bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90',
      onClick: () => issue.trim() ? onCoachFirst(issue.trim()) : toast.error('Describe your situation first'),
    },
    {
      id: 'simulate',
      icon: Play,
      label: 'Practice Simulation',
      sub: 'Jump straight into a role-play scenario',
      color: 'bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-gold)]/90',
      onClick: () => issue.trim() ? onSimulateFirst(issue.trim()) : toast.error('Describe your situation first'),
    },
    {
      id: 'before-meeting',
      icon: Calendar,
      label: 'Before-Meeting Brief',
      sub: 'Prepare for an important conversation',
      color: 'bg-white border border-[var(--color-ln-navy)]/20 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/5',
      onClick: onBeforeMeeting,
    },
    {
      id: 'after-meeting',
      icon: FileText,
      label: 'After-Meeting Debrief',
      sub: 'Reflect and extract lessons from a real conversation',
      color: 'bg-white border border-[var(--color-ln-navy)]/20 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/5',
      onClick: onAfterMeeting,
    },
    {
      id: 'say-it-better',
      icon: Sparkles,
      label: 'Say It Better',
      sub: 'Improve a message or reframe what you want to say',
      color: 'bg-white border border-[var(--color-ln-navy)]/20 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/5',
      onClick: onSayItBetter,
    },
    {
      id: 'script-builder',
      icon: BookOpen,
      label: 'Conversation Script',
      sub: 'Build a script for a specific conversation type',
      color: 'bg-white border border-[var(--color-ln-navy)]/20 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/5',
      onClick: onScriptBuilder,
    },
    {
      id: 'create-commitment',
      icon: ListChecks,
      label: 'Create a Practice Commitment',
      sub: 'Turn a real situation into a specific behavioural commitment',
      color: 'bg-white border border-[var(--color-ln-navy)]/20 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/5',
      onClick: onCreateCommitment,
    },
    {
      id: 'practice-plan',
      icon: LayoutDashboard,
      label: 'My Practice Plan',
      sub: 'Your development priorities, commitments, and progress',
      color: 'bg-white border border-[var(--color-ln-navy)]/20 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/5',
      onClick: onPracticePlan,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--color-ln-gold)]" />
            <h1 className="text-xl font-bold text-[var(--color-ln-navy)]">AI Practice Coach</h1>
          </div>
          <button
            onClick={onHistory}
            className="flex items-center gap-1.5 text-xs text-[var(--color-ln-navy)]/60 hover:text-[var(--color-ln-navy)] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
        </div>
        <p className="text-sm text-[var(--color-ln-navy)]/60">
          Your private leadership practice space. Everything here is confidential.
        </p>
      </div>

      {/* Memory Banner */}
      {memory?.aiSummary && (
        <div className="mb-6 rounded-xl bg-[var(--color-ln-navy)]/5 border border-[var(--color-ln-navy)]/10 p-4">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-[var(--color-ln-navy)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-0.5">Your Leadership Memory</p>
              <p className="text-xs text-[var(--color-ln-navy)]/70 leading-relaxed">{memory.aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Issue Input */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">
          What leadership situation do you want to work on?
        </label>
        <Textarea
          value={issue}
          onChange={e => setIssue(e.target.value)}
          placeholder="e.g. I need to give difficult feedback to a senior team member who is defensive and dismisses my concerns..."
          className="min-h-[90px] text-sm resize-none border-gray-200 focus:border-[var(--color-ln-navy)] focus:ring-[var(--color-ln-navy)]/20"
        />
      </div>

      {/* Suggestion Chips — Collapsed by default */}
      {showAllChips && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Or choose a common scenario:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => { setIssue(chip); setShowAllChips(false); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  issue === chip
                    ? 'bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]'
                    : 'bg-white text-[var(--color-ln-navy)]/70 border-gray-200 hover:border-[var(--color-ln-navy)]/40 hover:text-[var(--color-ln-navy)]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode Buttons — 2 primary only, others in dropdown */}
      {/* Primary action buttons — Coach Me First + Practice Simulation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {MODE_BUTTONS.slice(0, 2).map(btn => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all active:scale-[0.98] ${btn.color}`}
          >
            <btn.icon className="w-5 h-5 flex-shrink-0" style={{color: 'inherit'}} />
            <div>
              <p className="text-sm font-semibold" style={{color: 'inherit'}}>{btn.label}</p>
              <p className="text-xs mt-0.5" style={{color: 'inherit', opacity: 0.75}}>{btn.sub}</p>
            </div>
          </button>
        ))}
      </div>
      {/* Secondary action buttons — all others */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {MODE_BUTTONS.slice(2).map(btn => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all active:scale-[0.98] ${btn.color}`}
          >
            <btn.icon className="w-4 h-4 flex-shrink-0" style={{color: 'inherit'}} />
            <div>
              <p className="text-sm font-medium" style={{color: 'inherit'}}>{btn.label}</p>
              <p className="text-xs mt-0.5" style={{color: 'inherit', opacity: 0.65}}>{btn.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Pending Commitments */}
      {pendingCommitments.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[var(--color-ln-gold)]" />
            Open Commitments
          </p>
          <div className="space-y-2">
            {pendingCommitments.map(c => (
              <div key={c.id} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic Recommendations */}
      {activeRecs && activeRecs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--color-ln-navy)] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[var(--color-ln-gold)]" />
              Recommended Practice (based on your diagnostics)
            </p>
            <div className="flex items-center gap-1.5">
              {/* Topic dropdown */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setTopicDropdownOpen(o => !o)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTopic
                      ? 'bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]'
                      : 'border-gray-200 text-gray-500 hover:text-[var(--color-ln-navy)] hover:border-[var(--color-ln-navy)]/30'
                  }`}
                >
                  {selectedTopic || 'All Topics'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {topicDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedTopic(''); setTopicDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                        !selectedTopic ? 'font-semibold text-[var(--color-ln-navy)]' : 'text-gray-600'
                      }`}
                    >
                      All Topics (diagnostic-based)
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {LEADERSHIP_TOPICS.map(t => (
                      <button
                        key={t}
                        onClick={() => { setSelectedTopic(t); setTopicDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          selectedTopic === t ? 'font-semibold text-[var(--color-ln-navy)]' : 'text-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Refresh button */}
              <button
                onClick={() => refreshRecs.mutate({ topic: selectedTopic || undefined })}
                disabled={refreshRecs.isPending}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-[var(--color-ln-navy)] hover:border-[var(--color-ln-navy)]/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${refreshRecs.isPending ? 'animate-spin' : ''}`} />
                {refreshRecs.isPending ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {activeRecs.map(rec => (
              <div key={rec.module} className="p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[var(--color-ln-navy)]">{rec.module}</p>
                  <span className="text-xs text-gray-400">Edge {rec.score}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{rec.reason}</p>
                <div className="flex flex-wrap gap-1.5">
                  {rec.scenarios.slice(0, 2).map(s => (
                    <button
                      key={s}
                      onClick={() => setIssue(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-ln-navy)]/5 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Before-Meeting Form Screen ────────────────────────────────────────────────
function BeforeMeetingFormScreen({
  onBack,
  onBriefGenerated,
}: {
  onBack: () => void;
  onBriefGenerated: (briefId: number, brief: BeforeMeetingBriefData) => void;
}) {
  const [form, setForm] = useState({
    meetingWith: '',
    purpose: '',
    desiredOutcome: '',
    currentIssue: '',
    stakes: '',
    possibleResistance: '',
    readinessBefore: 5,
  });

  const generateBrief = trpc.leadershipCoach.generateBrief.useMutation({
    onSuccess: (data) => onBriefGenerated(data.briefId, data.brief),
    onError: () => toast.error('Failed to generate brief. Please try again.'),
  });

  const STAKES_OPTIONS = ['Low', 'Medium', 'High', 'Career-defining'];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Practice Coach" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Before-Meeting Brief</h2>
        </div>
        <p className="text-sm text-gray-500">Tell me about the conversation you are preparing for.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">Who are you meeting with? *</label>
          <Input
            value={form.meetingWith}
            onChange={e => setForm(f => ({ ...f, meetingWith: e.target.value }))}
            placeholder="e.g. My VP of Engineering, a difficult client, the CEO"
            className="border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">What is the purpose of this meeting? *</label>
          <Textarea
            value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="e.g. I need to address a performance issue with a team member who has been missing deadlines"
            className="min-h-[80px] text-sm resize-none border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">What is your desired outcome?</label>
          <Textarea
            value={form.desiredOutcome}
            onChange={e => setForm(f => ({ ...f, desiredOutcome: e.target.value }))}
            placeholder="e.g. I want them to acknowledge the issue and commit to a specific improvement plan"
            className="min-h-[70px] text-sm resize-none border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">What is the current issue or tension?</label>
          <Textarea
            value={form.currentIssue}
            onChange={e => setForm(f => ({ ...f, currentIssue: e.target.value }))}
            placeholder="e.g. They have missed 3 deadlines this quarter and are defensive when I raise it"
            className="min-h-[70px] text-sm resize-none border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">What are the stakes?</label>
          <div className="flex gap-2 flex-wrap">
            {STAKES_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setForm(f => ({ ...f, stakes: s }))}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  form.stakes === s
                    ? 'bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]'
                    : 'bg-white text-[var(--color-ln-navy)]/70 border-gray-200 hover:border-[var(--color-ln-navy)]/40'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">What resistance do you expect?</label>
          <Textarea
            value={form.possibleResistance}
            onChange={e => setForm(f => ({ ...f, possibleResistance: e.target.value }))}
            placeholder="e.g. They will likely say they have been overloaded and that the deadlines were unrealistic"
            className="min-h-[70px] text-sm resize-none border-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">
            How ready do you feel right now? <span className="text-[var(--color-ln-gold)] font-bold">{form.readinessBefore}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={form.readinessBefore}
            onChange={e => setForm(f => ({ ...f, readinessBefore: Number(e.target.value) }))}
            className="w-full accent-[var(--color-ln-gold)]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Not ready at all</span>
            <span>Fully prepared</span>
          </div>
        </div>

        <Button
          onClick={() => generateBrief.mutate(form)}
          disabled={!form.meetingWith || !form.purpose || generateBrief.isPending}
          className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 h-11"
        >
          {generateBrief.isPending ? (
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Generating your brief...</span>
          ) : (
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Generate My Brief</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Before-Meeting Brief Output Screen ───────────────────────────────────────
function BeforeMeetingBriefScreen({
  briefId,
  brief,
  onBack,
  onPractice,
}: {
  briefId: number;
  brief: BeforeMeetingBriefData;
  onBack: () => void;
  onPractice: (issue: string) => void;
}) {
  const [readinessAfter, setReadinessAfter] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const updateReadiness = trpc.leadershipCoach.updateBriefReadiness.useMutation({
    onSuccess: () => setSaved(true),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="New Brief" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Your Meeting Brief</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Readiness before:</span>
          <ScoreBadge score={brief.readinessScore} />
        </div>
      </div>

      <div className="space-y-4">
        <SectionCard title="Real Objective" icon={Target} accent>
          <p className="text-sm text-[var(--color-ln-navy)]/80 leading-relaxed">{brief.realObjective}</p>
        </SectionCard>

        <SectionCard title="The Conversation Beneath the Conversation" icon={Brain}>
          <p className="text-sm text-gray-600 leading-relaxed">{brief.conversationBeneathConversation}</p>
        </SectionCard>

        <SectionCard title="Your First 60 Seconds" icon={Play} accent>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-[var(--color-ln-navy)]/80 leading-relaxed italic">"{brief.first60Seconds}"</p>
            <CopyButton text={brief.first60Seconds} />
          </div>
        </SectionCard>

        <SectionCard title="Key Message to Land" icon={Lightbulb}>
          <p className="text-sm text-gray-600 leading-relaxed">{brief.keyMessage}</p>
        </SectionCard>

        <SectionCard title="Likely Pushback & Best Responses" icon={MessageSquare}>
          <div className="space-y-3">
            {brief.likelyPushback.map((pushback, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 font-medium">{pushback}</p>
                </div>
                {brief.bestResponses[i] && (
                  <div className="flex items-start gap-2 ml-5">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-800">{brief.bestResponses[i]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="What NOT to Say" icon={EyeOff}>
          <ul className="space-y-1.5">
            {brief.whatNotToSay.map((phrase, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>"{phrase}"</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Your Strong Ask" icon={Target} accent>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-[var(--color-ln-navy)]/80 font-medium leading-relaxed">{brief.strongAsk}</p>
            <CopyButton text={brief.strongAsk} />
          </div>
        </SectionCard>

        <SectionCard title="How to Close" icon={CheckCircle}>
          <p className="text-sm text-gray-600 leading-relaxed">{brief.howToClose}</p>
        </SectionCard>

        {/* Readiness After */}
        <div className="rounded-xl border border-[var(--color-ln-navy)]/20 bg-[var(--color-ln-navy)]/5 p-5">
          <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-3">
            After reading this brief, how ready do you feel now?
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={readinessAfter ?? brief.readinessScore}
            onChange={e => setReadinessAfter(Number(e.target.value))}
            className="w-full accent-[var(--color-ln-gold)] mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Not ready</span>
            <span className="text-sm font-bold text-[var(--color-ln-gold)]">{readinessAfter ?? brief.readinessScore}/10</span>
            <span className="text-xs text-gray-400">Fully prepared</span>
          </div>
          {!saved && (
            <Button
              size="sm"
              onClick={() => readinessAfter && updateReadiness.mutate({ briefId, readinessAfter })}
              disabled={!readinessAfter || updateReadiness.isPending}
              className="mt-3 bg-[var(--color-ln-navy)] text-white text-xs"
            >
              Save Readiness Score
            </Button>
          )}
          {saved && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved</p>}
        </div>

        {/* Practice CTA */}
        <Button
          onClick={() => onPractice(`Practice for: ${brief.realObjective}`)}
          className="w-full bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-gold)]/90 h-11 font-semibold"
        >
          <Play className="w-4 h-4 mr-2" />
          Practice This Conversation Now
        </Button>
      </div>
    </div>
  );
}

// ── After-Meeting Debrief Form ────────────────────────────────────────────────
function AfterMeetingFormScreen({
  onBack,
  onDebriefGenerated,
}: {
  onBack: () => void;
  onDebriefGenerated: (debriefId: number, report: AfterMeetingDebriefData) => void;
}) {
  const [context, setContext] = useState('');
  const [answers, setAnswers] = useState<string[]>(DEBRIEF_QUESTIONS.map(() => ''));

  const generateDebrief = trpc.leadershipCoach.generateDebrief.useMutation({
    onSuccess: (data) => onDebriefGenerated(data.debriefId, data.debriefReport),
    onError: () => toast.error('Failed to generate debrief. Please try again.'),
  });

  const handleSubmit = () => {
    const debriefAnswers = DEBRIEF_QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] }))
      .filter(a => a.answer.trim());
    if (!context.trim() || debriefAnswers.length < 2) {
      toast.error('Please describe the conversation and answer at least 2 questions');
      return;
    }
    generateDebrief.mutate({ conversationContext: context, debriefAnswers });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Practice Coach" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">After-Meeting Debrief</h2>
        </div>
        <p className="text-sm text-gray-500">Reflect on a real conversation to extract lessons and improve.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">
            Briefly describe the conversation *
          </label>
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="e.g. I had a difficult conversation with my VP about the project timeline. She pushed back strongly on my proposal..."
            className="min-h-[80px] text-sm resize-none border-gray-200"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          {DEBRIEF_QUESTIONS.map((q, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-[var(--color-ln-navy)] mb-1.5">
                {i + 1}. {q}
              </label>
              <Textarea
                value={answers[i]}
                onChange={e => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                placeholder="Your answer..."
                className="min-h-[70px] text-sm resize-none border-gray-200"
              />
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!context.trim() || generateDebrief.isPending}
          className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 h-11"
        >
          {generateDebrief.isPending ? (
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Analysing your conversation...</span>
          ) : (
            <span className="flex items-center gap-2"><Brain className="w-4 h-4" /> Generate Debrief Report</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── After-Meeting Debrief Report ──────────────────────────────────────────────
function AfterMeetingDebriefScreen({
  report,
  onBack,
  onPractice,
}: {
  report: AfterMeetingDebriefData;
  onBack: () => void;
  onPractice: (issue: string) => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="New Debrief" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Debrief Report</h2>
        </div>
        <p className="text-sm text-gray-500">Here is what your AI coach observed.</p>
      </div>

      <div className="space-y-4">
        <SectionCard title="What Actually Happened" icon={Eye}>
          <p className="text-sm text-gray-600 leading-relaxed">{report.whatHappened}</p>
        </SectionCard>

        <SectionCard title="What the Other Person Heard" icon={MessageSquare} accent>
          <p className="text-sm text-[var(--color-ln-navy)]/80 leading-relaxed">{report.whatOtherPersonHeard}</p>
        </SectionCard>

        <SectionCard title="Where the Conversation Shifted" icon={TrendingUp}>
          <p className="text-sm text-gray-600 leading-relaxed">{report.whereConversationShifted}</p>
        </SectionCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SectionCard title="What You Handled Well" icon={CheckCircle}>
            <p className="text-sm text-emerald-700 leading-relaxed">{report.whatYouHandledWell}</p>
          </SectionCard>
          <SectionCard title="What You Missed" icon={AlertCircle}>
            <p className="text-sm text-amber-700 leading-relaxed">{report.whatYouMissed}</p>
          </SectionCard>
        </div>

        <SectionCard title="Possible Blind Spot" icon={Brain} accent>
          <p className="text-sm text-[var(--color-ln-navy)]/80 leading-relaxed italic">{report.possibleBlindSpot}</p>
        </SectionCard>

        <SectionCard title="Recovery Move" icon={RefreshCw}>
          <p className="text-sm text-gray-600 leading-relaxed">{report.recoveryMove}</p>
        </SectionCard>

        <SectionCard title="Suggested Follow-Up Message" icon={Send} accent>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-[var(--color-ln-navy)]/80 leading-relaxed italic">"{report.suggestedFollowUpMessage}"</p>
            <CopyButton text={report.suggestedFollowUpMessage} />
          </div>
        </SectionCard>

        <SectionCard title="Recommended Practice" icon={Play}>
          <p className="text-sm text-gray-600 mb-3">{report.recommendedPractice}</p>
          <Button
            size="sm"
            onClick={() => onPractice(report.recommendedPractice)}
            className="bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-gold)]/90 text-xs"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Practice This Now
          </Button>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Say It Better Screen ──────────────────────────────────────────────────────
function SayItBetterScreen({ onBack }: { onBack: () => void }) {
  const [original, setOriginal] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<ImprovedMessageData | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);

  const VARIATIONS = [
    { id: 'warmer', label: 'Warmer' },
    { id: 'firmer', label: 'Firmer' },
    { id: 'shorter', label: 'Shorter' },
    { id: 'more-senior', label: 'More Senior' },
    { id: 'more-strategic', label: 'More Strategic' },
    { id: 'add-ask', label: 'Add a Clear Ask' },
    { id: 'add-impact', label: 'Add Business Impact' },
  ];

  const improve = trpc.leadershipCoach.improveMessage.useMutation({
    onSuccess: (data) => setResult(data),
    onError: () => toast.error('Failed to improve message. Please try again.'),
  });

  const handleImprove = (variation?: string) => {
    if (!original.trim()) { toast.error('Paste your message first'); return; }
    setSelectedVariation(variation ?? null);
    improve.mutate({ originalText: original, context, variation });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Practice Coach" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Say It Better</h2>
        </div>
        <p className="text-sm text-gray-500">Paste any message or thing you want to say. Get three improved versions.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">Your message or what you want to say *</label>
          <Textarea
            value={original}
            onChange={e => setOriginal(e.target.value)}
            placeholder="Paste an email, message, or describe what you want to say..."
            className="min-h-[100px] text-sm resize-none border-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">Context (optional)</label>
          <Input
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="e.g. Email to my manager, Slack message to a peer, Opening line in a meeting"
            className="border-gray-200"
          />
        </div>

        <Button
          onClick={() => handleImprove()}
          disabled={!original.trim() || improve.isPending}
          className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 h-11"
        >
          {improve.isPending ? (
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Improving...</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Improve My Message</span>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Tone Assessment */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-800 mb-1">Tone Assessment</p>
            <p className="text-sm text-amber-700">{result.toneAssessment}</p>
            <div className="flex gap-4 mt-2">
              <div className="text-xs text-gray-500">Clarity: <span className={`font-bold ${SCORE_COLOR(result.clarityScore)}`}>{result.clarityScore}/100</span></div>
              <div className="text-xs text-gray-500">Executive Presence: <span className={`font-bold ${SCORE_COLOR(result.executivePresenceScore)}`}>{result.executivePresenceScore}/100</span></div>
            </div>
          </div>

          {/* Three Versions */}
          {[
            { key: 'diplomatic', label: 'Diplomatic', sub: 'Softer, relationship-preserving', icon: '🤝' },
            { key: 'direct', label: 'Direct', sub: 'Clear, firm, respectful', icon: '🎯' },
            { key: 'executive', label: 'Executive', sub: 'Concise, strategic, business-focused', icon: '⚡' },
          ].map(v => (
            <div key={v.key} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{v.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{v.label}</p>
                    <p className="text-xs text-gray-400">{v.sub}</p>
                  </div>
                </div>
                <CopyButton text={result[v.key as keyof ImprovedMessageData] as string} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">"{result[v.key as keyof ImprovedMessageData] as string}"</p>
            </div>
          ))}

          {result.shorterVersion && (
            <div className="rounded-xl border border-[var(--color-ln-gold)]/30 bg-[var(--color-ln-gold)]/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[var(--color-ln-navy)]">⚡ Ultra-Short Version</p>
                <CopyButton text={result.shorterVersion} />
              </div>
              <p className="text-sm text-[var(--color-ln-navy)]/80 italic">"{result.shorterVersion}"</p>
            </div>
          )}

          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">What Changed</p>
            <p className="text-sm text-gray-600">{result.whatChanged}</p>
          </div>

          {/* Variation Buttons */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-2">Refine further:</p>
            <div className="flex flex-wrap gap-2">
              {VARIATIONS.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleImprove(v.id)}
                  disabled={improve.isPending}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selectedVariation === v.id
                      ? 'bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]'
                      : 'bg-white text-[var(--color-ln-navy)]/70 border-gray-200 hover:border-[var(--color-ln-navy)]/40'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Conversation Script Builder ───────────────────────────────────────────────
function ScriptBuilderScreen({ onBack }: { onBack: () => void }) {
  const [selectedType, setSelectedType] = useState('');
  const [situation, setSituation] = useState('');
  const [result, setResult] = useState<{ scriptId: number; script: ConversationScriptData } | null>(null);
  const [saved, setSaved] = useState(false);

  const buildScript = trpc.leadershipCoach.buildScript.useMutation({
    onSuccess: (data) => setResult(data),
    onError: () => toast.error('Failed to build script. Please try again.'),
  });

  const saveScript = trpc.leadershipCoach.saveScript.useMutation({
    onSuccess: () => setSaved(true),
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Practice Coach" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Conversation Script Builder</h2>
        </div>
        <p className="text-sm text-gray-500">Choose a conversation type and describe your situation. Get a complete script.</p>
      </div>

      {!result ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">What type of conversation? *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCRIPT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${
                    selectedType === type
                      ? 'bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]'
                      : 'bg-white text-[var(--color-ln-navy)]/70 border-gray-200 hover:border-[var(--color-ln-navy)]/30'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">Describe your specific situation *</label>
            <Textarea
              value={situation}
              onChange={e => setSituation(e.target.value)}
              placeholder="e.g. I need to give feedback to a senior team member who has been missing deadlines and becoming defensive when I raise it..."
              className="min-h-[100px] text-sm resize-none border-gray-200"
            />
          </div>

          <Button
            onClick={() => buildScript.mutate({ scriptType: selectedType, situationContext: situation })}
            disabled={!selectedType || !situation.trim() || buildScript.isPending}
            className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 h-11"
          >
            {buildScript.isPending ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Building your script...</span>
            ) : (
              <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Build My Script</span>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-[var(--color-ln-navy)]/10 text-[var(--color-ln-navy)] border-0">{result.script.scriptType}</Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResult(null)}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> New Script
              </Button>
              {!saved && (
                <Button
                  size="sm"
                  onClick={() => saveScript.mutate({ scriptId: result.scriptId })}
                  className="bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Save Script
                </Button>
              )}
              {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Saved</span>}
            </div>
          </div>

          {[
            { key: 'openingLine', label: 'Opening Line', icon: Play, accent: true },
            { key: 'context', label: 'Set the Context', icon: MessageSquare },
            { key: 'observation', label: 'Your Observation', icon: Eye },
            { key: 'businessImpact', label: 'Business Impact', icon: TrendingUp },
            { key: 'yourConcern', label: 'Your Concern', icon: AlertCircle },
            { key: 'questionInvitation', label: 'Invite Their Perspective', icon: MessageSquare },
            { key: 'clearAsk', label: 'Your Clear Ask', icon: Target, accent: true },
            { key: 'likelyResistance', label: 'Likely Resistance', icon: AlertCircle },
            { key: 'responseToResistance', label: 'Your Response', icon: ChevronRight },
            { key: 'closeWithCommitment', label: 'Close with Commitment', icon: CheckCircle, accent: true },
            { key: 'followUpNote', label: 'Follow-Up Note', icon: Send },
          ].map(field => (
            <div key={field.key} className={`rounded-xl border p-4 ${field.accent ? 'border-[var(--color-ln-gold)]/30 bg-[var(--color-ln-gold)]/5' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <field.icon className={`w-4 h-4 ${field.accent ? 'text-[var(--color-ln-gold)]' : 'text-[var(--color-ln-navy)]/60'}`} />
                  <p className="text-xs font-semibold text-[var(--color-ln-navy)]">{field.label}</p>
                </div>
                <CopyButton text={result.script[field.key as keyof ConversationScriptData] as string} />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed italic">
                "{result.script[field.key as keyof ConversationScriptData] as string}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Growth Profile Screen ─────────────────────────────────────────────────────
function GrowthProfileScreen({
  onBack,
  onCoachBrief,
  onPrivacy,
}: {
  onBack: () => void;
  onCoachBrief: () => void;
  onPrivacy: () => void;
}) {
  const { data: profile, isLoading } = trpc.leadershipCoach.getGrowthProfile.useQuery();
  const { data: commitments, refetch: refetchCommitments } = trpc.leadershipCoach.getCommitments.useQuery();
  const [expandedPlan, setExpandedPlan] = useState(false);

  const generatePlan = trpc.leadershipCoach.generateGrowthPlan.useMutation({
    onSuccess: () => { toast.success('30-Day Growth Plan generated!'); },
    onError: () => toast.error('Failed to generate plan. Please try again.'),
  });

  const updateOutcome = trpc.leadershipCoach.updateCommitmentOutcome.useMutation({
    onSuccess: () => refetchCommitments(),
  });

  const OUTCOME_OPTIONS = [
    { value: 'done_well', label: '✓ Done Well', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { value: 'done_partial', label: '~ Partial', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { value: 'done_poorly', label: '✗ Struggled', color: 'text-red-700 bg-red-50 border-red-200' },
    { value: 'avoided', label: '⊘ Avoided', color: 'text-gray-700 bg-gray-50 border-gray-200' },
    { value: 'postponed', label: '→ Postponed', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <BackButton onBack={onBack} />
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-ln-navy)]/40" />
        </div>
      </div>
    );
  }

  const plan = profile?.activePlan?.plan as GrowthPlanData | undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Practice Coach" />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-ln-gold)]" />
            <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Leadership Growth Profile</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrivacy}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Privacy
            </button>
            <button
              onClick={onCoachBrief}
              className="flex items-center gap-1.5 text-xs text-[var(--color-ln-navy)]/70 hover:text-[var(--color-ln-navy)] border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Coach Brief
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">Your private leadership development record.</p>
      </div>

      {/* Memory Summary */}
      {profile?.memory?.aiSummary && (
        <SectionCard title="Leadership Memory" icon={Brain} accent>
          <p className="text-sm text-[var(--color-ln-navy)]/80 leading-relaxed">{profile.memory.aiSummary}</p>
        </SectionCard>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 my-4">
        {[
          { label: 'Practice Sessions', value: profile?.recentSessions.length ?? 0, icon: Play },
          { label: 'Briefs Created', value: profile?.recentBriefs.length ?? 0, icon: Calendar },
          { label: 'Debriefs Done', value: profile?.recentDebriefs.length ?? 0, icon: FileText },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
            <stat.icon className="w-4 h-4 text-[var(--color-ln-gold)] mx-auto mb-1" />
            <p className="text-xl font-bold text-[var(--color-ln-navy)]">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Commitments */}
      {commitments && commitments.length > 0 && (
        <div className="my-4">
          <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[var(--color-ln-gold)]" />
            Commitments Tracker
          </p>
          <div className="space-y-3">
            {commitments.slice(0, 8).map(c => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-[var(--color-ln-navy)] mb-2">{c.text}</p>
                {c.status === 'pending' ? (
                  <div className="flex flex-wrap gap-1.5">
                    {OUTCOME_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateOutcome.mutate({ commitmentId: c.id, status: opt.value as 'done_well' | 'done_partial' | 'done_poorly' | 'avoided' | 'postponed' })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${opt.color}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-gray-100 text-gray-600 border-0">
                      {OUTCOME_OPTIONS.find(o => o.value === c.status)?.label ?? c.status}
                    </Badge>
                    {c.aiRecommendation && (
                      <p className="text-xs text-[var(--color-ln-navy)]/60 italic">{c.aiRecommendation}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-Day Growth Plan */}
      <div className="my-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--color-ln-navy)] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[var(--color-ln-gold)]" />
            30-Day Growth Plan
          </p>
          <Button
            size="sm"
            onClick={() => generatePlan.mutate()}
            disabled={generatePlan.isPending}
            className="bg-[var(--color-ln-navy)] text-white text-xs"
          >
            {generatePlan.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
            {plan ? 'Regenerate' : 'Generate Plan'}
          </Button>
        </div>

        {plan ? (
          <div className="rounded-xl border border-[var(--color-ln-navy)]/20 bg-[var(--color-ln-navy)]/5 p-5">
            <p className="text-base font-bold text-[var(--color-ln-navy)] mb-1">{plan.growthTheme}</p>
            <p className="text-sm text-[var(--color-ln-navy)]/70 mb-4">{plan.whyItMatters}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {['week1', 'week2', 'week3', 'week4'].map((week, i) => (
                <div key={week} className="rounded-lg bg-white border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-[var(--color-ln-gold)] mb-1">Week {i + 1}</p>
                  <p className="text-xs text-gray-600">{plan[week as keyof GrowthPlanData] as string}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setExpandedPlan(!expandedPlan)}
              className="text-xs text-[var(--color-ln-navy)]/60 hover:text-[var(--color-ln-navy)] flex items-center gap-1"
            >
              {expandedPlan ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expandedPlan ? 'Show less' : 'Show real-world actions, drills & reflection questions'}
            </button>

            {expandedPlan && (
              <div className="mt-4 space-y-3">
                {[
                  { key: 'realWorldActions', label: 'Real-World Actions', icon: Target },
                  { key: 'recommendedRolePlays', label: 'Recommended Role-Plays', icon: Play },
                  { key: 'recommendedDrills', label: 'Drills', icon: Zap },
                  { key: 'reflectionQuestions', label: 'Reflection Questions', icon: Brain },
                  { key: 'successIndicators', label: 'Success Indicators', icon: CheckCircle },
                ].map(section => (
                  <div key={section.key}>
                    <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-1.5 flex items-center gap-1.5">
                      <section.icon className="w-3.5 h-3.5 text-[var(--color-ln-gold)]" />
                      {section.label}
                    </p>
                    <ul className="space-y-1">
                      {(plan[section.key as keyof GrowthPlanData] as string[]).map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <span className="text-[var(--color-ln-gold)] mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No growth plan yet. Generate one based on your practice history.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coach Brief Screen ────────────────────────────────────────────────────────
function CoachBriefScreen({ onBack }: { onBack: () => void }) {
  const [shareLevel, setShareLevel] = useState<'summary' | 'transcript' | 'feedback' | 'growth' | 'selected'>('summary');
  const [brief, setBrief] = useState<{ briefId: number; brief: ReturnType<typeof Object.create> } | null>(null);

  const generateBrief = trpc.leadershipCoach.generateCoachBrief.useMutation({
    onSuccess: (data) => setBrief(data),
    onError: () => toast.error('Failed to generate brief. Please try again.'),
  });

  const SHARE_LEVELS = [
    { value: 'summary', label: 'Summary Only', desc: 'High-level themes and patterns' },
    { value: 'feedback', label: 'Include Feedback', desc: 'Scores and improvement areas' },
    { value: 'growth', label: 'Full Growth Profile', desc: 'Commitments, patterns, blind spots' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Growth Profile" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Human Coach Brief</h2>
        </div>
        <p className="text-sm text-gray-500">Generate a summary to share with your human executive coach before a session.</p>
      </div>

      {!brief ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">What to include in the brief?</label>
            <div className="space-y-2">
              {SHARE_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setShareLevel(level.value as typeof shareLevel)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    shareLevel === level.value
                      ? 'border-[var(--color-ln-navy)] bg-[var(--color-ln-navy)]/5'
                      : 'border-gray-200 bg-white hover:border-[var(--color-ln-navy)]/30'
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{level.label}</p>
                  <p className="text-xs text-gray-400">{level.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => generateBrief.mutate({ shareLevel })}
            disabled={generateBrief.isPending}
            className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 h-11"
          >
            {generateBrief.isPending ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</span>
            ) : (
              <span className="flex items-center gap-2"><User className="w-4 h-4" /> Generate Coach Brief</span>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge className="bg-[var(--color-ln-navy)]/10 text-[var(--color-ln-navy)] border-0">
              {SHARE_LEVELS.find(l => l.value === shareLevel)?.label}
            </Badge>
            <div className="flex gap-2">
              <CopyButton text={JSON.stringify(brief.brief, null, 2)} />
              <Button size="sm" variant="outline" onClick={() => setBrief(null)} className="text-xs">
                Regenerate
              </Button>
            </div>
          </div>

          {[
            { key: 'currentIssue', label: 'Current Issue', icon: Target },
            { key: 'leaderDesiredOutcome', label: 'Leader\'s Desired Outcome', icon: Award },
            { key: 'aiObservedPattern', label: 'AI-Observed Pattern', icon: Brain, accent: true },
            { key: 'possibleBlindSpot', label: 'Possible Blind Spot', icon: Eye, accent: true },
            { key: 'practiceCompleted', label: 'Practice Completed', icon: Play },
            { key: 'scoresAndImprovements', label: 'Scores & Improvements', icon: TrendingUp },
          ].map(field => (
            <SectionCard key={field.key} title={field.label} icon={field.icon} accent={field.accent}>
              <p className="text-sm text-gray-600 leading-relaxed">
                {brief.brief[field.key as string]}
              </p>
            </SectionCard>
          ))}

          {brief.brief.commitmentsMade?.length > 0 && (
            <SectionCard title="Commitments Made" icon={CheckCircle}>
              <ul className="space-y-1">
                {(brief.brief.commitmentsMade as string[]).map((c: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-[var(--color-ln-gold)] mt-0.5">•</span>{c}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {brief.brief.suggestedCoachingQuestions?.length > 0 && (
            <SectionCard title="Suggested Coaching Questions" icon={MessageSquare} accent>
              <ol className="space-y-2">
                {(brief.brief.suggestedCoachingQuestions as string[]).map((q: string, i: number) => (
                  <li key={i} className="text-sm text-[var(--color-ln-navy)]/80 flex items-start gap-2">
                    <span className="text-[var(--color-ln-gold)] font-bold flex-shrink-0">{i + 1}.</span>{q}
                  </li>
                ))}
              </ol>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

// ── Privacy Settings Screen ───────────────────────────────────────────────────
function PrivacySettingsScreen({ onBack }: { onBack: () => void }) {
  const { data: settings } = trpc.leadershipCoach.getPrivacySettings.useQuery();
  const [form, setForm] = useState({
    shareWithCoach: 'nothing' as 'nothing' | 'summary' | 'transcript' | 'feedback' | 'growth' | 'selected',
    shareWithOrg: false,
    allowAggregateAnalytics: true,
    coachEmail: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shareWithCoach: settings.shareWithCoach as typeof form.shareWithCoach,
        shareWithOrg: settings.shareWithOrg,
        allowAggregateAnalytics: settings.allowAggregateAnalytics,
        coachEmail: settings.coachEmail ?? '',
      });
    }
  }, [settings]);

  const update = trpc.leadershipCoach.updatePrivacySettings.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const SHARE_OPTIONS = [
    { value: 'nothing', label: 'Nothing', desc: 'Your coach sees nothing' },
    { value: 'summary', label: 'Summary Only', desc: 'High-level themes only' },
    { value: 'feedback', label: 'Feedback Scores', desc: 'Practice scores and areas' },
    { value: 'growth', label: 'Full Growth Profile', desc: 'Everything including commitments' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Growth Profile" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Privacy Controls</h2>
        </div>
        <p className="text-sm text-gray-500">Your practice data is private by default. You control what is shared.</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Your data is private by default</p>
              <p className="text-xs text-emerald-700 mt-0.5">All practice sessions, coaching conversations, and feedback are stored privately. Your organisation cannot see individual data unless you explicitly choose to share.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">Share with my human coach</label>
          <div className="space-y-2">
            {SHARE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, shareWithCoach: opt.value as typeof form.shareWithCoach }))}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  form.shareWithCoach === opt.value
                    ? 'border-[var(--color-ln-navy)] bg-[var(--color-ln-navy)]/5'
                    : 'border-gray-200 bg-white hover:border-[var(--color-ln-navy)]/30'
                }`}
              >
                <p className="text-sm font-medium text-[var(--color-ln-navy)]">{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {form.shareWithCoach !== 'nothing' && (
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">Coach email address</label>
            <Input
              type="email"
              value={form.coachEmail}
              onChange={e => setForm(f => ({ ...f, coachEmail: e.target.value }))}
              placeholder="coach@example.com"
              className="border-gray-200"
            />
          </div>
        )}

        <div className="space-y-3">
          {[
            { key: 'shareWithOrg', label: 'Share aggregate data with my organisation', desc: 'Only anonymised, aggregated data — never individual sessions' },
            { key: 'allowAggregateAnalytics', label: 'Allow anonymous analytics to improve the platform', desc: 'Helps improve the AI coaching quality for all users' },
          ].map(toggle => (
            <div key={toggle.key} className="flex items-start justify-between gap-4 p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="text-sm font-medium text-[var(--color-ln-navy)]">{toggle.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{toggle.desc}</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, [toggle.key]: !f[toggle.key as keyof typeof f] }))}
                className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                  form[toggle.key as keyof typeof form] ? 'bg-[var(--color-ln-navy)]' : 'bg-gray-200'
                }`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${
                  form[toggle.key as keyof typeof form] ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <Button
          onClick={() => update.mutate(form)}
          disabled={update.isPending}
          className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 h-11"
        >
          {update.isPending ? (
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</span>
          ) : saved ? (
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saved</span>
          ) : (
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Save Privacy Settings</span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Coaching Screen (Coach Me First) ──────────────────────────────────────────
function CoachingScreen({
  issue,
  onBack,
  onProceedToSimulation,
}: {
  issue: string;
  onBack: () => void;
  onProceedToSimulation: (sessionId: number) => void;
}) {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'coach'; content: string; timestamp: string }>>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [coachingSummary, setCoachingSummary] = useState<{
    realIssue: string;
    leadershipGap: string;
    recommendedApproach: string;
    commitment: string;
  } | null>(null);
  const [blindSpot, setBlindSpot] = useState<{ possibleBlindSpot: string; reframe: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startSession = trpc.practice.createSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setMessages([{ role: 'coach', content: `I hear you — let's make sure we're working on the right thing. Tell me more: when you think about this situation, what's the part that feels most difficult for you?`, timestamp: new Date().toISOString() }]);
    },
  });
  const sendMessage = trpc.practice.sendCoachMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'coach', content: data.message.content, timestamp: data.message.timestamp }]);
      if (data.coachingSummary) setCoachingSummary(data.coachingSummary as { realIssue: string; leadershipGap: string; recommendedApproach: string; commitment: string });
    },
  });
  const detectBlindSpot = trpc.leadershipCoach.detectBlindSpots.useMutation({
    onSuccess: (data) => setBlindSpot(data as { possibleBlindSpot: string; reframe: string }),
  });
  useEffect(() => {
    startSession.mutate({ issueText: issue });
    detectBlindSpot.mutate({ issueDescription: issue });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date().toISOString() }]);
    sendMessage.mutate({ sessionId, message: userMsg });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <BackButton onBack={onBack} />

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-lg font-bold text-[var(--color-ln-navy)]">Coach Me First</h2>
        </div>
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <Lock className="w-3 h-3 inline mr-1" />
          This conversation is private and confidential.
        </p>
      </div>

      {/* Blind Spot Banner */}
      {blindSpot && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-1">Possible Blind Spot Detected</p>
              <p className="text-xs text-amber-700 mb-2">{blindSpot.possibleBlindSpot}</p>
              <p className="text-xs text-amber-600 italic">Reframe: {blindSpot.reframe}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-ln-navy)]/40" />
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'coach' ? 'bg-[var(--color-ln-navy)] text-white' : 'bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)]'
            }`}>
              {msg.role === 'coach' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'coach'
                ? 'bg-white border border-gray-200 text-gray-700'
                : 'bg-[var(--color-ln-navy)] text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Coaching Summary */}
      {coachingSummary && (
        <div className="mb-4 rounded-xl bg-[var(--color-ln-navy)]/5 border border-[var(--color-ln-navy)]/20 p-4">
          <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[var(--color-ln-gold)]" />
            Coaching Summary
          </p>
          <div className="space-y-2">
            {[
              { label: 'Real Issue', value: coachingSummary.realIssue },
              { label: 'Leadership Gap', value: coachingSummary.leadershipGap },
              { label: 'Recommended Approach', value: coachingSummary.recommendedApproach },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs font-semibold text-[var(--color-ln-navy)]/60">{item.label}</p>
                <p className="text-sm text-[var(--color-ln-navy)]">{item.value}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => sessionId && onProceedToSimulation(sessionId)}
            className="w-full mt-4 bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-gold)]/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Proceed to Practice Simulation
          </Button>
        </div>
      )}

      {/* Input */}
      {!coachingSummary && (
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Share your thoughts..."
            className="min-h-[44px] max-h-[120px] text-sm resize-none border-gray-200"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="bg-[var(--color-ln-navy)] text-white px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Scenario Setup Screen ─────────────────────────────────────────────────────
function ScenarioSetupScreen({
  sessionId,
  onBack,
  onStart,
}: {
  sessionId: number;
  onBack: () => void;
  onStart: (scenario: PracticeScenario) => void;
}) {
  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const generateScenario = trpc.practice.generateScenario.useMutation({
    onSuccess: (data) => setScenario(data.scenario),
    onError: () => toast.error('Failed to generate scenario. Please try again.'),
  });

  useEffect(() => {
    generateScenario.mutate({ sessionId });
  }, []);

  if (!scenario) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <BackButton onBack={onBack} />
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-ln-navy)]/40" />
          <p className="text-sm text-gray-400">Building your practice scenario...</p>
        </div>
      </div>
    );
  }

  const DIFFICULTY_COLORS: Record<string, string> = {
    Easy: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    Hard: "bg-orange-100 text-orange-800 border-orange-200",
    Executive: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Play className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Your Practice Scenario</h2>
        </div>
        <p className="text-sm text-gray-500">Review and edit the scenario before starting the role-play.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-5 space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={`border ${DIFFICULTY_COLORS[scenario.difficultyLevel] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {scenario.difficultyLevel}
          </Badge>
          <button
            onClick={() => generateScenario.mutate({ sessionId })}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </button>
        </div>

        {[
          { key: 'yourRole', label: 'Your Role' },
          { key: 'avatarRole', label: 'Their Role' },
          { key: 'relationship', label: 'Relationship' },
          { key: 'context', label: 'Context' },
          { key: 'stakes', label: 'Stakes' },
          { key: 'desiredOutcome', label: 'Your Goal' },
          { key: 'successCriteria', label: 'Success Looks Like' },
        ].map(field => (
          <div key={field.key}>
            <p className="text-xs font-semibold text-gray-400 mb-1">{field.label}</p>
            {editingField === field.key ? (
              <div className="flex gap-2">
                <Input
                  value={scenario[field.key as keyof PracticeScenario] as string}
                  onChange={e => setScenario(s => s ? { ...s, [field.key]: e.target.value } : s)}
                  className="text-sm border-[var(--color-ln-navy)]/30"
                  autoFocus
                />
                <Button size="sm" onClick={() => setEditingField(null)} className="bg-[var(--color-ln-navy)] text-white px-3">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2 group">
                <p className="text-sm text-[var(--color-ln-navy)]">{scenario[field.key as keyof PracticeScenario] as string}</p>
                <button
                  onClick={() => setEditingField(field.key)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={() => onStart(scenario)}
        className="w-full bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-gold)]/90 h-12 text-base font-semibold"
      >
        <Play className="w-5 h-5 mr-2" />
        Start Role-Play
      </Button>
    </div>
  );
}

// ── Role Play Screen ──────────────────────────────────────────────────────────
function RolePlayScreen({
  sessionId,
  scenario,
  onBack: _onBack,
  onFeedback,
}: {
  sessionId: number;
  scenario: PracticeScenario;
  onBack: () => void;
  onFeedback: (feedback: PracticeFeedback, score: number, attemptId: number) => void;
}) {
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [input, setInput] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [pauseNote, setPauseNote] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

    const startRolePlay = trpc.practice.startAttempt.useMutation({
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setMessages([{ role: 'avatar', content: `Hello. I understand we need to talk. What's on your mind?`, timestamp: new Date().toISOString() }]);
    },
  });
  const sendMessage = trpc.practice.sendRolePlayMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.message]);
    },
  });
  const pauseForCoaching = trpc.practice.pauseForCoaching.useMutation({
    onSuccess: (data) => setPauseNote(data.coaching),
  });
  const endSimulation = trpc.practice.endSimulation.useMutation({
    onSuccess: (data) => onFeedback(data.feedback, data.feedback.overallScore ?? 0, data.attemptId),
  });
  useEffect(() => {
    startRolePlay.mutate({ sessionId });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !attemptId) return;
    const userMsg = input.trim();
    setInput('');
    setPauseNote(null);
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date().toISOString() }]);
    sendMessage.mutate({ attemptId, message: userMsg });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{scenario.avatarRole}</p>
          <p className="text-xs text-gray-400">{scenario.relationship} · {messages.filter(m => m.role === 'user').length} turns</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => attemptId && pauseForCoaching.mutate({ attemptId })}
            disabled={pauseForCoaching.isPending}
            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Pause className="w-3.5 h-3.5 mr-1.5" />
            Pause
          </Button>
          <Button
            size="sm"
            onClick={() => attemptId && endSimulation.mutate({ attemptId })}
            disabled={endSimulation.isPending}
            className="bg-[var(--color-ln-navy)] text-white text-xs"
          >
            {endSimulation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'End & Feedback'}
          </Button>
        </div>
      </div>

      {/* Pause Note */}
      {pauseNote && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-1">Coaching Note</p>
              <p className="text-sm text-amber-700">{pauseNote}</p>
            </div>
          </div>
          <button onClick={() => setPauseNote(null)} className="mt-2 text-xs text-amber-600 hover:text-amber-800">
            Continue role-play →
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-ln-navy)]/40" />
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
              msg.role === 'avatar' ? 'bg-[var(--color-ln-navy)] text-white' : 'bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)]'
            }`}>
              {msg.role === 'avatar' ? scenario.avatarRole.charAt(0) : 'You'}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'avatar'
                ? 'bg-white border border-gray-200 text-gray-700'
                : 'bg-[var(--color-ln-navy)] text-white'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex gap-3 items-end">
            <div className="w-7 h-7 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {scenario.avatarRole.charAt(0)}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="typing-dot w-2 h-2 rounded-full bg-[var(--color-ln-navy)]/40 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-[var(--color-ln-navy)]/40 inline-block" />
                <span className="typing-dot w-2 h-2 rounded-full bg-[var(--color-ln-navy)]/40 inline-block" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Your response..."
          className="min-h-[44px] max-h-[120px] text-sm resize-none border-gray-200"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          className="bg-[var(--color-ln-navy)] text-white px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Feedback Screen ───────────────────────────────────────────────────────────
function FeedbackScreen({
  feedback,
  score,
  sessionId,
  attemptId,
  onRetry,
  onHome,
}: {
    feedback: PracticeFeedback;
  score: number;
  sessionId: number;
  attemptId: number;
  onRetry: () => void;
  onHome: () => void;
}) {
  const [reflection, setReflection] = useState('');
  const [commitment, setCommitment] = useState('');
  const [saved, setSaved] = useState(false);
  const saveReflection = trpc.practice.saveReflection.useMutation({
    onSuccess: () => setSaved(true),
  });
  const addCommitment = trpc.leadershipCoach.addCommitment.useMutation({
    onSuccess: () => toast.success('Commitment added to your tracker'),
  });

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Feedback Report</h2>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`rounded-xl border p-5 text-center mb-6 ${scoreBg}`}>
        <p className={`text-5xl font-black ${scoreColor} mb-1`}>{score}</p>
        <p className="text-sm text-gray-500">Overall Score</p>
        <div className="mt-3">
          <Progress value={score} className="h-2" />
        </div>
      </div>

      {/* Dimension Scores */}
      {feedback.dimensionScores && (
        <div className="mb-5">
          <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-3">Dimension Scores</p>
          <div className="space-y-2">
            {feedback.dimensionScores.map((dim, i) => (
              <div key={i} className="flex items-center gap-3">
                <p className="text-xs text-gray-600 w-40 flex-shrink-0">{dim.dimension}</p>
                <div className="flex-1">
                  <Progress value={dim.score * 10} className="h-1.5" />
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`w-3.5 h-3.5 ${star <= dim.score / 2 ? 'text-[var(--color-ln-gold)] fill-[var(--color-ln-gold)]' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {[
          { key: 'whatWorked', label: 'What Worked', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { key: 'whatDidntWork', label: "What Didn't Work", icon: AlertCircle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { key: 'missedOpportunities', label: 'Missed Opportunities', icon: Lightbulb, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { key: 'whatOtherPersonHeard', label: 'What They Heard', icon: MessageSquare, color: 'text-purple-700 bg-purple-50 border-purple-200' },
          { key: 'whereConversationShifted', label: 'Where It Shifted', icon: TrendingUp, color: 'text-gray-700 bg-gray-50 border-gray-200' },
        ].map(section => (
          feedback[section.key as keyof PracticeFeedback] && (
            <div key={section.key} className={`rounded-xl border p-4 ${section.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <section.icon className="w-4 h-4" />
                <p className="text-xs font-semibold">{section.label}</p>
              </div>
              <p className="text-sm leading-relaxed">{feedback[section.key as keyof PracticeFeedback] as string}</p>
            </div>
          )
        ))}

        {feedback.strongerPhrases && feedback.strongerPhrases.length > 0 && (
          <SectionCard title="Stronger Phrases to Use" icon={Sparkles} accent>
            <ul className="space-y-1.5">
              {feedback.strongerPhrases.map((phrase, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[var(--color-ln-gold)] mt-0.5">→</span>
                  <span className="text-sm text-[var(--color-ln-navy)]/80 italic">"{phrase}"</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {feedback.oneBehaviourToImprove && (
          <SectionCard title="One Behaviour to Improve" icon={Target} accent>
            <p className="text-sm text-[var(--color-ln-navy)]/80 font-medium">{feedback.oneBehaviourToImprove}</p>
          </SectionCard>
        )}

        {feedback.suggestedRealWorldAction && (
          <div className="rounded-xl border border-[var(--color-ln-navy)]/20 bg-[var(--color-ln-navy)]/5 p-4">
            <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[var(--color-ln-gold)]" />
              Suggested Real-World Action
            </p>
            <p className="text-sm text-[var(--color-ln-navy)]/80 mb-3">{feedback.suggestedRealWorldAction}</p>
            <Button
              size="sm"
              onClick={() => addCommitment.mutate({ text: feedback.suggestedRealWorldAction!, sourceType: 'roleplay', sourceId: sessionId })}
              disabled={addCommitment.isPending}
              className="bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] text-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Add to Commitments
            </Button>
          </div>
        )}
      </div>

      {/* Reflection */}
      {!saved && (
        <div className="mb-6 space-y-3">
          <Textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="What is your key takeaway from this practice session?"
            className="min-h-[80px] text-sm resize-none border-gray-200"
          />
          <Input
            value={commitment}
            onChange={e => setCommitment(e.target.value)}
            placeholder="What specific action will you take in the next 7 days?"
            className="border-gray-200"
          />
          <Button
            onClick={() => saveReflection.mutate({ attemptId: attemptId, reflection, actionCommitment: commitment })}
            disabled={!reflection.trim() || saveReflection.isPending}
            className="w-full bg-[var(--color-ln-navy)] text-white"
          >
            Save Reflection & Commitment
          </Button>
        </div>
      )}

      {saved && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-sm text-emerald-700 font-medium">Reflection saved to your growth profile</p>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <Button onClick={onRetry} variant="outline" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={onHome} className="flex-1 bg-[var(--color-ln-navy)] text-white">
          <ChevronRight className="w-4 h-4 mr-2" />
          Back to Coach
        </Button>
      </div>

      {/* Guide AI deep-dive prompt */}
      <a
        href="/guide"
        className="block rounded-xl border border-[var(--color-ln-navy)]/20 bg-[var(--color-ln-navy)]/5 p-4 hover:bg-[var(--color-ln-navy)]/10 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-ln-navy)]">Want to go deeper?</p>
            <p className="text-xs text-[var(--color-ln-navy)]/60 mt-0.5">
              Open this in Guide → your AI leadership advisor can help you build a strategy around what came up in this session.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-ln-navy)]/40 group-hover:text-[var(--color-ln-navy)] transition-colors flex-shrink-0" />
        </div>
      </a>
    </div>
  );
}

// ── History Screen ────────────────────────────────────────────────────────────
function HistoryScreen({ onBack }: { onBack: () => void }) {
  const { data: historyData } = trpc.practice.getHistory.useQuery();
  const sessions = historyData?.sessions;
  const allAttempts = historyData?.attempts ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <BackButton onBack={onBack} label="Back to Practice Coach" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Practice History</h2>
        </div>
        <p className="text-sm text-gray-500">{sessions?.length ?? 0} sessions completed</p>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No practice sessions yet.</p>
          <p className="text-xs text-gray-300 mt-1">Complete your first session to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const sessionAttempts = allAttempts.filter((a: { sessionId: number; overallScore: number | null }) => a.sessionId === session.id);
            const bestScore = sessionAttempts.length > 0 ? Math.max(...sessionAttempts.map((a: { overallScore: number | null }) => a.overallScore ?? 0)) : null;
            const latestScore = sessionAttempts.length > 0 ? sessionAttempts[sessionAttempts.length - 1].overallScore : null;
            const improvement = sessionAttempts.length >= 2
              ? sessionAttempts[sessionAttempts.length - 1].overallScore! - sessionAttempts[0].overallScore!
              : null;

            return (
              <div key={session.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-[var(--color-ln-navy)] flex-1">{session.issueText}</p>
                  {latestScore !== null && (
                    <span className={`text-lg font-black flex-shrink-0 ${SCORE_COLOR(latestScore)}`}>{latestScore}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(session.createdAt).toLocaleDateString()}</span>
                  <span>{sessionAttempts.length} attempt{sessionAttempts.length !== 1 ? 's' : ''}</span>
                  {bestScore !== null && <span>Best: {bestScore}</span>}
                  {improvement !== null && improvement > 0 && (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />+{improvement}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PracticeCoach() {
  const [location] = useLocation();
  const search = useSearch();
  const [screen, setScreen] = useState<Screen>(() => {
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen');
    return (screenParam as Screen) || "home";
  });

  // Re-sync screen state when URL or search params change
  useEffect(() => {
    const params = new URLSearchParams(search);
    const screenParam = params.get('screen') as Screen | null;
    if (screenParam && screenParam !== screen) {
      setScreen(screenParam);
    } else if (!screenParam && screen !== 'home' && !['coaching', 'scenario-setup', 'roleplay', 'feedback', 'before-meeting-form', 'before-meeting-brief', 'after-meeting-form', 'after-meeting-debrief', 'say-it-better', 'script-builder', 'growth-profile', 'coach-brief', 'privacy-settings', 'history', 'create-commitment', 'practice-plan'].includes(screen)) {
      setScreen('home');
    }
  }, [location, search]);
  const [issue, setIssue] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [scenario, setScenario] = useState<PracticeScenario | null>(null);
  const [feedback, setFeedback] = useState<{ feedback: PracticeFeedback; score: number; attemptId: number } | null>(null);
  const [briefData, setBriefData] = useState<{ briefId: number; brief: BeforeMeetingBriefData } | null>(null);
  const [debriefData, setDebriefData] = useState<{ debriefId: number; report: AfterMeetingDebriefData } | null>(null);

  const goHome = () => {
    setScreen('home');
    setIssue('');
    setSessionId(null);
    setScenario(null);
    setFeedback(null);
    // Clear URL query params
    window.history.replaceState({}, '', '/practice');
  };

  function renderScreen() {
    if (screen === 'home') {
      return (
        <HomeScreen
          onCoachFirst={(iss) => { setIssue(iss); setScreen('coaching'); }}
          onSimulateFirst={(iss) => { setIssue(iss); setScreen('scenario-setup'); }}
          onBeforeMeeting={() => setScreen('before-meeting-form')}
          onAfterMeeting={() => setScreen('after-meeting-form')}
          onSayItBetter={() => setScreen('say-it-better')}
          onScriptBuilder={() => setScreen('script-builder')}
          onHistory={() => setScreen('history')}
          onCreateCommitment={() => setScreen('create-commitment')}
          onPracticePlan={() => setScreen('practice-plan')}
        />
      );
    }
    if (screen === 'coaching') {
      return (
        <CoachingScreen
          issue={issue}
          onBack={goHome}
          onProceedToSimulation={(sid) => { setSessionId(sid); setScreen('scenario-setup'); }}
        />
      );
    }
    if (screen === 'scenario-setup') {
      if (!sessionId) {
        return (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
            <BackButton onBack={goHome} />
            <SimulateFirstSetup
              issue={issue}
              onSessionCreated={(sid) => setSessionId(sid)}
            />
          </div>
        );
      }
      return (
        <ScenarioSetupScreen
          sessionId={sessionId}
          onBack={goHome}
          onStart={(sc) => { setScenario(sc); setScreen('roleplay'); }}
        />
      );
    }
    if (screen === 'roleplay' && sessionId && scenario) {
      return (
        <RolePlayScreen
          sessionId={sessionId}
          scenario={scenario}
          onBack={() => setScreen('scenario-setup')}
          onFeedback={(fb, score, aid) => { setFeedback({ feedback: fb, score, attemptId: aid }); setScreen('feedback'); }}
        />
      );
    }
    if (screen === 'feedback' && feedback && sessionId) {
      return (
        <FeedbackScreen
          feedback={feedback.feedback}
          score={feedback.score}
          sessionId={sessionId}
          attemptId={feedback.attemptId}
          onRetry={() => setScreen('scenario-setup')}
          onHome={goHome}
        />
      );
    }
    if (screen === 'before-meeting-form') {
      return (
        <BeforeMeetingFormScreen
          onBack={goHome}
          onBriefGenerated={(briefId, brief) => { setBriefData({ briefId, brief }); setScreen('before-meeting-brief'); }}
        />
      );
    }
    if (screen === 'before-meeting-brief' && briefData) {
      return (
        <BeforeMeetingBriefScreen
          briefId={briefData.briefId}
          brief={briefData.brief}
          onBack={() => setScreen('before-meeting-form')}
          onPractice={(iss) => { setIssue(iss); setScreen('scenario-setup'); }}
        />
      );
    }
    if (screen === 'after-meeting-form') {
      return (
        <AfterMeetingFormScreen
          onBack={goHome}
          onDebriefGenerated={(debriefId, report) => { setDebriefData({ debriefId, report }); setScreen('after-meeting-debrief'); }}
        />
      );
    }
    if (screen === 'after-meeting-debrief' && debriefData) {
      return (
        <AfterMeetingDebriefScreen
          report={debriefData.report}
          onBack={() => setScreen('after-meeting-form')}
          onPractice={(iss) => { setIssue(iss); setScreen('scenario-setup'); }}
        />
      );
    }
    if (screen === 'say-it-better') return <SayItBetterScreen onBack={goHome} />;
    if (screen === 'create-commitment') return <CreateCommitmentScreen onBack={goHome} />;
    if (screen === 'practice-plan') return <PracticePlanScreen onBack={goHome} onPractice={(iss) => { setIssue(iss); setScreen('scenario-setup'); }} />;
    if (screen === 'script-builder') return <ScriptBuilderScreen onBack={goHome} />;
    if (screen === 'growth-profile') {
      return (
        <GrowthProfileScreen
          onBack={goHome}
          onCoachBrief={() => setScreen('coach-brief')}
          onPrivacy={() => setScreen('privacy-settings')}
        />
      );
    }
    if (screen === 'coach-brief') return <CoachBriefScreen onBack={() => setScreen('growth-profile')} />;
    if (screen === 'privacy-settings') return <PrivacySettingsScreen onBack={() => setScreen('growth-profile')} />;
    if (screen === 'history') return <HistoryScreen onBack={goHome} />;
    return null;
  }

  return (
    <PlatformLayout title="AI Practice Coach">
      {renderScreen()}
    </PlatformLayout>
  );
}

// ── Simulate First Setup ──────────────────────────────────────────────────────
function SimulateFirstSetup({
  issue,
  onSessionCreated,
}: {
  issue: string;
  onSessionCreated: (sessionId: number) => void;
}) {
    const createSession = trpc.practice.createSession.useMutation({
    onSuccess: (data) => onSessionCreated(data.sessionId),
  });
  useEffect(() => {
    createSession.mutate({ issueText: issue });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-ln-navy)]/40" />
      <p className="text-sm text-gray-400">Setting up your practice session...</p>
    </div>
  );
}

// ── Create Commitment Screen ──────────────────────────────────────────────────
function CreateCommitmentScreen({ onBack }: { onBack: () => void }) {
  const [situation, setSituation] = useState("");
  const [behaviour, setBehaviour] = useState("");
  const [trigger, setTrigger] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createCommitment = trpc.leadershipCoach.addCommitment.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Practice commitment created!");
    },
    onError: () => toast.error("Could not save commitment. Try again."),
  });

  const handleSubmit = () => {
    if (!situation.trim() || !behaviour.trim()) {
      toast.error("Please fill in the situation and the specific behaviour you will practise.");
      return;
    }
    const text = `Situation: ${situation.trim()}. Behaviour: ${behaviour.trim()}${trigger.trim() ? `. Trigger: ${trigger.trim()}` : ""}.`;
    createCommitment.mutate({ text });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <BackButton onBack={onBack} />
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
          <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">Commitment Saved</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Your practice commitment has been added to your open commitments. You'll see it on the home screen as a reminder.
          </p>
          <Button onClick={onBack} className="mt-2 bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90">
            Back to Practice Coach
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <BackButton onBack={onBack} />
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h1 className="text-xl font-bold text-[var(--color-ln-navy)]">Create a Practice Commitment</h1>
        </div>
        <p className="text-sm text-[var(--color-ln-navy)]/60">
          Turn a real leadership situation into a specific behavioural commitment you will practise.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">
            What is the real situation you are dealing with?
          </label>
          <Textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder="e.g. My stakeholder in the US dismisses my ideas in group calls and I tend to go quiet rather than push back."
            className="min-h-[90px] text-sm resize-none border-gray-200 focus:border-[var(--color-ln-navy)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">
            What specific behaviour will you practise? <span className="text-[var(--color-ln-gold)]">*</span>
          </label>
          <Textarea
            value={behaviour}
            onChange={e => setBehaviour(e.target.value)}
            placeholder="e.g. When my idea is dismissed, I will pause, name the dynamic calmly, and restate my point once with evidence before moving on."
            className="min-h-[90px] text-sm resize-none border-gray-200 focus:border-[var(--color-ln-navy)]"
          />
          <p className="text-xs text-gray-400 mt-1">Be specific — describe the exact words or action, not just the intention.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">
            When will you next have the opportunity to use this? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Input
            value={trigger}
            onChange={e => setTrigger(e.target.value)}
            placeholder="e.g. Thursday's cross-functional call with the US team"
            className="text-sm border-gray-200 focus:border-[var(--color-ln-navy)]"
          />
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={createCommitment.isPending || !situation.trim() || !behaviour.trim()}
            className="w-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 font-semibold"
          >
            {createCommitment.isPending ? "Saving…" : "Save Practice Commitment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Practice Plan Screen ──────────────────────────────────────────────────────
function PracticePlanScreen({
  onBack,
  onPractice,
}: {
  onBack: () => void;
  onPractice: (issue: string) => void;
}) {
  const { data: commitments, isLoading: loadingCommitments } = trpc.leadershipCoach.getCommitments.useQuery();
  const { data: memory, isLoading: loadingMemory } = trpc.leadershipCoach.getMemory.useQuery();
  const { data: recommendations } = trpc.leadershipCoach.getPersonalisedRecommendations.useQuery();
  const { data: historyData, isLoading: loadingHistory } = trpc.practice.getHistory.useQuery();
  const { data: momentumSettings } = trpc.leadershipCoach.getMomentumSettings.useQuery();
  const utils = trpc.useUtils();

  const updateMomentum = trpc.leadershipCoach.updateMomentumSettings.useMutation({
    onSuccess: () => { utils.leadershipCoach.getMomentumSettings.invalidate(); toast.success("Settings saved"); },
    onError: () => toast.error("Could not save settings"),
  });

  const updateCommitment = trpc.leadershipCoach.updateCommitmentOutcome.useMutation({
    onSuccess: () => toast.success("Commitment updated"),
    onError: () => toast.error("Could not update commitment"),
  });

  const pending = commitments?.filter(c => c.status === "pending") ?? [];
  const completed = commitments?.filter(c => c.status === "completed") ?? [];
  const totalAttempts = historyData?.totalAttempts ?? 0;
  const avgScore = historyData?.averageScore ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <BackButton onBack={onBack} />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-[var(--color-ln-gold)]" />
          <h1 className="text-xl font-bold text-[var(--color-ln-navy)]">My Practice Plan</h1>
        </div>
        <p className="text-sm text-[var(--color-ln-navy)]/60">
          Your development priorities, active commitments, and practice progress.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Practice Sessions", value: totalAttempts },
          { label: "Avg Score", value: avgScore ? `${avgScore}/10` : "—" },
          { label: "Open Commitments", value: pending.length },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-ln-navy)]">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Growth Theme */}
      {memory?.aiSummary && (
        <div className="mb-6 rounded-xl bg-[var(--color-ln-navy)]/5 border border-[var(--color-ln-navy)]/10 p-4">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-[var(--color-ln-navy)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--color-ln-navy)] mb-0.5">Your Leadership Growth Theme</p>
              <p className="text-xs text-[var(--color-ln-navy)]/70 leading-relaxed">{memory.aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Open Commitments */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-3 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-[var(--color-ln-gold)]" />
          Open Commitments
        </p>
        {loadingCommitments ? (
          <div className="text-xs text-gray-400 py-4 text-center">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-400">No open commitments yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create one from the home screen to track your practice focus.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-100 bg-amber-50">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 leading-relaxed">{c.text}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onPractice(c.text)}
                    className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-ln-navy)] text-white hover:bg-[var(--color-ln-navy)]/90 transition-colors"
                  >
                    Practise
                  </button>
                  <button
                    onClick={() => updateCommitment.mutate({ commitmentId: c.id, status: "done_well" })}
                    className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Practice */}
      {recommendations && recommendations.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[var(--color-ln-gold)]" />
            Recommended Practice Areas
          </p>
          <div className="space-y-2">
            {recommendations.map(rec => (
              <div key={rec.module} className="p-3.5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{rec.module}</p>
                  <span className="text-xs text-gray-400">Edge {rec.score}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{rec.reason}</p>
                <div className="flex flex-wrap gap-1.5">
                  {rec.scenarios.slice(0, 2).map(s => (
                    <button
                      key={s}
                      onClick={() => onPractice(s)}
                      className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-ln-navy)]/5 text-[var(--color-ln-navy)] hover:bg-[var(--color-ln-navy)]/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Commitments */}
      {completed.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-3 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Completed Commitments
          </p>
          <div className="space-y-2">
            {completed.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 line-through">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Settings */}
      <div className="mt-2 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-[var(--color-ln-navy)] mb-4 flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-[var(--color-ln-gold)]" />
          Practice Settings
        </p>
        <div className="space-y-4">
          {/* Momentum Mode */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-ln-navy)]">Momentum Mode</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Receive a daily check-in notification reminding you to act on your open practice commitment.
              </p>
            </div>
            <button
              onClick={() => updateMomentum.mutate({ momentumMode: !(momentumSettings?.momentumMode ?? false) })}
              disabled={updateMomentum.isPending}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                momentumSettings?.momentumMode ? 'bg-[var(--color-ln-navy)]' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                momentumSettings?.momentumMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {/* Weekly Summary Email */}
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-ln-navy)]">Weekly Practice Summary Email</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Receive a Monday morning digest of your practice sessions, scores, and open commitments from the past week.
              </p>
            </div>
            <button
              onClick={() => updateMomentum.mutate({ weeklyEmailEnabled: !(momentumSettings?.weeklyEmailEnabled ?? true) })}
              disabled={updateMomentum.isPending}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                (momentumSettings?.weeklyEmailEnabled ?? true) ? 'bg-[var(--color-ln-navy)]' : 'bg-gray-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                (momentumSettings?.weeklyEmailEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
