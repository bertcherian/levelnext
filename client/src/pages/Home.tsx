import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Target, TrendingUp, ArrowRight, CheckCircle2, Circle, Loader2, Zap, Flame, BookOpen, Building2, Wand2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  TII: "Time Intelligence",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
  LDI: "Derailment Intelligence",
  STI: "Strategic Thinking",
};


// ── Leader Playbook Card ─────────────────────────────────────────────────────
function LeaderPlaybookCard() {
  const [, navigate] = useLocation();
  const { data: sessions } = trpc.playbook.listSessions.useQuery({ limit: 3 }, { staleTime: 60_000 });
  const recentCount = sessions?.length ?? 0;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 cursor-pointer card-lift"
      style={{
        background: "oklch(from var(--color-ln-navy) 18% 0.03 248.6)",
        border: "1.5px solid oklch(from var(--color-ln-navy) 30% 0.04 248.6)",
        boxShadow: "var(--shadow-card)",
      }}
      onClick={() => navigate("/playbook")}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(from #7B5EA7 l c h / 0.18)", border: "1.5px solid oklch(from #7B5EA7 l c h / 0.4)" }}
        >
          <BookOpen size={18} style={{ color: "#a78bfa" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Playbook</p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(70% 0.02 248.6)" }}>
            Turn any leadership situation into a structured coaching playbook — instantly.
          </p>
        </div>
        <button
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "#7B5EA7", color: "white" }}
          onClick={(e) => { e.stopPropagation(); navigate("/playbook"); }}
        >
          Open <ArrowRight size={12} className="ml-0.5" />
        </button>
      </div>
      {recentCount > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid oklch(from white 30% 0 0 / 0.1)" }}>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "oklch(from #7B5EA7 l c h / 0.18)" }}
          >
            <BookOpen size={11} style={{ color: "#a78bfa" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#a78bfa" }}>
              {recentCount} recent playbook{recentCount !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[11px]" style={{ color: "oklch(45% 0.02 248.6)" }}>Tap to continue →</span>
        </div>
      )}
      {recentCount === 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid oklch(from white 30% 0 0 / 0.1)" }}>
          <span className="text-[11px]" style={{ color: "oklch(45% 0.02 248.6)" }}>Describe a situation to get your first playbook →</span>
        </div>
      )}
    </div>
  );
}

// ── Practice Coach Card with weekly stats ────────────────────────────────────
function PracticeCoachCard() {
  const [, navigate] = useLocation();
  const { data: stats } = trpc.leadershipCoach.weeklyStats.useQuery();

  const sessionsThisWeek = stats?.sessionsThisWeek ?? 0;
  const streakDays = stats?.streakDays ?? 0;

  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--color-ln-navy)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", border: "1.5px solid oklch(from var(--color-ln-yellow) l c h / 0.4)" }}>
          <Zap size={18} style={{ color: "var(--color-ln-yellow)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Practice</p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(70% 0.02 248.6)" }}>Rehearse real conversations, get instant feedback, and build your leadership muscle.</p>
        </div>
        <Button
          size="sm"
          className="flex-shrink-0 font-semibold text-xs"
          style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
          onClick={() => navigate("/practice")}
        >
          Practice <ArrowRight size={13} className="ml-1" />
        </Button>
      </div>

      {/* Activity badges */}
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid oklch(from white 30% 0 0 / 0.12)" }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: sessionsThisWeek > 0 ? "oklch(from var(--color-ln-yellow) l c h / 0.18)" : "oklch(30% 0.01 248.6)" }}>
          <Zap size={11} style={{ color: sessionsThisWeek > 0 ? "var(--color-ln-yellow)" : "oklch(50% 0.02 248.6)" }} />
          <span className="text-[11px] font-semibold" style={{ color: sessionsThisWeek > 0 ? "var(--color-ln-yellow)" : "oklch(50% 0.02 248.6)" }}>
            {sessionsThisWeek} session{sessionsThisWeek !== 1 ? "s" : ""} this week
          </span>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "oklch(from #f97316 l c h / 0.18)" }}>
            <Flame size={11} style={{ color: "#f97316" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#f97316" }}>
              {streakDays} day streak
            </span>
          </div>
        )}
        {streakDays === 0 && sessionsThisWeek === 0 && (
          <span className="text-[11px]" style={{ color: "oklch(45% 0.02 248.6)" }}>Start your first session to build a streak</span>
        )}
      </div>
    </div>
  );
}

