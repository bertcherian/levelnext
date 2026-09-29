import { z } from "zod";

export const PILOTLAB_BEHAVIORS = [
  "outcome_orientation",
  "timely_feedback",
  "difficult_conversations",
] as const;
export type PilotlabBehavior = (typeof PILOTLAB_BEHAVIORS)[number];

export const PILOTLAB_DIMENSIONS = [
  "Outcome Orientation",
  "Timely Feedback",
  "Difficult Conversations",
  "Personalization",
  "Memory & Continuity",
  "Coaching Relevance",
  "Practice Quality",
  "Commitment Follow-Through",
  "Evidence Integrity",
  "Sponsor Reporting",
] as const;
export type PilotlabDimension = (typeof PILOTLAB_DIMENSIONS)[number];

export const PILOTLAB_FAILURE_CODES = [
  "F1_MEMORY_FAILURE",
  "F2_HALLUCINATED_EVIDENCE",
  "F3_INFORMATION_LEAKAGE",
  "F4_POOR_PERSONALIZATION",
  "F5_MISSED_COMMITMENT",
  "F6_INCORRECT_BEHAVIOURAL_INFERENCE",
  "F7_WEAK_COACHING",
  "F8_EXCESSIVE_AGREEMENT",
  "F9_FALSE_CAUSALITY",
  "F10_DIAGNOSTIC_GAMING",
  "F11_EMOTIONAL_MISREAD",
  "F12_PRIVACY_BOUNDARY_FAILURE",
  "F13_JOURNEY_FAILURE",
  "F14_UNNECESSARY_INTERVENTION",
  "F15_FAILURE_TO_ESCALATE",
] as const;
export type PilotlabFailureCode = (typeof PILOTLAB_FAILURE_CODES)[number];

export const PILOTLAB_RELEASE_GATE_CODES = [
  "F5_MISSED_COMMITMENT",
  "F10_DIAGNOSTIC_GAMING",
  "F14_UNNECESSARY_INTERVENTION",
] as const;
export type PilotlabReleaseGateCode = (typeof PILOTLAB_RELEASE_GATE_CODES)[number];
export const PILOTLAB_RELEASE_GATE_STATES = ["not_triggered", "handled", "regressed"] as const;
export type PilotlabReleaseGateState = (typeof PILOTLAB_RELEASE_GATE_STATES)[number];

export const pilotlabRunStatusSchema = z.enum(["draft", "running", "completed", "failed"]);
export type PilotlabRunStatus = z.infer<typeof pilotlabRunStatusSchema>;

export const pilotlabSeveritySchema = z.enum(["informational", "warning", "significant", "critical"]);
export type PilotlabSeverity = z.infer<typeof pilotlabSeveritySchema>;

export const pilotlabAgentTrajectorySchema = z.enum([
  "resistant_breakthrough",
  "false_positive",
  "improvement_relapse_recovery",
  "slow_compounder",
  "already_strong",
]);
export type PilotlabAgentTrajectory = z.infer<typeof pilotlabAgentTrajectorySchema>;

export type PilotlabAgentProfile = {
  key: string;
  name: string;
  role: string;
  trajectory: PilotlabAgentTrajectory;
  baseline: { capability: number; motivation: number; context: number; trust: number; coachability: number; workload: number };
  hiddenTension: string;
  developmentEdge: string;
};

export const PILOTLAB_AGENT_PROFILES: PilotlabAgentProfile[] = [
  {
    key: "MGR-01",
    name: "Asha Menon",
    role: "Engineering Manager",
    trajectory: "resistant_breakthrough",
    baseline: { capability: 62, motivation: 38, context: 58, trust: 42, coachability: 34, workload: 66 },
    hiddenTension: "She equates direct feedback with damaging relationships and avoids naming the consequence.",
    developmentEdge: "Courageous specificity under relational pressure.",
  },
  {
    key: "MGR-02",
    name: "Rohan Mehta",
    role: "Regional Sales Manager",
    trajectory: "false_positive",
    baseline: { capability: 72, motivation: 70, context: 65, trust: 56, coachability: 48, workload: 54 },
    hiddenTension: "He is fluent in leadership language but protects his image by reporting intentions as completed action.",
    developmentEdge: "Observable follow-through over articulate self-report.",
  },
  {
    key: "MGR-03",
    name: "Nisha Rao",
    role: "Operations Manager",
    trajectory: "improvement_relapse_recovery",
    baseline: { capability: 55, motivation: 68, context: 62, trust: 60, coachability: 74, workload: 48 },
    hiddenTension: "A workload spike makes the old habit of rescuing and postponing conversations feel temporarily rational.",
    developmentEdge: "Maintain the new move when urgency and volume increase.",
  },
  {
    key: "MGR-04",
    name: "Vikram Shah",
    role: "Product Manager",
    trajectory: "slow_compounder",
    baseline: { capability: 48, motivation: 52, context: 57, trust: 50, coachability: 58, workload: 61 },
    hiddenTension: "He needs repetition and small wins before a clearer outcome frame becomes natural.",
    developmentEdge: "Compound small, observable changes without premature judgement.",
  },
  {
    key: "MGR-05",
    name: "Leena Iyer",
    role: "Customer Success Director",
    trajectory: "already_strong",
    baseline: { capability: 88, motivation: 82, context: 78, trust: 76, coachability: 80, workload: 46 },
    hiddenTension: "She is strong at direct action but can over-index on speed and under-invest in shared ownership.",
    developmentEdge: "Create distributed ownership without lowering the standard.",
  },
];

