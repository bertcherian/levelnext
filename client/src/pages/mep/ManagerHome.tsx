import { useAuth } from "@/_core/hooks/useAuth";
import * as React from "react";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MEP_DEFERRED_ORG_SETUP_KEY, MEP_POST_SKIP_WELCOME_KEY } from "@/lib/mepPostSkip";
import { getMepOrganisationSetupHref } from "@/lib/mepOrganisationSetup";
import { isPlatformAdministrator } from "@/lib/adminControls";
import { AiSuggestionFeedback } from "@/components/AiSuggestionFeedback";
import { normalizeAiData } from "@shared/citationSanitization";
import { getBrowserTimeZone, getMepDailyBriefDateKey } from "@shared/modules/mepDailyBriefDate";
import {
  LayoutGrid,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Zap,
  Activity,
  ChevronRight,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquareWarning,
  GitBranch,
  ShieldAlert,
  Plus,
  Filter,
  ThumbsDown,
  ThumbsUp,
  BarChart3,
  Building2,
  LayoutDashboard,
  X,
} from "lucide-react";

const MEP_MODULES = [
  {
    id: "diagnostics",
    title: "Management Diagnostics",
    description: "Assess your effectiveness across 10 management dimensions",
    icon: LayoutGrid,
    href: "/manager/diagnostics",
    color: "#34d399",
    badge: null,
  },
  {
    id: "coach",
    title: "Manager Coach",
    description: "Ask any management question or get a scenario-specific play",
    icon: MessageSquare,
    href: "/manager/coach",
    color: "#60a5fa",
    badge: null,
  },
  {
    id: "practice",
    title: "Practice Partner",
    description: "Role-play difficult conversations before they happen",
    icon: Zap,
    href: "/manager/practice",
    color: "#fb923c",
    badge: null,
  },
  {
    id: "team",
    title: "Team Intelligence",
    description: "Track your team members and get AI-powered people insights",
    icon: Users,
    href: "/manager/team",
    color: "#a78bfa",
    badge: null,
  },
  {
    id: "progress",
    title: "My Progress",
    description: "Behaviour commitments and uploaded documents in one place",
    icon: Activity,
    href: "/manager/progress",
    color: "#f472b6",
    badge: null,
  },
];

const QUICK_STATS = [
  { label: "Diagnostics Completed", icon: CheckCircle2, key: "diagnostics", color: "#34d399" },
  { label: "Playbook Sessions", icon: BookOpen, key: "playbook", color: "#f59e0b" },
  { label: "Active Commitments", icon: Target, key: "commitments", color: "#f472b6" },
  { label: "Practice Sessions", icon: Zap, key: "practice", color: "#fb923c" },
];

