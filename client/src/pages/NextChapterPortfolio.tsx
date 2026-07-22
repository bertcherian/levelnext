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
// ─── Dimension metadata ──────────────────────────────────────────────────────────────
const DIMENSION_META: Record<string, {
  label: string;
  shortLabel: string;
  color: string;
  icon: string;
  description: string;
  lowDescription: string;
  highDescription: string;
  actions: { title: string; detail: string; module?: number }[];
}> = {
  leadershipIdentityClarity: {
    label: "Leadership Identity Clarity",
    shortLabel: "Identity Clarity",
    color: "#D4AF37",
    icon: "🧭",
    description: "How clearly and specifically you understand who you are as a leader — your values, strengths, and the unique contribution you make.",
    lowDescription: "Your leadership identity feels unclear or undefined. You may struggle to articulate who you are as a leader or what makes you distinct.",
    highDescription: "You have a sharp, well-defined sense of your leadership identity. You can articulate your values, strengths, and contribution with confidence.",
    actions: [
      { title: "Write your Leadership Identity Statement", detail: "Draft a single sentence that captures who you are, what you stand for, and the impact you create. Refine it until it feels both true and aspirational.", module: 1 },
      { title: "Map your core values", detail: "List your top 5 leadership values. For each, write one specific behaviour that demonstrates it and one that contradicts it. Use the gap as your development focus.", module: 1 },
      { title: "Ask for a 360° identity mirror", detail: "Ask 3 trusted colleagues: \u2018How would you describe my leadership in one sentence?\u2019 Compare their answers to your own self-description. The gap is your identity clarity work.", module: 2 },
    ],
  },
  futureSelfVividness: {
    label: "Future Self Vividness",
    shortLabel: "Future Self",
    color: "#4A90D9",
    icon: "🔭",
    description: "How vivid and specific your picture of your future leadership self is — the role, impact, and influence you want to have in your next chapter.",
    lowDescription: "Your future self feels vague or distant. You may have a general sense of wanting to grow, but lack a specific, motivating picture of where you are heading.",
    highDescription: "You have a clear, detailed, and motivating picture of the leader you are becoming. Your future self feels real and pulls you forward.",
    actions: [
      { title: "Write a \u2018Future Self Letter\u2019", detail: "Write a letter from yourself 3 years from now, describing the role you hold, the impact you are making, and how you feel about your leadership. Be as specific as possible.", module: 4 },
      { title: "Define your \u2018Next Chapter\u2019 in one paragraph", detail: "Describe your next chapter in terms of: the type of leader you will be, the problems you will solve, the people you will lead, and the legacy you will begin building.", module: 3 },
      { title: "Create a Future Self Vision Board", detail: "Identify 5 specific leaders (real or fictional) who embody aspects of your future self. For each, name the one quality you want to develop. This becomes your growth blueprint.", module: 4 },
    ],
  },
  narrativeCoherence: {
    label: "Narrative Coherence",
    shortLabel: "Narrative",
    color: "#5BA85A",
    icon: "📖",
    description: "How well your career story hangs together — whether you can see a clear thread connecting your past experiences to your present identity and future direction.",
    lowDescription: "Your career story feels fragmented or hard to explain. You may struggle to connect the dots between your experiences or to tell a compelling story about where you are heading.",
    highDescription: "Your career story is coherent and compelling. You can draw a clear line from your past through your present to your future, and others find it credible and inspiring.",
    actions: [
      { title: "Build your Leadership Timeline", detail: "Map your 5 most formative leadership experiences on a timeline. For each, identify: what happened, what you learned, and how it shaped the leader you are today. Look for the thread.", module: 5 },
      { title: "Craft your \u2018Origin Story\u2019", detail: "Write a 2-minute story that explains why you became the kind of leader you are. It should start with a formative moment, not a job title. Practice telling it until it feels natural.", module: 5 },
      { title: "Identify your \u2018Red Thread\u2019", detail: "Ask yourself: what is the one consistent theme across every role I have held? This is your red thread. Name it, and use it as the spine of your leadership narrative.", module: 7 },
    ],
  },
  identityBehaviourAlignment: {
    label: "Identity\u2013Behaviour Alignment",
    shortLabel: "Alignment",
    color: "#E07B39",
    icon: "⚡",
    description: "How consistently your daily behaviours reflect the leader you believe yourself to be — whether your actions match your identity.",
    lowDescription: "There is a gap between who you believe yourself to be as a leader and how you actually show up day-to-day. Others may experience you differently from how you see yourself.",
    highDescription: "Your behaviours consistently reflect your leadership identity. Others would describe you in a way that closely matches your own self-perception.",
    actions: [
      { title: "Run a \u2018Behaviour Audit\u2019", detail: "For each of your top 3 leadership values, identify one specific behaviour from the last week that demonstrated it and one that contradicted it. The contradictions are your alignment gaps.", module: 10 },
      { title: "Create a \u2018Leadership Operating Principles\u2019 list", detail: "Write 5 specific, observable behaviours that you commit to as expressions of your leadership identity. Share them with your team and ask for monthly feedback on how well you are living them.", module: 10 },
      { title: "Design a \u2018Morning Identity Anchor\u2019", detail: "Each morning, read your Leadership Identity Statement and ask: what is one thing I will do today that expresses this identity? This daily practice closes the gap between who you are and how you show up.", module: 11 },
    ],
  },
  transitionReadiness: {
    label: "Transition Readiness",
    shortLabel: "Readiness",
    color: "#9B59B6",
    icon: "🚀",
    description: "How prepared you feel to step into your next chapter — whether you have the clarity, capability, and plan to make the transition successfully.",
    lowDescription: "You feel uncertain or unprepared for your next leadership transition. You may lack a clear plan, the right relationships, or confidence in your readiness.",
    highDescription: "You feel genuinely ready for your next chapter. You have a clear development plan, the right relationships, and the confidence to step into a bigger role.",
    actions: [
      { title: "Map your \u2018Transition Gaps\u2019", detail: "Identify the 3 capabilities, relationships, or experiences that your next chapter requires but you do not yet have. For each, write one specific action you will take in the next 30 days.", module: 8 },
      { title: "Build your \u2018Transition Network\u2019", detail: "Identify 5 people who are already operating at the level you want to reach. For each, define what you want to learn from them and schedule a conversation in the next 60 days.", module: 9 },
      { title: "Write your \u201290-Day Transition Plan\u2019", detail: "Define what success looks like in your first 90 days in your next role. Break it into three 30-day phases: Learn, Contribute, Lead. This plan makes your readiness concrete.", module: 8 },
    ],
  },
};

