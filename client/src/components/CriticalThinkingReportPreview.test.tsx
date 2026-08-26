// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndividualReportPreview, TeamReportPreview } from "./CriticalThinkingReportPreview";

const dimensions = [{ id: "frame", label: "Frame the decision" }];

describe("Critical Thinking report preview modals", () => {
  afterEach(() => cleanup());

  it("shows a private individual report preview and requires a deliberate download action", async () => {
    const download = vi.fn(); const user = userEvent.setup();
    render(<IndividualReportPreview open onOpenChange={vi.fn()} campaignName="Leadership cycle" completedAt={new Date("2026-08-01")} score={{ appliedJudgmentScore: 75, meanConfidence: 71, environmentScore: 64, environmentBand: "Mixed", dimensionScores: { frame: 80 }, strengths: ["frame"] }} dimensions={dimensions} onDownload={download} exporting={false} />);
    expect(screen.getByText("Private development report preview")).toBeTruthy();
    expect(screen.getByText(/This downloadable report is private to you/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /download development report/i }));
    expect(download).toHaveBeenCalledTimes(1);
  });

  it("labels the team preview as anonymised and preserves the configured threshold guidance", () => {
    render(<TeamReportPreview open onOpenChange={vi.fn()} campaignName="Leadership cycle" reportingGroup="Cohort A" participantCount={5} minTeamSize={5} aggregate={{ averageAppliedJudgmentScore: 74, averageBehaviouralScore: 71, averageEnvironmentScore: 65, dimensionAverages: { frame: 73 }, sharedStrengths: ["frame"] }} dimensions={dimensions} onDownload={vi.fn()} exporting={false} />);
    expect(screen.getByText("Anonymised team report preview")).toBeTruthy();
    expect(screen.getByText(/contains no named individual scores/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /download team report/i })).toBeTruthy();
  });
});