export default function ManagerHome() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Manager";
  const isAdministrator = isPlatformAdministrator(user?.role);
  const [showDeferredOrgSetup, setShowDeferredOrgSetup] = React.useState(() => {
    const arrivedAfterSkip = new URLSearchParams(window.location.search).get("onboarding") === "skipped";
    return arrivedAfterSkip || window.localStorage.getItem(MEP_DEFERRED_ORG_SETUP_KEY) === "true";
  });
  const [timeZone] = React.useState(getBrowserTimeZone);
  const [briefDateKey, setBriefDateKey] = React.useState(() => getMepDailyBriefDateKey(new Date(), timeZone));

  const { data: myResults } = trpc.mep.getMyResults.useQuery();
  const { data: myTenant } = trpc.tenant.myTenant.useQuery();
  const { data: playbookSessions } = trpc.mep.listPlaybookSessions.useQuery();
  const { data: commitments } = trpc.mep.listCommitments.useQuery();
  const { data: practiceSessions } = trpc.mep.listPracticeSessions.useQuery();
  const { data: todayBrief, refetch: refetchBrief } = trpc.mep.getTodayBriefSnapshot.useQuery({ timeZone });
  const generateBriefMutation = trpc.mep.getDailyBrief.useMutation({
    onSuccess: () => { refetchBrief(); },
    onError: () => {
      toast.error("Your Daily Management Brief could not be generated right now. Please try again.");
    },
  });
  const briefLoading = generateBriefMutation.isPending;
  const safeTodayBrief = normalizeAiData(todayBrief ?? undefined);
  const [feedbackReliability, setFeedbackReliability] = React.useState<"all" | "helpful" | "unhelpful" | "malformed">("all");
  const [feedbackDateRange, setFeedbackDateRange] = React.useState<"all" | "7d" | "30d" | "90d" | "year">("all");
  const [feedbackSort, setFeedbackSort] = React.useState<"newest" | "oldest" | "reliability">("newest");
  const feedbackFilters = React.useMemo(() => ({ reliability: feedbackReliability, dateRange: feedbackDateRange, sort: feedbackSort }), [feedbackReliability, feedbackDateRange, feedbackSort]);
  const feedbackEntries = trpc.aiSuggestionFeedback.listMine.useQuery(feedbackFilters);
  const feedbackAnalytics = trpc.aiSuggestionFeedback.getMyFeedbackAnalytics.useQuery({ days: 14 });
  const { data: effectivenessData, refetch: refetchEffectiveness } = trpc.effectiveness.getDashboard.useQuery();
  const respondNblaMutation = trpc.effectiveness.respondToNbla.useMutation({
    onSuccess: () => {
      toast.success("Action updated");
      refetchEffectiveness();
    },
  });

  // Keep an already-open dashboard aligned to the manager's local calendar day.
  useEffect(() => {
    const checkForNewDay = () => {
      const nextDateKey = getMepDailyBriefDateKey(new Date(), timeZone);
      setBriefDateKey((currentDateKey) => currentDateKey === nextDateKey ? currentDateKey : nextDateKey);
    };
    const interval = window.setInterval(checkForNewDay, 30_000);
    window.addEventListener("focus", checkForNewDay);
    document.addEventListener("visibilitychange", checkForNewDay);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForNewDay);
      document.removeEventListener("visibilitychange", checkForNewDay);
    };
  }, [timeZone]);

  useEffect(() => {
    void refetchBrief();
  }, [briefDateKey, refetchBrief]);

  useEffect(() => {
    const arrivedAfterSkip = new URLSearchParams(window.location.search).get("onboarding") === "skipped";
    const shouldWelcome = arrivedAfterSkip || window.sessionStorage.getItem(MEP_POST_SKIP_WELCOME_KEY) === "true";
    if (!shouldWelcome) return;
    window.sessionStorage.removeItem(MEP_POST_SKIP_WELCOME_KEY);
    toast.success("Welcome to Manager Effectiveness", {
      description: "You can explore the platform now and complete organisation setup whenever you are ready.",
    });
    if (arrivedAfterSkip) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const dismissDeferredOrgSetup = () => {
    window.localStorage.removeItem(MEP_DEFERRED_ORG_SETUP_KEY);
    setShowDeferredOrgSetup(false);
  };

  // Auto-generate the daily brief silently on first visit if not yet generated for this local day.
  useEffect(() => {
    if (todayBrief === null && !generateBriefMutation.isPending) {
      generateBriefMutation.mutate({ timeZone });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayBrief, briefDateKey, timeZone]);

  const stats = {
    diagnosticsCompleted: myResults?.length ?? 0,
    playbookSessions: playbookSessions?.length ?? 0,
    activeCommitments: commitments?.filter((c: any) => c.status === "active").length ?? 0,
    practiceSessions: practiceSessions?.length ?? 0,
    recentActivity: [] as any[],
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statValues: Record<string, number> = {
    diagnostics: stats.diagnosticsCompleted,
    playbook: stats.playbookSessions,
    commitments: stats.activeCommitments,
    practice: stats.practiceSessions,
  };
  const organisationSetupHref = getMepOrganisationSetupHref(Boolean(myTenant));

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Hero greeting */}
        <div
          className="rounded-2xl px-8 py-8"
          style={{ background: "var(--color-ln-navy)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#34d399" }}>
                Manager Effectiveness Platform
              </p>
              <h1 className="text-2xl font-bold text-white mb-2">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm max-w-lg" style={{ color: "oklch(75% 0.02 248.6)" }}>
                Your platform for becoming the manager your team deserves. Diagnose, learn, practise, and commit to lasting behaviour change.
              </p>
              {isAdministrator && (
                <Link
                  href="/admin"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
                  style={{ color: "#6ee7b7", background: "oklch(from #34d399 l c h / 0.12)", border: "1px solid oklch(from #34d399 l c h / 0.28)" }}
                  aria-label="Open Admin workspace"
                >
                  <LayoutDashboard size={14} aria-hidden="true" />
                  Open Admin workspace
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              )}
            </div>
            {/* Diagnostic completion progress ring */}
            <div className="hidden md:flex flex-col items-center justify-center flex-shrink-0">
              {(() => {
                const total = 10;
                const completed = Math.min(stats.diagnosticsCompleted, total);
                const pct = completed / total;
                const r = 22;
                const circ = 2 * Math.PI * r;
                const dash = pct * circ;
                return (
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="32" cy="32" r={r} fill="none" stroke="oklch(from white 15% 0 0 / 0.12)" strokeWidth="4" />
                      <circle
                        cx="32" cy="32" r={r} fill="none"
                        stroke="#34d399" strokeWidth="4"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold text-white leading-none">{completed}/{total}</span>
                      <span className="text-[9px] mt-0.5" style={{ color: "#34d399" }}>done</span>
                    </div>
                  </div>
                );
              })()}
              <p className="text-[9px] mt-1 text-center" style={{ color: "oklch(55% 0.02 248.6)" }}>Diagnostics</p>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {QUICK_STATS.map((s) => (
              <div
                key={s.key}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "oklch(from white 15% 0 0 / 0.07)", border: "1px solid oklch(from white 15% 0 0 / 0.1)" }}
              >
                <s.icon size={16} style={{ color: s.color }} className="flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-white leading-none">{statValues[s.key]}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "oklch(55% 0.02 248.6)" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Effectiveness Intelligence: Work Genome & Opportunity Scan Section */}
        <section aria-label="Effectiveness Intelligence" className="rounded-2xl border p-6 bg-white shadow-sm" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: "var(--color-ln-navy, #0A1A2F)" }}>
                <Sparkles size={16} style={{ color: "#D4AF37" }} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Leadership Effectiveness Intelligence™</h2>
                <p className="text-xs text-slate-500">Measurable capacity recovery, work-at-level alignment, and real-world leadership evidence</p>
              </div>
            </div>
            <Link
              href="/manager/work-genome"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                background: effectivenessData?.hasCompletedScan ? "white" : "var(--color-ln-navy, #0A1A2F)",
                color: effectivenessData?.hasCompletedScan ? "var(--color-ln-navy)" : "white",
                borderColor: "var(--color-ln-navy)",
              }}
            >
              {effectivenessData?.hasCompletedScan ? "Retake Work Genome Scan" : "Take Work Genome Scan"}
              <ArrowRight size={13} />
            </Link>
          </div>

          {effectivenessData?.hasCompletedScan && effectivenessData.capacitySnapshot && effectivenessData.opportunityScan ? (
            <div className="space-y-6 pt-2">
              {/* Capacity Overview Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Leadership Capacity Gap</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{effectivenessData.capacitySnapshot.gapScore}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Difference between current time distribution and altitude benchmark</p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200/60 bg-amber-50/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">Recoverable Weekly Hours</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-900">~{effectivenessData.capacitySnapshot.recoverableHours}h</span>
                    <span className="text-xs text-amber-700">/ week</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1">Hours currently spent below role altitude or in avoidable coordination</p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200/60 bg-emerald-50/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">Strategic Growth Capacity</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-900">
                      {effectivenessData.capacitySnapshot.currentAllocation.strategic_thinking}% → {effectivenessData.capacitySnapshot.targetAllocation.strategic_thinking}%
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-1">Target benchmark for strategic thinking & capability building</p>
                </div>
              </div>

              {/* Next Best Leadership Action (NBLA) Card */}
              {effectivenessData.nbla && effectivenessData.nbla.status === "proposed" && (
                <div className="rounded-xl border border-[#D4AF37]/50 p-5" style={{ background: "oklch(from #D4AF37 l c h / 0.08)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-900 mb-2">
                        <Zap size={11} /> Next Best Leadership Action
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{effectivenessData.nbla.headline}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{effectivenessData.nbla.reason}</p>
                      {effectivenessData.nbla.preparationPrompt && (
                        <div className="mt-3 p-3 rounded-lg bg-white/80 border border-amber-200/60 text-xs text-slate-700 whitespace-pre-line font-mono">
                          {effectivenessData.nbla.preparationPrompt}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="text-xs font-semibold"
                        style={{ background: "var(--color-ln-navy, #0A1A2F)" }}
                        onClick={() => respondNblaMutation.mutate({ actionId: effectivenessData.nbla!.id, status: "completed" })}
                      >
                        <CheckCircle2 size={13} className="mr-1" /> Mark Applied
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => respondNblaMutation.mutate({ actionId: effectivenessData.nbla!.id, status: "dismissed" })}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Three High-Leverage Behaviors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    3 High-Leverage Behaviors for Capacity Recovery
                  </h3>
                  <span className="text-[11px] text-slate-400">Synthesized from Work Genome & Diagnostic</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {effectivenessData.opportunityScan.recommendedBehaviors.map((beh, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-slate-900">{beh.title}</span>
                          <span className="text-[10px] font-semibold text-slate-400">#{idx + 1}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{beh.whyItMatters}</p>
                        {beh.ontologicalDistinction && (
                          <div className="mt-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                            {beh.ontologicalDistinction}
                          </div>
                        )}
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700">{beh.expectedCapacityGain}</span>
                        <Link href="/manager/practice" className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center">
                          Practise <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700">You haven't completed your Leadership Work Genome Scan yet.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Spend 4 minutes mapping your typical week. We'll identify work below your role altitude, calculate your recoverable hours, and provide 3 high-leverage behaviors to focus on.
              </p>
              <Link
                href="/manager/work-genome"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: "var(--color-ln-navy, #0A1A2F)" }}
              >
                Start Work Genome Scan <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>

        <section
          className="rounded-2xl border px-5 py-4"
          style={{ background: "white", borderColor: "oklch(from var(--color-ln-yellow) l c h / 0.55)" }}
          aria-label="Organisation information"
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.22)", color: "var(--color-ln-navy)" }}
            >
              <Building2 size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                {myTenant ? `${myTenant.tenant.name} organisation` : "Set up your organisation"}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>
                {myTenant
                  ? "Review your company profile, branding, leadership context, team invitations, and organisation settings."
                  : "Create Broadridge as your workspace, then add its company profile, mission and values, branding, documents, and team invitations."}
              </p>
              <Link href={organisationSetupHref} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                {myTenant ? "Manage organisation information" : "Add organisation information"} <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {showDeferredOrgSetup && (
          <section
            className="rounded-2xl border px-5 py-4"
            style={{ background: "white", borderColor: "oklch(from #34d399 l c h / 0.32)" }}
            aria-label="Organisation setup reminder"
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "oklch(from #34d399 l c h / 0.12)", color: "#047857" }}
              >
                <Building2 size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                  Organisation setup can wait
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>
                  You are free to explore Manager Effectiveness while you test the platform. Return here whenever you are ready to create or join an organisation.
                </p>
                <Link href="/onboard?returnTo=/manager" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#047857" }}>
                  Complete organisation setup <ArrowRight size={13} />
                </Link>
              </div>
              <button
                type="button"
                onClick={dismissDeferredOrgSetup}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
                style={{ color: "oklch(55% 0.02 248.6)" }}
                aria-label="Dismiss organisation setup reminder"
              >
                <X size={15} />
              </button>
            </div>
          </section>
        )}

        {/* Today's Focus / Mission */}
        <div
          className="rounded-2xl px-6 py-5 flex items-start gap-4"
          style={{ background: "var(--color-ln-navy)", border: "1px solid oklch(from #34d399 l c h / 0.25)" }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5"
            style={{ background: "oklch(from #34d399 l c h / 0.15)", border: "1px solid oklch(from #34d399 l c h / 0.3)" }}
          >
            <Sparkles size={18} style={{ color: "#34d399" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#34d399" }}>
              Today's Focus
            </p>
            {briefLoading ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "#34d399",
                        opacity: 0.7,
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: "oklch(65% 0.02 248.6)" }}>Generating your daily brief…</span>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium leading-relaxed" style={{ color: "#ffffff" }}>
                  {safeTodayBrief?.priorityFocus
                    ? String(safeTodayBrief.priorityFocus)
                    : "Have one meaningful coaching conversation with a team member today."}
                </p>
                {safeTodayBrief?.managementChallenge && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "oklch(70% 0.02 248.6)" }}>
                    Challenge: {String(safeTodayBrief.managementChallenge)}
                  </p>
                )}
                {safeTodayBrief?.priorityFocus && <AiSuggestionFeedback surface="manager_daily_brief" suggestionKind="daily_focus" contentKey={`manager-daily-brief:${briefDateKey}`} suggestionText={[safeTodayBrief.priorityFocus, safeTodayBrief.managementChallenge].filter(Boolean).join("\n")} dark />}
              </>
            )}
          </div>
          <Link href="/manager/coach" className="flex-shrink-0">
            <button
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "oklch(from #34d399 l c h / 0.15)", color: "#34d399", border: "1px solid oklch(from #34d399 l c h / 0.3)" }}
            >
              Open Coach <ArrowRight size={12} />
            </button>
          </Link>
        </div>

        <section className="rounded-2xl border bg-white p-5" style={{ borderColor: "oklch(90% 0.01 248.6)" }}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-2"><Filter size={15} style={{ color: "#a78bfa" }} /><div><p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#a78bfa" }}>Your AI feedback</p><h2 className="mt-1 text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>Review the responses you have rated.</h2></div></div><span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "oklch(from #a78bfa l c h / 0.1)", color: "#7c3aed" }}>Private to you</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-xs font-medium" style={{ color: "oklch(35% 0.02 248.6)" }}>Reliability<select aria-label="Feedback reliability status" value={feedbackReliability} onChange={(event) => setFeedbackReliability(event.target.value as typeof feedbackReliability)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: "oklch(85% 0.01 248.6)" }}><option value="all">All feedback</option><option value="helpful">Helpful</option><option value="unhelpful">Not helpful</option><option value="malformed">Markup or text issue</option></select></label><label className="text-xs font-medium" style={{ color: "oklch(35% 0.02 248.6)" }}>Date<select aria-label="Feedback date range" value={feedbackDateRange} onChange={(event) => setFeedbackDateRange(event.target.value as typeof feedbackDateRange)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: "oklch(85% 0.01 248.6)" }}><option value="all">All time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="year">Last year</option></select></label><label className="text-xs font-medium" style={{ color: "oklch(35% 0.02 248.6)" }}>Sort<select aria-label="Feedback sort order" value={feedbackSort} onChange={(event) => setFeedbackSort(event.target.value as typeof feedbackSort)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-xs" style={{ borderColor: "oklch(85% 0.01 248.6)" }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="reliability">Reliability status</option></select></label></div>
          {feedbackAnalytics.isLoading ? <p className="mt-5 text-xs" style={{ color: "oklch(50% 0.02 248.6)" }}>Building your 14-day feedback trend…</p> : feedbackAnalytics.isError ? <div className="mt-5 flex items-center gap-3 text-xs" style={{ color: "#b45309" }}><span>Your feedback trend could not load.</span><button className="font-semibold underline" onClick={() => feedbackAnalytics.refetch()}>Try again</button></div> : (() => { const analytics = feedbackAnalytics.data; const maxVolume = Math.max(1, ...(analytics?.trend.map((day) => day.total) ?? [0])); const ratingTotal = analytics?.distribution.total ?? 0; return <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_.55fr]"><div className="rounded-xl border p-4" style={{ borderColor: "oklch(92% 0.01 248.6)", background: "oklch(from #a78bfa l c h / .035)" }}><div className="flex items-center gap-2"><BarChart3 size={14} style={{ color: "#7c3aed" }} /><p className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>Feedback volume · last 14 days</p></div><div className="mt-4 flex h-24 items-end gap-1.5" aria-label="Fourteen-day feedback volume chart">{analytics?.trend.map((day) => <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${day.date}: ${day.total} rating${day.total === 1 ? "" : "s"}`}><div className="w-full rounded-t-sm" style={{ height: `${Math.max(day.total ? 8 : 2, (day.total / maxVolume) * 100)}%`, background: day.helpful ? "#10b981" : day.unhelpful || day.malformed ? "#f59e0b" : "oklch(87% 0.02 248.6)" }} /><span className="text-[8px]" style={{ color: "oklch(53% 0.02 248.6)" }}>{day.date.slice(8)}</span></div>)}</div><p className="mt-2 text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>Each bar is the number of responses you rated that day.</p></div><div className="rounded-xl border p-4" style={{ borderColor: "oklch(92% 0.01 248.6)" }}><p className="text-xs font-semibold" style={{ color: "var(--color-ln-navy)" }}>Rating distribution</p>{ratingTotal === 0 ? <p className="mt-4 text-xs" style={{ color: "oklch(50% 0.02 248.6)" }}>Your rating mix will appear after your first response rating.</p> : <><div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100"><div style={{ width: `${((analytics?.distribution.helpful ?? 0) / ratingTotal) * 100}%`, background: "#10b981" }} /><div style={{ width: `${((analytics?.distribution.unhelpful ?? 0) / ratingTotal) * 100}%`, background: "#f59e0b" }} /><div style={{ width: `${((analytics?.distribution.malformed ?? 0) / ratingTotal) * 100}%`, background: "#ef4444" }} /></div><div className="mt-3 space-y-1.5 text-[11px]" style={{ color: "oklch(40% 0.02 248.6)" }}><p><span className="mr-1 inline-block size-2 rounded-full" style={{ background: "#10b981" }} />Helpful · {analytics?.distribution.helpful ?? 0}</p><p><span className="mr-1 inline-block size-2 rounded-full" style={{ background: "#f59e0b" }} />Not helpful · {analytics?.distribution.unhelpful ?? 0}</p><p><span className="mr-1 inline-block size-2 rounded-full" style={{ background: "#ef4444" }} />Text issue · {analytics?.distribution.malformed ?? 0}</p></div></>}</div></div>; })()}
          {feedbackEntries.isLoading ? <p className="mt-4 text-xs" style={{ color: "oklch(50% 0.02 248.6)" }}>Loading your feedback entries…</p> : feedbackEntries.isError ? <div className="mt-4 flex items-center gap-3 text-xs" style={{ color: "#b45309" }}><span>Your feedback entries could not load.</span><button className="font-semibold underline" onClick={() => feedbackEntries.refetch()}>Try again</button></div> : !feedbackEntries.data?.length ? <p className="mt-4 text-xs" style={{ color: "oklch(50% 0.02 248.6)" }}>No feedback entries match these filters. Rate an AI response to add one here.</p> : <div className="mt-4 space-y-2">{feedbackEntries.data.map((entry) => { const positive = entry.reason === "helpful"; const Icon = positive ? ThumbsUp : ThumbsDown; const label = entry.reason === "helpful" ? "Helpful" : entry.reason === "unhelpful" ? "Not helpful" : "Markup or text issue"; return <article key={entry.id} className="flex gap-3 rounded-xl border p-3" style={{ borderColor: "oklch(92% 0.01 248.6)" }}><Icon size={14} className="mt-0.5 shrink-0" style={{ color: positive ? "#059669" : "#b45309" }} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold" style={{ color: positive ? "#047857" : "#b45309" }}>{label}</span><span className="text-[10px]" style={{ color: "oklch(55% 0.02 248.6)" }}>{new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div><p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "oklch(35% 0.02 248.6)" }}>{entry.contentSnapshot}</p></div></article>; })}</div>}
        </section>

        {/* Recent Play widget */}
        {playbookSessions && playbookSessions.length > 0 && (() => {
          const PLAYBOOK_TYPE_MAP: Record<string, { label: string; color: string; icon: any }> = {
            difficult_conversation: { label: "Difficult Conversation", color: "#f87171", icon: MessageSquareWarning },
            performance_gap: { label: "Performance Gap", color: "#f59e0b", icon: TrendingUp },
            delegation_breakdown: { label: "Delegation Breakdown", color: "#60a5fa", icon: GitBranch },
            team_conflict: { label: "Team Conflict", color: "#a78bfa", icon: Users },
            motivation_engagement: { label: "Motivation & Engagement", color: "#34d399", icon: Zap },
            feedback_resistance: { label: "Feedback Resistance", color: "#fb923c", icon: ShieldAlert },
          };
          const lastPlay = playbookSessions[0] as any;
          const typeCode = lastPlay?.playbook?.playbookType ?? "";
          const typeInfo = PLAYBOOK_TYPE_MAP[typeCode] ?? { label: "Management Play", color: "#f59e0b", icon: BookOpen };
          const TypeIcon = typeInfo.icon;
          const hasReflection = !!(lastPlay?.reflection as any)?.reflectionInsight;

          return (
            <div
              className="rounded-2xl p-5"
              style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} style={{ color: "#f59e0b" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#f59e0b" }}>Recent Play</p>
                </div>
                <Link href="/manager/coach">
                  <button className="text-[10px] font-semibold" style={{ color: "oklch(55% 0.02 248.6)" }}>View All →</button>
                </Link>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `oklch(from ${typeInfo.color} l c h / 0.1)`, border: `1px solid oklch(from ${typeInfo.color} l c h / 0.2)` }}
                >
                  <TypeIcon size={15} style={{ color: typeInfo.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: `oklch(from ${typeInfo.color} l c h / 0.1)`, color: typeInfo.color }}
                    >
                      {typeInfo.label}
                    </span>
                    {hasReflection && (
                      <span
                        className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: "oklch(from #a78bfa l c h / 0.1)", color: "#a78bfa" }}
                      >
                        Reflected
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-snug mb-1" style={{ color: "var(--color-ln-navy)" }}>
                    {lastPlay.situation}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Clock size={10} style={{ color: "oklch(60% 0.02 248.6)" }} />
                    <span className="text-[10px]" style={{ color: "oklch(60% 0.02 248.6)" }}>
                      {new Date(lastPlay.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <Link href="/manager/coach">
                  <button
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg"
                    style={{ background: `oklch(from ${typeInfo.color} l c h / 0.1)`, color: typeInfo.color }}
                  >
                    Open <ChevronRight size={11} />
                  </button>
                </Link>
              </div>

              {!hasReflection && (
                <div
                  className="mt-4 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
                  style={{ background: "oklch(from #a78bfa l c h / 0.06)", border: "1px solid oklch(from #a78bfa l c h / 0.15)" }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} style={{ color: "#a78bfa" }} />
                    <p className="text-xs" style={{ color: "oklch(40% 0.02 248.6)" }}>Reflect on this play to get a coaching insight</p>
                  </div>
                  <Link href="/manager/coach">
                    <button
                      className="text-[10px] font-semibold flex-shrink-0 px-2.5 py-1 rounded-lg"
                      style={{ background: "#a78bfa", color: "white" }}
                    >
                      Reflect
                    </button>
                  </Link>
                </div>
              )}

              <Link href="/manager/coach">
                <button
                  className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl border-2 border-dashed transition-all hover:border-solid"
                  style={{ borderColor: "oklch(85% 0.01 248.6)", color: "oklch(50% 0.02 248.6)" }}
                >
                  <Plus size={12} /> New Play
                </button>
              </Link>
            </div>
          );
        })()}

        {/* Weekly Commitment Check-in Nudge */}
        {commitments && commitments.filter((c: any) => c.status === "active").length > 0 && (() => {
          const activeCommitments = commitments.filter((c: any) => c.status === "active");
          const now = Date.now();
          const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
          const needsCheckin = activeCommitments.some((c: any) => {
            const checkIns = (c.checkIns as any[]) ?? [];
            if (checkIns.length === 0) return true;
            const lastCheckin = Math.max(...checkIns.map((ci: any) => new Date(ci.date).getTime()));
            return lastCheckin < oneWeekAgo;
          });
          if (!needsCheckin) return null;
          return (
            <div
              className="rounded-2xl p-4 flex items-center justify-between gap-4"
              style={{ background: "oklch(from #34d399 l c h / 0.08)", border: "1.5px solid oklch(from #34d399 l c h / 0.25)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(from #34d399 l c h / 0.15)" }}
                >
                  <Target size={16} style={{ color: "#059669" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                    Have you practised your commitments this week?
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>
                    {activeCommitments.length} active commitment{activeCommitments.length !== 1 ? "s" : ""} — log a check-in to keep your streak going.
                  </p>
                </div>
              </div>
              <Link href="/manager/progress">
                <button
                  className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl"
                  style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
                >
                  Check In →
                </button>
              </Link>
            </div>
          );
        })()}

        {/* Module grid */}
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>
            Your Management Toolkit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MEP_MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link key={mod.id} href={mod.href}>
                  <div
                    className="group rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md border"
                    style={{
                      background: "white",
                      borderColor: "oklch(90% 0.01 248.6)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `oklch(from ${mod.color} l c h / 0.12)`, border: `1px solid oklch(from ${mod.color} l c h / 0.25)` }}
                      >
                        <Icon size={18} style={{ color: mod.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                            {mod.title}
                          </h3>
                          <ChevronRight
                            size={14}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                            style={{ color: "var(--color-ln-navy)" }}
                          />
                        </div>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "oklch(45% 0.02 248.6)" }}>
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Getting started CTA if no diagnostics yet */}
        {statValues.diagnostics === 0 && (
          <div
            className="rounded-2xl px-6 py-6 flex items-center justify-between gap-4"
            style={{ background: "oklch(from #34d399 l c h / 0.08)", border: "1px solid oklch(from #34d399 l c h / 0.2)" }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} style={{ color: "#34d399" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                  Start with your Management Diagnostic
                </p>
              </div>
              <p className="text-xs" style={{ color: "oklch(45% 0.02 248.6)" }}>
                Discover your management strengths and growth areas across 10 dimensions. Takes about 15 minutes.
              </p>
            </div>
            <Link href="/manager/diagnostics">
              <Button
                size="sm"
                className="flex-shrink-0 font-semibold"
                style={{ background: "#34d399", color: "var(--color-ln-navy)" }}
              >
                Start Now
              </Button>
            </Link>
          </div>
        )}

        {/* Recent activity placeholder */}
        {stats.recentActivity.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-ln-navy)" }}>
              Recent Activity
            </h2>
            <div className="space-y-2">
              {stats.recentActivity.map((a: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "white", border: "1px solid oklch(90% 0.01 248.6)" }}
                >
                  <Clock size={14} style={{ color: "oklch(55% 0.02 248.6)" }} className="flex-shrink-0" />
                  <p className="text-sm flex-1" style={{ color: "var(--color-ln-navy)" }}>{a.description}</p>
                  <p className="text-xs flex-shrink-0" style={{ color: "oklch(55% 0.02 248.6)" }}>{a.timeAgo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
