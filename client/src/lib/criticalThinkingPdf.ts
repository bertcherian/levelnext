type Dimension = { id: string; label: string; definition: string; individualPractice?: string; teamPractice?: string; reusableTool?: string; reflectionQuestion?: string; feedback?: { strong?: string; priority?: string } };

const NAVY: [number, number, number] = [10, 26, 47];
const GOLD: [number, number, number] = [212, 175, 55];
const IVORY: [number, number, number] = [248, 245, 240];
const CHARCOAL: [number, number, number] = [45, 55, 72];
const W = 210;
const H = 297;
const M = 16;
const CONTENT_W = W - M * 2;

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
  } catch { return null; }
}

function safeFilename(value: string) { return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "Critical_Thinking"; }

function buildDocumentHelpers(doc: any, logo: string | null, reportLabel: string) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const footer = () => { doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(105, 115, 125); doc.text(`LevelNext · ${reportLabel}`, M, 288); doc.text(date, W - M, 288, { align: "right" }); };
  const page = (section: string) => {
    doc.addPage(); doc.setFillColor(...IVORY); doc.rect(0, 0, W, H, "F"); doc.setFillColor(...GOLD); doc.rect(0, 0, W, 3, "F");
    if (logo) doc.addImage(logo, "PNG", M, 11, 28, 11); else { doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text("LEVELNEXT", M, 18); }
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...GOLD); doc.text(section.toUpperCase(), W - M, 18, { align: "right" }); doc.setDrawColor(...GOLD); doc.line(M, 26, W - M, 26); footer();
  };
  const wrapped = (text: string, x: number, y: number, width: number, size = 9, color: [number, number, number] = CHARCOAL, style: "normal" | "bold" | "italic" = "normal") => { doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color); const lines = doc.splitTextToSize(text, width); doc.text(lines, x, y); return y + lines.length * (size * 0.46); };
  const cover = (title: string, subtitle: string, meta: string) => { doc.setFillColor(...NAVY); doc.rect(0, 0, W, H, "F"); doc.setFillColor(...GOLD); doc.rect(0, 0, W, 4, "F"); if (logo) doc.addImage(logo, "PNG", M, 20, 38, 15); else { doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...GOLD); doc.text("LEVELNEXT", M, 30); } doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(...IVORY); const titleLines = doc.splitTextToSize(title, 160); doc.text(titleLines, M, 93); doc.setFont("helvetica", "normal"); doc.setFontSize(13); doc.setTextColor(...GOLD); doc.text(subtitle, M, 125); doc.setFontSize(9); doc.setTextColor(210, 220, 230); doc.text(meta, M, 142); doc.setFontSize(8); doc.setTextColor(185, 194, 205); doc.text(`Generated ${date}`, M, 270); doc.text("levelnext.coach", M, 282); };
  return { page, wrapped, cover };
}

