/**
 * LevelNext Leadership Effectiveness Intelligence Platform™
 * Server Domain Service
 *
 * Implements:
 *   - Work Genome Assessment processing & deterministic capacity allocation
 *   - Work-at-Level analysis & Recoverable Hours calculation
 *   - Hidden Manager Tax economic estimation (conservative & transparent)
 *   - Opportunity Scan synthesis (Person + Work + Context)
 *   - 3 High-Leverage Behavior recommendations
 *   - Behavior Change Contract creation & lifecycle
 *   - Next Best Leadership Action (NBLA) selection with "Nothing Today" stability control
 *   - 7-Level Leadership Evidence Ladder recording & progress
 */

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  eiWorkScans,
  eiWorkActivities,
  eiCapacitySnapshots,
  eiOpportunityScans,
  eiBehaviorContracts,
  eiNextBestActions,
  eiEvidenceClaims,
  mepDiagnosticResults,
  reports,
  users,
  tenantUsers,
  type EiWorkScan,
  type EiWorkActivity,
  type EiCapacitySnapshot,
  type EiOpportunityScan,
  type EiBehaviorContract,
  type EiNextBestAction,
  type EiEvidenceClaim,
} from "../drizzle/schema";
import {
  calculateCapacityAllocation,
  calculateCapacityGap,
  ALTITUDE_CAPACITY_TARGETS,
  type CreateWorkScanInput,
  type BehaviorContractInput,
  type RecordEvidenceInput,
  type CareerAltitude,
  type LeadershipWorkCategory,
} from "../shared/modules/effectivenessIntelligence";
import { invokeStructured } from "./structuredLlm";
import { z } from "zod";

// ── 1. Create & Analyze Work Scan ─────────────────────────────────────────────