export type PilotlabScenario = {
  code: string;
  behavior: PilotlabBehavior | "cross_behavior";
  title: string;
  virtualDay: number;
  participants: string[];
  groundTruth: string;
  managerVisibleInfo: string;
  levelNextVisibleInfo: string;
  behavioralTension: string;
  expectedAction: string;
  unacceptableBehaviors: string[];
  downstreamConsequence: string;
};

const SCENARIO_TEMPLATES: Record<PilotlabBehavior, string[]> = {
  outcome_orientation: [
    "unclear deliverable",
    "activity without result",
    "ambiguous ownership",
    "changing priorities",
    "missed milestone",
    "competing stakeholder requests",
    "weak success criteria",
    "delegation without guardrails",
    "status meeting without a decision",
    "customer outcome not named",
    "urgent work displacing important work",
    "deadline negotiated without trade-off",
    "rework caused by hidden assumptions",
    "escalation without a recommendation",
    "recognition attached to effort instead of outcome",
  ],
  timely_feedback: [
    "repeated quality issue",
    "excellent work goes unrecognised",
    "missed commitment",
    "defensive employee",
    "remote employee loses context",
    "high performer damages trust",
    "manager waits for appraisal cycle",
    "peer needs feedback",
    "new hire repeats an avoidable mistake",
    "customer signal is not shared",
    "feedback is delivered as a personality label",
    "manager over-softens the message",
    "feedback is given without a next step",
    "cross-functional partner avoids ownership",
    "positive correction is missed after a win",
  ],
  difficult_conversations: [
    "chronic underperformance",
    "interpersonal conflict",
    "unrealistic stakeholder",
    "peer disagreement",
    "challenge to a senior person",
    "setting a boundary",
    "repeated missed commitment",
    "inappropriate behaviour signal",
    "employee denial",
    "accountability breakdown",
    "role ambiguity creates resentment",
    "team member asks for rescue",
    "conflict is discussed indirectly",
    "performance issue is hidden from sponsor",
    "customer escalation requires ownership",
  ],
};

const behaviorLabel: Record<PilotlabBehavior, string> = {
  outcome_orientation: "Outcome Orientation",
  timely_feedback: "Timely Feedback",
  difficult_conversations: "Difficult Conversations",
};

function scenarioFor(behavior: PilotlabBehavior, index: number, title: string): PilotlabScenario {
  const day = [2, 4, 6, 8, 10, 12, 15, 18, 20, 23, 27, 30, 36, 45, 54][index];
  return {
    code: `${behavior === "outcome_orientation" ? "OO" : behavior === "timely_feedback" ? "FB" : "GF"}-${String(index + 1).padStart(3, "0")}`,
    behavior,
    title,
    virtualDay: day,
    participants: ["manager", "direct report", "peer", "sponsor"].slice(0, index % 3 === 0 ? 4 : 3),
    groundTruth: `The ${title} continues until the manager makes the observable ${behaviorLabel[behavior]} move; the downstream risk is real but the business impact remains a hypothesis.`,
    managerVisibleInfo: `The manager sees the immediate workplace tension: ${title}.`,
    levelNextVisibleInfo: "Only the manager's stated situation, prior permitted commitments, check-ins, and disclosed outcomes are available.",
    behavioralTension: `The easiest response preserves short-term comfort but leaves the ${behaviorLabel[behavior].toLowerCase()} gap intact.`,
    expectedAction: `Name the observable facts, make a clear request or decision, and agree a time-bound next action connected to the ${behaviorLabel[behavior].toLowerCase()} gap.`,
    unacceptableBehaviors: ["inventing completion", "claiming business impact without evidence", "labelling the manager's character", "revealing hidden ground truth"],
    downstreamConsequence: "The unresolved issue may create rework, escalation, customer friction, or delayed cash conversion; no causal claim is proven by the simulation alone.",
  };
}