async function buildCriticalThinkingIndividualPdf(data: { campaignName: string; completedAt: Date | string; score: Record<string, any>; dimensions: Dimension[] }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLevelNextLogo();
  const { page, wrapped, cover } = buildDocumentHelpers(doc, logo, "Critical Thinking Development Report");
  const date = new Date(data.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  cover("Critical Thinking in\nDecision Making", "Private developmental report", `${data.campaignName} · Completed ${date}`);
  page("Development summary");
  let y = 41;
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...NAVY); doc.text("Decision-quality development view", M, y); y += 10;
  y = wrapped("This private report keeps behavioural practice, applied scenario judgment, confidence calibration, and decision environment distinct. It is not a performance rating, intelligence test, or employment decision tool.", M, y, CONTENT_W, 10); y += 9;
  const summary = [
    ["Applied judgment", `${data.score.appliedJudgmentScore ?? "—"}/100`, "Choice quality across eight workplace scenarios."],
    ["Average confidence", `${data.score.meanConfidence ?? "—"}/100`, data.score.calibration?.label ?? "Confidence pattern unavailable."],
    ["Decision environment", `${data.score.environmentScore ?? "—"}/100`, data.score.environmentBand ?? "Reported separately from individual capability."],
  ];
  summary.forEach(([label, value, detail], index) => { const x = M + index * 59; doc.setFillColor(255, 255, 255); doc.roundedRect(x, y, 55, 36, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...NAVY); doc.text(label.toUpperCase(), x + 5, y + 8); doc.setFontSize(15); doc.setTextColor(...GOLD); doc.text(value, x + 5, y + 18); wrapped(detail, x + 5, y + 25, 45, 7); });
  y += 49;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...NAVY); doc.text("Interpret with care", M, y); y += 7;
  wrapped(data.score.interpretation ?? "Use this report as a focused starting point for practice and reflection, not as a fixed label.", M, y, CONTENT_W, 9);
  page("Capability profile");
  y = 40; doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...NAVY); doc.text("Seven decision capabilities", M, y); y += 9;
  const priorities = new Set<string>(data.score.priorities ?? []);
  const strengths = new Set<string>(data.score.strengths ?? []);
  data.dimensions.forEach((dimension, index) => {
    if (index && index % 3 === 0) { page("Capability profile continued"); y = 38; }
    const value = data.score.dimensionScores?.[dimension.id] ?? null;
    const profileTone: [number, number, number] = strengths.has(dimension.id) ? [22, 101, 52] : priorities.has(dimension.id) ? [160, 92, 0] : NAVY;
    doc.setFillColor(255, 255, 255); doc.roundedRect(M, y, CONTENT_W, 72, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text(dimension.label, M + 5, y + 9); doc.setFontSize(9); doc.setTextColor(...profileTone); doc.text(`${value ?? "—"}/100${strengths.has(dimension.id) ? " · Relative strength" : priorities.has(dimension.id) ? " · Development priority" : ""}`, W - M - 5, y + 9, { align: "right" });
    let cardY = wrapped(dimension.definition, M + 5, y + 17, CONTENT_W - 10, 8); cardY += 3; doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...NAVY); doc.text("NEXT PRACTICE", M + 5, cardY); cardY = wrapped(priorities.has(dimension.id) ? (dimension.individualPractice ?? dimension.feedback?.priority ?? "Choose one live decision where this capability can be practised deliberately.") : (dimension.feedback?.strong ?? "Use this capability deliberately in a complex decision."), M + 5, cardY + 5, CONTENT_W - 10, 7.5); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GOLD); doc.text(`TOOL: ${dimension.reusableTool ?? "Decision journal"}`, M + 5, Math.min(y + 65, cardY + 5)); y += 78;
  });
  page("30-day action plan");
  y = 40; doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...NAVY); doc.text("Turn insight into practice", M, y); y += 10;
  const planDimensions = data.dimensions.filter((dimension) => priorities.has(dimension.id)).slice(0, 2);
  (planDimensions.length ? planDimensions : data.dimensions.slice(0, 2)).forEach((dimension, index) => { doc.setFillColor(255, 255, 255); doc.roundedRect(M, y, CONTENT_W, 48, 3, 3, "F"); doc.setFillColor(...GOLD); doc.roundedRect(M, y, 14, 48, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...NAVY); doc.text(String(index + 1).padStart(2, "0"), M + 7, y + 26, { align: "center" }); doc.setFontSize(10); doc.text(dimension.label, M + 20, y + 10); const action = dimension.individualPractice ?? dimension.feedback?.priority ?? "Test one deliberate practice in a live decision this month."; const nextY = wrapped(action, M + 20, y + 17, CONTENT_W - 26, 8.5); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GOLD); doc.text(`REFLECT: ${dimension.reflectionQuestion ?? "What changed in the quality of the decision?"}`, M + 20, Math.min(y + 42, nextY + 6)); y += 56; });
  return { doc, filename: `LevelNext_${safeFilename(data.campaignName)}_Individual_Development_Report.pdf` };
}

export async function exportCriticalThinkingIndividualPdf(data: { campaignName: string; completedAt: Date | string; score: Record<string, any>; dimensions: Dimension[] }) {
  const { doc, filename } = await buildCriticalThinkingIndividualPdf(data);
  doc.save(filename);
}

export async function createCriticalThinkingIndividualPdfFile(data: { campaignName: string; completedAt: Date | string; score: Record<string, any>; dimensions: Dimension[] }) {
  const { doc, filename } = await buildCriticalThinkingIndividualPdf(data);
  return { blob: doc.output("blob") as Blob, filename };
}

