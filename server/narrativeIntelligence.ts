/**
 * LevelNext Narrative Intelligence™ — Server Domain Service
 *
 * Implements persistent participant-owned profile operations, structured hypothesis
 * generation, question exploration, behavioral experiment tracking, evidence logging,
 * 90-second resets, and privacy-preserving audit logging.
 */

import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import {
  niOperatingProfiles,
  niNarratives,
  niExperiments,
  niEvidence,
  niResetLogs,
  niSharingGrants,
  reports,
  mepDiagnosticResults,
  icAuditEvents,
  users,
  spAssignments,
  type NiOperatingProfile,
  type NiNarrative,
  type NiExperiment,
  type NiEvidence,
  type NiResetLog,
  type NiSharingGrant,
} from "../drizzle/schema";
import {
  CURATED_ROLE_TRANSITIONS,
  NARRATIVE_LENSES,
  NARRATIVE_PATTERN_LIBRARY,
  sanitizeInterventionLanguage,
  type NarrativeCategory,
  type NarrativeStatus,
  type ParticipantResonance,
  type EvidenceSource,
} from "../shared/modules/narrativeIntelligence";
import { invokeStructured } from "./structuredLlm";

// ── 1. Audit Logging Helper ─────────────────────────────────────────────────────

export async function logNarrativeAuditEvent(event: {
  tenantId?: number | null;
  actorUserId: number;
  subjectUserId: number;
  eventType: string;
  resourceType?: string;
  resourceId?: number;
  processingPurpose?: string;
  authorizationResult?: "allowed" | "denied" | "not_applicable";
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  try {
    const [subject] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, event.subjectUserId))
      .limit(1);
    if (!subject) return;

    await db.insert(icAuditEvents).values({
      tenantId: event.tenantId ?? null,
      actorUserId: event.actorUserId,
      subjectUserId: event.subjectUserId,
      eventType: event.eventType,
      resourceType: event.resourceType ?? "narrative_intelligence",
      resourceId: event.resourceId ?? null,
      processingPurpose: event.processingPurpose ?? "private_development_coaching",
      authorizationResult: event.authorizationResult ?? "allowed",
      metadata: event.metadata ?? null,
    });
  } catch (err) {
    console.warn("[NarrativeAudit] Failed to log audit event:", err);
  }
}

// ── 2. Profile Management ───────────────────────────────────────────────────────

