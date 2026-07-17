import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ArrowLeft, Sparkles, ChevronDown, ChevronUp,
  Target, TrendingUp, AlertTriangle, Calendar, Brain,
  CheckCircle2, Users, Compass, Shield, Lightbulb, MessageSquare, Network,
  Download, FileText
} from "lucide-react";
import { toast } from "sonner";

// ── Sample PDF CDN link for NII ───────────────────────────────────────────────────────────────
const NII_SAMPLE_PDF = "/manus-storage/nii_sample_report_placeholder.pdf";

// PDF generation steps
const PDF_STEPS = [
  { key: "narrative", label: "Generating Navigator's narrative…", duration: 5000 },
  { key: "building",  label: "Building your PDF…",              duration: 3000 },
  { key: "ready",    label: "Your report is ready!",            duration: 0 },
];

async function generateNiiClientPdf(reportData: any, narrative: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const GOLD_HEX = "#D4AF37";
  const navyRgb = { r: 10, g: 26, b: 47 };
  const goldRgb = { r: 212, g: 175, b: 55 };
  const charcoalRgb = { r: 45, g: 55, b: 72 };

  const zoneColor = (reportData.zone ?? "").includes("master") ? GOLD_HEX
    : (reportData.zone ?? "").includes("proficient") ? "#22C55E"
    : (reportData.zone ?? "").includes("developing") ? "#3B82F6"
    : (reportData.zone ?? "").includes("emerging") ? "#F59E0B"
    : "#EF4444";
  function hexToRgb(hex: string) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
  }

  const zoneRgb = hexToRgb(zoneColor);
  const zoneLabel = (reportData.zone ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const archetypeLabel = (reportData.archetype ?? "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const completedDate = new Date(reportData.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

  // Cover block
  doc.setFillColor(navyRgb.r, navyRgb.g, navyRgb.b);
  doc.rect(0, 0, W, 80, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("LevelNext", 20, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(goldRgb.r, goldRgb.g, goldRgb.b);
  doc.text("THE LEADERSHIP INTELLIGENCE PLATFORM", 20, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(goldRgb.r, goldRgb.g, goldRgb.b);
  doc.text("NAVIGATION INTELLIGENCE · LEADERSHIP INSIGHT REPORT", 20, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(reportData.participantName ?? "Leader", 20, 54);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  const roleDate = [reportData.participantRole, completedDate].filter(Boolean).join("  ·  ");
  doc.text(roleDate, 20, 62);
  doc.setDrawColor(goldRgb.r, goldRgb.g, goldRgb.b);
  doc.setLineWidth(1.5);
  doc.circle(185, 40, 16, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(goldRgb.r, goldRgb.g, goldRgb.b);
  doc.text(String(Math.round(reportData.edgeScore ?? 0)), 185, 38, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 210, 225);
  doc.text("Edge", 185, 44, { align: "center" });

  y = 90;

  // Zone & Archetype
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(goldRgb.r, goldRgb.g, goldRgb.b);
  doc.text("YOUR NAVIGATION PROFILE", 20, y);
  y += 7;
  doc.setFillColor(zoneRgb.r, zoneRgb.g, zoneRgb.b);
  doc.roundedRect(20, y, 55, 7, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(zoneLabel, 47.5, y + 4.5, { align: "center" });
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(navyRgb.r, navyRgb.g, navyRgb.b);
  doc.text(archetypeLabel, 20, y);
  y += 16;

  // Dimension Breakdown
  const dimScores = (reportData.dimensionScores ?? {}) as Record<string, number>;
  const NII_DIM_LABELS: Record<string, string> = {
    organizational_awareness: "Organizational Awareness",
    stakeholder_navigation: "Stakeholder Navigation",
    relationship_capital: "Relationship Capital",
    political_navigation: "Political Navigation",
    decision_pathway_intelligence: "Decision Pathway Intelligence",
    enterprise_alignment: "Enterprise Alignment",
    coalition_building: "Coalition Building",
    reputation_credibility: "Reputation & Credibility",
    timing_strategic_judgment: "Timing & Strategic Judgment",
    ethical_leadership_navigation: "Ethical Leadership Navigation",
  };
  const labeledDims = Object.entries(dimScores)
    .filter(([k]) => NII_DIM_LABELS[k])
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => ({ label: NII_DIM_LABELS[k] ?? k, score: Math.round(v) }));

  if (labeledDims.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(goldRgb.r, goldRgb.g, goldRgb.b);
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
      const barColor = dim.score >= 75 ? "#16a34a" : dim.score >= 55 ? "#D4AF37" : dim.score >= 40 ? "#d97706" : "#dc2626";
      const bRgb = hexToRgb(barColor);
      doc.setFillColor(bRgb.r, bRgb.g, bRgb.b);
      doc.roundedRect(20, y + 2, barW, 3, 1.5, 1.5, "F");
      y += 11;
    }
    y += 4;
  }

  // Navigator's Narrative
  if (narrative) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(goldRgb.r, goldRgb.g, goldRgb.b);
    doc.text("NAVIGATOR'S ANALYSIS", 20, y);
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

  // Footer
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

  const filename = `LevelNext_NII_${(reportData.participantName ?? "Report").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type NiiDimensionAnalysis = {
  dimensionId: string;
  label: string;
  score: number;
  band: string;
  insight: string;
  implication: string;
  quickWin: string;
};
type NiiBlindSpot = { title: string; description: string; organizationalRisk: string; intervention: string; };
type NiiActionItem = { week: string; focus: string; action: string; successMetric: string; };
type NiiStakeholderRec = { stakeholderType: string; currentGap: string; strategy: string; firstStep: string; };
type NiiAnalysis = {
  executiveSummary: string;
  scoreInterpretation: string;
  maturityNarrative: string;
  dimensionAnalysis: NiiDimensionAnalysis[];
  archetypeNarrative: string;
  maturityGrowthPath: string;
  blindSpots: NiiBlindSpot[];
  actionPlan: NiiActionItem[];
  stakeholderRecommendations: NiiStakeholderRec[];
  coachFocusAreas: string[];
  coachOpeningPrompt: string;
  coachChallengeQuestion: string;
};

// ─── Brand colours ────────────────────────────────────────────────────────────
const NAVY  = "#0A1A2F";
const GOLD  = "#D4AF37";
const IVORY = "#F8F5F0";

// ─── Zone colour map ──────────────────────────────────────────────────────────
const ZONE_COLORS: Record<string, string> = {
  navigation_gap:       "#EF4444",
  emerging_navigator:   "#F59E0B",
  developing_navigator: "#3B82F6",
  proficient_navigator: "#22C55E",
  master_navigator:     "#D4AF37",
};

// ─── Maturity level colours ───────────────────────────────────────────────────
const MATURITY_COLORS: Record<string, string> = {
  observer:    "#94A3B8",
  connector:   "#3B82F6",
  navigator:   "#8B5CF6",
  strategist:  "#22C55E",
  architect:   "#D4AF37",
};

function bandColor(band: string): string {
  if (band === "strength")   return "#22C55E";
  if (band === "developing") return "#F59E0B";
  return "#EF4444";
}
function bandLabel(band: string): string {
  if (band === "strength")   return "Strength";
  if (band === "developing") return "Developing";
  return "Gap";
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children, accent = NAVY }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: accent + "18", color: accent }}>
          {icon}
        </div>
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, zoneColor }: { score: number; zoneColor: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={zoneColor} strokeWidth="10"
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill={NAVY}>{score}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#6B7280">NII Score</text>
    </svg>
  );
}

// ─── Dimension bar ────────────────────────────────────────────────────────────
function DimensionBar({ dim, expanded, onToggle }: {
  dim: NiiDimensionAnalysis; expanded: boolean; onToggle: () => void;
}) {
  const color = bandColor(dim.band);
  return (
    <div className="border rounded-xl mb-3 overflow-hidden" style={{ borderColor: "#E5E7EB", background: "white" }}>
      <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm" style={{ color: NAVY }}>{dim.label}</span>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: color + "18", color }}>{bandLabel(dim.band)}</span>
              <span className="text-sm font-bold" style={{ color }}>{dim.score}</span>
              {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${dim.score}%`, background: color }} />
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "#F3F4F6", background: IVORY }}>
          <p className="text-sm mt-3 mb-2 leading-relaxed" style={{ color: "#374151" }}>{dim.insight}</p>
          <p className="text-sm mb-3 leading-relaxed text-gray-500 italic">{dim.implication}</p>
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: GOLD + "12" }}>
            <Target size={14} className="mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
            <p className="text-xs font-medium" style={{ color: NAVY }}><span className="font-bold">Quick Win:</span> {dim.quickWin}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NiiReport() {
  const { slug } = useParams<{ slug: string }>();
  const [expandedDims, setExpandedDims] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<NiiAnalysis | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [pdfStep, setPdfStep] = useState(0);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: report, isLoading: reportLoading } = trpc.assessment.getReport.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const { data: cachedAnalysis } = trpc.niiReport.getAnalysis.useQuery(
    { reportId: report?.id ?? 0 },
    { enabled: !!report?.id }
  );

  // Use cached analysis if available
  const displayAnalysis = analysis ?? cachedAnalysis ?? null;

  const generateMutation = trpc.niiReport.generateAnalysis.useMutation({
    onSuccess: (data) => { setAnalysis(data); setGenerating(false); toast.success("Your Navigation Intelligence analysis is ready."); },
    onError: () => { setGenerating(false); toast.error("Analysis generation failed. Please try again."); },
  });

  const generateNarrative = trpc.pdfReport.generateNarrative.useMutation({
    onSuccess: async (data) => {
      setPdfStep(2);
      try {
        await generateNiiClientPdf(data.report, data.narrative);
        setPdfDone(true);
        toast.success("Your NII PDF has been downloaded.");
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

  const handleGenerate = () => {
    if (!report?.id) return;
    setGenerating(true);
    generateMutation.mutate({ reportId: report.id });
  };

  const toggleDim = (id: string) => {
    setExpandedDims((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (reportLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: IVORY }}>
        <Loader2 className="animate-spin" style={{ color: GOLD }} size={32} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: IVORY }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: NAVY }}>Report not found</p>
          <Link href="/diagnostics"><Button variant="outline">Back to Diagnostics</Button></Link>
        </div>
      </div>
    );
  }

  const zoneId = report.zone ?? "emerging_navigator";
  const zoneColor = ZONE_COLORS[zoneId] ?? GOLD;
  const maturityId = (report as any).maturityLevelId ?? "observer";
  const maturityColor = MATURITY_COLORS[maturityId] ?? GOLD;
  const maturityName = (report as any).maturityLevelName ?? maturityId.charAt(0).toUpperCase() + maturityId.slice(1);
  const maturityNumber = (report as any).maturityLevelNumber ?? 1;
  const zoneLabel = zoneId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="min-h-screen pb-16" style={{ background: IVORY }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ background: NAVY, borderColor: GOLD + "40" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/diagnostics">
            <button className="flex items-center gap-2 text-sm font-medium" style={{ color: GOLD }}>
              <ArrowLeft size={16} /> Diagnostics
            </button>
          </Link>
          <img src="/manus-storage/LevelNext_logo_transparent_88851f5c.png" alt="LevelNext" className="h-8 w-auto object-contain" />
          <div className="flex items-center gap-2">
            <Badge style={{ background: GOLD + "22", color: GOLD, border: `1px solid ${GOLD}40` }}>NII</Badge>
            <button
              onClick={handleDownload}
              disabled={pdfGenerating}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.97]"
              style={{ background: pdfDone ? "#16a34a" : GOLD, color: NAVY }}
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

      {/* PDF Step Progress Bar */}
      {pdfGenerating && (
        <div className="px-4 py-2 flex items-center gap-3 border-b" style={{ background: NAVY, borderColor: "rgba(255,255,255,0.1)" }}>
          {PDF_STEPS.map((step, i) => {
            const isDone = i < pdfStep;
            const isActive = i === pdfStep;
            return (
              <div key={step.key} className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={{ background: isDone ? "#16a34a" : isActive ? GOLD : "rgba(255,255,255,0.1)", color: isDone || isActive ? NAVY : "rgba(255,255,255,0.4)" }}>
                  {isDone ? <CheckCircle2 size={11} /> : isActive ? <Loader2 size={11} className="animate-spin" /> : <FileText size={11} />}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: isDone ? "#86efac" : isActive ? GOLD : "rgba(255,255,255,0.3)" }}>{step.label}</span>
                {i < PDF_STEPS.length - 1 && <div className="w-3 h-px mx-0.5 hidden sm:block" style={{ background: isDone ? "#16a34a" : "rgba(255,255,255,0.15)" }} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Hero score card */}
        <div className="rounded-2xl p-6 mb-8 text-white" style={{ background: NAVY }}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={report.edgeScore ?? 0} zoneColor={zoneColor} />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: GOLD }}>
                Navigation Intelligence™
              </p>
              <h1 className="text-2xl font-bold mb-1" style={{ color: IVORY }}>
                {report.participantName}
              </h1>
              <p className="text-sm mb-3" style={{ color: "#94A3B8" }}>
                {report.participantRole ?? "Leader"} {report.organisation ? `· ${report.organisation}` : ""}
              </p>
              {/* Zone badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                style={{ background: zoneColor + "22", border: `1px solid ${zoneColor}55` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: zoneColor }} />
                <span className="text-xs font-bold" style={{ color: zoneColor }}>{zoneLabel}</span>
              </div>
              {/* Maturity level */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs" style={{ color: "#94A3B8" }}>Navigation Maturity:</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: maturityColor + "22", border: `1px solid ${maturityColor}55` }}>
                  <span className="text-xs font-bold" style={{ color: maturityColor }}>
                    Level {maturityNumber} — {maturityName}
                  </span>
                </div>
              </div>
              {/* Maturity progress dots */}
              <div className="flex items-center gap-1.5 mt-3">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className="w-6 h-1.5 rounded-full transition-all"
                    style={{ background: lvl <= maturityNumber ? maturityColor : "#374151" }} />
                ))}
                <span className="text-xs ml-1" style={{ color: "#6B7280" }}>
                  {["Observer", "Connector", "Navigator", "Strategist", "Architect"][maturityNumber - 1] ?? ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate AI analysis CTA */}
        {!displayAnalysis && (
          <div className="rounded-2xl p-6 mb-8 text-center border-2 border-dashed" style={{ borderColor: GOLD + "55", background: GOLD + "08" }}>
            <Sparkles size={28} className="mx-auto mb-3" style={{ color: GOLD }} />
            <h3 className="font-bold text-lg mb-1" style={{ color: NAVY }}>Generate Your Full NII Analysis</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your Navigator will analyse your dimension profile and generate a personalised 8-section report — including blind spots, 90-day action plan, and stakeholder strategy.
            </p>
            <Button onClick={handleGenerate} disabled={generating}
              className="rounded-full px-6 font-bold"
              style={{ background: GOLD, color: NAVY }}>
              {generating ? <><Loader2 size={16} className="animate-spin mr-2" />Generating…</> : <><Sparkles size={16} className="mr-2" />Generate Analysis</>}
            </Button>
          </div>
        )}

        {/* Archetype card */}
        {report.archetype && (
          <div className="rounded-2xl p-5 mb-8" style={{ background: NAVY }}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: GOLD }}>Your Navigation Archetype</p>
            <h2 className="text-xl font-bold mb-1" style={{ color: IVORY }}>
              {report.archetype.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </h2>
            {(report as any).archetypeTagline && (
              <p className="text-sm italic" style={{ color: "#94A3B8" }}>{(report as any).archetypeTagline}</p>
            )}
          </div>
        )}

        {/* AI Analysis sections */}
        {displayAnalysis && (
          <>
            {/* Executive Summary */}
            <Section title="Executive Summary" icon={<Brain size={18} />} accent={NAVY}>
              {displayAnalysis.executiveSummary.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: "#374151" }}>{para}</p>
              ))}
            </Section>

            {/* Score Interpretation */}
            <Section title="Score & Zone Interpretation" icon={<Compass size={18} />} accent={GOLD}>
              {displayAnalysis.scoreInterpretation.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: "#374151" }}>{para}</p>
              ))}
              <div className="mt-4 p-4 rounded-xl" style={{ background: maturityColor + "12", border: `1px solid ${maturityColor}30` }}>
                <p className="text-xs font-bold mb-1" style={{ color: maturityColor }}>
                  Maturity Level {maturityNumber}: {maturityName}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{displayAnalysis.maturityNarrative}</p>
              </div>
            </Section>

            {/* Dimension Analysis */}
            <Section title="Dimension-by-Dimension Analysis" icon={<Target size={18} />} accent={NAVY}>
              {displayAnalysis.dimensionAnalysis.map((dim) => (
                <DimensionBar key={dim.dimensionId} dim={dim}
                  expanded={expandedDims.has(dim.dimensionId)}
                  onToggle={() => toggleDim(dim.dimensionId)} />
              ))}
            </Section>

            {/* Archetype Narrative */}
            <Section title="Your Navigation Archetype" icon={<Network size={18} />} accent={GOLD}>
              {displayAnalysis.archetypeNarrative.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: "#374151" }}>{para}</p>
              ))}
              <div className="mt-4 p-4 rounded-xl" style={{ background: GOLD + "10", border: `1px solid ${GOLD}30` }}>
                <p className="text-xs font-bold mb-1" style={{ color: GOLD }}>Path to Next Maturity Level</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{displayAnalysis.maturityGrowthPath}</p>
              </div>
            </Section>

            {/* Blind Spots */}
            <Section title="Organizational Blind Spots" icon={<AlertTriangle size={18} />} accent="#EF4444">
              {displayAnalysis.blindSpots.map((bs, i) => (
                <div key={i} className="rounded-xl p-5 mb-4 border" style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}>
                  <p className="font-bold text-sm mb-2" style={{ color: "#991B1B" }}>{bs.title}</p>
                  <p className="text-sm mb-2 leading-relaxed" style={{ color: "#374151" }}>{bs.description}</p>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-red-500" />
                    <p className="text-xs" style={{ color: "#6B7280" }}><span className="font-semibold text-red-700">Org Risk:</span> {bs.organizationalRisk}</p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg mt-2" style={{ background: "#D4AF3712" }}>
                    <Lightbulb size={13} className="mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                    <p className="text-xs font-medium" style={{ color: NAVY }}><span className="font-bold">Intervention:</span> {bs.intervention}</p>
                  </div>
                </div>
              ))}
            </Section>

            {/* 90-Day Action Plan */}
            <Section title="90-Day Navigation Action Plan" icon={<Calendar size={18} />} accent="#8B5CF6">
              <div className="space-y-3">
                {displayAnalysis.actionPlan.map((item, i) => (
                  <div key={i} className="rounded-xl p-4 border" style={{ borderColor: "#E5E7EB", background: "white" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#8B5CF622", color: "#8B5CF6" }}>{item.week}</span>
                      <span className="text-sm font-semibold" style={{ color: NAVY }}>{item.focus}</span>
                    </div>
                    <p className="text-sm mb-2 leading-relaxed" style={{ color: "#374151" }}>{item.action}</p>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-green-500" />
                      <p className="text-xs" style={{ color: "#6B7280" }}><span className="font-semibold">Success metric:</span> {item.successMetric}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Stakeholder Recommendations */}
            <Section title="Stakeholder & Coalition Strategy" icon={<Users size={18} />} accent="#0D9488">
              {displayAnalysis.stakeholderRecommendations.map((rec, i) => (
                <div key={i} className="rounded-xl p-5 mb-4 border" style={{ borderColor: "#99F6E4", background: "#F0FDFA" }}>
                  <p className="font-bold text-sm mb-2" style={{ color: "#0F766E" }}>{rec.stakeholderType}</p>
                  <p className="text-xs mb-2" style={{ color: "#6B7280" }}><span className="font-semibold">Current Gap:</span> {rec.currentGap}</p>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: "#374151" }}>{rec.strategy}</p>
                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#0D948812" }}>
                    <TrendingUp size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#0D9488" }} />
                    <p className="text-xs font-medium" style={{ color: NAVY }}><span className="font-bold">First Step:</span> {rec.firstStep}</p>
                  </div>
                </div>
              ))}
            </Section>

            {/* Navigator AI Coach Config */}
            <Section title="Your Navigator AI Coach" icon={<MessageSquare size={18} />} accent={GOLD}>
              <div className="rounded-2xl p-6" style={{ background: NAVY }}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD }}>
                  Focus Areas
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {displayAnalysis.coachFocusAreas.map((area, i) => (
                    <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: GOLD + "22", color: GOLD, border: `1px solid ${GOLD}44` }}>
                      {area}
                    </span>
                  ))}
                </div>
                <div className="p-4 rounded-xl mb-4" style={{ background: "#FFFFFF10" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: GOLD }}>Opening Message from Your Navigator</p>
                  <p className="text-sm leading-relaxed italic" style={{ color: "#CBD5E1" }}>
                    "{displayAnalysis.coachOpeningPrompt}"
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: GOLD + "15" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: GOLD }}>
                    <Shield size={12} className="inline mr-1" />Challenge Question
                  </p>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: IVORY }}>
                    "{displayAnalysis.coachChallengeQuestion}"
                  </p>
                </div>
                <Link href="/guide">
                  <Button className="w-full mt-4 rounded-full font-bold"
                    style={{ background: GOLD, color: NAVY }}>
                    <MessageSquare size={16} className="mr-2" />
                    Open Navigator Coach
                  </Button>
                </Link>
              </div>
            </Section>
          </>
        )}

        {/* Dimension scores (always shown, even without LLM analysis) */}
        {!displayAnalysis && report.dimensionScores && (
          <Section title="Dimension Scores" icon={<Target size={18} />} accent={NAVY}>
            {Object.entries(report.dimensionScores as Record<string, number>).map(([dimId, score]) => {
              const band = score >= 75 ? "strength" : score >= 50 ? "developing" : "gap";
              const color = bandColor(band);
              const label = dimId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                <div key={dimId} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: NAVY }}>{label}</span>
                    <span className="text-sm font-bold" style={{ color }}>{score}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full" style={{ width: `${score}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </Section>
        )}
        {/* Sample Report Download */}
        <div className="rounded-2xl p-5 flex items-center gap-4 mt-4" style={{ background: IVORY, border: "1px solid #E5E7EB" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GOLD + "18", border: `1px solid ${GOLD}44` }}>
            <FileText size={18} style={{ color: GOLD }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: NAVY }}>View Sample Report</p>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>See how a completed Navigation Intelligence report looks with full coaching narrative.</p>
          </div>
          <a href={NII_SAMPLE_PDF} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="font-semibold flex-shrink-0" style={{ borderColor: "#E5E7EB", color: NAVY }}>
              <Download size={13} className="mr-1.5" /> Sample PDF
            </Button>
          </a>
        </div>

        {/* PDF Export CTA */}
        <div className="rounded-2xl p-6 mt-4 mb-8" style={{ background: NAVY }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold mb-1">Export this report as a PDF</p>
              <p className="text-xs" style={{ color: "rgba(200,210,225,0.8)" }}>Includes Navigator's coaching narrative. Branded by LevelNext · Meta Results.</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={pdfGenerating}
              className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-full transition-all duration-150 active:scale-[0.97] flex-shrink-0"
              style={{ background: pdfDone ? "#16a34a" : GOLD, color: NAVY, minWidth: 160 }}
            >
              {pdfGenerating
                ? <><Loader2 size={16} className="animate-spin" /> {PDF_STEPS[pdfStep]?.label ?? "Working…"}</>
                : pdfDone
                ? <><CheckCircle2 size={16} /> Download Again</>
                : <><Download size={16} /> Export PDF</>}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs pb-8" style={{ color: "#9CA3AF" }}>
          Copyright: Meta Results Pvt. Ltd., Bangalore, India · reports@metaresults.com
        </p>
      </div>
    </div>
  );
}
