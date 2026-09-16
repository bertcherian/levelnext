import * as React from "react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import PlatformLayout from "@/components/PlatformLayout";
import QueryErrorState from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AiSuggestionFeedback } from "@/components/AiSuggestionFeedback";
import { normalizeAiData, normalizeAiText } from "@shared/citationSanitization";
import {
  Target, Briefcase, Globe, DollarSign, Heart, Star,
  ChevronRight, ChevronLeft, Sparkles, Building2, TrendingUp,
  MapPin, Zap, AlertCircle, CheckCircle2, RefreshCw, Info,
  BarChart3, Eye, ArrowRight, Lightbulb, Lock, Route,
  Users, UserPlus, Network, Phone, Mail, Linkedin, Trash2,
  Award, Clock, Activity, Edit3, X, Plus, Send,
  Radio, BookOpen, Scale
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_TYPES = ["CXO", "VP", "GM", "Director", "Board Member", "Fractional CXO", "Founder", "Operating Partner"];
const COMPANY_TYPES = ["MNC", "GCC", "Startup", "PE-backed", "Family Business", "Consulting Firm", "Board", "Advisory", "Fractional"];
const WORK_STYLES = ["On-site", "Hybrid", "Remote", "Flexible"];
const RISK_LEVELS = [
  { value: "low", label: "Conservative", desc: "Prefer stability and proven paths" },
  { value: "medium", label: "Balanced", desc: "Open to calculated risks" },
  { value: "high", label: "Bold", desc: "Embrace high-risk, high-reward opportunities" },
];
const CORE_VALUES_OPTIONS = [
  "Impact", "Innovation", "Integrity", "Learning", "Autonomy", "Collaboration",
  "Leadership", "Purpose", "Excellence", "Growth", "Family", "Sustainability",
  "Influence", "Creativity", "Recognition", "Financial Security",
];
const INDUSTRY_OPTIONS = [
  "Technology", "FinTech", "BFSI", "Healthcare", "Pharma", "Manufacturing",
  "Retail / E-commerce", "Consulting", "FMCG", "Real Estate", "Education",
  "Media & Entertainment", "Logistics", "Energy", "Automotive", "Telecom",
  "GCC / Shared Services", "Private Equity", "Venture Capital", "Government / PSU",
];

const STEPS = [
  { id: 1, label: "Destination", icon: Target },
  { id: 2, label: "Industries", icon: Building2 },
  { id: 3, label: "Lifestyle", icon: Globe },
  { id: 4, label: "Values", icon: Heart },
  { id: 5, label: "Your Assets", icon: Star },
];

const SCORE_LABELS: Record<string, string> = {
  scoreFit: "Fit",
  scoreGrowth: "Growth",
  scoreLearning: "Learning",
  scoreInfluence: "Influence",
  scoreCompensation: "Compensation",
  scoreLeadershipCulture: "Culture",
  scoreInnovation: "Innovation",
  scoreStability: "Stability",
  scoreCareerAcceleration: "Acceleration",
  scorePurposeAlignment: "Purpose",
};

const COMPANY_TYPE_COLORS: Record<string, string> = {
  Dream: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Likely: "bg-blue-100 text-blue-800 border-blue-300",
  Emerging: "bg-green-100 text-green-800 border-green-300",
  GCC: "bg-purple-100 text-purple-800 border-purple-300",
  PE: "bg-orange-100 text-orange-800 border-orange-300",
  FamilyBusiness: "bg-pink-100 text-pink-800 border-pink-300",
  Consulting: "bg-indigo-100 text-indigo-800 border-indigo-300",
  Board: "bg-red-100 text-red-800 border-red-300",
  Advisory: "bg-teal-100 text-teal-800 border-teal-300",
  Fractional: "bg-cyan-100 text-cyan-800 border-cyan-300",
  OperatingPartner: "bg-gray-100 text-gray-800 border-gray-300",
};

// ── Multi-select chip component ───────────────────────────────────────────────

function ChipSelect({
  options, selected, onChange, max,
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              active
                ? "border-[var(--color-ln-gold)] bg-[var(--color-ln-gold)]/10 text-[var(--color-ln-navy)]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Tags input ────────────────────────────────────────────────────────────────

function TagsInput({
  tags, onChange, placeholder,
}: { tags: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  };
  return (
    <div>
      <div className="flex gap-2 mt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[var(--color-ln-navy)]/10 text-[var(--color-ln-navy)] border border-[var(--color-ln-navy)]/20"
          >
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="ml-1 text-gray-400 hover:text-red-500">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? (value / 10) * 100 : 0;
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-medium text-gray-700">{value ?? "–"}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type View = "home" | "intake" | "strategy" | "universe" | "pipeline" | "relationships" | "score";

// ── Weekly Report Section ─────────────────────────────────────────────────────
function WeeklyReportSection() {
  const [report, setReport] = useState<{ narrative: string; generatedAt: string; stats: { totalOpps: number; activeOpps: number; activatedPaths: number; highValueContacts: number; scoreChange: number | null } } | null>(null);
  const generateReport = trpc.careerAccess.generateWeeklyReport.useMutation({
    onSuccess: (data) => setReport({ ...data, narrative: normalizeAiText(data.narrative) }),
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="mb-6 p-5 rounded-2xl border border-[var(--color-ln-navy)]/15 bg-gradient-to-br from-[var(--color-ln-navy)]/3 to-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[var(--color-ln-navy)]" />
          <span className="font-bold text-[var(--color-ln-navy)] text-sm">Weekly Executive Opportunity Report</span>
        </div>
        <button
          onClick={() => generateReport.mutate()}
          disabled={generateReport.isPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-ln-navy)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generateReport.isPending ? (
            <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-3 h-3" /> Generate Weekly Summary</>
          )}
        </button>
      </div>
      {!report && !generateReport.isPending && (
        <p className="text-xs text-gray-500">Get a 5-sentence AI narrative of your week — pipeline moves, paths activated, relationships engaged, and your #1 priority for next week.</p>
      )}
      {report && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Active Opps", value: report.stats.activeOpps, total: report.stats.totalOpps, color: "text-blue-600" },
              { label: "Paths Activated", value: report.stats.activatedPaths, color: "text-emerald-600" },
              { label: "High-Value Contacts", value: report.stats.highValueContacts, color: "text-purple-600" },
              { label: "Score Change", value: report.stats.scoreChange !== null ? (report.stats.scoreChange >= 0 ? `+${report.stats.scoreChange}` : `${report.stats.scoreChange}`) : "N/A", color: (report.stats.scoreChange ?? 0) >= 0 ? "text-emerald-600" : "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 rounded-xl bg-white border border-gray-100">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-gray-500 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{report.narrative}</p>
            <AiSuggestionFeedback surface="career_weekly_report" suggestionKind="weekly_report" contentKey={`career-weekly-report:${report.generatedAt}`} suggestionText={report.narrative} />
          </div>
          <p className="text-[10px] text-gray-400 text-right">Generated {new Date(report.generatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default function CareerAccess() {
  const [view, setView] = useState<View>("home");
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState<"strategy" | "universe" | null>(null);
  const [universeFilter, setUniverseFilter] = useState<string>("all");
  const [pipelineExpandedId, setPipelineExpandedId] = useState<number | null>(null);
  const [pipelineNotes, setPipelineNotes] = useState<Record<number, string>>({});

  // Relationship Intelligence state
  const [relView, setRelView] = useState<"list" | "add" | "edit" | "detail">("list");
  const [relForm, setRelForm] = useState({
    name: "", currentTitle: "", currentCompany: "", industry: "",
    geography: "", linkedinUrl: "", email: "", phone: "",
    relationshipType: "Former Colleague", howWeKnowEachOther: "",
    sharedHistory: "", notes: "", isKeyConnector: false,
  });
  const [editingRelId, setEditingRelId] = useState<number | null>(null);
  const [activeRelContact, setActiveRelContact] = useState<Record<string, unknown> | null>(null);
  const [scoringRelId, setScoringRelId] = useState<number | null>(null);
  const [relActivationPicks, setRelActivationPicks] = useState<Record<string, unknown>[] | null>(null);
  const [generatingActivation, setGeneratingActivation] = useState(false);

  // Form state
  const [form, setForm] = useState({
    targetRole: "",
    targetRoleType: "",
    problemsToSolve: "",
    legacyStatement: "",
    targetIndustries: [] as string[],
    avoidIndustries: [] as string[],
    targetCompanyTypes: [] as string[],
    dreamCompanies: [] as string[],
    targetGeographies: [] as string[],
    targetCompensationMin: "",
    targetCompensationMax: "",
    compensationCurrency: "INR",
    preferredWorkStyle: "",
    lifestyleStatement: "",
    familyConstraints: "",
    coreValues: [] as string[],
    careerMotivation: "",
    riskAppetite: "" as "low" | "medium" | "high" | "",
    linkedinUrl: "",
    careerHistory: "",
    keyAchievements: "",
    awardsAndRecognition: "",
    speakingHistory: "",
    publications: "",
    industryExpertise: [] as string[],
  });

  // tRPC queries
  const { data: profile, refetch: refetchProfile, isError: profileError } = trpc.careerAccess.getProfile.useQuery();
  const { data: strategy, refetch: refetchStrategy, isError: strategyError } = trpc.careerAccess.getCareerStrategy.useQuery();
  const { data: universe, refetch: refetchUniverse, isError: universeError } = trpc.careerAccess.getOpportunityUniverse.useQuery({ status: undefined });

  const saveProfileMutation = trpc.careerAccess.saveProfile.useMutation();
  const generateStrategyMutation = trpc.careerAccess.generateCareerStrategy.useMutation();
  const generateUniverseMutation = trpc.careerAccess.generateOpportunityUniverse.useMutation();
  const updateStatusMutation = trpc.careerAccess.updateOpportunityStatus.useMutation();
  const clearUniverseMutation = trpc.careerAccess.clearOpportunityUniverse.useMutation();

  // Career Access Score
  const { data: scoreData, refetch: refetchScore, isError: scoreError } = trpc.careerAccess.getCareerAccessScore.useQuery();

  // Chief of Staff Daily Briefing
  const { data: briefingData, refetch: refetchBriefing, isError: briefingError } = trpc.careerAccess.getTodayChiefOfStaffBriefing.useQuery();
  const generateBriefingMutation = trpc.careerAccess.generateChiefOfStaffBriefing.useMutation({
    onSuccess: () => { refetchBriefing(); toast.success("Chief of Staff briefing ready!"); },
    onError: (e) => toast.error(e.message),
  });
  const computeScoreMutation = trpc.careerAccess.computeCareerAccessScore.useMutation({
    onSuccess: () => { refetchScore(); toast.success("Career Access Score updated!"); },
    onError: (e) => toast.error(e.message),
  });

  // Briefing history, activation log, score improvement
  const { data: briefingHistory } = trpc.careerAccess.getBriefingHistory.useQuery();
  const { data: scoreImprovement } = trpc.careerAccess.getScoreImprovement.useQuery();
  const [briefingHistoryOpen, setBriefingHistoryOpen] = useState(false);
  const [selectedHistoryBrief, setSelectedHistoryBrief] = useState<Record<string, unknown> | null>(null);
  const [activationModal, setActivationModal] = useState<{ pathId: number; companyName: string } | null>(null);
  const [activationForm, setActivationForm] = useState({ whatYouDid: "", outcome: "sent_message" as "sent_message" | "had_call" | "got_intro" | "applied" | "other", notes: "" });
  const logActivationMutation = trpc.careerAccess.logAccessPathActivation.useMutation({
    onSuccess: () => { setActivationModal(null); setActivationForm({ whatYouDid: "", outcome: "sent_message", notes: "" }); toast.success("Activation logged!"); },
    onError: (e) => toast.error(e.message),
  });

  // Relationship mutations
  const { data: relationships, refetch: refetchRelationships, isError: relationshipsError } = trpc.careerAccess.getRelationships.useQuery();
  const addRelMutation = trpc.careerAccess.addRelationship.useMutation();
  const updateRelMutation = trpc.careerAccess.updateRelationship.useMutation();
  const deleteRelMutation = trpc.careerAccess.deleteRelationship.useMutation();
  const scoreRelMutation = trpc.careerAccess.scoreRelationship.useMutation();

  // ── Kanban helpers ─────────────────────────────────────────────────────────
  const KANBAN_COLUMNS = [
    { id: "identified", label: "Identified", color: "#60a5fa", bg: "oklch(from #60a5fa l c h / 0.07)" },
    { id: "researching", label: "Researching", color: "#a78bfa", bg: "oklch(from #a78bfa l c h / 0.07)" },
    { id: "targeting", label: "Targeting", color: "#f59e0b", bg: "oklch(from #f59e0b l c h / 0.07)" },
    { id: "active", label: "Active", color: "#34d399", bg: "oklch(from #34d399 l c h / 0.07)" },
    { id: "paused", label: "Paused", color: "#94a3b8", bg: "oklch(from #94a3b8 l c h / 0.07)" },
  ] as const;

  const handleKanbanMove = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus }, { onSuccess: () => refetchUniverse() });
  };

  const handleKanbanNotesSave = (id: number) => {
    updateStatusMutation.mutate(
      { id, status: (universe?.find((o) => o.id === id)?.status ?? "identified"), userNotes: pipelineNotes[id] },
      { onSuccess: () => { refetchUniverse(); toast.success("Notes saved."); } }
    );
  };

  // Populate form from existing profile
  useEffect(() => {
    if (profile) {
      setForm({
        targetRole: profile.targetRole ?? "",
        targetRoleType: profile.targetRoleType ?? "",
        problemsToSolve: profile.problemsToSolve ?? "",
        legacyStatement: profile.legacyStatement ?? "",
        targetIndustries: (profile.targetIndustries as string[] | null) ?? [],
        avoidIndustries: (profile.avoidIndustries as string[] | null) ?? [],
        targetCompanyTypes: (profile.targetCompanyTypes as string[] | null) ?? [],
        dreamCompanies: (profile.dreamCompanies as string[] | null) ?? [],
        targetGeographies: (profile.targetGeographies as string[] | null) ?? [],
        targetCompensationMin: profile.targetCompensationMin?.toString() ?? "",
        targetCompensationMax: profile.targetCompensationMax?.toString() ?? "",
        compensationCurrency: profile.compensationCurrency ?? "INR",
        preferredWorkStyle: profile.preferredWorkStyle ?? "",
        lifestyleStatement: profile.lifestyleStatement ?? "",
        familyConstraints: profile.familyConstraints ?? "",
        coreValues: (profile.coreValues as string[] | null) ?? [],
        careerMotivation: profile.careerMotivation ?? "",
        riskAppetite: (profile.riskAppetite as "low" | "medium" | "high" | "") ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        careerHistory: profile.careerHistory ?? "",
        keyAchievements: profile.keyAchievements ?? "",
        awardsAndRecognition: profile.awardsAndRecognition ?? "",
        speakingHistory: profile.speakingHistory ?? "",
        publications: profile.publications ?? "",
        industryExpertise: (profile.industryExpertise as string[] | null) ?? [],
      });
    }
  }, [profile]);

  const calcCompletion = () => {
    const fields = [
      form.targetRole, form.targetRoleType, form.problemsToSolve,
      form.targetIndustries.length > 0, form.targetCompanyTypes.length > 0,
      form.targetGeographies.length > 0, form.targetCompensationMin,
      form.preferredWorkStyle, form.coreValues.length > 0,
      form.careerMotivation, form.riskAppetite, form.careerHistory, form.keyAchievements,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleSave = async (nextStep?: number) => {
    const pct = calcCompletion();
    await saveProfileMutation.mutateAsync({
      ...form,
      targetCompensationMin: form.targetCompensationMin ? parseInt(form.targetCompensationMin) : undefined,
      targetCompensationMax: form.targetCompensationMax ? parseInt(form.targetCompensationMax) : undefined,
      riskAppetite: form.riskAppetite || undefined,
      completionPct: pct,
    });
    await refetchProfile();
    if (nextStep) setStep(nextStep);
  };

  const handleGenerateStrategy = async () => {
    setGenerating("strategy");
    try {
      await handleSave();
      await generateStrategyMutation.mutateAsync();
      await refetchStrategy();
      setView("strategy");
      toast.success("Career Strategy generated! Your personalised strategy is ready.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate strategy.");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateUniverse = async () => {
    setGenerating("universe");
    try {
      await clearUniverseMutation.mutateAsync();
      await generateUniverseMutation.mutateAsync();
      await refetchUniverse();
      setView("universe");
      toast.success("Opportunity Universe mapped! Your target organisations are ready.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate universe.");
    } finally {
      setGenerating(null);
    }
  };

  const strategyData = strategy?.strategyData as Record<string, unknown> | null ?? null;
  const activeOrgs = universe?.filter((o) => o.status !== "removed") ?? [];
  const filteredOrgs = universeFilter === "all"
    ? activeOrgs
    : activeOrgs.filter((o) => o.companyType === universeFilter);

  if (profileError || strategyError || universeError || scoreError || briefingError || relationshipsError) {
    return (
      <PlatformLayout>
        <QueryErrorState onRetry={() => {
          void refetchProfile();
          void refetchStrategy();
          void refetchUniverse();
          void refetchScore();
          void refetchBriefing();
          void refetchRelationships();
        }} />
      </PlatformLayout>
    );
  }

  // ── Home view ──────────────────────────────────────────────────────────────

  if (view === "home") {
    const completion = profile?.completionPct ?? 0;
    return (
      <PlatformLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              Executive Opportunity System™
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-ln-navy)] mb-2">
              Build Strategic Access
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl">
              Elite executives don't chase opportunities. They create them. This is your AI-powered executive opportunity engine.
            </p>
          </div>

          {/* Chief of Staff Daily Briefing */}
          {(() => {
            const rawBrief = briefingData?.brief as Record<string, unknown> | null ?? null;
            const brief = rawBrief ? normalizeAiData(rawBrief) : null;
            const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
            return (
              <div className="mb-6 rounded-2xl overflow-hidden" style={{ background: "var(--color-ln-navy)" }}>
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: "oklch(from white l c h / 0.1)" }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: "var(--color-ln-gold)" }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-gold)" }}>AI Chief of Staff</span>
                    <span className="text-xs" style={{ color: "oklch(60% 0.02 248.6)" }}>· {today}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {brief && <AiSuggestionFeedback surface="career_chief_of_staff" suggestionKind="chief_of_staff_brief" contentKey={`career-chief-of-staff:${today}`} suggestionText={JSON.stringify(brief)} dark />}
                    <button
                      onClick={() => generateBriefingMutation.mutate()}
                      disabled={generateBriefingMutation.isPending}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                      style={{ background: "oklch(from white l c h / 0.1)", color: "white" }}
                    >
                      {generateBriefingMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {brief ? "Refresh" : "Generate Briefing"}
                    </button>
                  </div>
                </div>
                {!brief ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm" style={{ color: "oklch(65% 0.02 248.6)" }}>Click "Generate Briefing" for your AI Chief of Staff morning brief — pipeline health, follow-ups, and today's priority action.</p>
                  </div>
                ) : (
                  <div className="px-5 py-4 space-y-3">
                    {Boolean(brief.greeting) && (
                      <p className="text-white font-medium text-sm">{String(brief.greeting ?? "")}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Boolean(brief.todaysPriorityAction) && (
                        <div className="p-3 rounded-xl" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.12)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-ln-gold)" }}>Today's Priority</p>
                          <p className="text-xs text-white">{String(brief.todaysPriorityAction ?? "")}</p>
                        </div>
                      )}
                      {Boolean(brief.pipelineHealth) && (
                        <div className="p-3 rounded-xl" style={{ background: "oklch(from white l c h / 0.06)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Pipeline Health</p>
                          <p className="text-xs" style={{ color: "oklch(80% 0.02 248.6)" }}>{String(brief.pipelineHealth ?? "")}</p>
                        </div>
                      )}
                      {Boolean(brief.coachingNudge) && (
                        <div className="p-3 rounded-xl" style={{ background: "oklch(from white l c h / 0.06)" }}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Mindset</p>
                          <p className="text-xs" style={{ color: "oklch(80% 0.02 248.6)" }}>{String(brief.coachingNudge ?? "")}</p>
                        </div>
                      )}
                    </div>
                    {Array.isArray(brief.followUpsDue) && (brief.followUpsDue as Record<string, unknown>[]).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "oklch(55% 0.02 248.6)" }}>Follow-ups due:</span>
                        {(brief.followUpsDue as Record<string, unknown>[]).slice(0, 3).map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "oklch(from #f87171 l c h / 0.15)", color: "#fca5a5" }}>
                            {String(f.company)} — {String(f.action)}
                          </span>
                        ))}
                      </div>
                    )}
                    {Array.isArray(brief.radarAlerts) && (brief.radarAlerts as Record<string, unknown>[]).length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>Radar:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(brief.radarAlerts as Record<string, unknown>[]).map((r, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: String(r.urgency) === "high" ? "oklch(from #f59e0b l c h / 0.2)" : "oklch(from white l c h / 0.1)", color: String(r.urgency) === "high" ? "#fcd34d" : "oklch(75% 0.02 248.6)" }}>
                              {String(r.company)} — {String(r.signal)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Profile completion */}
          {completion > 0 && (
            <div className="mb-6 p-4 rounded-xl border border-[var(--color-ln-gold)]/30 bg-[var(--color-ln-gold)]/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--color-ln-navy)]">Career Profile — {completion}% complete</span>
                <Button variant="outline" size="sm" onClick={() => { setStep(1); setView("intake"); }}>
                  {completion < 100 ? "Continue" : "Edit Profile"}
                </Button>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[var(--color-ln-gold)] transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}

          {/* Modules grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Career Profile */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: completion > 0 ? "var(--color-ln-gold)" : "#e5e7eb", background: completion > 0 ? "var(--color-ln-gold)/5" : "white" }}
              onClick={() => { setStep(1); setView("intake"); }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Career Profile</div>
                  <div className="text-xs text-gray-500">Your Career Graph foundation</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Define your destination, values, constraints, and professional assets.</p>
              {completion > 0 ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {completion}% complete
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                  <ArrowRight className="w-3.5 h-3.5" /> Start here
                </div>
              )}
            </div>

            {/* Career Strategy */}
            <div
              className={`p-5 rounded-xl border-2 transition-all ${completion >= 40 ? "cursor-pointer hover:shadow-md" : "opacity-60"}`}
              style={{ borderColor: strategyData ? "var(--color-ln-gold)" : "#e5e7eb" }}
              onClick={() => { if (completion >= 40) setView("strategy"); }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Career Strategy</div>
                  <div className="text-xs text-gray-500">Your north star statement</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">AI-generated strategic positioning, narrative, and 30-day action plan.</p>
              {strategyData ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strategy ready
                </div>
              ) : completion >= 40 ? (
                <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                  <ArrowRight className="w-3.5 h-3.5" /> Generate strategy
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Lock className="w-3.5 h-3.5" /> Complete profile first
                </div>
              )}
            </div>

            {/* Opportunity Universe */}
            <div
              className={`p-5 rounded-xl border-2 transition-all ${completion >= 40 ? "cursor-pointer hover:shadow-md" : "opacity-60"}`}
              style={{ borderColor: activeOrgs.length > 0 ? "var(--color-ln-gold)" : "#e5e7eb" }}
              onClick={() => { if (completion >= 40) setView("universe"); }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Opportunity Universe</div>
                  <div className="text-xs text-gray-500">{activeOrgs.length > 0 ? `${activeOrgs.length} organisations mapped` : "Target organisation map"}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Scored and categorised target organisations across 10 strategic dimensions.</p>
              {activeOrgs.length > 0 ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {activeOrgs.length} orgs mapped
                </div>
              ) : completion >= 40 ? (
                <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                  <ArrowRight className="w-3.5 h-3.5" /> Map your universe
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Lock className="w-3.5 h-3.5" /> Complete profile first
                </div>
              )}
            </div>

            {/* Opportunity Pipeline Kanban */}
            <div
              className={`p-5 rounded-xl border-2 transition-all ${activeOrgs.length > 0 ? "cursor-pointer hover:shadow-md" : "opacity-60"}`}
              style={{ borderColor: activeOrgs.filter((o) => o.status === "active").length > 0 ? "var(--color-ln-gold)" : "#e5e7eb" }}
              onClick={() => { if (activeOrgs.length > 0) setView("pipeline"); }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--color-ln-navy)" }}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Opportunity Pipeline</div>
                  <div className="text-xs text-gray-500">
                    {activeOrgs.filter((o) => o.status === "active").length > 0
                      ? `${activeOrgs.filter((o) => o.status === "active").length} active engagements`
                      : "Kanban pipeline board"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Track organisations across Identified → Researching → Targeting → Active → Paused stages.</p>
              {activeOrgs.length > 0 ? (
                <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                  <ArrowRight className="w-3.5 h-3.5" /> Open pipeline board
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Lock className="w-3.5 h-3.5" /> Map your universe first
                </div>
              )}
            </div>
            {/* Relationship Intelligence */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: (relationships?.length ?? 0) > 0 ? "var(--color-ln-gold)" : "#e5e7eb" }}
              onClick={() => setView("relationships")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Relationship Intelligence</div>
                  <div className="text-xs text-gray-500">
                    {(relationships?.length ?? 0) > 0 ? `${relationships!.length} contacts mapped` : "Your strategic network"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Map your network, score each relationship, and get weekly activation picks from your AI Chief of Staff.</p>
              {(relationships?.length ?? 0) > 0 ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {relationships!.length} contacts · AI-scored
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                  <ArrowRight className="w-3.5 h-3.5" /> Map your network
                </div>
              )}
            </div>

            {/* Access Path Generator */}
            <div
              className={`p-5 rounded-xl border-2 transition-all ${activeOrgs.length > 0 ? "cursor-pointer hover:shadow-md" : "opacity-60"}`}
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => { if (activeOrgs.length > 0) window.location.href = "/career/access-paths"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Route className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Access Path Generator</div>
                  <div className="text-xs text-gray-500">How to get into each company</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">AI-generated access strategies: warm intro routes, decision makers, and outreach drafts for each target company.</p>
              {activeOrgs.length > 0 ? (
                <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                  <ArrowRight className="w-3.5 h-3.5" /> Generate access paths
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Lock className="w-3.5 h-3.5" /> Map your universe first
                </div>
              )}
            </div>

            {/* Executive Brand Engine */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => { window.location.href = "/career/brand"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Executive Brand Engine</div>
                  <div className="text-xs text-gray-500">LinkedIn · Thought Leadership · Content</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">AI-generated LinkedIn headline, brand statement, thought leadership pillars, 4-week content calendar, and executive bio.</p>
              <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                <ArrowRight className="w-3.5 h-3.5" /> Build my brand
              </div>
            </div>

            {/* Outreach Engine */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => { window.location.href = "/career/brand?tab=outreach"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Outreach Engine</div>
                  <div className="text-xs text-gray-500">AI-crafted messages per contact</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Generate LinkedIn messages, emails, warm intro requests, follow-ups, and conversation prep for each target contact.</p>
              <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                <ArrowRight className="w-3.5 h-3.5" /> Craft outreach
              </div>
            </div>

            {/* Opportunity Radar */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => { window.location.href = "/career/radar"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Opportunity Radar</div>
                  <div className="text-xs text-gray-500">Signals from target companies</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">AI scans your target companies for hiring signals, leadership changes, funding rounds, and expansions — then tells you exactly what to do next.</p>
              <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                <ArrowRight className="w-3.5 h-3.5" /> View signals
              </div>
            </div>

            {/* Interview Prep */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => { window.location.href = "/career/interview-prep"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Interview Preparation</div>
                  <div className="text-xs text-gray-500">Questions · STAR stories · Key messages</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">AI-generated role research, likely interview questions with suggested answers, STAR story bank, and key messages to land.</p>
              <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                <ArrowRight className="w-3.5 h-3.5" /> Prepare now
              </div>
            </div>

            {/* Negotiation Intelligence */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => { window.location.href = "/career/negotiation"; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Negotiation Intelligence</div>
                  <div className="text-xs text-gray-500">Offer analysis · Counter-offer scripts</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Analyse any offer against market benchmarks, build your negotiation strategy, get counter-offer scripts, and score the decision across 5 dimensions.</p>
              <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                <ArrowRight className="w-3.5 h-3.5" /> Analyse offer
              </div>
            </div>

            {/* Career Access Score */}
            <div
              className="p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
              style={{ borderColor: "#e5e7eb" }}
              onClick={() => setView("score")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-ln-navy)]">Career Access Score™</div>
                  <div className="text-xs text-gray-500">Your 12-dimension readiness score</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Compute your executive opportunity readiness across 12 strategic dimensions and track your progress over time.</p>
              <div className="flex items-center gap-1 text-[var(--color-ln-gold)] text-xs font-medium">
                <ArrowRight className="w-3.5 h-3.5" /> View my score
              </div>
            </div>
          </div>

          {/* Score Improvement Banner */}
          {scoreImprovement && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-4" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm mb-0.5">🎉 Your Career Access Score improved!</div>
                <div className="text-white/80 text-xs">
                  Your score went from <strong className="text-white">{scoreImprovement.previousScore}</strong> to <strong className="text-white">{scoreImprovement.latestScore}</strong> — a <strong className="text-white">+{scoreImprovement.improvement} point</strong> improvement. Keep adding data to keep climbing.
                </div>
              </div>
              <button onClick={() => setView("score")} className="shrink-0 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all">
                View Score
              </button>
            </div>
          )}

          {/* Briefing History */}
          {(briefingHistory?.length ?? 0) > 1 && (
            <div className="mb-6">
              <button
                onClick={() => setBriefingHistoryOpen((v) => !v)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-[var(--color-ln-navy)] transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                {briefingHistoryOpen ? "Hide" : "View"} briefing history ({briefingHistory!.length} days)
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${briefingHistoryOpen ? "rotate-90" : ""}`} />
              </button>
              {briefingHistoryOpen && (
                <div className="mt-3 space-y-2">
                  {briefingHistory!.map((b) => {
                    const bData = b.brief as Record<string, unknown> | null;
                    const isSelected = selectedHistoryBrief === bData;
                    return (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl border cursor-pointer transition-all hover:border-[var(--color-ln-navy)]/30"
                        style={{ borderColor: isSelected ? "var(--color-ln-navy)" : "#e5e7eb", background: isSelected ? "var(--color-ln-navy)/3" : "white" }}
                        onClick={() => setSelectedHistoryBrief(isSelected ? null : bData)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[var(--color-ln-navy)]">{b.briefDate}</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                        </div>
                        {bData && <p className="text-xs text-gray-500 line-clamp-1">{String(bData.todaysPriorityAction ?? "")}</p>}
                        {isSelected && bData && (
                          <div className="mt-3 space-y-2 border-t pt-3">
                            {Boolean(bData.greeting) && <p className="text-xs text-gray-700 font-medium">{String(bData.greeting)}</p>}
                            {Boolean(bData.pipelineHealth) && <p className="text-xs text-gray-600"><span className="font-medium">Pipeline:</span> {String(bData.pipelineHealth)}</p>}
                            {Boolean(bData.coachingNudge) && <p className="text-xs text-gray-600"><span className="font-medium">Mindset:</span> {String(bData.coachingNudge)}</p>}
                            {Boolean(bData.weeklyOutlook) && <p className="text-xs text-gray-600"><span className="font-medium">Weekly outlook:</span> {String(bData.weeklyOutlook)}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Weekly Executive Opportunity Report */}
          <WeeklyReportSection />

          {/* Philosophy note */}
          <div className="p-4 rounded-xl bg-[var(--color-ln-navy)]/5 border border-[var(--color-ln-navy)]/10">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[var(--color-ln-gold)] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[var(--color-ln-navy)] text-sm mb-1">The Executive Opportunity Philosophy</div>
                <p className="text-sm text-gray-600">
                  Most executives fail because they spend their energy chasing opportunities. Elite executives create them.
                  This platform shifts you from <em>"I need a job"</em> to <em>"I am building strategic access."</em>
                  Everything here reinforces that mindset.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  // ── Intake form ────────────────────────────────────────────────────────────

  if (view === "intake") {
    const StepIcon = STEPS[step - 1].icon;
    return (
      <PlatformLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Back */}
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to Executive Opportunity System
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step === s.id
                      ? "bg-[var(--color-ln-navy)] text-white"
                      : step > s.id
                      ? "bg-[var(--color-ln-gold)]/20 text-[var(--color-ln-navy)]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <s.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-ln-navy)]">
                  {step === 1 && "Define Your Destination"}
                  {step === 2 && "Industries & Companies"}
                  {step === 3 && "Lifestyle & Compensation"}
                  {step === 4 && "Values & Motivation"}
                  {step === 5 && "Your Professional Assets"}
                </h2>
                <p className="text-sm text-gray-500">
                  {step === 1 && "What role are you truly trying to reach?"}
                  {step === 2 && "Which industries and companies excite you?"}
                  {step === 3 && "What lifestyle do you want?"}
                  {step === 4 && "What drives you and what are your non-negotiables?"}
                  {step === 5 && "Your career story and achievements"}
                </p>
              </div>
            </div>

            {/* Step 1: Destination */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Role Title</label>
                  <Input value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} placeholder="e.g. Chief Revenue Officer, VP Engineering, MD APAC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
                  <ChipSelect options={ROLE_TYPES} selected={form.targetRoleType ? [form.targetRoleType] : []} onChange={(v) => setForm({ ...form, targetRoleType: v[0] ?? "" })} max={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What problems do you want to solve?</label>
                  <Textarea value={form.problemsToSolve} onChange={(e) => setForm({ ...form, problemsToSolve: e.target.value })} placeholder="e.g. Scale a business from ₹100Cr to ₹500Cr, build a world-class engineering team, lead digital transformation..." rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What legacy are you building?</label>
                  <Textarea value={form.legacyStatement} onChange={(e) => setForm({ ...form, legacyStatement: e.target.value })} placeholder="e.g. Be known as the leader who built India's most trusted FinTech brand..." rows={2} />
                </div>
              </div>
            )}

            {/* Step 2: Industries */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Industries <span className="text-gray-400 font-normal">(select up to 5)</span></label>
                  <ChipSelect options={INDUSTRY_OPTIONS} selected={form.targetIndustries} onChange={(v) => setForm({ ...form, targetIndustries: v })} max={5} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industries to avoid</label>
                  <ChipSelect options={INDUSTRY_OPTIONS} selected={form.avoidIndustries} onChange={(v) => setForm({ ...form, avoidIndustries: v })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Company Types</label>
                  <ChipSelect options={COMPANY_TYPES} selected={form.targetCompanyTypes} onChange={(v) => setForm({ ...form, targetCompanyTypes: v })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dream Companies <span className="text-gray-400 font-normal">(type and press Enter)</span></label>
                  <TagsInput tags={form.dreamCompanies} onChange={(v) => setForm({ ...form, dreamCompanies: v })} placeholder="e.g. Razorpay, Unilever, McKinsey..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Geographies</label>
                  <TagsInput tags={form.targetGeographies} onChange={(v) => setForm({ ...form, targetGeographies: v })} placeholder="e.g. Bangalore, Mumbai, Singapore, Dubai..." />
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Compensation</label>
                    <div className="flex gap-2">
                      <Input value={form.targetCompensationMin} onChange={(e) => setForm({ ...form, targetCompensationMin: e.target.value })} placeholder="e.g. 80" type="number" />
                      <select
                        value={form.compensationCurrency}
                        onChange={(e) => setForm({ ...form, compensationCurrency: e.target.value })}
                        className="border border-gray-200 rounded-md px-2 text-sm"
                      >
                        <option value="INR">₹ Lakhs</option>
                        <option value="USD">$ K</option>
                        <option value="SGD">SGD K</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Compensation</label>
                    <Input value={form.targetCompensationMax} onChange={(e) => setForm({ ...form, targetCompensationMax: e.target.value })} placeholder="e.g. 150" type="number" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Work Style</label>
                  <ChipSelect options={WORK_STYLES} selected={form.preferredWorkStyle ? [form.preferredWorkStyle] : []} onChange={(v) => setForm({ ...form, preferredWorkStyle: v[0] ?? "" })} max={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle you want</label>
                  <Textarea value={form.lifestyleStatement} onChange={(e) => setForm({ ...form, lifestyleStatement: e.target.value })} placeholder="e.g. Based in Bangalore, open to 30% travel, want time for family on weekends..." rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family / personal constraints</label>
                  <Textarea value={form.familyConstraints} onChange={(e) => setForm({ ...form, familyConstraints: e.target.value })} placeholder="e.g. Can't relocate for 2 years, spouse works in Bangalore..." rows={2} />
                </div>
              </div>
            )}

            {/* Step 4: Values */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Core Values <span className="text-gray-400 font-normal">(select up to 6)</span></label>
                  <ChipSelect options={CORE_VALUES_OPTIONS} selected={form.coreValues} onChange={(v) => setForm({ ...form, coreValues: v })} max={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What drives you most right now?</label>
                  <Textarea value={form.careerMotivation} onChange={(e) => setForm({ ...form, careerMotivation: e.target.value })} placeholder="e.g. I want to build something that outlasts me. I'm energised by transforming underperforming teams..." rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Appetite</label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {RISK_LEVELS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm({ ...form, riskAppetite: r.value as "low" | "medium" | "high" })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.riskAppetite === r.value
                            ? "border-[var(--color-ln-gold)] bg-[var(--color-ln-gold)]/10"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-sm text-[var(--color-ln-navy)]">{r.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Assets */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Career History <span className="text-gray-400 font-normal">(brief narrative)</span></label>
                  <Textarea value={form.careerHistory} onChange={(e) => setForm({ ...form, careerHistory: e.target.value })} placeholder="e.g. 18 years across FMCG and FinTech. Started in sales, moved to P&L leadership. Led 3 turnarounds. Currently VP Sales at XYZ..." rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                  <Textarea value={form.keyAchievements} onChange={(e) => setForm({ ...form, keyAchievements: e.target.value })} placeholder="e.g. Grew revenue from ₹80Cr to ₹320Cr in 3 years. Built a 200-person engineering team from scratch. Led IPO preparation..." rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry Expertise</label>
                  <TagsInput tags={form.industryExpertise} onChange={(v) => setForm({ ...form, industryExpertise: v })} placeholder="e.g. B2B SaaS, Supply Chain, Digital Payments..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Awards & Recognition <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input value={form.awardsAndRecognition} onChange={(e) => setForm({ ...form, awardsAndRecognition: e.target.value })} placeholder="e.g. Forbes 40 Under 40, NASSCOM Top 10 CTO..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Speaking / Publications <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input value={form.speakingHistory} onChange={(e) => setForm({ ...form, speakingHistory: e.target.value })} placeholder="e.g. TEDx speaker, author of 'The Scaling Leader'..." />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setView("home")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step < 5 ? (
                <Button onClick={() => handleSave(step + 1)} disabled={saveProfileMutation.isPending}>
                  Save & Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => handleSave().then(() => setView("home"))} disabled={saveProfileMutation.isPending}>
                    Save Profile
                  </Button>
                  <Button
                    onClick={handleGenerateStrategy}
                    disabled={generating !== null}
                    style={{ background: "var(--color-ln-navy)", color: "white" }}
                  >
                    {generating === "strategy" ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Strategy</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  // ── Career Strategy view ───────────────────────────────────────────────────

  if (view === "strategy") {
    return (
      <PlatformLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Career Strategy Statement
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-ln-navy)]">Your Career North Star</h1>
            </div>
            <Button
              onClick={handleGenerateStrategy}
              disabled={generating !== null}
              variant="outline"
              size="sm"
            >
              {generating === "strategy" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-1">Regenerate</span>
            </Button>
          </div>

          {!strategyData ? (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No strategy generated yet.</p>
              <Button onClick={handleGenerateStrategy} disabled={generating !== null} style={{ background: "var(--color-ln-navy)", color: "white" }}>
                {generating === "strategy" ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate My Strategy</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* North Star */}
              <div className="p-5 rounded-xl border-2 border-[var(--color-ln-gold)] bg-[var(--color-ln-gold)]/5">
                <div className="text-xs font-semibold text-[var(--color-ln-gold)] uppercase tracking-wider mb-2">Your North Star</div>
                <p className="text-xl font-bold text-[var(--color-ln-navy)]">{strategyData.northStarStatement as string}</p>
              </div>

              {/* Headline + Positioning */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Strategic Headline</div>
                <p className="text-lg font-semibold text-[var(--color-ln-navy)] mb-4">{strategyData.headline as string}</p>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Positioning Statement</div>
                <p className="text-gray-700">{strategyData.positioningStatement as string}</p>
              </div>

              {/* UVP */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Unique Value Proposition</div>
                <p className="text-gray-700">{strategyData.uniqueValueProposition as string}</p>
              </div>

              {/* Primary Narrative */}
              <div className="p-5 rounded-xl border border-gray-200 bg-white">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Primary Narrative</div>
                <p className="text-gray-700 italic">"{strategyData.primaryNarrative as string}"</p>
              </div>

              {/* Strengths + Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-green-200 bg-green-50">
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Lead With These Strengths</div>
                  <ul className="space-y-2">
                    {(strategyData.keyStrengths as string[]).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 rounded-xl border border-orange-200 bg-orange-50">
                  <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-3">Address These Gaps Proactively</div>
                  <ul className="space-y-2">
                    {(strategyData.credibilityGaps as string[]).map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Target opportunities + timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-gray-200 bg-white">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Opportunity Types</div>
                  <ol className="space-y-2">
                    {(strategyData.targetOpportunityTypes as string[]).map((t, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-ln-navy)] text-white text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                        {t}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="p-5 rounded-xl border border-gray-200 bg-white">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Realistic Timeline</div>
                  <p className="text-gray-700 text-sm">{strategyData.timeHorizon as string}</p>
                </div>
              </div>

              {/* 30-day actions */}
              <div className="p-5 rounded-xl border-2 border-[var(--color-ln-navy)] bg-[var(--color-ln-navy)]/5">
                <div className="text-xs font-semibold text-[var(--color-ln-navy)] uppercase tracking-wider mb-3">Your Next 30 Days — Top 3 Actions</div>
                <ol className="space-y-3">
                  {(strategyData.immediateActions as string[]).map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>

              {/* CTA to universe */}
              <div className="flex justify-end pt-2">
                <Button onClick={() => setView("universe")} style={{ background: "var(--color-ln-navy)", color: "white" }}>
                  Map My Opportunity Universe <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </PlatformLayout>
    );
  }

  // ── Career Access Score Dashboard ────────────────────────────────────────
  if (view === "score") {
    const latest = scoreData?.latest as Record<string, unknown> | null ?? null;
    const history = (scoreData?.history ?? []) as Record<string, unknown>[];

    const SCORE_DIMS = [
      { key: "scoreStrategyClarity", label: "Strategy Clarity" },
      { key: "scorePositioningStrength", label: "Positioning" },
      { key: "scoreOpportunityPipeline", label: "Opportunity Pipeline" },
      { key: "scoreRelationshipCapital", label: "Relationship Capital" },
      { key: "scoreAccessPathQuality", label: "Access Path Quality" },
      { key: "scoreVisibilityPresence", label: "Visibility & Presence" },
      { key: "scoreNarrativeReadiness", label: "Narrative Readiness" },
      { key: "scoreMarketTiming", label: "Market Timing" },
      { key: "scoreCredentialFit", label: "Credential Fit" },
      { key: "scoreNetworkDensity", label: "Network Density" },
      { key: "scoreOutreachMomentum", label: "Outreach Momentum" },
      { key: "scoreConfidenceReadiness", label: "Confidence Readiness" },
    ];

    const radarData = SCORE_DIMS.map((d) => ({
      subject: d.label.split(" ")[0],
      fullLabel: d.label,
      value: latest ? (latest[d.key] as number ?? 0) : 0,
      fullMark: 100,
    }));

    const composite = latest ? (latest.compositeScore as number ?? 0) : 0;
    const compositeColor = composite >= 70 ? "#34d399" : composite >= 50 ? "#f59e0b" : "#f87171";

    return (
      <PlatformLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-1">
                <BarChart3 className="w-4 h-4" /> Career Access Score™
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-ln-navy)]">Your Executive Opportunity Readiness</h1>
              <p className="text-sm text-gray-500 mt-1">12-dimension AI-computed score based on your profile, strategy, pipeline, and network.</p>
            </div>
            <Button
              onClick={() => computeScoreMutation.mutate()}
              disabled={computeScoreMutation.isPending}
              style={{ background: "var(--color-ln-navy)", color: "white" }}
              className="gap-2"
            >
              {computeScoreMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {latest ? "Recompute Score" : "Compute My Score"}
            </Button>
          </div>

          {!latest ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--color-ln-navy)] mb-2">No score computed yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
                Click "Compute My Score" to get your 12-dimension Career Access Score based on everything you've built so far.
              </p>
              <Button
                onClick={() => computeScoreMutation.mutate()}
                disabled={computeScoreMutation.isPending}
                style={{ background: "var(--color-ln-navy)", color: "white" }}
                className="gap-2"
              >
                {computeScoreMutation.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Computing...</> : <><BarChart3 className="w-4 h-4" /> Compute My Score</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Composite score hero */}
              <div className="rounded-2xl p-6 flex items-center gap-6" style={{ background: "var(--color-ln-navy)" }}>
                <div className="w-28 h-28 rounded-full flex items-center justify-center border-4 shrink-0" style={{ borderColor: compositeColor }}>
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: compositeColor }}>{composite}</p>
                    <p className="text-xs" style={{ color: "oklch(70% 0.02 248.6)" }}>/ 100</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-white mb-1">Career Access Score™</p>
                  {Boolean(latest.narrative) && (
                    <p className="text-sm" style={{ color: "oklch(75% 0.02 248.6)" }}>{String(latest.narrative ?? "")}</p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "oklch(55% 0.02 248.6)" }}>
                    Computed {history.length > 0 ? new Date(latest.createdAt as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "just now"}
                  </p>
                </div>
              </div>

              {/* Radar chart + dimension bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-ln-navy)] mb-4">Dimension Radar</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10 }} />
                      <Radar name="Score" dataKey="value" stroke="var(--color-ln-navy)" fill="var(--color-ln-navy)" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-ln-navy)] mb-4">Dimension Breakdown</h3>
                  <div className="space-y-2.5">
                    {SCORE_DIMS.map((d) => {
                      const val = latest ? (latest[d.key] as number ?? 0) : 0;
                      const color = val >= 70 ? "#34d399" : val >= 50 ? "#f59e0b" : "#f87171";
                      return (
                        <div key={d.key} className="flex items-center gap-2 text-xs">
                          <span className="w-36 shrink-0 text-gray-600 truncate">{d.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${val}%`, background: color }} />
                          </div>
                          <span className="w-8 text-right font-bold" style={{ color }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top actions */}
              {Array.isArray(latest.topActions) && (latest.topActions as string[]).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-ln-navy)] mb-4">Top Priority Actions</h3>
                  <div className="space-y-2">
                    {(latest.topActions as string[]).map((action, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: i === 0 ? "var(--color-ln-navy)" : "#f9fafb" }}>
                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)]" : "bg-gray-200 text-gray-600"}`}>{i + 1}</span>
                        <p className={`text-sm ${i === 0 ? "text-white font-medium" : "text-gray-700"}`}>{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Improvement Tips — bottom 3 dimensions */}
              {latest && (() => {
                const bottom3 = [...SCORE_DIMS]
                  .map(d => ({ ...d, val: latest[d.key] as number ?? 0 }))
                  .sort((a, b) => a.val - b.val)
                  .slice(0, 3);

                const TIPS: Record<string, { tip: string; action: string }> = {
                  scoreStrategyClarity: { tip: "Your career strategy needs sharpening.", action: "Go to Career Strategy → generate or refine your strategy statement and value proposition." },
                  scorePositioningStrength: { tip: "Your executive positioning is unclear.", action: "Revisit your Career Profile → update your target role, key strengths, and differentiated value." },
                  scoreOpportunityPipeline: { tip: "Your opportunity pipeline is thin.", action: "Go to Opportunity Universe → approve more companies and move them into the Pipeline Kanban." },
                  scoreRelationshipCapital: { tip: "Your relationship network needs activation.", action: "Go to Relationship Intelligence → add more contacts and score your top 5 connections." },
                  scoreAccessPathQuality: { tip: "Your access paths are underdeveloped.", action: "Go to Access Path Generator → generate paths for your top 3 target companies." },
                  scoreVisibilityPresence: { tip: "Your executive visibility is low.", action: "Update your LinkedIn headline and summary to reflect your current positioning. Publish one insight this week." },
                  scoreNarrativeReadiness: { tip: "Your career narrative needs work.", action: "Go to Career Strategy → generate your career narrative and practise your 90-second story." },
                  scoreMarketTiming: { tip: "You may be missing market timing signals.", action: "Research your target sector for leadership movement, funding rounds, or restructuring news." },
                  scoreCredentialFit: { tip: "There may be a credential gap for your target roles.", action: "Identify the top 2 credentials or experiences missing for your target role and plan to close them." },
                  scoreNetworkDensity: { tip: "Your network density is low for your target market.", action: "Add 5 new contacts to Relationship Intelligence this week — focus on people inside your target companies." },
                  scoreOutreachMomentum: { tip: "Your outreach momentum is stalled.", action: "Activate one Access Path this week — send the warm intro request or direct outreach draft already generated." },
                  scoreConfidenceReadiness: { tip: "Your confidence readiness score is low.", action: "Complete a Practice session in LevelNext to rehearse your executive narrative and build readiness." },
                };

                return (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-ln-navy)] mb-1">How to Improve Your Weakest Dimensions</h3>
                    <p className="text-xs text-gray-400 mb-4">Focus here first — these 3 dimensions are holding your score back the most.</p>
                    <div className="space-y-3">
                      {bottom3.map((d, i) => {
                        const tip = TIPS[d.key];
                        const color = d.val >= 70 ? "#34d399" : d.val >= 50 ? "#f59e0b" : "#f87171";
                        return (
                          <div key={d.key} className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: color + "33", background: color + "0a" }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: color + "22", color }}>
                              {d.val}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[var(--color-ln-navy)]">{d.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: color + "22", color }}>
                                  {i === 0 ? "Lowest" : i === 1 ? "2nd lowest" : "3rd lowest"}
                                </span>
                              </div>
                              {tip && (
                                <>
                                  <p className="text-xs text-gray-600 mb-1">{tip.tip}</p>
                                  <div className="flex items-start gap-1.5">
                                    <ArrowRight className="w-3 h-3 text-[var(--color-ln-gold)] shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium" style={{ color: "var(--color-ln-navy)" }}>{tip.action}</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Score history */}
              {history.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-ln-navy)] mb-4">Score History</h3>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((snap, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-xs text-gray-500">{new Date(snap.createdAt as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="text-sm font-bold" style={{ color: (snap.compositeScore as number) >= 70 ? "#34d399" : (snap.compositeScore as number) >= 50 ? "#f59e0b" : "#f87171" }}>
                          {snap.compositeScore as number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PlatformLayout>
    );
  }

  // ── Opportunity Pipeline Kanban view ─────────────────────────────────────
  if (view === "pipeline") {
    const pipelineOrgs = (universe ?? []).filter((o) => o.status !== "removed");
    const KANBAN_COLS = [
      { id: "identified", label: "Identified", color: "#60a5fa", bg: "oklch(from #60a5fa l c h / 0.07)", border: "oklch(from #60a5fa l c h / 0.2)" },
      { id: "researching", label: "Researching", color: "#a78bfa", bg: "oklch(from #a78bfa l c h / 0.07)", border: "oklch(from #a78bfa l c h / 0.2)" },
      { id: "targeting", label: "Targeting", color: "#f59e0b", bg: "oklch(from #f59e0b l c h / 0.07)", border: "oklch(from #f59e0b l c h / 0.2)" },
      { id: "active", label: "Active", color: "#34d399", bg: "oklch(from #34d399 l c h / 0.07)", border: "oklch(from #34d399 l c h / 0.2)" },
      { id: "paused", label: "Paused", color: "#94a3b8", bg: "oklch(from #94a3b8 l c h / 0.07)", border: "oklch(from #94a3b8 l c h / 0.2)" },
    ];
    const NEXT_STATUS: Record<string, string> = {
      identified: "researching",
      researching: "targeting",
      targeting: "active",
      active: "paused",
      paused: "identified",
    };
    const PREV_STATUS: Record<string, string> = {
      researching: "identified",
      targeting: "researching",
      active: "targeting",
      paused: "active",
      identified: "paused",
    };

    return (
      <PlatformLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-1">
                <Target className="w-4 h-4" /> Opportunity Pipeline
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-ln-navy)]">
                {pipelineOrgs.length > 0 ? `${pipelineOrgs.length} Organisations in Pipeline` : "Your Opportunity Pipeline"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("universe")}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border"
                style={{ borderColor: "oklch(85% 0.01 248.6)", color: "oklch(45% 0.02 248.6)" }}
              >
                List View
              </button>
            </div>
          </div>

          {pipelineOrgs.length === 0 ? (
            <div className="text-center py-16">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No organisations in your pipeline yet.</p>
              <p className="text-sm text-gray-400 mb-6">Map your opportunity universe first, then track them here.</p>
              <Button onClick={() => setView("universe")} style={{ background: "var(--color-ln-navy)", color: "white" }}>
                <Globe className="w-4 h-4 mr-2" /> Map My Universe
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4" style={{ minWidth: `${KANBAN_COLS.length * 280}px` }}>
                {KANBAN_COLS.map((col) => {
                  const colOrgs = pipelineOrgs.filter((o) => o.status === col.id);
                  return (
                    <div key={col.id} className="flex-1 min-w-[260px] rounded-2xl p-4" style={{ background: col.bg, border: `1.5px solid ${col.border}` }}>
                      {/* Column header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: col.color }}>{col.label}</span>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `oklch(from ${col.color} l c h / 0.15)`, color: col.color }}
                        >
                          {colOrgs.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="space-y-3">
                        {colOrgs.map((org) => {
                          const isExpanded = pipelineExpandedId === org.id;
                          return (
                            <div
                              key={org.id}
                              className="rounded-xl bg-white border p-3.5 cursor-pointer transition-shadow hover:shadow-sm"
                              style={{ borderColor: "oklch(90% 0.01 248.6)" }}
                              onClick={() => {
                                setPipelineExpandedId(isExpanded ? null : org.id);
                                if (!pipelineNotes[org.id]) {
                                  setPipelineNotes((prev) => ({ ...prev, [org.id]: org.userNotes ?? "" }));
                                }
                              }}
                            >
                              {/* Card header */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate" style={{ color: "var(--color-ln-navy)" }}>{org.companyName}</p>
                                  {org.potentialRole && (
                                    <p className="text-[10px] truncate" style={{ color: "var(--color-ln-gold)" }}>{org.potentialRole}</p>
                                  )}
                                </div>
                                {org.compositeScore && (
                                  <span className="text-xs font-bold flex-shrink-0" style={{ color: col.color }}>{org.compositeScore}</span>
                                )}
                              </div>

                              {/* Type badge */}
                              <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: `oklch(from ${col.color} l c h / 0.1)`, color: col.color }}>
                                {org.companyType}
                              </span>

                              {/* Expanded content */}
                              {isExpanded && (
                                <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                  {org.whyThisCompany && (
                                    <p className="text-xs leading-relaxed" style={{ color: "oklch(40% 0.02 248.6)" }}>{org.whyThisCompany}</p>
                                  )}
                                  {org.hiddenOpportunitySignal && (
                                    <div className="flex items-start gap-1.5 p-2 rounded-lg" style={{ background: "oklch(98% 0.015 80)" }}>
                                      <Zap className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                                      <p className="text-[10px] text-amber-800">{org.hiddenOpportunitySignal}</p>
                                    </div>
                                  )}
                                  {/* Relationship matches */}
                                  {(() => {
                                    const matched = (relationships ?? []).filter((r) =>
                                      (r.currentCompany as string ?? "").toLowerCase().includes(org.companyName.toLowerCase()) ||
                                      org.companyName.toLowerCase().includes((r.currentCompany as string ?? "").toLowerCase())
                                    );
                                    if (matched.length === 0) return null;
                                    return (
                                      <div className="p-2 rounded-lg" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.08)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.25)" }}>
                                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-ln-gold)" }}>Your Connections Here</p>
                                        <div className="space-y-1">
                                          {matched.map((r) => (
                                            <div key={r.id as number} className="flex items-center gap-1.5">
                                              <div className="w-5 h-5 rounded-full bg-[var(--color-ln-navy)] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                {(r.name as string).charAt(0).toUpperCase()}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-[10px] font-semibold text-[var(--color-ln-navy)] truncate">{r.name as string}</p>
                                                <p className="text-[9px] text-gray-500 truncate">{r.currentTitle as string}</p>
                                              </div>
                                              {r.compositeScore != null && (
                                                <span className="ml-auto text-[9px] font-bold shrink-0" style={{ color: "var(--color-ln-gold)" }}>{r.compositeScore as number}</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <div>
                                    <label className="text-[9px] font-semibold uppercase tracking-widest block mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Notes</label>
                                    <textarea
                                      value={pipelineNotes[org.id] ?? ""}
                                      onChange={(e) => setPipelineNotes((prev) => ({ ...prev, [org.id]: e.target.value }))}
                                      placeholder="Add notes about this opportunity…"
                                      className="w-full text-xs border rounded-lg px-2.5 py-2 resize-none min-h-[60px]"
                                      style={{ borderColor: "oklch(88% 0.01 248.6)" }}
                                    />
                                    <button
                                      onClick={() => handleKanbanNotesSave(org.id)}
                                      className="mt-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                                      style={{ background: "var(--color-ln-navy)", color: "white" }}
                                    >
                                      Save Notes
                                    </button>
                                  </div>
                                  {/* Move buttons */}
                                  <div className="flex gap-1.5 pt-1">
                                    {PREV_STATUS[col.id] && (
                                      <button
                                        onClick={() => handleKanbanMove(org.id, PREV_STATUS[col.id])}
                                        className="flex-1 text-[9px] font-semibold py-1.5 rounded-lg border"
                                        style={{ borderColor: "oklch(85% 0.01 248.6)", color: "oklch(45% 0.02 248.6)" }}
                                      >
                                        ← {PREV_STATUS[col.id].charAt(0).toUpperCase() + PREV_STATUS[col.id].slice(1)}
                                      </button>
                                    )}
                                    {NEXT_STATUS[col.id] && (
                                      <button
                                        onClick={() => handleKanbanMove(org.id, NEXT_STATUS[col.id])}
                                        className="flex-1 text-[9px] font-semibold py-1.5 rounded-lg"
                                        style={{ background: col.color, color: "var(--color-ln-navy)" }}
                                      >
                                        {NEXT_STATUS[col.id].charAt(0).toUpperCase() + NEXT_STATUS[col.id].slice(1)} →
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleKanbanMove(org.id, "removed")}
                                    className="w-full text-[9px] font-semibold py-1 rounded-lg"
                                    style={{ color: "#f87171", background: "oklch(from #f87171 l c h / 0.08)" }}
                                  >
                                    Remove from Pipeline
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {colOrgs.length === 0 && (
                          <div
                            className="rounded-xl border-2 border-dashed p-4 text-center"
                            style={{ borderColor: `oklch(from ${col.color} l c h / 0.3)` }}
                          >
                            <p className="text-[10px]" style={{ color: `oklch(from ${col.color} l c h / 0.6)` }}>No orgs here yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PlatformLayout>
    );
  }

  // ── Relationship Intelligence view ────────────────────────────────────────

  if (view === "relationships") {
    const REL_TYPES = [
      "Former Colleague", "Current Colleague", "Mentor / Sponsor",
      "Mentee", "Client", "Investor", "Board Member", "Industry Peer",
      "Alumni", "Community", "Friend", "Family", "Recruiter",
    ];

    const SCORE_DIMS = [
      { key: "scoreTrust", label: "Trust", color: "#60a5fa" },
      { key: "scoreInfluence", label: "Influence", color: "#a78bfa" },
      { key: "scoreAccessibility", label: "Accessibility", color: "#34d399" },
      { key: "scoreRecency", label: "Recency", color: "#f59e0b" },
      { key: "scoreWarmth", label: "Warmth", color: "#f472b6" },
      { key: "scoreStrategicValue", label: "Strategic Value", color: "#fb923c" },
      { key: "scoreLikelihoodToHelp", label: "Likelihood to Help", color: "#4ade80" },
    ];

    const handleAddContact = async () => {
      if (!relForm.name.trim()) { toast.error("Name is required."); return; }
      try {
        await addRelMutation.mutateAsync({ ...relForm });
        await refetchRelationships();
        setRelForm({ name: "", currentTitle: "", currentCompany: "", industry: "", geography: "", linkedinUrl: "", email: "", phone: "", relationshipType: "Former Colleague", howWeKnowEachOther: "", sharedHistory: "", notes: "", isKeyConnector: false });
        setRelView("list");
        toast.success("Contact added and AI scoring in progress.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to add contact.");
      }
    };

    const handleUpdateContact = async () => {
      if (!editingRelId) return;
      try {
        await updateRelMutation.mutateAsync({ id: editingRelId, ...relForm });
        await refetchRelationships();
        setRelView("list");
        setEditingRelId(null);
        toast.success("Contact updated.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update contact.");
      }
    };

    const handleScoreContact = async (id: number) => {
      setScoringRelId(id);
      try {
        await scoreRelMutation.mutateAsync({ id });
        await refetchRelationships();
        toast.success("AI scoring complete.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to score contact.");
      } finally {
        setScoringRelId(null);
      }
    };

    const handleDeleteContact = async (id: number) => {
      try {
        await deleteRelMutation.mutateAsync({ id });
        await refetchRelationships();
        if (activeRelContact?.id === id) { setActiveRelContact(null); setRelView("list"); }
        toast.success("Contact removed.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to delete contact.");
      }
    };

    const handleGenerateActivationPicks = async () => {
      setGeneratingActivation(true);
      try {
        const contacts = relationships ?? [];
        if (contacts.length === 0) { toast.error("Add contacts first."); return; }
        const topContacts = [...contacts]
          .sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
          .slice(0, 10);
        const picks = topContacts.slice(0, 3).map((c) => ({
          id: c.id,
          name: c.name,
          title: c.currentTitle ?? "",
          company: c.currentCompany ?? "",
          compositeScore: c.compositeScore ?? 0,
          recommendedAction: c.recommendedAction ?? "Reconnect",
          recommendedActionReason: c.recommendedActionReason ?? "High strategic value contact worth activating this week.",
          relationshipType: c.relationshipType,
        }));
        setRelActivationPicks(picks as Record<string, unknown>[]);
        toast.success("Weekly activation picks ready.");
      } finally {
        setGeneratingActivation(false);
      }
    };

    const contacts = relationships ?? [];
    const keyConnectors = contacts.filter((c) => c.isKeyConnector);
    const scoredContacts = contacts.filter((c) => c.compositeScore != null);
    const avgScore = scoredContacts.length > 0
      ? Math.round(scoredContacts.reduce((s, c) => s + (c.compositeScore ?? 0), 0) / scoredContacts.length)
      : null;

    // ── Add / Edit form ──
    if (relView === "add" || relView === "edit") {
      return (
        <PlatformLayout>
          <div className="max-w-2xl mx-auto px-4 py-8">
            <button onClick={() => { setRelView("list"); setEditingRelId(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ChevronLeft className="w-4 h-4" /> Back to Network
            </button>
            <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-2">
              <Network className="w-4 h-4" /> Relationship Intelligence
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-ln-navy)] mb-6">
              {relView === "add" ? "Add Contact" : "Edit Contact"}
            </h1>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                  <Input value={relForm.name} onChange={(e) => setRelForm({ ...relForm, name: e.target.value })} placeholder="e.g. Priya Sharma" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship Type *</label>
                  <select
                    value={relForm.relationshipType}
                    onChange={(e) => setRelForm({ ...relForm, relationshipType: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {REL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Current Title</label>
                  <Input value={relForm.currentTitle} onChange={(e) => setRelForm({ ...relForm, currentTitle: e.target.value })} placeholder="e.g. VP Engineering" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Current Company</label>
                  <Input value={relForm.currentCompany} onChange={(e) => setRelForm({ ...relForm, currentCompany: e.target.value })} placeholder="e.g. Razorpay" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
                  <Input value={relForm.industry} onChange={(e) => setRelForm({ ...relForm, industry: e.target.value })} placeholder="e.g. FinTech" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Geography</label>
                  <Input value={relForm.geography} onChange={(e) => setRelForm({ ...relForm, geography: e.target.value })} placeholder="e.g. Bangalore" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">LinkedIn URL</label>
                  <Input value={relForm.linkedinUrl} onChange={(e) => setRelForm({ ...relForm, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <Input value={relForm.email} onChange={(e) => setRelForm({ ...relForm, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">How We Know Each Other</label>
                <Textarea value={relForm.howWeKnowEachOther} onChange={(e) => setRelForm({ ...relForm, howWeKnowEachOther: e.target.value })} placeholder="e.g. Worked together at Broadridge 2019-2021, co-led the APAC transformation project." rows={2} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Shared History / Context</label>
                <Textarea value={relForm.sharedHistory} onChange={(e) => setRelForm({ ...relForm, sharedHistory: e.target.value })} placeholder="e.g. She introduced me to the CTO at Texas Instruments. Strong mutual respect." rows={2} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <Textarea value={relForm.notes} onChange={(e) => setRelForm({ ...relForm, notes: e.target.value })} placeholder="Any other context, last conversation, follow-up needed..." rows={2} />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="keyConnector"
                  checked={relForm.isKeyConnector}
                  onChange={(e) => setRelForm({ ...relForm, isKeyConnector: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="keyConnector" className="text-sm text-gray-700">
                  <span className="font-semibold">Key Connector</span> — this person can open doors to multiple opportunities
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={relView === "add" ? handleAddContact : handleUpdateContact}
                  disabled={addRelMutation.isPending || updateRelMutation.isPending}
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                >
                  {addRelMutation.isPending || updateRelMutation.isPending ? "Saving…" : relView === "add" ? "Add Contact" : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => { setRelView("list"); setEditingRelId(null); }}>Cancel</Button>
              </div>
            </div>
          </div>
        </PlatformLayout>
      );
    }

    // ── Contact detail view ──
    if (relView === "detail" && activeRelContact) {
      const c = activeRelContact;
      const scored = SCORE_DIMS.filter((d) => c[d.key] != null);
      return (
        <PlatformLayout>
          <div className="max-w-2xl mx-auto px-4 py-8">
            <button onClick={() => setRelView("list")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ChevronLeft className="w-4 h-4" /> Back to Network
            </button>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.1)", color: "var(--color-ln-navy)" }}
                >
                  {(c.name as string).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[var(--color-ln-navy)]">{c.name as string}</h1>
                  {!!(c.currentTitle || c.currentCompany) && (
                    <p className="text-sm text-gray-600">{[c.currentTitle as string, c.currentCompany as string].filter(Boolean).join(" · ")}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{c.relationshipType as string}</Badge>
                    {!!c.isKeyConnector && <Badge className="text-[10px] bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)]">Key Connector</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  onClick={() => {
                    setEditingRelId(c.id as number);
                    setRelForm({
                      name: c.name as string, currentTitle: (c.currentTitle as string) ?? "",
                      currentCompany: (c.currentCompany as string) ?? "", industry: (c.industry as string) ?? "",
                      geography: (c.geography as string) ?? "", linkedinUrl: (c.linkedinUrl as string) ?? "",
                      email: (c.email as string) ?? "", phone: (c.phone as string) ?? "",
                      relationshipType: c.relationshipType as string, howWeKnowEachOther: (c.howWeKnowEachOther as string) ?? "",
                      sharedHistory: (c.sharedHistory as string) ?? "", notes: (c.notes as string) ?? "",
                      isKeyConnector: (c.isKeyConnector as boolean) ?? false,
                    });
                    setRelView("edit");
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => handleDeleteContact(c.id as number)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {!!c.email && (
                <a href={`mailto:${String(c.email)}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--color-ln-navy)]">
                  <Mail className="w-4 h-4" /> {String(c.email)}
                </a>
              )}
              {!!c.phone && (
                <a href={`tel:${String(c.phone)}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--color-ln-navy)]">
                  <Phone className="w-4 h-4" /> {String(c.phone)}
                </a>
              )}
              {!!c.linkedinUrl && (
                <a href={String(c.linkedinUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Linkedin className="w-4 h-4" /> LinkedIn Profile
                </a>
              )}
              {!!c.geography && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" /> {String(c.geography)}
                </div>
              )}
            </div>

            {/* Context */}
            {!!(c.howWeKnowEachOther || c.sharedHistory) && (
              <div className="space-y-3 mb-6">
                {!!c.howWeKnowEachOther && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">How We Know Each Other</p>
                    <p className="text-sm text-gray-700">{String(c.howWeKnowEachOther)}</p>
                  </div>
                )}
                {!!c.sharedHistory && (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Shared History</p>
                    <p className="text-sm text-gray-700">{String(c.sharedHistory)}</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Score */}
            <div className="p-5 rounded-xl border-2 border-[var(--color-ln-navy)]/20 bg-[var(--color-ln-navy)]/3 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">AI Relationship Score</p>
                  {c.compositeScore != null ? (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-[var(--color-ln-navy)]">{c.compositeScore as number}</span>
                      <span className="text-gray-400 text-sm">/100</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not yet scored</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleScoreContact(c.id as number)}
                  disabled={scoringRelId === c.id}
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                >
                  {scoringRelId === c.id ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Scoring…</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> {c.compositeScore != null ? "Re-score" : "Score with AI"}</>}
                </Button>
              </div>

              {scored.length > 0 && (
                <div className="space-y-2">
                  {scored.map((d) => (
                    <div key={d.key} className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-gray-500 w-28 shrink-0">{d.label}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${((c[d.key] as number) / 10) * 100}%`, background: d.color }} />
                      </div>
                      <span className="text-[10px] font-bold w-6 text-right" style={{ color: d.color }}>{c[d.key] as number}</span>
                    </div>
                  ))}
                </div>
              )}

              {!!c.recommendedAction && (
                <div className="mt-4 p-3 rounded-lg" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.1)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-ln-gold)" }}>Recommended Action</p>
                  <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{String(c.recommendedAction)}</p>
                  {!!c.recommendedActionReason && <p className="text-xs text-gray-600 mt-1">{String(c.recommendedActionReason)}</p>}
                </div>
              )}
            </div>

            {!!c.notes && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{String(c.notes)}</p>
              </div>
            )}
          </div>
        </PlatformLayout>
      );
    }

    // ── Contact list view ──
    return (
      <PlatformLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-1">
                <Network className="w-4 h-4" /> Relationship Intelligence
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-ln-navy)]">
                {contacts.length > 0 ? `${contacts.length} Strategic Contacts` : "Your Strategic Network"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Map your network, score each relationship, and activate the right people at the right time.</p>
            </div>
            <Button
              onClick={() => { setRelForm({ name: "", currentTitle: "", currentCompany: "", industry: "", geography: "", linkedinUrl: "", email: "", phone: "", relationshipType: "Former Colleague", howWeKnowEachOther: "", sharedHistory: "", notes: "", isKeyConnector: false }); setRelView("add"); }}
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add Contact
            </Button>
          </div>

          {/* Stats bar */}
          {contacts.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-gray-200 bg-white text-center">
                <div className="text-2xl font-bold text-[var(--color-ln-navy)]">{contacts.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total Contacts</div>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-white text-center">
                <div className="text-2xl font-bold text-[var(--color-ln-navy)]">{keyConnectors.length}</div>
                <div className="text-xs text-gray-500 mt-0.5">Key Connectors</div>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-white text-center">
                <div className="text-2xl font-bold text-[var(--color-ln-navy)]">{avgScore ?? "—"}</div>
                <div className="text-xs text-gray-500 mt-0.5">Avg Network Score</div>
              </div>
            </div>
          )}

          {/* Weekly Activation Picks */}
          {contacts.length >= 3 && (
            <div
              className="p-5 rounded-xl mb-6"
              style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)", border: "1.5px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-ln-gold)" }}>Weekly Activation Picks</p>
                  <p className="text-sm text-gray-600 mt-0.5">Your AI Chief of Staff's top 3 contacts to activate this week.</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateActivationPicks}
                  disabled={generatingActivation}
                  style={{ background: "var(--color-ln-navy)", color: "white" }}
                >
                  {generatingActivation ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Picking…</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Get This Week's Picks</>}
                </Button>
              </div>

              {relActivationPicks && relActivationPicks.length > 0 && (
                <div className="space-y-3">
                  {relActivationPicks.map((pick, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", color: "var(--color-ln-gold)" }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{pick.name as string}</p>
                          {pick.compositeScore != null && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.15)", color: "var(--color-ln-gold)" }}>
                              Score {pick.compositeScore as number}
                            </span>
                          )}
                        </div>
                        {!!(pick.title || pick.company) && (
                          <p className="text-xs text-gray-500">{[pick.title as string, pick.company as string].filter(Boolean).join(" · ")}</p>
                        )}
                        <p className="text-xs text-gray-700 mt-1">
                          <span className="font-semibold text-[var(--color-ln-navy)]">{pick.recommendedAction as string}:</span>{" "}
                          {pick.recommendedActionReason as string}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!relActivationPicks && (
                <p className="text-xs text-gray-400 mt-1">Click "Get This Week's Picks" to see who to activate first.</p>
              )}
            </div>
          )}

          {/* Contact list */}
          {contacts.length === 0 ? (
            <div className="space-y-4">
              {/* Guide */}
              <div className="p-5 rounded-xl" style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.04)", border: "1.5px solid oklch(from var(--color-ln-navy) l c h / 0.12)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-ln-gold)" }}>What to add for each contact</p>
                <div className="grid grid-cols-1 gap-2 text-xs" style={{ color: "oklch(35% 0.02 248.6)" }}>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0 text-[var(--color-ln-navy)]">Name + Role</span><span>Who they are and where they work now.</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0 text-[var(--color-ln-navy)]">Relationship Type</span><span>How you know them — former colleague, mentor, client, alumni, etc.</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0 text-[var(--color-ln-navy)]">Context</span><span>How you met, shared history, and why they matter to your career access strategy.</span></div>
                  <div className="flex items-start gap-2"><span className="font-bold shrink-0 text-[var(--color-ln-navy)]">AI Score</span><span>After adding, score each contact to get Trust, Influence, Strategic Value, and a recommended action.</span></div>
                </div>
              </div>

              {/* Example contact */}
              <div className="p-5 rounded-xl" style={{ background: "white", border: "1.5px dashed #60a5fa" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "oklch(from #60a5fa l c h / 0.12)", color: "#2563eb" }}>Example</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "oklch(from #60a5fa l c h / 0.12)", color: "#60a5fa" }}>R</div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ln-navy)]">Rahul Mehta</p>
                    <p className="text-xs text-gray-500">CHRO · Broadridge India</p>
                    <Badge variant="outline" className="text-[10px] mt-1">Former Colleague</Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg text-xs space-y-2" style={{ background: "oklch(98% 0.01 248.6)", border: "1px solid oklch(92% 0.01 248.6)" }}>
                  <p className="text-gray-600"><span className="font-semibold text-[var(--color-ln-navy)]">How we know each other:</span> Worked together at Broadridge 2018–2022. He was my direct stakeholder during the leadership transformation programme. Strong mutual respect.</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[{label:"Trust",val:9,color:"#60a5fa"},{label:"Influence",val:8,color:"#a78bfa"},{label:"Strategic Value",val:9,color:"#fb923c"},{label:"Likelihood to Help",val:8,color:"#4ade80"}].map((d) => (
                      <div key={d.label} className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-gray-500 w-24 shrink-0">{d.label}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1">
                          <div className="h-1 rounded-full" style={{ width: `${(d.val/10)*100}%`, background: d.color }} />
                        </div>
                        <span className="text-[9px] font-bold" style={{ color: d.color }}>{d.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1 p-2 rounded" style={{ background: "oklch(from var(--color-ln-gold) l c h / 0.1)", border: "1px solid oklch(from var(--color-ln-gold) l c h / 0.3)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--color-ln-gold)" }}>Recommended Action</p>
                    <p className="text-[10px] font-semibold text-[var(--color-ln-navy)]">Schedule a coffee catch-up</p>
                    <p className="text-[10px] text-gray-600">High trust, high influence — ideal for a warm introduction to Broadridge's new APAC MD.</p>
                  </div>
                </div>
              </div>

              <div className="text-center py-6">
                <Button
                  onClick={() => { setRelForm({ name: "", currentTitle: "", currentCompany: "", industry: "", geography: "", linkedinUrl: "", email: "", phone: "", relationshipType: "Former Colleague", howWeKnowEachOther: "", sharedHistory: "", notes: "", isKeyConnector: false }); setRelView("add"); }}
                  style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Add Your First Contact
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveRelContact(c as Record<string, unknown>); setRelView("detail"); }}
                  className="w-full text-left p-4 rounded-xl border bg-white hover:shadow-sm transition-all"
                  style={{ borderColor: c.isKeyConnector ? "var(--color-ln-gold)" : "oklch(90% 0.01 248.6)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: "oklch(from var(--color-ln-navy) l c h / 0.1)", color: "var(--color-ln-navy)" }}
                    >
                      {(c.name as string).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-ln-navy)]">{c.name as string}</p>
                        {c.isKeyConnector && <Badge className="text-[9px] bg-[var(--color-ln-gold)] text-[var(--color-ln-navy)] py-0">Key Connector</Badge>}
                      </div>
                      {(c.currentTitle || c.currentCompany) && (
                        <p className="text-xs text-gray-500">{[c.currentTitle, c.currentCompany].filter(Boolean).join(" · ")}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.relationshipType as string}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {c.compositeScore != null && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-[var(--color-ln-navy)]">{c.compositeScore as number}</div>
                          <div className="text-[9px] text-gray-400">Score</div>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {c.recommendedAction && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Activity className="w-3 h-3 shrink-0" style={{ color: "var(--color-ln-gold)" }} />
                      <p className="text-[10px] text-gray-600">
                        <span className="font-semibold">{c.recommendedAction as string}</span>
                        {c.recommendedActionReason ? ` — ${(c.recommendedActionReason as string).slice(0, 80)}${(c.recommendedActionReason as string).length > 80 ? "…" : ""}` : ""}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PlatformLayout>
    );
  }

  // ── Opportunity Universe view ──────────────────────────────────────────────

  const categoryTypes = ["Dream", "Likely", "Emerging", "GCC", "PE", "FamilyBusiness", "Consulting", "Board", "Advisory", "Fractional", "OperatingPartner"];
  const categoryCounts = categoryTypes.reduce((acc, t) => {
    acc[t] = activeOrgs.filter((o) => o.companyType === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => setView("home")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-ln-gold)] text-sm font-semibold uppercase tracking-wider mb-1">
              <Globe className="w-4 h-4" /> Opportunity Universe
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-ln-navy)]">
              {activeOrgs.length > 0 ? `${activeOrgs.length} Organisations Mapped` : "Your Target Organisation Map"}
            </h1>
          </div>
          <Button
            onClick={handleGenerateUniverse}
            disabled={generating !== null}
            style={{ background: "var(--color-ln-navy)", color: "white" }}
          >
            {generating === "universe" ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Mapping…</>
            ) : activeOrgs.length > 0 ? (
              <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Map My Universe</>
            )}
          </Button>
        </div>

        {activeOrgs.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No organisations mapped yet.</p>
            <p className="text-sm text-gray-400 mb-6">Complete your Career Profile first, then map your universe.</p>
            <Button onClick={handleGenerateUniverse} disabled={generating !== null} style={{ background: "var(--color-ln-navy)", color: "white" }}>
              {generating === "universe" ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Mapping…</> : <><Sparkles className="w-4 h-4 mr-2" /> Map My Opportunity Universe</>}
            </Button>
          </div>
        ) : (
          <>
            {/* Category filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setUniverseFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${universeFilter === "all" ? "bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
              >
                All ({activeOrgs.length})
              </button>
              {categoryTypes.filter((t) => categoryCounts[t] > 0).map((t) => (
                <button
                  key={t}
                  onClick={() => setUniverseFilter(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${universeFilter === t ? "bg-[var(--color-ln-navy)] text-white border-[var(--color-ln-navy)]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                >
                  {t} ({categoryCounts[t]})
                </button>
              ))}
            </div>

            {/* Organisation cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrgs.map((org) => (
                <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[var(--color-ln-navy)]">{org.companyName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${COMPANY_TYPE_COLORS[org.companyType] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {org.companyType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {org.industry && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{org.industry}</span>}
                        {org.geography && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{org.geography}</span>}
                      </div>
                    </div>
                    {org.compositeScore && (
                      <div className="text-center ml-3 shrink-0">
                        <div className="text-2xl font-bold text-[var(--color-ln-navy)]">{org.compositeScore}</div>
                        <div className="text-xs text-gray-400">/ 100</div>
                      </div>
                    )}
                  </div>

                  {/* Potential role */}
                  {org.potentialRole && (
                    <div className="text-xs text-[var(--color-ln-gold)] font-semibold mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" /> {org.potentialRole}
                    </div>
                  )}

                  {/* Why this company */}
                  {org.whyThisCompany && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{org.whyThisCompany}</p>
                  )}

                  {/* Hidden opportunity signal */}
                  {org.hiddenOpportunitySignal && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                      <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{org.hiddenOpportunitySignal}</p>
                    </div>
                  )}

                  {/* Score bars */}
                  <TooltipProvider>
                    <div className="space-y-1 mb-3">
                      {Object.entries(SCORE_LABELS).slice(0, 5).map(([key, label]) => (
                        <ScoreBar key={key} label={label} value={org[key as keyof typeof org] as number | null} />
                      ))}
                    </div>
                  </TooltipProvider>

                  {/* Status selector */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <select
                      value={org.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: org.id, status: e.target.value }, { onSuccess: () => refetchUniverse() })}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600"
                    >
                      <option value="identified">Identified</option>
                      <option value="researching">Researching</option>
                      <option value="targeting">Targeting</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="removed">Remove</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400 capitalize">{org.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PlatformLayout>
  );
}
