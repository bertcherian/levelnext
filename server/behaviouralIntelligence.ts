/**
 * LevelNext Behavioural Intelligence Engine™ — Server Domain Service
 *
 * Implements the core behavioural feedback loop:
 *   Moment → Pattern → Observer → Distinction → Move → Practice → Action → Evidence → Reflection → New Capacity
 *
 * Enforces:
 *   - Participant ownership & tenant isolation
 *   - Non-diagnostic, non-clinical language safeguards
 *   - Structured LLM evaluation with 100% deterministic fallback
 *   - Minimal private-by-default audit logging (never logs sensitive situation/reflection text)
 */

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  biMoments,
  biAnalysisSnapshots,
  biMoves,
  biPracticeLinks,
  biActions,
  biEvidence,
  biReflections,
  icAuditEvents,
  type BiMoment,
  type BiAnalysisSnapshot,
  type BiMove,
  type BiPracticeLink,
  type BiAction,
  type BiEvidence,
  type BiReflection,
} from "../drizzle/schema";
import {
  behaviouralAnalysisSchema,
  createDeterministicFallbackAnalysis,
  sanitizeBehaviouralInterventionLanguage,
  calculateEvidenceLevelProgression,
  type CreateBehaviouralMomentInput,
  type BehaviouralAnalysis,
  type BehaviouralActionStatus,
  type BehaviouralEvidenceSource,
  type BehaviouralEvidenceLevel,
} from "../shared/modules/behaviouralIntelligence";
import {
  UNIVERSAL_ONTOLOGICAL_DISTINCTIONS,
  buildUodlCoachDirective,
} from "../shared/modules/universalOntologicalDistinctions";
import { invokeStructured } from "./structuredLlm";

// ── 1. Create Moment ────────────────────────────────────────────────────────────

export async function createMomentService(params: {
  input: CreateBehaviouralMomentInput;
  userId: number;
  tenantId?: number | null;
}): Promise<BiMoment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sanitizedSituation = sanitizeBehaviouralInterventionLanguage(params.input.situation).cleanText;
  const sanitizedDesiredOutcome = params.input.desiredOutcome
    ? sanitizeBehaviouralInterventionLanguage(params.input.desiredOutcome).cleanText
    : null;

  const [inserted] = await db.insert(biMoments).values({
    tenantId: params.tenantId ?? null,
    userId: params.userId,
    sourceApp: params.input.sourceApp ?? "behavioural_intelligence",
    sourceEntityType: params.input.sourceEntityType ?? null,
    sourceEntityId: params.input.sourceEntityId ?? null,
    moduleType: params.input.moduleType ?? null,
    situation: sanitizedSituation,
    desiredOutcome: sanitizedDesiredOutcome,
    observedBehaviour: params.input.observedBehaviour ?? null,
    role: params.input.role ?? null,
    careerStage: params.input.careerStage ?? "manager",
    authorityLevel: params.input.authorityLevel ?? null,
    stakeholders: params.input.stakeholders ?? null,
    organisationalContext: params.input.organisationalContext ?? null,
    culturalContext: params.input.culturalContext ?? null,
    powerDynamics: params.input.powerDynamics ?? null,
    consequences: params.input.consequences ?? null,
    evidence: params.input.evidence ?? [],
    diagnosticContext: params.input.diagnosticContext ?? null,
    status: "draft",
  });

  const momentId = inserted.insertId;

  // Log non-sensitive audit event
  await logBiAuditEvent({
    tenantId: params.tenantId ?? null,
    userId: params.userId,
    eventType: "bi_moment_created",
    resourceId: momentId,
    metadata: {
      sourceApp: params.input.sourceApp,
      careerStage: params.input.careerStage,
      hasDiagnosticContext: Boolean(params.input.diagnosticContext),
    },
  });

  const [moment] = await db.select().from(biMoments).where(eq(biMoments.id, momentId)).limit(1);
  return moment;
}

// ── 2. Analyse Moment ──────────────────────────────────────────────────────────

