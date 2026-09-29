import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const builder = readFileSync(new URL("./PilotBuilder.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("./PilotProofDashboard.tsx", import.meta.url), "utf8");
const participant = readFileSync(new URL("./PilotParticipant.tsx", import.meta.url), "utf8");
const proofService = readFileSync(new URL("../../../server/behaviourChangeProof.ts", import.meta.url), "utf8");

describe("Behaviour Change Proof UI contracts", () => {
  it("registers public builder, participant, and sponsor dashboard routes", () => {
    expect(app).toContain('path="/pilot"');
    expect(app).toContain('path="/pilot/dashboard"');
    expect(app).toContain('path="/pilot/participant/:token"');
  });

  it("uses a problem-led four-step builder and defers account creation until launch", () => {
    expect(builder).toContain("Let’s prove whether behaviour can change.");
    expect(builder).toContain("Step {step} of 4");
    expect(builder).toContain('window.location.href = "/login?returnTo=%2Fpilot"');
    expect(builder).toContain("LevelNext will handle the defaults");
  });

  it("makes sponsor evidence privacy-safe and limits claims", () => {
    expect(dashboard).toContain("Private coaching stays private");
    expect(proofService).toContain("not causal or financial impact");
    expect(dashboard).toContain("Evidence strength");
    expect(dashboard).toContain("Next best action");
  });

  it("keeps participant reflection text private by default", () => {
    expect(participant).toContain("Private participant space");
    expect(participant).toContain("Your personal coaching and reflection stay private");
    expect(participant).toContain("notice → choose → practise → do");
  });
});