export async function getOrCreateOperatingProfile(
  userId: number,
  tenantId: number | null = null,
): Promise<NiOperatingProfile> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [existing] = await db
    .select()
    .from(niOperatingProfiles)
    .where(eq(niOperatingProfiles.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Check if user has an existing MEP diagnostic or report to seed role transition
  let initialRole = "Engineering / Technical Leader";
  let defaultTransitionId = "mep_expert_to_enabler";
  let fromIdentity = "The Technical Problem Solver";
  let toIdentity = "The Capability Multiplier";
  let emergingAssumption = "My value increasingly comes from creating capability and problem-solving capacity in my team.";
  const commitments = [
    "Ask before telling in technical discussions.",
    "Coach through questions before offering your own solution.",
    "Clarify ownership boundaries at the start of assignments.",
  ];

  const [mepReport] = await db
    .select()
    .from(mepDiagnosticResults)
    .where(eq(mepDiagnosticResults.userId, userId))
    .orderBy(desc(mepDiagnosticResults.createdAt))
    .limit(1);

  if (mepReport?.zone || mepReport?.diagnosticCode) {
    initialRole = "Manager / Team Lead";
  }

  await db.insert(niOperatingProfiles).values({
    userId,
    tenantId,
    currentRole: initialRole,
    currentRoleTransition: defaultTransitionId,
    fromIdentity,
    toIdentity,
    emergingAssumption,
    commitments,
    status: "active",
    currentWeek: 1,
    completedWeeks: [],
    activeNarrativeCount: 0,
    experimentCount: 0,
    evidenceCount: 0,
  });

  const [created] = await db
    .select()
    .from(niOperatingProfiles)
    .where(eq(niOperatingProfiles.userId, userId))
    .limit(1);

  await logNarrativeAuditEvent({
    tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_profile_created",
    resourceType: "ni_operating_profile",
    resourceId: created.id,
    processingPurpose: "private_development_coaching",
  });

  return created;
}

// ── 3. Structured Hypothesis Generation ─────────────────────────────────────────

const generatedHypothesisListSchema = z.object({
  hypotheses: z.array(
    z.object({
      category: z.enum(["self", "relational", "work_world", "future"]),
      statement: z.string().min(5).max(400),
      historicalStrength: z.string().max(300),
      currentCost: z.string().max(300),
      emergingAssumption: z.string().max(300),
    })
  ).min(2).max(5),
});

type GeneratedHypothesisList = z.infer<typeof generatedHypothesisListSchema>;

export async function generateHypothesesForParticipant(
  userId: number,
  tenantId: number | null = null,
  sourceModule: string = "mep",
): Promise<NiNarrative[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const profile = await getOrCreateOperatingProfile(userId, tenantId);

  // Inspect diagnostic context if available
  const [latestReport] = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(1);

  const [mepResult] = await db
    .select()
    .from(mepDiagnosticResults)
    .where(eq(mepDiagnosticResults.userId, userId))
    .orderBy(desc(mepDiagnosticResults.createdAt))
    .limit(1);

  const diagnosticArchetype = latestReport?.archetype || mepResult?.zone || "Expert Leader";
  const diagnosticZone = latestReport?.zone || "Developing";

  const defaultTransition = CURATED_ROLE_TRANSITIONS.find(
    (t) => t.id === profile.currentRoleTransition
  ) ?? CURATED_ROLE_TRANSITIONS[0];

  const fallbackHypotheses: GeneratedHypothesisList = {
    hypotheses: [
      {
        category: "self",
        statement: defaultTransition.limitingNarrative,
        historicalStrength: defaultTransition.historicalStrength,
        currentCost: defaultTransition.narrativeTax,
        emergingAssumption: defaultTransition.generativeAssumption,
      },
      {
        category: "relational",
        statement: "If a high-stakes outcome is at risk, stepping in to rescue is the responsible leadership move.",
        historicalStrength: "Reliability, high commitment, team protection.",
        currentCost: "Deprives team members of agency and keeps me overloaded.",
        emergingAssumption: "Real support means offering clear guardrails and coaching, not taking back the work.",
      },
      {
        category: "work_world",
        statement: "Credibility in senior forums depends on having every detail and answer figured out.",
        historicalStrength: "Thoroughness and technical preparation.",
        currentCost: "Over-preparation, reluctance to speak early, and hesitation when data is incomplete.",
        emergingAssumption: "Senior credibility comes from strategic framing and intellectual honesty, not omniscience.",
      },
      {
        category: "future",
        statement: "My highest impact will always come from my individual technical discernment.",
        historicalStrength: "Mastery and precision in execution.",
        currentCost: "Limits my ceiling to roles where I can touch every line of delivery.",
        emergingAssumption: "My highest impact will come from the direction, systems, and people I enable.",
      },
    ],
  };

  const systemPrompt = `You are the LevelNext Narrative Intelligence Engine.
Your role is to discover tentative, respectful operating assumptions driving professional behaviour.
You are NOT a psychotherapist, psychiatrist, or psychological assessor.
DO NOT use diagnostic labels (e.g. "You are The Controller").
DO NOT mention childhood or trauma.
Generate 4 exploratory narrative hypotheses tailored to a professional in transition: "${defaultTransition.title}".
Diagnostic context: Archetype = ${diagnosticArchetype}, Zone = ${diagnosticZone}.

Return JSON strictly matching the schema:
{
  "hypotheses": [
    {
      "category": "self" | "relational" | "work_world" | "future",
      "statement": "Tentative narrative statement phrased in first-person e.g. 'My value comes from personally solving difficult issues.'",
      "historicalStrength": "What this narrative protected or enabled in the past",
      "currentCost": "What this narrative costs in their current or next role",
      "emergingAssumption": "A more generative, useful operating assumption for their next stage"
    }
  ]
}`;

  const userPrompt = `Generate 4 developmental narrative hypotheses for a leader transitioning from "${defaultTransition.fromIdentity}" to "${defaultTransition.toIdentity}".`;

  const structuredResult = await invokeStructured({
    context: "narrative_hypothesis_generation",
    schemaName: "narrative_hypotheses",
    schema: generatedHypothesisListSchema,
    fallback: fallbackHypotheses,
    request: {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 1000,
    },
  });

  const generated = structuredResult.value.hypotheses;
  const insertedNarratives: NiNarrative[] = [];

  for (const item of generated) {
    // Validate safety language
    const safetyCheck = sanitizeInterventionLanguage(item.statement);
    const statement = safetyCheck.safe ? item.statement : defaultTransition.limitingNarrative;

    const [inserted] = await db
      .insert(niNarratives)
      .values({
        profileId: profile.id,
        userId,
        tenantId,
        category: item.category,
        statement,
        status: "test",
        sourceModule,
        participantResonance: "explore",
        historicalStrength: item.historicalStrength,
        currentCost: item.currentCost,
        emergingAssumption: item.emergingAssumption,
        convictionScore: 70,
        isHighPriority: item.category === "self",
      })
      .$returningId();

    const [row] = await db.select().from(niNarratives).where(eq(niNarratives.id, inserted.id));
    if (row) insertedNarratives.push(row);
  }

  // Update profile active narrative count
  await db
    .update(niOperatingProfiles)
    .set({
      activeNarrativeCount: insertedNarratives.length,
      lastActivityAt: new Date(),
    })
    .where(eq(niOperatingProfiles.id, profile.id));

  await logNarrativeAuditEvent({
    tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_hypotheses_generated",
    resourceType: "ni_narratives",
    processingPurpose: "private_development_coaching",
    metadata: { count: insertedNarratives.length, fallbackUsed: structuredResult.status === "fallback" },
  });

  return insertedNarratives;
}

// ── 4. Participant Hypothesis Response ──────────────────────────────────────────

export async function recordHypothesisResponse(
  userId: number,
  narrativeId: number,
  resonance: ParticipantResonance,
  editedStatement?: string,
  reflectionNote?: string,
): Promise<NiNarrative> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [narrative] = await db
    .select()
    .from(niNarratives)
    .where(and(eq(niNarratives.id, narrativeId), eq(niNarratives.userId, userId)))
    .limit(1);

  if (!narrative) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Narrative hypothesis not found" });
  }

  const updates: Partial<typeof niNarratives.$inferInsert> = {
    participantResonance: resonance,
    updatedAt: new Date(),
  };

  if (editedStatement && editedStatement.trim().length >= 5) {
    updates.statement = editedStatement.trim();
  }
  if (reflectionNote !== undefined) {
    updates.participantReflection = reflectionNote.trim();
  }

  // If dismissed or rejected, change status to retire
  if (resonance === "dismiss" || resonance === "does_not_resonate") {
    updates.status = "retire";
  } else if (resonance === "strongly_resonates" || resonance === "partly_resonates") {
    updates.status = "test";
  }

  await db.update(niNarratives).set(updates).where(eq(niNarratives.id, narrativeId));

  const [updated] = await db.select().from(niNarratives).where(eq(niNarratives.id, narrativeId));

  await logNarrativeAuditEvent({
    tenantId: narrative.tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_hypothesis_responded",
    resourceType: "ni_narrative",
    resourceId: narrativeId,
    metadata: { resonance, edited: Boolean(editedStatement) },
  });

  return updated;
}