// ── Next Chapter Hero Card ─────────────────────────────────────────────────
function NextChapterCard() {
  const [, navigate] = useLocation();
  const { data: ncProfile } = trpc.nextChapter.getProfile.useQuery(undefined, { staleTime: 60_000 });

  const completedCount = (ncProfile?.completedModules as number[] | null)?.length ?? 0;
  const currentModule = ncProfile?.currentModule ?? 1;
  const isNew = !ncProfile;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 cursor-pointer card-lift"
      style={{
        background: "linear-gradient(135deg, var(--color-ln-navy) 0%, oklch(from var(--color-ln-navy) 20% 0.05 248.6) 100%)",
        border: "1.5px solid var(--color-ln-yellow)",
        boxShadow: "0 0 0 1px oklch(from var(--color-ln-yellow) l c h / 0.15), var(--shadow-card)",
      }}
      onClick={() => navigate("/next-chapter")}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", border: "1.5px solid var(--color-ln-yellow)" }}
        >
          <Sparkles size={18} style={{ color: "var(--color-ln-yellow)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Next Chapter</p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(70% 0.02 248.6)" }}>
            {isNew
              ? "Begin your identity transformation journey — 6 stages, 16 modules."
              : `Stage ${ncProfile?.currentStage ?? 1} · Module ${currentModule} · ${completedCount}/16 complete`}
          </p>
        </div>
        <Button
          size="sm"
          className="flex-shrink-0 font-semibold text-xs"
          style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
          onClick={(e) => { e.stopPropagation(); navigate("/next-chapter"); }}
        >
          {isNew ? "Begin" : "Continue"} <ArrowRight size={13} className="ml-1" />
        </Button>
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid oklch(from white 30% 0 0 / 0.12)" }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 16) * 100}%`, background: "var(--color-ln-yellow)" }}
            />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: "var(--color-ln-yellow)" }}>
            {completedCount}/16 modules
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.myTenant.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: graph } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated, staleTime: 0, refetchOnMount: true });
  const { data: missions, refetch: refetchMissions } = trpc.mission.today.useQuery(undefined, { enabled: isAuthenticated });

  const generateMission = trpc.mission.generate.useMutation({
    onSuccess: () => { refetchMissions(); toast.success("New Mission generated by Guide"); },
    onError: () => toast.error("Could not generate a mission right now"),
  });

  const updateMissionStatus = trpc.mission.updateStatus.useMutation({
    onSuccess: () => refetchMissions(),
  });

  // MUST be before any early return — Rules of Hooks
  const { data: myOrg } = trpc.enterpriseOnboarding.getMyOrganisation.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && !tenantLoading && !tenant) {
      navigate("/onboard");
    }
  }, [loading, isAuthenticated, tenantLoading, tenant, navigate]);

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-muted)" }} />
        </div>
      </PlatformLayout>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Leader";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const completedModules = graph?.completedModules ?? [];
  const pendingModules = (["ECI", "TII", "LII", "GCC", "LDI", "STI"] as const).filter((m) => !completedModules.includes(m));

  const isOrgAdmin = tenant?.role === "owner" || tenant?.role === "admin";
  const showOrgSetupCard = isOrgAdmin && (!myOrg || myOrg.wizardStatus !== "activated");

  return (
    <PlatformLayout title="Home">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8 animate-fade-in">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
            {completedModules.length === 0
              ? "Start with your first diagnostic to build your Leadership Edge."
              : `Your Edge continues to strengthen. ${completedModules.length} of 6 modules complete.`}
          </p>
        </div>

        {/* Org Setup Prompt Card — visible only to org owners/admins who haven't completed setup */}
        {showOrgSetupCard && (
          <div
            className="rounded-2xl p-4 sm:p-5 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, oklch(from var(--color-ln-navy) 14% 0.04 248.6) 0%, oklch(from var(--color-ln-navy) 18% 0.05 248.6) 100%)",
              border: "1.5px solid oklch(from var(--color-ln-yellow) l c h / 0.5)",
              boxShadow: "0 0 0 1px oklch(from var(--color-ln-yellow) l c h / 0.1), var(--shadow-card)",
            }}
            onClick={() => navigate("/enterprise-onboarding")}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", border: "1.5px solid oklch(from var(--color-ln-yellow) l c h / 0.4)" }}
              >
                <Building2 size={18} style={{ color: "var(--color-ln-yellow)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">Organisation Setup</p>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.2)", color: "var(--color-ln-yellow)" }}
                  >
                    {myOrg?.wizardStatus === "in_progress" ? `Step ${myOrg.wizardStep ?? 1} of 8` : "Action Required"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "oklch(70% 0.02 248.6)" }}>
                  {myOrg?.wizardStatus === "in_progress"
                    ? "Continue the setup wizard to activate AI coaching context for your organisation."
                    : "Add your company URL, values, competency frameworks, and strategic priorities to personalise AI coaching for your team."}
                </p>
              </div>
              <Button
                size="sm"
                className="flex-shrink-0 font-semibold text-xs mt-0.5"
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
                onClick={(e) => { e.stopPropagation(); navigate("/enterprise-onboarding"); }}
              >
                <Wand2 size={12} className="mr-1" />
                {myOrg?.wizardStatus === "in_progress" ? "Continue" : "Start Setup"}
              </Button>
            </div>
            {/* Quick-access links */}
            <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid oklch(from white 30% 0 0 / 0.08)" }}>
              <button
                className="text-[11px] font-medium flex items-center gap-1 hover:underline"
                style={{ color: "oklch(60% 0.04 248.6)" }}
                onClick={(e) => { e.stopPropagation(); navigate("/admin/org-context"); }}
              >
                Org Context →
              </button>
              <button
                className="text-[11px] font-medium flex items-center gap-1 hover:underline"
                style={{ color: "oklch(60% 0.04 248.6)" }}
                onClick={(e) => { e.stopPropagation(); navigate("/admin"); }}
              >
                Admin Dashboard →
              </button>
            </div>
          </div>
        )}

        {/* Edge Summary */}
        {graph?.compositeEdge !== undefined && (
          <div className="rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6" style={{ background: "var(--color-ln-navy)" }}>
            <div className="flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-4"
                style={{ borderColor: "var(--color-ln-yellow)", background: "oklch(from var(--color-ln-yellow) l c h / 0.1)" }}>
                <span className="text-2xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>
                  {graph.compositeEdge}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: "oklch(70% 0.02 248.6)" }}>Your Leadership Edge</p>
              <div className="flex flex-wrap gap-3">
                {(["ECI", "TII", "LII", "GCC", "LDI", "STI"] as const).map((mod) => {
                  const score = graph.moduleEdges?.[mod];
                  const done = completedModules.includes(mod);
                  return (
                    <div key={mod} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: done ? "var(--color-ln-yellow)" : "oklch(40% 0.02 248.6)" }} />
                      <span className="text-sm" style={{ color: done ? "white" : "oklch(50% 0.02 248.6)" }}>
                        {MODULE_LABELS[mod]}: {done ? score : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white flex-shrink-0" onClick={() => navigate("/my-edge")}>
              <TrendingUp size={16} className="mr-1.5" /> My Edge
            </Button>
          </div>
        )}

        {/* Two-column: Today's Focus + Today's Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Today's Focus */}
          <div className="rounded-2xl p-4 sm:p-6 card-lift" style={{ background: "white", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-ln-border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} style={{ color: "var(--color-ln-yellow)" }} />
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-muted)" }}>Today's Focus</span>
            </div>
            {pendingModules.length > 0 ? (
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                  Complete your {MODULE_LABELS[pendingModules[0]!]} Diagnostic
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--color-ln-muted)" }}>
                  Build your Edge in {MODULE_LABELS[pendingModules[0]!]} — takes about 10 minutes.
                </p>
                <Button size="sm" className="font-semibold" style={{ background: "var(--color-ln-navy)", color: "white" }} onClick={() => navigate(`/diagnostics/${pendingModules[0]!.toLowerCase()}`)}>
                  Begin Diagnostic <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>
            ) : (
              <div>
                <p className="font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>All diagnostics complete</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-ln-muted)" }}>
                  Review your Insights or speak with Guide for your next growth opportunity.
                </p>
                <Button size="sm" className="font-semibold" style={{ background: "var(--color-ln-navy)", color: "white" }} onClick={() => navigate("/insights")}>
                  View Insights <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Today's Mission */}
          <div className="rounded-2xl p-4 sm:p-6 card-lift" style={{ background: "oklch(from var(--color-ln-yellow) 98% 0.02 82)", boxShadow: "0 0 0 2px var(--color-ln-yellow), var(--shadow-card)", border: "1.5px solid var(--color-ln-yellow)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={18} style={{ color: "var(--color-ln-yellow)" }} />
                <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-ln-navy)" }}>Today's Mission</span>
              </div>
              <button
                onClick={() => generateMission.mutate()}
                disabled={generateMission.isPending}
                className="text-xs font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--color-ln-yellow)" }}
              >
                {generateMission.isPending ? "Generating…" : "+ New"}
              </button>
            </div>

            {missions && missions.length > 0 ? (
              <div className="space-y-3">
                {missions.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-start gap-3">
                    <button
                      onClick={() => updateMissionStatus.mutate({
                        missionId: m.id,
                        status: m.status === "complete" ? "pending" : "complete",
                      })}
                      className="mt-0.5 flex-shrink-0 transition-colors"
                      style={{ color: m.status === "complete" ? "var(--color-ln-yellow)" : "var(--color-ln-border)" }}
                    >
                      {m.status === "complete" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${m.status === "complete" ? "line-through opacity-50" : ""}`}
                        style={{ color: "var(--color-ln-navy)" }}>
                        {m.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm mb-3" style={{ color: "var(--color-ln-muted)" }}>No missions yet today.</p>
                <Button size="sm" onClick={() => generateMission.mutate()} disabled={generateMission.isPending}
                  style={{ background: "var(--color-ln-navy)", color: "white" }}>
                  {generateMission.isPending ? "Generating…" : "Generate Mission"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Guide Recommendation */}
        <div className="rounded-2xl p-4 sm:p-6" style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.06)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.2)" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-ln-yellow)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>G</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>Guide</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-muted)" }}>
                {completedModules.length === 0
                  ? "Start with the Executive Communication diagnostic to unlock your first leadership Insight. I'll be here to coach you through what you discover."
                  : `Your Edge is at ${graph?.compositeEdge ?? 0}. Let's talk about what's driving your growth and where your next opportunity lies.`}
              </p>
              <Button size="sm" variant="ghost" className="mt-3 px-0 font-semibold hover:bg-transparent"
                style={{ color: "var(--color-ln-navy)" }} onClick={() => navigate("/guide")}>
                Open Guide <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Next Chapter Hero Card ── */}
        <NextChapterCard />

        {/* AI Practice Coach quick-access */}
        <PracticeCoachCard />

        {/* Leader Playbook quick-access */}
        <LeaderPlaybookCard />

        {/* Quick access to diagnostics */}
        {pendingModules.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Your Diagnostics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["ECI", "TII", "LII", "GCC", "LDI", "STI"] as const).map((mod) => {
                const done = completedModules.includes(mod);
                const score = graph?.moduleEdges?.[mod];
                return (
                  <Link key={mod} href={done ? "/my-edge" : `/diagnostics/${mod.toLowerCase()}`}>
                    <div className="rounded-xl p-4 cursor-pointer card-lift"
                      style={{
                        background: done ? "var(--color-ln-navy)" : "white",
                        border: `1px solid ${done ? "transparent" : "var(--color-ln-border)"}`,
                        boxShadow: "var(--shadow-card)",
                      }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: done ? "var(--color-ln-yellow)" : "var(--color-ln-muted)" }}>
                          {mod}
                        </span>
                        {done && <span className="text-xs font-bold" style={{ color: "var(--color-ln-yellow)" }}>{score}</span>}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: done ? "white" : "var(--color-ln-navy)" }}>
                        {MODULE_LABELS[mod]}
                      </p>
                      <p className="text-xs mt-1" style={{ color: done ? "oklch(70% 0.02 248.6)" : "var(--color-ln-muted)" }}>
                        {done ? (graph?.modules?.[mod as "ECI" | "TII" | "LII" | "GCC" | "LDI" | "STI"])?.archetypeLabel ?? (graph?.archetypes?.[mod] ?? "Complete") : "Tap to begin →"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
