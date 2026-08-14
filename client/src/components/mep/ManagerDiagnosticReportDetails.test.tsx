import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MepReportDetails, MepReportDownloadButton } from "./ManagerDiagnosticReportDetails";

describe("ManagerDiagnosticReportDetails", () => {
  it("renders factor explanations, strengths, development risks, and actions from report data", () => {
    const html = renderToStaticMarkup(
      <MepReportDetails
        factorReports={[{
          label: "Delegation",
          score: 58,
          status: "Priority",
          definition: "Assigning work with appropriate authority.",
          whyItMatters: "It releases manager capacity and develops team judgement.",
          strength: "You have a workable base in delegation.",
          weakness: "Important work may still be retained too close to the manager.",
          action: "Name the decision rights and agree a check-in rhythm before delegating.",
        }]}
        developmentActions={[{
          priority: 1,
          focus: "Delegation",
          action: "Delegate one decision with clear guardrails this week.",
          timeframe: "10 days",
          successSignal: "The owner makes the decision without unnecessary escalation.",
        }]}
      />,
    );

    expect(html).toContain("What Each Factor Means");
    expect(html).toContain("Assigning work with appropriate authority.");
    expect(html).toContain("Why it matters:");
    expect(html).toContain("Strength / current base");
    expect(html).toContain("Development risk");
    expect(html).toContain("Action to improve this area");
    expect(html).toContain("Your 30-Day Development Plan");
    expect(html).toContain("Evidence of progress:");
  });

  it("renders an accessible download button in its ready state", () => {
    const html = renderToStaticMarkup(<MepReportDownloadButton onClick={vi.fn()} isExporting={false} />);

    expect(html).toContain("Download Report");
    expect(html).toContain("Download Manager Effectiveness report as a PDF");
  });
});