// ── 5. Question Step (Fact vs Story vs Prediction) ──────────────────────────────

export async function saveQuestionAnalysis(
  userId: number,
  input: {
    narrativeId: number;
    factDescription: string;
    storyInterpretation: string;
    predictionMade: string;
    evidenceFor?: string[];
    evidenceAgainst?: string[];
    exceptionHunt?: string;
    narrativeTaxHistorical?: string;
    narrativeTaxCurrent?: string;
  },
): Promise<NiNarrative> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [narrative] = await db
    .select()
    .from(niNarratives)
    .where(and(eq(niNarratives.id, input.narrativeId), eq(niNarratives.userId, userId)))
    .limit(1);

  if (!narrative) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Narrative not found" });
  }

  await db
    .update(niNarratives)
    .set({
      factDescription: input.factDescription,
      storyInterpretation: input.storyInterpretation,
      predictionMade: input.predictionMade,
      evidenceFor: input.evidenceFor ?? null,
      evidenceAgainst: input.evidenceAgainst ?? null,
      exceptionHunt: input.exceptionHunt ?? null,
      historicalStrength: input.narrativeTaxHistorical ?? narrative.historicalStrength,
      currentCost: input.narrativeTaxCurrent ?? narrative.currentCost,
      isHighPriority: true,
      updatedAt: new Date(),
    })
    .where(eq(niNarratives.id, input.narrativeId));

  // Update profile currentWeek to 2 or 3 if appropriate
  const [profile] = await db
    .select()
    .from(niOperatingProfiles)
    .where(eq(niOperatingProfiles.id, narrative.profileId))
    .limit(1);

  if (profile) {
    const completedWeeks = Array.isArray(profile.completedWeeks) ? [...profile.completedWeeks] : [];
    if (!completedWeeks.includes(2)) completedWeeks.push(2);
    await db
      .update(niOperatingProfiles)
      .set({
        currentWeek: Math.max(profile.currentWeek, 2),
        completedWeeks,
        lastActivityAt: new Date(),
      })
      .where(eq(niOperatingProfiles.id, profile.id));
  }

  const [updated] = await db.select().from(niNarratives).where(eq(niNarratives.id, input.narrativeId));
  return updated;
}

// ── 6. Choose Next Chapter ──────────────────────────────────────────────────────

export async function chooseNextChapter(
  userId: number,
  input: {
    transitionId: string;
    fromIdentity: string;
    toIdentity: string;
    emergingAssumption: string;
    commitments: string[];
    futureSelfVision?: string;
  },
): Promise<NiOperatingProfile> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const profile = await getOrCreateOperatingProfile(userId);

  const completedWeeks = Array.isArray(profile.completedWeeks) ? [...profile.completedWeeks] : [];
  if (!completedWeeks.includes(3)) completedWeeks.push(3);

  await db
    .update(niOperatingProfiles)
    .set({
      currentRoleTransition: input.transitionId,
      fromIdentity: input.fromIdentity,
      toIdentity: input.toIdentity,
      emergingAssumption: input.emergingAssumption,
      commitments: input.commitments,
      futureSelfNarrative: input.futureSelfVision ?? profile.futureSelfNarrative,
      currentWeek: Math.max(profile.currentWeek, 3),
      completedWeeks,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(niOperatingProfiles.id, profile.id));

  const [updated] = await db.select().from(niOperatingProfiles).where(eq(niOperatingProfiles.id, profile.id));

  await logNarrativeAuditEvent({
    tenantId: profile.tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_next_chapter_chosen",
    resourceType: "ni_operating_profile",
    resourceId: profile.id,
    metadata: { transitionId: input.transitionId, toIdentity: input.toIdentity },
  });

  return updated;
}

// ── 7. Behavioral Experiments ───────────────────────────────────────────────────

