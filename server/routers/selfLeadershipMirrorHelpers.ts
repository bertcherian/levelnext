import { SELF_LEADERSHIP_DIMENSIONS, type SelfLeadershipDimension } from "../../shared/modules/selfLeadershipIntelligence";

export type GuidedMirrorProgressRecord = {
  primaryDimension: SelfLeadershipDimension;
  relevance: "up" | "down" | null;
  experimentStatus: "not_started" | "attempted";
};

export function filterGuidedMirrorsForUser<T extends { userId: number }>(mirrors: T[], userId: number) {
  return mirrors.filter((mirror) => mirror.userId === userId);
}

const LABELS: Record<SelfLeadershipDimension, string> = {
  self_awareness: "Self-awareness",
  authenticity: "Authenticity",
  courage: "Courage",
  responsibility: "Responsibility",
  other_centredness: "Other-centredness",
  integrity: "Integrity",
};

export function buildGuidedMirrorFeedbackUpdate(relevance: "up" | "down", feedbackNote?: string, feedbackReason?: string) {
  return { relevance, feedbackNote: feedbackNote ?? null, feedbackReason: relevance === "down" ? feedbackReason ?? null : null } as const;
}

export function buildGuidedMirrorExperimentUpdate(experimentStatus: "not_started" | "attempted") {
  return { experimentStatus } as const;
}

export function aggregateSelfLeadershipProgress(mirrors: GuidedMirrorProgressRecord[]) {
  return SELF_LEADERSHIP_DIMENSIONS.map((dimension) => {
    const related = mirrors.filter((mirror) => mirror.primaryDimension === dimension);
    const experimentsAttempted = related.filter((mirror) => mirror.experimentStatus === "attempted").length;
    const relevanceSignals = related.filter((mirror) => mirror.relevance === "up").length;
    return {
      id: dimension,
      label: LABELS[dimension],
      reflections: related.length,
      experimentsAttempted,
      relevanceSignals,
      progressLabel: experimentsAttempted > 0 ? "Experimenting" : related.length > 0 ? "Noticing" : "Start noticing",
    };
  });
}

export type CoachMirrorTrendSignal = {
  dimension: string;
  distinctionId: string | null;
  createdAt: Date;
};

export function aggregateCoachMirrorTrends(signals: CoachMirrorTrendSignal[], periodDays: 30 | 90, now = new Date()) {
  const currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const counts = new Map<string, { current: number; previous: number }>();
  signals.forEach((signal) => {
    const key = `${signal.dimension}:${signal.distinctionId ?? "unclassified"}`;
    const value = counts.get(key) ?? { current: 0, previous: 0 };
    if (signal.createdAt >= currentStart) value.current += 1;
    else if (signal.createdAt >= previousStart) value.previous += 1;
    counts.set(key, value);
  });
  return Array.from(counts.entries()).flatMap(([key, value]) => {
    // Each disclosed value must independently clear the aggregate threshold.
    if (value.current < 5 || value.previous < 5) return [];
    const [dimension, distinctionId] = key.split(":");
    return [{ dimension, distinctionId: distinctionId === "unclassified" ? null : distinctionId, label: `${dimension.replace(/_/g, " ")} · ${distinctionId === "unclassified" ? "emerging theme" : distinctionId}`, currentCount: value.current, previousCount: value.previous, change: value.current - value.previous, direction: value.current > value.previous ? "up" as const : value.current < value.previous ? "down" as const : "steady" as const }];
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
