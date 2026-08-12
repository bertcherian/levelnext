import { AlertCircle, Check, Loader2, LockKeyhole, Swords, Trophy, UsersRound, Zap } from "lucide-react";
import React from "react";
import LaunchDarkLayout from "@/components/LaunchDarkLayout";
import { trpc } from "@/lib/trpc";

export default function LaunchWeeklyChallenges() {
  const utils = trpc.useUtils();
  const challengeQuery = trpc.launchWeeklyChallenges.getCurrentChallenge.useQuery(undefined, { refetchOnWindowFocus: false });
  const leaderboardQuery = trpc.launchWeeklyChallenges.getLeaderboard.useQuery({ limit: 10 }, { refetchOnWindowFocus: false });
  const enrollMutation = trpc.launchWeeklyChallenges.enroll.useMutation({
    onSuccess: () => {
      utils.launchWeeklyChallenges.getCurrentChallenge.invalidate();
      utils.launchWeeklyChallenges.getMyProgress.invalidate();
      utils.launchWeeklyChallenges.getLeaderboard.invalidate();
    },
  });

  const state = challengeQuery.data;
  const challenge = state?.challenge;
  const enrollment = state?.enrollment;
  const progressPct = enrollment?.progressPct ?? 0;
  const entries = leaderboardQuery.data?.entries ?? [];

  return (
    <LaunchDarkLayout>
      <header className="mb-6 ld-slide-up">
        <p className="ld-eyebrow">Optional peer quest</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>Weekly Challenges</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ld-text-muted)" }}>Join if you want a shared push. Your identity stays private.</p>
          </div>
          <span className="ld-status-pill"><LockKeyhole size={13} aria-hidden="true" /> Opt-in only</span>
        </div>
      </header>

      {challengeQuery.isLoading && (
        <section className="ld-card flex flex-col items-center gap-3 p-10 text-center" aria-live="polite">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--ld-cyan)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Finding this week’s challenge…</p>
        </section>
      )}

      {challengeQuery.error && (
        <section className="ld-card flex flex-col items-center gap-3 p-10 text-center" role="alert">
          <AlertCircle size={24} style={{ color: "var(--ld-danger)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>This week’s challenge is unavailable right now.</p>
          <button type="button" onClick={() => challengeQuery.refetch()} className="ld-btn-ghost text-xs">Try again</button>
        </section>
      )}

      {!challengeQuery.isLoading && !challengeQuery.error && challenge && (
        <>
          <section className="ld-card ld-card-glow-cyan mb-6 overflow-hidden p-5 sm:p-6 ld-slide-up ld-stagger-1" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(167,139,250,0.08) 55%, rgba(10,15,30,0.4))" }}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--ld-cyan-soft)", color: "var(--ld-cyan)", border: "1px solid rgba(34,211,238,0.3)" }}><Swords size={18} aria-hidden="true" /></span><span className="ld-badge ld-badge-cyan">{challenge.weekKey}</span></div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>{challenge.title}</h2>
                {challenge.isPersonalized && <p className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(167,139,250,0.14)", color: "var(--ld-purple)", border: "1px solid rgba(167,139,250,0.32)" }}>Rotated for your {challenge.focusLabel} goal</p>}
                <p className="mt-2 text-sm" style={{ color: "var(--ld-text-muted)" }}>{challenge.description}</p>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(10,15,30,0.48)", border: "1px solid rgba(34,211,238,0.2)" }}>
                <p className="text-2xl font-bold" style={{ color: "var(--ld-orange)", fontFamily: "var(--ld-font-heading)" }}>+{challenge.xpBonus}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ld-text-dim)" }}>bonus XP</p>
              </div>
            </div>

            {enrollment ? (
              <div className="mt-6 rounded-2xl p-4" style={{ background: "rgba(10,15,30,0.38)", border: "1px solid var(--ld-border)" }}>
                <div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-semibold">Your progress</span><span className="text-sm font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{enrollment.progress}/{challenge.goalTarget}</span></div>
                <div className="ld-progress-track" style={{ height: 8 }}><div className={`ld-progress-fill ${enrollment.progress > 0 ? "ld-progress-pulse" : ""}`} style={{ width: `${progressPct}%` }} /></div>
                {enrollment.status === "completed" ? <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--ld-green)" }}><Check size={14} aria-hidden="true" /> Challenge completed — bonus secured.</p> : <p className="mt-3 text-xs" style={{ color: "var(--ld-text-muted)" }}>Complete daily missions to move your challenge forward.</p>}
              </div>
            ) : (
              <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--ld-border)" }}>
                <p className="max-w-md text-xs leading-relaxed" style={{ color: "var(--ld-text-muted)" }}>This challenge adapts privately to your goal. Joining shares only your progress on an anonymised board; your name, email, and career goal are never shown.</p>
                <button type="button" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} className="ld-btn-primary shrink-0 text-sm disabled:cursor-wait disabled:opacity-60"><Swords size={15} aria-hidden="true" />{enrollMutation.isPending ? "Joining…" : "Join challenge"}</button>
              </div>
            )}
            {enrollMutation.error && <p className="mt-3 text-xs" role="alert" style={{ color: "var(--ld-danger)" }}>We could not join you just now. Please try again.</p>}
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 ld-slide-up ld-stagger-2" aria-label="Weekly challenge context">
            <article className="ld-card p-4"><UsersRound size={16} style={{ color: "var(--ld-cyan)" }} aria-hidden="true" /><p className="mt-2 text-2xl font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{leaderboardQuery.data?.participantCount ?? 0}</p><p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>opted-in challengers</p></article>
            <article className="ld-card p-4"><Trophy size={16} style={{ color: "var(--ld-orange)" }} aria-hidden="true" /><p className="mt-2 text-2xl font-bold" style={{ color: "var(--ld-orange)", fontFamily: "var(--ld-font-heading)" }}>{leaderboardQuery.data?.completedCount ?? 0}</p><p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>challenge completions</p></article>
            <article className="ld-card p-4"><Zap size={16} style={{ color: "var(--ld-pink)" }} aria-hidden="true" /><p className="mt-2 text-2xl font-bold" style={{ color: "var(--ld-pink)", fontFamily: "var(--ld-font-heading)" }}>{challenge.goalTarget}</p><p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>missions to finish</p></article>
          </section>

          <section className="ld-card p-4 sm:p-5 ld-slide-up ld-stagger-3" aria-label="Anonymous challenge leaderboard">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold" style={{ fontFamily: "var(--ld-font-heading)" }}>Challenge board</h2><p className="mt-1 text-xs" style={{ color: "var(--ld-text-muted)" }}>Everyone is anonymised. You can opt out simply by skipping next week’s quest.</p></div><LockKeyhole size={16} style={{ color: "var(--ld-cyan)" }} aria-hidden="true" /></div>
            {leaderboardQuery.isLoading ? <div className="flex items-center gap-2 py-4 text-sm" style={{ color: "var(--ld-text-muted)" }}><Loader2 size={15} className="animate-spin" /> Loading the board…</div> : leaderboardQuery.error ? <div className="flex items-center justify-between gap-3 py-3 text-sm" role="alert" style={{ color: "var(--ld-text-muted)" }}><span>Board unavailable.</span><button type="button" className="ld-btn-ghost text-xs" onClick={() => leaderboardQuery.refetch()}>Retry</button></div> : entries.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ color: "var(--ld-text-muted)", borderColor: "var(--ld-border)" }}>The board is waiting for its first opt-in challenger.</div> : <div className="space-y-2">{entries.map((entry) => <article key={`${entry.rank}-${entry.label}`} className="flex items-center gap-3 rounded-xl p-3" style={{ background: entry.isCurrentUser ? "var(--ld-cyan-soft)" : "var(--ld-surface)", border: `1px solid ${entry.isCurrentUser ? "rgba(34,211,238,0.32)" : "var(--ld-border)"}` }}><span className="w-6 text-center text-sm font-bold" style={{ color: "var(--ld-text-dim)", fontFamily: "var(--ld-font-heading)" }}>#{entry.rank}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.label}{entry.isCurrentUser && <span className="ml-2 text-[10px] font-bold" style={{ color: "var(--ld-cyan)" }}>YOU</span>}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(148,163,184,0.15)" }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (entry.progress / entry.target) * 100)}%`, background: "var(--ld-gradient-level)" }} /></div></div><span className="text-xs font-bold" style={{ color: "var(--ld-cyan)", fontFamily: "var(--ld-font-heading)" }}>{entry.progress}/{entry.target}</span></article>)}</div>}
          </section>
        </>
      )}
    </LaunchDarkLayout>
  );
}
