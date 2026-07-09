import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import PlatformLayout from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { ArrowRight, Loader2, FileText, TrendingUp, Info } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  ECI: "Executive Communication",
  TII: "Time Intelligence",
  LII: "Leadership Influence",
  GCC: "GCC Readiness",
  LDI: "Derailment Intelligence",
};
const MODULE_DESCRIPTIONS: Record<string, string> = {
  ECI: "How clearly and powerfully you communicate as a leader",
  TII: "How you invest, protect, and reclaim your most strategic resource — time",
  LII: "How effectively you lead through influence rather than authority",
  GCC: "Your organisation's readiness to operate as a strategic global capability centre",
  LDI: "Identify your top derailment risks and leadership stabilizers across 10 behavioural dimensions",
};

/** Human-readable labels and tooltip descriptions for each LDI dimension */
const LDI_DIM_TOOLTIPS: Record<string, { label: string; description: string }> = {
  self_awareness: {
    label: "Self-Awareness",
    description:
      "The degree to which you accurately perceive your own strengths, blind spots, emotional triggers, and impact on others. Low self-awareness is one of the most common silent derailment factors.",
  },
  emotional_regulation: {
    label: "Emotional Regulation",
    description:
      "Your ability to manage emotional reactions under pressure, ambiguity, and conflict. Leaders who struggle here often create unpredictable environments that erode psychological safety.",
  },
  humility_vs_defensiveness: {
    label: "Humility vs Defensiveness",
    description:
      "How openly you receive feedback, admit mistakes, and credit others. Defensive leaders block learning loops and signal to teams that honesty is unsafe.",
  },
  trust_relationship_building: {
    label: "Trust & Relationship Building",
    description:
      "Your capacity to build genuine, durable trust with peers, direct reports, and stakeholders. Trust deficits compound over time and are extremely difficult to reverse once established.",
  },
  stakeholder_management: {
    label: "Stakeholder Navigation",
    description:
      "How effectively you read, engage, and align key stakeholders across the organisation. Poor stakeholder navigation limits your ability to drive change and protect your team.",
  },
  strategic_thinking: {
    label: "Strategic Thinking",
    description:
      "Your ability to think beyond immediate tasks, connect dots across the organisation, and position your team for future relevance. Leaders stuck in execution mode often become invisible at the senior table.",
  },
  decision_making_ambiguity: {
    label: "Decision-Making",
    description:
      "How confidently and effectively you make decisions in conditions of incomplete information, competing priorities, and organisational complexity. Avoidance and over-analysis are common derailment patterns here.",
  },
  accountability_courage: {
    label: "Accountability & Courage",
    description:
      "Your willingness to hold yourself and others to commitments, have difficult conversations, and take a stand when it matters. Leaders who avoid accountability create cultures of mediocrity.",
  },
  delegation_team_development: {
    label: "Delegation & Growth",
    description:
      "How well you let go of execution, grow your team's capability, and multiply your impact through others. Over-involvement is a top derailment risk for high-performing individual contributors moving into leadership.",
  },
  executive_communication: {
    label: "Executive Communication",
    description:
      "Your ability to communicate with clarity, brevity, and strategic intent at the executive level — including framing, narrative, and presence in high-stakes conversations.",
  },
};

