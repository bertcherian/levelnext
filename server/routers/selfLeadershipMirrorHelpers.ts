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
