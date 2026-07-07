import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, CheckCircle } from "lucide-react";
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
  atRisk: "#EF4444",
  developing: "#F97316",
  good: "#EAB308",
  excellent: "#22C55E",
  critical: "#EF4444",
  emerging: "#F59E0B",
  capable: "#3B82F6",
  strategic: "#22C55E",
};

export default function Report() {
  const params = useParams<{ slug: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const { data: report, isLoading } = trpc.report.bySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );

  const generatePdf = trpc.pdfReport.generate.useMutation({
    onSuccess: (data) => {
      setPdfUrl(data.pdfUrl);
      setPdfGenerating(false);
      // Open in new tab
      window.open(data.pdfUrl, "_blank");
      toast.success("Your report PDF is ready.");
    },
    onError: () => {
      setPdfGenerating(false);
      toast.error("PDF generation failed. Please try again.");
    },
  });

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
      return;
    }
    if (!report?.id) return;
    setPdfGenerating(true);
    generatePdf.mutate({ reportId: report.id });
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
  const llmAnalysisText = report.llmAnalysis != null ? String(report.llmAnalysis) : null;
  const zoneColor = ZONE_COLORS[report.zone ?? ""] ?? "#22C55E";
  const dimLabels = DIMENSION_LABELS[moduleType] ?? {};

  // Filter and label dimension scores
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
        <Button
          onClick={handleDownload}
          disabled={pdfGenerating}
          size="sm"
          className="flex items-center gap-2 font-semibold"
          style={{ background: "var(--color-ln-navy)", color: "white" }}
        >
          {pdfGenerating ? (
            <><Loader2 size={14} className="animate-spin" /> Generating…</>
          ) : pdfUrl ? (
            <><CheckCircle size={14} /> Download PDF</>
          ) : (
            <><Download size={14} /> Export PDF</>
          )}
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-in space-y-6">

        {/* Cover Card */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>
            {MODULE_LABELS[moduleType] ?? moduleType} · Leadership Insight Report
          </p>
          <p className="text-xs mb-6" style={{ color: "oklch(55% 0.02 248.6)" }}>
            {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Edge circle */}
          <div
            className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 mx-auto mb-5"
            style={{ borderColor: "var(--color-ln-yellow)" }}
          >
            <span className="text-4xl font-bold leading-none" style={{ color: "var(--color-ln-yellow)" }}>
              {Math.round(report.edgeScore)}
            </span>
            <span className="text-xs mt-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Edge</span>
          </div>

          {/* Zone badge */}
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

        {/* LLM Analysis */}
        {llmAnalysisText && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "white", border: "1px solid var(--color-ln-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-ln-yellow)" }}>
              Guide's Analysis
            </p>
            <div className="text-sm leading-relaxed space-y-3" style={{ color: "var(--color-ln-text)" }}>
              {llmAnalysisText.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* PDF Export CTA */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "var(--color-ln-navy)" }}
        >
          <div>
            <p className="text-white font-semibold mb-1">Export this report as a PDF</p>
            <p className="text-xs" style={{ color: "oklch(65% 0.02 248.6)" }}>
              Includes Guide's coaching narrative. Branded by LevelNext · Meta Results.
            </p>
          </div>
          <Button
            onClick={handleDownload}
            disabled={pdfGenerating}
            className="flex items-center gap-2 font-semibold flex-shrink-0"
            style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
          >
            {pdfGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> Generating…</>
            ) : pdfUrl ? (
              <><CheckCircle size={14} /> Download PDF</>
            ) : (
              <><Download size={14} /> Export PDF</>
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs pb-8" style={{ color: "var(--color-ln-muted)" }}>
          Copyright: Meta Results Pvt. Ltd., Bangalore, India · reports@metaresults.com
        </p>
      </div>
    </div>
  );
}