/** Render a dimension score bar with a tooltip on the label */
function LdiDimRow({ dimId, score }: { dimId: string; score: number }) {
  const meta = LDI_DIM_TOOLTIPS[dimId];
  if (!meta) return null;
  const pct = Math.min(100, Math.round(score));
  const barColor =
    pct >= 75 ? "#16a34a" : pct >= 55 ? "#F2B705" : pct >= 40 ? "#d97706" : "#dc2626";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-left cursor-default focus:outline-none"
                style={{ color: "var(--color-ln-navy)" }}
              >
                {meta.label}
                <Info size={12} style={{ color: "var(--color-ln-muted)", flexShrink: 0 }} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs text-xs leading-relaxed"
              style={{
                background: "var(--color-ln-navy)",
                color: "white",
                border: "none",
              }}
            >
              {meta.description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-sm font-bold ml-2" style={{ color: "var(--color-ln-navy)" }}>
          {pct}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-ln-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

export default function Insights() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: reports, isLoading } = trpc.report.myReports.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  return (
    <PlatformLayout title="Insights">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-ln-navy)" }}>
            Insights
          </h1>
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
                const isLdi = r.moduleType === "LDI";

                // For non-LDI: show the single strongest dimension as before
                const topDim =
                  !isLdi && dims
                    ? Object.entries(dims).sort(([, a], [, b]) => b - a)[0]
                    : null;

                // For LDI: sort all dims ascending (lowest = highest risk) for display
                const ldiDimsSorted = isLdi && dims
                  ? Object.entries(dims)
                      .filter(([k]) => LDI_DIM_TOOLTIPS[k])
                      .sort(([, a], [, b]) => a - b)
                  : null;

                return (
                  <div
                    key={r.id}
                    className="rounded-2xl p-4 sm:p-6 card-lift"
                    style={{
                      background: "white",
                      border: "1px solid var(--color-ln-border)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                            style={{
                              background: "var(--color-ln-navy)",
                              color: "var(--color-ln-yellow)",
                            }}
                          >
                            {r.moduleType}
                          </span>
                          <span className="text-xs" style={{ color: "var(--color-ln-muted)" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3
                          className="text-lg font-bold mb-1"
                          style={{ color: "var(--color-ln-navy)" }}
                        >
                          {MODULE_LABELS[r.moduleType] ?? r.moduleType}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: "var(--color-ln-muted)" }}>
                          {MODULE_DESCRIPTIONS[r.moduleType] ?? ""}
                        </p>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div>
                            <p
                              className="text-xs font-medium uppercase tracking-wide mb-0.5"
                              style={{ color: "var(--color-ln-muted)" }}
                            >
                              Your Edge
                            </p>
                            <p
                              className="text-2xl font-bold"
                              style={{ color: "var(--color-ln-yellow)" }}
                            >
                              {Math.round(r.edgeScore)}
                            </p>
                          </div>
                          {r.archetype && (
                            <div>
                              <p
                                className="text-xs font-medium uppercase tracking-wide mb-0.5"
                                style={{ color: "var(--color-ln-muted)" }}
                              >
                                {isLdi ? "Derailment Profile" : "Archetype"}
                              </p>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: "var(--color-ln-navy)" }}
                              >
                                {r.archetype
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                              </p>
                            </div>
                          )}
                          {!isLdi && topDim && (
                            <div>
                              <p
                                className="text-xs font-medium uppercase tracking-wide mb-0.5"
                                style={{ color: "var(--color-ln-muted)" }}
                              >
                                Strongest Dimension
                              </p>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: "var(--color-ln-navy)" }}
                              >
                                {topDim[0]} ({topDim[1]})
                              </p>
                            </div>
                          )}
                        </div>

                        {/* LDI: full dimension breakdown with tooltips */}
                        {isLdi && ldiDimsSorted && ldiDimsSorted.length > 0 && (
                          <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--color-ln-border)" }}>
                            <p
                              className="text-xs font-bold uppercase tracking-wider mb-4"
                              style={{ color: "var(--color-ln-muted)" }}
                            >
                              Derailment Risk Dimension Breakdown
                              <span
                                className="ml-2 font-normal normal-case tracking-normal"
                                style={{ color: "var(--color-ln-muted)", opacity: 0.7 }}
                              >
                                — hover a label to learn more
                              </span>
                            </p>
                            <div className="space-y-4">
                              {ldiDimsSorted.map(([dimId, score]) => (
                                <LdiDimRow key={dimId} dimId={dimId} score={score} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {r.slug && (
                        <div className="flex-shrink-0">
                          <Link href={`/report/${r.slug}`}>
                            <Button
                              size="sm"
                              style={{ background: "var(--color-ln-navy)", color: "white" }}
                            >
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

            <div
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{
                background:
                  "oklch(from var(--color-ln-yellow) l c h / 0.06)",
                border:
                  "1px solid oklch(from var(--color-ln-yellow) l c h / 0.2)",
              }}
            >
              <TrendingUp
                size={20}
                style={{ color: "var(--color-ln-yellow)", flexShrink: 0 }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-ln-navy)" }}
                >
                  Track your Edge over time
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-ln-muted)" }}>
                  Visit Progress to see how your Leadership Edge is evolving across all modules.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/progress")}
                style={{ color: "var(--color-ln-navy)" }}
              >
                View Progress <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "white", border: "1px solid var(--color-ln-border)" }}
          >
            <FileText
              size={40}
              className="mx-auto mb-4"
              style={{ color: "var(--color-ln-muted)" }}
            />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--color-ln-navy)" }}
            >
              No Insights yet
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-ln-muted)" }}>
              Complete your first diagnostic to generate your first leadership Insight.
            </p>
            <Button
              onClick={() => navigate("/diagnostics")}
              style={{ background: "var(--color-ln-navy)", color: "white" }}
            >
              Go to Diagnostics <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
