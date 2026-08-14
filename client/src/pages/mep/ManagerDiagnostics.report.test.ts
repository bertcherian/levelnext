import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./ManagerDiagnostics.tsx", import.meta.url), "utf8");

describe("ManagerDiagnostics report integration", () => {
  it("uses the tested report details and download components", () => {
    expect(source).toContain("MepReportDetails");
    expect(source).toContain("MepReportDownloadButton");
  });

  it("keeps the PDF download control wired to the report export helper", () => {
    expect(source).toContain('from "@/lib/mepReportPdf"');
    expect(source).toContain("handleDownloadReport");
    expect(source).toContain("exportMepReportPdf");
  });
});
