import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import LaunchLayout from "@/components/LaunchLayout";
import { LaunchQueryErrorState } from "@/components/QueryErrorState";
import {
  Compass,
  Sparkles,
  BookOpen,
  Search,
  Mic2,
  Rocket,
  TrendingUp,
  Lock,
  CheckCircle2,
  Star,
} from "lucide-react";

// ─── Mission Definitions ──────────────────────────────────────────────────────
const MISSIONS = [
  {
    id: 1,
    code: "DISCOVER",
    title: "Career Compass",
    subtitle: "Discover your direction",
    icon: Compass,
    xpReward: 100,
    route: "/launch/mission/1",
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(59,130,246,0.4)",
    description: "A 16-question self-assessment across 4 dimensions — Strengths, Interests, Work Style, and Values — followed by your AI-generated Career Direction Card.",
    unlockXp: 0,
  },
  {
    id: 2,
    code: "BUILD",
    title: "Story Builder",
    subtitle: "Build your professional brand",
    icon: Sparkles,
    xpReward: 150,
    route: "/launch/mission/2",
    color: "#10B981",
    bgColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.4)",
    description: "Craft your Origin Story, Value Proposition, and Elevator Pitch. Walk away with a ready-to-use LinkedIn About section and 30-second pitch.",
    unlockXp: 100,
  },
  {
    id: 3,
    code: "SKILLS",
    title: "Skill Sprint",
    subtitle: "Build your edge",
    icon: BookOpen,
    xpReward: 200,
    route: "/launch/mission/3",
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.15)",
    borderColor: "rgba(245,158,11,0.4)",
    description: "10 bite-sized skill modules across Communication, Productivity, and Professional Presence. Each ends with a practice challenge.",
    unlockXp: 250,
  },
  {
    id: 4,
    code: "APPLY",
    title: "Get Seen",
    subtitle: "Land on the right radars",
    icon: Search,
    xpReward: 200,
    route: "/launch/applications",
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.15)",
    borderColor: "rgba(139,92,246,0.4)",
    description: "Application Tracker, AI Outreach Generator, and Networking Planner. Build your pipeline and get noticed by the right people.",
    unlockXp: 450,
  },
  {
    id: 5,
    code: "INTERVIEW",
    title: "Win Interviews",
    subtitle: "Perform under pressure",
    icon: Mic2,
    xpReward: 250,
    route: "/launch/interview",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.15)",
    borderColor: "rgba(239,68,68,0.4)",
    description: "Mock interviews (HR, Behavioural, Technical, Case), STAR Builder, and Salary Negotiation Simulator. Practice until it's automatic.",
    unlockXp: 650,
  },
  {
    id: 6,
    code: "THRIVE",
    title: "First 90 Days",
    subtitle: "Start strong",
    icon: Rocket,
    xpReward: 150,
    route: "/launch/dashboard",
    color: "#06B6D4",
    bgColor: "rgba(6,182,212,0.15)",
    borderColor: "rgba(6,182,212,0.4)",
    description: "A personalised First 90 Days Roadmap for your new role. Week-by-week actions to build credibility, relationships, and early wins.",
    unlockXp: 900,
  },
  {
    id: 7,
    code: "GROW",
    title: "Career Roadmap",
    subtitle: "Own your trajectory",
    icon: TrendingUp,
    xpReward: 200,
    route: "/launch/journey",
    color: "#D4AF37",
    bgColor: "rgba(212,175,55,0.15)",
    borderColor: "rgba(212,175,55,0.4)",
    description: "A 3-year career roadmap with milestones, skill targets, and a personal board of advisors. Your career is a project — manage it like one.",
    unlockXp: 1050,
  },
];

// ─── Level Thresholds ─────────────────────────────────────────────────────────
function getLevel(xp: number): string {
  if (xp >= 5000) return "Career Starter";
  if (xp >= 3500) return "Offer Winner";
  if (xp >= 2000) return "Interview Pro";
  if (xp >= 1200) return "Candidate";
  if (xp >= 700) return "Professional";
  if (xp >= 300) return "Builder";
  return "Explorer";
}

