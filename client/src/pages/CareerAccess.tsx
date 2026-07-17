import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Target, Briefcase, Globe, DollarSign, Heart, Star,
  ChevronRight, ChevronLeft, Sparkles, Building2, TrendingUp,
  MapPin, Zap, AlertCircle, CheckCircle2, RefreshCw, Info,
  BarChart3, Eye, ArrowRight, Lightbulb, Lock
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

type View = "home" | "intake" | "strategy" | "universe";

export default function CareerAccess() {
  const [view, setView] = useState<View>("home");
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState<"strategy" | "universe" | null>(null);
  const [universeFilter, setUniverseFilter] = useState<string>("all");

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
  const { data: profile, refetch: refetchProfile } = trpc.careerAccess.getProfile.useQuery();
  const { data: strategy, refetch: refetchStrategy } = trpc.careerAccess.getCareerStrategy.useQuery();
  const { data: universe, refetch: refetchUniverse } = trpc.careerAccess.getOpportunityUniverse.useQuery({ status: undefined });

  const saveProfileMutation = trpc.careerAccess.saveProfile.useMutation();
  const generateStrategyMutation = trpc.careerAccess.generateCareerStrategy.useMutation();
  const generateUniverseMutation = trpc.careerAccess.generateOpportunityUniverse.useMutation();
  const updateStatusMutation = trpc.careerAccess.updateOpportunityStatus.useMutation();
  const clearUniverseMutation = trpc.careerAccess.clearOpportunityUniverse.useMutation();

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

          {/* Three pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          </div>

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
