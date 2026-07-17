import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import InfinityLoader from "@/components/InfinityLoader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Sparkles, ChevronDown, ChevronUp,
  Target, TrendingUp, AlertTriangle, Calendar, Brain,
  CheckCircle2, Lightbulb, MessageSquare, BookOpen,
  Download, FileText, Shield, BarChart2, Map, Layers, Cpu
} from "lucide-react";
import { toast } from "sonner";

// ─── Module Metadata ──────────────────────────────────────────────────────────
const CI_MODULE_META: Record<string, {
  label: string;
  tagline: string;
  color: string;
  icon: React.ReactNode;
  coachLabel: string;
  samplePdf: string;
}> = {
  CPI: {
    label: "Career Positioning Intelligence",
    tagline: "Know exactly where you stand — and where you should be.",
    color: "#D4AF37",
    icon: <Target size={18} />,
    coachLabel: "Career Strategist",
    samplePdf: "/manus-storage/cpi_sample_report_b3dd24bb.pdf",
  },
  CRS: {
    label: "Career Resilience Intelligence",
    tagline: "Bounce forward, not just back.",
    color: "#3B82F6",
    icon: <Shield size={18} />,
    coachLabel: "Resilience Coach",
    samplePdf: "/manus-storage/crs_sample_report_29d51b3d.pdf",
  },
  CMK: {
    label: "Career Marketability Intelligence",
    tagline: "How visible and valuable are you to the market?",
    color: "#22C55E",
    icon: <BarChart2 size={18} />,
    coachLabel: "Marketability Coach",
    samplePdf: "/manus-storage/cmk_sample_report_0da2bd93.pdf",
  },
  CST: {
    label: "Career Strategy Intelligence",
    tagline: "Are you playing the long game — or just reacting?",
    color: "#F59E0B",
    icon: <Map size={18} />,
    coachLabel: "Strategy Coach",
    samplePdf: "/manus-storage/cst_sample_report_262b5be8.pdf",
  },
  CAO: {
    label: "Career Optionality Intelligence",
    tagline: "How many doors are open to you right now?",
    color: "#8B5CF6",
    icon: <Layers size={18} />,
    coachLabel: "Optionality Coach",
    samplePdf: "/manus-storage/cao_sample_report_8e3de3c8.pdf",
  },
  AIR: {
    label: "AI Readiness Intelligence",
    tagline: "Are you building the career that AI cannot replace?",
    color: "#06B6D4",
    icon: <Cpu size={18} />,
    coachLabel: "AI Career Coach",
    samplePdf: "/manus-storage/air_sample_report_286d3b6b.pdf",
  },
};

// ─── Brand ────────────────────────────────────────────────────────────────────
const NAVY  = "#0A1A2F";
const IVORY = "#F8F5F0";

// ─── PDF Steps ────────────────────────────────────────────────────────────────
const PDF_STEPS = [
  { key: "narrative", label: "Generating coaching narrative…", duration: 5000 },
  { key: "building",  label: "Building your PDF…",             duration: 3000 },
  { key: "ready",     label: "Your report is ready!",          duration: 0 },
];