export default function LaunchJourneyMap() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, { enabled: Boolean(user) });
  const compassQuery = trpc.launchCareerCompass.getDirectionCard.useQuery(undefined, { enabled: Boolean(user) });
  const progress = progressQuery.data;
  const compassData = compassQuery.data;

  const totalXp = progress?.progress?.totalXp ?? 0;

  // Determine mission status
  const getMissionStatus = (mission: typeof MISSIONS[0]) => {
    if (totalXp < mission.unlockXp) return "locked";
    // Check specific completions
    if (mission.id === 1 && compassData?.status === "completed") return "completed";
    return "available";
  };

  const [selectedMission, setSelectedMission] = React.useState<typeof MISSIONS[0] | null>(null);

  if (progressQuery.isError || compassQuery.isError) {
    return (
      <LaunchLayout>
        <LaunchQueryErrorState onRetry={() => {
          void progressQuery.refetch();
          void compassQuery.refetch();
        }} />
      </LaunchLayout>
    );
  }

  return (
    <LaunchLayout>
      {/* Header */}
      <div className="pb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Your Career Journey
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Manrope, sans-serif" }}>
          7 missions. One career launch.
        </p>

        {/* XP Progress Bar */}
        <div className="mt-4 mx-auto max-w-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "#3B82F6" }}>
              {getLevel(totalXp)}
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {totalXp} XP
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((totalXp / 1200) * 100, 100)}%`,
                background: "linear-gradient(90deg, #3B82F6, #10B981)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Journey Path */}
      <div className="px-4 pb-24 max-w-lg mx-auto">
        {MISSIONS.map((mission, index) => {
          const status = getMissionStatus(mission);
          const Icon = mission.icon;
          const isLocked = status === "locked";
          const isCompleted = status === "completed";
          const isSelected = selectedMission?.id === mission.id;

          return (
            <div key={mission.id} className="relative">
              {/* Connector line */}
              {index < MISSIONS.length - 1 && (
                <div
                  className="absolute left-8 w-0.5 z-0"
                  style={{
                    top: "72px",
                    height: "40px",
                    background: isLocked
                      ? "rgba(255,255,255,0.08)"
                      : `linear-gradient(180deg, ${mission.color}, ${MISSIONS[index + 1].color})`,
                  }}
                />
              )}

              {/* Mission Node */}
              <div className="relative z-10 mb-2">
                <button
                  onClick={() => {
                    if (!isLocked) {
                      setSelectedMission(isSelected ? null : mission);
                    }
                  }}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left",
                    isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                    isSelected ? "scale-[1.02]" : ""
                  )}
                  style={{
                    background: isSelected
                      ? mission.bgColor
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isSelected ? mission.borderColor : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                    style={{
                      background: isLocked ? "rgba(255,255,255,0.06)" : mission.bgColor,
                      border: `2px solid ${isLocked ? "rgba(255,255,255,0.1)" : mission.borderColor}`,
                    }}
                  >
                    {isLocked ? (
                      <Lock size={20} style={{ color: "rgba(255,255,255,0.3)" }} />
                    ) : isCompleted ? (
                      <CheckCircle2 size={24} style={{ color: mission.color }} />
                    ) : (
                      <Icon size={22} style={{ color: mission.color }} />
                    )}
                    {/* Mission number badge */}
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: isLocked ? "rgba(255,255,255,0.1)" : mission.color,
                        color: isLocked ? "rgba(255,255,255,0.3)" : "#fff",
                      }}
                    >
                      {mission.id}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="font-bold text-sm"
                        style={{
                          color: isLocked ? "rgba(255,255,255,0.3)" : "white",
                          fontFamily: "Space Grotesk, sans-serif",
                        }}
                      >
                        {mission.title}
                      </p>
                      {isCompleted && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${mission.color}22`, color: mission.color }}
                        >
                          Done
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: isLocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {mission.subtitle}
                    </p>
                    {!isLocked && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star size={10} style={{ color: mission.color }} />
                        <span className="text-[10px]" style={{ color: mission.color }}>
                          +{mission.xpReward} XP
                        </span>
                      </div>
                    )}
                    {isLocked && (
                      <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                        Unlocks at {mission.unlockXp} XP
                      </p>
                    )}
                  </div>

                  {/* Chevron for available missions */}
                  {!isLocked && !isCompleted && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: mission.bgColor }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 3L9 7L5 11" stroke={mission.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Expanded description */}
                {isSelected && !isLocked && (
                  <div
                    className="mx-2 px-4 py-3 rounded-b-2xl -mt-2"
                    style={{
                      background: mission.bgColor,
                      border: `1px solid ${mission.borderColor}`,
                      borderTop: "none",
                    }}
                  >
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "Manrope, sans-serif" }}>
                      {mission.description}
                    </p>
                    <button
                      onClick={() => navigate(mission.route)}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
                      style={{
                        background: mission.color,
                        color: "#fff",
                        fontFamily: "Space Grotesk, sans-serif",
                      }}
                    >
                      {isCompleted ? "Review Results" : "Start Mission"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </LaunchLayout>
  );
}

// Need React import for useState
import React from "react";
