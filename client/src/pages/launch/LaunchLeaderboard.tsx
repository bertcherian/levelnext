/**
 * LaunchLeaderboard — Dark Mode leaderboard page for Launch Intelligence
 * Shows anonymous peer rankings by XP, trending missions, and peer insights.
 * Uses the launchProgress data to build a simulated leaderboard from existing user XP data.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import LaunchDarkLayout from "@/components/LaunchDarkLayout";
import { Trophy, TrendingUp, Flame, Zap, Medal, Loader2, AlertCircle } from "lucide-react";

type Timeframe = "week" | "month" | "all";

export default function LaunchLeaderboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const progressQuery = trpc.launchProgress.getProgress.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const progressData = progressQuery.data;
  const isProgressLoading = progressQuery.isLoading;
  const progressError = progressQuery.error;

  const userXp = progressData?.progress?.totalXp ?? 0;
  const userLevel = progressData?.progress?.currentLevel ?? "Explorer";
  const userStreak = progressData?.progress?.currentStreak ?? 0;

  // Build a simulated leaderboard from the user's XP context
  // In production this would come from a leaderboard_snapshots table
  const leaderboard = useMemo(() => {
    const peers = [
      { rank: 1, name: "Alex K.", xp: 2450, level: "Champion", streak: 12, avatar: "🔥" },
      { rank: 2, name: "Priya S.", xp: 2100, level: "Champion", streak: 8, avatar: "⚡" },
      { rank: 3, name: "Jordan M.", xp: 1850, level: "Achiever", streak: 15, avatar: "🎯" },
      { rank: 4, name: "Sneha R.", xp: 1600, level: "Achiever", streak: 5, avatar: "✨" },
      { rank: 5, name: "Chris T.", xp: 1450, level: "Achiever", streak: 3, avatar: "🚀" },
      { rank: 6, name: "Maya P.", xp: 1200, level: "Professional", streak: 7, avatar: "🌟" },
      { rank: 7, name: "Ravi D.", xp: 950, level: "Professional", streak: 2, avatar: "💼" },
      { rank: 8, name: "Emma L.", xp: 720, level: "Builder", streak: 4, avatar: "🎮" },
      { rank: 9, name: "Karthik V.", xp: 580, level: "Builder", streak: 1, avatar: "💡" },
      { rank: 10, name: "Sara H.", xp: 420, level: "Builder", streak: 6, avatar: "🦄" },
    ];

    // Insert the current user into the leaderboard
    const userEntry = { rank: 0, name: "You", xp: userXp, level: userLevel, streak: userStreak, avatar: "🚀" };
    const allEntries = [...peers, userEntry].sort((a, b) => b.xp - a.xp);
    allEntries.forEach((entry, i) => { entry.rank = i + 1; });

    return allEntries;
  }, [userXp, userLevel, userStreak]);

  const trendingMissions = [
    { title: "Interview Intelligence", count: 142, color: "#22D3EE", icon: "🎤" },
    { title: "Negotiation Simulator", count: 98, color: "#F472B6", icon: "⚖️" },
    { title: "Resume Makeover", count: 87, color: "#FB923C", icon: "📄" },
    { title: "Career Compass", count: 76, color: "#A78BFA", icon: "🧭" },
    { title: "Story Builder", count: 64, color: "#4ADE80", icon: "✍️" },
  ];

  const userRank = leaderboard.find((e) => e.name === "You")?.rank ?? 0;
  const topThree = leaderboard.slice(0, 3);
  const restEntries = leaderboard.slice(3, 20);

  const medalColors = ["#FCD34D", "#D1D5DB", "#FB923C"];

  return (
    <LaunchDarkLayout>
      <h1 className="text-2xl font-bold mb-2 ld-slide-up" style={{ fontFamily: "var(--ld-font-heading)" }}>Leaderboard</h1>
      <p className="text-sm mb-6 ld-slide-up ld-stagger-1" style={{ color: "var(--ld-text-muted)" }}>See how you stack up against other Launch Intelligence users</p>

      {/* Loading state */}
      {isProgressLoading && (
        <div className="ld-card p-8 flex flex-col items-center justify-center gap-3 mb-6">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--ld-cyan)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Loading leaderboard...</p>
        </div>
      )}

      {/* Error state */}
      {progressError && (
        <div className="ld-card p-8 flex flex-col items-center justify-center gap-3 mb-6">
          <AlertCircle size={24} style={{ color: "#FF6B6B" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Failed to load leaderboard data.</p>
          <button onClick={() => progressQuery.refetch()} className="ld-btn-ghost text-xs">Try again</button>
        </div>
      )}

      {/* Timeframe selector */}
      <div className="flex gap-2 mb-6 ld-slide-up ld-stagger-2">
        {([
          { id: "week", label: "This Week" },
          { id: "month", label: "This Month" },
          { id: "all", label: "All Time" },
        ] as { id: Timeframe; label: string }[]).map((tf) => (
          <button
            key={tf.id}
            onClick={() => setTimeframe(tf.id)}
            style={{
              padding: "6px 16px", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "var(--ld-font-heading)",
              background: timeframe === tf.id ? "var(--ld-cyan-soft)" : "var(--ld-surface)",
              color: timeframe === tf.id ? "var(--ld-cyan)" : "var(--ld-text-muted)",
              border: `1px solid ${timeframe === tf.id ? "rgba(34,211,238,0.25)" : "var(--ld-border)"}`,
              transition: "all 200ms var(--ld-ease-out)",
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Your rank highlight */}
      <div className="ld-card ld-card-glow-cyan p-4 mb-6 ld-slide-up ld-stagger-3" style={{
        background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.03))",
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--ld-cyan-soft)", border: "1px solid rgba(34,211,238,0.25)",
              fontSize: 22,
            }}>
            🚀
            </div>
            <div>
              <div className="text-sm font-semibold">Your Rank</div>
              <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{userLevel} · {userXp} XP · {userStreak} day streak</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>#{userRank}</div>
            <div className="text-xs" style={{ color: "var(--ld-text-dim)" }}>of {leaderboard.length} users</div>
          </div>
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {topThree.map((entry, i) => (
          <div
            key={entry.name}
            className={`ld-card p-4 text-center ld-slide-up ld-stagger-${i + 1}`}
            style={{
              background: `linear-gradient(135deg, ${medalColors[i]}15, ${medalColors[i]}05)`,
              border: `1px solid ${medalColors[i]}44`,
              transform: i === 0 ? "scale(1.05)" : "scale(1)",
            }}
          >
            <div className="text-3xl mb-2">{entry.avatar}</div>
            <Medal size={20} style={{ color: medalColors[i], margin: "0 auto 4px" }} />
            <div className="text-sm font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>{entry.name}</div>
            <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{entry.level}</div>
            <div className="text-lg font-bold mt-1" style={{ color: medalColors[i], fontFamily: "var(--ld-font-heading)" }}>{entry.xp.toLocaleString()} XP</div>
            {entry.streak > 0 && (
              <div className="text-xs mt-1" style={{ color: "var(--ld-orange)" }}>🔥 {entry.streak}d</div>
            )}
          </div>
        ))}
      </div>

      {/* Full leaderboard */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-4">
        <h2 className="font-semibold text-base mb-3" style={{ fontFamily: "var(--ld-font-heading)" }}>Full Rankings</h2>
        <div className="space-y-1">
          {restEntries.map((entry, i) => {
            const isYou = entry.name === "You";
            return (
              <div
                key={`${entry.name}-${i}`}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: isYou ? "var(--ld-cyan-soft)" : "var(--ld-surface)",
                  border: isYou ? "1px solid rgba(34,211,238,0.3)" : "1px solid var(--ld-border)",
                }}
              >
                <span className="text-sm font-bold w-8 text-center" style={{ color: "var(--ld-text-dim)", fontFamily: "var(--ld-font-heading)" }}>{entry.rank}</span>
                <span className="text-xl">{entry.avatar}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold">{entry.name}</span>
                  {isYou && <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "var(--ld-cyan-soft)", color: "var(--ld-cyan)" }}>You</span>}
                </div>
                <span className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{entry.level}</span>
                <span className="text-sm font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{entry.xp.toLocaleString()} XP</span>
                {entry.streak > 0 && (
                  <span className="text-xs" style={{ color: "var(--ld-orange)" }}>🔥 {entry.streak}d</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending missions */}
      <div className="ld-card p-5 mb-6 ld-slide-up ld-stagger-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} style={{ color: "var(--ld-cyan)" }} />
          <h2 className="font-semibold text-base" style={{ fontFamily: "var(--ld-font-heading)" }}>Trending This Week</h2>
        </div>
        <div className="space-y-2">
          {trendingMissions.map((mission, i) => (
            <div
              key={mission.title}
              className="flex items-center gap-3 p-3 rounded-xl ld-slide-up"
              style={{
                background: `${mission.color}0D`,
                border: `1px solid ${mission.color}33`,
                animationDelay: `${i * 40}ms`,
              }}
            >
              <span className="text-xl">{mission.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{mission.title}</div>
                <div className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{mission.count} users this week</div>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={12} style={{ color: mission.color }} />
                <span className="text-xs font-bold" style={{ color: mission.color }}>+{Math.round(mission.count * 0.75)} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak leaders */}
      <div className="ld-card p-5 ld-slide-up ld-stagger-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} style={{ color: "var(--ld-orange)" }} />
          <h2 className="font-semibold text-base" style={{ fontFamily: "var(--ld-font-heading)" }}>Streak Leaders</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {leaderboard
            .filter((e) => e.streak > 0)
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 6)
            .map((entry, i) => (
              <div key={`streak-${entry.name}`} className="ld-card p-3 text-center" style={{
                background: "rgba(251,146,60,0.08)",
                border: "1px solid rgba(251,146,60,0.2)",
              }}>
                <div className="text-xl mb-1">{entry.avatar}</div>
                <div className="text-sm font-semibold">{entry.name}</div>
                <div className="text-lg font-bold" style={{ color: "var(--ld-orange)", fontFamily: "var(--ld-font-heading)" }}>🔥 {entry.streak}d</div>
              </div>
            ))}
        </div>
      </div>
    </LaunchDarkLayout>
  );
}
