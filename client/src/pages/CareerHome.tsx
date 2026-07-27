import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import CareerLanding from "@/pages/CareerLanding";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Briefcase, Target, TrendingUp, ArrowRight, CheckCircle2,
  Circle, Loader2, Zap, Flame, Star, BookOpen, MessageSquare,
  ChevronRight, Award, BarChart3,
} from "lucide-react";

const CI_MODULE_LABELS: Record<string, string> = {
  CPI: "Career Positioning",
  CRS: "Career Resilience",
  CMK: "Marketability",
  CST: "Career Strategy",
  CAO: "Career Optionality",
  AIR: "AI Readiness",
};

const CI_MODULE_DESCRIPTIONS: Record<string, string> = {
  CPI: "How clearly you own and communicate your career identity",
  CRS: "Your ability to adapt and recover when career plans change",
  CMK: "How visible, valued, and in-demand you are in the market",
  CST: "The clarity and ambition of your 3–5 year career plan",
  CAO: "How many real options you have beyond your current role",
  AIR: "Your readiness to work with and alongside AI effectively",
};

const CI_MODULE_ORDER = ["CPI", "CRS", "CMK", "CST", "CAO", "AIR"];

// ── Career Practice Coach Card ───────────────────────────────────────────────
function CareerPracticeCard() {
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
          <p className="text-sm font-semibold text-white">Career Practice Coach</p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(70% 0.02 248.6)" }}>
            Rehearse salary negotiations, interviews, promotion conversations, and more.
          </p>
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
      <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid oklch(from white 30% 0 0 / 0.12)" }}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: sessionsThisWeek > 0 ? "oklch(from var(--color-ln-yellow) l c h / 0.18)" : "oklch(30% 0.01 248.6)" }}>
          <Zap size={11} style={{ color: sessionsThisWeek > 0 ? "var(--color-ln-yellow)" : "oklch(50% 0.02 248.6)" }} />
          <span className="text-[11px] font-semibold" style={{ color: sessionsThisWeek > 0 ? "var(--color-ln-yellow)" : "oklch(50% 0.02 248.6)" }}>
            {sessionsThisWeek} session{sessionsThisWeek !== 1 ? "s" : ""} this week
          </span>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "oklch(from #f97316 l c h / 0.18)" }}>
            <Flame size={11} style={{ color: "#f97316" }} />
            <span className="text-[11px] font-semibold" style={{ color: "#f97316" }}>{streakDays} day streak</span>
          </div>
        )}
        {streakDays === 0 && sessionsThisWeek === 0 && (
          <span className="text-[11px]" style={{ color: "oklch(45% 0.02 248.6)" }}>Start your first session to build a streak</span>
        )}
      </div>
    </div>
  );
}

// ── Career Transition Coach (Guide) Card ───────────────────────────────────────────
function CareerStrategistCard() {
  const [, navigate] = useLocation();
  // No dedicated unread count — use guide nav badge from PlatformLayout instead
  const unreadCount = 0;

  return (
    <div className="rounded-2xl p-4 sm:p-5 cursor-pointer group" style={{ background: "var(--color-ln-navy)", boxShadow: "var(--shadow-card)" }}
      onClick={() => navigate("/guide")}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "oklch(from #6366f1 l c h / 0.18)", border: "1.5px solid oklch(from #6366f1 l c h / 0.4)" }}>
          <MessageSquare size={18} style={{ color: "#818cf8" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Career Transition Coach</p>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#6366f1", color: "white" }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "oklch(70% 0.02 248.6)" }}>
            Your AI career advisor — explore options, work through blockers, plan your next move.
          </p>
        </div>
        <ChevronRight size={16} className="flex-shrink-0 text-white/30 group-hover:text-white/60 transition-colors" />
      </div>
    </div>
  );
}

