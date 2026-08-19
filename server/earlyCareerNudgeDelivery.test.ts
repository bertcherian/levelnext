import { describe, expect, it } from "vitest";
import { cadenceIntervalDays, cadenceWindowKey, nextScheduledAnchor, nudgeMessage } from "./earlyCareerNudgeDelivery";

describe("Early Career nudge delivery policy", () => {
  it("maps each supported cadence to the intended interval", () => {
    expect(cadenceIntervalDays("weekly")).toBe(7);
    expect(cadenceIntervalDays("fortnightly")).toBe(14);
    expect(cadenceIntervalDays("monthly")).toBe(28);
  });

  it("uses stable cadence windows for retries and advances only after a full interval", () => {
    const anchorAt = new Date("2026-08-17T08:00:00.000Z");
    expect(cadenceWindowKey({ cadence: "fortnightly", anchorAt, scheduledAt: new Date("2026-08-17T08:00:00.000Z") })).toBe("v1:0");
    expect(cadenceWindowKey({ cadence: "fortnightly", anchorAt, scheduledAt: new Date("2026-08-24T08:00:00.000Z") })).toBe("v1:0");
    expect(cadenceWindowKey({ cadence: "fortnightly", anchorAt, scheduledAt: new Date("2026-08-31T08:00:00.000Z") })).toBe("v1:1");
  });

  it("chooses the next future UTC schedule anchor and retains the privacy-safe message policy", () => {
    expect(nextScheduledAnchor({ now: new Date("2026-08-19T09:30:00.000Z"), dayOfWeek: 3, hourUtc: 9 }).toISOString())
      .toBe("2026-08-26T09:00:00.000Z");
    expect(nudgeMessage("employees").body).toContain("private development nudge");
    expect(nudgeMessage("managers").body).toContain("Private employee reflections");
  });
});
