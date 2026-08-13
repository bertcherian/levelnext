export type ReminderDecision = { shouldSend: boolean; reason?: "disabled" | "recently_sent" | "recent_reflection" };

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function resolveRequestOrigin(req: { protocol?: string; headers: Record<string, string | string[] | undefined> }) {
  const rawHost = req.headers["x-forwarded-host"] ?? req.headers.host;
  const host = Array.isArray(rawHost) ? rawHost[0] : rawHost?.split(",")[0]?.trim();
  const rawProtocol = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(rawProtocol) ? rawProtocol[0] : rawProtocol?.split(",")[0])?.trim() || req.protocol || "https";
  if (!host) throw new Error("Cannot resolve reminder origin without a request host.");
  return `${protocol}://${host}`;
}

export function decideGuidedMirrorReminder({ enabled, lastReminderAt, latestMirrorAt, now = new Date() }: { enabled: boolean; lastReminderAt?: Date | null; latestMirrorAt?: Date | null; now?: Date }): ReminderDecision {
  if (!enabled) return { shouldSend: false, reason: "disabled" };
  const recent = (value?: Date | null) => Boolean(value && value.getTime() > now.getTime() - 6 * 24 * 60 * 60 * 1000);
  if (recent(lastReminderAt)) return { shouldSend: false, reason: "recently_sent" };
  if (recent(latestMirrorAt)) return { shouldSend: false, reason: "recent_reflection" };
  return { shouldSend: true };
}

export function isLocalReminderTime({ now = new Date(), timeZone, localDayOfWeek, localHour }: { now?: Date; timeZone: string; localDayOfWeek: number; localHour: number }) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(now);
    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    return WEEKDAY_INDEX[weekday ?? ""] === localDayOfWeek && hour === localHour;
  } catch {
    return false;
  }
}
