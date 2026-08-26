import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn(() => ({ values }));
  return { getDb: vi.fn(async () => ({ insert })), insert, values };
});

vi.mock("../db", () => ({ getDb: mocks.getDb }));

import { clientTelemetryRouter } from "./clientTelemetry";

describe("client telemetry endpoint", () => {
  it("persists only an authenticated user id, categorical event, and query-free route", async () => {
    const caller = clientTelemetryRouter.createCaller({ user: { id: 42, role: "admin" } } as any);

    await expect(caller.record({ eventType: "lazy_chunk_load_failure", route: "/admin/invites" })).resolves.toEqual({ success: true });
    expect(mocks.values).toHaveBeenCalledWith({ userId: 42, eventType: "lazy_chunk_load_failure", route: "/admin/invites" });

    await expect(caller.record({ eventType: "render_failure", route: "/admin?email=bert@example.com" } as any)).rejects.toBeTruthy();
  });
});
