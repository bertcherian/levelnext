import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const MODULES = [
  {
    id: "ECI",
    route: "eci",
    label: "Executive Communication",
    tagline: "How clearly and powerfully do you communicate as a leader?",
    description: "Assess your executive presence, strategic communication, stakeholder influence, and the clarity with which you command attention in high-stakes environments.",
    questions: "30 questions · ~10 minutes",
    color: "#12345A",
  },
  {
    id: "LII",
    route: "lii",
    label: "Leadership Influence",
    tagline: "How effectively do you lead through influence rather than authority?",
    description: "Measure your trust capital, stakeholder alignment, political intelligence, coalition building, and your ability to create followership without relying on positional power.",
    questions: "30 questions · ~10 minutes",
    color: "#1a4a7a",
  },
  {
    id: "GCC",
    route: "gcc",
    label: "GCC Readiness",
    tagline: "Is your GCC operating as a strategic partner or a delivery arm?",
    description: "Evaluate your organisation's readiness across Strategic Influence, Operating Excellence, Leadership & Talent, Innovation & AI, and Enterprise Alignment.",
    questions: "50 questions · ~15 minutes",
    color: "#0f2d4a",
  },
];

export default function Diagnostics() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: graph } = trpc.leadershipGraph.get.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => { if (!loading && !isAuthenticated) navigate("/"); }, [loading, isAuthenticated, navigate]);

  const completedModules = graph?.completedModules ?? [];

  return (
    <PlatformLayout title="Diagnostics">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>Diagnostics</h1>
          <p className="mt-1 text-base" style={{ color: "var(--color-ln-muted)" }}>
            Three intelligence modules. Each one builds your Leadership Edge.
          </p>
        </div>

        <div className="space-y-6">
          {MODULES.map((mod) => {
            const done = completedModules.includes(mod.id as any);
            const score = graph?.moduleEdges?.[mod.id as "ECI" | "LII" | "GCC"];
            return (
              <div key={mod.id} className="rounded-2xl overflow-hidden card-lift"
                style={{ background: "white", border: "1px solid var(--color-ln-border)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex">
                  {/* Left accent */}
                  <div className="w-1.5 flex-shrink-0" style={{ background: done ? "var(--color-ln-yellow)" : mod.color }} />
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{ background: done ? "oklch(from var(--color-ln-yellow) l c h / 0.15)" : "var(--color-ln-ivory-dark)", color: done ? "var(--color-ln-navy)" : "var(--color-ln-muted)" }}>
                            {mod.id}
                          </span>
                          {done && (
                            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#16a34a" }}>
                              <CheckCircle2 size={13} /> Complete
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-ln-navy)" }}>{mod.label}</h2>
                        <p className="text-sm font-medium mb-3" style={{ color: "var(--color-ln-muted)" }}>{mod.tagline}</p>
                        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-ln-text)" }}>{mod.description}</p>
                        <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>{mod.questions}</p>
                      </div>
                      {done && score !== undefined && (
                        <div className="flex-shrink-0 text-right">
                          <p className="text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>{Math.round(score)}</p>
                          <p className="text-xs" style={{ color: "var(--color-ln-muted)" }}>Edge</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Link href={`/diagnostics/${mod.route}`}>
                        <Button className="font-semibold"
                          style={{ background: done ? "var(--color-ln-ivory-dark)" : "var(--color-ln-navy)", color: done ? "var(--color-ln-navy)" : "white" }}>
                          {done ? "Retake Diagnostic" : "Begin Diagnostic"}
                          <ArrowRight size={14} className="ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PlatformLayout>
  );
}
