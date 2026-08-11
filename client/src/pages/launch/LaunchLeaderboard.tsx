/**
 * LaunchLeaderboard — privacy-preserving, live community rankings for Launch Intelligence.
 */
import { useState } from "react";
import { AlertCircle, Flame, Loader2, Medal, Trophy, TrendingUp, Zap } from "lucide-react";
import LaunchDarkLayout from "@/components/LaunchDarkLayout";
import { trpc } from "@/lib/trpc";

type Timeframe = "week" | "month" | "all";

const TIMEFRAMES: Array<{ id: Timeframe; label: string }> = [
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

const MEDAL_COLORS = ["#FCD34D", "#D1D5DB", "#FB923C"];

export default function LaunchLeaderboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const leaderboardQuery = trpc.launchLeaderboard.getLeaderboard.useQuery(
    { timeframe },
    { refetchOnWindowFocus: false },
  );

  const data = leaderboardQuery.data;
  const entries = data?.entries ?? [];
  const currentUser = data?.currentUser;
  const topThree = entries.slice(0, 3);
  const remainingEntries = entries.slice(3, 20);
  const trendingMissions = data?.trendingMissions ?? [];
  const streakLeaders = entries.filter((entry) => entry.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 6);

  return (
    <LaunchDarkLayout>
      <header className="mb-6 ld-slide-up">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ld-eyebrow">Community momentum</p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>Leaderboard</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ld-text-muted)" }}>Track your momentum with anonymised peer rankings.</p>
          </div>
          <div className="ld-status-pill" aria-live="polite">{data?.participantCount ?? 0} active learners</div>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 ld-slide-up ld-stagger-1" aria-label="Leaderboard timeframe">
        {TIMEFRAMES.map((option) => {
          const active = timeframe === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setTimeframe(option.id)}
              className="rounded-lg px-4 py-2 text-xs font-bold transition-transform duration-150 active:scale-[0.97]"
              style={{
                background: active ? "var(--ld-cyan-soft)" : "var(--ld-surface)",
                color: active ? "var(--ld-cyan)" : "var(--ld-text-muted)",
                border: `1px solid ${active ? "rgba(34,211,238,0.32)" : "var(--ld-border)"}`,
                fontFamily: "var(--ld-font-heading)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {leaderboardQuery.isLoading && (
        <section className="ld-card mb-6 flex flex-col items-center gap-3 p-10 text-center" aria-live="polite">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--ld-cyan)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Loading live community momentum…</p>
        </section>
      )}

      {leaderboardQuery.error && (
        <section className="ld-card mb-6 flex flex-col items-center gap-3 p-10 text-center" role="alert">
          <AlertCircle size={24} style={{ color: "var(--ld-danger)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>We could not load the leaderboard just now.</p>
          <button type="button" onClick={() => leaderboardQuery.refetch()} className="ld-btn-ghost text-xs">Try again</button>
        </section>
      )}

      {!leaderboardQuery.isLoading && !leaderboardQuery.error && (
        <>
          <section className="ld-card ld-card-glow-cyan mb-6 p-4 ld-slide-up ld-stagger-2" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.025))" }}>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: "var(--ld-cyan-soft)", border: "1px solid rgba(34,211,238,0.25)" }}>
                  {currentUser?.avatar ?? "🚀"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Your rank</p>
                  <p className="hidden truncate text-xs sm:block" style={{ color: "var(--ld-text-muted)" }}>
                    {currentUser ? `${currentUser.level} · ${currentUser.xp.toLocaleString()} XP · ${currentUser.streak} day streak` : "Earn XP to enter the board"}
                  </p>
                  <p className="text-xs sm:hidden" style={{ color: "var(--ld-text-muted)" }}>
                    {currentUser ? `${currentUser.xp.toLocaleString()} XP · ${currentUser.streak}d streak` : "Earn XP to rank"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-3xl font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{currentUser ? `#${currentUser.rank}` : "—"}</p>
                {currentUser ? (
                  <p className="text-xs" style={{ color: "var(--ld-text-dim)" }}>of {data?.participantCount ?? 0} learners</p>
                ) : (
                  <a
                    href="/launch/home"
                    className="inline-block text-xs font-semibold"
                    style={{ color: "var(--ld-cyan)", whiteSpace: "nowrap" }}
                  >
                    Start mission →
                  </a>
                )}
              </div>
            </div>
          </section>

          {topThree.length === 0 ? (
            <section className="ld-card mb-6 p-10 text-center" style={{ border: "1px dashed var(--ld-border)" }}>
              <Trophy size={26} className="mx-auto mb-3" style={{ color: "var(--ld-cyan)" }} />
              <h2 className="font-semibold" style={{ fontFamily: "var(--ld-font-heading)" }}>The board is ready for its first move</h2>
              <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--ld-text-muted)" }}>Complete a mission to earn XP and appear in the community rankings.</p>
            </section>
          ) : (
            <>
              <section className="mb-6 grid grid-cols-3 gap-3" aria-label="Top three learners">
                {topThree.map((entry, index) => (
                  <article key={entry.userId} className="ld-card p-3 text-center sm:p-4" style={{ background: `linear-gradient(135deg, ${MEDAL_COLORS[index]}15, ${MEDAL_COLORS[index]}05)`, border: `1px solid ${MEDAL_COLORS[index]}44`, transform: index === 0 ? "scale(1.04)" : undefined }}>
                    <p className="mb-1 text-2xl sm:text-3xl">{entry.avatar}</p>
                    <Medal size={18} className="mx-auto mb-1" style={{ color: MEDAL_COLORS[index] }} aria-hidden="true" />
                    <p className="truncate text-xs font-bold sm:text-sm" style={{ fontFamily: "var(--ld-font-heading)" }}>{entry.label}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--ld-text-muted)" }}>{entry.level}</p>
                    <p className="mt-1 text-sm font-bold sm:text-base" style={{ color: MEDAL_COLORS[index], fontFamily: "var(--ld-font-heading)" }}>{entry.xp.toLocaleString()} XP</p>
                    {entry.streak > 0 && <p className="mt-1 text-xs" style={{ color: "var(--ld-orange)" }}>🔥 {entry.streak}d</p>}
                  </article>
                ))}
              </section>

              {remainingEntries.length > 0 && (
                <section className="ld-card mb-6 p-4 sm:p-5">
                  <h2 className="mb-3 text-base font-semibold" style={{ fontFamily: "var(--ld-font-heading)" }}>Full rankings</h2>
                  <div className="space-y-1.5">
                    {remainingEntries.map((entry) => (
                      <article key={entry.userId} className="flex items-center gap-2 rounded-xl p-2.5 sm:gap-3 sm:p-3" style={{ background: entry.isCurrentUser ? "var(--ld-cyan-soft)" : "var(--ld-surface)", border: `1px solid ${entry.isCurrentUser ? "rgba(34,211,238,0.32)" : "var(--ld-border)"}` }}>
                        <span className="w-6 text-center text-xs font-bold sm:w-8 sm:text-sm" style={{ color: "var(--ld-text-dim)", fontFamily: "var(--ld-font-heading)" }}>{entry.rank}</span>
                        <span className="text-lg" aria-hidden="true">{entry.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-sm font-semibold">{entry.label}</span>
                          {entry.isCurrentUser && <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "var(--ld-cyan-soft)", color: "var(--ld-cyan)" }}>YOU</span>}
                        </div>
                        <span className="hidden text-xs md:block" style={{ color: "var(--ld-text-muted)" }}>{entry.level}</span>
                        <span className="text-xs font-bold sm:text-sm" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{entry.xp.toLocaleString()} XP</span>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {trendingMissions.length > 0 && (
            <section className="ld-card mb-6 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2"><TrendingUp size={16} style={{ color: "var(--ld-cyan)" }} /><h2 className="text-base font-semibold" style={{ fontFamily: "var(--ld-font-heading)" }}>Trending this week</h2></div>
              <div className="space-y-2">
                {trendingMissions.map((mission) => (
                  <article key={mission.action} className="flex items-center gap-3 rounded-xl p-3" style={{ background: `${mission.color}0D`, border: `1px solid ${mission.color}33` }}>
                    <span className="text-xl" aria-hidden="true">{mission.icon}</span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{mission.label}</p><p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{mission.participantCount} {mission.participantCount === 1 ? "learner" : "learners"} this week</p></div>
                    <div className="flex shrink-0 items-center gap-1"><Zap size={12} style={{ color: mission.color }} /><span className="text-xs font-bold" style={{ color: mission.color }}>{mission.xpAwarded.toLocaleString()} XP</span></div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {streakLeaders.length > 0 && (
            <section className="ld-card p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2"><Flame size={16} style={{ color: "var(--ld-orange)" }} /><h2 className="text-base font-semibold" style={{ fontFamily: "var(--ld-font-heading)" }}>Streak leaders</h2></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {streakLeaders.map((entry) => (
                  <article key={entry.userId} className="ld-card p-3 text-center" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)" }}>
                    <p className="mb-1 text-xl" aria-hidden="true">{entry.avatar}</p>
                    <p className="truncate text-sm font-semibold">{entry.label}</p>
                    <p className="text-lg font-bold" style={{ color: "var(--ld-orange)", fontFamily: "var(--ld-font-heading)" }}>🔥 {entry.streak}d</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </LaunchDarkLayout>
  );
}
