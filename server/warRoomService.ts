import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  tenants,
  tenantUsers,
  users,
  warRoomAuditEvents,
  warRoomCampaigns,
  warRoomConstraints,
  warRoomDecisions,
  warRoomEvidenceAssessments,
  warRoomEvidenceItems,
  warRoomOrders,
  warRoomReviews,
  type InsertWarRoomAuditEvent,
  type WarRoomCampaign,
  type WarRoomConstraint,
  type WarRoomDecision,
  type WarRoomEvidenceAssessment,
  type WarRoomEvidenceItem,
  type WarRoomOrder,
  type WarRoomReview,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  canCreateAnotherWeeklyOrder,
  getWeeklyOrderWindowStart,
  isDecisionRequired,
  warRoomCampaignInputSchema,
  warRoomEvidenceInputSchema,
  warRoomAssessmentInputSchema,
  warRoomConstraintInputSchema,
  warRoomDecisionInputSchema,
  warRoomOrderInputSchema,
  warRoomReviewInputSchema,
  type WarRoomCommandCenter,
} from "../shared/modules/warRoom";

export async function requireAdminUser(user: { id: number; role?: string | null }) {
  if (!user || user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "War Room access is restricted to LevelNext Admins." });
  }
}

export async function resolveAdminTenant(tenantIdInput?: number | null) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  if (tenantIdInput) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantIdInput)).limit(1);
    if (!tenant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Selected organisation not found" });
    }
    return { db, tenant };
  }

  const [firstTenant] = await db.select().from(tenants).orderBy(tenants.name).limit(1);
  if (!firstTenant) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No organisations configured on the platform" });
  }
  return { db, tenant: firstTenant };
}

export async function logWarRoomAudit(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  payload: {
    tenantId: number;
    actorUserId: number;
    entityType: string;
    entityId: number;
    action: string;
    priorState?: Record<string, unknown> | null;
    newState?: Record<string, unknown> | null;
    reason?: string | null;
    source?: "human" | "ai_draft" | "system_rule";
  },
) {
  const values: InsertWarRoomAuditEvent = {
    tenantId: payload.tenantId,
    actorUserId: payload.actorUserId,
    entityType: payload.entityType,
    entityId: payload.entityId,
    action: payload.action,
    priorState: payload.priorState ?? null,
    newState: payload.newState ?? null,
    reason: payload.reason ?? null,
    source: payload.source ?? "human",
  };
  await db.insert(warRoomAuditEvents).values(values);
}

