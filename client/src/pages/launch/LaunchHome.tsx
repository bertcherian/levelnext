import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import LaunchLayout from "@/components/LaunchLayout";
import AchievementUnlockedModal from "@/components/AchievementUnlockedModal";
import LaunchXpBurst from "@/components/LaunchXpBurst";
import LaunchMissionReflectionPrompt from "@/components/LaunchMissionReflectionPrompt";
import {
  Banknote, CheckCircle2, ChevronRight, Circle, ClipboardList, FileText,
  Flame, Map, Mic2, RefreshCw, Rocket, Sparkles, Star, Target, ThumbsDown,
  ThumbsUp, Trophy, Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  relevanceRating?: "up" | "down";
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

function MissionCard({ mission, onComplete, onRate, completing, rating }: {
  mission: Mission; onComplete: (id: string) => void; onRate: (id: string, rating: "up" | "down") => void; completing: boolean; rating: boolean;
}) {
  const done = mission.status === "complete";
  const color = AREA_COLORS[mission.missionArea] ?? "#3B82F6";

  return (
    <div
      className={`launch-mission-card rounded-2xl p-4 transition-all duration-200 ${done ? "is-complete" : ""}`}
      style={{
        background: done ? "#E0F9E8" : "#FFFDF8",
        border: "2px solid #151515",
        opacity: 1,
      }}>
      <div className="flex items-start gap-3">
        <button
          aria-label={done ? `${mission.title} completed` : `Complete ${mission.title}`}
          onClick={() => !done && onComplete(mission.id)}
          disabled={done || completing}
          className="launch-mission-card__complete mt-0.5 shrink-0 transition-all duration-150"
          style={{ color: "#151515" }}>
          {done ? <CheckCircle2 size={26} /> : <Circle size={26} />}
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
          <p className="launch-mission-card__title font-semibold text-sm mb-1"
            style={{
              textDecoration: done ? "line-through" : "none",
              fontFamily: "Space Grotesk, sans-serif"
            }}>
            {mission.title}
          </p>
          <p className="launch-mission-card__description text-xs leading-relaxed">
            {mission.description}
          </p>
          <div className="mission-feedback mt-3 flex items-center gap-1.5" aria-label={`Rate relevance of ${mission.title}`}>
            <span className="mission-feedback__label">Relevant?</span>
            <button
              type="button"
              aria-label="This mission is relevant"
              aria-pressed={mission.relevanceRating === "up"}
              disabled={rating}
              onClick={() => onRate(mission.id, "up")}
              className={`mission-feedback__button ${mission.relevanceRating === "up" ? "is-selected" : ""}`}>
              <ThumbsUp size={13} />
            </button>
            <button
              type="button"
              aria-label="This mission is not relevant"
              aria-pressed={mission.relevanceRating === "down"}
              disabled={rating}
              onClick={() => onRate(mission.id, "down")}
              className={`mission-feedback__button ${mission.relevanceRating === "down" ? "is-selected" : ""}`}>
              <ThumbsDown size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionCardSkeleton() {
  return (
    <div className="launch-mission-skeleton" aria-hidden="true">
      <div className="launch-mission-skeleton__icon" />
      <div className="launch-mission-skeleton__copy">
        <span className="launch-mission-skeleton__line launch-mission-skeleton__line--tag" />
        <span className="launch-mission-skeleton__line launch-mission-skeleton__line--title" />
        <span className="launch-mission-skeleton__line" />
        <span className="launch-mission-skeleton__line launch-mission-skeleton__line--short" />
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
function ActionTile({ icon: Icon, label, description, color, onClick }: {
  icon: LucideIcon; label: string; description: string; color: string; onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label}: ${description}`}
          data-testid="quick-launch-tile"
          className="rounded-xl px-3 py-4 flex flex-col items-center gap-3 text-center font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/40"
          style={{
            background: "#A7F3C1",
            border: "2px solid #000000",
            boxShadow: "5px 5px 0 #000000",
            color: "#000000",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#86EFAC";
            e.currentTarget.style.boxShadow = "7px 7px 0 #000000";
            e.currentTarget.style.transform = "translate(-2px, -2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#A7F3C1";
            e.currentTarget.style.boxShadow = "5px 5px 0 #000000";
            e.currentTarget.style.transform = "translate(0, 0)";
          }}>
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#F8F5F0", border: "2px solid #000000", boxShadow: `3px 3px 0 ${color}`, color: "#000000" }}
            aria-hidden="true">
            <Icon size={31} strokeWidth={2.4} />
          </span>
          <span className="text-[13px] leading-tight" style={{ color: "#000000" }}>{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={10} className="max-w-56 border-2 border-black bg-[#FFF8E7] text-center font-semibold text-black shadow-[3px_3px_0_#000000]">
        {description}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LaunchHome() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [completing, setCompleting] = useState<string | null>(null);
  const [justEarned, setJustEarned] = useState<{ total: number; bonusXp: number } | null>(null);
  const [unlockedAchievementCode, setUnlockedAchievementCode] = useState<string | null>(null);
  const [reflectionMission, setReflectionMission] = useState<Mission | null>(null);

  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, { staleTime: 30_000 });
  const missionsQuery = trpc.launchDailyMissions.getToday.useQuery(undefined, { staleTime: 30_000 });
  const achievementDefsQuery = trpc.launchProgress.getAchievementDefs.useQuery(undefined, { staleTime: 300_000 });
  const utils = trpc.useUtils();

  const completeMission = trpc.launchDailyMissions.completeMission.useMutation({
    onSuccess: (data, variables) => {
      setJustEarned({ total: data.xpEarned, bonusXp: data.challengeBonusXp ?? 0 });
      setTimeout(() => setJustEarned(null), 3000);
      if (data.newAchievements[0]) setUnlockedAchievementCode(data.newAchievements[0]);
      const completedMission = missions.find((entry) => entry.id === variables.missionId);
      if (completedMission) setReflectionMission(completedMission);
      utils.launchDailyMissions.getToday.invalidate();
      utils.launchProgress.getProgress.invalidate();
      setCompleting(null);
    },
    onError: () => {
      setCompleting(null);
      setReflectionMission(null);
    },
  });

  const refreshMissions = trpc.launchDailyMissions.refreshToday.useMutation({
    onSuccess: () => utils.launchDailyMissions.getToday.invalidate(),
  });

  const rateMission = trpc.launchDailyMissions.rateMission.useMutation({
    onSuccess: () => utils.launchDailyMissions.getToday.invalidate(),
  });

  const saveReflection = trpc.launchDailyMissions.saveReflection.useMutation({
    onSuccess: () => setReflectionMission(null),
  });

  const progress = progressQuery.data?.progress;
  const missions = (missionsQuery.data?.missions ?? []) as Mission[];
  const completedCount = missions.filter((m) => m.status === "complete").length;
  const allDone = completedCount === missions.length && missions.length > 0;

  const handleComplete = (missionId: string) => {
    setCompleting(missionId);
    completeMission.mutate({ missionId });
  };

  const handleRefresh = () => {
    if (!refreshMissions.isPending) refreshMissions.mutate();
  };

  const handleRate = (missionId: string, rating: "up" | "down") => {
    if (!rateMission.isPending) rateMission.mutate({ missionId, rating });
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
    { icon: Map, label: "Journey Map", description: "View your career-launch mission path.", href: "/launch/journey", color: "#2563EB" },
    { icon: Mic2, label: "Mock Interview", description: "Practise answers with guided interview feedback.", href: "/launch/interview", color: "#7C3AED" },
    { icon: FileText, label: "Resume Makeover", description: "Strengthen your résumé for target roles.", href: "/launch/resume", color: "#059669" },
    { icon: Banknote, label: "Negotiate Salary", description: "Prepare a confident salary conversation.", href: "/launch/negotiate", color: "#D97706" },
    { icon: ClipboardList, label: "Job Tracker", description: "Track every application and its next step.", href: "/launch/applications", color: "#DC2626" },
    { icon: Zap, label: "Skill Sprint", description: "Build job-ready skills through focused sprints.", href: "/launch/mission/3", color: "#0891B2" },
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
              <div className="ld-xp-earned px-4 py-3 rounded-2xl flex flex-wrap items-center gap-2 font-semibold text-sm" role="status" aria-live="polite"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
                <Zap size={16} />
                +{justEarned.total} XP earned! Keep going 🔥
                {justEarned.bonusXp > 0 && <span className="text-xs font-bold" style={{ color: "#4ADE80" }}>Challenge complete · +{justEarned.bonusXp} bonus</span>}
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
            <div className="launch-dashboard-card launch-dashboard-card--missions rounded-3xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="launch-dashboard-card__icon-well"
                    style={{ background: "#FFF3BD" }}>
                    <Sparkles size={20} style={{ color: "#151515" }} />
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
                  <button onClick={handleRefresh}
                    disabled={refreshMissions.isPending || allDone}
                    className="mission-refresh-control px-2.5 py-1.5 transition-all duration-150"
                    title={allDone ? "All missions are complete" : "Refresh pending missions"}>
                    <RefreshCw size={12} className={refreshMissions.isPending ? "animate-spin" : ""} />
                    <span>{refreshMissions.isPending ? "Refreshing" : "Refresh"}</span>
                  </button>
                </div>
              </div>

              {missionsQuery.isLoading || refreshMissions.isPending ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => <MissionCardSkeleton key={i} />)}
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
                    <MissionCard key={m.id} mission={m} onComplete={handleComplete} onRate={handleRate} completing={completing === m.id} rating={rateMission.isPending} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="launch-dashboard-card launch-dashboard-card--quick-launch rounded-2xl p-5"
              style={{ background: "#F8F5F0", border: "2px solid #000000", boxShadow: "8px 8px 0 #000000" }}>
              <h3 className="font-black text-sm mb-4" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#000000" }}>
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
              <div className="launch-dashboard-card launch-dashboard-card--progress rounded-3xl p-5 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
                <LevelRing level={progress.currentLevel} xp={progress.totalXp} />
              </div>
            )}

            {/* Target Role */}
            {progress?.targetRole && (
              <div className="launch-dashboard-card launch-dashboard-card--target rounded-3xl p-4"
                style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="launch-dashboard-card__icon-well launch-dashboard-card__icon-well--small" style={{ background: "#FFF8E7" }}>
                    <Target size={18} style={{ color: "#151515" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#151515" }}>Target</span>
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
              className="launch-dashboard-card launch-dashboard-card--journey rounded-3xl p-4 flex items-center justify-between transition-all duration-200 w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/40"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                border: "1px solid rgba(59,130,246,0.25)",
              }}>
              <div className="flex items-center gap-3">
                <div className="launch-dashboard-card__icon-well launch-dashboard-card__icon-well--journey">
                  <Map size={24} style={{ color: "#151515" }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Journey Map</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>7 missions to launch</p>
                </div>
              </div>
              <ChevronRight size={22} style={{ color: "#151515" }} />
            </button>

            {/* Achievements teaser */}
            {progressQuery.data?.achievements && progressQuery.data.achievements.length > 0 && (
              <div className="launch-dashboard-card launch-dashboard-card--achievements rounded-3xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="launch-dashboard-card__icon-well launch-dashboard-card__icon-well--small" style={{ background: "#FFF3BD" }}>
                    <Star size={18} style={{ color: "#151515" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#151515" }}>Achievements</span>
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
      {justEarned && <LaunchXpBurst earned={justEarned.total} bonusXp={justEarned.bonusXp} />}
      {reflectionMission && (
        <LaunchMissionReflectionPrompt
          missionTitle={reflectionMission.title}
          isSaving={saveReflection.isPending}
          errorMessage={saveReflection.error ? "Your reflection could not be saved. Please try again or skip for now." : undefined}
          onSave={(reflectionText) => saveReflection.mutate({ missionId: reflectionMission.id, reflectionText })}
          onSkip={() => {
            if (!saveReflection.isPending) setReflectionMission(null);
          }}
        />
      )}
    </LaunchLayout>
  );
}
