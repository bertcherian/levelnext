import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
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
    id: "guide",
    title: "Manager Guide",
    description: "AI-powered coaching for your management challenges",
    icon: MessageSquare,
    href: "/manager/guide",
    color: "#60a5fa",
    badge: null,
  },
  {
    id: "playbook",
    title: "Manager Playbook",
    description: "Situation-specific plays for common management scenarios",
    icon: BookOpen,
    href: "/manager/playbook",
    color: "#f59e0b",
    badge: null,
  },
  {
    id: "brief",
    title: "Daily Management Brief",
    description: "Start each day with clarity on priorities and team pulse",
    icon: Lightbulb,
    href: "/manager/brief",
    color: "#a78bfa",
    badge: null,
  },
  {
    id: "practice",
    title: "AI Practice Partner",
    description: "Role-play difficult conversations before they happen",
    icon: Zap,
    href: "/manager/practice",
    color: "#fb923c",
    badge: null,
  },
  {
    id: "commitments",
    title: "Behaviour Commitments",
    description: "Track and reinforce your management behaviour changes",
    icon: Activity,
    href: "/manager/commitments",
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

  const { data: myResults } = trpc.mep.getMyResults.useQuery();
  const { data: playbookSessions } = trpc.mep.listPlaybookSessions.useQuery();
  const { data: commitments } = trpc.mep.listCommitments.useQuery();
  const { data: practiceSessions } = trpc.mep.listPracticeSessions.useQuery();
  const { data: todayBrief, refetch: refetchBrief } = trpc.mep.getTodayBriefSnapshot.useQuery();
  const generateBriefMutation = trpc.mep.getDailyBrief.useMutation({
    onSuccess: () => { refetchBrief(); },
  });
  const briefLoading = generateBriefMutation.isPending;

  // Auto-generate the daily brief silently on first visit if not yet generated today
  useEffect(() => {
    if (todayBrief === null) {
      generateBriefMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayBrief]);

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
            </div>
            <div
              className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0"
              style={{ background: "oklch(from #34d399 l c h / 0.15)", border: "1px solid oklch(from #34d399 l c h / 0.3)" }}
            >
              <Users size={26} style={{ color: "#34d399" }} />
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
                  {todayBrief?.priorityFocus
                    ? String(todayBrief.priorityFocus)
                    : "Have one meaningful coaching conversation with a team member today."}
                </p>
                {todayBrief?.managementChallenge && (
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "oklch(70% 0.02 248.6)" }}>
                    Challenge: {String(todayBrief.managementChallenge)}
                  </p>
                )}
              </>
            )}
          </div>
          <Link href="/manager/brief" className="flex-shrink-0">
            <button
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "oklch(from #34d399 l c h / 0.15)", color: "#34d399", border: "1px solid oklch(from #34d399 l c h / 0.3)" }}
            >
              Full Brief <ArrowRight size={12} />
            </button>
          </Link>
        </div>

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