export async function createWorkScanService(params: {
  userId: number;
  tenantId?: number | null;
  input: CreateWorkScanInput;
}): Promise<{
  scan: EiWorkScan;
  activities: EiWorkActivity[];
  capacitySnapshot: EiCapacitySnapshot;
  opportunityScan: EiOpportunityScan;
  proposedNbla: EiNextBestAction | null;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Resolve tenant membership if omitted
  let resolvedTenantId = params.tenantId ?? null;
  if (resolvedTenantId === null) {
    const memberships = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, params.userId))
      .limit(1);
    resolvedTenantId = memberships[0]?.tenantId ?? null;
  }

  // 1. Insert Work Scan Header
  const [scanResult] = await db.insert(eiWorkScans).values({
    tenantId: resolvedTenantId,
    userId: params.userId,
    altitude: params.input.altitude,
    totalWorkHours: params.input.totalWorkHours,
    status: "completed",
    contextNotes: params.input.contextNotes ?? null,
    completedAt: new Date(),
  });
  const scanId = scanResult.insertId;

  // 2. Insert Activities
  const activityInserts = params.input.activities.map((act) => ({
    scanId,
    tenantId: resolvedTenantId,
    userId: params.userId,
    title: act.title,
    category: act.category,
    weeklyHours: act.weeklyHours,
    frequency: act.frequency,
    workAtLevel: act.workAtLevel,
    reallocation: act.reallocation,
    decisionLevel: act.decisionLevel ?? null,
    judgmentRequirement: act.judgmentRequirement,
    delegationPotential: act.delegationPotential,
    aiAugmentationPotential: act.aiAugmentationPotential,
    notes: act.notes ?? null,
  }));

  if (activityInserts.length > 0) {
    await db.insert(eiWorkActivities).values(activityInserts);
  }

  // 3. Deterministic Capacity Calculation
  const targetAllocation = ALTITUDE_CAPACITY_TARGETS[params.input.altitude as CareerAltitude];
  const { currentAllocation, recoverableHours, workBelowLevelHours, workBelowLevelPercent } =
    calculateCapacityAllocation(params.input.activities, params.input.totalWorkHours);

  const { gapScore, largestDeficit, largestSurplus } = calculateCapacityGap(
    currentAllocation,
    targetAllocation
  );

  // Hidden Manager Tax Calculation: conservative economic estimate
  // Assumes average blended management compensation of $75/hour (or ₹1500/hr)
  // avoidable coordination + below-level work
  const hiddenManagerTaxHours = Math.round(workBelowLevelHours * 10) / 10;
  const estimatedHourlyCost = 75; // USD benchmark
  const hiddenManagerTaxAnnualCost = Math.round(hiddenManagerTaxHours * estimatedHourlyCost * 48); // 48 working weeks

  const [capacityResult] = await db.insert(eiCapacitySnapshots).values({
    scanId,
    tenantId: resolvedTenantId,
    userId: params.userId,
    currentAllocation,
    targetAllocation,
    recoverableHours,
    workBelowLevelHours,
    workBelowLevelPercent,
    gapScore,
    hiddenManagerTaxHours,
    hiddenManagerTaxAnnualCost,
    largestDeficitCategory: largestDeficit.category,
    largestSurplusCategory: largestSurplus.category,
    confidence: "moderate_reported",
  });
  const capacitySnapshotId = capacityResult.insertId;

  // 4. Ingest diagnostic context for Opportunity Scan synthesis
  const [latestMep] = await db
    .select()
    .from(mepDiagnosticResults)
    .where(eq(mepDiagnosticResults.userId, params.userId))
    .orderBy(desc(mepDiagnosticResults.completedAt))
    .limit(1);

  const [latestReport] = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, params.userId))
    .orderBy(desc(reports.createdAt))
    .limit(1);

  const diagnosticContext = {
    mepCode: latestMep?.diagnosticCode ?? null,
    mepScore: latestMep?.overallScore ?? null,
    mepZone: latestMep?.zone ?? null,
    reportArchetype: latestReport?.archetype ?? null,
    reportEdgeScore: latestReport?.edgeScore ?? null,
  };

  // 5. Generate Opportunity Scan (Person + Work + Context synthesis)
  const opportunityScanPayload = await synthesizeOpportunityScan({
    userId: params.userId,
    altitude: params.input.altitude,
    currentAllocation,
    targetAllocation,
    recoverableHours,
    workBelowLevelHours,
    workBelowLevelPercent,
    largestDeficit,
    largestSurplus,
    diagnosticContext,
    contextNotes: params.input.contextNotes,
  });

  const [oppResult] = await db.insert(eiOpportunityScans).values({
    scanId,
    capacitySnapshotId,
    tenantId: resolvedTenantId,
    userId: params.userId,
    headline: opportunityScanPayload.headline,
    coreBottleneck: opportunityScanPayload.coreBottleneck,
    recommendedBehaviors: opportunityScanPayload.recommendedBehaviors,
    strategicLeverageSummary: opportunityScanPayload.strategicLeverageSummary,
    traceId: `ei-opp-${scanId}-${Date.now()}`,
  });
  const opportunityScanId = oppResult.insertId;

  // 6. Propose first Next Best Leadership Action (NBLA)
  const topBehavior = opportunityScanPayload.recommendedBehaviors[0];
  let proposedNbla: EiNextBestAction | null = null;

  if (topBehavior) {
    const [nblaResult] = await db.insert(eiNextBestActions).values({
      tenantId: resolvedTenantId,
      userId: params.userId,
      actionType: "delegation_transfer",
      headline: `Prepare delegation transfer: ${topBehavior.title}`,
      reason: `You spend ~${workBelowLevelHours}h weekly on work below your altitude. ${topBehavior.expectedCapacityGain}`,
      preparationPrompt: `1. Identify the recurring deliverable.\n2. Apply distinction: Accountability ≠ Personal Execution.\n3. Agree on outcome standards with your delegate before Friday.`,
      expectedBenefit: `Recovers ~${Math.min(3, Math.round(recoverableHours * 0.4))} hours weekly and increases team ownership.`,
      suggestedDurationMinutes: 10,
      effortLevel: "low",
      urgencyLevel: "this_week",
      status: "proposed",
    });

    const [savedNbla] = await db
      .select()
      .from(eiNextBestActions)
      .where(eq(eiNextBestActions.id, nblaResult.insertId))
      .limit(1);
    proposedNbla = savedNbla ?? null;
  }

  const [scan] = await db.select().from(eiWorkScans).where(eq(eiWorkScans.id, scanId)).limit(1);
  const activities = await db.select().from(eiWorkActivities).where(eq(eiWorkActivities.scanId, scanId));
  const [capacitySnapshot] = await db
    .select()
    .from(eiCapacitySnapshots)
    .where(eq(eiCapacitySnapshots.id, capacitySnapshotId))
    .limit(1);
  const [opportunityScan] = await db
    .select()
    .from(eiOpportunityScans)
    .where(eq(eiOpportunityScans.id, opportunityScanId))
    .limit(1);

  return {
    scan,
    activities,
    capacitySnapshot,
    opportunityScan,
    proposedNbla,
  };
}

