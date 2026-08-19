import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const handlerSource = readFileSync(resolve(process.cwd(), "server/scheduledHandlers.ts"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers/earlyCareer.ts"), "utf8");

describe("Early Career idempotent delivery boundary", () => {
  it("authenticates cron callers and resolves one enabled config by task UID", () => {
    const start = handlerSource.indexOf("export async function earlyCareerNudgeDeliveryHandler");
    const source = handlerSource.slice(start);
    expect(source).toContain("sdk.authenticateRequest(req)");
    expect(source).toContain("cronUser.isCron || !cronUser.taskUid");
    expect(source).toContain("earlyCareerNudgeConfigs.scheduleCronTaskUid, taskUid");
    expect(source).not.toContain("requestedConfigId");
  });

  it("uses a set-based insert and the cadence-window uniqueness constraint for retry-safe delivery", () => {
    const start = handlerSource.indexOf("export async function earlyCareerNudgeDeliveryHandler");
    const source = handlerSource.slice(start);
    expect(source).toContain("INSERT INTO \\`early_career_nudge_deliveries\\`");
    expect(source).toContain("ON DUPLICATE KEY UPDATE \\`id\\` = \\`id\\`");
    expect(source).toContain("cadenceWindowKey");
  });

  it("creates and updates user-owned schedules with an empty callback payload and session token", () => {
    expect(routerSource).toContain("parseCookie(ctx.req.headers.cookie ?? \"\")[COOKIE_NAME]");
    expect(routerSource).toContain("payload: {}");
    expect(routerSource).toContain("nextScheduledAnchor");
    expect(routerSource).not.toContain("payload: { configId }");
  });
});