export async function getWarRoomCommandCenter(tenantIdInput?: number | null): Promise<WarRoomCommandCenter> {
  const { db, tenant } = await resolveAdminTenant(tenantIdInput);

  const [activeCampaign] = await db
    .select()
    .from(warRoomCampaigns)
    .where(and(eq(warRoomCampaigns.tenantId, tenant.id), eq(warRoomCampaigns.status, "active")))
    .orderBy(desc(warRoomCampaigns.createdAt))
    .limit(1);

  const campaign = activeCampaign ?? null;
  const campaignId = campaign?.id ?? null;

  let materialEvidence: Array<WarRoomEvidenceAssessment & { evidenceItem: WarRoomEvidenceItem }> = [];
  let recentEvidence: WarRoomEvidenceItem[] = [];
  let constraint: WarRoomConstraint | null = null;
  let latestDecision: WarRoomDecision | null = null;
  let orders: WarRoomOrder[] = [];
  let latestReview: WarRoomReview | null = null;
  let weeklyOrderCount = 0;

  if (campaignId) {
    const rawAssessments = await db
      .select({
        assessment: warRoomEvidenceAssessments,
        evidence: warRoomEvidenceItems,
      })
      .from(warRoomEvidenceAssessments)
      .innerJoin(warRoomEvidenceItems, eq(warRoomEvidenceAssessments.evidenceItemId, warRoomEvidenceItems.id))
      .where(
        and(
          eq(warRoomEvidenceAssessments.tenantId, tenant.id),
          eq(warRoomEvidenceAssessments.campaignId, campaignId),
          eq(warRoomEvidenceAssessments.reviewStatus, "accepted"),
          eq(warRoomEvidenceAssessments.materiality, "material"),
          eq(warRoomEvidenceItems.status, "active"),
        ),
      )
      .orderBy(desc(warRoomEvidenceAssessments.createdAt))
      .limit(3);

    materialEvidence = rawAssessments.map((row) => ({
      ...row.assessment,
      evidenceItem: row.evidence,
    }));

    recentEvidence = await db
      .select()
      .from(warRoomEvidenceItems)
      .where(and(eq(warRoomEvidenceItems.tenantId, tenant.id), eq(warRoomEvidenceItems.campaignId, campaignId)))
      .orderBy(desc(warRoomEvidenceItems.observedAt), desc(warRoomEvidenceItems.createdAt))
      .limit(8);

    const [activeConstraint] = await db
      .select()
      .from(warRoomConstraints)
      .where(and(eq(warRoomConstraints.tenantId, tenant.id), eq(warRoomConstraints.campaignId, campaignId), eq(warRoomConstraints.status, "active")))
      .orderBy(desc(warRoomConstraints.createdAt))
      .limit(1);
    constraint = activeConstraint ?? null;

    const [decisionRow] = await db
      .select()
      .from(warRoomDecisions)
      .where(and(eq(warRoomDecisions.tenantId, tenant.id), eq(warRoomDecisions.campaignId, campaignId)))
      .orderBy(desc(warRoomDecisions.createdAt))
      .limit(1);
    latestDecision = decisionRow ?? null;

    orders = await db
      .select()
      .from(warRoomOrders)
      .where(and(eq(warRoomOrders.tenantId, tenant.id), eq(warRoomOrders.campaignId, campaignId)))
      .orderBy(desc(warRoomOrders.createdAt))
      .limit(6);

    const windowStart = getWeeklyOrderWindowStart();
    const approvedRecentOrders = orders.filter((o) => o.status === "approved" && new Date(o.createdAt) >= windowStart);
    weeklyOrderCount = approvedRecentOrders.length;

    const [reviewRow] = await db
      .select()
      .from(warRoomReviews)
      .where(and(eq(warRoomReviews.tenantId, tenant.id), eq(warRoomReviews.campaignId, campaignId)))
      .orderBy(desc(warRoomReviews.reviewDate), desc(warRoomReviews.createdAt))
      .limit(1);
    latestReview = reviewRow ?? null;
  }

  const now = new Date();
  const hasDueDecision = Boolean(latestDecision && latestDecision.outcome === "proposed" && (!latestDecision.dueDate || new Date(latestDecision.dueDate) <= now));
  const hasDueOrder = orders.some((o) => o.status === "approved" && o.deadline && new Date(o.deadline) <= now);
  const reviewRequested = Boolean(campaign && campaign.reviewDate && new Date(campaign.reviewDate) <= now);

  const decisionRequired = isDecisionRequired({
    materialEvidenceCount: materialEvidence.length,
    hasDueDecision,
    hasDueOrder,
    reviewRequested,
  });

  return {
    tenant: { id: tenant.id, name: tenant.name },
    campaign,
    materialEvidence,
    recentEvidence,
    constraint,
    latestDecision,
    orders,
    latestReview,
    weeklyOrderCount,
    decisionRequired,
  };
}

export async function createWarRoomCampaignService(actorUserId: number, input: z.infer<typeof warRoomCampaignInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const [existingActive] = await db
    .select({ id: warRoomCampaigns.id })
    .from(warRoomCampaigns)
    .where(and(eq(warRoomCampaigns.tenantId, tenant.id), eq(warRoomCampaigns.status, "active")))
    .limit(1);

  if (existingActive) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "An active War Room campaign already exists for this organisation. Close or pause it before activating another.",
    });
  }

  const [inserted] = await db
    .insert(warRoomCampaigns)
    .values({
      tenantId: tenant.id,
      name: input.name,
      objective: input.objective,
      victoryCondition: input.victoryCondition,
      hypothesis: input.hypothesis ?? null,
      ownerUserId: input.ownerUserId,
      deadline: input.deadline,
      reviewDate: input.reviewDate,
      indicators: input.indicators,
      parkedWork: input.parkedWork ?? null,
      status: "active",
      createdByUserId: actorUserId,
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "campaign",
    entityId: inserted.id,
    action: "campaign_created_and_activated",
    newState: { name: input.name, status: "active" },
  });

  return { campaignId: inserted.id, tenantId: tenant.id };
}