export default function CareerHome() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const { data: unlockData, isLoading: unlockLoading } = trpc.unlock.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: activeCommitment } = trpc.guide.getActiveCommitment.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: careerScoreData } = trpc.careerAccess.getCareerAccessScore.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: ciReports } = trpc.report.myReports.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // For unauthenticated visitors, show the public Career Transition Intelligence landing page
  // instead of bouncing them to the root landing page.
  if (!loading && !isAuthenticated) return <CareerLanding />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <Loader2 className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
      </div>
    );
  }

  // Career Access Score (from careerAccessScoreSnapshots)
  const careerEdgeScore: number | null = careerScoreData?.latest?.compositeScore ?? null;

  // CI diagnostic progress — use actual CI reports, not LI unlock status
  const CI_CODES = new Set(CI_MODULE_ORDER);
  const ciCompletedReports = Array.isArray(ciReports)
    ? ciReports.filter((r: any) => CI_CODES.has(r.moduleType))
    : [];
  const completedCodes = new Set(ciCompletedReports.map((r: any) => r.moduleType));
  const totalModules = CI_MODULE_ORDER.length;
  const completedCount = completedCodes.size;
  const progressPct = Math.round((completedCount / totalModules) * 100);

  // Build ordered module list from CI reports
  const orderedModules = CI_MODULE_ORDER.map(code => {
    const report = ciCompletedReports.find((r: any) => r.moduleType === code);
    return {
      moduleId: code,
      state: report ? "completed" : (completedCount === CI_MODULE_ORDER.indexOf(code) ? "unlocked" : "locked"),
      score: report?.edgeScore ?? null,
    };
  });

  // unlockLoading is used for the loading state
  const moduleStatuses = orderedModules;

  return (
    <PlatformLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Welcome header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} style={{ color: "var(--color-ln-yellow)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ln-yellow)" }}>Career Transition Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(45% 0.02 248.6)" }}>
            {completedCount === 0
              ? "Start your Career Transition Intelligence journey — discover your gaps and build your career capital."
              : completedCount === totalModules
              ? "You've completed all 6 Career Transition Intelligence diagnostics. Your Career Edge is fully mapped."
              : `${completedCount} of ${totalModules} diagnostics complete — keep going to unlock your full Career Edge score.`}
          </p>
        </div>

        {/* Career Edge Score */}
        {careerEdgeScore !== null && (
          <div className="rounded-2xl p-5" style={{ background: "var(--color-ln-navy)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>Career Edge Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black" style={{ color: "var(--color-ln-yellow)" }}>{careerEdgeScore}</span>
                  <span className="text-lg font-medium mb-1" style={{ color: "oklch(55% 0.02 248.6)" }}>/100</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.12)", border: "2px solid oklch(from var(--color-ln-yellow) l c h / 0.3)" }}>
                <Star size={24} style={{ color: "var(--color-ln-yellow)" }} />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "oklch(55% 0.02 248.6)" }}>
                <span>Career Capital Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(25% 0.02 248.6)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: "var(--color-ln-yellow)" }} />
              </div>
            </div>
          </div>
        )}

        {/* Active commitment */}
        {activeCommitment && (
          <div className="rounded-2xl p-4" style={{ background: "oklch(from #10b981 l c h / 0.08)", border: "1px solid oklch(from #10b981 l c h / 0.25)" }}>
            <div className="flex items-start gap-3">
              <Target size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#10b981" }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#10b981" }}>Active Commitment</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>
                  {(activeCommitment as any).commitmentText}
                </p>
                {(activeCommitment as any).dueDate && (
                  <p className="text-xs mt-1" style={{ color: "oklch(50% 0.02 248.6)" }}>
                    Due {new Date((activeCommitment as any).dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Career Transition Coach + Practice Coach */}
        <div className="space-y-3">
          <CareerStrategistCard />
          <CareerPracticeCard />
        </div>

        {/* Diagnostics progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "var(--color-ln-navy)" }}>Career Diagnostics</h2>
            <Link href="/diagnostics">
              <span className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: "var(--color-ln-yellow)" }}>
                View all <ArrowRight size={12} />
              </span>
            </Link>
          </div>
          {unlockLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin" style={{ color: "var(--color-ln-navy)" }} />
            </div>
          ) : (
            <div className="space-y-2">
              {orderedModules.map((mod: any, idx: number) => {
                const code = (mod as any).moduleId as string;
                const label = CI_MODULE_LABELS[code] ?? code;
                const desc = CI_MODULE_DESCRIPTIONS[code] ?? "";
                const isCompleted = (mod as any).state === "completed";
                const isUnlocked = (mod as any).state === "unlocked";
                const isLocked = (mod as any).state === "locked";
                const isCurrent = isUnlocked || (isLocked && idx === completedCount);

                return (
                  <div
                    key={code}
                    className={`rounded-xl p-4 flex items-center gap-4 transition-all duration-150 ${isLocked && !isCurrent ? "opacity-50" : ""} ${(isUnlocked || isCompleted) ? "cursor-pointer hover:shadow-md" : ""}`}
                    style={{ background: "white", boxShadow: "var(--shadow-card)", border: isCurrent ? "1.5px solid var(--color-ln-yellow)" : "1.5px solid transparent" }}
                    onClick={() => {
                      if (isUnlocked || isCompleted) navigate(`/diagnostic/${code.toLowerCase()}`);
                      else toast.info("Complete the previous diagnostic to unlock this one.");
                    }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCompleted
                          ? "oklch(from #10b981 l c h / 0.12)"
                          : isCurrent
                          ? "oklch(from var(--color-ln-yellow) l c h / 0.12)"
                          : "oklch(95% 0 0)",
                      }}>
                      {isCompleted
                        ? <CheckCircle2 size={18} style={{ color: "#10b981" }} />
                        : isCurrent
                        ? <BookOpen size={18} style={{ color: "var(--color-ln-yellow)" }} />
                        : <Circle size={18} style={{ color: "oklch(70% 0 0)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{label}</p>
                        {isCurrent && !isCompleted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
                            Up next
                          </span>
                        )}
                        {isCompleted && (mod as any).score != null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "oklch(from #10b981 l c h / 0.12)", color: "#10b981" }}>
                            {mod.score}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "oklch(50% 0.02 248.6)" }}>{desc}</p>
                    </div>
                    {(isUnlocked || isCompleted) && (
                      <ChevronRight size={16} className="flex-shrink-0" style={{ color: "oklch(65% 0 0)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/career/progress">
            <div className="rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
              <BarChart3 size={20} className="mb-2" style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Progress</p>
              <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>Track your career capital growth</p>
            </div>
          </Link>
          <Link href="/career/resume">
            <div className="rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
              <Award size={20} className="mb-2" style={{ color: "var(--color-ln-navy)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Resume Makeover</p>
              <p className="text-xs mt-0.5" style={{ color: "oklch(50% 0.02 248.6)" }}>ATS score, rewrite & cover letter</p>
            </div>
          </Link>
        </div>
      </div>
    </PlatformLayout>
  );
}
