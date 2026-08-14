export type MepReportFactor = {
  label: string;
  score: number;
  status: "Strength" | "Foundation" | "Priority";
  definition: string;
  whyItMatters: string;
  strength: string;
  weakness: string;
  action: string;
};

type LearningAction = {
  priority: number;
  focus: string;
  action: string;
  timeframe?: string;
  successSignal?: string;
};

export type MepReportExportData = {
  diagnosticTitle: string;
  overallScore: number;
  zone?: string | null;
  headline?: string;
  strengths: Array<{ title?: string; description?: string }>;
  risks: Array<{ title?: string; description?: string }>;
  factorReports: MepReportFactor[];
  learningPath: LearningAction[];
  coachQuestion?: string;
};

async function loadLevelNextLogo(): Promise<string | null> {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportMepReportPdf(data: MepReportExportData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLevelNextLogo();
  const W = 210;
  const H = 297;
  const M = 16;
  const CONTENT_W = W - M * 2;
  const NAVY: [number, number, number] = [10, 26, 47];
  const GOLD: [number, number, number] = [212, 175, 55];
  const IVORY: [number, number, number] = [248, 245, 240];
  const CHARCOAL: [number, number, number] = [51, 57, 65];
  const WHITE: [number, number, number] = [255, 255, 255];
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const addFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(112, 120, 128);
    doc.text("LevelNext · Manager Effectiveness Report", M, 288);
    doc.text(date, W - M, 288, { align: "right" });
  };

  const addPage = (section: string) => {
    doc.addPage();
    doc.setFillColor(...IVORY);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, 0, W, 3, "F");
    if (logo) doc.addImage(logo, "PNG", M, 11, 28, 11);
    else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text("LEVELNEXT", M, 18);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(section.toUpperCase(), W - M, 18, { align: "right" });
    doc.setDrawColor(212, 175, 55);
    doc.line(M, 26, W - M, 26);
    addFooter();
  };

  const addWrapped = (text: string, x: number, y: number, width: number, size = 9, color = CHARCOAL, style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.46);
  };

  const statusColor = (status: MepReportFactor["status"]): [number, number, number] =>
    status === "Strength" ? [22, 163, 74] : status === "Foundation" ? [202, 138, 4] : [220, 38, 38];

  // Cover
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, W, 4, "F");
  if (logo) doc.addImage(logo, "PNG", M, 20, 38, 15);
  else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GOLD);
    doc.text("LEVELNEXT", M, 30);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.setTextColor(...WHITE);
  doc.text("Manager", M, 92);
  doc.setTextColor(...GOLD);
  doc.text("Effectiveness", M, 106);
  doc.setFontSize(13);
  doc.setTextColor(220, 225, 232);
  doc.setFont("helvetica", "normal");
  doc.text("Diagnostic report and development plan", M, 121);
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
  doc.circle(180, 72, 48, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(...GOLD);
  doc.text(String(data.overallScore), M, 185);
  doc.setFontSize(15);
  doc.setTextColor(220, 225, 232);
  doc.text("/100", M + 38, 185);
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(`${data.diagnosticTitle}${data.zone ? ` · ${data.zone}` : ""}`, M, 198);
  doc.setFontSize(8);
  doc.setTextColor(185, 194, 205);
  doc.text(`Generated ${date}`, M, 270);
  doc.text("levelnext.coach", M, 282);

  // Executive summary
  addPage("Executive Summary");
  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text("Your management profile", M, y);
  y += 10;
  y = addWrapped(data.headline || "This report translates your diagnostic data into focused management habits you can strengthen over the next 30 days.", M, y, CONTENT_W, 10);
  y += 8;

  const strongFactors = data.factorReports.filter((factor) => factor.status === "Strength").slice(0, 3);
  const priorityFactors = data.factorReports.filter((factor) => factor.status === "Priority").slice(0, 3);
  const summarySections = [
    { label: "Strengths to leverage", text: strongFactors.length ? strongFactors.map((factor) => factor.label).join(" · ") : data.strengths.map((item) => item.title).filter(Boolean).join(" · ") || "Build from the management behaviours that are already working consistently." },
    { label: "Development priorities", text: priorityFactors.length ? priorityFactors.map((factor) => factor.label).join(" · ") : data.risks.map((item) => item.title).filter(Boolean).join(" · ") || "Focus on the lowest-scoring factors first to create the most visible shift." },
  ];
  summarySections.forEach((section, index) => {
    doc.setFillColor(index === 0 ? 237 : 255, index === 0 ? 248 : 247, index === 0 ? 240 : 237);
    doc.roundedRect(M, y, CONTENT_W, 26, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...(index === 0 ? [22, 101, 52] as [number, number, number] : [146, 64, 14] as [number, number, number]));
    doc.text(section.label.toUpperCase(), M + 5, y + 7);
    addWrapped(section.text, M + 5, y + 14, CONTENT_W - 10, 9);
    y += 32;
  });
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text("Reflection question", M, y);
  y += 7;
  doc.setFillColor(246, 241, 225);
  doc.roundedRect(M, y, CONTENT_W, 30, 3, 3, "F");
  addWrapped(data.coachQuestion || "Which management habit, strengthened consistently over the next month, would make the greatest difference to your team?", M + 6, y + 10, CONTENT_W - 12, 10, CHARCOAL, "italic");

  // Factor reports, three per page.
  data.factorReports.forEach((factor, index) => {
    if (index % 3 === 0) {
      addPage(index === 0 ? "Factor Analysis" : "Factor Analysis Continued");
      y = 38;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(...NAVY);
      doc.text(index === 0 ? "What each factor tells you" : "Factor-by-factor development view", M, y);
      y += 10;
    }
    const color = statusColor(factor.status);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, y, CONTENT_W, 72, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(factor.label, M + 5, y + 8);
    doc.setFontSize(8);
    doc.setTextColor(...color);
    doc.text(`${factor.score}/100 · ${factor.status}`, W - M - 5, y + 8, { align: "right" });
    y = addWrapped(factor.definition, M + 5, y + 15, CONTENT_W - 10, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text("STRENGTH / CURRENT BASE", M + 5, y + 4);
    y = addWrapped(factor.strength, M + 5, y + 9, CONTENT_W - 10, 7.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...NAVY);
    doc.text("DEVELOPMENT RISK", M + 5, y + 4);
    y = addWrapped(factor.weakness, M + 5, y + 9, CONTENT_W - 10, 7.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...color);
    doc.text("NEXT ACTION", M + 5, y + 4);
    addWrapped(factor.action, M + 5, y + 9, CONTENT_W - 10, 7.5);
    y = Math.ceil(y / 78) * 78 + 38;
  });

  // Thirty-day action plan
  addPage("30-Day Action Plan");
  y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...NAVY);
  doc.text("From insight to practice", M, y);
  y += 10;
  const plan = data.learningPath.length
    ? data.learningPath.slice(0, 3)
    : data.factorReports
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((factor, index) => ({ priority: index + 1, focus: factor.label, action: factor.action, timeframe: `${(index + 1) * 10} days`, successSignal: `A visible improvement in how the team experiences ${factor.label.toLowerCase()}.` }));
  plan.forEach((step, index) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, y, CONTENT_W, 48, 3, 3, "F");
    doc.setFillColor(...GOLD);
    doc.roundedRect(M, y, 13, 48, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(String(step.priority ?? index + 1).padStart(2, "0"), M + 6.5, y + 26, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(step.focus, M + 18, y + 9);
    y = addWrapped(step.action, M + 18, y + 15, CONTENT_W - 23, 8.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 120);
    doc.text(`${step.timeframe || "This month"} · ${step.successSignal || "Review the behavioural evidence with your team."}`, M + 18, y + 7);
    y = Math.ceil(y / 54) * 54 + 40;
  });

  const fileName = `LevelNext_${data.diagnosticTitle.replace(/[^a-z0-9]+/gi, "_")}_Report.pdf`;
  doc.save(fileName);
}
