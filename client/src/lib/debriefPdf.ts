/**
 * Debrief PDF export utility for Launch Intelligence
 * Generates a branded PDF for Interview Intelligence and Negotiation Simulator debriefs
 */

interface InterviewDebriefData {
  type: "interview";
  interviewType: string;
  targetRole: string;
  difficulty: string;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  xpEarned: number;
  date: string;
}

interface NegotiationDebriefData {
  type: "negotiation";
  scenarioTitle: string;
  outcomeScore: number;
  finalOffer: string;
  tactics: string[];
  strengths: string[];
  improvements: string[];
  xpEarned: number;
  date: string;
}

type DebriefData = InterviewDebriefData | NegotiationDebriefData;

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.55;
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= charsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function exportDebriefPdf(data: DebriefData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const MARGIN = 20;
  const CONTENT_W = W - MARGIN * 2;
  let y = 0;

  // ── Header gradient band ──────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, W, 42, "F");

  // Accent bar
  doc.setFillColor(59, 130, 246); // Sky Blue
  doc.rect(0, 0, 4, 42, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const title = data.type === "interview" ? "Interview Intelligence Debrief" : "Negotiation Simulator Debrief";
  doc.text(title, MARGIN + 4, 16);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  const subtitle = data.type === "interview"
    ? `${data.interviewType} Interview · ${data.targetRole} · ${data.difficulty}`
    : data.scenarioTitle;
  doc.text(subtitle, MARGIN + 4, 26);

  // Date + XP
  doc.setFontSize(9);
  doc.text(`${data.date}  ·  +${data.xpEarned} XP earned`, MARGIN + 4, 36);

  y = 52;

  // ── Score card ────────────────────────────────────────────────────────────
  const score = data.type === "interview" ? data.overallScore : data.outcomeScore;
  const scoreLabel = data.type === "interview" ? "Overall Score" : "Outcome Score";
  const scoreColor = score >= 80 ? [16, 185, 129] : score >= 60 ? [59, 130, 246] : [245, 158, 11];

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, "F");
  doc.setFillColor(...(scoreColor as [number, number, number]));
  doc.roundedRect(MARGIN, y, 3, 22, 1, 1, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...(scoreColor as [number, number, number]));
  doc.text(`${score}/100`, MARGIN + 10, y + 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(scoreLabel, MARGIN + 10, y + 20);

  if (data.type === "negotiation" && data.finalOffer) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Final Offer: ${data.finalOffer}`, MARGIN + 60, y + 14);
  }

  y += 30;

  // ── Section renderer ──────────────────────────────────────────────────────
  const renderSection = (heading: string, items: string[], accentColor: [number, number, number]) => {
    if (items.length === 0) return;

    // Section heading
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accentColor);
    doc.text(heading, MARGIN, y);
    y += 2;

    // Underline
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 5;

    for (const item of items) {
      // Bullet dot
      doc.setFillColor(...accentColor);
      doc.circle(MARGIN + 2, y - 1, 1, "F");

      // Item text with wrapping
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const lines = wrapText(item, CONTENT_W - 10, 9.5);
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], MARGIN + 7, y);
        y += 5;
      }
      y += 1;
    }
    y += 4;
  };

  // Strengths
  renderSection("✓  Strengths", data.strengths, [16, 185, 129]);

  // Improvements
  renderSection("△  Areas to Improve", data.improvements, [245, 158, 11]);

  // Next steps / tactics
  if (data.type === "interview") {
    renderSection("→  Next Steps", data.nextSteps, [59, 130, 246]);
  } else {
    renderSection("⚡  Negotiation Tactics Used", data.tactics, [139, 92, 246]);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = 297;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageH - 14, W, 14, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Generated by Launch Intelligence · levelnext.coach", MARGIN, pageH - 5);
  doc.text("Powered by Meta Results", W - MARGIN, pageH - 5, { align: "right" });

  // ── Save ──────────────────────────────────────────────────────────────────
  const filename = data.type === "interview"
    ? `interview-debrief-${data.interviewType.toLowerCase().replace(/\s+/g, "-")}.pdf`
    : `negotiation-debrief-${data.scenarioTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}.pdf`;

  doc.save(filename);
}
