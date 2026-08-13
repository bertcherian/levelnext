export const LEADER_CORE_MODULES = ["ECI", "LII", "LDI", "STI"] as const;

export const LEADER_MODULE_LABELS: Record<(typeof LEADER_CORE_MODULES)[number], string> = {
  ECI: "Executive Communication",
  LII: "Leadership Influence",
  LDI: "Derailment Intelligence",
  STI: "Strategic Thinking",
};

export type LeadershipMissionSummary = {
  id: number;
  title: string;
  description: string;
  status: string;
};

export type NextLeadershipMove =
  | {
      kind: "diagnostic";
      moduleCode: (typeof LEADER_CORE_MODULES)[number];
      title: string;
      description: string;
      ctaLabel: string;
      href: string;
    }
  | {
      kind: "mission";
      mission: LeadershipMissionSummary;
      title: string;
      description: string;
      ctaLabel: string;
    }
  | {
      kind: "guide";
      title: string;
      description: string;
      ctaLabel: string;
      href: string;
    };

/**
 * Keep the Leader Intelligence home experience focused on one meaningful next
 * move. A core diagnostic establishes the baseline; a pending mission turns
 * insight into practice; Guide helps the leader choose once both are complete.
 */
export function getNextLeadershipMove(
  completedModules: readonly string[],
  missions: readonly LeadershipMissionSummary[] | undefined,
): NextLeadershipMove {
  const nextModule = LEADER_CORE_MODULES.find((module) => !completedModules.includes(module));

  if (nextModule) {
    const label = LEADER_MODULE_LABELS[nextModule];
    return {
      kind: "diagnostic",
      moduleCode: nextModule,
      title: `Complete your ${label} diagnostic`,
      description: `Establish a clear baseline for ${label.toLowerCase()} in about 10 minutes.`,
      ctaLabel: "Begin diagnostic",
      href: `/diagnostics/${nextModule.toLowerCase()}`,
    };
  }

  const pendingMission = missions?.find((mission) => mission.status === "pending");
  if (pendingMission) {
    return {
      kind: "mission",
      mission: pendingMission,
      title: pendingMission.title,
      description: pendingMission.description,
      ctaLabel: "Mark complete",
    };
  }

  return {
    kind: "guide",
    title: "Choose your next growth priority",
    description: "Use Guide to turn your current Leadership Edge into one focused, real-world action.",
    ctaLabel: "Open Guide",
    href: "/guide",
  };
}