export async function exportCriticalThinkingTeamPdf(data: { campaignName: string; reportingGroup: string; participantCount: number; aggregate: Record<string, any>; dimensions: Dimension[]; minimumGroupSize: number }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = await loadLevelNextLogo();
  const { page, wrapped, cover } = buildDocumentHelpers(doc, logo, "Critical Thinking Team Development Report");
  cover("Critical Thinking in\nDecision Making", "Anonymised team development report", `${data.campaignName} · ${data.reportingGroup} · ${data.participantCount} completed participants`);
  page("Team insight");
  let y = 40; doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...NAVY); doc.text("A developmental view of shared practice", M, y); y += 10;
  y = wrapped(`This report contains only anonymised group-level patterns. It is available because ${data.participantCount} participants completed the diagnostic, meeting the configured minimum of ${data.minimumGroupSize}. Do not use it to infer, rank, or evaluate any individual.`, M, y, CONTENT_W, 10); y += 9;
  const measures = [["Applied judgment", data.aggregate.averageAppliedJudgmentScore], ["Behavioural practice", data.aggregate.averageBehaviouralScore], ["Decision environment", data.aggregate.averageEnvironmentScore], ["Bias-management", data.aggregate.averageBiasManagementScore]];
  measures.forEach(([label, value], index) => { const x = M + (index % 2) * 90; const cardY = y + Math.floor(index / 2) * 38; doc.setFillColor(255, 255, 255); doc.roundedRect(x, cardY, 84, 31, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...NAVY); doc.text(String(label).toUpperCase(), x + 5, cardY + 8); doc.setFontSize(18); doc.setTextColor(...GOLD); doc.text(`${value ?? "—"}/100`, x + 5, cardY + 20); });
  page("Shared capability profile");
  y = 40; doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...NAVY); doc.text("What the team can build on", M, y); y += 10;
  const strengths = new Set<string>(data.aggregate.sharedStrengths ?? []); const priorities = new Set<string>(data.aggregate.sharedPriorities ?? []);
  data.dimensions.forEach((dimension, index) => { if (index && index % 4 === 0) { page("Shared capability profile continued"); y = 38; } const score = data.aggregate.dimensionAverages?.[dimension.id]; const teamTone: [number, number, number] = priorities.has(dimension.id) ? [160, 92, 0] : strengths.has(dimension.id) ? [22, 101, 52] : NAVY; doc.setFillColor(255, 255, 255); doc.roundedRect(M, y, CONTENT_W, 51, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text(dimension.label, M + 5, y + 9); doc.setTextColor(...teamTone); doc.text(`${score ?? "—"}/100${strengths.has(dimension.id) ? " · Shared strength" : priorities.has(dimension.id) ? " · Shared priority" : ""}`, W - M - 5, y + 9, { align: "right" }); let cardY = wrapped(dimension.definition, M + 5, y + 17, CONTENT_W - 10, 8); cardY += 3; doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GOLD); doc.text("TEAM ROUTINE", M + 5, cardY); wrapped(priorities.has(dimension.id) ? (dimension.teamPractice ?? "Introduce a visible team decision routine for this capability.") : "Keep reinforcing this practice in significant decisions.", M + 5, cardY + 5, CONTENT_W - 10, 7.5); y += 57; });
  page("Discussion guide");
  y = 40; doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...NAVY); doc.text("A team conversation, not a ranking exercise", M, y); y += 11;
  const prioritiesForDiscussion = data.dimensions.filter((dimension) => priorities.has(dimension.id)).slice(0, 2);
  prioritiesForDiscussion.forEach((dimension, index) => { doc.setFillColor(255, 255, 255); doc.roundedRect(M, y, CONTENT_W, 48, 3, 3, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...NAVY); doc.text(`${index + 1}. ${dimension.label}`, M + 6, y + 10); let cardY = wrapped(`Team practice: ${dimension.teamPractice ?? "Create a clear routine around this dimension in the next significant decision."}`, M + 6, y + 18, CONTENT_W - 12, 8.5); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...GOLD); doc.text(`LEADER PROMPT: ${dimension.reflectionQuestion ?? "What would better decision evidence look like here?"}`, M + 6, Math.min(y + 42, cardY + 7)); y += 56; });
  doc.save(`LevelNext_${safeFilename(data.campaignName)}_Team_Development_Report.pdf`);
}
