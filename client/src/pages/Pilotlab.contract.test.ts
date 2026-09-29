import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("./Pilotlab.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const router = readFileSync(new URL("../../../server/routers/pilotlab.ts", import.meta.url), "utf8");
const platformLayout = readFileSync(new URL("../components/PlatformLayout.tsx", import.meta.url), "utf8");

describe("Pilotlab integration contract", () => {
  it("registers an explicit administrator workspace and navigation entry", () => {
    expect(app).toContain('path="/admin/pilotlab"');
    expect(platformLayout).toContain('label: "Pilotlab"');
    expect(router).toContain("workspace: adminProcedure");
    expect(router).toContain("createRun: adminProcedure");
    expect(router).toContain("advanceTime: adminProcedure");
  });

  it("keeps private ground truth out of the client dashboard source", () => {
    expect(page).not.toContain(".groundTruth");
    expect(page).toContain("Ground truth remains auditor-only");
    expect(page).toContain("Truth is not coaching context");
  });

  it("wires controlled live adapters, versioned assurance exports, and explicit chaos controls", () => {
    expect(router).toContain("runLiveEvaluation: adminProcedure");
    expect(router).toContain("assuranceReport: adminProcedure");
    expect(page).toContain("Run live adapters");
    expect(page).toContain("Download JSON + CSV");
    expect(page).toContain("Enable chaos profile");
    expect(page).toContain("Platform version label");
  });
});
