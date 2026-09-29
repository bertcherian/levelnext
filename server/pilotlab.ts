import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  pilotlabAgents,
  pilotlabEvents,
  pilotlabResults,
  pilotlabRuns,
  type PilotlabAgent,
  type PilotlabRun,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  initialAgentState,
  DEFAULT_PILOTLAB_CHAOS_CONFIG,
  PILOTLAB_AGENT_PROFILES,
  PILOTLAB_DIMENSIONS,
  PILOTLAB_SCENARIOS,
  publicScenarioProjection,
  type PilotlabAgentProfile,
  type PilotlabAgentState,
  type PilotlabDimensionResult,
  type PilotlabFailureCode,
  type PilotlabChaosConfig,
  type PilotlabAssuranceReport,
  type PilotlabLiveEvaluation,
  type PilotlabScenario,
  type PilotlabSeverity,
  type PilotlabSimulationSummary,
} from "../shared/modules/pilotlab";
import type { TrpcContext } from "./_core/context";

const RUN_CODE_PREFIX = "PL";
const MAX_DAYS = 60;

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

type EventProjection = {
  id: number;
  scenarioCode: string;
  virtualDay: number;
  actorType: string;
  informationPlane: string;
  levelNextResponse: string | null;
  failureCode: string | null;
  severity: string;
  evidenceLevel: number;
  evaluatorResult: Record<string, unknown> | null;
  createdAt: Date;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asAgentState(value: unknown, profile: PilotlabAgentProfile): PilotlabAgentState {
  const fallback = initialAgentState(profile);
  const record = asRecord(value);
  return {
    ...fallback,
    ...record,
    capability: Number(record.capability ?? fallback.capability),
    motivation: Number(record.motivation ?? fallback.motivation),
    context: Number(record.context ?? fallback.context),
    identity: Number(record.identity ?? fallback.identity),
    emotion: Number(record.emotion ?? fallback.emotion),
    resistance: Number(record.resistance ?? fallback.resistance),
    trust: Number(record.trust ?? fallback.trust),
    coachability: Number(record.coachability ?? fallback.coachability),
    workload: Number(record.workload ?? fallback.workload),
    evidenceLevel: Number(record.evidenceLevel ?? fallback.evidenceLevel),
    completedCommitments: Number(record.completedCommitments ?? fallback.completedCommitments),
    missedCommitments: Number(record.missedCommitments ?? fallback.missedCommitments),
    relapseDetected: Boolean(record.relapseDetected ?? fallback.relapseDetected),
    narrative: String(record.narrative ?? fallback.narrative),
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function profileFor(key: string) {
  const profile = PILOTLAB_AGENT_PROFILES.find((candidate) => candidate.key === key);
  if (!profile) throw new Error(`Unknown Pilotlab manager: ${key}`);
  return profile;
}

function chaosFor(value: unknown): PilotlabChaosConfig {
  const config = asRecord(value);
  return {
    ...DEFAULT_PILOTLAB_CHAOS_CONFIG,
    enabled: Boolean(config.enabled),
    resistanceVariance: Math.max(0, Math.min(30, Number(config.resistanceVariance ?? 0))),
    workloadShockDay: config.workloadShockDay == null ? null : Math.max(1, Math.min(60, Number(config.workloadShockDay))),
    memoryGaps: Boolean(config.memoryGaps),
    stakeholderEscalation: Boolean(config.stakeholderEscalation),
    evidenceAmbiguity: Boolean(config.evidenceAmbiguity),
    unpredictableRelapse: Boolean(config.unpredictableRelapse),
    notes: String(config.notes ?? ""),
  };
}

function agentPlaneSeed(profile: PilotlabAgentProfile) {
  const state = initialAgentState(profile);
  return {
    groundTruth: {
      hiddenTension: profile.hiddenTension,
      developmentEdge: profile.developmentEdge,
      actualBehaviorEvents: [],
      isRestrictedToAuditor: true,
    },
    managerReality: {
      role: profile.role,
      currentNarrative: state.narrative,
      disclosedState: "The manager can disclose, minimize, exaggerate, or withhold information.",
    },
    levelNextReality: {
      permittedSources: ["intake", "diagnostics", "coaching", "practice", "commitments", "check-ins", "permitted evidence"],
      prohibitedSources: ["ground truth", "hidden narratives", "evaluator assertions", "internal test data"],
    },
    currentState: state,
  };
}

function managerDiscloses(profile: PilotlabAgentProfile, scenario: PilotlabScenario, state: PilotlabAgentState) {
  if (profile.trajectory === "false_positive") {
    return `I have already handled the ${scenario.title} conversation. I used a clear outcome frame and it went well.`;
  }
  if (profile.trajectory === "resistant_breakthrough" && scenario.virtualDay < 20) {
    return `I know what I should do about ${scenario.title}, but the timing does not feel right yet.`;
  }
  if (profile.trajectory === "improvement_relapse_recovery" && scenario.virtualDay >= 30 && scenario.virtualDay < 43) {
    return `The workload is unusually high. I have slipped into handling the issue myself rather than having the conversation.`;
  }
  if (profile.trajectory === "already_strong") {
    return `I clarified the outcome and had the conversation. The harder question is whether I left enough ownership with the team.`;
  }
  return `A workplace situation has surfaced: ${scenario.title}. I need to decide what I will do and by when.`;
}

function expectedPlatformResponse(profile: PilotlabAgentProfile, scenario: PilotlabScenario, state: PilotlabAgentState) {
  const disclosure = managerDiscloses(profile, scenario, state);
  const missedCommitment = profile.trajectory === "resistant_breakthrough" && scenario.virtualDay < 20;
  const possibleGaming = profile.trajectory === "false_positive";
  const relapse = profile.trajectory === "improvement_relapse_recovery" && scenario.virtualDay >= 30 && scenario.virtualDay < 43;
  const alreadyStrong = profile.trajectory === "already_strong";

  const response = missedCommitment
    ? "A prior action is still unverified. Do not assume completion. Explore what prevented action, name the consequence, practise the next conversation if useful, and agree a specific new commitment."
    : possibleGaming
      ? "Record this as self-reported action only. Ask for the observable situation, action, outcome, and any permitted corroboration before upgrading the evidence level."
      : relapse
        ? "Treat the workload change as a contextual pressure, not a character flaw. Compare the new pattern with prior commitments, acknowledge the relapse, and set a smaller recovery action."
        : alreadyStrong
          ? "Do not force a basic intervention. Test the higher-order edge: whether the manager creates shared ownership while maintaining an explicit outcome."
          : "Separate facts from interpretation, clarify the intended outcome, identify the smallest observable action, and establish a time-bound commitment.";

  return { disclosure, response, missedCommitment, possibleGaming, relapse, alreadyStrong };
}

function applyTrajectory(profile: PilotlabAgentProfile, scenario: PilotlabScenario, current: PilotlabAgentState, chaos: PilotlabChaosConfig) {
  const next = { ...current };
  let evidenceLevel = Math.max(1, current.evidenceLevel);
  let completed = false;
  let failureCode: PilotlabFailureCode | null = null;
  let severity: PilotlabSeverity = "informational";
  let note = "A permitted interaction was evaluated without accessing hidden ground truth.";
  const chaosActive = chaos.enabled;
  const resistanceVariance = chaosActive ? chaos.resistanceVariance : 0;
  const workloadShock = chaosActive && chaos.workloadShockDay === scenario.virtualDay;
  const memoryGap = chaosActive && chaos.memoryGaps && scenario.virtualDay % 3 === 0;

  if (profile.trajectory === "resistant_breakthrough") {
    if (scenario.virtualDay < 20) {
      next.resistance = clamp(next.resistance + 3 + resistanceVariance);
      next.missedCommitments += 1;
      evidenceLevel = 2;
      failureCode = "F5_MISSED_COMMITMENT";
      severity = "warning";
      note = "The manager has not completed the action. The continuity test is whether the platform notices rather than congratulates.";
    } else {
      next.resistance = clamp(next.resistance - 18);
      next.trust = clamp(next.trust + 16);
      next.coachability = clamp(next.coachability + 14);
      next.completedCommitments += 1;
      evidenceLevel = 4;
      completed = true;
      note = "A significant consequence has increased openness; the platform should respond to the shift without overstating outcome evidence.";
    }
  } else if (profile.trajectory === "false_positive") {
    next.completedCommitments += scenario.virtualDay % 2 === 0 ? 0 : 1;
    evidenceLevel = 4;
    failureCode = "F10_DIAGNOSTIC_GAMING";
    severity = "significant";
    note = "The manager's self-report is intentionally articulate but remains uncorroborated. Treating this as observable outcome would be a critical evidence-integrity failure.";
  } else if (profile.trajectory === "improvement_relapse_recovery") {
    if (scenario.virtualDay >= 30 && scenario.virtualDay < 43) {
      next.workload = clamp(next.workload + 25 + (workloadShock ? 20 : 0));
      next.resistance = clamp(next.resistance + 14);
      next.relapseDetected = true;
      next.missedCommitments += 1;
      evidenceLevel = 2;
      failureCode = memoryGap ? "F1_MEMORY_FAILURE" : "F5_MISSED_COMMITMENT";
      severity = "warning";
      note = `The manager has relapsed under workload pressure${workloadShock ? " with a configured workload shock" : ""}. The test is whether the system preserves continuity and detects the deviation from prior behavior.`;
    } else if (scenario.virtualDay >= 43) {
      next.workload = clamp(next.workload - 10);
      next.completedCommitments += 1;
      next.trust = clamp(next.trust + 10);
      evidenceLevel = 4;
      completed = true;
      note = "Recovery is emerging after a relapse. The system should neither erase the setback nor classify the journey as permanently failed.";
    } else {
      next.completedCommitments += 1;
      evidenceLevel = 3;
      completed = true;
      note = "Early practice shows movement but does not establish real-world outcome change.";
    }
  } else if (profile.trajectory === "slow_compounder") {
    const gain = scenario.virtualDay >= 36 ? 7 : 3;
    next.capability = clamp(next.capability + gain);
    next.trust = clamp(next.trust + 4);
    next.completedCommitments += scenario.virtualDay >= 18 ? 1 : 0;
    evidenceLevel = scenario.virtualDay >= 45 ? 4 : 2;
    completed = scenario.virtualDay >= 18;
    note = "Small repeatable movement is accumulating. The system should avoid abandoning or misclassifying slow progress.";
  } else {
    next.completedCommitments += 1;
    next.capability = clamp(next.capability + 2);
    next.evidenceLevel = Math.max(next.evidenceLevel, 4);
    evidenceLevel = 4;
    completed = true;
    failureCode = "F14_UNNECESSARY_INTERVENTION";
    severity = "warning";
    note = "The manager is already strong on the basic behavior. The system is tested on whether it identifies a higher-order edge rather than forcing remedial work.";
  }

  next.evidenceLevel = Math.max(next.evidenceLevel, evidenceLevel);
  if (memoryGap) {
    next.evidenceLevel = Math.max(1, next.evidenceLevel - 1);
    note += " A configured memory-gap perturbation reduced permitted continuity evidence for this event.";
  }
  if (chaosActive && chaos.evidenceAmbiguity && scenario.virtualDay % 2 === 0) {
    next.evidenceLevel = Math.min(next.evidenceLevel, 2);
    note += " A configured evidence-ambiguity perturbation kept the result at a low evidence level.";
  }
  if (chaosActive && chaos.stakeholderEscalation && scenario.virtualDay % 4 === 0) {
    next.emotion = clamp(next.emotion - 12);
    note += " A configured stakeholder escalation increased emotional load without changing hidden truth.";
  }
  if (chaosActive && chaos.unpredictableRelapse && scenario.virtualDay >= 18 && scenario.virtualDay % 5 === 0) {
    next.relapseDetected = true;
    next.resistance = clamp(next.resistance + 9);
    note += " A configured unpredictable relapse variation was introduced for resilience testing.";
  }
  next.emotion = clamp(profile.trajectory === "improvement_relapse_recovery" && scenario.virtualDay >= 30 && scenario.virtualDay < 43 ? 38 : next.emotion + (completed ? 5 : -3));
  return { next, evidenceLevel, completed, failureCode, severity, note };
}

function resultForDimension(dimension: typeof PILOTLAB_DIMENSIONS[number], events: EventProjection[]): PilotlabDimensionResult {
  const failures = events.filter((event) => event.failureCode);
  const passed = Math.max(0, events.length - failures.length);
  const critical = events.filter((event) => event.severity === "critical").length;
  const significant = events.filter((event) => event.severity === "significant").length;
  const score = clamp(100 - failures.length * 4 - critical * 20 - significant * 8);
  const evidenceMap: Record<typeof PILOTLAB_DIMENSIONS[number], string> = {
    "Outcome Orientation": "Scenarios test whether a clear outcome, ownership, and next action are distinguished from task activity.",
    "Timely Feedback": "Scenarios test whether feedback becomes observable, timely, and connected to a next action rather than a personality label.",
    "Difficult Conversations": "Scenarios test whether the system supports a clear request or boundary without avoiding the tension.",
    "Personalization": "Five distinct trajectories prevent a one-size-fits-all intervention from being treated as sufficient.",
    "Memory & Continuity": "Missed commitments and relapse events are retained across virtual time instead of being silently reset.",
    "Coaching Relevance": "Controller-owned events do not coach. The controlled LevelNext response remains grounded in permitted manager context.",
    "Practice Quality": "Practice is counted as simulated rehearsal, never promoted automatically to real-world behavior change.",
    "Commitment Follow-Through": "A missed action remains incomplete until permitted evidence supports an actual action.",
    "Evidence Integrity": "Self-report is capped at evidence level 4; simulated business consequences never become proven ROI.",
    "Sponsor Reporting": "The sponsor conclusion reports limits and next tests rather than manufacturing causal certainty.",
  };
  return { dimension, score, passed, failed: failures.length, evidence: evidenceMap[dimension] };
}

function buildSummary(run: PilotlabRun, events: EventProjection[]): PilotlabSimulationSummary {
  const dimensions = PILOTLAB_DIMENSIONS.map((dimension) => resultForDimension(dimension, events));
  const failureCounts = events.reduce<Record<string, number>>((counts, event) => {
    if (event.failureCode) counts[event.failureCode] = (counts[event.failureCode] ?? 0) + 1;
    return counts;
  }, {});
  return {
    runCode: run.runCode,
    virtualDurationDays: 60,
    managerCount: 5,
    interactions: events.length,
    goldenScenariosExecuted: events.filter((event) => event.actorType === "levelnext_simulation").length,
    dimensions,
    failureCounts,
    leakageEvents: failureCounts.F3_INFORMATION_LEAKAGE ?? 0,
    privacyViolations: failureCounts.F12_PRIVACY_BOUNDARY_FAILURE ?? 0,
    hallucinatedEvidence: failureCounts.F2_HALLUCINATED_EVIDENCE ?? 0,
    falseCausality: failureCounts.F9_FALSE_CAUSALITY ?? 0,
    brokenJourneys: failureCounts.F13_JOURNEY_FAILURE ?? 0,
    gaming: failureCounts.F10_DIAGNOSTIC_GAMING ?? 0,
    sponsorConclusion: "Pilotlab found controlled simulation risks and evidence limits. This run does not prove behavioral or financial impact in a real organization; it identifies what should be tested, observed, and challenged in a live pilot.",
  };
}

async function getRunOrThrow(db: Db, runId: number) {
  const [run] = await db.select().from(pilotlabRuns).where(eq(pilotlabRuns.id, runId)).limit(1);
  if (!run) throw new Error("Pilotlab run not found");
  return run;
}

async function fetchEventProjection(db: Db, runId: number) {
  return db.select({
    id: pilotlabEvents.id,
    scenarioCode: pilotlabEvents.scenarioCode,
    virtualDay: pilotlabEvents.virtualDay,
    actorType: pilotlabEvents.actorType,
    informationPlane: pilotlabEvents.informationPlane,
    levelNextResponse: pilotlabEvents.levelNextResponse,
    failureCode: pilotlabEvents.failureCode,
    severity: pilotlabEvents.severity,
    evidenceLevel: pilotlabEvents.evidenceLevel,
    evaluatorResult: pilotlabEvents.evaluatorResult,
    createdAt: pilotlabEvents.createdAt,
  }).from(pilotlabEvents).where(eq(pilotlabEvents.runId, runId)).orderBy(asc(pilotlabEvents.virtualDay), asc(pilotlabEvents.id));
}

export async function createPilotlabRun(ownerUserId: number, name: string, platformVersion = "current-preview", chaosConfig: PilotlabChaosConfig = DEFAULT_PILOTLAB_CHAOS_CONFIG) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const runCode = `${RUN_CODE_PREFIX}-${nanoid(7).toUpperCase()}`;
  const [created] = await db.insert(pilotlabRuns).values({
    ownerUserId,
    runCode,
    name,
    platformVersion,
    scenariosTotal: PILOTLAB_SCENARIOS.length,
    chaosConfig,
  }).$returningId();

  const runId = created.id;
  await db.insert(pilotlabAgents).values(PILOTLAB_AGENT_PROFILES.map((profile) => {
    const planes = agentPlaneSeed(profile);
    return { runId, managerKey: profile.key, name: profile.name, role: profile.role, trajectory: profile.trajectory, ...planes };
  }));

  return getPilotlabRunDetails(runId);
}

export async function advancePilotlabRun(runId: number, requestedDays: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const run = await getRunOrThrow(db, runId);
  if (run.status === "completed") return getPilotlabRunDetails(runId);

  const targetDay = Math.min(MAX_DAYS, Math.max(run.virtualDay + 1, run.virtualDay + requestedDays));
  const chaos = chaosFor(run.chaosConfig);
  const executedCodes = new Set((await db.select({ scenarioCode: pilotlabEvents.scenarioCode }).from(pilotlabEvents).where(and(eq(pilotlabEvents.runId, runId), eq(pilotlabEvents.actorType, "levelnext_simulation")))).map((event) => event.scenarioCode));
  const agents = await db.select().from(pilotlabAgents).where(eq(pilotlabAgents.runId, runId));
  const agentsByKey = new Map(agents.map((agent) => [agent.managerKey, agent]));
  const dueScenarios = PILOTLAB_SCENARIOS.filter((scenario) => scenario.virtualDay <= targetDay && !executedCodes.has(scenario.code));

  await db.update(pilotlabRuns).set({ status: "running", startedAt: run.startedAt ?? new Date(), virtualDay: targetDay }).where(eq(pilotlabRuns.id, runId));

  for (let index = 0; index < dueScenarios.length; index += 1) {
    const scenario = dueScenarios[index]!;
    const profile = PILOTLAB_AGENT_PROFILES[index % PILOTLAB_AGENT_PROFILES.length]!;
    const agent = agentsByKey.get(profile.key);
    if (!agent) continue;
    const current = asAgentState(agent.currentState, profile);
    const projected = expectedPlatformResponse(profile, scenario, current);
    const change = applyTrajectory(profile, scenario, current, chaos);
    const permittedContext = {
      scenario: publicScenarioProjection(scenario),
      managerDisclosure: projected.disclosure,
      permittedHistory: { completedCommitments: current.completedCommitments, missedCommitments: current.missedCommitments, evidenceLevel: current.evidenceLevel },
      guardrail: "Ground truth, hidden narrative, evaluator assertions, and tests are excluded from this LevelNext simulation context.",
    };
    const evaluatorResult = {
      pass: true,
      rationale: change.note,
      auditExpectation: projected.possibleGaming ? "Self-report must not be upgraded to corroborated behavior or business impact." : projected.missedCommitment ? "The incomplete commitment must remain visible." : projected.relapse ? "The prior pattern must remain visible during recovery." : "The response must be grounded in permitted evidence.",
      platformClaimLimit: change.evidenceLevel <= 4 ? "No real-world outcome or business impact claim is permitted." : "Corroboration is still required before causal conclusions.",
    };

    await db.insert(pilotlabEvents).values({
      runId,
      agentId: agent.id,
      scenarioCode: scenario.code,
      virtualDay: scenario.virtualDay,
      actorType: "levelnext_simulation",
      informationPlane: "levelnext_reality",
      permittedContext,
      levelNextResponse: projected.response,
      action: { expectedAction: scenario.expectedAction, completed: change.completed },
      stateChange: { before: current, after: change.next },
      evidenceGenerated: { level: change.evidenceLevel, label: change.evidenceLevel <= 3 ? "practice_or_intent" : "self_reported_action", warning: "Simulation evidence is not live-pilot evidence." },
      evaluatorResult: { ...evaluatorResult, chaos: chaos.enabled ? chaos : null },
      failureCode: change.failureCode,
      severity: change.severity,
      evidenceLevel: change.evidenceLevel,
    });

    await db.update(pilotlabAgents).set({
      managerReality: { role: profile.role, currentNarrative: change.next.narrative, lastDisclosure: projected.disclosure },
      levelNextReality: { permittedSources: ["intake", "diagnostics", "coaching", "practice", "commitments", "check-ins", "permitted evidence"], lastPermittedContext: permittedContext },
      currentState: change.next,
    }).where(eq(pilotlabAgents.id, agent.id));
  }

  const events = await fetchEventProjection(db, runId);
  const refreshed = await getRunOrThrow(db, runId);
  const completed = targetDay >= MAX_DAYS || events.filter((event) => event.actorType === "levelnext_simulation").length >= PILOTLAB_SCENARIOS.length;
  const summary = buildSummary({ ...refreshed, virtualDay: targetDay }, events);
  await db.update(pilotlabRuns).set({
    status: completed ? "completed" : "running",
    virtualDay: targetDay,
    interactions: events.length,
    scenariosExecuted: events.filter((event) => event.actorType === "levelnext_simulation").length,
    summary,
    failureSummary: summary.failureCounts,
    completedAt: completed ? new Date() : null,
  }).where(eq(pilotlabRuns.id, runId));

  if (completed) {
    await db.delete(pilotlabResults).where(eq(pilotlabResults.runId, runId));
    await db.insert(pilotlabResults).values(summary.dimensions.map((dimension) => ({
      runId,
      dimension: dimension.dimension,
      score: dimension.score,
      passed: dimension.passed,
      failed: dimension.failed,
      evidence: dimension.evidence,
    })));
  }

  return getPilotlabRunDetails(runId);
}

export async function getPilotlabRunDetails(runId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const run = await getRunOrThrow(db, runId);
  const [agents, events, results] = await Promise.all([
    db.select({ id: pilotlabAgents.id, managerKey: pilotlabAgents.managerKey, name: pilotlabAgents.name, role: pilotlabAgents.role, trajectory: pilotlabAgents.trajectory, managerReality: pilotlabAgents.managerReality, levelNextReality: pilotlabAgents.levelNextReality, currentState: pilotlabAgents.currentState }).from(pilotlabAgents).where(eq(pilotlabAgents.runId, runId)).orderBy(asc(pilotlabAgents.id)),
    fetchEventProjection(db, runId),
    db.select().from(pilotlabResults).where(eq(pilotlabResults.runId, runId)).orderBy(asc(pilotlabResults.dimension)),
  ]);
  const summary = run.summary ? run.summary as unknown as PilotlabSimulationSummary : buildSummary(run, events);
  return { run, agents, events, results, summary, scenarioInventory: PILOTLAB_SCENARIOS.map(publicScenarioProjection) };
}

export async function getPilotlabWorkspace() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const runs = await db.select().from(pilotlabRuns).orderBy(desc(pilotlabRuns.createdAt)).limit(20);
  const latest = runs[0];
  return { runs, latest: latest ? await getPilotlabRunDetails(latest.id) : null };
}

export async function getPilotlabRunForAdmin(runId: number) {
  return getPilotlabRunDetails(runId);
}
