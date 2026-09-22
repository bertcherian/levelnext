import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import {
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
  getWarRoomProduct,
  getWeeklyOrderWindowStart,
  isDecisionRequired,
  warRoomAssessmentInputSchema,
  warRoomCampaignInputSchema,
  warRoomConstraintInputSchema,
  warRoomDecisionInputSchema,
  warRoomEvidenceInputSchema,
  warRoomOrderInputSchema,
  warRoomReviewInputSchema,
  type WarRoomCommandCenter,
  type WarRoomProductKey,
} from "../shared/modules/warRoom";

export async function requireAdminUser(user: { id: number; role?: string | null }) {
  if (!user || user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "War Room access is restricted to LevelNext Admins." });
  }
}

export async function resolveAdminProduct(productKey: string) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const product = getWarRoomProduct(productKey);
  if (!product) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported LevelNext product scope." });
  }

  return { db, product };
}

export async function logWarRoomAudit(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  payload: {
    productKey: WarRoomProductKey;
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
    productKey: payload.productKey,
    tenantId: null,
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

export async function getWarRoomCommandCenter(productKeyInput: string): Promise<WarRoomCommandCenter> {
  const { db, product } = await resolveAdminProduct(productKeyInput);
  const productKey = product.key;

  const [activeCampaign] = await db
    .select()
    .from(warRoomCampaigns)
    .where(and(eq(warRoomCampaigns.productKey, productKey), eq(warRoomCampaigns.status, "active")))
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
      .select({ assessment: warRoomEvidenceAssessments, evidence: warRoomEvidenceItems })
      .from(warRoomEvidenceAssessments)
      .innerJoin(warRoomEvidenceItems, eq(warRoomEvidenceAssessments.evidenceItemId, warRoomEvidenceItems.id))
      .where(
        and(
          eq(warRoomEvidenceAssessments.productKey, productKey),
          eq(warRoomEvidenceAssessments.campaignId, campaignId),
          eq(warRoomEvidenceAssessments.reviewStatus, "accepted"),
          eq(warRoomEvidenceAssessments.materiality, "material"),
          eq(warRoomEvidenceItems.status, "active"),
        ),
      )
      .orderBy(desc(warRoomEvidenceAssessments.createdAt))
      .limit(3);

    materialEvidence = rawAssessments.map((row) => ({ ...row.assessment, evidenceItem: row.evidence }));

    recentEvidence = await db
      .select()
      .from(warRoomEvidenceItems)
      .where(and(eq(warRoomEvidenceItems.productKey, productKey), eq(warRoomEvidenceItems.campaignId, campaignId)))
      .orderBy(desc(warRoomEvidenceItems.observedAt), desc(warRoomEvidenceItems.createdAt))
      .limit(8);

    const [activeConstraint] = await db
      .select()
      .from(warRoomConstraints)
      .where(and(eq(warRoomConstraints.productKey, productKey), eq(warRoomConstraints.campaignId, campaignId), eq(warRoomConstraints.status, "active")))
      .orderBy(desc(warRoomConstraints.createdAt))
      .limit(1);
    constraint = activeConstraint ?? null;

    const [decisionRow] = await db
      .select()
      .from(warRoomDecisions)
      .where(and(eq(warRoomDecisions.productKey, productKey), eq(warRoomDecisions.campaignId, campaignId)))
      .orderBy(desc(warRoomDecisions.createdAt))
      .limit(1);
    latestDecision = decisionRow ?? null;

    orders = await db
      .select()
      .from(warRoomOrders)
      .where(and(eq(warRoomOrders.productKey, productKey), eq(warRoomOrders.campaignId, campaignId)))
      .orderBy(desc(warRoomOrders.createdAt))
      .limit(6);

    const windowStart = getWeeklyOrderWindowStart();
    weeklyOrderCount = orders.filter((order) => order.status === "approved" && new Date(order.createdAt) >= windowStart).length;

    const [reviewRow] = await db
      .select()
      .from(warRoomReviews)
      .where(and(eq(warRoomReviews.productKey, productKey), eq(warRoomReviews.campaignId, campaignId)))
      .orderBy(desc(warRoomReviews.reviewDate), desc(warRoomReviews.createdAt))
      .limit(1);
    latestReview = reviewRow ?? null;
  }

  const now = new Date();
  const hasDueDecision = Boolean(latestDecision && latestDecision.outcome === "proposed" && (!latestDecision.dueDate || new Date(latestDecision.dueDate) <= now));
  const hasDueOrder = orders.some((order) => order.status === "approved" && order.deadline && new Date(order.deadline) <= now);
  const reviewRequested = Boolean(campaign && campaign.reviewDate && new Date(campaign.reviewDate) <= now);

  return {
    product,
    campaign,
    materialEvidence,
    recentEvidence,
    constraint,
    latestDecision,
    orders,
    latestReview,
    weeklyOrderCount,
    decisionRequired: isDecisionRequired({
      materialEvidenceCount: materialEvidence.length,
      hasDueDecision,
      hasDueOrder,
      reviewRequested,
    }),
  };
}

export async function createWarRoomCampaignService(actorUserId: number, input: z.infer<typeof warRoomCampaignInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);

  const [existingActive] = await db
    .select({ id: warRoomCampaigns.id })
    .from(warRoomCampaigns)
    .where(and(eq(warRoomCampaigns.productKey, product.key), eq(warRoomCampaigns.status, "active")))
    .limit(1);

  if (existingActive) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `An active War Room campaign already exists for ${product.label}. Close or pause it before activating another.`,
    });
  }

  const [inserted] = await db
    .insert(warRoomCampaigns)
    .values({
      productKey: product.key,
      tenantId: null,
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
    productKey: product.key,
    actorUserId,
    entityType: "campaign",
    entityId: inserted.id,
    action: "campaign_created_and_activated",
    newState: { productKey: product.key, productLabel: product.label, name: input.name, status: "active" },
  });

  return { campaignId: inserted.id, productKey: product.key };
}

