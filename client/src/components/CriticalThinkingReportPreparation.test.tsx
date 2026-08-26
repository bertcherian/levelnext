// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndividualReportPreview } from "./CriticalThinkingReportPreview";

afterEach(cleanup);
describe("CriticalThinkingReportPreview PDF preparation", () => {
  it("replaces preview content with a branded preparation state while exporting", () => {
    render(<IndividualReportPreview open onOpenChange={vi.fn()} campaignName="Pilot" completedAt={new Date()} score={{}} dimensions={[]} onDownload={vi.fn()} exporting />);
    expect(screen.getAllByText("Preparing your LevelNext PDF").length).toBeGreaterThan(0);
    expect(screen.getByText("Development summary")).toBeTruthy();
  });
});
