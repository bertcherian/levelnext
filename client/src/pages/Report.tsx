import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, CheckCircle, FileText, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
};

const DIMENSION_LABELS: Record<string, Record<string, string>> = {
  ECI: {
    strategic_communication: "Strategic Communication",
    executive_presence: "Executive Presence",
    influence_stakeholder: "Influence & Stakeholder",
    narrative_visibility: "Narrative & Visibility",
    conversational_leadership: "Conversational Leadership",
    strategic_clarity: "Strategic Clarity",
    message_architecture: "Message Architecture",
    gravitas_composure: "Gravitas & Composure",
    executive_presence_signals: "Executive Presence Signals",
    stakeholder_influence: "Stakeholder Influence",
    political_intelligence: "Political Intelligence",
    narrative_construction: "Narrative Construction",
    executive_visibility: "Executive Visibility",
    accountability_conversations: "Accountability Conversations",
    psychological_safety_creation: "Psychological Safety Creation",
  },
  LII: {
    trust_capital: "Trust Capital",
    decision_influence: "Decision Influence",
    stakeholder_alignment: "Stakeholder Alignment",
    coalition_building: "Coalition Building",
    organizational_navigation: "Organisational Navigation",
    inspirational_leadership: "Inspirational Leadership",
    change_mobilization: "Change Mobilisation",
    conflict_resistance: "Conflict Resilience",
    adaptive_influence: "Adaptive Influence",
    leadership_reputation: "Leadership Reputation",
  },
  GCC: {
    strategic_influence: "Strategic Influence",
    operating_excellence: "Operating Excellence",
    leadership_talent: "Leadership & Talent",
    innovation_ai: "Innovation & AI",
    enterprise_alignment: "Enterprise Alignment",
  },
};

const ZONE_COLORS: Record<string, string> = {
  emerging_voice: "#EF4444",
  developing_communicator: "#F97316",
  capable_communicator: "#EAB308",
  executive_communicator: "#22C55E",
  elite_communicator: "#10B981",
  high_performer: "#22C55E",
  atRisk: "#EF4444",
  developing: "#F97316",
  good: "#EAB308",
  excellent: "#22C55E",
  critical: "#EF4444",
  emerging: "#F59E0B",
  capable: "#3B82F6",
  strategic: "#22C55E",
};

const NAVY = "#12345A";
const YELLOW = "#F2B705";
const CHARCOAL = "#2D3748";

// PDF generation steps
const PDF_STEPS = [
  { key: "narrative", label: "Generating Guide's narrative…", icon: Sparkles, duration: 5000 },
  { key: "building",  label: "Building your PDF…",            icon: FileText,  duration: 3000 },
  { key: "uploading", label: "Finalising report…",            icon: Upload,    duration: 1500 },
  { key: "ready",     label: "Your report is ready!",         icon: CheckCircle, duration: 0 },
];

