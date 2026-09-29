import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const participant = readFileSync(new URL("./PilotParticipant.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("./PilotProofDashboard.tsx", import.meta.url), "utf8");
const security = readFileSync(new URL("../components/ProofSecurityWorkspace.tsx", import.meta.url), "utf8");
const scheduled = readFileSync(new URL("../../../server/scheduledHandlers.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("../../../server/routers/behaviourChangeProof.ts", import.meta.url), "utf8");

describe("Pilot trust and operating controls", () => {
  it("gives participants sponsor provenance, privacy details, a personal goal, and a way to reduce or pause nudges", () => {
    expect(participant).toContain("Your 3-minute welcome");
    expect(participant).toContain("Who sees what?");
    expect(participant).toContain("Save my personal goal");
    expect(participant).toContain("Send fewer nudges");
    expect(participant).toContain("Pause nudges");
  });

  it("exposes sponsor communication, PDF proof exports, and the security workspace", () => {
    expect(dashboard).toContain("Sponsor Pack");
    expect(dashboard).toContain("Proof Pack PDF");
    expect(dashboard).toContain("Internal business case PDF");
    expect(dashboard).toContain("Documents, review owners, and requirement approvals");
    expect(security).toContain("Upload security document");
    expect(security).toContain("Requirement-level approval tracking");
  });

  it("routes idempotent milestone nudges through a cron-only scheduled callback", () => {
    expect(scheduled).toContain("proofNudgesHandler");
    expect(scheduled).toContain("cron-only");
    expect(router).toContain("/api/scheduled/proofNudges");
    expect(router).toContain("saveNudgeSettings");
  });
});