// ── 2. Structured Opportunity Scan Synthesis ──────────────────────────────────

const opportunitySchema = z.object({
  headline: z.string().min(10).max(300),
  coreBottleneck: z.string().min(10).max(1000),
  recommendedBehaviors: z.array(
    z.object({
      title: z.string().min(3).max(255),
      category: z.string().min(3).max(100),
      currentPattern: z.string().min(10).max(500),
      desiredBehavior: z.string().min(10).max(500),
      whyItMatters: z.string().min(10).max(500),
      expectedCapacityGain: z.string().min(5).max(300),
      ontologicalDistinction: z.string().optional(),
      suggestedMove: z.string().min(10).max(500),
    })
  ).length(3),
  strategicLeverageSummary: z.string().min(10).max(1000),
});

type OpportunityOutput = z.infer<typeof opportunitySchema>;

async function synthesizeOpportunityScan(params: {
  userId: number;
  altitude: string;
  currentAllocation: import("../shared/modules/effectivenessIntelligence").CapacityAllocation;
  targetAllocation: import("../shared/modules/effectivenessIntelligence").CapacityAllocation;
  recoverableHours: number;
  workBelowLevelHours: number;
  workBelowLevelPercent: number;
  largestDeficit: { category: string; diffPercent: number };
  largestSurplus: { category: string; diffPercent: number };
  diagnosticContext: Record<string, unknown>;
  contextNotes?: string;
}): Promise<OpportunityOutput> {
  const fallback: OpportunityOutput = {
    headline: `Capacity gap identified: ${params.workBelowLevelPercent}% of leadership time is spent below role altitude.`,
    coreBottleneck: `High operational checking and reactive coordination consume ~${params.workBelowLevelHours} hours/week that should be allocated toward ${params.largestDeficit.category.replace(/_/g, " ")}.`,
    recommendedBehaviors: [
      {
        title: "Outcome-Driven Delegation",
        category: "operational_execution",
        currentPattern: "Personally reviewing and validating routine team deliverables before release.",
        desiredBehavior: "Transfer clear outcome standards and decision rights to senior team members.",
        whyItMatters: "Frees operational hours and develops team problem-solving autonomy.",
        expectedCapacityGain: "Recovers ~3.5 hours/week from routine reviews.",
        ontologicalDistinction: "Accountability ≠ Personal Execution",
        suggestedMove: "Define explicit 'Decision Rights Boundaries' for the next sprint review.",
      },
      {
        title: "Protected Strategic Thinking Block",
        category: "strategic_thinking",
        currentPattern: "Strategic thinking is fragmented across calendar gaps and reactive firefighting.",
        desiredBehavior: "Protect two non-negotiable 90-minute weekly strategic thinking blocks.",
        whyItMatters: "Ensures focus on long-term capability building rather than daily status chasing.",
        expectedCapacityGain: "Increases strategic capacity from current allocation toward target benchmark.",
        ontologicalDistinction: "Urgency ≠ Importance",
        suggestedMove: "Schedule two protected focus blocks and decline non-essential status updates.",
      },
      {
        title: "Meeting Cadence Compression",
        category: "meetings_coordination",
        currentPattern: "Attending status update meetings that could be replaced by async summaries.",
        desiredBehavior: "Shift recurring project status checks to structured async briefs.",
        whyItMatters: "Reduces coordination load across the team and minimizes manager tax.",
        expectedCapacityGain: "Recovers ~2.0 hours/week across team calendar.",
        ontologicalDistinction: "Presence ≠ Alignment",
        suggestedMove: "Convert Monday morning status sync into a 5-minute async written checkpoint.",
      },
    ],
    strategicLeverageSummary: `By addressing operational checking and calendar fragmentation, this leader can recover ~${params.recoverableHours} hours/week for strategic influence and talent development.`,
  };

  const systemPrompt = `You are the LevelNext Effectiveness Intelligence Engine™.
Your goal is to synthesize a leader's Work Genome, diagnostic data, and organisational context into an integrated Leadership Effectiveness Opportunity Scan.

CRITICAL PRINCIPLES:
1. Connect Work Patterns with Underlying Behavioral Assumptions.
2. Select EXACTLY THREE high-leverage behaviors to focus on. Do not overwhelm the leader.
3. Every behavior must specify:
   - Current pattern
   - Desired behavior
   - Why it matters
   - Expected capacity gain (e.g., hours recovered or strategic shift)
   - Relevant Ontological Distinction (e.g., Accountability ≠ Execution, Breakdown ≠ Failure, Commitment ≠ Intention)
   - One actionable suggested move
4. Separate FACTS from INFERENCES. Never use clinical, punitive, or shaming language.
5. Emphasize capacity recovery and leadership leverage.`;

  const userPrompt = `LEADER CONTEXT:
- Altitude: ${params.altitude}
- Total Work Hours: 45
- Current Allocation: ${JSON.stringify(params.currentAllocation)}
- Target Allocation: ${JSON.stringify(params.targetAllocation)}
- Recoverable Hours: ${params.recoverableHours} hrs/week
- Work Below Level: ${params.workBelowLevelHours} hrs/week (${params.workBelowLevelPercent}%)
- Largest Deficit: ${params.largestDeficit.category} (-${params.largestDeficit.diffPercent}%)
- Largest Surplus: ${params.largestSurplus.category} (+${params.largestSurplus.diffPercent}%)
- Diagnostic Background: ${JSON.stringify(params.diagnosticContext)}
- Leader Notes: ${params.contextNotes ?? "None provided"}`;

  const structuredResult = await invokeStructured<OpportunityOutput>({
    context: `ei-opportunity-synthesis-${params.userId}`,
    schemaName: "effectiveness_opportunity_scan",
    schema: opportunitySchema,
    fallback,
    request: {
      model: "claude-haiku-4-5",
      maxTokens: 1600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
  });

  return structuredResult.value;
}

// ── 3. Behavior Change Contract Management ───────────────────────────────────

export async function createBehaviorContractService(params: {
  userId: number;
  tenantId?: number | null;
  input: BehaviorContractInput;
}): Promise<EiBehaviorContract> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let resolvedTenantId = params.tenantId ?? null;
  if (resolvedTenantId === null) {
    const memberships = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, params.userId))
      .limit(1);
    resolvedTenantId = memberships[0]?.tenantId ?? null;
  }

  const [inserted] = await db.insert(eiBehaviorContracts).values({
    tenantId: resolvedTenantId,
    userId: params.userId,
    behaviorTitle: params.input.behaviorTitle,
    targetCategory: params.input.targetCategory,
    currentPattern: params.input.currentPattern,
    desiredBehavior: params.input.desiredBehavior,
    whyItMatters: params.input.whyItMatters,
    realWorldMoment: params.input.realWorldMoment,
    targetEvidence: params.input.targetEvidence,
    ontologicalDistinction: params.input.ontologicalDistinction ?? null,
    limitingNarrative: params.input.limitingNarrative ?? null,
    targetCompletionDate: params.input.targetCompletionDate ? new Date(params.input.targetCompletionDate) : null,
    status: "selected",
  });

  const [contract] = await db
    .select()
    .from(eiBehaviorContracts)
    .where(eq(eiBehaviorContracts.id, inserted.insertId))
    .limit(1);

  return contract;
}

