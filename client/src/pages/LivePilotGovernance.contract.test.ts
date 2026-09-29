import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const governance = readFileSync(new URL("../components/LivePilotGovernance.tsx", import.meta.url), "utf8");
const participant = readFileSync(new URL("./PilotParticipant.tsx", import.meta.url), "utf8");

describe("consented live-pilot contracts", () => {
  it("keeps consent, aggregate baseline, and Day-30 completion controls visible to sponsors", () => {
    expect(governance).toContain("Record sponsor consent");
    expect(governance).toContain("Save baseline measure");
    expect(governance).toContain("Complete review");
    expect(governance).toContain("not causality, ROI, or financial impact");
  });

  it("requires participant informed consent before baseline evidence is recorded", () => {
    expect(participant).toContain("Confirm informed participation");
    expect(participant).toContain("!participant.data.participant.informedConsent");
    expect(participant).toContain("recordParticipantConsent");
  });
});
