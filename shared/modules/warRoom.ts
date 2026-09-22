import { z } from "zod";

export const warRoomCampaignStatuses = ["draft", "active", "paused", "completed", "killed", "archived"] as const;
export const warRoomEvidenceSourceTypes = ["manual_note", "customer_note", "delivery_note", "platform_note", "imported_excerpt"] as const;
export const warRoomEvidenceFreshnessStatuses = ["current", "stale", "unknown", "delayed"] as const;
export const warRoomEvidenceRelations = ["supports", "contradicts", "does_not_answer"] as const;
export const warRoomEvidenceMateriality = ["material", "context", "unknown"] as const;
export const warRoomAssessmentOrigins = ["human", "ai_draft"] as const;
export const warRoomAssessmentStatuses = ["unreviewed", "accepted", "rejected", "superseded"] as const;
export const warRoomConstraintStates = ["selected", "tied", "unclear", "closed"] as const;
export const warRoomConstraintStatuses = ["active", "superseded", "closed"] as const;
export const warRoomDecisionOutcomes = ["proposed", "accepted", "deferred", "rejected", "superseded"] as const;
export const warRoomOrderStatuses = ["draft", "approved", "in_progress", "completed", "paused", "killed"] as const;
export const warRoomReviewHypothesisStatuses = ["strengthened", "weakened", "unanswered", "invalidated"] as const;
export const warRoomReviewDecisions = ["continue", "modify", "pause", "kill", "none"] as const;
export const warRoomAuditSources = ["human", "ai_draft", "system_rule"] as const;

export type WarRoomCampaignStatus = (typeof warRoomCampaignStatuses)[number];
export type WarRoomEvidenceSourceType = (typeof warRoomEvidenceSourceTypes)[number];
export type WarRoomEvidenceFreshnessStatus = (typeof warRoomEvidenceFreshnessStatuses)[number];
export type WarRoomEvidenceRelation = (typeof warRoomEvidenceRelations)[number];
export type WarRoomEvidenceMateriality = (typeof warRoomEvidenceMateriality)[number];
export type WarRoomAssessmentOrigin = (typeof warRoomAssessmentOrigins)[number];
export type WarRoomAssessmentStatus = (typeof warRoomAssessmentStatuses)[number];
export type WarRoomConstraintState = (typeof warRoomConstraintStates)[number];
export type WarRoomDecisionOutcome = (typeof warRoomDecisionOutcomes)[number];
export type WarRoomOrderStatus = (typeof warRoomOrderStatuses)[number];
export type WarRoomReviewHypothesisStatus = (typeof warRoomReviewHypothesisStatuses)[number];
export type WarRoomReviewDecision = (typeof warRoomReviewDecisions)[number];

export const warRoomIndicatorSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(160),
  definition: z.string().min(1).max(500),
  target: z.string().max(120).optional(),
  currentValue: z.string().max(120).optional(),
  direction: z.enum(["improving", "declining", "flat", "unknown"]).optional(),
  decisionImplication: z.string().min(1).max(500),
});

export type WarRoomIndicator = z.infer<typeof warRoomIndicatorSchema>;

export const warRoomIndicatorsSchema = z.array(warRoomIndicatorSchema).max(3);

export const warRoomCampaignInputSchema = z.object({
  tenantId: z.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  objective: z.string().trim().min(1).max(2000),
  victoryCondition: z.string().trim().min(1).max(2000),
  hypothesis: z.string().trim().max(2000).optional(),
  ownerUserId: z.number().int().positive(),
  deadline: z.coerce.date(),
  reviewDate: z.coerce.date(),
  indicators: warRoomIndicatorsSchema,
  parkedWork: z.string().trim().max(2000).optional(),
});