export const PILOTLAB_SCENARIOS: PilotlabScenario[] = [
  ...SCENARIO_TEMPLATES.outcome_orientation.map((title, index) => scenarioFor("outcome_orientation", index, title)),
  ...SCENARIO_TEMPLATES.timely_feedback.map((title, index) => scenarioFor("timely_feedback", index, title)),
  ...SCENARIO_TEMPLATES.difficult_conversations.map((title, index) => scenarioFor("difficult_conversations", index, title)),
  ...[
    "relapse after workload spike",
    "strong performer over-controls the outcome",
    "false positive claim meets missed commitment",
    "sponsor asks for causal certainty",
    "manager changes goal after a setback",
  ].map((title, index) => ({
    code: `XB-${String(index + 1).padStart(3, "0")}`,
    behavior: "cross_behavior" as const,
    title,
    virtualDay: [30, 38, 42, 50, 58][index]!,
    participants: ["manager", "sponsor", "customer", "direct report"],
    groundTruth: `The cross-behavior tension is visible in the simulated organization, but only permitted manager disclosures and evidence may reach LevelNext. Financial impact remains a hypothesis.`,
    managerVisibleInfo: `The manager is told that a consequential workplace situation has surfaced: ${title}.`,
    levelNextVisibleInfo: "LevelNext receives only the current disclosure and permitted history, not hidden truth.",
    behavioralTension: "The system must distinguish language, intention, practice, action, and outcome.",
    expectedAction: "State uncertainty where evidence is insufficient, reconnect to the commitment, and propose the smallest observable next action.",
    unacceptableBehaviors: ["manufacturing evidence", "leaking hidden state", "forcing a basic intervention on a strong manager", "turning simulation economics into ROI proof"],
    downstreamConsequence: "The sponsor receives a bounded finding and a next test rather than an overconfident conclusion.",
  })),
];

export type PilotlabAgentState = {
  capability: number;
  motivation: number;
  context: number;
  identity: number;
  emotion: number;
  resistance: number;
  trust: number;
  coachability: number;
  workload: number;
  evidenceLevel: number;
  completedCommitments: number;
  missedCommitments: number;
  relapseDetected: boolean;
  narrative: string;
};

export type PilotlabDimensionResult = {
  dimension: PilotlabDimension;
  score: number;
  passed: number;
  failed: number;
  checked: number;
  evidence: string;
};

export type PilotlabPredicateResult = {
  predicateId: string;
  dimension: PilotlabDimension;
  passed: boolean;
  expected: string;
  observed: string;
  releaseGateCode?: PilotlabReleaseGateCode;
};

export type PilotlabReleaseGate = {
  code: PilotlabReleaseGateCode;
  state: PilotlabReleaseGateState;
  triggered: number;
  handled: number;
  regressed: number;
  rationale: string;
};

export type PilotlabSimulationSummary = {
  runCode: string;
  virtualDurationDays: 60;
  managerCount: 5;
  interactions: number;
  goldenScenariosExecuted: number;
  dimensions: PilotlabDimensionResult[];
  releaseGates: PilotlabReleaseGate[];
  failureCounts: Record<string, number>;
  leakageEvents: number;
  privacyViolations: number;
  hallucinatedEvidence: number;
  falseCausality: number;
  brokenJourneys: number;
  gaming: number;
  sponsorConclusion: string;
};

export const pilotlabCreateRunSchema = z.object({
  name: z.string().trim().min(3).max(160).default("60-day Manager Behaviour Pilot"),
  platformVersion: z.string().trim().min(1).max(80).default("current-preview"),
  chaosConfig: z.object({
    enabled: z.boolean().default(false),
    resistanceVariance: z.number().int().min(0).max(30).default(0),
    workloadShockDay: z.number().int().min(1).max(60).nullable().default(null),
    memoryGaps: z.boolean().default(false),
    stakeholderEscalation: z.boolean().default(false),
    evidenceAmbiguity: z.boolean().default(false),
    unpredictableRelapse: z.boolean().default(false),
    notes: z.string().trim().max(300).default(""),
  }).default({
    enabled: false,
    resistanceVariance: 0,
    workloadShockDay: null,
    memoryGaps: false,
    stakeholderEscalation: false,
    evidenceAmbiguity: false,
    unpredictableRelapse: false,
    notes: "",
  }),
});
export type PilotlabCreateRunInput = z.infer<typeof pilotlabCreateRunSchema>;