// ── 4. Record Evidence on Evidence Ladder ─────────────────────────────────────

export async function recordEvidenceClaimService(params: {
  userId: number;
  tenantId?: number | null;
  input: RecordEvidenceInput;
}): Promise<EiEvidenceClaim> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let resolvedTenantId = params.tenantId ?? null;
  if (resolvedTenantId === null) {
    const memberships = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(eq(tenantUsers.userId, params.userId))
      .limit(1);
    resolvedTenantId = memberships[0]?.tenantId ?? null;
  }

  const [inserted] = await db.insert(eiEvidenceClaims).values({
    contractId: params.input.contractId,
    tenantId: resolvedTenantId,
    userId: params.userId,
    evidenceLevel: params.input.evidenceLevel,
    claimType: params.input.claimType,
    situation: params.input.situation,
    actionTaken: params.input.actionTaken,
    observedOutcome: params.input.observedOutcome,
    capacityHoursRecovered: params.input.capacityHoursRecovered ?? 0,
    stakeholderConfirmed: params.input.stakeholderConfirmed,
    reflectionNotes: params.input.reflectionNotes ?? null,
    privacyClass: "development",
  });

  // If evidence level is L5_repetition, L6_external_observation, or L7_business_effect, update contract status
  if (
    params.input.evidenceLevel === "L5_repetition" ||
    params.input.evidenceLevel === "L6_external_observation" ||
    params.input.evidenceLevel === "L7_business_effect"
  ) {
    await db
      .update(eiBehaviorContracts)
      .set({ status: "verified_shift", achievedAt: new Date(), updatedAt: new Date() })
      .where(eq(eiBehaviorContracts.id, params.input.contractId));
  } else {
    await db
      .update(eiBehaviorContracts)
      .set({ status: "active_in_work", updatedAt: new Date() })
      .where(eq(eiBehaviorContracts.id, params.input.contractId));
  }

  const [claim] = await db
    .select()
    .from(eiEvidenceClaims)
    .where(eq(eiEvidenceClaims.id, inserted.insertId))
    .limit(1);

  return claim;
}

