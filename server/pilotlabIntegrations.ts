import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { pilotlabEvents, pilotlabRuns } from "../drizzle/schema";
import { getDb } from "./db";
import {
  PILOTLAB_AGENT_PROFILES,
  PILOTLAB_DIMENSIONS,
  type PilotlabAssuranceReport,
  type PilotlabLiveEvaluation,
} from "../shared/modules/pilotlab";
import type { TrpcContext } from "./_core/context";

function clip(value: unknown, limit = 1200) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

type AdapterResult = { status: "passed" | "failed"; sessionId?: number; response?: string; error?: string };

function resultOrFailure(run: () => Promise<AdapterResult>): Promise<AdapterResult> {
  return run().catch((error) => ({ status: "failed", error: error instanceof Error ? error.message : "Live adapter failed" }));
}

export async function runPilotlabLiveEvaluation(runId: number, ctx: TrpcContext, scenarioCode?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [run] = await db.select().from(pilotlabRuns).where(eq(pilotlabRuns.id, runId)).limit(1);
  if (!run) throw new Error("Pilotlab run not found");

  const [scenarioEvent] = scenarioCode
    ? await db.select().from(pilotlabEvents).where(and(eq(pilotlabEvents.runId, runId), eq(pilotlabEvents.scenarioCode, scenarioCode))).limit(1)
    : await db.select().from(pilotlabEvents).where(eq(pilotlabEvents.runId, runId)).orderBy(desc(pilotlabEvents.virtualDay)).limit(1);
  const code = scenarioEvent?.scenarioCode ?? "OO-001";
  const profile = PILOTLAB_AGENT_PROFILES[0]!;
  const prompt = `This is a controlled Pilotlab synthetic evaluation for ${profile.name}, ${profile.role}. Scenario code ${code}. Treat the following as synthetic manager disclosure only: "The manager needs to clarify a consequential outcome, give timely feedback, and hold a difficult conversation." Do not claim a real-world result, ROI, or corroborated evidence.`;
  const { appRouter } = await import("./routers");
  const caller = appRouter.createCaller(ctx);

  const coach = await resultOrFailure(async () => {
    const created = await caller.practice.createSession({ issueText: prompt });
    const response = await caller.practice.sendCoachMessage({ sessionId: created.sessionId, message: "Help the synthetic manager separate facts, interpretation, desired outcome, and the next observable conversation move." });
    return { status: "passed" as const, sessionId: created.sessionId, response: clip(response.message?.content ?? response.messages?.at(-1)?.content) };
  });
  const practicePartner = await resultOrFailure(async () => {
    const created = await caller.mep.startPracticeSession({ scenarioId: "feedback", scenarioLabel: "Pilotlab synthetic difficult feedback conversation", counterpartPersonality: "resistant" });
    const response = await caller.mep.sendPracticeMessage({ sessionId: created.id, message: "I want to be specific about the observable gap, the outcome we need, and the next action without labelling your character." });
    return { status: "passed" as const, sessionId: created.id, response: clip(response.reply) };
  });
  const simulator = await resultOrFailure(async () => {
    const created = await caller.simulator.startSession({
      platform: "manager",
      userPrompt: prompt,
      conversationType: "Pilotlab synthetic difficult conversation",
      stakeholder: "Direct report",
      objective: "Reach a specific, time-bound next action",
      expectedChallenge: "The counterpart is guarded and asks for evidence before agreeing",
      difficulty: 3,
      estimatedMinutes: 5,
      characterName: "Synthetic Counterpart",
      characterStyle: "guarded but fair",
      voice: "shubh",
    });
    const response = await caller.simulator.sendMessage({ sessionId: created.sessionId, message: "I want to name the facts first, then agree what good looks like and what we will each do next." });
    return { status: "passed" as const, sessionId: created.sessionId, response: clip(response.reply) };
  });

  const evaluation: PilotlabLiveEvaluation = {
    executedAt: new Date().toISOString(),
    platformVersion: run.platformVersion,
    scenarioCode: code,
    coach,
    practicePartner,
    simulator,
    evidenceBoundary: "synthetic_only",
  };
  const adapters = [coach, practicePartner, simulator];
  for (const adapter of [
    { name: "live_coach_adapter", result: coach },
    { name: "live_practice_partner_adapter", result: practicePartner },
    { name: "live_simulator_adapter", result: simulator },
  ]) {
    await db.insert(pilotlabEvents).values({
      runId,
      scenarioCode: `${code}-${adapter.name.replace("live_", "").toUpperCase()}`,
      virtualDay: run.virtualDay,
      actorType: adapter.name,
      informationPlane: "levelnext_reality",
      permittedContext: { scenarioCode: code, platformVersion: run.platformVersion, syntheticOnly: true, source: "Pilotlab controlled adapter" },
      levelNextResponse: "Live API adapter executed with synthetic context; response is not a real manager outcome.",
      action: { adapter: adapter.name, sessionId: "sessionId" in adapter.result ? adapter.result.sessionId : null },
      stateChange: null,
      evidenceGenerated: { level: 2, label: "live_api_response_in_synthetic_context" },
      evaluatorResult: { pass: adapter.result.status === "passed", response: "response" in adapter.result ? adapter.result.response : undefined, error: "error" in adapter.result ? adapter.result.error : undefined, claimLimit: "This verifies API execution only; it does not prove behavior, business outcome, or ROI." },
      failureCode: adapter.result.status === "passed" ? null : "F7_WEAK_COACHING",
      severity: adapter.result.status === "passed" ? "informational" : "significant",
      evidenceLevel: 2,
    });
  }
  await db.update(pilotlabRuns).set({ integrationSummary: evaluation, interactions: (run.interactions ?? 0) + adapters.length }).where(eq(pilotlabRuns.id, runId));
  return evaluation;
}

