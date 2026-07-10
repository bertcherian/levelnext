import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  TrendingUp,
  Target,
  User,
  CheckCircle,
  ArrowLeft,
  Shield,
  Award,
  Calendar,
  FileText,
  Eye,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Brain,
  Lock,
  Play,
  Zap,
  MessageSquare,
} from "lucide-react";
import type { GrowthPlanData } from "../../../drizzle/schema";

// ── Shared helpers ────────────────────────────────────────────────────────────
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

// ── Sub-screen types ──────────────────────────────────────────────────────────
type SubScreen = "main" | "coach-brief" | "privacy";

// ── Main Growth Profile Screen ────────────────────────────────────────────────
function GrowthProfileMain({
  onCoachBrief,
  onPrivacy,
}: {
  onCoachBrief: () => void;
  onPrivacy: () => void;
}) {
  const { data: profile, isLoading } = trpc.leadershipCoach.getGrowthProfile.useQuery();
  const { data: commitments, refetch: refetchCommitments } = trpc.leadershipCoach.getCommitments.useQuery();
  const [expandedPlan, setExpandedPlan] = useState(false);

  const generatePlan = trpc.leadershipCoach.generateGrowthPlan.useMutation({
    onSuccess: () => toast.success("30-Day Growth Plan generated!"),
    onError: () => toast.error("Failed to generate plan. Please try again."),
  });

  const updateOutcome = trpc.leadershipCoach.updateCommitmentOutcome.useMutation({
    onSuccess: () => refetchCommitments(),
  });

  const OUTCOME_OPTIONS = [
    { value: "done_well", label: "✓ Done Well", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { value: "done_partial", label: "~ Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { value: "done_poorly", label: "✗ Struggled", color: "text-red-700 bg-red-50 border-red-200" },
    { value: "avoided", label: "⊘ Avoided", color: "text-gray-700 bg-gray-50 border-gray-200" },
    { value: "postponed", label: "→ Postponed", color: "text-blue-700 bg-blue-50 border-blue-200" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-ln-navy)]/40" />
      </div>
    );
  }

  const plan = profile?.activePlan?.plan as GrowthPlanData | undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
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
          { label: "Practice Sessions", value: profile?.recentSessions.length ?? 0, icon: Play },
          { label: "Briefs Created", value: profile?.recentBriefs.length ?? 0, icon: Calendar },
          { label: "Debriefs Done", value: profile?.recentDebriefs.length ?? 0, icon: FileText },
        ].map((stat) => (
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
            {commitments.slice(0, 8).map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-[var(--color-ln-navy)] mb-2">{c.text}</p>
                {c.status === "pending" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {OUTCOME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateOutcome.mutate({
                            commitmentId: c.id,
                            status: opt.value as "done_well" | "done_partial" | "done_poorly" | "avoided" | "postponed",
                          })
                        }
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${opt.color}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-gray-100 text-gray-600 border-0">
                      {OUTCOME_OPTIONS.find((o) => o.value === c.status)?.label ?? c.status}
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
            {generatePlan.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            {plan ? "Regenerate" : "Generate Plan"}
          </Button>
        </div>

        {plan ? (
          <div className="rounded-xl border border-[var(--color-ln-navy)]/20 bg-[var(--color-ln-navy)]/5 p-5">
            <p className="text-base font-bold text-[var(--color-ln-navy)] mb-1">{plan.growthTheme}</p>
            <p className="text-sm text-[var(--color-ln-navy)]/70 mb-4">{plan.whyItMatters}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {["week1", "week2", "week3", "week4"].map((week, i) => (
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
              {expandedPlan ? "Show less" : "Show real-world actions, drills & reflection questions"}
            </button>

            {expandedPlan && (
              <div className="mt-4 space-y-3">
                {[
                  { key: "realWorldActions", label: "Real-World Actions", icon: Target },
                  { key: "recommendedRolePlays", label: "Recommended Role-Plays", icon: Play },
                  { key: "recommendedDrills", label: "Drills", icon: Zap },
                  { key: "reflectionQuestions", label: "Reflection Questions", icon: Brain },
                  { key: "successIndicators", label: "Success Indicators", icon: CheckCircle },
                ].map((section) => (
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

// ── Coach Brief Sub-screen ────────────────────────────────────────────────────
function CoachBriefScreen({ onBack }: { onBack: () => void }) {
  const [shareLevel, setShareLevel] = useState<"summary" | "transcript" | "feedback" | "growth" | "selected">("summary");
  const [brief, setBrief] = useState<{ briefId: number; brief: ReturnType<typeof Object.create> } | null>(null);

  const generateBrief = trpc.leadershipCoach.generateCoachBrief.useMutation({
    onSuccess: (data) => setBrief(data),
    onError: () => toast.error("Failed to generate brief. Please try again."),
  });

  const SHARE_LEVELS = [
    { value: "summary", label: "Summary Only", desc: "High-level themes and patterns" },
    { value: "feedback", label: "Include Feedback", desc: "Scores and improvement areas" },
    { value: "growth", label: "Full Growth Profile", desc: "Commitments, patterns, blind spots" },
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
              {SHARE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setShareLevel(level.value as typeof shareLevel)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    shareLevel === level.value
                      ? "border-[var(--color-ln-navy)] bg-[var(--color-ln-navy)]/5"
                      : "border-gray-200 bg-white hover:border-[var(--color-ln-navy)]/30"
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
              {SHARE_LEVELS.find((l) => l.value === shareLevel)?.label}
            </Badge>
            <div className="flex gap-2">
              <CopyButton text={JSON.stringify(brief.brief, null, 2)} />
              <Button size="sm" variant="outline" onClick={() => setBrief(null)} className="text-xs">
                Regenerate
              </Button>
            </div>
          </div>

          {[
            { key: "currentIssue", label: "Current Issue", icon: Target },
            { key: "leaderDesiredOutcome", label: "Leader's Desired Outcome", icon: Award },
            { key: "aiObservedPattern", label: "AI-Observed Pattern", icon: Brain, accent: true },
            { key: "possibleBlindSpot", label: "Possible Blind Spot", icon: Eye, accent: true },
            { key: "practiceCompleted", label: "Practice Completed", icon: Play },
            { key: "scoresAndImprovements", label: "Scores & Improvements", icon: TrendingUp },
          ].map((field) => (
            <SectionCard key={field.key} title={field.label} icon={field.icon} accent={(field as { accent?: boolean }).accent}>
              <p className="text-sm text-gray-600 leading-relaxed">{brief.brief[field.key as string]}</p>
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

// ── Privacy Settings Sub-screen ───────────────────────────────────────────────
function PrivacySettingsScreen({ onBack }: { onBack: () => void }) {
  const { data: settings } = trpc.leadershipCoach.getPrivacySettings.useQuery();
  const [form, setForm] = useState({
    shareWithCoach: "nothing" as "nothing" | "summary" | "transcript" | "feedback" | "growth" | "selected",
    shareWithOrg: false,
    allowAggregateAnalytics: true,
    coachEmail: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        shareWithCoach: settings.shareWithCoach as typeof form.shareWithCoach,
        shareWithOrg: settings.shareWithOrg,
        allowAggregateAnalytics: settings.allowAggregateAnalytics,
        coachEmail: settings.coachEmail ?? "",
      });
    }
  }, [settings]);

  const update = trpc.leadershipCoach.updatePrivacySettings.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const SHARE_OPTIONS = [
    { value: "nothing", label: "Nothing", desc: "Your coach sees nothing" },
    { value: "summary", label: "Summary Only", desc: "High-level themes only" },
    { value: "feedback", label: "Feedback Scores", desc: "Practice scores and areas" },
    { value: "growth", label: "Full Growth Profile", desc: "Everything including commitments" },
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
              <p className="text-xs text-emerald-700 mt-0.5">
                All practice sessions, coaching conversations, and feedback are stored privately. Your organisation cannot see individual data unless you explicitly choose to share.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-2">Share with my human coach</label>
          <div className="space-y-2">
            {SHARE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, shareWithCoach: opt.value as typeof form.shareWithCoach }))}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  form.shareWithCoach === opt.value
                    ? "border-[var(--color-ln-navy)] bg-[var(--color-ln-navy)]/5"
                    : "border-gray-200 bg-white hover:border-[var(--color-ln-navy)]/30"
                }`}
              >
                <p className="text-sm font-medium text-[var(--color-ln-navy)]">{opt.label}</p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {form.shareWithCoach !== "nothing" && (
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ln-navy)] mb-1.5">Coach email address</label>
            <Input
              type="email"
              value={form.coachEmail}
              onChange={(e) => setForm((f) => ({ ...f, coachEmail: e.target.value }))}
              placeholder="coach@example.com"
              className="border-gray-200"
            />
          </div>
        )}

        <div className="space-y-3">
          {[
            { key: "shareWithOrg", label: "Share aggregate data with my organisation", desc: "Only anonymised, aggregated data — never individual sessions" },
            { key: "allowAggregateAnalytics", label: "Allow anonymous analytics to improve the platform", desc: "Helps improve the AI coaching quality for all users" },
          ].map((toggle) => (
            <div key={toggle.key} className="flex items-start justify-between gap-4 p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="text-sm font-medium text-[var(--color-ln-navy)]">{toggle.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{toggle.desc}</p>
              </div>
              <button
                onClick={() => setForm((f) => ({ ...f, [toggle.key]: !f[toggle.key as keyof typeof f] }))}
                className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                  form[toggle.key as keyof typeof form] ? "bg-[var(--color-ln-navy)]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${
                    form[toggle.key as keyof typeof form] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
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

// ── Page root ─────────────────────────────────────────────────────────────────
export default function GrowthProfile() {
  const [, navigate] = useLocation();
  const [subScreen, setSubScreen] = useState<SubScreen>("main");

  return (
    <PlatformLayout>
      {subScreen === "main" && (
        <GrowthProfileMain
          onCoachBrief={() => setSubScreen("coach-brief")}
          onPrivacy={() => setSubScreen("privacy")}
        />
      )}
      {subScreen === "coach-brief" && (
        <CoachBriefScreen onBack={() => setSubScreen("main")} />
      )}
      {subScreen === "privacy" && (
        <PrivacySettingsScreen onBack={() => setSubScreen("main")} />
      )}
    </PlatformLayout>
  );
}
