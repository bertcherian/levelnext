// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), exportPdf: vi.fn() }));
const score = { dimensionScores: { frame: 74, question: 68, evidence: 70, options: 72, challenge: 65, decide: 71, learn: 69 }, strengths: ["frame"], priorities: ["challenge"], appliedJudgmentScore: 74, meanConfidence: 70, biasManagementScore: 69, intellectualHabitsScore: 71, environmentScore: 65, environmentBand: "Mixed", calibration: { label: "Balanced", description: "Confidence is broadly aligned." }, interpretation: "Use this as a developmental signal.", scenarioCount: 8 };

vi.mock("@/lib/trpc", () => ({ trpc: { criticalThinking: { getMyReport: { useQuery: () => ({ data: { report: { id: 22, createdAt: new Date("2026-08-20"), scoreSnapshot: score }, campaign: { name: "Current leadership cycle" }, dimensions: ["frame", "question", "evidence", "options", "challenge", "decide", "learn"].map((id) => ({ id, label: id, feedback: { strong: "Build on this.", priority: "Practise this." }, individualPractice: "Use a routine.", reflectionQuestion: "What changed?", reusableTool: "Decision log" })) }, isLoading: false, error: null }) }, myReportHistory: { useQuery: () => ({ data: [{ id: 22, campaignName: "Current leadership cycle", reportingGroup: "A", completedAt: new Date("2026-08-20"), scoreSnapshot: score }, { id: 21, campaignName: "Baseline leadership cycle", reportingGroup: "A", completedAt: new Date("2026-05-20"), scoreSnapshot: { ...score, dimensionScores: { ...score.dimensionScores, frame: 61 } } }] }) } } } }));
vi.mock("@/lib/criticalThinkingPdf", () => ({ exportCriticalThinkingIndividualPdf: mocks.exportPdf }));
vi.mock("wouter", () => ({ useRoute: () => [true, { reportId: "22" }], useLocation: () => ["/critical-thinking/report/22", mocks.setLocation] }));
vi.mock("recharts", () => ({ ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, RadarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, PolarGrid: () => null, PolarAngleAxis: () => null, Radar: () => null, Tooltip: () => null }));

import CriticalThinkingReport from "./CriticalThinkingReport";

describe("CriticalThinkingReport", () => {
  afterEach(() => cleanup());
  it("shows a participant-owned cross-cycle comparison and opens the PDF preview before download", async () => {
    const user = userEvent.setup();
    render(<CriticalThinkingReport />);
    expect(await screen.findByText("Progress across diagnostic cycles")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /preview pdf report/i }));
    expect(await screen.findByText("Private development report preview")).toBeTruthy();
    expect(mocks.exportPdf).not.toHaveBeenCalled();
  });
});