export async function createExperiment(
  userId: number,
  input: {
    narrativeId: number;
    title: string;
    contextSituation: string;
    oldAssumption: string;
    alternativeHypothesis: string;
    behaviourToTest: string;
    predictedOutcome: string;
    predictedProbability?: number;
    experimentType?: "real_world" | "simulator" | "practice";
    targetDate?: string;
  },
): Promise<NiExperiment> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [narrative] = await db
    .select()
    .from(niNarratives)
    .where(and(eq(niNarratives.id, input.narrativeId), eq(niNarratives.userId, userId)))
    .limit(1);

  if (!narrative) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Narrative not found" });
  }

  const profile = await getOrCreateOperatingProfile(userId);

  const [inserted] = await db
    .insert(niExperiments)
    .values({
      profileId: profile.id,
      narrativeId: narrative.id,
      userId,
      tenantId: profile.tenantId,
      title: input.title,
      contextSituation: input.contextSituation,
      oldAssumption: input.oldAssumption,
      alternativeHypothesis: input.alternativeHypothesis,
      behaviourToTest: input.behaviourToTest,
      predictedOutcome: input.predictedOutcome,
      predictedProbability: input.predictedProbability ?? 70,
      experimentType: input.experimentType ?? "real_world",
      status: "planned",
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    })
    .$returningId();

  await db
    .update(niOperatingProfiles)
    .set({
      experimentCount: sql`${niOperatingProfiles.experimentCount} + 1`,
      lastActivityAt: new Date(),
    })
    .where(eq(niOperatingProfiles.id, profile.id));

  const [row] = await db.select().from(niExperiments).where(eq(niExperiments.id, inserted.id));
  return row;
}

export async function recordExperimentOutcome(
  userId: number,
  input: {
    experimentId: number;
    actualOutcome: string;
    whatRealityTaught: string;
    narrativeImpact: "strongly_challenged" | "partly_challenged" | "confirmed_old" | "inconclusive";
    convictionShiftOld?: number;
    convictionShiftEmerging?: number;
  },
): Promise<NiExperiment> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [experiment] = await db
    .select()
    .from(niExperiments)
    .where(and(eq(niExperiments.id, input.experimentId), eq(niExperiments.userId, userId)))
    .limit(1);

  if (!experiment) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Experiment not found" });
  }

  const now = new Date();
  await db
    .update(niExperiments)
    .set({
      actualOutcome: input.actualOutcome,
      whatRealityTaught: input.whatRealityTaught,
      narrativeImpact: input.narrativeImpact,
      convictionShiftOld: input.convictionShiftOld ?? null,
      convictionShiftEmerging: input.convictionShiftEmerging ?? null,
      status: "completed",
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(niExperiments.id, input.experimentId));

  // Automatically log evidence from completed experiment
  await db.insert(niEvidence).values({
    profileId: experiment.profileId,
    narrativeId: experiment.narrativeId,
    experimentId: experiment.id,
    userId,
    tenantId: experiment.tenantId,
    sourceType: experiment.experimentType === "simulator" ? "simulator_behaviour" : "real_world_outcome",
    situation: experiment.contextSituation,
    trigger: experiment.title,
    oldPrediction: experiment.predictedOutcome,
    actionTaken: experiment.behaviourToTest,
    outcome: input.actualOutcome,
    learning: input.whatRealityTaught,
    identityImplication:
      input.narrativeImpact === "strongly_challenged"
        ? "Demonstrated real capacity to operate beyond the old limiting assumption."
        : "Initial behavioural evidence logged.",
  });

  await db
    .update(niOperatingProfiles)
    .set({
      evidenceCount: sql`${niOperatingProfiles.evidenceCount} + 1`,
      currentWeek: 4,
      lastActivityAt: now,
    })
    .where(eq(niOperatingProfiles.id, experiment.profileId));

  const [updated] = await db.select().from(niExperiments).where(eq(niExperiments.id, input.experimentId));

  await logNarrativeAuditEvent({
    tenantId: experiment.tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_experiment_completed",
    resourceType: "ni_experiment",
    resourceId: input.experimentId,
    metadata: { narrativeImpact: input.narrativeImpact },
  });

  return updated;
}

// ── 8. Evidence Ledger ─────────────────────────────────────────────────────────

export async function logEvidence(
  userId: number,
  input: {
    narrativeId?: number;
    experimentId?: number;
    sourceType: EvidenceSource;
    sourceReferenceId?: number;
    situation: string;
    trigger?: string;
    actionTaken: string;
    outcome: string;
    learning: string;
    identityImplication?: string;
  },
): Promise<NiEvidence> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const profile = await getOrCreateOperatingProfile(userId);

  const [inserted] = await db
    .insert(niEvidence)
    .values({
      profileId: profile.id,
      narrativeId: input.narrativeId ?? null,
      experimentId: input.experimentId ?? null,
      userId,
      tenantId: profile.tenantId,
      sourceType: input.sourceType,
      sourceReferenceId: input.sourceReferenceId ?? null,
      situation: input.situation,
      trigger: input.trigger ?? null,
      actionTaken: input.actionTaken,
      outcome: input.outcome,
      learning: input.learning,
      identityImplication: input.identityImplication ?? null,
    })
    .$returningId();

  await db
    .update(niOperatingProfiles)
    .set({
      evidenceCount: sql`${niOperatingProfiles.evidenceCount} + 1`,
      lastActivityAt: new Date(),
    })
    .where(eq(niOperatingProfiles.id, profile.id));

  const [row] = await db.select().from(niEvidence).where(eq(niEvidence.id, inserted.id));
  return row;
}

// ── 9. 90-Second Narrative Reset ────────────────────────────────────────────────

