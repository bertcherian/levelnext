import { describe, expect, it } from "vitest";
import { getMepDailyBriefDateKey, resolveMepDailyBriefTimeZone } from "./mepDailyBriefDate";

describe("Manager Effectiveness daily brief date", () => {
  const instant = new Date("2026-08-18T00:30:00.000Z");

  it("uses the manager’s local calendar date rather than the server’s UTC date", () => {
    expect(getMepDailyBriefDateKey(instant, "Asia/Kolkata")).toBe("2026-08-18");
    expect(getMepDailyBriefDateKey(instant, "America/Los_Angeles")).toBe("2026-08-17");
  });

  it("falls back safely to UTC when a submitted timezone is invalid", () => {
    expect(resolveMepDailyBriefTimeZone("Not/A-Timezone")).toBe("UTC");
    expect(getMepDailyBriefDateKey(instant, "Not/A-Timezone")).toBe("2026-08-18");
  });
});