export async function analyseMomentService(params: {
  momentId: number;
  userId: number;
  tenantId?: number | null;
  forceFallback?: boolean;
}): Promise<{
  moment: BiMoment;
  snapshot: BiAnalysisSnapshot;
  move: BiMove;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [moment] = await db
    .select()
    .from(biMoments)
    .where(and(eq(biMoments.id, params.momentId), eq(biMoments.userId, params.userId)))
    .limit(1);

  if (!moment) {
    throw new Error("Moment not found or access denied.");
  }

  const fallback = createDeterministicFallbackAnalysis({
    sourceApp: moment.sourceApp,
    situation: moment.situation,
    desiredOutcome: moment.desiredOutcome ?? undefined,
    observedBehaviour: moment.observedBehaviour ?? undefined,
    role: moment.role ?? undefined,
    careerStage: moment.careerStage,
    authorityLevel: moment.authorityLevel ?? undefined,
    stakeholders: moment.stakeholders ?? undefined,
    organisationalContext: moment.organisationalContext ?? undefined,
    culturalContext: moment.culturalContext ?? undefined,
    powerDynamics: moment.powerDynamics ?? undefined,
    consequences: moment.consequences ?? undefined,
    evidence: moment.evidence ?? [],
  });

  let analysis: BehaviouralAnalysis = fallback;
  let modelStatus: "success" | "fallback" = "fallback";
  let fallbackReason: string | null = params.forceFallback ? "force_fallback_requested" : null;

  if (!params.forceFallback) {
    const distinctionCatalog = UNIVERSAL_ONTOLOGICAL_DISTINCTIONS.map(
      (d) => `${d.id} ${d.label}: Inquiry: "${d.inquiry}" | Guardrail: "${d.guardrail}"`
    ).join("\n");

    const systemPrompt = `You are the LevelNext Behavioural Intelligence Engine™.
Your goal is to analyse a specific, real workplace moment and produce a high-impact, actionable behavioral response.

${buildUodlCoachDirective()}

CRITICAL RULES:
1. Distinguish observable FACTS from INTERPRETATIONS and PREDICTIONS.
2. Select at most ONE or TWO Universal Ontological Distinctions (e.g. OD-01, OD-02, OD-05, OD-18, OD-20).
3. Recommend ONE practical, observable behavioural MOVE with suggested phrasing, success signal, and what NOT to do.
4. Keep the recommended depth at the shallowest useful level (D1_answer through D5_observer_shift). Default to D2_practice or D3_reflection.
5. NEVER use clinical, psychiatric, or permanent personality labels (e.g., narcissist, toxic, broken).
6. NEVER reframe harassment, discrimination, coercion, or structural constraints as a mindset problem.
7. Offer alternative explanations to avoid premature diagnostic lock-in.

AVAILABLE DISTINCTIONS:
${distinctionCatalog}`;

    const userPrompt = `MOMENT TO ANALYSE:
- Situation: ${moment.situation}
- Role & Authority: ${moment.role ?? "Leader/Manager"} (${moment.authorityLevel ?? "Mid-Senior"})
- Career Stage: ${moment.careerStage}
- Desired Outcome: ${moment.desiredOutcome ?? "Effective workplace alignment and progress"}
- Observed Behaviour: ${moment.observedBehaviour ?? "Self-reported account"}
- Stakeholders: ${moment.stakeholders ?? "Immediate colleagues/peers"}
- Organisational Context: ${moment.organisationalContext ?? "Corporate environment"}
- Power Dynamics: ${moment.powerDynamics ?? "Standard organizational hierarchy"}
- Consequences: ${moment.consequences ?? "Business project and relationship impact"}`;

    const structuredResult = await invokeStructured<BehaviouralAnalysis>({
      context: `bi-analysis-moment-${moment.id}`,
      schemaName: "behavioural_intelligence_analysis",
      schema: behaviouralAnalysisSchema,
      fallback,
      request: {
        model: "claude-sonnet-4-6",
        maxTokens: 1800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
    });

    if (structuredResult.status === "success") {
      modelStatus = "success";
      fallbackReason = null;
      analysis = structuredResult.value;
    } else {
      modelStatus = "fallback";
      fallbackReason = structuredResult.failure;
    }
  }

  // Sanitize texts
  analysis.narrativeHypothesis = sanitizeBehaviouralInterventionLanguage(analysis.narrativeHypothesis).cleanText;
  analysis.observerHypothesis = sanitizeBehaviouralInterventionLanguage(analysis.observerHypothesis).cleanText;
  analysis.move.description = sanitizeBehaviouralInterventionLanguage(analysis.move.description).cleanText;

  // Persist Snapshot
  const primaryDistinctionId = analysis.distinctionIds[0] ?? null;
  const secondaryDistinctionId = analysis.distinctionIds[1] ?? null;

  const [snapInsert] = await db.insert(biAnalysisSnapshots).values({
    momentId: moment.id,
    tenantId: moment.tenantId,
    userId: params.userId,
    engineVersion: analysis.engineVersion ?? "1.0.0",
    diagnosticLens: analysis.diagnosticLens,
    primaryGap: analysis.primaryGap,
    primaryDistinctionId,
    secondaryDistinctionId,
    confidence: analysis.confidence,
    analysis,
    modelStatus,
    fallbackReason,
    traceId: `bi-${moment.id}-${Date.now()}`,
  });
  const snapshotId = snapInsert.insertId;

  // Create recommended Move
  const [moveInsert] = await db.insert(biMoves).values({
    momentId: moment.id,
    analysisSnapshotId: snapshotId,
    tenantId: moment.tenantId,
    userId: params.userId,
    moveCode: analysis.move.moveCode,
    title: analysis.move.title,
    description: analysis.move.description,
    suggestedLanguage: analysis.move.suggestedLanguage,
    successSignal: analysis.move.successSignal,
    doNotDo: analysis.move.doNotDo,
    recommendedDepth: analysis.move.recommendedDepth,
    status: "proposed",
  });
  const moveId = moveInsert.insertId;

  // Update moment status
  await db
    .update(biMoments)
    .set({ status: "analysed", updatedAt: new Date() })
    .where(eq(biMoments.id, moment.id));

  // Audit
  await logBiAuditEvent({
    tenantId: moment.tenantId,
    userId: params.userId,
    eventType: "bi_moment_analysed",
    resourceId: moment.id,
    metadata: {
      modelStatus,
      primaryGap: analysis.primaryGap,
      primaryDistinctionId,
      confidence: analysis.confidence,
    },
  });

  const [updatedMoment] = await db.select().from(biMoments).where(eq(biMoments.id, moment.id)).limit(1);
  const [snapshot] = await db.select().from(biAnalysisSnapshots).where(eq(biAnalysisSnapshots.id, snapshotId)).limit(1);
  const [move] = await db.select().from(biMoves).where(eq(biMoves.id, moveId)).limit(1);

  return {
    moment: updatedMoment,
    snapshot,
    move,
  };
}

// ── 3. Moment Lineage & History ───────────────────────────────────────────────

export async function getMomentWithLineageService(
  momentId: number,
  userId: number
): Promise<{
  moment: BiMoment;
  snapshots: BiAnalysisSnapshot[];
  moves: BiMove[];
  practiceLinks: BiPracticeLink[];
  actions: BiAction[];
  evidence: BiEvidence[];
  reflections: BiReflection[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [moment] = await db
    .select()
    .from(biMoments)
    .where(and(eq(biMoments.id, momentId), eq(biMoments.userId, userId)))
    .limit(1);

  if (!moment) {
    throw new Error("Moment not found or access denied.");
  }

  const snapshots = await db
    .select()
    .from(biAnalysisSnapshots)
    .where(eq(biAnalysisSnapshots.momentId, momentId))
    .orderBy(desc(biAnalysisSnapshots.createdAt));

  const moves = await db
    .select()
    .from(biMoves)
    .where(eq(biMoves.momentId, momentId))
    .orderBy(desc(biMoves.createdAt));

  const practiceLinks = await db
    .select()
    .from(biPracticeLinks)
    .where(eq(biPracticeLinks.momentId, momentId))
    .orderBy(desc(biPracticeLinks.createdAt));

  const actions = await db
    .select()
    .from(biActions)
    .where(eq(biActions.momentId, momentId))
    .orderBy(desc(biActions.createdAt));

  const evidence = await db
    .select()
    .from(biEvidence)
    .where(eq(biEvidence.momentId, momentId))
    .orderBy(desc(biEvidence.createdAt));

  const reflections = await db
    .select()
    .from(biReflections)
    .where(eq(biReflections.momentId, momentId))
    .orderBy(desc(biReflections.createdAt));

  return {
    moment,
    snapshots,
    moves,
    practiceLinks,
    actions,
    evidence,
    reflections,
  };
}

export async function listMomentsService(
  userId: number,
  limit = 30
): Promise<BiMoment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(biMoments)
    .where(eq(biMoments.userId, userId))
    .orderBy(desc(biMoments.createdAt))
    .limit(limit);
}

// ── 4. Move Actions & Practice ────────────────────────────────────────────────

export async function selectMoveService(params: {
  moveId: number;
  momentId: number;
  userId: number;
}): Promise<BiMove> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [move] = await db
    .select()
    .from(biMoves)
    .where(and(eq(biMoves.id, params.moveId), eq(biMoves.userId, params.userId)))
    .limit(1);

  if (!move) throw new Error("Move not found or access denied.");

  await db
    .update(biMoves)
    .set({ status: "selected", updatedAt: new Date() })
    .where(eq(biMoves.id, move.id));

  await db
    .update(biMoments)
    .set({ status: "in_practice", updatedAt: new Date() })
    .where(eq(biMoments.id, params.momentId));

  const [updated] = await db.select().from(biMoves).where(eq(biMoves.id, move.id)).limit(1);
  return updated;
}