// ─── jsPDF Generator ─────────────────────────────────────────────────────────
async function generateCiClientPdf(
  reportData: any,
  narrative: string,
  moduleCode: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const meta = CI_MODULE_META[moduleCode] ?? CI_MODULE_META.CPI;
  const accentHex = meta.color;

  function hexToRgb(hex: string) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
  }

  const navyRgb    = { r: 10,  g: 26,  b: 47  };
  const accentRgb  = hexToRgb(accentHex);
  const charcoalRgb = { r: 45, g: 55, b: 72 };

  const zoneLabel = (reportData.zone ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const archetypeLabel = (reportData.archetype ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const completedDate = new Date(reportData.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

  // ── Cover ──
  doc.setFillColor(navyRgb.r, navyRgb.g, navyRgb.b);
  doc.rect(0, 0, W, 80, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("LevelNext", 20, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text("THE LEADERSHIP INTELLIGENCE PLATFORM", 20, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text(`${meta.label.toUpperCase()} · CAREER INSIGHT REPORT`, 20, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(reportData.participantName ?? "Leader", 20, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  const roleDate = [reportData.participantRole, completedDate].filter(Boolean).join("  ·  ");
  doc.text(roleDate, 20, 62);
  // Score circle
  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.setLineWidth(1.5);
  doc.circle(185, 40, 16, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text(String(Math.round(reportData.edgeScore ?? 0)), 185, 38, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 210, 225);
  doc.text("Score", 185, 44, { align: "center" });

  y = 90;

  // ── Zone & Archetype ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.text("YOUR CAREER PROFILE", 20, y);
  y += 7;
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.roundedRect(20, y, 60, 7, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(zoneLabel, 50, y + 4.5, { align: "center" });
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(navyRgb.r, navyRgb.g, navyRgb.b);
  doc.text(archetypeLabel, 20, y);
  y += 16;

  // ── Dimension Breakdown ──
  const dimScores = (reportData.dimensionScores ?? {}) as Record<string, number>;
  const labeledDims = Object.entries(dimScores)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), score: Math.round(v) }));

  if (labeledDims.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text("DIMENSION BREAKDOWN", 20, y);
    y += 6;
    for (const dim of labeledDims) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(charcoalRgb.r, charcoalRgb.g, charcoalRgb.b);
      doc.text(dim.label, 20, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(navyRgb.r, navyRgb.g, navyRgb.b);
      doc.text(String(dim.score), 190, y, { align: "right" });
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(20, y + 2, 160, 3, 1.5, 1.5, "F");
      const barW = Math.min(160, (dim.score / 100) * 160);
      const barColor = dim.score >= 75 ? "#16a34a" : dim.score >= 55 ? accentHex : dim.score >= 40 ? "#d97706" : "#dc2626";
      const bRgb = hexToRgb(barColor);
      doc.setFillColor(bRgb.r, bRgb.g, bRgb.b);
      doc.roundedRect(20, y + 2, barW, 3, 1.5, 1.5, "F");
      y += 11;
    }
    y += 4;
  }

  // ── Coaching Narrative ──
  if (narrative) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text("COACHING ANALYSIS", 20, y);
    y += 7;
    const paragraphs = narrative.split(/\n\n+/).filter(Boolean);
    for (const para of paragraphs) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(charcoalRgb.r, charcoalRgb.g, charcoalRgb.b);
      const lines = doc.splitTextToSize(para, 170) as string[];
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
    }
  }

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(navyRgb.r, navyRgb.g, navyRgb.b);
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

  const filename = `LevelNext_${moduleCode}_${(reportData.participantName ?? "Report").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-6 mb-4" style={{ background: IVORY, border: "1px solid #E5E7EB" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "18", color: accent }}>
          {icon}
        </div>
        <h3 className="font-bold text-base" style={{ color: NAVY }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DimensionBar({
  dim,
  accent,
  expanded,
  onToggle,
}: {
  dim: { dimensionId: string; label: string; score: number; band: string; insight: string; implication: string; quickWin: string };
  accent: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const bandColor = dim.band === "strength" ? "#16a34a" : dim.band === "developing" ? accent : "#dc2626";
  return (
    <div className="mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
        style={{ background: "#FAFAFA" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold" style={{ color: NAVY }}>{dim.label}</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-sm font-bold" style={{ color: bandColor }}>{dim.score}</span>
              <Badge className="text-xs px-2 py-0.5" style={{ background: bandColor + "18", color: bandColor, border: `1px solid ${bandColor}30` }}>
                {dim.band}
              </Badge>
              {expanded ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />}
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${dim.score}%`, background: bandColor }} />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: "#FAFAFA" }}>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: accent }}>INSIGHT</p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{dim.insight}</p>
          </div>
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: accent }}>CAREER IMPLICATION</p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{dim.implication}</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: accent + "0D", border: `1px solid ${accent}20` }}>
            <p className="text-xs font-bold mb-1" style={{ color: accent }}>14-DAY QUICK WIN</p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{dim.quickWin}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CiReport() {
  const { moduleCode, slug } = useParams<{ moduleCode: string; slug: string }>();
  const mc = (moduleCode ?? "CPI").toUpperCase();
  const meta = CI_MODULE_META[mc] ?? CI_MODULE_META.CPI;
  const accent = meta.color;

  const [expandedDims, setExpandedDims] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfStep, setPdfStep] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleDim = (id: string) =>
    setExpandedDims((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Load report row
  const { data: report, isLoading: reportLoading } = trpc.ciReport.getReport.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  // Load cached analysis
  const { data: cachedAnalysis } = trpc.ciReport.getAnalysis.useQuery(
    { reportId: report?.id ?? 0 },
    { enabled: !!report?.id }
  );

  // Sync cached analysis into local state
  useEffect(() => { if (cachedAnalysis) setAnalysis(cachedAnalysis); }, [cachedAnalysis]);

  const generateMutation = trpc.ciReport.generateAnalysis.useMutation({
    onSuccess: (data) => { setAnalysis(data); setGenerating(false); toast.success("Your analysis is ready."); },
    onError: () => { setGenerating(false); toast.error("Analysis generation failed. Please try again."); },
  });

  const handleGenerate = () => {
    if (!report?.id) return;
    setGenerating(true);
    generateMutation.mutate({ reportId: report.id });
  };

  // PDF export
  const generateNarrative = trpc.pdfReport.generateNarrative.useMutation({
    onSuccess: async (data) => {
      setPdfStep(2);
      try {
        await generateCiClientPdf(data.report, data.narrative, mc);
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
    let current = 0;
    const advance = () => {
      current += 1;
      if (current < 2) {
        setPdfStep(current);
        stepTimerRef.current = setTimeout(advance, PDF_STEPS[current]?.duration ?? 3000);
      }
    };
    stepTimerRef.current = setTimeout(advance, PDF_STEPS[0]?.duration ?? 5000);
    generateNarrative.mutate({ reportId: report.id });
  };

  const displayAnalysis = analysis ?? cachedAnalysis;

  // ── Zone colour ──
  const zoneColor = (report?.zone ?? "").includes("master") || (report?.zone ?? "").includes("optimal") ? accent
    : (report?.zone ?? "").includes("proficient") || (report?.zone ?? "").includes("solid") ? "#22C55E"
    : (report?.zone ?? "").includes("developing") || (report?.zone ?? "").includes("emerging") ? "#3B82F6"
    : (report?.zone ?? "").includes("drift") || (report?.zone ?? "").includes("anxious") ? "#F59E0B"
    : "#EF4444";

  const zoneLabel = (report?.zone ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const archetypeLabel = (report?.archetype ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Loading ──
  if (reportLoading) {
    return <InfinityLoader visible={true} label="Loading your report…" />;
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: IVORY }}>
        <p className="text-lg font-semibold" style={{ color: NAVY }}>Report not found.</p>
        <Link href="/diagnostics">
          <Button style={{ background: NAVY, color: "white" }}>Back to Diagnostics</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: IVORY }}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between gap-3" style={{ background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/diagnostics">
            <button className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold tracking-wide truncate" style={{ color: "white" }}>
              {meta.label}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge style={{ background: accent + "22", color: accent, border: `1px solid ${accent}40` }}>{mc}</Badge>
              <button
                onClick={handleDownload}
                disabled={pdfGenerating}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.97]"
                style={{ background: pdfDone ? "#16a34a" : accent, color: NAVY }}
              >
                {pdfGenerating
                  ? <><Loader2 size={12} className="animate-spin" /> {PDF_STEPS[pdfStep]?.label ?? "Working…"}</>
                  : pdfDone
                  ? <><CheckCircle2 size={12} /> Downloaded</>
                  : <><Download size={12} /> Export PDF</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PDF Step Progress Bar ── */}
      {pdfGenerating && (
        <div className="px-4 py-2 flex items-center gap-3 border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
          {PDF_STEPS.map((step, i) => {
            const isDone = i < pdfStep;
            const isActive = i === pdfStep;
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={{ background: isDone ? "#16a34a" : isActive ? accent : "rgba(255,255,255,0.1)", color: isDone || isActive ? NAVY : "rgba(255,255,255,0.4)" }}>
                  {isDone ? <CheckCircle2 size={11} /> : isActive ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: isDone ? "#86efac" : isActive ? accent : "rgba(255,255,255,0.3)" }}>{step.label}</span>
                {i < PDF_STEPS.length - 1 && <div className="w-3 h-px mx-0.5 hidden sm:block" style={{ background: isDone ? "#16a34a" : "rgba(255,255,255,0.15)" }} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-16">
        {/* ── Score Hero ── */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: NAVY }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold mb-1" style={{ color: accent }}>{meta.label.toUpperCase()}</p>
              <h1 className="text-2xl font-bold text-white mb-1">{report.participantName}</h1>
              {report.participantRole && (
                <p className="text-sm" style={{ color: "rgba(200,210,225,0.8)" }}>{report.participantRole}</p>
              )}
              <p className="text-xs mt-2" style={{ color: "rgba(200,210,225,0.5)" }}>
                {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ border: `3px solid ${accent}`, background: accent + "15" }}>
                <span className="text-3xl font-bold" style={{ color: accent }}>{Math.round(report.edgeScore ?? 0)}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "rgba(200,210,225,0.6)" }}>Score</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: zoneColor + "22", color: zoneColor, border: `1px solid ${zoneColor}40` }}>
              {zoneLabel}
            </span>
            {archetypeLabel && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
                {archetypeLabel}
              </span>
            )}
          </div>
          <p className="text-xs mt-3 italic" style={{ color: "rgba(200,210,225,0.6)" }}>{meta.tagline}</p>
        </div>

        {/* ── Dimension Scores (always shown) ── */}
        {report.dimensionScores && Object.keys(report.dimensionScores as object).length > 0 && !displayAnalysis && (
          <Section title="Dimension Scores" icon={<Target size={18} />} accent={accent}>
            {Object.entries(report.dimensionScores as Record<string, number>).map(([dimId, score]) => {
              const band = score >= 75 ? "strength" : score >= 55 ? "developing" : "gap";
              const bandColor = band === "strength" ? "#16a34a" : band === "developing" ? accent : "#dc2626";
              const label = dimId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={dimId} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: NAVY }}>{label}</span>
                    <span className="text-sm font-bold" style={{ color: bandColor }}>{score}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full" style={{ width: `${score}%`, background: bandColor }} />
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {/* ── Generate Analysis CTA ── */}
        {!displayAnalysis && (
          <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: NAVY }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: accent + "22" }}>
              <Sparkles size={22} style={{ color: accent }} />
            </div>
            <p className="font-bold text-white mb-1">Generate Your Coaching Analysis</p>
            <p className="text-xs mb-4" style={{ color: "rgba(200,210,225,0.7)" }}>
              Your {meta.coachLabel} will generate a personalised 8-section analysis of your {meta.label} profile.
            </p>
            <Button onClick={handleGenerate} disabled={generating} className="font-bold rounded-full px-6"
              style={{ background: accent, color: NAVY }}>
              {generating ? <><Loader2 size={16} className="animate-spin mr-2" />Generating…</> : <><Sparkles size={16} className="mr-2" />Generate Analysis</>}
            </Button>
          </div>
        )}

        {/* ── AI Analysis Sections ── */}
        {displayAnalysis && (
          <>
            {/* Executive Summary */}
            <Section title="Executive Summary" icon={<Brain size={18} />} accent={accent}>
              {displayAnalysis.executiveSummary.split("\n\n").map((para: string, i: number) => (
                <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: "#374151" }}>{para}</p>
              ))}
            </Section>

            {/* Score Interpretation */}
            <Section title="Score & Zone Interpretation" icon={<TrendingUp size={18} />} accent={accent}>
              {displayAnalysis.scoreInterpretation.split("\n\n").map((para: string, i: number) => (
                <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: "#374151" }}>{para}</p>
              ))}
            </Section>

            {/* Dimension Analysis */}
            <Section title="Dimension-by-Dimension Analysis" icon={<Target size={18} />} accent={accent}>
              {(displayAnalysis.dimensionAnalysis ?? []).map((dim: any) => (
                <DimensionBar
                  key={dim.dimensionId}
                  dim={dim}
                  accent={accent}
                  expanded={expandedDims.has(dim.dimensionId)}
                  onToggle={() => toggleDim(dim.dimensionId)}
                />
              ))}
            </Section>

            {/* Archetype */}
            <Section title="Your Career Archetype" icon={<Lightbulb size={18} />} accent={accent}>
              {displayAnalysis.archetypeNarrative.split("\n\n").map((para: string, i: number) => (
                <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: "#374151" }}>{para}</p>
              ))}
              <div className="mt-4 p-4 rounded-xl" style={{ background: accent + "10", border: `1px solid ${accent}30` }}>
                <p className="text-xs font-bold mb-1" style={{ color: accent }}>PATH TO NEXT LEVEL</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{displayAnalysis.archetypeGrowthPath}</p>
              </div>
            </Section>

            {/* Blind Spots */}
            {(displayAnalysis.blindSpots ?? []).length > 0 && (
              <Section title="Hidden Blind Spots" icon={<AlertTriangle size={18} />} accent="#EF4444">
                {(displayAnalysis.blindSpots ?? []).map((bs: any, i: number) => (
                  <div key={i} className="mb-4 last:mb-0 rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                    <p className="font-bold text-sm mb-1" style={{ color: "#B91C1C" }}>{bs.title}</p>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: "#374151" }}>{bs.description}</p>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#B91C1C" }}>Career Risk</p>
                    <p className="text-sm mb-2" style={{ color: "#374151" }}>{bs.careerRisk}</p>
                    <div className="rounded-lg p-3" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                      <p className="text-xs font-bold mb-1" style={{ color: "#C2410C" }}>INTERVENTION</p>
                      <p className="text-sm" style={{ color: "#374151" }}>{bs.intervention}</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* 90-Day Action Plan */}
            {(displayAnalysis.actionPlan ?? []).length > 0 && (
              <Section title="90-Day Action Plan" icon={<Calendar size={18} />} accent={accent}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(displayAnalysis.actionPlan ?? []).map((item: any, i: number) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                      <p className="text-xs font-bold mb-1" style={{ color: accent }}>{item.week}</p>
                      <p className="text-xs font-semibold mb-2" style={{ color: NAVY }}>{item.focus}</p>
                      <p className="text-sm leading-relaxed mb-2" style={{ color: "#374151" }}>{item.action}</p>
                      <div className="rounded-lg p-2" style={{ background: accent + "0D" }}>
                        <p className="text-xs" style={{ color: "#6B7280" }}>✓ {item.successMetric}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Learning Recommendations */}
            {(displayAnalysis.learningRecommendations ?? []).length > 0 && (
              <Section title="Personalised Learning Recommendations" icon={<BookOpen size={18} />} accent={accent}>
                {(displayAnalysis.learningRecommendations ?? []).map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 mb-3 last:mb-0 p-3 rounded-xl" style={{ background: "#FAFAFA", border: "1px solid #E5E7EB" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: accent + "18", color: accent }}>
                      {rec.category === "book" ? "📚" : rec.category === "podcast" ? "🎙️" : rec.category === "exercise" ? "💪" : "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: NAVY }}>{rec.title}</p>
                      <p className="text-xs mt-0.5 mb-1" style={{ color: "#6B7280" }}>{rec.description}</p>
                      <p className="text-xs font-medium" style={{ color: accent }}>{rec.timeInvestment}</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Coach Configuration */}
            {displayAnalysis.coachOpeningPrompt && (
              <Section title={`${meta.coachLabel} Configuration`} icon={<MessageSquare size={18} />} accent={accent}>
                {(displayAnalysis.coachFocusAreas ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold mb-2" style={{ color: accent }}>FOCUS AREAS</p>
                    <div className="flex flex-wrap gap-2">
                      {(displayAnalysis.coachFocusAreas ?? []).map((area: string, i: number) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: accent + "18", color: accent, border: `1px solid ${accent}30` }}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-xl p-4 mb-3" style={{ background: accent + "0D", border: `1px solid ${accent}20` }}>
                  <p className="text-xs font-bold mb-2" style={{ color: accent }}>OPENING MESSAGE</p>
                  <p className="text-sm leading-relaxed italic" style={{ color: "#374151" }}>"{displayAnalysis.coachOpeningPrompt}"</p>
                </div>
                {displayAnalysis.coachChallengeQuestion && (
                  <div className="rounded-xl p-4" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "#16a34a" }}>CHALLENGE QUESTION</p>
                    <p className="text-sm leading-relaxed font-medium" style={{ color: "#374151" }}>"{displayAnalysis.coachChallengeQuestion}"</p>
                  </div>
                )}
                <Link href="/guide">
                  <Button className="w-full mt-4 rounded-full font-bold" style={{ background: accent, color: NAVY }}>
                    <MessageSquare size={16} className="mr-2" />
                    Open {meta.coachLabel}
                  </Button>
                </Link>
              </Section>
            )}

            {/* Regenerate */}
            <div className="text-center mt-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}
                style={{ borderColor: accent + "40", color: accent }}>
                {generating ? <><Loader2 size={14} className="animate-spin mr-2" />Regenerating…</> : <><Sparkles size={14} className="mr-2" />Regenerate Analysis</>}
              </Button>
            </div>
          </>
        )}

        {/* ── Sample Report Download ── */}
        <div className="rounded-2xl p-5 flex items-center gap-4 mt-2 mb-4" style={{ background: IVORY, border: "1px solid #E5E7EB" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + "18", border: `1px solid ${accent}44` }}>
            <FileText size={18} style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: NAVY }}>View Sample Report</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>See how a completed {meta.label} report looks with full coaching narrative.</p>
          </div>
          <a href={meta.samplePdf} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="font-semibold flex-shrink-0" style={{ borderColor: "#E5E7EB", color: NAVY }}>
              <Download size={13} className="mr-1.5" /> Sample PDF
            </Button>
          </a>
        </div>

        {/* ── PDF Export CTA ── */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: NAVY }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">Export this report as a PDF</p>
              <p className="text-xs" style={{ color: "rgba(200,210,225,0.8)" }}>Includes coaching narrative. Branded by LevelNext · Meta Results.</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={pdfGenerating}
              className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-full transition-all duration-150 active:scale-[0.97] flex-shrink-0"
              style={{ background: pdfDone ? "#16a34a" : accent, color: NAVY, minWidth: 160 }}
            >
              {pdfGenerating
                ? <><Loader2 size={16} className="animate-spin" /> {PDF_STEPS[pdfStep]?.label ?? "Working…"}</>
                : pdfDone
                ? <><CheckCircle2 size={16} /> Download Again</>
                : <><Download size={16} /> Export PDF</>}
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-xs pb-4" style={{ color: "#9CA3AF" }}>
          Copyright: Meta Results Pvt. Ltd., Bangalore, India · reports@metaresults.com
        </p>
      </div>
    </div>
  );
}