const DIMENSION_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(DIMENSION_META).map(([k, v]) => [k, v.shortLabel])
);

// ─── Custom Radar Tooltip ──────────────────────────────────────────────────────────────
function CustomRadarTooltip({
  active,
  payload,
  baselineScores,
  latestScores,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; dataKey: string; payload: { dimension: string } }>;
  baselineScores: Record<string, number>;
  latestScores: Record<string, number> | null;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Find the dimension key from the short label
  const shortLabel = payload[0]?.payload?.dimension;
  const dimKey = Object.keys(DIMENSION_META).find(
    (k) => DIMENSION_META[k].shortLabel === shortLabel
  );
  if (!dimKey) return null;

  const meta = DIMENSION_META[dimKey];
  const baselineVal = baselineScores[dimKey] ?? 0;
  const currentVal = latestScores?.[dimKey] ?? null;
  const delta = currentVal !== null ? currentVal - baselineVal : null;

  return (
    <div
      className="rounded-xl p-4 shadow-lg max-w-xs"
      style={{
        background: "white",
        border: `2px solid ${meta.color}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.12)`,
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{meta.icon}</span>
        <span className="text-sm font-bold" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        {meta.description}
      </p>

      {/* Scores */}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Baseline</div>
          <div className="text-xl font-black" style={{ color: meta.color }}>
            {baselineVal}<span className="text-xs text-gray-300 font-normal">/10</span>
          </div>
        </div>
        {currentVal !== null && (
          <>
            <div className="text-gray-200">→</div>
            <div className="text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Current</div>
              <div className="text-xl font-black" style={{ color: "var(--color-ln-navy)" }}>
                {currentVal}<span className="text-xs text-gray-300 font-normal">/10</span>
              </div>
            </div>
            {delta !== null && (
              <div
                className="ml-auto text-sm font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: delta >= 0 ? "rgba(91,168,90,0.12)" : "rgba(231,76,60,0.12)",
                  color: delta >= 0 ? "#5BA85A" : "#E74C3C",
                }}
              >
                {delta >= 0 ? "+" : ""}{delta}
              </div>
            )}
          </>
        )}
      </div>

      {/* Contextual description */}
      <div
        className="mt-3 pt-3 border-t text-xs text-gray-500 leading-relaxed italic"
        style={{ borderColor: meta.color + "30" }}
      >
        {baselineVal <= 5 ? meta.lowDescription : meta.highDescription}
      </div>
    </div>
  );
}