export async function createWarRoomEvidenceService(actorUserId: number, input: z.infer<typeof warRoomEvidenceInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);

  const [campaign] = await db
    .select({ id: warRoomCampaigns.id, status: warRoomCampaigns.status })
    .from(warRoomCampaigns)
    .where(and(eq(warRoomCampaigns.id, input.campaignId), eq(warRoomCampaigns.productKey, product.key)))
    .limit(1);

  if (!campaign || campaign.status !== "active") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence can only be captured for an active product campaign." });
  }

  const [inserted] = await db.insert(warRoomEvidenceItems).values({
    productKey: product.key,
    tenantId: null,
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
  }).$returningId();

  await logWarRoomAudit(db, { productKey: product.key, actorUserId, entityType: "evidence_item", entityId: inserted.id, action: "evidence_captured", newState: { sourceLabel: input.sourceLabel, sourceType: input.sourceType } });
  return { evidenceId: inserted.id };
}

export async function assessWarRoomEvidenceService(actorUserId: number, input: z.infer<typeof warRoomAssessmentInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);
  const [evidence] = await db.select().from(warRoomEvidenceItems).where(and(eq(warRoomEvidenceItems.id, input.evidenceItemId), eq(warRoomEvidenceItems.productKey, product.key), eq(warRoomEvidenceItems.campaignId, input.campaignId))).limit(1);
  if (!evidence || evidence.status !== "active") throw new TRPCError({ code: "NOT_FOUND", message: "Active evidence item not found in this product campaign" });

  const [inserted] = await db.insert(warRoomEvidenceAssessments).values({
    productKey: product.key,
    tenantId: null,
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
  }).$returningId();

  await logWarRoomAudit(db, { productKey: product.key, actorUserId, entityType: "evidence_assessment", entityId: inserted.id, action: "evidence_assessed_and_accepted", newState: { relation: input.relation, materiality: input.materiality } });
  return { assessmentId: inserted.id };
}

export async function upsertWarRoomConstraintService(actorUserId: number, input: z.infer<typeof warRoomConstraintInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);
  const [existingActive] = await db.select().from(warRoomConstraints).where(and(eq(warRoomConstraints.productKey, product.key), eq(warRoomConstraints.campaignId, input.campaignId), eq(warRoomConstraints.status, "active"))).limit(1);
  if (existingActive) await db.update(warRoomConstraints).set({ status: "superseded" }).where(eq(warRoomConstraints.id, existingActive.id));

  const [inserted] = await db.insert(warRoomConstraints).values({
    productKey: product.key,
    tenantId: null,
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
  }).$returningId();

  await logWarRoomAudit(db, { productKey: product.key, actorUserId, entityType: "constraint", entityId: inserted.id, action: existingActive ? "constraint_superseded_and_updated" : "constraint_selected", newState: { state: input.state, statement: input.statement } });
  return { constraintId: inserted.id };
}

export async function recordWarRoomDecisionService(actorUserId: number, input: z.infer<typeof warRoomDecisionInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);
  const [inserted] = await db.insert(warRoomDecisions).values({
    productKey: product.key,
    tenantId: null,
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
  }).$returningId();
  await logWarRoomAudit(db, { productKey: product.key, actorUserId, entityType: "decision", entityId: inserted.id, action: "decision_accepted", newState: { question: input.question, chosenOption: input.recommendation ?? input.options[0] } });
  return { decisionId: inserted.id };
}

export async function approveWarRoomOrderService(actorUserId: number, input: z.infer<typeof warRoomOrderInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);
  const windowStart = getWeeklyOrderWindowStart();
  const recentOrders = await db.select({ id: warRoomOrders.id }).from(warRoomOrders).where(and(eq(warRoomOrders.productKey, product.key), eq(warRoomOrders.campaignId, input.campaignId), eq(warRoomOrders.status, "approved"), gte(warRoomOrders.createdAt, windowStart)));
  if (!canCreateAnotherWeeklyOrder(recentOrders.length)) throw new TRPCError({ code: "CONFLICT", message: "Weekly approved order limit reached (maximum 3 orders per product review window)." });

  const [inserted] = await db.insert(warRoomOrders).values({
    productKey: product.key,
    tenantId: null,
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
  }).$returningId();
  await logWarRoomAudit(db, { productKey: product.key, actorUserId, entityType: "order", entityId: inserted.id, action: "order_approved", newState: { statement: input.statement, ownerUserId: input.ownerUserId } });
  return { orderId: inserted.id };
}

export async function closeWarRoomReviewService(actorUserId: number, input: z.infer<typeof warRoomReviewInputSchema>) {
  const { db, product } = await resolveAdminProduct(input.productKey);
  const [inserted] = await db.insert(warRoomReviews).values({
    productKey: product.key,
    tenantId: null,
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
  }).$returningId();
  await logWarRoomAudit(db, { productKey: product.key, actorUserId, entityType: "review", entityId: inserted.id, action: "review_closed", newState: { hypothesisStatus: input.hypothesisStatus, decisionOutcome: input.decisionOutcome } });
  return { reviewId: inserted.id };
}
