import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const service = readFileSync(new URL("./intelligenceFabric.ts", import.meta.url), "utf8");
const adapter = readFileSync(new URL("./_core/jev.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers/intelligenceFabric.ts", import.meta.url), "utf8");

describe("Intelligence Fabric integration boundary", () => {
  it("requires explicit external-provider permission and standard privacy before calling Jev", () => {
    expect(service).toContain('requirements.allowExternalProvider && requirements.privacyClass === "standard"');
    expect(service).toContain("minimiseState(input.state)");
    expect(service).toContain("deterministicInterventionFallback");
  });

  it("audits decisions without persisting raw source state", () => {
    expect(service).toContain("contextFields: result.contextFields");
    expect(service).toContain("answer: result.answers");
    expect(service).not.toContain("state: input.state");
  });

  it("uses the official typed System One endpoint with retry handling", () => {
    expect(adapter).toContain("/v1/systemone");
    expect(adapter).toContain('model: input.model ?? "jev-latest"');
    expect(adapter).toContain("status === 429 || status === 529");
  });

  it("keeps console actions behind admin access", () => {
    expect(router).toContain("adminProcedure");
    expect(router).toContain("runDecision");
  });
});
