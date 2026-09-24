export type LandingSummaryPdfInput = {
  managers: number;
  teamSize: number;
  hoursLost: number;
  estimatedRisk: number;
  selectedGaps: string[];
  pilotScope: "small_cohort" | "business_unit";
};

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function safeFilePart(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "summary";
}

export async function generateLandingSummaryPdf(input: LandingSummaryPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const navy: [number, number, number] = [10, 26, 47];
  const gold: [number, number, number] = [212, 175, 55];
  const ivory: [number, number, number] = [248, 245, 240];
  const ink: [number, number, number] = [28, 28, 28];
  const muted: [number, number, number] = [98, 106, 105];
  const scopeLabel = input.pilotScope === "small_cohort" ? "Small cohort (20–30 managers)" : "Business unit (50+ managers)";
  const today = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date());

  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 58, "F");
  doc.setFillColor(...gold);
  doc.rect(0, 0, 7, pageHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.text("LevelNext", 22, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(231, 202, 114);
  doc.text("MANAGEMENT EFFECTIVENESS SUMMARY", 22, 36);
  doc.setTextColor(210, 220, 229);
  doc.text(`Prepared ${today}`, 22, 45);

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("Manager ineffectiveness cost", 22, 82);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...muted);
  doc.text("An indicative capacity-leakage estimate based on your assumptions.", 22, 91);

  doc.setFillColor(...ivory);
  doc.roundedRect(22, 106, pageWidth - 44, 49, 4, 4, "F");
  doc.setTextColor(...muted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ESTIMATED PRODUCTIVITY CAPACITY AT RISK", 30, 120);
  doc.setTextColor(...navy);
  doc.setFontSize(29);
  doc.text(formatINR(input.estimatedRisk), 30, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...muted);
  doc.text("per year (indicative)", 30, 148);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text("Calculator assumptions", 22, 181);
  const assumptions = [
    ["Number of managers", String(input.managers)],
    ["Average team size", String(input.teamSize)],
    ["Avoidable hours lost per manager/team each week", String(input.hoursLost)],
    ["Selected pilot scope", scopeLabel],
  ];
  let y = 193;
  assumptions.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...muted);
    doc.text(label, 22, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text(value, 105, y);
    doc.setDrawColor(224, 220, 213);
    doc.line(22, y + 4, pageWidth - 22, y + 4);
    y += 15;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text("Manager behaviour gaps selected", 22, 266);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  const gaps = input.selectedGaps.length ? input.selectedGaps : ["No behaviour gaps selected yet"];
  const gapLines = doc.splitTextToSize(gaps.map((gap) => `• ${gap}`).join("\n"), pageWidth - 52);
  doc.text(gapLines, 27, 279, { lineHeightFactor: 1.55 });

  doc.setFillColor(...navy);
  doc.roundedRect(22, 302, pageWidth - 44, 35, 4, 4, "F");
  doc.setTextColor(...gold);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("NEXT STEP", 30, 316);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Use this summary to frame a focused 30-day pilot conversation.", 30, 327);

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.line(22, pageHeight - 25, pageWidth - 22, pageHeight - 25);
  doc.setTextColor(...muted);
  doc.setFontSize(8);
  doc.text("LevelNext — A Meta Results Platform", 22, pageHeight - 16);
  doc.text("Indicative estimate, not a financial forecast", pageWidth - 22, pageHeight - 16, { align: "right" });

  const gapPart = input.selectedGaps.length ? safeFilePart(input.selectedGaps[0]) : "manager-gaps";
  doc.save(`LevelNext_Manager_Ineffectiveness_Summary_${gapPart}.pdf`);
}
