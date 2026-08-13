import { describe, expect, it } from "vitest";
import { decideGuidedMirrorReminder, isLocalReminderTime, resolveRequestOrigin } from "./guidedMirrorReminderHelpers";

describe("Guided Mirror reminder delivery", () => {
  const now = new Date("2026-08-14T08:00:00.000Z");
  it("uses the trusted forwarded request origin rather than a hardcoded deployment link", () => {
    expect(resolveRequestOrigin({ protocol: "http", headers: { "x-forwarded-proto": "https", "x-forwarded-host": "app.example.com" } })).toBe("https://app.example.com");
  });
  it("sends only enabled reminders when no recent reminder or reflection exists", () => {
    expect(decideGuidedMirrorReminder({ enabled: false, now })).toEqual({ shouldSend: false, reason: "disabled" });
    expect(decideGuidedMirrorReminder({ enabled: true, lastReminderAt: new Date("2026-08-12T08:00:00.000Z"), now })).toEqual({ shouldSend: false, reason: "recently_sent" });
    expect(decideGuidedMirrorReminder({ enabled: true, latestMirrorAt: new Date("2026-08-12T08:00:00.000Z"), now })).toEqual({ shouldSend: false, reason: "recent_reflection" });
    expect(decideGuidedMirrorReminder({ enabled: true, latestMirrorAt: new Date("2026-08-01T08:00:00.000Z"), now })).toEqual({ shouldSend: true });
  });
  it("matches the user-selected weekday and hour in their own IANA timezone", () => {
    const localMondayNine = new Date("2026-08-17T03:30:00.000Z");
    expect(isLocalReminderTime({ now: localMondayNine, timeZone: "Asia/Kolkata", localDayOfWeek: 1, localHour: 9 })).toBe(true);
    expect(isLocalReminderTime({ now: localMondayNine, timeZone: "Asia/Kolkata", localDayOfWeek: 1, localHour: 10 })).toBe(false);
    expect(isLocalReminderTime({ now: localMondayNine, timeZone: "Invalid/Zone", localDayOfWeek: 1, localHour: 9 })).toBe(false);
  });
});