export async function createWarRoomEvidenceService(actorUserId: number, input: z.infer<typeof warRoomEvidenceInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const [campaign] = await db
    .select({ id: warRoomCampaigns.id, status: warRoomCampaigns.status })
    .from(warRoomCampaigns)
    .where(and(eq(warRoomCampaigns.id, input.campaignId), eq(warRoomCampaigns.tenantId, tenant.id)))
    .limit(1);

  if (!campaign || campaign.status !== "active") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence can only be captured for an active campaign in this organisation." });
  }

  const [inserted] = await db
    .insert(warRoomEvidenceItems)
    .values({
      tenantId: tenant.id,
      campaignId: campaign.id,
      createdByUserId: actorUserId,
      sourceType: input.sourceType,
      sourceLabel: input.sourceLabel,
      sourceRef: input.sourceRef ?? null,
      observedAt: input.observedAt,
      context: input.context ?? null,
      observation: input.observation,
      approvedExcerpt: input.approvedExcerpt ?? null,
      status: "active",
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "evidence_item",
    entityId: inserted.id,
    action: "evidence_captured",
    newState: { sourceLabel: input.sourceLabel, sourceType: input.sourceType },
  });

  return { evidenceId: inserted.id };
}

export async function assessWarRoomEvidenceService(actorUserId: number, input: z.infer<typeof warRoomAssessmentInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const [evidence] = await db
    .select()
    .from(warRoomEvidenceItems)
    .where(and(eq(warRoomEvidenceItems.id, input.evidenceItemId), eq(warRoomEvidenceItems.tenantId, tenant.id), eq(warRoomEvidenceItems.campaignId, input.campaignId)))
    .limit(1);

  if (!evidence || evidence.status !== "active") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Active evidence item not found in this campaign" });
  }

  const [inserted] = await db
    .insert(warRoomEvidenceAssessments)
    .values({
      tenantId: tenant.id,
      campaignId: input.campaignId,
      evidenceItemId: evidence.id,
      relation: input.relation,
      interpretation: input.interpretation,
      decisionImplication: input.decisionImplication ?? null,
      materiality: input.materiality,
      origin: "human",
      reviewStatus: "accepted",
      createdByUserId: actorUserId,
      reviewedByUserId: actorUserId,
      reviewedAt: new Date(),
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "evidence_assessment",
    entityId: inserted.id,
    action: "evidence_assessed_and_accepted",
    newState: { relation: input.relation, materiality: input.materiality },
  });

  return { assessmentId: inserted.id };
}

export async function upsertWarRoomConstraintService(actorUserId: number, input: z.infer<typeof warRoomConstraintInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const [existingActive] = await db
    .select()
    .from(warRoomConstraints)
    .where(and(eq(warRoomConstraints.tenantId, tenant.id), eq(warRoomConstraints.campaignId, input.campaignId), eq(warRoomConstraints.status, "active")))
    .limit(1);

  if (existingActive) {
    await db
      .update(warRoomConstraints)
      .set({ status: "superseded" })
      .where(eq(warRoomConstraints.id, existingActive.id));
  }

  const [inserted] = await db
    .insert(warRoomConstraints)
    .values({
      tenantId: tenant.id,
      campaignId: input.campaignId,
      state: input.state,
      statement: input.statement ?? null,
      whyItMatters: input.whyItMatters ?? null,
      disproofCondition: input.disproofCondition ?? null,
      evidenceIds: input.evidenceIds,
      ownerUserId: input.ownerUserId ?? null,
      reviewDate: input.reviewDate,
      createdByUserId: actorUserId,
      status: "active",
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "constraint",
    entityId: inserted.id,
    action: existingActive ? "constraint_superseded_and_updated" : "constraint_selected",
    newState: { state: input.state, statement: input.statement },
  });

  return { constraintId: inserted.id };
}

