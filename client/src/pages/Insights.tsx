import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = { ECI: "Executive Communication", LII: "Leadership Influence", GCC: "GCC Readiness" };

export default function Insights() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: reports, isLoading } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  return (
    <PlatformLayout title="Insights">
      <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Insights</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>Your diagnostic reports and leadership intelligence.</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-ln-muted" size={28} /></div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="rounded-2xl p-6 flex items-center justify-between card-lift"
                style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: "var(--color-ln-navy)", color: "var(--color-ln-yellow)" }}>{r.moduleType}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[r.moduleType]}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    {r.archetype && ` · ${r.archetype}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(r.edgeScore)}</p>
                    <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Edge</p>
                  </div>
                  {r.slug && (
                    <Link href={`/report/${r.slug}`}>
                      <Button size="sm" style={{ background: "var(--color-ln-navy)", color: "white" }}>
                        View <ArrowRight size={12} className="ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>No Insights yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>Complete a diagnostic to generate your first leadership Insight.</p>
            <Link href="/diagnostics"><Button style={{ background: "var(--color-ln-navy)", color: "white" }}>Go to Diagnostics</Button></Link>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