function csvEscape(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function buildPilotlabAssuranceReport(runIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const runs = runIds.length
    ? await db.select().from(pilotlabRuns).where(inArray(pilotlabRuns.id, runIds)).orderBy(asc(pilotlabRuns.createdAt))
    : await db.select().from(pilotlabRuns).orderBy(desc(pilotlabRuns.createdAt)).limit(10);
  if (!runs.length) throw new Error("No Pilotlab runs selected");

  const reportRuns = await Promise.all(runs.map(async (run) => {
    const events = await db.select({ actorType: pilotlabEvents.actorType }).from(pilotlabEvents).where(eq(pilotlabEvents.runId, run.id));
    const summary = (run.summary ?? {}) as Record<string, unknown>;
    const dimensions = Array.isArray(summary.dimensions) ? summary.dimensions as PilotlabAssuranceReport["runs"][number]["dimensions"] : [];
    return {
      runId: run.id,
      runCode: run.runCode,
      name: run.name,
      status: run.status,
      virtualDay: run.virtualDay,
      scenariosExecuted: run.scenariosExecuted,
      interactions: run.interactions,
      dimensions,
      failureCounts: (run.failureSummary ?? {}) as Record<string, number>,
      liveEvaluationCount: events.filter((event) => event.actorType.startsWith("live_")).length,
      chaosConfig: (run.chaosConfig ?? {}) as PilotlabAssuranceReport["runs"][number]["chaosConfig"],
      platformVersion: run.platformVersion,
    };
  }));

  const comparison = PILOTLAB_DIMENSIONS.map((dimension) => ({
    dimension,
    scores: reportRuns.map((run) => ({
      runCode: run.runCode,
      platformVersion: run.platformVersion,
      score: run.dimensions.find((candidate) => candidate.dimension === dimension)?.score ?? 0,
    })),
  }));
  const report: PilotlabAssuranceReport = {
    reportCode: `PLR-${nanoid(8).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    platform: { version: reportRuns[reportRuns.length - 1]!.platformVersion, comparedVersions: Array.from(new Set(reportRuns.map((run) => run.platformVersion))) },
    runs: reportRuns,
    comparison,
    limitations: [
      "Pilotlab uses synthetic manager agents and controlled scenarios; it is not a substitute for a live pilot.",
      "Live Coach, Practice Partner, and Simulator adapter passes verify API execution in synthetic context only.",
      "Simulation evidence does not establish causality, business impact, financial value, or ROI.",
      "Chaos variations are deterministic configuration perturbations, not a statistical estimate of field variance.",
    ],
  };
  const rows = [
    ["Pilotlab assurance report", report.reportCode],
    ["Generated at", report.generatedAt],
    ["Platform versions", report.platform.comparedVersions.join(" | ")],
    [],
    ["Run code", "Platform version", "Status", "Virtual day", "Scenarios executed", "Interactions", "Live evaluations", "Failure counts"],
    ...report.runs.map((run) => [run.runCode, run.platformVersion, run.status, run.virtualDay, run.scenariosExecuted, run.interactions, run.liveEvaluationCount, JSON.stringify(run.failureCounts)]),
    [],
    ["Dimension", "Run code", "Platform version", "Score"],
    ...report.comparison.flatMap((comparison) => comparison.scores.map((score) => [comparison.dimension, score.runCode, score.platformVersion, score.score])),
  ];
  return { report, csv: rows.map((row) => row.map(csvEscape).join(",")).join("\n") };
}