export async function runNarrativeReset(
  userId: number,
  tenantId: number | null,
  input: {
    triggerSituation: string;
    noticeStory: string;
    separateFacts: string;
    alternativeView: string;
    chosenAssumption: string;
    immediateAction: string;
    saveToEvidence?: boolean;
  },
): Promise<NiResetLog> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const profile = await getOrCreateOperatingProfile(userId, tenantId);

  const [inserted] = await db
    .insert(niResetLogs)
    .values({
      userId,
      tenantId,
      triggerSituation: input.triggerSituation,
      noticeStory: input.noticeStory,
      separateFacts: input.separateFacts,
      alternativeView: input.alternativeView,
      chosenAssumption: input.chosenAssumption,
      immediateAction: input.immediateAction,
      savedAsEvidence: Boolean(input.saveToEvidence),
    })
    .$returningId();

  if (input.saveToEvidence) {
    await logEvidence(userId, {
      sourceType: "self_report",
      situation: input.triggerSituation,
      trigger: "90-Second Narrative Reset",
      actionTaken: input.immediateAction,
      outcome: "Rapid reframing applied before action.",
      learning: input.chosenAssumption,
      identityImplication: "Practised real-time narrative distance and choice.",
    });
  }

  const [row] = await db.select().from(niResetLogs).where(eq(niResetLogs.id, inserted.id));

  await logNarrativeAuditEvent({
    tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_reset_completed",
    resourceType: "ni_reset_log",
    resourceId: inserted.id,
    metadata: { savedAsEvidence: Boolean(input.saveToEvidence) },
  });

  return row;
}

// ── 10. Dashboard & Command Center Aggregator ───────────────────────────────────

export async function getDashboardPayload(userId: number, tenantId: number | null = null) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const profile = await getOrCreateOperatingProfile(userId, tenantId);

  const narratives = await db
    .select()
    .from(niNarratives)
    .where(eq(niNarratives.profileId, profile.id))
    .orderBy(desc(niNarratives.isHighPriority), desc(niNarratives.createdAt));

  const activeNarratives = narratives.filter((n) => n.status === "test" || n.status === "create");

  const experiments = await db
    .select()
    .from(niExperiments)
    .where(eq(niExperiments.profileId, profile.id))
    .orderBy(desc(niExperiments.createdAt))
    .limit(5);

  const recentEvidence = await db
    .select()
    .from(niEvidence)
    .where(eq(niEvidence.profileId, profile.id))
    .orderBy(desc(niEvidence.createdAt))
    .limit(8);

  const nextExperiment = experiments.find((e) => e.status === "planned" || e.status === "in_progress");

  // Calculate self-reported movement
  // Initial conviction typically 75%, emerging starts around 25% and grows
  const completedExperimentsCount = experiments.filter((e) => e.status === "completed").length;
  const oldConviction = Math.max(30, 75 - completedExperimentsCount * 12);
  const emergingConviction = Math.min(85, 25 + completedExperimentsCount * 15);

  return {
    profile,
    activeNarratives,
    allNarratives: narratives,
    experiments,
    nextExperiment,
    recentEvidence,
    stats: {
      activeNarrativeCount: activeNarratives.length,
      experimentCount: experiments.length,
      completedExperimentsCount,
      evidenceCount: profile.evidenceCount,
      oldConviction,
      emergingConviction,
    },
    currentRoleTransition: CURATED_ROLE_TRANSITIONS.find((t) => t.id === profile.currentRoleTransition) ?? CURATED_ROLE_TRANSITIONS[0],
  };
}

// ── 11. Sharing Permissions ─────────────────────────────────────────────────────

export async function saveSharingGrant(
  userId: number,
  tenantId: number | null,
  input: {
    recipientRole: "success_partner" | "coach" | "manager";
    shareNextChapter?: boolean;
    shareBehaviours?: boolean;
    shareExperimentCount?: boolean;
    shareEvidenceSummary?: boolean;
    shareSupportRequest?: string;
  },
): Promise<NiSharingGrant> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const profile = await getOrCreateOperatingProfile(userId, tenantId);

  const [existing] = await db
    .select()
    .from(niSharingGrants)
    .where(and(eq(niSharingGrants.profileId, profile.id), eq(niSharingGrants.recipientRole, input.recipientRole)))
    .limit(1);

  if (existing) {
    await db
      .update(niSharingGrants)
      .set({
        shareNextChapter: input.shareNextChapter ?? true,
        shareBehaviours: input.shareBehaviours ?? true,
        shareExperimentCount: input.shareExperimentCount ?? true,
        shareEvidenceSummary: input.shareEvidenceSummary ?? true,
        shareSupportRequest: input.shareSupportRequest ?? null,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(niSharingGrants.id, existing.id));

    const [updated] = await db.select().from(niSharingGrants).where(eq(niSharingGrants.id, existing.id));
    await logNarrativeAuditEvent({
      tenantId,
      actorUserId: userId,
      subjectUserId: userId,
      eventType: "ni_sharing_grant_saved",
      resourceType: "ni_sharing_grant",
      resourceId: updated.id,
      metadata: { recipientRole: input.recipientRole },
    });
    return updated;
  }

  const [inserted] = await db
    .insert(niSharingGrants)
    .values({
      profileId: profile.id,
      userId,
      tenantId,
      recipientRole: input.recipientRole,
      shareNextChapter: input.shareNextChapter ?? true,
      shareBehaviours: input.shareBehaviours ?? true,
      shareExperimentCount: input.shareExperimentCount ?? true,
      shareEvidenceSummary: input.shareEvidenceSummary ?? true,
      shareSupportRequest: input.shareSupportRequest ?? null,
      status: "active",
    })
    .$returningId();

  const [created] = await db.select().from(niSharingGrants).where(eq(niSharingGrants.id, inserted.id));

  await logNarrativeAuditEvent({
    tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    eventType: "ni_sharing_grant_saved",
    resourceType: "ni_sharing_grant",
    resourceId: created.id,
    metadata: { recipientRole: input.recipientRole },
  });

  return created;
}

