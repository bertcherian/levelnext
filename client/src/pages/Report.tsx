import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

const LOGO_URL = "/manus-storage/levelnext-logo_525d7189.png";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
};

export default function Report() {
  const params = useParams<{ slug: string }>();
  const { data: report, isLoading } = trpc.report.bySlug.useQuery({ slug: params.slug ?? "" }, { enabled: !!params.slug });

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
        <img src={LOGO_URL} alt="LevelNext" className="h-10 w-auto mb-8" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ln-navy)" }}>Report not found</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>This Insight report may have been removed or the link is incorrect.</p>
        <Link href="/"><Button style={{ background: "var(--color-ln-navy)", color: "white" }}>Go to LevelNext</Button></Link>
      </div>
    );
  }

  const dimensionScores = (report.dimensionScores ?? null) as Record<string, number> | null;
  const llmAnalysisText = report.llmAnalysis != null ? String(report.llmAnalysis) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b"
        style={{ background: "white", borderColor: "var(--color-ln-border)" }}>
        <Link href="/">
          <button className="flex items-center gap-2 text-sm" style={{ color: "var(--color-ln-muted)" }}>
            <ArrowLeft size={16} /> LevelNext
          </button>
        </Link>
        <img src={LOGO_URL} alt="LevelNext" className="h-7 w-auto" />
        <div />
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
        {/* Cover */}
        <div className="rounded-2xl p-8 mb-8 text-center" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-ln-yellow)" }}>
            Leadership Insight Report
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">{MODULE_LABELS[report.moduleType] ?? report.moduleType}</h1>
          <p className="text-sm mb-6" style={{ color: "oklch(65% 0.02 248.6)" }}>
            {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 mx-auto"
            style={{ borderColor: "var(--color-ln-yellow)" }}>
            <span className="text-3xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>{Math.round(report.edgeScore)}</span>
            <span className="text-xs" style={{ color: "oklch(65% 0.02 248.6)" }}>Edge</span>
          </div>
          {report.archetype && (
            <p className="text-lg font-semibold mt-4" style={{ color: "var(--color-ln-yellow)" }}>{report.archetype}</p>
          )}
          {report.zone && (
            <p className="text-sm mt-1" style={{ color: "oklch(65% 0.02 248.6)" }}>{report.zone}</p>
          )}
        </div>

        {/* Dimension Scores */}
        {dimensionScores && Object.keys(dimensionScores).length > 0 && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <h2 className="font-semibold mb-5" style={{ color: "var(--color-ln-navy)" }}>Dimension Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(dimensionScores).map(([dim, rawScore]) => {
                const score = Number(rawScore);
                return (
                  <div key={dim}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium capitalize" style={{ color: "var(--color-ln-navy)" }}>
                        {dim.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(score)}</span>
                    </div>
                    <div className="relative h-2 rounded-full" style={{ background: "var(--color-ln-border)" }}>
                      <div className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.round(score))}%`,
                          background: score >= 75 ? "#16a34a" : score >= 55 ? "var(--color-ln-yellow)" : score >= 40 ? "#d97706" : "#dc2626",
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LLM Analysis */}
        {llmAnalysisText && (
          <div className="rounded-2xl p-6 mb-8" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Leadership Intelligence Analysis</h2>
            <div className="text-sm leading-relaxed space-y-3" style={{ color: "var(--color-ln-text)" }}>
              {llmAnalysisText.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-8 rounded-2xl" style={{ background: "var(--color-ln-navy)" }}>
          <p className="text-white font-semibold mb-2">Ready to build your Leadership Edge?</p>
          <p className="text-sm mb-5" style={{ color: "oklch(65% 0.02 248.6)" }}>Join LevelNext — The Leadership Intelligence Platform</p>
          <Link href="/">
            <Button className="font-semibold h-11 px-8" style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}>
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
