import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, FileText, TrendingUp } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
};
const MODULE_DESCRIPTIONS: Record<string, string> = {
  ECI: "How clearly and powerfully you communicate as a leader",
  LII: "How effectively you lead through influence rather than authority",
  GCC: "Your organisation's readiness to operate as a strategic global capability centre",
};

export default function Insights() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: reports, isLoading } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  return (
    <PlatformLayout title="Insights">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Insights</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
            Your completed diagnostics and the intelligence they've revealed.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-muted)" }} />
          </div>
        ) : reports && reports.length > 0 ? (
          <>
            <div className="space-y-4">
              {reports.map((r) => {
                const dims = r.dimensionScores as Record<string, number> | null;
                const topDim = dims ? Object.entries(dims).sort(([, a], [, b]) => b - a)[0] : null;
                return (
                  <div key={r.id} className="rounded-2xl p-4 sm:p-6 card-lift"
                    style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}>
                            {r.moduleType}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                          {MODULE_LABELS[r.moduleType] ?? r.moduleType}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: "var(--color-ln-muted)" }}>
                          {MODULE_DESCRIPTIONS[r.moduleType] ?? ""}
                        </p>
                        <div className="flex items-center gap-6 flex-wrap">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--color-ln-muted)" }}>Your Edge</p>
                            <p className="text-2xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>{Math.round(r.edgeScore)}</p>
                          </div>
                          {r.archetype && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--color-ln-muted)" }}>Archetype</p>
                              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>
                                {r.archetype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                              </p>
                            </div>
                          )}
                          {topDim && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--color-ln-muted)" }}>Strongest Dimension</p>
                              <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{topDim[0]} ({topDim[1]})</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {r.slug && (
                        <div className="flex-shrink-0">
                          <Link href={`/report/${r.slug}`}>
                            <Button size="sm" style={{ background: "var(--color-ln-navy)", color: "white" }}>
                              View Insight <ArrowRight size={13} className="ml-1" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.06)", border: "1px solid oklch(from var(--color-ln-yellow) l c h / 0.2)" }}>
              <TrendingUp size={20} style={{ color: "var(--color-ln-yellow)", flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>Track your Edge over time</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                  Visit Progress to see how your Leadership Edge is evolving across all modules.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate("/progress")} style={{ color: "var(--color-ln-navy)" }}>
                View Progress <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl p-12 text-center" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <FileText size={40} className="mx-auto mb-4" style={{ color: "var(--color-ln-muted)" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>No Insights yet</h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>
              Complete your first diagnostic to generate your first leadership Insight.
            </p>
            <Button onClick={() => navigate("/diagnostics")} style={{ background: "var(--color-ln-navy)", color: "white" }}>
              Go to Diagnostics <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