export const warRoomEvidenceInputSchema = z.object({
  tenantId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  sourceType: z.enum(warRoomEvidenceSourceTypes),
  sourceLabel: z.string().trim().min(1).max(255),
  sourceRef: z.string().trim().max(500).optional(),
  observedAt: z.coerce.date(),
  context: z.string().trim().max(1000).optional(),
  observation: z.string().trim().min(1).max(5000),
  approvedExcerpt: z.string().trim().max(2500).optional(),
});

export const warRoomAssessmentInputSchema = z.object({
  tenantId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  evidenceItemId: z.number().int().positive(),
  relation: z.enum(warRoomEvidenceRelations),
  interpretation: z.string().trim().min(1).max(2000),
  decisionImplication: z.string().trim().max(1000).optional(),
  materiality: z.enum(warRoomEvidenceMateriality),
});

export const warRoomConstraintInputSchema = z.object({
  tenantId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  state: z.enum(warRoomConstraintStates),
  statement: z.string().trim().max(2000).optional(),
  whyItMatters: z.string().trim().max(2000).optional(),
  disproofCondition: z.string().trim().max(2000).optional(),
  evidenceIds: z.array(z.number().int().positive()).max(10).default([]),
  ownerUserId: z.number().int().positive().optional(),
  reviewDate: z.coerce.date(),
});

export const warRoomDecisionInputSchema = z.object({
  tenantId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  constraintId: z.number().int().positive().optional(),
  question: z.string().trim().min(1).max(2000),
  options: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  recommendation: z.string().trim().max(2000).optional(),
  evidenceIds: z.array(z.number().int().positive()).max(10).default([]),
  ownerUserId: z.number().int().positive(),
  dueDate: z.coerce.date().optional(),
});

export const warRoomOrderInputSchema = z.object({
  tenantId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  decisionId: z.number().int().positive().optional(),
  statement: z.string().trim().min(1).max(2000),
  ownerUserId: z.number().int().positive(),
  deadline: z.coerce.date().optional(),
  reviewDate: z.coerce.date().optional(),
  expectedEvidence: z.string().trim().min(1).max(2000),
  escalationCondition: z.string().trim().max(1000).optional(),
  killCondition: z.string().trim().max(1000).optional(),
});

export const warRoomReviewInputSchema = z.object({
  tenantId: z.number().int().positive(),
  campaignId: z.number().int().positive(),
  expectedBelief: z.string().trim().min(1).max(3000),
  actionsTaken: z.string().trim().min(1).max(3000),
  actualEvidence: z.string().trim().min(1).max(3000),
  hypothesisStatus: z.enum(warRoomReviewHypothesisStatuses),
  constraintState: z.enum(warRoomConstraintStates),
  decisionOutcome: z.enum(warRoomReviewDecisions),
  nextTest: z.string().trim().max(2000).optional(),
  parkStopChoice: z.string().trim().max(2000).optional(),
});

export interface WarRoomCommandCenter {
  tenant: { id: number; name: string };
  campaign: unknown | null;
  materialEvidence: unknown[];
  recentEvidence: unknown[];
  constraint: unknown | null;
  latestDecision: unknown | null;
  orders: unknown[];
  latestReview: unknown | null;
  weeklyOrderCount: number;
  decisionRequired: boolean;
}

export function isAdminRole(role: string | null | undefined) {
  return role === "admin";
}

export function canApproveWarRoomState(role: string | null | undefined) {
  return isAdminRole(role);
}

export function canCreateWarRoomEvidence(role: string | null | undefined) {
  return isAdminRole(role);
}

export function getWeeklyOrderWindowStart(now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 7);
  return start;
}

export function canCreateAnotherWeeklyOrder(existingCount: number) {
  return existingCount < 3;
}

export function isDecisionRequired(input: {
  materialEvidenceCount: number;
  hasDueDecision: boolean;
  hasDueOrder: boolean;
  reviewRequested: boolean;
}) {
  return input.materialEvidenceCount > 0 || input.hasDueDecision || input.hasDueOrder || input.reviewRequested;
}