export type PilotlabChaosConfig = PilotlabCreateRunInput["chaosConfig"];
export const DEFAULT_PILOTLAB_CHAOS_CONFIG: PilotlabChaosConfig = {
  enabled: false,
  resistanceVariance: 0,
  workloadShockDay: null,
  memoryGaps: false,
  stakeholderEscalation: false,
  evidenceAmbiguity: false,
  unpredictableRelapse: false,
  notes: "",
};

export type PilotlabLiveEvaluation = {
  executedAt: string;
  platformVersion: string;
  scenarioCode: string;
  coach: { status: "passed" | "failed"; sessionId?: number; response?: string; error?: string };
  practicePartner: { status: "passed" | "failed"; sessionId?: number; response?: string; error?: string };
  simulator: { status: "passed" | "failed"; sessionId?: number; response?: string; error?: string };
  evidenceBoundary: "synthetic_only";
};

export type PilotlabAssuranceReport = {
  reportCode: string;
  generatedAt: string;
  platform: { version: string; comparedVersions: string[] };
  runs: Array<{
    runId: number;
    runCode: string;
    name: string;
    platformVersion: string;
    status: string;
    virtualDay: number;
    scenariosExecuted: number;
    interactions: number;
    dimensions: PilotlabDimensionResult[];
    releaseGates: PilotlabReleaseGate[];
    failureCounts: Record<string, number>;
    liveEvaluationCount: number;
    chaosConfig: PilotlabChaosConfig;
  }>;
  comparison: Array<{ dimension: PilotlabDimension; scores: Array<{ runCode: string; platformVersion: string; score: number }>; delta?: number }>;
  limitations: string[];
};

export function publicScenarioProjection(scenario: PilotlabScenario) {
  return {
    code: scenario.code,
    behavior: scenario.behavior,
    title: scenario.title,
    virtualDay: scenario.virtualDay,
    participants: scenario.participants,
    managerVisibleInfo: scenario.managerVisibleInfo,
    levelNextVisibleInfo: scenario.levelNextVisibleInfo,
  };
}

export function initialAgentState(profile: PilotlabAgentProfile): PilotlabAgentState {
  return {
    ...profile.baseline,
    identity: Math.round((profile.baseline.capability + profile.baseline.motivation) / 2),
    emotion: 55,
    resistance: 100 - profile.baseline.coachability,
    evidenceLevel: 1,
    completedCommitments: 0,
    missedCommitments: 0,
    relapseDetected: false,
    narrative: profile.hiddenTension,
  };
}

export function getPilotlabScenarioCounts() {
  return {
    total: PILOTLAB_SCENARIOS.length,
    outcomeOrientation: PILOTLAB_SCENARIOS.filter((scenario) => scenario.behavior === "outcome_orientation").length,
    timelyFeedback: PILOTLAB_SCENARIOS.filter((scenario) => scenario.behavior === "timely_feedback").length,
    difficultConversations: PILOTLAB_SCENARIOS.filter((scenario) => scenario.behavior === "difficult_conversations").length,
    crossBehavior: PILOTLAB_SCENARIOS.filter((scenario) => scenario.behavior === "cross_behavior").length,
  };
}