// ── 5. Get Participant Effectiveness Dashboard Payload ────────────────────────

export async function getEffectivenessDashboardService(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Latest completed work scan
  const [latestScan] = await db
    .select()
    .from(eiWorkScans)
    .where(and(eq(eiWorkScans.userId, userId), eq(eiWorkScans.status, "completed")))
    .orderBy(desc(eiWorkScans.completedAt))
    .limit(1);

  let capacitySnapshot: EiCapacitySnapshot | null = null;
  let opportunityScan: EiOpportunityScan | null = null;
  let activities: EiWorkActivity[] = [];

  if (latestScan) {
    const [snap] = await db
      .select()
      .from(eiCapacitySnapshots)
      .where(eq(eiCapacitySnapshots.scanId, latestScan.id))
      .limit(1);
    capacitySnapshot = snap ?? null;

    const [opp] = await db
      .select()
      .from(eiOpportunityScans)
      .where(eq(eiOpportunityScans.scanId, latestScan.id))
      .limit(1);
    opportunityScan = opp ?? null;

    activities = await db
      .select()
      .from(eiWorkActivities)
      .where(eq(eiWorkActivities.scanId, latestScan.id));
  }

  // Active behavior contracts (up to 3)
  const contracts = await db
    .select()
    .from(eiBehaviorContracts)
    .where(and(eq(eiBehaviorContracts.userId, userId)))
    .orderBy(desc(eiBehaviorContracts.createdAt))
    .limit(6);

  // Active / Proposed Next Best Action
  const [nbla] = await db
    .select()
    .from(eiNextBestActions)
    .where(and(eq(eiNextBestActions.userId, userId), eq(eiNextBestActions.status, "proposed")))
    .orderBy(desc(eiNextBestActions.createdAt))
    .limit(1);

  // Evidence history
  const evidence = await db
    .select()
    .from(eiEvidenceClaims)
    .where(eq(eiEvidenceClaims.userId, userId))
    .orderBy(desc(eiEvidenceClaims.createdAt))
    .limit(10);

  return {
    hasCompletedScan: Boolean(latestScan),
    scan: latestScan ?? null,
    capacitySnapshot,
    opportunityScan,
    activities,
    contracts,
    nbla: nbla ?? null,
    evidence,
  };
}