// ── 12. Consent-Gated Success Partner Shared View ───────────────────────────────

/**
 * Return only the participant-approved Narrative Intelligence summary for an
 * authenticated Success Partner. Raw narratives, reflections, evidence text,
 * predictions, and private reset content are deliberately excluded.
 */
export async function getSuccessPartnerSharedView(partnerUserId: number, participantUserId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const [participant] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, participantUserId))
    .limit(1);
  if (!participant) throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });

  const [assignment] = await db
    .select({ id: spAssignments.id })
    .from(spAssignments)
    .where(and(eq(spAssignments.spUserId, partnerUserId), eq(spAssignments.managedUserId, participantUserId)))
    .limit(1);
  if (!assignment) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned to this participant." });
  }

  const [grant] = await db
    .select()
    .from(niSharingGrants)
    .where(
      and(
        eq(niSharingGrants.userId, participantUserId),
        eq(niSharingGrants.recipientRole, "success_partner"),
        eq(niSharingGrants.status, "active"),
        or(isNull(niSharingGrants.recipientUserId), eq(niSharingGrants.recipientUserId, partnerUserId)),
      )
    )
    .orderBy(desc(niSharingGrants.updatedAt))
    .limit(1);

  if (!grant) {
    await logNarrativeAuditEvent({
      actorUserId: partnerUserId,
      subjectUserId: participantUserId,
      eventType: "ni_shared_view_denied",
      resourceType: "ni_shared_view",
      authorizationResult: "denied",
      metadata: { recipientRole: "success_partner" },
    });
    throw new TRPCError({ code: "FORBIDDEN", message: "The participant has not enabled this shared view." });
  }

  const [profile] = await db
    .select({
      toIdentity: niOperatingProfiles.toIdentity,
      emergingAssumption: niOperatingProfiles.emergingAssumption,
      commitments: niOperatingProfiles.commitments,
      currentWeek: niOperatingProfiles.currentWeek,
      evidenceCount: niOperatingProfiles.evidenceCount,
      lastActivityAt: niOperatingProfiles.lastActivityAt,
    })
    .from(niOperatingProfiles)
    .where(eq(niOperatingProfiles.userId, participantUserId))
    .limit(1);

  const experiments = await db
    .select({ status: niExperiments.status })
    .from(niExperiments)
    .where(eq(niExperiments.userId, participantUserId));

  const completedExperimentCount = experiments.filter((experiment) => experiment.status === "completed").length;
  const plannedExperimentCount = experiments.filter((experiment) => experiment.status === "planned" || experiment.status === "in_progress").length;

  await logNarrativeAuditEvent({
    actorUserId: partnerUserId,
    subjectUserId: participantUserId,
    eventType: "ni_shared_view_opened",
    resourceType: "ni_shared_view",
    authorizationResult: "allowed",
    metadata: {
      grantId: grant.id,
      shareNextChapter: grant.shareNextChapter,
      shareBehaviours: grant.shareBehaviours,
      shareExperimentCount: grant.shareExperimentCount,
    },
  });

  return {
    participant: { id: participant.id, name: participant.name, email: participant.email },
    consent: {
      grantId: grant.id,
      updatedAt: grant.updatedAt,
      shareNextChapter: grant.shareNextChapter,
      shareBehaviours: grant.shareBehaviours,
      shareExperimentCount: grant.shareExperimentCount,
      shareSupportRequest: grant.shareSupportRequest,
    },
    nextChapter: grant.shareNextChapter
      ? { toIdentity: profile?.toIdentity ?? null, emergingAssumption: profile?.emergingAssumption ?? null }
      : null,
    commitments: grant.shareBehaviours ? (profile?.commitments ?? []) : [],
    experimentCounts: grant.shareExperimentCount
      ? {
          total: experiments.length,
          completed: completedExperimentCount,
          planned: plannedExperimentCount,
          evidenceCount: profile?.evidenceCount ?? 0,
        }
      : null,
    progress: {
      currentWeek: profile?.currentWeek ?? 1,
      lastActivityAt: profile?.lastActivityAt ?? null,
    },
    privacy: {
      rawNarrativesIncluded: false,
      reflectionTextIncluded: false,
      evidenceTextIncluded: false,
      privateResetLogsIncluded: false,
    },
  };
}

// ── 13. Consent-Scoped Coaching Inquiry Generator ───────────────────────────────

const coachingInquiryQuestionsSchema = z.object({
  questions: z.array(z.string().trim().min(12).max(320)).min(3).max(5),
  coachingFrame: z.string().trim().min(20).max(500),
});

