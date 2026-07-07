import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Loader2, Users, TrendingUp, BarChart3 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
};

export default function Organisation() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: tenant, isLoading: tenantLoading } = trpc.tenant.myTenant.useQuery(undefined, { enabled: isAuthenticated });
  const { data: tenantReports, isLoading: reportsLoading } = trpc.report.tenantReports.useQuery(undefined, {
    enabled: isAuthenticated && (tenant?.role === "owner" || tenant?.role === "admin"),
    retry: false,
  });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";

  // Compute heatmap data
  const moduleStats = ["ECI", "LII", "GCC"].map((mod) => {
    const modReports = tenantReports?.filter((r) => r.moduleType === mod) ?? [];
    const avg = modReports.length > 0
      ? Math.round(modReports.reduce((sum, r) => sum + r.edgeScore, 0) / modReports.length)
      : null;
    return { mod, count: modReports.length, avg };
  });

  return (
    <PlatformLayout title="Organisation">
      <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Organisation</h1>
          {tenant && (
            <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
              {tenant.tenant.name}
            </p>
          )}
        </div>

        {tenantLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-muted)" }} /></div>
        ) : !isAdmin ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <p className="text-lg font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>Admin access required</p>
            <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>Organisation insights are available to owners and admins.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="rounded-2xl p-6" style={{ background: "var(--color-ln-navy)", boxShadow: "var(--shadow-card)" }}>
                <Users size={20} style={{ color: "var(--color-ln-yellow)" }} className="mb-3" />
                <p className="text-3xl font-bold text-white">{tenantReports?.length ?? 0}</p>
                <p className="text-sm mt-1" style={{ color: "oklch(65% 0.02 248.6)" }}>Total Diagnostics Completed</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <TrendingUp size={20} style={{ color: "var(--color-ln-navy)" }} className="mb-3" />
                <p className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {tenantReports && tenantReports.length > 0
                    ? Math.round(tenantReports.reduce((s, r) => s + r.edgeScore, 0) / tenantReports.length)
                    : "—"}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-ln-muted)" }}>Average Team Edge</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <BarChart3 size={20} style={{ color: "var(--color-ln-navy)" }} className="mb-3" />
                <p className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
                  {moduleStats.filter((m) => m.count > 0).length}/3
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-ln-muted)" }}>Modules Active</p>
              </div>
            </div>

            {/* Module Heatmap */}
            <div className="rounded-2xl p-6 mb-8" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
              <h2 className="font-semibold mb-5" style={{ color: "var(--color-ln-navy)" }}>Team Edge Heatmap</h2>
              <div className="space-y-4">
                {moduleStats.map(({ mod, count, avg }) => (
                  <div key={mod}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[mod]}</span>
                      <span className="text-sm" style={{ color: "var(--color-ln-muted)" }}>
                        {avg !== null ? `${avg}/100` : "No data"} · {count} completed
                      </span>
                    </div>
                    <div className="relative h-3 rounded-full" style={{ background: "var(--color-ln-border)" }}>
                      {avg !== null && (
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${avg}%`,
                            background: avg >= 75 ? "#16a34a" : avg >= 55 ? "var(--color-ln-yellow)" : avg >= 40 ? "#d97706" : "#dc2626",
                          }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent reports */}
            {tenantReports && tenantReports.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Recent Diagnostic Activity</h2>
                <div className="space-y-3">
                  {tenantReports.slice(0, 10).map((r) => (
                    <div key={r.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-ln-navy)" }}>{MODULE_LABELS[r.moduleType]}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {r.archetype && ` · ${r.archetype}`}
                        </p>
                      </div>
                      <span className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(r.edgeScore)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PlatformLayout>
  );
}
