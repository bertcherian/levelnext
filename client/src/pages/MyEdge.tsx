import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  ECI: "How you communicate, influence, and command presence in executive contexts.",
  LII: "Your ability to build trust, align stakeholders, and lead through influence.",
  GCC: "Your organisation's readiness to operate as a strategic global capability centre.",
};

const ZONE_COLORS: Record<string, string> = {
  excellent: "#16a34a",
  good: "#2563eb",
  developing: "#d97706",
  atRisk: "#dc2626",
};

export default function MyEdge() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: graph, isLoading } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: reports } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  const completedModules = graph?.completedModules ?? [];

  return (
    <PlatformLayout title="My Edge">
      <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>My Edge</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
            Your cumulative leadership intelligence profile across all diagnostics.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-ln-muted" size={28} /></div>
        ) : (
          <>
            {/* Composite Edge */}
            {graph?.compositeEdge !== undefined && (
              <div className="rounded-2xl p-8 mb-8 flex items-center gap-8" style={{ background: "var(--color-ln-navy)" }}>
                <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 flex-shrink-0"
                  style={{ borderColor: "var(--color-ln-yellow)" }}>
                  <span className="text-3xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>{graph.compositeEdge}</span>
                  <span className="text-xs mt-0.5" style={{ color: "oklch(65% 0.02 248.6)" }}>/ 100</span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Composite Leadership Edge</p>
                  <p className="text-xl font-semibold text-white mb-2">
                    {graph.compositeEdge >= 80 ? "Exceptional" : graph.compositeEdge >= 65 ? "Strong" : graph.compositeEdge >= 50 ? "Developing" : "Emerging"} Leader
                  </p>
                  <p className="text-sm" style={{ color: "oklch(65% 0.02 248.6)" }}>
                    Based on {completedModules.length} completed diagnostic{completedModules.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(["ECI", "LII", "GCC"] as const).map((mod) => {
                const done = completedModules.includes(mod);
                const score = graph?.moduleEdges?.[mod];
                const archetype = graph?.archetypes?.[mod];
                const zone = graph?.zones?.[mod];
                return (
                  <div key={mod} className="rounded-2xl p-6 card-lift"
                    style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-ln-muted)" }}>{mod}</span>
                      {done && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "oklch(from var(--color-ln-yellow) l c h / 0.15)", color: "var(--color-ln-navy)" }}>
                          {score}/100
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[mod]}</h3>
                    <p className="text-xs mb-4" style={{ color: "var(--color-ln-muted)" }}>{MODULE_DESCRIPTIONS[mod]}</p>
                    {done ? (
                      <>
                        {archetype && <p className="text-sm font-medium mb-3" style={{ color: "var(--color-ln-navy)" }}>{archetype}</p>}
                        <Link href={`/diagnostics/${mod.toLowerCase()}`}>
                          <Button size="sm" variant="outline" className="w-full text-xs">Retake Diagnostic</Button>
                        </Link>
                      </>
                    ) : (
                      <Link href={`/diagnostics/${mod.toLowerCase()}`}>
                        <Button size="sm" className="w-full text-xs font-semibold"
                          style={{ background: "var(--color-ln-navy)", color: "white" }}>
                          Begin Diagnostic <ArrowRight size={12} className="ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Report History */}
            {reports && reports.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Insight History</h2>
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[r.moduleType]}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(r.edgeScore)}</span>
                        {r.slug && (
                          <Link href={`/report/${r.slug}`}>
                            <Button size="sm" variant="outline" className="text-xs">View</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedModules.length === 0 && (
              <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>Your Edge profile is waiting</p>
                <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>Complete your first diagnostic to begin building your Leadership Edge.</p>
                <Link href="/diagnostics">
                  <Button style={{ background: "var(--color-ln-navy)", color: "white" }}>Go to Diagnostics</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </PlatformLayout>
  );
}