type CoachingInquiryQuestions = z.infer<typeof coachingInquiryQuestionsSchema>;

const fallbackCoachingQuestions = (commitments: string[]): CoachingInquiryQuestions => ({
  questions: [
    `What would it look like to practise “${commitments[0]}” in your next relevant conversation?`,
    "What signal will tell you that you are operating from this commitment rather than reverting to the old pattern?",
    "What support or accountability would make this behaviour easier to sustain this week?",
  ],
  coachingFrame: "Use these as open invitations. Let the participant define the example, meaning, and next step; do not infer a private narrative from the commitment.",
});

/**
 * Generate coaching questions from participant-approved commitments only.
 * This function intentionally calls the consent-gated shared view first, so
 * question generation can never bypass assignment or sharing permissions.
 */
export async function generateSuccessPartnerInquiryQuestions(
  partnerUserId: number,
  participantUserId: number,
  focus?: string,
) {
  const shared = await getSuccessPartnerSharedView(partnerUserId, participantUserId);
  if (!shared.consent.shareBehaviours || shared.commitments.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The participant has not shared active commitments for coaching inquiry.",
    });
  }

  const commitments = shared.commitments.slice(0, 8);
  const fallback = fallbackCoachingQuestions(commitments);
  const structuredResult = await invokeStructured({
    context: "success_partner_inquiry_questions",
    schemaName: "success_partner_inquiry_questions",
    schema: coachingInquiryQuestionsSchema,
    fallback,
    request: {
      messages: [
        {
          role: "system",
          content: [
            "You are a skilled executive coach supporting a participant through a consented development conversation.",
            "Generate 3 to 5 short, non-leading inquiry questions based ONLY on the participant-approved commitments below.",
            "Do not diagnose, label, interpret hidden motives, mention private narratives, or invent context.",
            "Questions must invite concrete examples, observable behaviour, learning, or the participant's chosen next step.",
            "Use a respectful coaching tone. Do not prescribe advice or tell the participant what their answer should be.",
            "Return JSON matching the schema with a brief coachingFrame explaining how to use the questions.",
            "",
            "Approved commitments:",
            ...commitments.map((commitment, index) => `${index + 1}. ${commitment}`),
          ].join("\\n"),
        },
        {
          role: "user",
          content: focus?.trim()
            ? `Draft the questions with this optional conversation focus: ${focus.trim()}`
            : "Draft the questions for the next Success Partner check-in.",
        },
      ],
      maxTokens: 800,
    },
  });

  await logNarrativeAuditEvent({
    actorUserId: partnerUserId,
    subjectUserId: participantUserId,
    eventType: "ni_partner_questions_generated",
    resourceType: "ni_shared_view",
    authorizationResult: "allowed",
    metadata: {
      grantId: shared.consent.grantId,
      questionCount: structuredResult.value.questions.length,
      fallbackUsed: structuredResult.status === "fallback",
      focusProvided: Boolean(focus?.trim()),
    },
  });

  return {
    ...structuredResult.value,
    generatedBy: structuredResult.status === "fallback" ? "safe_fallback" as const : "ai" as const,
    approvedCommitmentCount: commitments.length,
  };
}

// ── 14. Participant Privacy Activity ─────────────────────────────────────────────

export async function getParticipantPrivacyActivity(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const events = await db
    .select({
      eventType: icAuditEvents.eventType,
      authorizationResult: icAuditEvents.authorizationResult,
      occurredAt: icAuditEvents.occurredAt,
    })
    .from(icAuditEvents)
    .where(
      and(
        eq(icAuditEvents.subjectUserId, userId),
        inArray(icAuditEvents.eventType, [
          "ni_shared_view_opened",
          "ni_shared_view_denied",
          "ni_partner_questions_generated",
          "ni_sharing_grant_saved",
        ]),
      ),
    )
    .orderBy(desc(icAuditEvents.occurredAt))
    .limit(20);

  return events.map((event) => ({
    occurredAt: event.occurredAt,
    authorizationResult: event.authorizationResult,
    eventType: event.eventType,
    label:
      event.eventType === "ni_partner_questions_generated"
        ? "A Success Partner drafted commitment-based inquiry questions"
        : event.eventType === "ni_shared_view_opened"
          ? "A Success Partner opened your approved shared view"
          : event.eventType === "ni_shared_view_denied"
            ? "A shared-view access attempt was blocked"
            : "Your Narrative Intelligence sharing preferences were updated",
  }));
}

// ── 15. Success Partner Cohort Consent Overview ─────────────────────────────────