export async function createPracticeLinkService(params: {
  moveId: number;
  momentId: number;
  userId: number;
  tenantId?: number | null;
  providerType: string;
  providerSessionId?: number;
  scenarioContext?: Record<string, unknown>;
}): Promise<BiPracticeLink> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [linkInsert] = await db.insert(biPracticeLinks).values({
    moveId: params.moveId,
    momentId: params.momentId,
    tenantId: params.tenantId ?? null,
    userId: params.userId,
    providerType: params.providerType,
    providerSessionId: params.providerSessionId ?? null,
    scenarioContext: params.scenarioContext ?? null,
    practiceStatus: "in_progress",
    evidenceLevel: "prepared",
  });

  const [link] = await db.select().from(biPracticeLinks).where(eq(biPracticeLinks.id, linkInsert.insertId)).limit(1);
  return link;
}

export async function recordPracticeResultService(params: {
  practiceLinkId: number;
  userId: number;
  feedbackScores?: Record<string, unknown>;
  practiceStatus: "completed" | "abandoned";
}): Promise<BiPracticeLink> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [link] = await db
    .select()
    .from(biPracticeLinks)
    .where(and(eq(biPracticeLinks.id, params.practiceLinkId), eq(biPracticeLinks.userId, params.userId)))
    .limit(1);

  if (!link) throw new Error("Practice link not found or access denied.");

  const isCompleted = params.practiceStatus === "completed";
  const evidenceLevel: BehaviouralEvidenceLevel = isCompleted ? "practised" : "prepared";

  await db
    .update(biPracticeLinks)
    .set({
      practiceStatus: params.practiceStatus,
      feedbackScores: params.feedbackScores ?? null,
      evidenceLevel,
      updatedAt: new Date(),
    })
    .where(eq(biPracticeLinks.id, link.id));

  if (isCompleted) {
    await db
      .update(biMoves)
      .set({ status: "practised", updatedAt: new Date() })
      .where(eq(biMoves.id, link.moveId));
  }

  const [updated] = await db.select().from(biPracticeLinks).where(eq(biPracticeLinks.id, link.id)).limit(1);
  return updated;
}

