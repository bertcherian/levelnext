/**
 * Next Chapter Portfolio
 *
 * A read-only view of all deliverables generated through the Next Chapter journey.
 * Shareable with a coach.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// ─── Stage / Module definitions ───────────────────────────────────────────────
const STAGES = [
  { id: 1, name: "Discover",  modules: [1, 2],          color: "#D4AF37" },
  { id: 2, name: "Design",    modules: [3, 4, 5, 6, 7], color: "#4A90D9" },
  { id: 3, name: "Build",     modules: [8, 9],           color: "#5BA85A" },
  { id: 4, name: "Practice",  modules: [10, 11],         color: "#E07B39" },
  { id: 5, name: "Lead",      modules: [12, 13, 14],     color: "#9B59B6" },
  { id: 6, name: "Reflect",   modules: [15, 16],         color: "#E74C3C" },
];

const MODULE_NAMES: Record<number, string> = {
  1: "Understanding Today",
  2: "Enterprise Context",
  3: "Designing the Next Chapter",
  4: "Future Identity Blueprint",
  5: "Rewrite the Story",
  6: "Purpose",
  7: "Leadership Manifesto",
  8: "Capability Architecture",
  9: "Relationship Architecture",
  10: "Leadership Operating System",
  11: "Identity Experiments",
  12: "Executive Reputation",
  13: "Leadership Impact",
  14: "Legacy",
  15: "Transformation Dashboard",
  16: "Reflection Cycle",
};

// ─── Dimension labels ──────────────────────────────────────────────────────────────
const DIMENSION_LABELS: Record<string, string> = {
  leadershipIdentityClarity: "Identity Clarity",
  futureSelfVividness: "Future Self",
  narrativeCoherence: "Narrative",
  identityBehaviourAlignment: "Alignment",
  transitionReadiness: "Readiness",
};

// ─── Identity Shift Radar Chart ───────────────────────────────────────────────────────────
function IdentityShiftChart({
  assessments,
}: {
  assessments: Array<{ assessmentType: string; scores: unknown; completedAt: Date | string }>;
}) {
  const baseline = assessments.find((a) => a.assessmentType === "baseline");
  const latest = assessments.filter((a) => a.assessmentType !== "baseline").at(-1);

  if (!baseline) return null;

  const baselineScores = baseline.scores as Record<string, number>;
  const latestScores = latest ? (latest.scores as Record<string, number>) : null;

  const radarData = Object.keys(DIMENSION_LABELS).map((key) => ({
    dimension: DIMENSION_LABELS[key],
    Baseline: baselineScores[key] ?? 0,
    ...(latestScores ? { Current: latestScores[key] ?? 0 } : {}),
  }));

  const baselineAvg = Object.values(baselineScores).reduce((a, b) => a + b, 0) / 5;
  const latestAvg = latestScores
    ? Object.values(latestScores).reduce((a, b) => a + b, 0) / 5
    : null;
  const shift = latestAvg !== null ? latestAvg - baselineAvg : null;

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <TrendingUp className="h-5 w-5" style={{ color: "var(--color-ln-yellow)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>
          Identity Shift Score
        </h2>
        {shift !== null && (
          <span
            className="ml-auto text-sm font-bold px-3 py-1 rounded-full"
            style={{
              background: shift >= 0 ? "rgba(91,168,90,0.12)" : "rgba(231,76,60,0.12)",
              color: shift >= 0 ? "#5BA85A" : "#E74C3C",
            }}
          >
            {shift >= 0 ? "+" : ""}{shift.toFixed(1)} shift
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-5">
        {latestScores
          ? "Comparing your baseline identity clarity to your most recent assessment."
          : "Baseline captured. Complete more modules to see your identity shift over time."}
      </p>

      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(0,0,0,0.08)" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#6B7280" }} />
            <Radar
              name="Baseline"
              dataKey="Baseline"
              stroke="rgba(212,175,55,0.8)"
              fill="rgba(212,175,55,0.15)"
              strokeWidth={2}
              dot={false}
            />
            {latestScores && (
              <Radar
                name="Current"
                dataKey="Current"
                stroke="#12345A"
                fill="rgba(18,52,90,0.15)"
                strokeWidth={2}
                dot={false}
              />
            )}
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
              formatter={(value: number) => [`${value}/10`]}
            />
            {latestScores && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {Object.keys(DIMENSION_LABELS).map((key) => {
          const b = baselineScores[key] ?? 0;
          const c = latestScores?.[key] ?? null;
          const delta = c !== null ? c - b : null;
          return (
            <div key={key} className="text-center">
              <div className="text-[10px] text-gray-400 mb-1 leading-tight">{DIMENSION_LABELS[key]}</div>
              <div className="text-lg font-bold" style={{ color: "var(--color-ln-navy)" }}>
                {c ?? b}
                <span className="text-xs text-gray-300 font-normal">/10</span>
              </div>
              {delta !== null && (
                <div
                  className="text-[10px] font-semibold"
                  style={{ color: delta >= 0 ? "#5BA85A" : "#E74C3C" }}
                >
                  {delta >= 0 ? "+" : ""}{delta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Deliverable display component ───────────────────────────────────────────
function DeliverableView({
  moduleNumber,
  deliverableType,
  content,
  version,
  generatedAt,
}: {
  moduleNumber: number;
  deliverableType: string;
  content: Record<string, any>;
  version: number;
  generatedAt: Date | string;
}) {
  const [expanded, setExpanded] = useState(true);
  const stage = STAGES.find((s) => s.modules.includes(moduleNumber));

  const renderValue = (val: unknown): React.ReactNode => {
    if (Array.isArray(val)) {
      return (
        <ul className="space-y-1 mt-1">
          {val.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
              <span style={{ color: stage?.color ?? "#D4AF37" }} className="mt-0.5 flex-shrink-0">•</span>
              {typeof item === "object" ? (
                <div className="space-y-0.5">
                  {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium text-gray-600 capitalize">{k}: </span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                String(item)
              )}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof val === "object" && val !== null) {
      return (
        <div className="space-y-1 mt-1">
          {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="font-medium text-gray-600 capitalize">{k}: </span>
              <span className="text-gray-700">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-sm text-gray-700 mt-1">{String(val)}</p>;
  };

  const SKIP_KEYS = ["raw"];
  const HIGHLIGHT_KEYS = ["summary", "identityStatement", "vision", "purpose", "legacyStatement", "newNarrative", "manifesto"];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: (stage?.color ?? "#D4AF37") + "30" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        style={{ background: (stage?.color ?? "#D4AF37") + "08" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: (stage?.color ?? "#D4AF37") + "20", color: stage?.color ?? "#D4AF37" }}
        >
          {moduleNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{deliverableType}</span>
            {version > 1 && (
              <Badge variant="outline" className="text-[10px]">v{version}</Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Module {moduleNumber}: {MODULE_NAMES[moduleNumber]} ·{" "}
            {new Date(generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-5 py-4 space-y-4 bg-white">
          {/* Highlight keys first */}
          {HIGHLIGHT_KEYS.filter((k) => content[k]).map((key) => (
            <div
              key={key}
              className="rounded-xl p-4"
              style={{ background: (stage?.color ?? "#D4AF37") + "10", borderLeft: `3px solid ${stage?.color ?? "#D4AF37"}` }}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: stage?.color ?? "#D4AF37" }}>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">"{content[key]}"</p>
            </div>
          ))}

          {/* Remaining keys */}
          {Object.entries(content)
            .filter(([k]) => !SKIP_KEYS.includes(k) && !HIGHLIGHT_KEYS.includes(k))
            .map(([key, val]) => (
              <div key={key}>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                {renderValue(val)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Portfolio Page ──────────────────────────────────────────────────────
export default function NextChapterPortfolio() {
  const [, navigate] = useLocation();
  const { data, isLoading } = trpc.nextChapter.getPortfolio.useQuery();
  const { data: assessments } = trpc.nextChapter.getIdentityAssessments.useQuery();

  const completedModules = (data?.profile?.completedModules as number[]) ?? [];
  const totalDeliverables = data?.deliverables?.length ?? 0;

  // Group deliverables by module (latest version only)
  type Deliverable = NonNullable<typeof data>["deliverables"][0];
  const latestByModule: Record<number, Deliverable> = {};
  if (data?.deliverables) {
    for (const d of data.deliverables) {
      const existing = latestByModule[d.moduleNumber];
      if (!existing || d.version > existing.version) {
        latestByModule[d.moduleNumber] = d;
      }
    }
  }

  return (
    <PlatformLayout>
      <div className="min-h-screen" style={{ background: "var(--color-ln-ivory)" }}>
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b"
          style={{ background: "var(--color-ln-navy)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => navigate("/next-chapter")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Journey</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: "var(--color-ln-yellow)" }} />
            <span className="text-sm font-semibold text-white">My Portfolio</span>
            <Badge
              className="text-[10px] font-bold"
              style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
            >
              {totalDeliverables} deliverables
            </Badge>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Journey progress summary */}
          <div
            className="rounded-2xl p-6 mb-8"
            style={{ background: "var(--color-ln-navy)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5" style={{ color: "var(--color-ln-yellow)" }} />
              <h1 className="text-lg font-semibold text-white">Next Chapter Portfolio</h1>
            </div>
            <p className="text-sm text-white/60 mb-5">
              Your identity transformation journey — {completedModules.length} of 16 modules complete.
            </p>

            {/* Stage progress */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {STAGES.map((stage) => {
                const stageCompleted = stage.modules.every((m) => completedModules.includes(m));
                const stageStarted = stage.modules.some((m) => completedModules.includes(m));
                const completedCount = stage.modules.filter((m) => completedModules.includes(m)).length;

                return (
                  <div key={stage.id} className="text-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5 text-sm font-bold"
                      style={{
                        background: stageCompleted ? stage.color : stageStarted ? stage.color + "33" : "rgba(255,255,255,0.08)",
                        color: stageCompleted ? "var(--color-ln-navy)" : stageStarted ? stage.color : "rgba(255,255,255,0.3)",
                        border: `1.5px solid ${stageCompleted || stageStarted ? stage.color : "rgba(255,255,255,0.15)"}`,
                      }}
                    >
                      {stageCompleted ? "✓" : stage.id}
                    </div>
                    <div className="text-[10px] text-white/50">{stage.name}</div>
                    <div className="text-[10px] text-white/30">{completedCount}/{stage.modules.length}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Identity Shift Radar Chart */}
          {assessments && assessments.length > 0 && (
            <IdentityShiftChart assessments={assessments} />
          )}

          {/* Deliverables by stage */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white animate-pulse" />
              ))}
            </div>
          ) : totalDeliverables === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(212,175,55,0.1)" }}
              >
                <FileText className="h-8 w-8" style={{ color: "var(--color-ln-yellow)" }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No deliverables yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Complete modules in your Next Chapter journey to generate deliverables.
              </p>
              <Button
                onClick={() => navigate("/next-chapter")}
                style={{ background: "var(--color-ln-yellow)", color: "var(--color-ln-navy)" }}
              >
                Start Your Journey
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {STAGES.map((stage) => {
                const stageDeliverables = stage.modules
                  .map((m) => latestByModule[m])
                  .filter(Boolean);

                if (stageDeliverables.length === 0) return null;

                return (
                  <div key={stage.id}>
                    {/* Stage label */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: stage.color + "20", color: stage.color, border: `1.5px solid ${stage.color}` }}
                      >
                        {stage.id}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{stage.name}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400">
                        {stageDeliverables.length}/{stage.modules.length} modules
                      </span>
                    </div>

                    <div className="space-y-4">
                      {stageDeliverables.map((d) => (
                        <DeliverableView
                          key={d.id}
                          moduleNumber={d.moduleNumber}
                          deliverableType={d.deliverableType}
                          content={d.content as Record<string, any>}
                          version={d.version}
                          generatedAt={d.generatedAt}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
}
