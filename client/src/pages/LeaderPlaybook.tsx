import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import InfinityLoader from "@/components/InfinityLoader";
import {
  ChevronDown, ChevronRight, CheckSquare, Square, BookOpen,
  MessageSquare, Lightbulb, Target, Users, AlertTriangle,
  Brain, Mic, BarChart2, ListChecks, RefreshCw, Sparkles,
  Clock, Zap, ArrowLeft, Plus, History, ChevronUp
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Classification {
  primarySituation: string;
  secondarySituation?: string;
  urgency: string;
  emotionalIntensity: string;
  businessRisk: string;
  competencies: string[];
  stakeholders: string[];
  suggestedApproach: string;
}

interface PlaybookContent {
  situationSummary: { headline: string; context: string; coreChallenge: string; whatIsAtStake: string };
  desiredOutcome: { primaryGoal: string; successLooksLike: string; nonNegotiables: string[]; flexibleElements: string[] };
  hiddenRisks: { risks: string[]; blindSpots: string[]; assumptions: string[]; worstCase: string };
  stakeholderAnalysis: { stakeholders: Array<{ name: string; role: string; motivation: string; concern: string; approach: string }> };
  frameworkRecommendation: { framework: string; whyThisFramework: string; howToApply: string[]; alternativeFramework: string };
  conversationStrategy: { openingApproach: string; keyMessages: string[]; toneTips: string[]; timingAdvice: string; environmentTips: string };
  executiveScript: { openingStatement: string; keyPoints: string[]; handlingObjection: string; closingStatement: string; followUpAction: string };
  preparationCoach: { mindsetShift: string; physicalPrep: string[]; mentalPrep: string[]; lastMinuteTips: string[] };
  rolePlaySetup: { persona: string; openingLine: string; likelyChallenges: string[]; successCriteria: string[] };
  decisionSupport: { tradeoffs: string[]; risks: string[]; unknowns: string[]; scenarioAnalysis: string; secondOrderConsequences: string; recommendedDecision: string };
  executionChecklist: { before: string[]; during: string[]; after: string[] };
  reflectionPrompts: { prompts: string[]; successIndicators: string[] };
  continuousLearning: { lessonsToCapture: string[]; patternToWatch: string; developmentConnection: string };
  personalisation: { strengthsToLeverage: string[]; blindSpotsToWatch: string[]; coachingInsight: string };
}

// ─── Quick-start situation tiles ─────────────────────────────────────────────
const SITUATION_TILES = [
  { label: "Difficult Conversation", icon: MessageSquare, example: "I need to address underperformance with a senior team member who is defensive." },
  { label: "Stakeholder Influence", icon: Users, example: "My CEO rejected my proposal and I need to re-approach with a stronger case." },
  { label: "High-Stakes Decision", icon: Brain, example: "I'm deciding whether to restructure my team before a major product launch." },
  { label: "Conflict Resolution", icon: AlertTriangle, example: "Two of my direct reports are in open conflict and it's affecting the team." },
  { label: "Negotiation", icon: BarChart2, example: "I'm negotiating budget with a CFO who is sceptical of my team's ROI." },
  { label: "Change Leadership", icon: RefreshCw, example: "I need to lead my team through a major reorg they didn't expect." },
  { label: "Executive Presence", icon: Mic, example: "I'm presenting to the board for the first time and need to land my message." },
  { label: "Feedback Delivery", icon: Target, example: "I need to give honest feedback to a high performer who is burning out." },
];

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const SECTION_META = [
  { key: "situationSummary", icon: BookOpen, label: "Situation Summary", color: "#12345A" },
  { key: "desiredOutcome", icon: Target, label: "Desired Outcome", color: "#1a4a7a" },
  { key: "hiddenRisks", icon: AlertTriangle, label: "Hidden Risks & Blind Spots", color: "#8B1A1A" },
  { key: "stakeholderAnalysis", icon: Users, label: "Stakeholder Analysis", color: "#2d6a4f" },
  { key: "frameworkRecommendation", icon: Lightbulb, label: "Framework Recommendation", color: "#7B5EA7" },
  { key: "conversationStrategy", icon: MessageSquare, label: "Conversation Strategy", color: "#1a6b8a" },
  { key: "executiveScript", icon: Mic, label: "Executive Script", color: "#8B5E3C" },
  { key: "preparationCoach", icon: Zap, label: "Preparation Coach", color: "#2d6a4f" },
  { key: "rolePlaySetup", icon: RefreshCw, label: "Role-Play Setup", color: "#7B5EA7" },
  { key: "decisionSupport", icon: Brain, label: "Decision Support", color: "#12345A" },
  { key: "executionChecklist", icon: ListChecks, label: "Execution Checklist", color: "#1a6b8a" },
  { key: "reflectionPrompts", icon: Sparkles, label: "Reflection Prompts", color: "#8B5E3C" },
  { key: "continuousLearning", icon: BookOpen, label: "Continuous Learning", color: "#2d6a4f" },
];

// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({
  meta, content, isOpen, onToggle, isFirst,
}: {
  meta: typeof SECTION_META[0];
  content: any;
  isOpen: boolean;
  onToggle: () => void;
  isFirst?: boolean;
}) {
  const Icon = meta.icon;
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden ${isFirst ? "" : "mt-3"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          <Icon size={16} style={{ color: meta.color }} />
        </div>
        <span className="font-semibold text-gray-900 flex-1">{meta.label}</span>
        {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <SectionContent sectionKey={meta.key} content={content} color={meta.color} />
        </div>
      )}
    </div>
  );
}

