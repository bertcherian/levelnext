import { describe, expect, it } from "vitest";
import { isClientTelemetryEvent, safeTelemetryRoute } from "./clientTelemetry";

describe("client telemetry privacy boundaries", () => {
  it("removes queries and only preserves a bounded application route", () => {
    expect(safeTelemetryRoute("/admin?participant=bert@example.com")).toBe("/admin");
    expect(safeTelemetryRoute("https://untrusted.example")).toBe("/");
  });

  it("accepts only recognised event categories and route-only payloads", () => {
    expect(isClientTelemetryEvent({ eventType: "lazy_chunk_load_failure", route: "/admin/invites" })).toBe(true);
    expect(isClientTelemetryEvent({ eventType: "render_failure", route: "/admin?email=bert@example.com" })).toBe(false);
    expect(isClientTelemetryEvent({ eventType: "raw_error", route: "/admin" })).toBe(false);
  });
});