// ── 5. Action Commitments ──────────────────────────────────────────────────────

export async function createActionService(params: {
  moveId: number;
  momentId: number;
  userId: number;
  tenantId?: number | null;
  actionDescription: string;
  personOrGroup?: string;
  dueAt?: Date | null;
}): Promise<BiAction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sanitized = sanitizeBehaviouralInterventionLanguage(params.actionDescription).cleanText;

  const [actionInsert] = await db.insert(biActions).values({
    moveId: params.moveId,
    momentId: params.momentId,
    tenantId: params.tenantId ?? null,
    userId: params.userId,
    actionDescription: sanitized,
    personOrGroup: params.personOrGroup ?? null,
    dueAt: params.dueAt ?? null,
    status: "planned",
  });

  await db
    .update(biMoves)
    .set({ status: "committed", updatedAt: new Date() })
    .where(eq(biMoves.id, params.moveId));

  await db
    .update(biMoments)
    .set({ status: "in_action", updatedAt: new Date() })
    .where(eq(biMoments.id, params.momentId));

  const [action] = await db.select().from(biActions).where(eq(biActions.id, actionInsert.insertId)).limit(1);
  return action;
}

export async function updateActionStatusService(params: {
  actionId: number;
  userId: number;
  status: BehaviouralActionStatus;
  completionNotes?: string;
}): Promise<BiAction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [action] = await db
    .select()
    .from(biActions)
    .where(and(eq(biActions.id, params.actionId), eq(biActions.userId, params.userId)))
    .limit(1);

  if (!action) throw new Error("Action not found or access denied.");

  const completedAt = params.status === "completed" ? new Date() : null;

  await db
    .update(biActions)
    .set({
      status: params.status,
      completionNotes: params.completionNotes ?? null,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(biActions.id, action.id));

  const [updated] = await db.select().from(biActions).where(eq(biActions.id, action.id)).limit(1);
  return updated;
}

// ── 6. Evidence & Reflection ───────────────────────────────────────────────────