export async function getSuccessPartnerCohortConsentOverview(partnerUserId: number, partnerRole: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const visibleIds = partnerRole === "admin"
    ? (await db.select({ id: users.id }).from(users).where(eq(users.role, "user"))).map((user) => user.id)
    : (await db
        .select({ managedUserId: spAssignments.managedUserId })
        .from(spAssignments)
        .where(eq(spAssignments.spUserId, partnerUserId)))
        .map((assignment) => assignment.managedUserId);

  if (visibleIds.length === 0) {
    return { summary: { total: 0, active: 0, limited: 0, private: 0 }, participants: [] };
  }

  const visibleUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, visibleIds));

  const participants = await Promise.all(
    visibleUsers.map(async (participant) => {
      const [grant] = await db
        .select({
          status: niSharingGrants.status,
          updatedAt: niSharingGrants.updatedAt,
          shareNextChapter: niSharingGrants.shareNextChapter,
          shareBehaviours: niSharingGrants.shareBehaviours,
          shareExperimentCount: niSharingGrants.shareExperimentCount,
          shareEvidenceSummary: niSharingGrants.shareEvidenceSummary,
        })
        .from(niSharingGrants)
        .where(
          and(
            eq(niSharingGrants.userId, participant.id),
            eq(niSharingGrants.recipientRole, "success_partner"),
          ),
        )
        .orderBy(desc(niSharingGrants.updatedAt))
        .limit(1);

      const isActive = grant?.status === "active";
      const sharedSectionCount = grant
        ? [grant.shareNextChapter, grant.shareBehaviours, grant.shareExperimentCount, grant.shareEvidenceSummary].filter(Boolean).length
        : 0;
      const state = !isActive ? "private" as const : sharedSectionCount === 4 ? "active" as const : "limited" as const;

      return {
        participant: { id: participant.id, name: participant.name, email: participant.email },
        state,
        grantUpdatedAt: grant?.updatedAt ?? null,
        sharedSectionCount,
        sharedSections: grant
          ? {
              nextChapter: grant.shareNextChapter,
              commitments: grant.shareBehaviours,
              experimentCounts: grant.shareExperimentCount,
              evidenceSummary: grant.shareEvidenceSummary,
            }
          : { nextChapter: false, commitments: false, experimentCounts: false, evidenceSummary: false },
      };
    }),
  );

  return {
    summary: {
      total: participants.length,
      active: participants.filter((participant) => participant.state === "active").length,
      limited: participants.filter((participant) => participant.state === "limited").length,
      private: participants.filter((participant) => participant.state === "private").length,
    },
    participants: participants.sort((a, b) => {
      const order = { limited: 0, private: 1, active: 2 } as const;
      return order[a.state] - order[b.state] || (a.participant.name ?? a.participant.email ?? "").localeCompare(b.participant.name ?? b.participant.email ?? "");
    }),
  };
}

// ── 12. Simulator & Practice Evidence Adapters ──────────────────────────────────

export async function logSimulatorEvidenceIfApplicable(
  userId: number,
  sessionId: number,
  debrief: {
    overallScore?: number;
    keyTakeaway?: string;
    coachingInsights?: string;
    strengths?: string[];
    improvements?: string[];
  },
) {
  const db = await getDb();
  if (!db) return;

  const [profile] = await db
    .select()
    .from(niOperatingProfiles)
    .where(eq(niOperatingProfiles.userId, userId))
    .limit(1);

  if (!profile) return;

  const [activeExp] = await db
    .select()
    .from(niExperiments)
    .where(
      and(
        eq(niExperiments.profileId, profile.id),
        eq(niExperiments.experimentType, "simulator"),
        eq(niExperiments.status, "planned"),
      )
    )
    .orderBy(desc(niExperiments.createdAt))
    .limit(1);

  const situation = "LevelNext Simulator rehearsal session";
  const actionTaken = "Conducted interactive conversational simulation with AI stakeholder.";
  const outcome = debrief.overallScore ? `Scored ${debrief.overallScore}/100 in simulation.` : "Completed simulation rehearsal.";
  const learning = debrief.keyTakeaway || (debrief.strengths ? debrief.strengths.join(". ") : "Practiced leadership conversation.");

  if (activeExp) {
    await recordExperimentOutcome(userId, {
      experimentId: activeExp.id,
      actualOutcome: outcome,
      whatRealityTaught: learning,
      narrativeImpact: (debrief.overallScore ?? 0) >= 75 ? "strongly_challenged" : "partly_challenged",
    });
  } else {
    await logEvidence(userId, {
      sourceType: "simulator_behaviour",
      sourceReferenceId: sessionId,
      situation,
      trigger: "LevelNext Simulation Rehearsal",
      actionTaken,
      outcome,
      learning,
      identityImplication: "Tested new communication behaviours in realistic simulation.",
    });
  }
}

export async function logPracticeEvidenceIfApplicable(
  userId: number,
  attemptId: number,
  scenarioTitle: string,
  feedback: {
    overallScore?: number;
    oneBehaviourToImprove?: string;
    strengths?: string[];
  },
) {
  const db = await getDb();
  if (!db) return;

  const [profile] = await db
    .select()
    .from(niOperatingProfiles)
    .where(eq(niOperatingProfiles.userId, userId))
    .limit(1);

  if (!profile) return;

  const situation = `Practice Partner: ${scenarioTitle}`;
  const actionTaken = "Rehearsed workplace dialogue with AI Practice Coach.";
  const outcome = feedback.overallScore ? `Scored ${feedback.overallScore}/5 in rehearsal.` : "Completed practice scenario.";
  const learning = feedback.oneBehaviourToImprove || (feedback.strengths ? feedback.strengths.join(". ") : "Completed practice rehearsal.");

  await logEvidence(userId, {
    sourceType: "practice_attempt",
    sourceReferenceId: attemptId,
    situation,
    trigger: scenarioTitle,
    actionTaken,
    outcome,
    learning,
    identityImplication: "Built behavioral muscle memory through structured deliberate practice.",
  });
}