export async function recordWarRoomDecisionService(actorUserId: number, input: z.infer<typeof warRoomDecisionInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const [inserted] = await db
    .insert(warRoomDecisions)
    .values({
      tenantId: tenant.id,
      campaignId: input.campaignId,
      constraintId: input.constraintId ?? null,
      question: input.question,
      options: input.options,
      recommendation: input.recommendation ?? null,
      evidenceIds: input.evidenceIds,
      chosenOption: input.recommendation ?? input.options[0],
      outcome: "accepted",
      ownerUserId: input.ownerUserId,
      dueDate: input.dueDate ?? null,
      approvedByUserId: actorUserId,
      approvedAt: new Date(),
      createdByUserId: actorUserId,
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "decision",
    entityId: inserted.id,
    action: "decision_accepted",
    newState: { question: input.question, chosenOption: input.recommendation ?? input.options[0] },
  });

  return { decisionId: inserted.id };
}

export async function approveWarRoomOrderService(actorUserId: number, input: z.infer<typeof warRoomOrderInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const windowStart = getWeeklyOrderWindowStart();
  const recentOrders = await db
    .select({ id: warRoomOrders.id })
    .from(warRoomOrders)
    .where(
      and(
        eq(warRoomOrders.tenantId, tenant.id),
        eq(warRoomOrders.campaignId, input.campaignId),
        eq(warRoomOrders.status, "approved"),
      ),
    );

  if (!canCreateAnotherWeeklyOrder(recentOrders.length)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Weekly approved order limit reached (maximum 3 orders per review window). Complete or kill an order before approving another.",
    });
  }

  const [inserted] = await db
    .insert(warRoomOrders)
    .values({
      tenantId: tenant.id,
      campaignId: input.campaignId,
      decisionId: input.decisionId ?? null,
      statement: input.statement,
      ownerUserId: input.ownerUserId,
      deadline: input.deadline ?? null,
      reviewDate: input.reviewDate ?? null,
      expectedEvidence: input.expectedEvidence,
      escalationCondition: input.escalationCondition ?? null,
      killCondition: input.killCondition ?? null,
      status: "approved",
      approvedByUserId: actorUserId,
      approvedAt: new Date(),
      createdByUserId: actorUserId,
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "order",
    entityId: inserted.id,
    action: "order_approved",
    newState: { statement: input.statement, ownerUserId: input.ownerUserId },
  });

  return { orderId: inserted.id };
}

export async function closeWarRoomReviewService(actorUserId: number, input: z.infer<typeof warRoomReviewInputSchema>) {
  const { db, tenant } = await resolveAdminTenant(input.tenantId);

  const [inserted] = await db
    .insert(warRoomReviews)
    .values({
      tenantId: tenant.id,
      campaignId: input.campaignId,
      reviewDate: new Date(),
      expectedBelief: input.expectedBelief,
      actionsTaken: input.actionsTaken,
      actualEvidence: input.actualEvidence,
      hypothesisStatus: input.hypothesisStatus,
      constraintState: input.constraintState,
      decisionOutcome: input.decisionOutcome,
      nextTest: input.nextTest ?? null,
      parkStopChoice: input.parkStopChoice ?? null,
      createdByUserId: actorUserId,
    })
    .$returningId();

  await logWarRoomAudit(db, {
    tenantId: tenant.id,
    actorUserId,
    entityType: "review",
    entityId: inserted.id,
    action: "review_closed",
    newState: { hypothesisStatus: input.hypothesisStatus, decisionOutcome: input.decisionOutcome },
  });

  return { reviewId: inserted.id };
}