export async function recordEvidenceService(params: {
  momentId: number;
  moveId?: number;
  actionId?: number;
  userId: number;
  tenantId?: number | null;
  sourceType?: BehaviouralEvidenceSource;
  situation: string;
  actionTaken: string;
  outcome: string;
  learning: string;
  evidenceLevel?: BehaviouralEvidenceLevel;
}): Promise<BiEvidence> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [evidenceInsert] = await db.insert(biEvidence).values({
    momentId: params.momentId,
    moveId: params.moveId ?? null,
    actionId: params.actionId ?? null,
    tenantId: params.tenantId ?? null,
    userId: params.userId,
    sourceType: params.sourceType ?? "self_report",
    situation: sanitizeBehaviouralInterventionLanguage(params.situation).cleanText,
    actionTaken: sanitizeBehaviouralInterventionLanguage(params.actionTaken).cleanText,
    outcome: sanitizeBehaviouralInterventionLanguage(params.outcome).cleanText,
    learning: sanitizeBehaviouralInterventionLanguage(params.learning).cleanText,
    evidenceLevel: params.evidenceLevel ?? "applied",
    verificationStatus: "unverified",
  });

  if (params.moveId) {
    await db
      .update(biMoves)
      .set({ status: "applied", updatedAt: new Date() })
      .where(eq(biMoves.id, params.moveId));
  }

  const [evidence] = await db.select().from(biEvidence).where(eq(biEvidence.id, evidenceInsert.insertId)).limit(1);
  return evidence;
}

export async function recordReflectionService(params: {
  evidenceId: number;
  momentId: number;
  userId: number;
  tenantId?: number | null;
  reflectionText: string;
  capacitySignal?: string;
  oldPatternShift?: string;
  newPossibility?: string;
}): Promise<BiReflection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [reflectionInsert] = await db.insert(biReflections).values({
    evidenceId: params.evidenceId,
    momentId: params.momentId,
    tenantId: params.tenantId ?? null,
    userId: params.userId,
    reflectionText: sanitizeBehaviouralInterventionLanguage(params.reflectionText).cleanText,
    capacitySignal: params.capacitySignal ?? null,
    oldPatternShift: params.oldPatternShift ?? null,
    newPossibility: params.newPossibility ?? null,
  });

  // Upgrade evidence to reflected
  await db
    .update(biEvidence)
    .set({ evidenceLevel: "reflected", updatedAt: new Date() })
    .where(eq(biEvidence.id, params.evidenceId));

  await db
    .update(biMoments)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(biMoments.id, params.momentId));

  const [reflection] = await db.select().from(biReflections).where(eq(biReflections.id, reflectionInsert.insertId)).limit(1);
  return reflection;
}

// ── 7. Participant Capacity Summary ───────────────────────────────────────────

export async function getCapacitySummaryService(userId: number): Promise<{
  totalMoments: number;
  totalPractices: number;
  totalActions: number;
  totalEvidence: number;
  evidenceProgression: ReturnType<typeof calculateEvidenceLevelProgression>;
  recentMoves: BiMove[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const moments = await db.select().from(biMoments).where(eq(biMoments.userId, userId));
  const practiceLinks = await db.select().from(biPracticeLinks).where(eq(biPracticeLinks.userId, userId));
  const actions = await db.select().from(biActions).where(eq(biActions.userId, userId));
  const evidenceRecords = await db.select().from(biEvidence).where(eq(biEvidence.userId, userId));
  const recentMoves = await db
    .select()
    .from(biMoves)
    .where(eq(biMoves.userId, userId))
    .orderBy(desc(biMoves.createdAt))
    .limit(5);

  const evidenceProgression = calculateEvidenceLevelProgression(
    evidenceRecords.map((e) => ({
      evidenceLevel: e.evidenceLevel,
      sourceType: e.sourceType,
      verificationStatus: e.verificationStatus,
    }))
  );

  return {
    totalMoments: moments.length,
    totalPractices: practiceLinks.length,
    totalActions: actions.length,
    totalEvidence: evidenceRecords.length,
    evidenceProgression,
    recentMoves,
  };
}

// ── 8. Audit Logging Helper (Privacy-Safe) ─────────────────────────────────────

async function logBiAuditEvent(params: {
  tenantId: number | null;
  userId: number;
  eventType: string;
  resourceId?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = await getDb();
    if (!db) return;

    await db.insert(icAuditEvents).values({
      tenantId: params.tenantId,
      actorUserId: params.userId,
      subjectUserId: params.userId,
      eventType: params.eventType,
      resourceType: "behavioural_intelligence",
      resourceId: params.resourceId ?? null,
      processingPurpose: "behavioural_development",
      authorizationResult: "allowed",
      traceId: `bi-audit-${Date.now()}`,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    // Non-blocking for audit failure
    console.warn("[BehaviouralIntelligence] Audit log failed:", err);
  }
}