// ─── Section Content Renderer ─────────────────────────────────────────────────
function SectionContent({ sectionKey, content, color }: { sectionKey: string; content: any; color: string }) {
  if (!content) return <p className="text-gray-400 italic mt-4">No content available.</p>;

  switch (sectionKey) {
    case "situationSummary":
      return (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl" style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}` }}>
            <p className="font-semibold text-lg" style={{ color }}>{content.headline}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="Context" value={content.context} />
            <InfoCard label="Core Challenge" value={content.coreChallenge} />
          </div>
          <InfoCard label="What Is at Stake" value={content.whatIsAtStake} highlight />
        </div>
      );

    case "desiredOutcome":
      return (
        <div className="mt-4 space-y-4">
          <InfoCard label="Primary Goal" value={content.primaryGoal} highlight />
          <InfoCard label="Success Looks Like" value={content.successLooksLike} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListCard label="Non-Negotiables" items={content.nonNegotiables} color="#8B1A1A" />
            <ListCard label="Flexible Elements" items={content.flexibleElements} color={color} />
          </div>
        </div>
      );

    case "hiddenRisks":
      return (
        <div className="mt-4 space-y-4">
          <ListCard label="Risks" items={content.risks} color="#8B1A1A" icon="⚠️" />
          <ListCard label="Blind Spots" items={content.blindSpots} color="#8B5E3C" icon="👁" />
          <ListCard label="Assumptions to Test" items={content.assumptions} color={color} icon="?" />
          <InfoCard label="Worst-Case Scenario" value={content.worstCase} />
        </div>
      );

    case "stakeholderAnalysis":
      return (
        <div className="mt-4 space-y-3">
          {(content.stakeholders ?? []).map((s: any, i: number) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
                  {s.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Motivation</span><p className="text-gray-700 mt-1">{s.motivation}</p></div>
                <div><span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Concern</span><p className="text-gray-700 mt-1">{s.concern}</p></div>
                <div><span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approach</span><p className="text-gray-700 mt-1">{s.approach}</p></div>
              </div>
            </div>
          ))}
        </div>
      );

    case "frameworkRecommendation":
      return (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl border-2" style={{ borderColor: color, backgroundColor: `${color}06` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>Recommended Framework</p>
            <p className="text-xl font-bold text-gray-900">{content.framework}</p>
            <p className="text-gray-600 mt-2">{content.whyThisFramework}</p>
          </div>
          <ListCard label="How to Apply" items={content.howToApply} color={color} numbered />
          <InfoCard label="Alternative Framework" value={content.alternativeFramework} />
        </div>
      );

    case "conversationStrategy":
      return (
        <div className="mt-4 space-y-4">
          <InfoCard label="Opening Approach" value={content.openingApproach} highlight />
          <ListCard label="Key Messages" items={content.keyMessages} color={color} numbered />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListCard label="Tone Tips" items={content.toneTips} color={color} />
            <InfoCard label="Timing Advice" value={content.timingAdvice} />
          </div>
          <InfoCard label="Environment Tips" value={content.environmentTips} />
        </div>
      );

    case "executiveScript":
      return (
        <div className="mt-4 space-y-4">
          <ScriptBlock label="Opening Statement" value={content.openingStatement} color={color} />
          <ListCard label="Key Points to Cover" items={content.keyPoints} color={color} numbered />
          <ScriptBlock label="Handling Objection" value={content.handlingObjection} color="#8B1A1A" />
          <ScriptBlock label="Closing Statement" value={content.closingStatement} color={color} />
          <InfoCard label="Follow-Up Action" value={content.followUpAction} />
        </div>
      );

    case "preparationCoach":
      return (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl" style={{ backgroundColor: `${color}10`, borderLeft: `3px solid ${color}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-gray-500">Mindset Shift</p>
            <p className="text-gray-800 font-medium italic">"{content.mindsetShift}"</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListCard label="Physical Preparation" items={content.physicalPrep} color={color} />
            <ListCard label="Mental Preparation" items={content.mentalPrep} color={color} />
          </div>
          <ListCard label="Last-Minute Tips" items={content.lastMinuteTips} color="#8B5E3C" icon="⚡" />
        </div>
      );

    case "rolePlaySetup": {
      const buildPracticeUrl = () => {
        const params = new URLSearchParams();
        // Compose a rich issue text for the Practice Coach session
        const issueText = [
          content.persona ? `Practise against: ${content.persona}.` : '',
          content.openingLine ? `Their opening line: "${content.openingLine}"` : '',
          content.likelyChallenges?.length ? `Likely challenges: ${content.likelyChallenges.slice(0, 2).join('; ')}.` : '',
        ].filter(Boolean).join(' ');
        params.set('playbook_issue', encodeURIComponent(issueText));
        params.set('playbook_persona', encodeURIComponent(content.persona ?? ''));
        params.set('playbook_context', encodeURIComponent(content.openingLine ?? ''));
        return `/practice?${params.toString()}`;
      };
      return (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="Persona to Practise Against" value={content.persona} />
            <ScriptBlock label="Their Opening Line" value={content.openingLine} color="#8B1A1A" />
          </div>
          <ListCard label="Likely Challenges" items={content.likelyChallenges} color="#8B1A1A" icon="⚠️" />
          <ListCard label="Success Criteria" items={content.successCriteria} color={color} icon="✓" />
          {/* Practice Coach CTA */}
          <div className="mt-2 rounded-xl border border-[#7B5EA7]/30 bg-[#7B5EA7]/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#7B5EA7]">Ready to rehearse?</p>
              <p className="text-xs text-gray-500 mt-0.5">Open the AI Practice Coach with this scenario pre-loaded — persona, context, and opening line are already set.</p>
            </div>
            <button
              onClick={() => { window.location.href = buildPracticeUrl(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7B5EA7] text-white text-sm font-semibold hover:bg-[#6a4f96] transition-colors whitespace-nowrap flex-shrink-0"
            >
              <Zap className="w-4 h-4" />
              Practice this conversation →
            </button>
          </div>
        </div>
      );
    }

    case "decisionSupport":
      return (
        <div className="mt-4 space-y-4">
          <InfoCard label="Recommended Decision" value={content.recommendedDecision} highlight />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ListCard label="Trade-offs" items={content.tradeoffs} color={color} />
            <ListCard label="Risks" items={content.risks} color="#8B1A1A" />
          </div>
          <InfoCard label="Scenario Analysis" value={content.scenarioAnalysis} />
          <InfoCard label="Second-Order Consequences" value={content.secondOrderConsequences} />
          <ListCard label="Unknowns to Resolve" items={content.unknowns} color="#8B5E3C" icon="?" />
        </div>
      );

    case "executionChecklist":
      return <ChecklistSection content={content} />;

    case "reflectionPrompts":
      return (
        <div className="mt-4 space-y-4">
          <ListCard label="Reflection Questions" items={content.prompts} color={color} numbered />
          <ListCard label="Success Indicators" items={content.successIndicators} color="#2d6a4f" icon="✓" />
        </div>
      );

    case "continuousLearning":
      return (
        <div className="mt-4 space-y-4">
          <ListCard label="Lessons to Capture" items={content.lessonsToCapture} color={color} />
          <InfoCard label="Pattern to Watch" value={content.patternToWatch} />
          <InfoCard label="Development Connection" value={content.developmentConnection} highlight />
        </div>
      );

    default:
      return <pre className="text-xs text-gray-500 mt-4 whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-100"}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}

function ListCard({ label, items, color, numbered, icon }: { label: string; items: string[]; color: string; numbered?: boolean; icon?: string }) {
  if (!items?.length) return null;
  return (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="flex-shrink-0 font-medium" style={{ color }}>
              {numbered ? `${i + 1}.` : icon ?? "•"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScriptBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border-l-4 p-4 bg-white" style={{ borderColor: color }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color }}>{label}</p>
      <p className="text-gray-800 italic leading-relaxed">"{value}"</p>
    </div>
  );
}

function ChecklistSection({ content }: { content: { before: string[]; during: string[]; after: string[] } }) {
  const [checked, setChecked] = useState<{ before: boolean[]; during: boolean[]; after: boolean[] }>({
    before: (content.before ?? []).map(() => false),
    during: (content.during ?? []).map(() => false),
    after: (content.after ?? []).map(() => false),
  });

  const toggle = (phase: "before" | "during" | "after", idx: number) => {
    setChecked(prev => ({
      ...prev,
      [phase]: prev[phase].map((v, i) => i === idx ? !v : v),
    }));
  };

  const CheckPhase = ({ phase, items, label }: { phase: "before" | "during" | "after"; items: string[]; label: string }) => (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 cursor-pointer" onClick={() => toggle(phase, i)}>
            {checked[phase][i]
              ? <CheckSquare size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#2d6a4f" }} />
              : <Square size={18} className="flex-shrink-0 mt-0.5 text-gray-300" />
            }
            <span className={`text-sm ${checked[phase][i] ? "line-through text-gray-400" : "text-gray-700"}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      <CheckPhase phase="before" items={content.before ?? []} label="Before the Conversation" />
      <CheckPhase phase="during" items={content.during ?? []} label="During the Conversation" />
      <CheckPhase phase="after" items={content.after ?? []} label="After the Conversation" />
    </div>
  );
}

// ─── Personalisation Banner ───────────────────────────────────────────────────
function PersonalisationBanner({ content }: { content: PlaybookContent["personalisation"] }) {
  if (!content) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">Your Personalised Coaching Insight</p>
      </div>
      <p className="text-amber-900 italic mb-4">"{content.coachingInsight}"</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2">Strengths to Leverage</p>
          <ul className="space-y-1">
            {(content.strengthsToLeverage ?? []).map((s, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2"><span className="text-amber-500">✦</span>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2">Blind Spots to Watch</p>
          <ul className="space-y-1">
            {(content.blindSpotsToWatch ?? []).map((s, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2"><span className="text-amber-500">⚠</span>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Reflection Form ──────────────────────────────────────────────────────────
function ReflectionForm({ sessionId, existingReflection, prompts }: {
  sessionId: number;
  existingReflection: any;
  prompts: string[];
}) {
  const [form, setForm] = useState({
    whatHappened: existingReflection?.whatHappened ?? "",
    outcome: (existingReflection?.outcome ?? "unclear") as "win" | "partial" | "loss" | "unclear",
    whatSurprised: existingReflection?.whatSurprised ?? "",
    whatWorked: existingReflection?.whatWorked ?? "",
    whatDidnt: existingReflection?.whatDidnt ?? "",
    whatToChange: existingReflection?.whatToChange ?? "",
  });
  const [saved, setSaved] = useState(false);
  const saveReflection = trpc.playbook.saveReflection.useMutation({
    onSuccess: () => setSaved(true),
  });

  const handleSubmit = () => {
    if (!form.whatHappened.trim()) return;
    saveReflection.mutate({ sessionId, ...form });
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-[#12345A]" />
        <h3 className="font-semibold text-gray-900">Post-Meeting Reflection</h3>
      </div>
      {prompts.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">Reflection Prompts</p>
          <ul className="space-y-1">
            {prompts.map((p, i) => <li key={i} className="text-sm text-blue-800">• {p}</li>)}
          </ul>
        </div>
      )}
      <div className="space-y-4">
        {[
          { key: "whatHappened", label: "What happened? (required)", required: true },
          { key: "whatSurprised", label: "What surprised you?" },
          { key: "whatWorked", label: "What worked well?" },
          { key: "whatDidnt", label: "What didn't work?" },
          { key: "whatToChange", label: "What would you do differently?" },
        ].map(({ key, label, required }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
            <Textarea
              value={form[key as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={`${label}...`}
              rows={3}
              className="resize-none"
            />
          </div>
        ))}
        <Button
          onClick={handleSubmit}
          disabled={!form.whatHappened.trim() || saveReflection.isPending}
          className="bg-[#12345A] hover:bg-[#1a4a7a] text-white"
        >
          {saveReflection.isPending ? "Saving..." : saved ? "Reflection Saved ✓" : "Save Reflection"}
        </Button>
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────
function HistoryPanel({ onSelect, currentSessionId }: { onSelect: (id: number) => void; currentSessionId: number | null }) {
  const { data: sessions } = trpc.playbook.listSessions.useQuery({ limit: 20 });

  if (!sessions?.length) return null;

  return (
    <div className="w-72 flex-shrink-0 border-r border-gray-100 pr-6 hidden lg:block">
      <div className="flex items-center gap-2 mb-4">
        <History size={14} className="text-gray-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Past Playbooks</p>
      </div>
      <div className="space-y-2">
        {sessions.map((s: any) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${
              currentSessionId === s.id
                ? "border-[#12345A] bg-[#12345A08]"
                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <p className="text-sm font-medium text-gray-800 line-clamp-2">{s.situationText?.slice(0, 80)}...</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0">{s.playbookType?.replace(/_/g, " ")}</Badge>
              {s.isDone && <span className="text-xs text-green-600">✓ Done</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeaderPlaybook() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // UI state
  const [view, setView] = useState<"input" | "classifying" | "classified" | "generating" | "session">("input");
  const [situationText, setSituationText] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [playbookContent, setPlaybookContent] = useState<PlaybookContent | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["situationSummary"]));
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill situation from ?situation= query param (set by Guide inline Playbook CTA)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefilledSituation = params.get("situation");
    if (prefilledSituation && prefilledSituation.trim().length >= 10) {
      setSituationText(decodeURIComponent(prefilledSituation));
      // Auto-scroll to the textarea
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, []);

  // tRPC mutations
  const classifyMutation = trpc.playbook.classify.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setClassification(data.classification as Classification);
      setView("classified");
    },
    onError: () => setView("input"),
  });

  const generateMutation = trpc.playbook.generate.useMutation({
    onSuccess: (data) => {
      setPlaybookContent(data.playbookContent as PlaybookContent);
      setView("session");
    },
    onError: () => setView("classified"),
  });

  // Load existing session
  const { data: sessionData } = trpc.playbook.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId && view === "session" }
  );

  useEffect(() => {
    if (sessionData?.session?.playbookContent) {
      setPlaybookContent(sessionData.session.playbookContent as PlaybookContent);
    }
  }, [sessionData]);

  const handleClassify = () => {
    if (!situationText.trim() || situationText.length < 10) return;
    setView("classifying");
    classifyMutation.mutate({ situationText });
  };

  const handleGenerate = () => {
    if (!sessionId) return;
    setView("generating");
    generateMutation.mutate({ sessionId });
  };

  const handleTileClick = (example: string) => {
    setSituationText(example);
    textareaRef.current?.focus();
  };

  const handleSelectHistory = (id: number) => {
    setSessionId(id);
    setView("session");
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(SECTION_META.map(s => s.key)));
  const collapseAll = () => setOpenSections(new Set(["situationSummary"]));

  // ── Loading states ──────────────────────────────────────────────────────────
  if (view === "classifying") {
    return <InfinityLoader visible={true} label="Analysing your situation…" />;
  }

  if (view === "generating") {
    return <InfinityLoader visible={true} label="Building your Leader Playbook…" />;
  }

  // ── Input screen ────────────────────────────────────────────────────────────
  if (view === "input") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#12345A] flex items-center justify-center">
              <BookOpen size={20} className="text-[#F2B705]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#12345A]">Leader Playbook</h1>
              <p className="text-gray-500 text-sm">Your AI executive advisor for every leadership moment</p>
            </div>
          </div>
        </div>

        {/* Situation input */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Describe your situation
          </label>
          <Textarea
            ref={textareaRef}
            value={situationText}
            onChange={e => setSituationText(e.target.value)}
            placeholder="e.g. My CEO rejected my proposal and I need to re-approach with a stronger case. The presentation is in 3 days and I'm not sure how to frame the ROI argument differently..."
            rows={5}
            className="resize-none text-base border-gray-200 focus:border-[#12345A] focus:ring-[#12345A]"
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">{situationText.length} / 2000 characters</p>
            <Button
              onClick={handleClassify}
              disabled={situationText.trim().length < 10}
              className="bg-[#12345A] hover:bg-[#1a4a7a] text-white px-6"
            >
              <Sparkles size={15} className="mr-2" />
              Build My Playbook
            </Button>
          </div>
        </div>

        {/* Quick-start tiles */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Quick-start situations</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SITUATION_TILES.map(tile => {
              const TileIcon = tile.icon;
              return (
                <button
                  key={tile.label}
                  onClick={() => handleTileClick(tile.example)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-[#12345A] hover:bg-[#12345A08] transition-colors text-center"
                >
                  <TileIcon size={18} className="text-[#12345A]" />
                  <span className="text-xs font-medium text-gray-700 leading-tight">{tile.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* History link */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#12345A] transition-colors"
        >
          <History size={14} />
          View past playbooks
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showHistory && (
          <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
            <HistoryInline onSelect={handleSelectHistory} />
          </div>
        )}
      </div>
    );
  }

  // ── Classification preview ──────────────────────────────────────────────────
  if (view === "classified" && classification) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => setView("input")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#12345A] mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#12345A] flex items-center justify-center">
              <Brain size={16} className="text-[#F2B705]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Situation Classified</p>
              <p className="font-bold text-[#12345A] text-lg">{classification.primarySituation?.replace(/_/g, " ")}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-5 italic border-l-4 border-[#F2B705] pl-4 bg-amber-50 py-3 rounded-r-xl">
            "{situationText.slice(0, 200)}{situationText.length > 200 ? "..." : ""}"
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <ClassTag label="Urgency" value={classification.urgency} colorMap={URGENCY_COLORS} />
            <ClassTag label="Emotional Intensity" value={classification.emotionalIntensity} />
            <ClassTag label="Business Risk" value={classification.businessRisk} />
            {classification.secondarySituation && (
              <ClassTag label="Also Involves" value={classification.secondarySituation?.replace(/_/g, " ")} />
            )}
          </div>

          {classification.competencies?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Key Competencies</p>
              <div className="flex flex-wrap gap-2">
                {classification.competencies.map(c => (
                  <Badge key={c} variant="outline" className="text-xs border-[#12345A] text-[#12345A]">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {classification.stakeholders?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Stakeholders Involved</p>
              <div className="flex flex-wrap gap-2">
                {classification.stakeholders.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Suggested Approach</p>
            <p className="text-blue-800 text-sm">{classification.suggestedApproach}</p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          className="w-full bg-[#12345A] hover:bg-[#1a4a7a] text-white py-4 text-base font-semibold"
        >
          <Sparkles size={16} className="mr-2" />
          Generate My Full Playbook (13 sections)
        </Button>
        <p className="text-center text-xs text-gray-400 mt-3">Personalised to your Leadership Edge profile · ~20 seconds</p>
      </div>
    );
  }

  // ── Session view ────────────────────────────────────────────────────────────
  if (view === "session" && playbookContent) {
    const pc = playbookContent;
    return (
      <div className="flex gap-8 max-w-6xl mx-auto px-4 py-6">
        {/* History sidebar */}
        <HistoryPanel onSelect={handleSelectHistory} currentSessionId={sessionId} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView("input")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#12345A] transition-colors">
              <ArrowLeft size={14} /> New Playbook
            </button>
            <div className="flex items-center gap-2">
              <button onClick={collapseAll} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded">Collapse all</button>
              <button onClick={expandAll} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded">Expand all</button>
            </div>
          </div>

          {/* Situation headline */}
          <div className="mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#12345A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen size={18} className="text-[#F2B705]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#12345A] leading-tight">
                  {pc.situationSummary?.headline ?? "Leader Playbook"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {classification && (
                    <Badge variant="outline" className="text-xs border-[#12345A] text-[#12345A]">
                      {classification.primarySituation?.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {classification?.urgency && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${URGENCY_COLORS[classification.urgency] ?? "bg-gray-100 text-gray-600"}`}>
                      {classification.urgency} urgency
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personalisation banner */}
          {pc.personalisation && <PersonalisationBanner content={pc.personalisation} />}

          {/* 13 sections (excluding personalisation which is shown in banner) */}
          <div className="space-y-0">
            {SECTION_META.map((meta, idx) => {
              const content = pc[meta.key as keyof PlaybookContent];
              return (
                <AccordionSection
                  key={meta.key}
                  meta={meta}
                  content={content}
                  isOpen={openSections.has(meta.key)}
                  onToggle={() => toggleSection(meta.key)}
                  isFirst={idx === 0}
                />
              );
            })}
          </div>

          {/* Reflection */}
          {sessionData && (
            <ReflectionForm
              sessionId={sessionId!}
              existingReflection={sessionData.reflection}
              prompts={pc.reflectionPrompts?.prompts ?? []}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Inline History (collapsed view) ─────────────────────────────────────────
function HistoryInline({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: sessions } = trpc.playbook.listSessions.useQuery({ limit: 10 });
  if (!sessions?.length) return <p className="p-4 text-sm text-gray-400">No past playbooks yet.</p>;
  return (
    <div className="divide-y divide-gray-100">
      {sessions.map((s: any) => (
        <button key={s.id} onClick={() => onSelect(s.id)} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-800 line-clamp-1">{s.situationText?.slice(0, 100)}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs px-1.5 py-0">{s.playbookType?.replace(/_/g, " ")}</Badge>
            {s.isDone && <span className="text-xs text-green-600">✓ Done</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Classification Tag ───────────────────────────────────────────────────────
function ClassTag({ label, value, colorMap }: { label: string; value: string; colorMap?: Record<string, string> }) {
  const colorClass = colorMap?.[value?.toLowerCase()] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${colorClass}`}>{value}</span>
    </div>
  );
}
