import { AlertCircle, Award, CheckCircle2, Clock3, Loader2, Sparkles, Zap } from "lucide-react";
import React from "react";
import LaunchDarkLayout from "@/components/LaunchDarkLayout";
import { trpc } from "@/lib/trpc";

const EVENT_STYLES = {
  mission: { color: "var(--ld-cyan)", label: "Mission", Icon: CheckCircle2 },
  achievement: { color: "var(--ld-pink)", label: "Achievement", Icon: Award },
  xp: { color: "var(--ld-orange)", label: "XP moment", Icon: Zap },
} as const;

function displayDate(date: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const localDate = date.toDateString();
  if (localDate === today.toDateString()) return "Today";
  if (localDate === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function LaunchMissionHistory() {
  const historyQuery = trpc.launchMissionHistory.getHistory.useQuery({ limit: 50 }, { refetchOnWindowFocus: false });
  const data = historyQuery.data;
  const events = data?.events ?? [];
  const groups = events.reduce<Array<{ label: string; events: typeof events }>>((all, event) => {
    const label = displayDate(new Date(event.occurredAt));
    const previous = all.at(-1);
    if (previous?.label === label) previous.events.push(event);
    else all.push({ label, events: [event] });
    return all;
  }, []);

  return (
    <LaunchDarkLayout>
      <header className="mb-6 ld-slide-up">
        <p className="ld-eyebrow">Your momentum archive</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--ld-font-heading)" }}>Mission History</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ld-text-muted)" }}>Every completed move, XP moment, and unlocked achievement in one place.</p>
          </div>
          <span className="ld-status-pill"><Clock3 size={13} aria-hidden="true" /> Personal view</span>
        </div>
      </header>

      {historyQuery.isLoading && (
        <section className="ld-card flex flex-col items-center gap-3 p-10 text-center" aria-live="polite">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--ld-cyan)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Loading your momentum archive…</p>
        </section>
      )}

      {historyQuery.error && (
        <section className="ld-card flex flex-col items-center gap-3 p-10 text-center" role="alert">
          <AlertCircle size={24} style={{ color: "var(--ld-danger)" }} />
          <p className="text-sm" style={{ color: "var(--ld-text-muted)" }}>Your mission history could not load right now.</p>
          <button type="button" onClick={() => historyQuery.refetch()} className="ld-btn-ghost text-xs">Try again</button>
        </section>
      )}

      {!historyQuery.isLoading && !historyQuery.error && (
        <>
          <section className="mb-6 grid grid-cols-3 gap-3 ld-slide-up ld-stagger-1" aria-label="History summary">
            {[
              { label: "Missions", value: data?.missionCount ?? 0, color: "var(--ld-cyan)", Icon: CheckCircle2 },
              { label: "Achievements", value: data?.achievementCount ?? 0, color: "var(--ld-pink)", Icon: Award },
              { label: "XP earned", value: data?.xpAwarded ?? 0, color: "var(--ld-orange)", Icon: Zap },
            ].map(({ label, value, color, Icon }) => (
              <article key={label} className="ld-card p-3 sm:p-4" style={{ borderColor: `${color}3d` }}>
                <Icon size={15} style={{ color }} aria-hidden="true" />
                <p className="mt-2 text-xl font-bold sm:text-2xl" style={{ color, fontFamily: "var(--ld-font-heading)" }}>{value.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--ld-text-muted)" }}>{label}</p>
              </article>
            ))}
          </section>

          {groups.length === 0 ? (
            <section className="ld-card p-10 text-center" style={{ border: "1px dashed var(--ld-border)" }}>
              <Sparkles size={28} className="mx-auto mb-3" style={{ color: "var(--ld-cyan)" }} />
              <h2 className="font-semibold" style={{ fontFamily: "var(--ld-font-heading)" }}>Your timeline starts with one move</h2>
              <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--ld-text-muted)" }}>Complete a daily mission and your XP moments and achievements will appear here.</p>
              <a href="/launch/home" className="ld-btn-primary mt-5 inline-flex text-sm">Start a mission</a>
            </section>
          ) : (
            <section className="ld-card p-4 sm:p-6 ld-slide-up ld-stagger-2" aria-label="Mission history timeline">
              {groups.map((group, groupIndex) => (
                <div key={group.label} className={groupIndex === groups.length - 1 ? "" : "mb-7"}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--ld-text-dim)", fontFamily: "var(--ld-font-heading)" }}>{group.label}</p>
                  <div className="space-y-3">
                    {group.events.map((event) => {
                      const style = EVENT_STYLES[event.kind];
                      const Icon = style.Icon;
                      return (
                        <article key={event.id} className="relative flex gap-3 rounded-xl p-3 sm:p-4" style={{ background: "var(--ld-surface)", border: "1px solid var(--ld-border)" }}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color: style.color, background: `${style.color}18`, border: `1px solid ${style.color}3d` }}>
                            {event.kind === "mission" ? <Icon size={17} aria-hidden="true" /> : <span className="text-lg leading-none" aria-hidden="true">{event.icon}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <h2 className="truncate text-sm font-semibold">{event.title}</h2>
                              {event.xp > 0 && <span className="text-xs font-bold" style={{ color: style.color, fontFamily: "var(--ld-font-heading)" }}>+{event.xp} XP</span>}
                            </div>
                            <p className="mt-0.5 text-xs" style={{ color: "var(--ld-text-muted)" }}>{event.detail}</p>
                            <span className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-wide" style={{ color: style.color }}>{style.label} · {new Date(event.occurredAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </LaunchDarkLayout>
  );
}
