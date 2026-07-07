import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Loader2 } from "lucide-react";

export default function Progress() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: graph } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const modules = [
    { id: "ECI", label: "Executive Communication" },
    { id: "LII", label: "Leadership Influence" },
    { id: "GCC", label: "GCC Readiness" },
  ];

  return (
    <PlatformLayout title="Progress">
      <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Progress</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>Track your Edge growth across all leadership dimensions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const score = graph?.moduleEdges?.[mod.id as "ECI" | "LII" | "GCC"];
            const done = graph?.completedModules?.includes(mod.id as any);
            return (
              <div key={mod.id} className="rounded-2xl p-6" style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-ln-muted)" }}>{mod.id}</p>
                <p className="font-semibold mb-4" style={{ color: "var(--color-ln-navy)" }}>{mod.label}</p>
                {done && score !== undefined ? (
                  <>
                    <div className="relative h-2 rounded-full mb-2" style={{ background: "var(--color-ln-border)" }}>
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: "var(--color-ln-yellow)" }} />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{score}<span className="text-sm font-normal text-ln-muted">/100</span></p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: "var(--color-ln-muted)" }}>Not yet assessed</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PlatformLayout>
  );
}
