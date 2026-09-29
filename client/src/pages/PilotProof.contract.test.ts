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

  it("uses a problem-led four-step builder, three governed access lanes, and defers account creation until launch", () => {
    expect(builder).toContain("30 Days. 3 Behaviours.");
    expect(builder).toContain("Step {step} of 4");
    expect(builder).toContain('window.location.href = "/login?returnTo=%2Fpilot"');
    expect(builder).toContain("Instant Pilot");
    expect(builder).toContain("Corporate Browser Pilot");
    expect(builder).toContain("Enterprise Pilot");
    expect(builder).toContain("never asks participants to bypass");
  });

  it("makes sponsor evidence privacy-safe, health-aware, and non-causal", () => {
    expect(dashboard).toContain("Private coaching stays private");
    expect(dashboard).toContain("Pilot health engine");
    expect(dashboard).toContain("Security Fast Pack");
    expect(dashboard).toContain("Time to first practice");
    expect(proofService).toContain("not causal or financial impact");
    expect(proofService).toContain("does not recommend bypassing organisational controls");
  });

  it("keeps participant reflection private while providing daily action and safe-practice safeguards", () => {
    expect(participant).toContain("Private participant space");
    expect(participant).toContain("Today’s micro-action");
    expect(participant).toContain("Anonymise this scenario");
    expect(participant).toContain("Request Pilot Access");
    expect(participant).toContain("Your personal coaching and reflection stay private");
  });
});