// ─── Personalised Recommendations ───────────────────────────────────────────────────────────
function PersonalisedRecommendations({
  baselineScores,
  latestScores,
  onNavigate,
}: {
  baselineScores: Record<string, number>;
  latestScores: Record<string, number> | null;
  onNavigate: (path: string) => void;
}) {
  // Use current scores if available, otherwise baseline
  const activeScores = latestScores ?? baselineScores;

  // Find the lowest-scoring dimension
  const lowestKey = Object.keys(activeScores).reduce((a, b) =>
    (activeScores[a] ?? 10) <= (activeScores[b] ?? 10) ? a : b
  );
  const meta = DIMENSION_META[lowestKey];
  if (!meta) return null;

  const score = activeScores[lowestKey] ?? 0;

  return (
    <div
      className="rounded-2xl p-6 mb-8"
      style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
          style={{ background: meta.color + "18", border: `1.5px solid ${meta.color}` }}
        >
          {meta.icon}
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-ln-navy)" }}>
            Your Growth Focus: {meta.label}
          </h2>
          <p className="text-xs text-gray-400">
            Lowest-scoring dimension — score {score}/10
          </p>
        </div>
        <div
          className="ml-auto px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: meta.color + "18", color: meta.color }}
        >
          Priority
        </div>
      </div>

      {/* Context */}
      <div
        className="rounded-xl p-4 mb-5 mt-3"
        style={{ background: meta.color + "0D", borderLeft: `3px solid ${meta.color}` }}
      >
        <p className="text-sm text-gray-700 leading-relaxed">
          {score <= 5 ? meta.lowDescription : meta.highDescription}
        </p>
      </div>

      {/* Action items */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          3 Actions to Build This Dimension
        </div>
        {meta.actions.map((action, idx) => (
          <div
            key={idx}
            className="rounded-xl p-4"
            style={{ background: "#F8F5F0", border: "1px solid rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: meta.color, color: "white" }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-ln-navy)" }}>
                  {action.title}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {action.detail}
                </p>
                {action.module && (
                  <button
                    onClick={() => onNavigate("/next-chapter")}
                    className="mt-2 text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: meta.color }}
                  >
                    <ChevronRight className="h-3 w-3" />
                    Module {action.module}: {MODULE_NAMES[action.module]}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          These actions are drawn from your Next Chapter journey modules. Start the conversation in your next session.
        </p>
      </div>
    </div>
  );
}

// ─── Identity Shift Radar Chart ───────────────────────────────────────────────────────────
function IdentityShiftChart({
  assessments,
  onNavigate,
}: {
  assessments: Array<{ assessmentType: string; scores: unknown; completedAt: Date | string }>;
  onNavigate: (path: string) => void;
}) {
  const baseline = assessments.find((a) => a.assessmentType === "baseline");
  const latest = assessments.filter((a) => a.assessmentType !== "baseline").at(-1);

  if (!baseline) return null;

  const baselineScores = baseline.scores as Record<string, number>;
  const latestScores = latest ? (latest.scores as Record<string, number>) : null;

  const radarData = Object.keys(DIMENSION_META).map((key) => ({
    dimension: DIMENSION_META[key].shortLabel,
    Baseline: baselineScores[key] ?? 0,
    ...(latestScores ? { Current: latestScores[key] ?? 0 } : {}),
  }));

  const baselineAvg = Object.values(baselineScores).reduce((a, b) => a + b, 0) / 5;
  const latestAvg = latestScores
    ? Object.values(latestScores).reduce((a, b) => a + b, 0) / 5
    : null;
  const shift = latestAvg !== null ? latestAvg - baselineAvg : null;

  return (
    <>
      <div
        className="rounded-2xl p-6 mb-4"
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
        <p className="text-xs text-gray-400 mb-1">
          {latestScores
            ? "Comparing your baseline identity clarity to your most recent assessment. Hover over each axis for details."
            : "Baseline captured. Hover over each axis to explore your dimensions. Complete more modules to see your shift over time."}
        </p>

        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
              <PolarGrid stroke="rgba(0,0,0,0.07)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                  const dimKey = Object.keys(DIMENSION_META).find(
                    (k) => DIMENSION_META[k].shortLabel === payload.value
                  );
                  const color = dimKey ? DIMENSION_META[dimKey].color : "#6B7280";
                  return (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill={color}>
                      {payload.value}
                    </text>
                  );
                }}
              />
              <Radar
                name="Baseline"
                dataKey="Baseline"
                stroke="rgba(212,175,55,0.8)"
                fill="rgba(212,175,55,0.15)"
                strokeWidth={2}
                dot={{ r: 4, fill: "#D4AF37", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#D4AF37", strokeWidth: 2, stroke: "white" }}
              />
              {latestScores && (
                <Radar
                  name="Current"
                  dataKey="Current"
                  stroke="#12345A"
                  fill="rgba(18,52,90,0.12)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#12345A", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#12345A", strokeWidth: 2, stroke: "white" }}
                />
              )}
              <Tooltip
                content={
                  <CustomRadarTooltip
                    baselineScores={baselineScores}
                    latestScores={latestScores}
                  />
                }
              />
              {latestScores && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension breakdown grid */}
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Object.keys(DIMENSION_META).map((key) => {
            const meta = DIMENSION_META[key];
            const b = baselineScores[key] ?? 0;
            const c = latestScores?.[key] ?? null;
            const delta = c !== null ? c - b : null;
            return (
              <div key={key} className="text-center">
                <div className="text-base mb-0.5">{meta.icon}</div>
                <div className="text-[10px] text-gray-400 mb-1 leading-tight">{meta.shortLabel}</div>
                <div className="text-lg font-bold" style={{ color: meta.color }}>
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

      {/* Personalised recommendations */}
      <PersonalisedRecommendations
        baselineScores={baselineScores}
        latestScores={latestScores}
        onNavigate={onNavigate}
      />
    </>
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
            <IdentityShiftChart assessments={assessments} onNavigate={navigate} />
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
