import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import LaunchLayout from "@/components/LaunchLayout";
import AchievementUnlockedModal from "@/components/AchievementUnlockedModal";
import {
  CheckCircle2, Circle, Zap, Flame, Trophy, ChevronRight,
  Sparkles, RefreshCw, Map, Rocket, Target, Star
} from "lucide-react";

// ─── (AnimatedBg removed — provided by LaunchLayout) ─────────────────────────
/*
function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 40%, #0A1628 70%, #060D1A 100%)"
      }} />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        </div>
  );
}
*/
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

const AREA_COLORS: Record<string, string> = {
  Resume: "#3B82F6",
  Brand: "#8B5CF6",
  Network: "#10B981",
  Interview: "#F59E0B",
  Applications: "#EF4444",
  Skills: "#06B6D4",
  Research: "#A78BFA",
  Communication: "#EC4899",
};

function MissionCard({ mission, onComplete, completing }: {
  mission: Mission; onComplete: (id: string) => void; completing: boolean;
}) {
  const done = mission.status === "complete";
  const color = AREA_COLORS[mission.missionArea] ?? "#3B82F6";

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: done
          ? "rgba(16,185,129,0.08)"
          : "rgba(255,255,255,0.04)",
        border: done
          ? "1.5px solid rgba(16,185,129,0.3)"
          : "1.5px solid rgba(255,255,255,0.08)",
        opacity: done ? 0.75 : 1,
      }}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => !done && onComplete(mission.id)}
          disabled={done || completing}
          className="mt-0.5 shrink-0 transition-all duration-150"
          style={{ color: done ? "#10B981" : "rgba(255,255,255,0.3)" }}>
          {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${color}22`, color }}>
              {mission.missionArea}
            </span>
            <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: "#F59E0B" }}>
              <Zap size={10} />+{mission.xp} XP
            </span>
            {done && <span className="text-[10px] font-semibold" style={{ color: "#10B981" }}>✓ Done</span>}
          </div>
          <p className="font-semibold text-sm mb-1"
            style={{
              color: done ? "#10B981" : "#fff",
              textDecoration: done ? "line-through" : "none",
              fontFamily: "Space Grotesk, sans-serif"
            }}>
            {mission.title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            {mission.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── XP Level Ring ────────────────────────────────────────────────────────────
function LevelRing({ level, xp }: { level: string; xp: number }) {
  const xpInLevel = xp % 300;
  const pct = Math.min((xpInLevel / 300) * 100, 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  const levelColors: Record<string, string> = {
    Explorer: "#94A3B8",
    Builder: "#3B82F6",
    Professional: "#10B981",
    Candidate: "#F59E0B",
    "Top Pick": "#EF4444",
    Legend: "#A78BFA",
  };
  const color = levelColors[level] ?? "#3B82F6";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="44" cy="44" r="36" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif", lineHeight: 1 }}>
            {level.charAt(0)}
          </span>
          <span className="text-[9px] font-semibold mt-0.5" style={{ color }}>
            {level}
          </span>
        </div>
      </div>
      <p className="text-xs mt-2 font-semibold text-white">{xp} XP</p>
      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{300 - xpInLevel} to next</p>
    </div>
  );
}

// ─── Quick Action Tile ────────────────────────────────────────────────────────
function ActionTile({ emoji, label, href, color, onClick }: {
  emoji: string; label: string; href: string; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="rounded-2xl p-3 flex flex-col items-center gap-2 text-center transition-all duration-200"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}25`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${color}20`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}>
      <span className="text-2xl">{emoji}</span>
      <span className="text-[11px] font-semibold leading-tight" style={{ color }}>{label}</span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LaunchHome() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [completing, setCompleting] = useState<string | null>(null);
  const [justEarned, setJustEarned] = useState<number | null>(null);
  const [unlockedAchievementCode, setUnlockedAchievementCode] = useState<string | null>(null);

  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, { staleTime: 30_000 });
  const missionsQuery = trpc.launchDailyMissions.getToday.useQuery(undefined, { staleTime: 30_000 });
  const achievementDefsQuery = trpc.launchProgress.getAchievementDefs.useQuery(undefined, { staleTime: 300_000 });
  const utils = trpc.useUtils();

  const completeMission = trpc.launchDailyMissions.completeMission.useMutation({
    onSuccess: (data) => {
      setJustEarned(data.xpEarned);
      setTimeout(() => setJustEarned(null), 3000);
      if (data.newAchievements[0]) setUnlockedAchievementCode(data.newAchievements[0]);
      utils.launchDailyMissions.getToday.invalidate();
      utils.launchProgress.getProgress.invalidate();
      setCompleting(null);
    },
    onError: () => setCompleting(null),
  });

  const progress = progressQuery.data?.progress;
  const missions = (missionsQuery.data?.missions ?? []) as Mission[];
  const completedCount = missions.filter((m) => m.status === "complete").length;
  const allDone = completedCount === missions.length && missions.length > 0;

  const handleComplete = (missionId: string) => {
    setCompleting(missionId);
    completeMission.mutate({ missionId });
  };

  const unlockedAchievement = achievementDefsQuery.data?.find((achievement) => achievement.code === unlockedAchievementCode);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  if (progressQuery.isSuccess && progress && !progress.targetRole) {
    navigate("/launch/onboarding");
    return null;
  }

  const QUICK_ACTIONS = [
    { emoji: "🗺️", label: "Journey Map", href: "/launch/journey", color: "#3B82F6" },
    { emoji: "🎤", label: "Mock Interview", href: "/launch/interview", color: "#8B5CF6" },
    { emoji: "📄", label: "Resume Makeover", href: "/launch/resume", color: "#10B981" },
    { emoji: "💰", label: "Negotiate Salary", href: "/launch/negotiate", color: "#F59E0B" },
    { emoji: "📋", label: "Job Tracker", href: "/launch/applications", color: "#EF4444" },
    { emoji: "⚡", label: "Skill Sprint", href: "/launch/mission/3", color: "#06B6D4" },
  ];

  return (
    <LaunchLayout>
      <div style={{ fontFamily: "Manrope, sans-serif" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Rocket size={16} style={{ color: "#3B82F6" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3B82F6" }}>
                Launch Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.5px" }}>
              {greeting}, {firstName} ⚡
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {progress?.targetRole
                ? `Your path to ${progress.targetRole} — one mission at a time.`
                : "Your career launch starts here."}
            </p>
          </div>
          {/* Streak badge */}
          {progress && progress.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <Flame size={16} style={{ color: "#F59E0B" }} />
              <span className="text-sm font-black" style={{ color: "#F59E0B" }}>{progress.currentStreak}</span>
              <span className="text-[10px] font-semibold" style={{ color: "rgba(245,158,11,0.7)" }}>day streak</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Daily Missions */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* XP earned toast */}
            {justEarned && (
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold text-sm"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
                <Zap size={16} />
                +{justEarned} XP earned! Keep going 🔥
              </div>
            )}

            {/* All done banner */}
            {allDone && (
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2 font-semibold text-sm"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
                <Trophy size={16} />
                All missions complete! You crushed it today 🎉
              </div>
            )}

            {/* Mission panel */}
            <div className="rounded-3xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(59,130,246,0.2)" }}>
                    <Sparkles size={14} style={{ color: "#3B82F6" }} />
                  </div>
                  <h2 className="font-bold text-base text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    Today's Missions
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)" }}>
                    {completedCount}/{missions.length}
                  </span>
                  <button onClick={() => utils.launchDailyMissions.getToday.invalidate()}
                    className="p-1.5 rounded-xl transition-all duration-150"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {missionsQuery.isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl animate-pulse"
                      style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-sm text-white font-semibold mb-1">Generating your missions…</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Check back in a moment.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {missions.map((m) => (
                    <MissionCard key={m.id} mission={m} onComplete={handleComplete} completing={completing === m.id} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-3xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <h3 className="font-bold text-sm text-white mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Quick Launch
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <ActionTile key={a.href} {...a} onClick={() => navigate(a.href)} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Progress Panel */}
          <div className="flex flex-col gap-4">
            {/* Level Ring */}
            {progress && (
              <div className="rounded-3xl p-5 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
                <LevelRing level={progress.currentLevel} xp={progress.totalXp} />
              </div>
            )}

            {/* Target Role */}
            {progress?.targetRole && (
              <div className="rounded-3xl p-4"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={12} style={{ color: "#3B82F6" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#3B82F6" }}>Target</span>
                </div>
                <p className="text-sm font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {progress.targetRole}
                </p>
                {progress.targetIndustry && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{progress.targetIndustry}</p>
                )}
              </div>
            )}

            {/* Journey CTA */}
            <button onClick={() => navigate("/launch/journey")}
              className="rounded-3xl p-4 flex items-center justify-between transition-all duration-200 w-full"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                border: "1px solid rgba(59,130,246,0.25)",
              }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                  <Map size={16} style={{ color: "#fff" }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Journey Map</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>7 missions to launch</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
            </button>

            {/* Achievements teaser */}
            {progressQuery.data?.achievements && progressQuery.data.achievements.length > 0 && (
              <div className="rounded-3xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={12} style={{ color: "#F59E0B" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#F59E0B" }}>Achievements</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {progressQuery.data.achievements.slice(0, 4).map((a) => (
                    <span key={a.id} className="text-lg" title={a.achievementCode}>🏅</span>
                  ))}
                  {progressQuery.data.achievements.length > 4 && (
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
                      +{progressQuery.data.achievements.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <AchievementUnlockedModal
        achievement={unlockedAchievement ? {
          id: String(unlockedAchievement.id),
          title: unlockedAchievement.name,
          description: unlockedAchievement.description ?? "You are building real career momentum.",
          icon: unlockedAchievement.icon ?? "🏅",
          xp: unlockedAchievement.xpBonus,
        } : null}
        onClose={() => setUnlockedAchievementCode(null)}
      />
    </LaunchLayout>
  );
}