async function generateClientPdf(reportData: any, narrative: string): Promise<void> {
  // Dynamically import jspdf to keep bundle lean
  const { jsPDF } = await import("jspdf");

  const moduleType = reportData.moduleType as string;
  const dimLabels = DIMENSION_LABELS[moduleType] ?? {};
  const dimScores = (reportData.dimensionScores ?? {}) as Record<string, number>;
  const zoneColor = ZONE_COLORS[reportData.zone ?? ""] ?? "#22C55E";

  const labeledDimensions = Object.entries(dimScores)
    .filter(([k]) => dimLabels[k])
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({
      label: dimLabels[k] ?? k.replace(/_/g, " "),
      score: moduleType === "LII" ? Math.round(((v - 1) / 4) * 100) : Math.round(v),
    }));

  const archetypeLabel = (reportData.archetype ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const zoneLabel = (reportData.zone ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const completedDate = new Date(reportData.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; // A4 width mm
  let y = 0;

  // ── Cover block ──────────────────────────────────────────────────────────────
  doc.setFillColor(NAVY);
  doc.rect(0, 0, W, 80, "F");

  // LevelNext wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("LevelNext", 20, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(242, 183, 5); // yellow
  doc.text("THE LEADERSHIP INTELLIGENCE PLATFORM", 20, 29);

  // Module label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(242, 183, 5);
  doc.text(`${MODULE_LABELS[moduleType] ?? moduleType} · Leadership Insight Report`.toUpperCase(), 20, 42);

  // Participant name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(reportData.participantName ?? "Leader", 20, 54);

  // Role + date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  const roleDate = [reportData.participantRole, completedDate].filter(Boolean).join("  ·  ");
  doc.text(roleDate, 20, 62);

  // Edge circle
  doc.setDrawColor(242, 183, 5);
  doc.setLineWidth(1.5);
  doc.circle(185, 40, 16, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(242, 183, 5);
  doc.text(String(Math.round(reportData.edgeScore ?? 0)), 185, 38, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 210, 225);
  doc.text("Edge", 185, 44, { align: "center" });

  y = 90;

  // ── Zone & Archetype ─────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(242, 183, 5);
  doc.text("YOUR LEADERSHIP PROFILE", 20, y);
  y += 7;

  // Zone badge
  const zoneRgb = hexToRgb(zoneColor);
  doc.setFillColor(zoneRgb.r, zoneRgb.g, zoneRgb.b);
  doc.roundedRect(20, y, 50, 7, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(zoneLabel, 45, y + 4.5, { align: "center" });
  y += 11;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(NAVY);
  doc.text(archetypeLabel, 20, y);
  y += 16;

  // ── Dimension Breakdown ───────────────────────────────────────────────────────
  if (labeledDimensions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(242, 183, 5);
    doc.text("DIMENSION BREAKDOWN", 20, y);
    y += 6;

    for (const dim of labeledDimensions) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(CHARCOAL);
      doc.text(dim.label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(NAVY);
      doc.text(String(dim.score), 190, y, { align: "right" });

      // Bar background
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(20, y + 2, 160, 3, 1.5, 1.5, "F");

      // Bar fill
      const barW = Math.min(160, (dim.score / 100) * 160);
      const barColor = dim.score >= 75 ? "#16a34a" : dim.score >= 55 ? YELLOW : dim.score >= 40 ? "#d97706" : "#dc2626";
      const barRgb = hexToRgb(barColor);
      doc.setFillColor(barRgb.r, barRgb.g, barRgb.b);
      doc.roundedRect(20, y + 2, barW, 3, 1.5, 1.5, "F");

      y += 11;
    }
    y += 4;
  }

  // ── Guide's Narrative ─────────────────────────────────────────────────────────
  if (narrative) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(242, 183, 5);
    doc.text("GUIDE'S ANALYSIS", 20, y);
    y += 7;

    const paragraphs = narrative.split(/\n\n+/).filter(Boolean);
    for (const para of paragraphs) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(CHARCOAL);
      const lines = doc.splitTextToSize(para, 170) as string[];
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(NAVY);
    doc.rect(0, 282, W, 15, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("LevelNext — The Leadership Intelligence Platform", 20, 289);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(200, 210, 225);
    doc.text("Copyright: Meta Results Pvt. Ltd., Bangalore, India  ·  reports@metaresults.com", 190, 289, { align: "right" });
  }

  const filename = `LevelNext_${moduleType}_${(reportData.participantName ?? "Report").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 18, g: 52, b: 90 };
}

export default function Report() {
  const params = useParams<{ slug: string }>();
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfStep, setPdfStep] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: report, isLoading } = trpc.report.bySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );

  const generateNarrative = trpc.pdfReport.generateNarrative.useMutation({
    onSuccess: async (data) => {
      setPdfStep(2); // "Finalising report…"
      try {
        await generateClientPdf(data.report, data.narrative);
        setPdfStep(3); // "Ready!"
        setPdfDone(true);
        toast.success("Your PDF has been downloaded.");
      } catch {
        toast.error("PDF generation failed. Please try again.");
      } finally {
        setTimeout(() => setPdfGenerating(false), 1000);
      }
    },
    onError: () => {
      setPdfGenerating(false);
      setPdfStep(0);
      toast.error("Failed to generate narrative. Please try again.");
    },
  });

  const handleDownload = () => {
    if (!report?.id) return;
    setPdfGenerating(true);
    setPdfDone(false);
    setPdfStep(0);

    // Advance through visual steps while waiting for LLM
    let current = 0;
    const advance = () => {
      current += 1;
      if (current < 2) { // stop at step 1 ("Building your PDF…") — step 2 fires on success
        setPdfStep(current);
        stepTimerRef.current = setTimeout(advance, PDF_STEPS[current]?.duration ?? 3000);
      }
    };
    stepTimerRef.current = setTimeout(advance, PDF_STEPS[0]?.duration ?? 5000);

    generateNarrative.mutate({ reportId: report.id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ln-ivory)" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-navy)" }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--color-ln-ivory)" }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Report not found</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>
          This Insight report may have been removed or the link is incorrect.
        </p>
        <Link href="/">
          <Button style={{ background: "var(--color-ln-navy)", color: "white" }}>Go to LevelNext</Button>
        </Link>
      </div>
    );
  }

  const moduleType = report.moduleType as string;
  const dimensionScores = (report.dimensionScores ?? null) as Record<string, number> | null;
  const llmAnalysis = report.llmAnalysis as any;
  const llmSummary: string | null =
    llmAnalysis && typeof llmAnalysis === "object" && "summary" in llmAnalysis
      ? String(llmAnalysis.summary)
      : typeof llmAnalysis === "string"
      ? llmAnalysis
      : null;
  const llmStrengths: string[] =
    llmAnalysis && typeof llmAnalysis === "object" && Array.isArray(llmAnalysis.strengths)
      ? llmAnalysis.strengths
      : [];
  const llmGrowthEdges: string[] =
    llmAnalysis && typeof llmAnalysis === "object" && Array.isArray(llmAnalysis.growthEdges)
      ? llmAnalysis.growthEdges
      : [];
  const llmThirtyDay: string | null =
    llmAnalysis && typeof llmAnalysis === "object" && "thirtyDayPlan" in llmAnalysis
      ? String(llmAnalysis.thirtyDayPlan)
      : null;

  const zoneColor = ZONE_COLORS[report.zone ?? ""] ?? "#22C55E";
  const dimLabels = DIMENSION_LABELS[moduleType] ?? {};

  const labeledDimensions = dimensionScores
    ? Object.entries(dimensionScores)
        .filter(([k]) => dimLabels[k])
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => ({
          label: dimLabels[k] ?? k.replace(/_/g, " "),
          score: moduleType === "LII" ? Math.round(((v - 1) / 4) * 100) : Math.round(v),
        }))
    : [];

  const archetypeLabel = report.archetype
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const zoneLabel = report.zone
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const PdfButton = ({ style, large }: { style?: React.CSSProperties; large?: boolean }) => (
    <Button
      onClick={handleDownload}
      disabled={pdfGenerating}
      size={large ? "default" : "sm"}
      className={`flex items-center gap-2 font-semibold transition-all duration-200 ${
        !pdfGenerating && !pdfDone ? 'shadow-[0_0_0_0_rgba(242,183,5,0.4)] hover:shadow-[0_0_0_6px_rgba(242,183,5,0.15)] active:scale-[0.97]' : ''
      }`}
      style={{ minWidth: large ? 180 : 150, ...style }}
    >
      {pdfGenerating ? (
        <><Loader2 size={large ? 16 : 14} className="animate-spin" /> {PDF_STEPS[pdfStep]?.label ?? "Working…"}</>
      ) : pdfDone ? (
        <><CheckCircle size={large ? 16 : 14} /> Download Again</>
      ) : (
        <><Download size={large ? 16 : 14} /> Export PDF</>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Header */}
      <header
        className="px-6 py-4 flex items-center justify-between border-b sticky top-0 z-10"
        style={{ background: "white", borderColor: "var(--color-ln-border)" }}
      >
        <Link href="/insights">
          <button className="flex items-center gap-2 text-sm" style={{ color: "var(--color-ln-muted)" }}>
            <ArrowLeft size={16} /> Back to Insights
          </button>
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>LevelNext</p>
          <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>The Leadership Intelligence Platform</p>
        </div>
        <PdfButton style={{ background: pdfDone ? "#16a34a" : "var(--color-ln-navy)", color: "white" }} />
      </header>

      {/* PDF Step Progress Bar */}
      {pdfGenerating && (
        <div
          className="px-6 py-3 flex items-center gap-3 border-b"
          style={{ background: "var(--color-ln-navy)", borderColor: "rgba(255,255,255,0.1)" }}
        >
          {PDF_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isDone = i < pdfStep;
            const isActive = i === pdfStep;
            return (
              <div key={step.key} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={{
                    background: isDone ? "#16a34a" : isActive ? "var(--color-ln-yellow)" : "rgba(255,255,255,0.1)",
                    color: isDone || isActive ? NAVY : "rgba(255,255,255,0.4)",
                  }}
                >
                  {isDone ? <CheckCircle size={12} /> : isActive ? <Loader2 size={12} className="animate-spin" /> : <StepIcon size={12} />}
                </div>
                <span
                  className="text-xs hidden sm:block"
                  style={{ color: isDone ? "#86efac" : isActive ? "var(--color-ln-yellow)" : "rgba(255,255,255,0.3)" }}
                >
                  {step.label.replace("…", "")}
                </span>
                {i < PDF_STEPS.length - 1 && (
                  <div className="w-4 h-px mx-1 hidden sm:block" style={{ background: isDone ? "#16a34a" : "rgba(255,255,255,0.15)" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Cover Card */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>
            {MODULE_LABELS[moduleType] ?? moduleType} · Leadership Insight Report
          </p>
          <p className="text-xs mb-6" style={{ color: "oklch(55% 0.02 248.6)" }}>
            {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <div
            className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 mx-auto mb-5"
            style={{ borderColor: "var(--color-ln-yellow)" }}
          >
            <span className="text-4xl font-bold leading-none" style={{ color: "var(--color-ln-yellow)" }}>
              {Math.round(report.edgeScore)}
            </span>
            <span className="text-xs mt-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Edge</span>
          </div>

          {zoneLabel && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
              style={{ background: `${zoneColor}22`, color: zoneColor, border: `1px solid ${zoneColor}44` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: zoneColor }} />
              {zoneLabel}
            </div>
          )}

          {archetypeLabel && (
            <p className="text-xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>{archetypeLabel}</p>
          )}
          <p className="text-xs mt-1" style={{ color: "oklch(55% 0.02 248.6)" }}>
            {report.participantName}
            {report.participantRole ? ` · ${report.participantRole}` : ""}
          </p>
        </div>

        {/* Strengths & Growth Edges */}
        {(llmStrengths.length > 0 || llmGrowthEdges.length > 0) && (
          <div
            className="rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
            style={{ background: "white", border: "1px solid var(--color-ln-border)" }}
          >
            {llmStrengths.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-yellow)" }}>
                  Strengths
                </p>
                <ul className="space-y-2">
                  {llmStrengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-ln-text)" }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {llmGrowthEdges.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-yellow)" }}>
                  Growth Edges
                </p>
                <ul className="space-y-2">
                  {llmGrowthEdges.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-ln-text)" }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-ln-yellow)" }} />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Dimension Breakdown */}
        {labeledDimensions.length > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "1px solid var(--color-ln-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: "var(--color-ln-yellow)" }}>
              Dimension Breakdown
            </p>
            <div className="space-y-4">
              {labeledDimensions.map(({ label, score }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{label}</span>
                    <span className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>{score}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-ln-border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, score)}%`,
                        background:
                          score >= 75 ? "#16a34a" :
                          score >= 55 ? "var(--color-ln-yellow)" :
                          score >= 40 ? "#d97706" : "#dc2626",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guide's Analysis (from seeded llmAnalysis) */}
        {llmSummary && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "1px solid var(--color-ln-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-ln-yellow)" }}>
              Guide's Analysis
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-text)" }}>{llmSummary}</p>
          </div>
        )}

        {/* 30-Day Plan */}
        {llmThirtyDay && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--color-ln-ivory)", border: `2px solid var(--color-ln-yellow)` }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-yellow)" }}>
              Your 30-Day Leadership Focus
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-ln-navy)" }}>{llmThirtyDay}</p>
          </div>
        )}

        {/* PDF Export CTA */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-ln-navy)" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">Export this report as a PDF</p>
              <p className="text-xs" style={{ color: "oklch(65% 0.02 248.6)" }}>
                Includes Guide's coaching narrative. Branded by LevelNext · Meta Results.
              </p>
            </div>
            <PdfButton large style={{ background: pdfDone ? "#16a34a" : "var(--color-ln-yellow)", color: NAVY }} />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs pb-8" style={{ color: "var(--color-ln-muted)" }}>
          Copyright: Meta Results Pvt. Ltd., Bangalore, India · reports@metaresults.com
        </p>
      </div>
    </div>
  );
}
