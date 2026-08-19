export type NudgeCadence = "weekly" | "fortnightly" | "monthly";
export type NudgeAudience = "employees" | "managers";

const DAY_MS = 24 * 60 * 60 * 1000;

export function cadenceIntervalDays(cadence: NudgeCadence) {
  return cadence === "weekly" ? 7 : cadence === "fortnightly" ? 14 : 28;
}

export function cadenceWindowKey({ cadence, anchorAt, scheduledAt }: { cadence: NudgeCadence; anchorAt: Date; scheduledAt: Date }) {
  const intervalMs = cadenceIntervalDays(cadence) * DAY_MS;
  const elapsed = Math.max(0, scheduledAt.getTime() - anchorAt.getTime());
  return `v1:${Math.floor(elapsed / intervalMs)}`;
}

export function nextScheduledAnchor({ now, dayOfWeek, hourUtc }: { now: Date; dayOfWeek: number; hourUtc: number }) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0, 0));
  const daysUntil = (dayOfWeek - now.getUTCDay() + 7) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntil);
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

export function nudgeMessage(audience: NudgeAudience) {
  if (audience === "managers") {
    return {
      title: "Early Career manager check-in",
      body: "Set aside a short check-in that clarifies priorities, removes one obstacle, and confirms a useful next step. Private employee reflections and coaching remain private.",
    };
  }
  return {
    title: "Your Early Career next move",
    body: "Choose one small workplace action this week: clarify a priority, ask for feedback, or capture evidence of progress. This is a private development nudge, not a performance rating.",
  };
}
