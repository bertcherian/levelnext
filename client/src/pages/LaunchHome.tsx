import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import LaunchLayout from "@/components/LaunchLayout";
import { CheckCircle2, Circle, Zap, Flame, Trophy, ChevronRight, Sparkles, RefreshCw } from "lucide-react";

// ─── Mission Card ─────────────────────────────────────────────────────────────
interface Mission {
  id: string;
  title: string;
  description: string;
  xp: number;
  missionArea: string;
  status: "pending" | "complete";
  completedAt?: string;
}

function MissionCard({
  mission,
  onComplete,
  completing,
}: {
  mission: Mission;
  onComplete: (id: string) => void;
  completing: boolean;
}) {
  const done = mission.status === "complete";

  const areaColors: Record<string, { bg: string; text: string }> = {
    Resume:       { bg: "#E8F2FD", text: "#1A6FD4" },
    Brand:        { bg: "#E8F2FD", text: "#1A6FD4" },
    Network:      { bg: "#E0F7F5", text: "#2EC4B6" },
    Interview:    { bg: "#FFF8E1", text: "#E67E00" },
    Applications: { bg: "#FFEEEE", text: "#E53E3E" },
    Skills:       { bg: "#F0FFF4", text: "#38A169" },
    Research:     { bg: "#F5F0FF", text: "#7C3AED" },
    Communication:{ bg: "#FFF0F5", text: "#D53F8C" },
  };
  const colors = areaColors[mission.missionArea] ?? { bg: "#F7FAFF", text: "#1A6FD4" };

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: done ? "#F0FFF4" : "white",
        border: `1.5px solid ${done ? "#9AE6B4" : "var(--li-border)"}`,
        opacity: done ? 0.85 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => !done && onComplete(mission.id)}
          disabled={done || completing}
          className="mt-0.5 shrink-0 transition-transform"
          style={{ color: done ? "#38A169" : "var(--li-border)" }}
        >
          {done ? (
            <CheckCircle2 size={22} className="li-check-pop" />
          ) : (
            <Circle size={22} />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: colors.bg, color: colors.text }}
            >
              {mission.missionArea}
            </span>
            <span
              className="text-xs font-bold flex items-center gap-0.5"
              style={{ color: "var(--li-warm)" }}
            >
              <Zap size={11} />
              +{mission.xp} XP
            </span>
            {done && (
              <span className="text-xs font-semibold" style={{ color: "#38A169" }}>
                ✓ Done
              </span>
            )}
          </div>
          <p
            className="font-semibold text-sm mb-1"
            style={{ color: done ? "#38A169" : "var(--li-text)", textDecoration: done ? "line-through" : "none" }}
          >
            {mission.title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--li-text-muted)" }}>
            {mission.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── XP Level Badge ───────────────────────────────────────────────────────────
function LevelBadge({ level, xp }: { level: string; xp: number }) {
  const xpInLevel = xp % 200;
  const pct = Math.min((xpInLevel / 200) * 100, 100);

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-4"
      style={{ background: "var(--li-primary-soft)", border: "1.5px solid #BDD8F5" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg"
        style={{ background: "var(--li-primary)", color: "white" }}
      >
        {level.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm" style={{ color: "var(--li-primary)", fontFamily: "'Space Grotesk', sans-serif" }}>
            {level}
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--li-primary)" }}>
            {xp} XP total
          </span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "#BDD8F5" }}>
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ background: "var(--li-primary)", width: `${pct}%` }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--li-text-muted)" }}>
          {200 - xpInLevel} XP to next level
        </p>
      </div>
    </div>
  );
}