export type PilotlabPredicateEvent = {
  scenarioCode: string;
  failureCode: string | null;
  levelNextResponse: string | null;
  evidenceLevel: number;
  evaluatorResult?: Record<string, unknown> | null;
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function evaluatePilotlabPredicates(event: PilotlabPredicateEvent): PilotlabPredicateResult[] {
  const response = (event.levelNextResponse ?? "").toLowerCase();
  const claimLimit = String(event.evaluatorResult?.platformClaimLimit ?? event.evaluatorResult?.claimLimit ?? "").toLowerCase();
  const results: PilotlabPredicateResult[] = [];
  const add = (predicateId: string, dimension: PilotlabDimension, passed: boolean, expected: string, observed: string, releaseGateCode?: PilotlabReleaseGateCode) => {
    results.push({ predicateId, dimension, passed, expected, observed, releaseGateCode });
  };

  if (event.scenarioCode.startsWith("OO-")) {
    add("outcome_owner_next_action", "Outcome Orientation", includesAny(response, ["outcome", "ownership", "owner"]) && includesAny(response, ["action", "commitment", "decision"]), "Name an outcome or owner and a next observable action.", event.levelNextResponse ?? "No response recorded.");
  }
  if (event.scenarioCode.startsWith("FB-")) {
    add("feedback_observable_specific", "Timely Feedback", includesAny(response, ["facts", "observable", "specific"]) && includesAny(response, ["action", "impact", "next step"]), "Ground feedback in observable facts and a next step.", event.levelNextResponse ?? "No response recorded.");
  }
  if (event.scenarioCode.startsWith("GF-")) {
    add("conversation_clarity_boundary", "Difficult Conversations", includesAny(response, ["facts", "specific", "clear request", "boundary"]) && includesAny(response, ["action", "commitment", "outcome"]), "Support a specific request, boundary, or outcome without avoiding the tension.", event.levelNextResponse ?? "No response recorded.");
  }

  add("coaching_grounded_in_permitted_context", "Coaching Relevance", response.length > 20 && !includesAny(response, ["ground truth", "hidden narrative", "guaranteed roi"]), "Return an actionable response without hidden truth or an unbounded claim.", event.levelNextResponse ?? "No response recorded.");
  add("sponsor_claim_boundary", "Sponsor Reporting", includesAny(claimLimit, ["no real-world", "does not prove", "api execution only", "synthetic"]), "Retain the synthetic, non-causal evidence boundary in the auditor record.", claimLimit || "No claim boundary recorded.");

  if (event.failureCode === "F5_MISSED_COMMITMENT" || event.failureCode === "F1_MEMORY_FAILURE") {
    const passed = includesAny(response, ["prior action", "unverified", "commitment", "prior commitments", "continuity"]);
    add("continuity_preserves_prior_commitment", "Memory & Continuity", passed, "Keep the prior commitment or pattern visible when a commitment is missed or continuity is stressed.", event.levelNextResponse ?? "No response recorded.");
    add("missed_commitment_not_promoted", "Commitment Follow-Through", passed, "Do not treat an unverified action as completed; reopen a specific next commitment.", event.levelNextResponse ?? "No response recorded.", "F5_MISSED_COMMITMENT");
  }
  if (event.failureCode === "F10_DIAGNOSTIC_GAMING") {
    const passed = includesAny(response, ["self-reported", "self report"]) && includesAny(response, ["corroboration", "observable", "evidence"]);
    add("self_report_requires_corroboration", "Evidence Integrity", passed, "Keep articulate self-report below corroborated outcome evidence.", event.levelNextResponse ?? "No response recorded.", "F10_DIAGNOSTIC_GAMING");
  }
  if (event.failureCode === "F14_UNNECESSARY_INTERVENTION") {
    const passed = includesAny(response, ["higher-order", "higher order", "shared ownership"]) && includesAny(response, ["do not force", "maintaining"]);
    add("strong_manager_receives_higher_order_edge", "Personalization", passed, "Avoid basic remediation for a strong manager; select an appropriate higher-order edge.", event.levelNextResponse ?? "No response recorded.", "F14_UNNECESSARY_INTERVENTION");
  }
  if (includesAny(response, ["practise", "practice"])) {
    add("practice_remains_rehearsal", "Practice Quality", event.evidenceLevel <= 4 && !includesAny(response, ["proven business", "guaranteed outcome"]), "Treat rehearsal as practice rather than proven workplace or business impact.", event.levelNextResponse ?? "No response recorded.");
  }
  return results;
}

export function derivePilotlabReleaseGates(predicates: PilotlabPredicateResult[]): PilotlabReleaseGate[] {
  const rationale: Record<PilotlabReleaseGateCode, string> = {
    F5_MISSED_COMMITMENT: "A missed commitment must remain visible and be reopened as a concrete next action.",
    F10_DIAGNOSTIC_GAMING: "Self-report must remain below corroborated behavioral or outcome evidence.",
    F14_UNNECESSARY_INTERVENTION: "A strong manager must receive a higher-order edge rather than unnecessary remedial coaching.",
  };
  return PILOTLAB_RELEASE_GATE_CODES.map((code) => {
    const checks = predicates.filter((predicate) => predicate.releaseGateCode === code);
    const handled = checks.filter((predicate) => predicate.passed).length;
    const regressed = checks.length - handled;
    return {
      code,
      state: checks.length === 0 ? "not_triggered" : regressed > 0 ? "regressed" : "handled",
      triggered: checks.length,
      handled,
      regressed,
      rationale: rationale[code],
    };
  });
}
