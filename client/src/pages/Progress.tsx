import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Loader2 } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
};
const MODULE_COLORS: Record<string, string> = { ECI: "#12345A", LII: "#F2B705", GCC: "#1a5276" };

export default function Progress() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: graph, isLoading: graphLoading } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: reports, isLoading: reportsLoading } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const completedModules = graph?.completedModules ?? [];
  const moduleEdges = graph?.moduleEdges ?? {};
  const barData = (["ECI", "LII", "GCC"] as const).map((mod) => ({
    name: mod, label: MODULE_LABELS[mod], edge: moduleEdges[mod] ?? 0, completed: completedModules.includes(mod),
  }));
  const latestReport = reports?.[0];
  const dims = latestReport?.dimensionScores as Record<string, number> | null;
  const radarData = dims ? Object.entries(dims).map(([key, value]) => ({ subject: key, value: Math.round(value), fullMark: 100 })) : [];

  return (
    <PlatformLayout title="Progress">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Progress</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>Your Leadership Edge evolution across all intelligence modules.</p>
        </div>

        {(graphLoading || reportsLoading) ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-ln-muted)" }} />
          </div>
        ) : completedModules.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
            <TrendingUp size={40} className="mx-auto mb-4" style={{ color: "var(--color-ln-muted)" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-ln-navy)" }}>Your Progress story starts here</h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>Complete your first diagnostic to begin tracking your Leadership Edge.</p>
            <Button onClick={() => navigate("/diagnostics")} style={{ background: "var(--color-ln-navy)", color: "white" }}>
              Begin a Diagnostic <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        ) : (
          <>
            {graph?.compositeEdge !== undefined && (
              <div className="rounded-2xl p-6 flex items-center gap-6" style={{ background: "var(--color-ln-navy)" }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 flex-shrink-0" style={{ borderColor: "var(--color-ln-yellow)" }}>
                  <div className="text-center">
                    <p className="text-3xl font-bold" style={{ color: "var(--color-ln-yellow)" }}>{graph.compositeEdge}</p>
                    <p className="text-xs" style={{ color: "oklch(70% 0.02 248.6)" }}>Composite</p>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-bold text-white mb-1">Your Leadership Edge</p>
                  <p className="text-sm" style={{ color: "oklch(70% 0.02 248.6)" }}>
                    Composite across {completedModules.length} completed module{completedModules.length > 1 ? "s" : ""}.
                    {completedModules.length < 3 && " Complete all 3 modules for your full Edge profile."}
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
              <h2 className="text-base font-semibold mb-6" style={{ color: "var(--color-ln-navy)" }}>Edge by Module</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip formatter={(value: number, _: string, props: { payload?: { label?: string } }) => [value, props.payload?.label ?? "Edge"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
                  <Bar dataKey="edge" radius={[6, 6, 0, 0]}>
                    {barData.map((entry) => <Cell key={entry.name} fill={entry.completed ? (MODULE_COLORS[entry.name] ?? "#12345A") : "#e5e7eb"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {radarData.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                <h2 className="text-base font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                  Dimension Profile — {MODULE_LABELS[latestReport?.moduleType ?? "ECI"] ?? "Latest Module"}
                </h2>
                <p className="text-xs mb-6" style={{ color: "var(--color-ln-muted)" }}>Your Edge across each dimension of the most recent diagnostic.</p>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Radar name="Edge" dataKey="value" stroke="#12345A" fill="#12345A" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            {graph?.archetypes && Object.keys(graph.archetypes).length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)" }}>
                <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>Your Leadership Archetypes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(graph.archetypes).map(([mod, archetype]) => (
                    <div key={mod} className="rounded-xl p-4" style={{ background: "var(--color-ln-navy)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-ln-yellow)" }}>{mod}</p>
                      <p className="text-sm font-semibold text-white">{archetype as string}</p>
                      <p className="text-xs mt-1" style={{ color: "oklch(70% 0.02 248.6)" }}>{MODULE_LABELS[mod]}</p>
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
