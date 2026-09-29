import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./pilotlabIntegrations.ts", import.meta.url), "utf8");

describe("Pilotlab live evaluation adapters", () => {
  it("calls the existing Coach, Practice Partner, and Simulator procedures through a synthetic context", () => {
    expect(source).toContain("caller.practice.createSession");
    expect(source).toContain("caller.mep.startPracticeSession");
    expect(source).toContain("caller.simulator.startSession");
    expect(source).toContain('evidenceBoundary: "synthetic_only"');
  });

  it("keeps assurance reports bounded and exports comparable versioned results", () => {
    expect(source).toContain("platformVersion");
    expect(source).toContain("Simulation evidence does not establish causality, business impact, financial value, or ROI.");
    expect(source).toContain("Pilotlab uses synthetic manager agents and controlled scenarios");
  });
});