// ─── Streak Card ──────────────────────────────────────────────────────────────
function StreakCard({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: "#FFF8E1", border: "1.5px solid #FFD54F" }}
    >
      <Flame size={24} style={{ color: "#E65100" }} />
      <div>
        <p className="font-bold text-sm" style={{ color: "#E65100" }}>
          {streak}-day streak 🔥
        </p>
        <p className="text-xs" style={{ color: "#BF360C" }}>
          Keep it going — complete at least one mission today.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LaunchHome() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [completing, setCompleting] = useState<string | null>(null);
  const [justEarned, setJustEarned] = useState<number | null>(null);

  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, { staleTime: 30_000 });
  const missionsQuery = trpc.launchDailyMissions.getToday.useQuery(undefined, { staleTime: 30_000 });
  const utils = trpc.useUtils();

  const completeMission = trpc.launchDailyMissions.completeMission.useMutation({
    onSuccess: (data) => {
      setJustEarned(data.xpEarned);
      setTimeout(() => setJustEarned(null), 3000);
      utils.launchDailyMissions.getToday.invalidate();
      utils.launchProgress.getProgress.invalidate();
      setCompleting(null);
    },
    onError: () => setCompleting(null),
  });

  const awardXp = trpc.launchProgress.awardXp.useMutation();

  const progress = progressQuery.data?.progress;
  const missions = (missionsQuery.data?.missions ?? []) as Mission[];
  const completedCount = missions.filter((m) => m.status === "complete").length;
  const allDone = completedCount === missions.length && missions.length > 0;

  const handleComplete = (missionId: string) => {
    setCompleting(missionId);
    completeMission.mutate({ missionId });
    awardXp.mutate({ action: "complete_daily_mission" });
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Onboarding redirect if not set up
  if (progressQuery.isSuccess && progress && !progress.targetRole) {
    navigate("/launch/onboarding");
    return null;
  }

  return (
    <LaunchLayout>
      {/* Greeting Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm" style={{ color: "var(--li-text-muted)" }}>
          {progress?.targetRole
            ? `Your path to ${progress.targetRole} — one mission at a time.`
            : "Your career launch starts here."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Daily Missions */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Mission Header */}
          <div
            className="rounded-xl p-4"
            style={{ background: "white", border: "1.5px solid var(--li-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} style={{ color: "var(--li-primary)" }} />
                <h2 className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
                  Today's Missions
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--li-primary-soft)", color: "var(--li-primary)" }}>
                  {completedCount}/{missions.length} done
                </span>
                <button
                  onClick={() => { utils.launchDailyMissions.getToday.invalidate(); }}
                  className="p-1 rounded-lg"
                  style={{ color: "var(--li-text-muted)" }}
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* XP Toast */}
            {justEarned && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-sm font-semibold animate-fade-in flex items-center gap-2"
                style={{ background: "var(--li-warm-soft)", color: "#E67E00", border: "1.5px solid #FFD54F" }}
              >
                <Zap size={14} />
                +{justEarned} XP earned!
              </div>
            )}

            {/* All done banner */}
            {allDone && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style={{ background: "var(--li-success-soft)", color: "var(--li-success)", border: "1.5px solid #9AE6B4" }}
              >
                <Trophy size={14} />
                All missions complete! Come back tomorrow for new ones. 🎉
              </div>
            )}

            {/* Missions List */}
            {missionsQuery.isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--li-primary-soft)" }} />
                ))}
              </div>
            ) : missions.length === 0 ? (
              <div className="text-center py-8" style={{ color: "var(--li-text-muted)" }}>
                <p className="text-sm">No missions yet. Check back in a moment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {missions.map((m) => (
                  <MissionCard
                    key={m.id}
                    mission={m}
                    onComplete={handleComplete}
                    completing={completing === m.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Practice Interview", icon: "🎤", href: "/launch/interview", color: "var(--li-primary-soft)", textColor: "var(--li-primary)" },
              { label: "Resume Builder", icon: "📄", href: "/launch/resume", color: "var(--li-accent-soft)", textColor: "var(--li-accent)" },
              { label: "Job Tracker", icon: "🎯", href: "/launch/jobs", color: "var(--li-warm-soft)", textColor: "#E67E00" },
              { label: "Network Builder", icon: "🤝", href: "/launch/network", color: "var(--li-coral-soft)", textColor: "var(--li-coral)" },
            ].map(({ label, icon, href, color, textColor }) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className="rounded-xl p-3 flex items-center gap-2 text-left transition-all duration-150 hover:scale-[1.02]"
                style={{ background: color, border: `1.5px solid ${color}` }}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold" style={{ color: textColor }}>{label}</span>
                <ChevronRight size={14} className="ml-auto" style={{ color: textColor }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Progress Panel */}
        <div className="flex flex-col gap-4">
          {/* Level Badge */}
          {progress && (
            <LevelBadge level={progress.currentLevel} xp={progress.totalXp} />
          )}

          {/* Streak */}
          {progress && <StreakCard streak={progress.currentStreak} />}

          {/* Journey Progress */}
          <div
            className="rounded-xl p-4"
            style={{ background: "white", border: "1.5px solid var(--li-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--li-text)" }}>
                Your Journey
              </h3>
              <button
                onClick={() => navigate("/launch/journey")}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: "var(--li-primary)" }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            {[
              { label: "Discover Yourself", icon: "🔍", done: true },
              { label: "Build Your Brand", icon: "✨", done: false, active: true },
              { label: "Master Interviews", icon: "🎤", done: false },
              { label: "Land the Offer", icon: "🏆", done: false },
            ].map(({ label, icon, done, active }, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{
                    background: done ? "var(--li-success)" : active ? "var(--li-primary)" : "var(--li-border)",
                    color: done || active ? "white" : "var(--li-text-muted)",
                  }}
                >
                  {done ? "✓" : icon}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: done ? "var(--li-success)" : active ? "var(--li-primary)" : "var(--li-text-muted)" }}
                >
                  {label}
                </span>
                {active && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--li-primary-soft)", color: "var(--li-primary)" }}>
                    Now
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Target Role */}
          {progress?.targetRole && (
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--li-accent-soft)", border: "1.5px solid #81E6D9" }}
            >
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--li-accent)" }}>
                🎯 Target Role
              </p>
              <p className="text-sm font-bold" style={{ color: "var(--li-text)" }}>
                {progress.targetRole}
              </p>
              {progress.targetIndustry && (
                <p className="text-xs" style={{ color: "var(--li-text-muted)" }}>
                  {progress.targetIndustry}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </LaunchLayout>
  );
}
