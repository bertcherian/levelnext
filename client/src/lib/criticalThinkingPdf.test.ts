import { beforeEach, describe, expect, it, vi } from "vitest";

const { save, doc } = vi.hoisted(() => {
  const save = vi.fn();
  const doc = {
    addPage: vi.fn(), setFillColor: vi.fn(), rect: vi.fn(), addImage: vi.fn(), setFont: vi.fn(), setFontSize: vi.fn(), setTextColor: vi.fn(), text: vi.fn(), setDrawColor: vi.fn(), line: vi.fn(), splitTextToSize: vi.fn(() => ["wrapped text"]), roundedRect: vi.fn(), save,
  };
  return { save, doc };
});

vi.mock("jspdf", () => ({ jsPDF: class { constructor() { return doc; } } }));

import { exportCriticalThinkingIndividualPdf, exportCriticalThinkingTeamPdf } from "./criticalThinkingPdf";

const dimensions = [{ id: "frame", label: "Frame", definition: "Define the real decision.", individualPractice: "Write the decision before discussing it.", teamPractice: "Start significant meetings with the decision question.", reusableTool: "Framing questions", reflectionQuestion: "What decision are we actually making?", feedback: { strong: "Frame the choice clearly.", priority: "Test the decision framing." } }];

describe("Critical Thinking branded PDF exports", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Logo not available in unit test"))); });

  it("creates a LevelNext individual development report without relying on browser print", async () => {
    await exportCriticalThinkingIndividualPdf({ campaignName: "Leadership pilot", completedAt: new Date("2026-08-26"), score: { dimensionScores: { frame: 82 }, strengths: ["frame"], priorities: ["frame"], appliedJudgmentScore: 81, meanConfidence: 72, environmentScore: 69, environmentBand: "Mixed", interpretation: "Use this as a development guide." }, dimensions });
    expect(save).toHaveBeenCalledWith("LevelNext_Leadership_pilot_Individual_Development_Report.pdf");
    expect(doc.text).toHaveBeenCalledWith(expect.stringContaining("Critical Thinking"), expect.any(Number), expect.any(Number));
  });

  it("creates an anonymised team report only from aggregate inputs", async () => {
    await exportCriticalThinkingTeamPdf({ campaignName: "Leadership pilot", reportingGroup: "Pilot cohort", participantCount: 5, minimumGroupSize: 5, aggregate: { dimensionAverages: { frame: 74 }, sharedStrengths: ["frame"], sharedPriorities: ["frame"], averageAppliedJudgmentScore: 71, averageBehaviouralScore: 75, averageEnvironmentScore: 68, averageBiasManagementScore: 70 }, dimensions });
    expect(save).toHaveBeenCalledWith("LevelNext_Leadership_pilot_Team_Development_Report.pdf");
    expect(doc.text).toHaveBeenCalledWith(expect.stringContaining("Anonymised team development report"), expect.any(Number), expect.any(Number));
  });
});
