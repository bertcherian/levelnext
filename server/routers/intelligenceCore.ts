/**
 * Intelligence Core Router — Phase 1
 *
 * Subsystem endpoints for:
 *   1. Diagnostic Instance registration (linking reports to IC)
 *   2. Permission & Consent management
 *   3. Rule Engine — versioned rules, execution, and recommendation generation
 *   4. Recommendation lifecycle (present → decide → act)
 *   5. Outcome tracking with evidence and metrics
 *   6. Admin analytics with privacy thresholding
 */

import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  icDiagnosticInstances,
  icJudgmentRules,
  icJudgmentRuleVersions,
  icJudgmentExecutions,
  icRecommendations,
  icRecommendationActions,
  icOutcomeObservations,
  icOutcomeMetrics,
  icOutcomeEvidence,
  icProcessingPermissions,
  icPermissionEvents,
  icAuditEvents,
  icPracticeProgress,
  icOutboxEvents,
  reports,
  tenantUsers,
} from "../../drizzle/schema";

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Resolve the tenantId for the current user (must be a tenant member). */
async function getTenantId(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [membership] = await db
    .select()
    .from(tenantUsers)
    .where(eq(tenantUsers.userId, userId));
  return membership?.tenantId ?? null;
}

/** Require tenant admin (owner or admin) and return tenantId. */
async function requireTenantAdmin(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const [membership] = await db
    .select()
    .from(tenantUsers)
    .where(eq(tenantUsers.userId, userId));
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a tenant member." });
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Tenant admin access required." });
  }
  return membership.tenantId;
}

/** Write an audit event. */
async function writeAuditEvent(event: {
  tenantId?: number | null;
  actorUserId?: number | null;
  subjectUserId?: number | null;
  eventType: string;
  resourceType?: string;
  resourceId?: number;
  processingPurpose?: string;
  authorizationResult?: "allowed" | "denied" | "not_applicable";
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(icAuditEvents).values({
    tenantId: event.tenantId ?? null,
    actorUserId: event.actorUserId ?? null,
    subjectUserId: event.subjectUserId ?? null,
    eventType: event.eventType,
    resourceType: event.resourceType ?? null,
    resourceId: event.resourceId ?? null,
    processingPurpose: event.processingPurpose ?? null,
    authorizationResult: event.authorizationResult ?? "not_applicable",
    metadata: event.metadata ?? null,
  });
}

/** Write an outbox event for downstream processing. */
async function writeOutboxEvent(event: {
  tenantId?: number | null;
  eventType: string;
  aggregateType?: string;
  aggregateId?: number;
  payload?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(icOutboxEvents).values({
    tenantId: event.tenantId ?? null,
    eventType: event.eventType,
    aggregateType: event.aggregateType ?? null,
    aggregateId: event.aggregateId ?? null,
    payload: event.payload ?? null,
  });
}

/**
 * Evaluate a single condition against a diagnostic instance's scores.
 * Conditions are simple: { field, operator, value }
 * - field: a key in dimensionScores or "edgeScore"
 * - operator: "<", "<=", ">", ">=", "==", "!="
 * - value: numeric threshold
 */
function evaluateCondition(
  condition: { field: string; operator: string; value: number | string },
  edgeScore: number,
  dimensionScores: Record<string, number> | null,
): boolean {
  const fieldValue =
    condition.field === "edgeScore"
      ? edgeScore
      : (dimensionScores?.[condition.field] ?? 0);

  const val = typeof condition.value === "string" ? parseFloat(condition.value) : condition.value;

  switch (condition.operator) {
    case "<": return fieldValue < val;
    case "<=": return fieldValue <= val;
    case ">": return fieldValue > val;
    case ">=": return fieldValue >= val;
    case "==": return fieldValue === val;
    case "!=": return fieldValue !== val;
    default: return false;
  }
}

/** Evaluate all conditions of a rule version against a diagnostic instance. */
function evaluateRule(
  conditions: Array<{ field: string; operator: string; value: number | string }>,
  edgeScore: number,
  dimensionScores: Record<string, number> | null,
): boolean {
  return conditions.every((c) => evaluateCondition(c, edgeScore, dimensionScores));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["<", "<=", ">", ">=", "==", "!="]),
  value: z.union([z.number(), z.string()]),
});

const createRuleSchema = z.object({
  ruleCode: z.string().min(1).max(120),
  displayName: z.string().min(1).max(255),
  description: z.string().optional(),
  moduleType: z.string().min(1).max(20),
  dimensionId: z.string().optional(),
  priority: z.number().int().default(50),
  conditions: z.array(conditionSchema).min(1),
  recommendationTitle: z.string().min(1).max(255),
  recommendationDescription: z.string().min(1),
  recommendationType: z.string().min(1).max(100),
  actionCheckInDays: z.number().int().default(7),
  outcomeCheckInDays: z.number().int().default(30),
  mutexGroup: z.string().optional(),
  maxRecommendations: z.number().int().default(3),
  explanationTemplate: z.string().optional(),
});

const registerDiagnosticSchema = z.object({
  reportId: z.number().int(),
});

const decideSchema = z.object({
  recommendationId: z.number().int(),
  decision: z.enum(["accepted", "rejected", "deferred"]),
  reasonCode: z.string().optional(),
  reasonText: z.string().optional(),
});

const createActionSchema = z.object({
  recommendationId: z.number().int(),
  actionTypeCode: z.string().min(1).max(100),
  actionDescription: z.string().min(1),
  plannedStartAt: z.date().optional(),
  plannedCompleteAt: z.date().optional(),
});

const updateActionStatusSchema = z.object({
  actionId: z.number().int(),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  completionNotes: z.string().optional(),
});

const recordOutcomeSchema = z.object({
  actionId: z.number().int(),
  recommendationId: z.number().int(),
  impactLevel: z.enum(["none", "minimal", "moderate", "significant", "transformative"]),
  recommendationValue: z.enum(["not_helpful", "slightly_helpful", "helpful", "very_helpful", "essential"]),
  causalConfidence: z.enum(["low", "medium", "high"]).default("medium"),
  outcomeSummary: z.string().optional(),
  measurementMethodCode: z.string().optional(),
  metrics: z.array(z.object({
    metricCode: z.string(),
    baselineValue: z.number().optional(),
    resultValue: z.number().optional(),
    unitCode: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  evidence: z.object({
    evidenceSource: z.enum(["self_report", "manager_confirmation", "coach_observation", "system_metric", "uploaded_document", "hr_validation"]),
    evidenceReference: z.string().optional(),
  }).optional(),
});

const grantPermissionSchema = z.object({
  scopeType: z.enum(["organization", "individual"]),
  scopeSubjectId: z.number().int(),
  purposeCode: z.string().min(1).max(120),
  policyVersion: z.string().optional(),
  legalBasisCode: z.string().optional(),
  reason: z.string().optional(),
});

const revokePermissionSchema = z.object({
  permissionId: z.number().int(),
  reason: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export const intelligenceCoreRouter = router({
  // ─── 1. Diagnostic Instances ────────────────────────────────────────────────

  /**
   * Register a completed diagnostic report as an Intelligence Core diagnostic instance.
   * This creates the immutable canonical fact that the rule engine operates on.
   */
  registerDiagnostic: protectedProcedure
    .input(registerDiagnosticSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [report] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      }

      // Verify ownership: user must own the report or be admin
      if (report.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to register this report." });
      }

      // Check if already registered
      const [existing] = await db
        .select()
        .from(icDiagnosticInstances)
        .where(eq(icDiagnosticInstances.reportId, input.reportId))
        .limit(1);

      if (existing) {
        return { diagnosticInstanceId: existing.id, alreadyRegistered: true };
      }

      const [instance] = await db.insert(icDiagnosticInstances).values({
        reportId: report.id,
        tenantId: report.tenantId ?? null,
        userId: report.userId ?? null,
        moduleType: report.moduleType,
        edgeScore: report.edgeScore,
        dimensionScores: report.dimensionScores ?? null,
        archetype: report.archetype ?? null,
        zone: report.zone ?? null,
        completedAt: report.createdAt,
      });

      await writeAuditEvent({
        tenantId: report.tenantId,
        actorUserId: ctx.user.id,
        subjectUserId: report.userId,
        eventType: "diagnostic_registered",
        resourceType: "ic_diagnostic_instance",
        resourceId: instance.insertId,
        authorizationResult: "allowed",
      });

      await writeOutboxEvent({
        tenantId: report.tenantId,
        eventType: "diagnostic.registered",
        aggregateType: "diagnostic_instance",
        aggregateId: Number(instance.insertId),
        payload: { reportId: report.id, moduleType: report.moduleType, edgeScore: report.edgeScore },
      });

      return { diagnosticInstanceId: Number(instance.insertId), alreadyRegistered: false };
    }),

  /**
   * Get diagnostic instances for the current user.
   */
  myDiagnostics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(icDiagnosticInstances)
      .where(eq(icDiagnosticInstances.userId, ctx.user.id))
      .orderBy(desc(icDiagnosticInstances.completedAt));

    return { diagnostics: result };
  }),

  // ─── 2. Permission & Consent ───────────────────────────────────────────────

  /**
   * Get effective permissions for the current user's tenant.
   */
  getEffectivePermissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const tenantId = await getTenantId(ctx.user.id);
    if (!tenantId) {
      return { permissions: [] as Array<typeof icProcessingPermissions.$inferSelect> };
    }

    const result = await db
      .select()
      .from(icProcessingPermissions)
      .where(eq(icProcessingPermissions.tenantId, tenantId));

    return { permissions: result };
  }),

  /**
   * Grant a processing permission (tenant admin only).
   */
  grantPermission: protectedProcedure
    .input(grantPermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await requireTenantAdmin(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [permission] = await db.insert(icProcessingPermissions).values({
        tenantId,
        scopeType: input.scopeType,
        scopeSubjectId: input.scopeSubjectId,
        purposeCode: input.purposeCode,
        status: "granted",
        policyVersion: input.policyVersion ?? "1.0",
        legalBasisCode: input.legalBasisCode ?? null,
        effectiveFrom: new Date(),
      });

      await db.insert(icPermissionEvents).values({
        permissionId: Number(permission.insertId),
        tenantId,
        scopeType: input.scopeType,
        scopeSubjectId: input.scopeSubjectId,
        purposeCode: input.purposeCode,
        eventType: "granted",
        policyVersion: input.policyVersion ?? "1.0",
        reason: input.reason ?? null,
        actorUserId: ctx.user.id,
      });

      await writeAuditEvent({
        tenantId,
        actorUserId: ctx.user.id,
        eventType: "permission_granted",
        resourceType: "ic_processing_permission",
        resourceId: Number(permission.insertId),
        authorizationResult: "allowed",
      });

      return { permissionId: Number(permission.insertId) };
    }),

  /**
   * Revoke a processing permission (tenant admin only).
   */
  revokePermission: protectedProcedure
    .input(revokePermissionSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await requireTenantAdmin(ctx.user.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(icProcessingPermissions)
        .set({ status: "revoked" })
        .where(and(
          eq(icProcessingPermissions.id, input.permissionId),
          eq(icProcessingPermissions.tenantId, tenantId),
        ));

      await db.insert(icPermissionEvents).values({
        permissionId: input.permissionId,
        tenantId,
        scopeType: "organization",
        scopeSubjectId: 0,
        purposeCode: "revoke",
        eventType: "revoked",
        reason: input.reason ?? null,
        actorUserId: ctx.user.id,
      });

      await writeAuditEvent({
        tenantId,
        actorUserId: ctx.user.id,
        eventType: "permission_revoked",
        resourceType: "ic_processing_permission",
        resourceId: input.permissionId,
        authorizationResult: "allowed",
      });

      return { success: true };
    }),

  // ─── 3. Rule Engine ─────────────────────────────────────────────────────────

  /**
   * Create a new judgment rule with its first version (admin only).
   */
  createRule: adminProcedure
    .input(createRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [rule] = await db.insert(icJudgmentRules).values({
        ruleCode: input.ruleCode,
        displayName: input.displayName,
        description: input.description ?? null,
        moduleType: input.moduleType,
        dimensionId: input.dimensionId ?? null,
        priority: input.priority,
        status: "draft",
      });

      const ruleId = Number(rule.insertId);

      const [version] = await db.insert(icJudgmentRuleVersions).values({
        ruleId,
        version: 1,
        conditions: input.conditions,
        recommendationTitle: input.recommendationTitle,
        recommendationDescription: input.recommendationDescription,
        recommendationType: input.recommendationType,
        actionCheckInDays: input.actionCheckInDays,
        outcomeCheckInDays: input.outcomeCheckInDays,
        mutexGroup: input.mutexGroup ?? null,
        maxRecommendations: input.maxRecommendations,
        explanationTemplate: input.explanationTemplate ?? null,
        status: "draft",
      });

      await writeAuditEvent({
        actorUserId: ctx.user.id,
        eventType: "rule_created",
        resourceType: "ic_judgment_rule",
        resourceId: ruleId,
        authorizationResult: "allowed",
      });

      return { ruleId, ruleVersionId: Number(version.insertId) };
    }),

  /**
   * List all judgment rules (admin only).
   */
  listRules: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const rulesList = await db
      .select()
      .from(icJudgmentRules)
      .orderBy(desc(icJudgmentRules.createdAt));

    return { rules: rulesList };
  }),

  /**
   * Get rule versions for a specific rule (admin only).
   */
  getRuleVersions: adminProcedure
    .input(z.object({ ruleId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const versions = await db
        .select()
        .from(icJudgmentRuleVersions)
        .where(eq(icJudgmentRuleVersions.ruleId, input.ruleId))
        .orderBy(desc(icJudgmentRuleVersions.version));

      return { versions };
    }),

  /**
   * Activate a rule version (admin only). This sets the rule and version to active status.
   */
  activateRule: adminProcedure
    .input(z.object({ ruleVersionId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [version] = await db
        .select()
        .from(icJudgmentRuleVersions)
        .where(eq(icJudgmentRuleVersions.id, input.ruleVersionId))
        .limit(1);

      if (!version) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule version not found." });
      }

      // Supersede previous active versions for this rule
      await db
        .update(icJudgmentRuleVersions)
        .set({ status: "superseded", effectiveTo: new Date() })
        .where(and(
          eq(icJudgmentRuleVersions.ruleId, version.ruleId),
          eq(icJudgmentRuleVersions.status, "active"),
        ));

      // Activate the new version
      await db
        .update(icJudgmentRuleVersions)
        .set({ status: "active", effectiveFrom: new Date() })
        .where(eq(icJudgmentRuleVersions.id, input.ruleVersionId));

      // Set the rule to active
      await db
        .update(icJudgmentRules)
        .set({ status: "active", approvedBy: ctx.user.id, approvedAt: new Date() })
        .where(eq(icJudgmentRules.id, version.ruleId));

      await writeAuditEvent({
        actorUserId: ctx.user.id,
        eventType: "rule_activated",
        resourceType: "ic_judgment_rule_version",
        resourceId: input.ruleVersionId,
        authorizationResult: "allowed",
      });

      return { success: true };
    }),

  /**
   * Execute all active rules against a diagnostic instance and generate recommendations.
   * This is the core judgment engine entry point.
   */
  executeRules: protectedProcedure
    .input(z.object({ diagnosticInstanceId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get the diagnostic instance
      const [instance] = await db
        .select()
        .from(icDiagnosticInstances)
        .where(eq(icDiagnosticInstances.id, input.diagnosticInstanceId))
        .limit(1);

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic instance not found." });
      }

      // Verify access: user must own the diagnostic or be admin
      if (instance.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized." });
      }

      // Get all active rules for this module type
      const activeRules = await db
        .select({
          rule: icJudgmentRules,
          version: icJudgmentRuleVersions,
        })
        .from(icJudgmentRules)
        .innerJoin(
          icJudgmentRuleVersions,
          eq(icJudgmentRules.id, icJudgmentRuleVersions.ruleId),
        )
        .where(and(
          eq(icJudgmentRules.moduleType, instance.moduleType),
          eq(icJudgmentRules.status, "active"),
          eq(icJudgmentRuleVersions.status, "active"),
        ))
        .orderBy(desc(icJudgmentRules.priority));

      const executions: Array<{ executionId: number; matched: boolean; ruleCode: string }> = [];
      const recommendations: Array<{ recommendationId: number; title: string }> = [];
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      for (const { rule, version } of activeRules) {
        // Execute the rule
        const matched = evaluateRule(
          version.conditions as Array<{ field: string; operator: string; value: number | string }>,
          instance.edgeScore,
          instance.dimensionScores as Record<string, number> | null,
        );

        const [execution] = await db.insert(icJudgmentExecutions).values({
          diagnosticInstanceId: instance.id,
          ruleVersionId: version.id,
          tenantId: instance.tenantId ?? null,
          userId: instance.userId ?? null,
          inputSnapshot: {
            edgeScore: instance.edgeScore,
            dimensionScores: instance.dimensionScores,
            archetype: instance.archetype,
            zone: instance.zone,
          },
          matched,
          outputSnapshot: matched ? {
            recommendationTitle: version.recommendationTitle,
            recommendationType: version.recommendationType,
          } : null,
          inputConfidence: 1.0,
          ruleApplicability: matched ? 1.0 : 0.0,
          traceId,
        });

        const executionId = Number(execution.insertId);
        executions.push({ executionId, matched, ruleCode: rule.ruleCode });

        // If matched, create a recommendation
        if (matched) {
          const [rec] = await db.insert(icRecommendations).values({
            diagnosticInstanceId: instance.id,
            judgmentExecutionId: executionId,
            ruleId: rule.id,
            ruleVersionId: version.id,
            tenantId: instance.tenantId ?? null,
            userId: instance.userId ?? ctx.user.id,
            title: version.recommendationTitle,
            description: version.recommendationDescription,
            recommendationType: version.recommendationType,
            priority: rule.priority,
            explanation: version.explanationTemplate ?? null,
            status: "generated",
          });

          recommendations.push({
            recommendationId: Number(rec.insertId),
            title: version.recommendationTitle,
          });
        }
      }

      await writeAuditEvent({
        tenantId: instance.tenantId,
        actorUserId: ctx.user.id,
        subjectUserId: instance.userId,
        eventType: "rules_executed",
        resourceType: "ic_diagnostic_instance",
        resourceId: instance.id,
        authorizationResult: "allowed",
        metadata: { ruleCount: activeRules.length, matchedCount: recommendations.length, traceId },
      });

      return {
        traceId,
        totalRulesEvaluated: activeRules.length,
        totalMatched: recommendations.length,
        executions,
        recommendations,
      };
    }),

  // ─── 4. Recommendation Lifecycle ────────────────────────────────────────────

  /**
   * Get recommendations for the current user.
   */
  myRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(icRecommendations)
      .where(eq(icRecommendations.userId, ctx.user.id))
      .orderBy(desc(icRecommendations.createdAt));

    return { recommendations: result };
  }),

  /**
   * Get a specific recommendation by ID (with ownership check).
   */
  getRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [rec] = await db
        .select()
        .from(icRecommendations)
        .where(eq(icRecommendations.id, input.recommendationId))
        .limit(1);

      if (!rec) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found." });
      }

      if (rec.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized." });
      }

      return { recommendation: rec };
    }),

  /**
   * Mark a recommendation as presented to the user.
   */
  presentRecommendations: protectedProcedure
    .input(z.object({ diagnosticInstanceId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(icRecommendations)
        .set({ status: "presented", presentedAt: new Date() })
        .where(and(
          eq(icRecommendations.diagnosticInstanceId, input.diagnosticInstanceId),
          eq(icRecommendations.userId, ctx.user.id),
          eq(icRecommendations.status, "generated"),
        ));

      return { success: true };
    }),

  /**
   * Make a decision on a recommendation (accept, reject, or defer).
   */
  decideRecommendation: protectedProcedure
    .input(decideSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [rec] = await db
        .select()
        .from(icRecommendations)
        .where(eq(icRecommendations.id, input.recommendationId))
        .limit(1);

      if (!rec) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found." });
      }

      if (rec.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized." });
      }

      await db
        .update(icRecommendations)
        .set({
          status: input.decision,
          decidedAt: new Date(),
          decisionReasonCode: input.reasonCode ?? null,
          decisionReasonText: input.reasonText ?? null,
        })
        .where(eq(icRecommendations.id, input.recommendationId));

      await writeOutboxEvent({
        tenantId: rec.tenantId,
        eventType: "recommendation.decided",
        aggregateType: "recommendation",
        aggregateId: rec.id,
        payload: { decision: input.decision, reasonCode: input.reasonCode },
      });

      return { success: true };
    }),

  // ─── 5. Actions ─────────────────────────────────────────────────────────────

  /**
   * Create an action commitment based on a recommendation.
   */
  createAction: protectedProcedure
    .input(createActionSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [rec] = await db
        .select()
        .from(icRecommendations)
        .where(eq(icRecommendations.id, input.recommendationId))
        .limit(1);

      if (!rec) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recommendation not found." });
      }

      if (rec.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized." });
      }

      const [action] = await db.insert(icRecommendationActions).values({
        recommendationId: input.recommendationId,
        tenantId: rec.tenantId ?? null,
        userId: ctx.user.id,
        actionTypeCode: input.actionTypeCode,
        actionDescription: input.actionDescription,
        status: "planned",
        plannedStartAt: input.plannedStartAt ?? null,
        plannedCompleteAt: input.plannedCompleteAt ?? null,
      });

      await writeOutboxEvent({
        tenantId: rec.tenantId,
        eventType: "action.created",
        aggregateType: "recommendation_action",
        aggregateId: Number(action.insertId),
        payload: { recommendationId: input.recommendationId, actionTypeCode: input.actionTypeCode },
      });

      return { actionId: Number(action.insertId) };
    }),

  /**
   * Update the status of an action.
   */
  updateActionStatus: protectedProcedure
    .input(updateActionStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [action] = await db
        .select()
        .from(icRecommendationActions)
        .where(eq(icRecommendationActions.id, input.actionId))
        .limit(1);

      if (!action) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Action not found." });
      }

      if (action.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized." });
      }

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.status === "completed") {
        updateData.completedAt = new Date();
      }
      if (input.completionNotes) {
        updateData.completionNotes = input.completionNotes;
      }

      await db
        .update(icRecommendationActions)
        .set(updateData)
        .where(eq(icRecommendationActions.id, input.actionId));

      await writeOutboxEvent({
        tenantId: action.tenantId,
        eventType: "action.status_changed",
        aggregateType: "recommendation_action",
        aggregateId: action.id,
        payload: { status: input.status },
      });

      return { success: true };
    }),

  /**
   * Get actions for the current user.
   */
  myActions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(icRecommendationActions)
      .where(eq(icRecommendationActions.userId, ctx.user.id))
      .orderBy(desc(icRecommendationActions.createdAt));

    return { actions: result };
  }),

  // ─── 6. Outcomes ────────────────────────────────────────────────────────────

  /**
   * Record an outcome observation for a completed action.
   */
  recordOutcome: protectedProcedure
    .input(recordOutcomeSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [action] = await db
        .select()
        .from(icRecommendationActions)
        .where(eq(icRecommendationActions.id, input.actionId))
        .limit(1);

      if (!action) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Action not found." });
      }

      if (action.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized." });
      }

      const [observation] = await db.insert(icOutcomeObservations).values({
        actionId: input.actionId,
        recommendationId: input.recommendationId,
        tenantId: action.tenantId ?? null,
        userId: ctx.user.id,
        observationRound: 1,
        impactLevel: input.impactLevel,
        recommendationValue: input.recommendationValue,
        causalConfidence: input.causalConfidence,
        outcomeSummary: input.outcomeSummary ?? null,
        measurementMethodCode: input.measurementMethodCode ?? null,
      });

      const observationId = Number(observation.insertId);

      // Insert metrics if provided
      if (input.metrics && input.metrics.length > 0) {
        for (const metric of input.metrics) {
          await db.insert(icOutcomeMetrics).values({
            outcomeObservationId: observationId,
            metricCode: metric.metricCode,
            baselineValue: metric.baselineValue ?? null,
            resultValue: metric.resultValue ?? null,
            unitCode: metric.unitCode ?? null,
            description: metric.description ?? null,
          });
        }
      }

      // Insert evidence if provided
      if (input.evidence) {
        await db.insert(icOutcomeEvidence).values({
          outcomeObservationId: observationId,
          evidenceSource: input.evidence.evidenceSource,
          verificationStatus: "unverified",
          evidenceReference: input.evidence.evidenceReference ?? null,
        });
      }

      await writeOutboxEvent({
        tenantId: action.tenantId,
        eventType: "outcome.recorded",
        aggregateType: "outcome_observation",
        aggregateId: observationId,
        payload: {
          actionId: input.actionId,
          impactLevel: input.impactLevel,
          recommendationValue: input.recommendationValue,
        },
      });

      await writeAuditEvent({
        tenantId: action.tenantId,
        actorUserId: ctx.user.id,
        eventType: "outcome_recorded",
        resourceType: "ic_outcome_observation",
        resourceId: observationId,
        authorizationResult: "allowed",
      });

      return { observationId };
    }),

  /**
   * Get outcome observations for the current user.
   */
  myOutcomes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(icOutcomeObservations)
      .where(eq(icOutcomeObservations.userId, ctx.user.id))
      .orderBy(desc(icOutcomeObservations.observedAt));

    return { outcomes: result };
  }),

  // ─── 7. ECI Judgement Spec Profile ──────────────────────────────────────────

  /**
   * Get the ECI Judgement Spec profile for the current user.
   * Returns archetype details, development priorities, practice scenarios,
   * coaching interventions, and promotion readiness assessment based on
   * the user's most recent ECI diagnostic.
   */
  getEciProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Find the user's most recent ECI diagnostic instance
    const [instance] = await db
      .select()
      .from(icDiagnosticInstances)
      .where(and(
        eq(icDiagnosticInstances.userId, ctx.user.id),
        eq(icDiagnosticInstances.moduleType, "ECI"),
      ))
      .orderBy(desc(icDiagnosticInstances.completedAt))
      .limit(1);

    if (!instance) {
      return { hasEciDiagnostic: false };
    }

    // Import ECI Judgement Spec data
    const {
      ECI_EXTENDED_ARCHETYPES,
      ECI_COACHING_INTERVENTIONS,
      ECI_PRACTICE_SCENARIOS,
      ECI_PROMOTION_READINESS_RULES,
      ECI_EXECUTIVE_RISKS,
      ECI_OUTCOME_DOMAINS,
      ECI_SCORE_BANDS,
      getScoreBand,
    } = await import("../../shared/modules/eciJudgementSpec");

    // Map the original archetype ID to the extended archetype data
    const archetypeId = instance.archetype ?? "";
    const extendedArchetype = ECI_EXTENDED_ARCHETYPES.find(a => a.id === archetypeId) ?? null;

    // Evaluate promotion readiness rules against the user's dimension scores
    const dimScores = (instance.dimensionScores as Record<string, number> | null) ?? {};
    const promotionReadiness = ECI_PROMOTION_READINESS_RULES.filter(rule => {
      return rule.conditions.every(cond => {
        const actual = dimScores[cond.field];
        if (actual === undefined) return false;
        switch (cond.operator) {
          case ">": return actual > cond.value;
          case ">=": return actual >= cond.value;
          case "<": return actual < cond.value;
          case "<=": return actual <= cond.value;
          default: return false;
        }
      });
    }).map(rule => ({
      id: rule.id,
      label: rule.label,
      readinessAssessment: rule.readinessAssessment,
      developmentFocus: rule.developmentFocus,
    }));

    // Find practice scenarios for the user's lowest-scoring dimensions
    const sortedDims = Object.entries(dimScores)
      .filter(([k]) => k !== "edgeScore")
      .sort(([, a], [, b]) => a - b);
    const lowestDimIds = sortedDims.slice(0, 3).map(([id]) => id);
    const recommendedScenarios = ECI_PRACTICE_SCENARIOS
      .filter(ps => lowestDimIds.includes(ps.dimensionId))
      .slice(0, 6);

    // Find coaching interventions for the user's lowest dimensions
    // Map dimension IDs to intervention IDs
    const dimToInterventionMap: Record<string, string> = {
      strategic_clarity: "authority_language_coaching",
      executive_framing: "authority_language_coaching",
      gravitas_composure: "executive_presence_development",
      confidence_authority: "authority_language_coaching",
      stakeholder_influence: "political_intelligence_development",
      political_intelligence: "political_intelligence_development",
      storytelling_vision: "storytelling_development",
      executive_visibility: "visibility_building",
      accountability_conversations: "accountability_conversation_coaching",
      trust_alignment: "accountability_conversation_coaching",
    };
    const recommendedInterventionIds = new Set(
      lowestDimIds.map(id => dimToInterventionMap[id]).filter(Boolean),
    );
    const recommendedInterventions = Array.from(recommendedInterventionIds)
      .map(id => ECI_COACHING_INTERVENTIONS[id])
      .filter(Boolean);

    // Find triggered executive risks
    const triggeredRisks = ECI_EXECUTIVE_RISKS.filter(risk => {
      // Check if any of the risk's trigger conditions match the user's scores
      // We check if the dimension mentioned in triggerConditions has a low score
      return risk.triggerConditions.some(cond => {
        const match = cond.match(/([a-z_]+)\s*[<>]\s*(\d+)/);
        if (!match) return false;
        const [, dim, threshold] = match;
        const score = dimScores[dim];
        if (score === undefined) return false;
        if (cond.includes("<")) return score < parseInt(threshold);
        if (cond.includes(">")) return score > parseInt(threshold);
        return false;
      });
    });

    // Get score bands for each dimension
    const dimensionBands = Object.entries(dimScores).map(([id, score]) => ({
      dimensionId: id,
      score,
      band: getScoreBand(score),
    }));

    return {
      hasEciDiagnostic: true,
      diagnosticInstanceId: instance.id,
      archetype: extendedArchetype ? {
        id: extendedArchetype.id,
        label: extendedArchetype.label,
        description: extendedArchetype.description,
        coreStrengths: extendedArchetype.coreStrengths,
        blindSpots: extendedArchetype.blindSpots,
        executiveRisks: extendedArchetype.executiveRisks,
        developmentPriorities: extendedArchetype.developmentPriorities,
        idealEnvironments: extendedArchetype.idealEnvironments,
        promotionRisks: extendedArchetype.promotionRisks,
      } : null,
      edgeScore: instance.edgeScore,
      dimensionBands,
      promotionReadiness,
      recommendedScenarios,
      recommendedInterventions: recommendedInterventions.map(i => ({
        id: i.id,
        objective: i.objective,
        practiceExercises: i.practiceExercises,
        aiSimulations: i.aiSimulations,
        reflectionQuestions: i.reflectionQuestions,
        suggestedDurationWeeks: i.suggestedDurationWeeks,
        successMetrics: i.successMetrics,
      })),
      triggeredRisks: triggeredRisks.map(r => ({
        id: r.id,
        label: r.label,
        behaviouralIndicators: r.behaviouralIndicators,
        businessConsequences: r.businessConsequences,
        coachingPriorities: r.coachingPriorities,
      })),
      outcomeDomains: ECI_OUTCOME_DOMAINS,
    };
  }),

  // ─── 8. Admin Analytics ────────────────────────────────────────────────────

  /**
   * Get Intelligence Core analytics (admin only).
   * Returns privacy-thresholded aggregate metrics.
   */
  getAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Privacy threshold: suppress any grouped result with fewer than 5 entries
    const PRIVACY_THRESHOLD = 5;
    function applyPrivacyThreshold<T extends { count: number }>(
      rows: T[],
    ): T[] {
      return rows.map(row =>
        row.count < PRIVACY_THRESHOLD
          ? { ...row, count: 0, suppressed: true as const }
          : row,
      );
    }

    // Total diagnostic instances
    const [diagCount] = await db
      .select({ count: count() })
      .from(icDiagnosticInstances);

    // Total recommendations
    const [recCount] = await db
      .select({ count: count() })
      .from(icRecommendations);

    // Total actions
    const [actionCount] = await db
      .select({ count: count() })
      .from(icRecommendationActions);

    // Total outcomes
    const [outcomeCount] = await db
      .select({ count: count() })
      .from(icOutcomeObservations);

    // Recommendations by status (with privacy thresholding)
    const recByStatusRaw = await db
      .select({
        status: icRecommendations.status,
        count: count(),
      })
      .from(icRecommendations)
      .groupBy(icRecommendations.status);
    const recByStatus = applyPrivacyThreshold(recByStatusRaw);

    // Actions by status (with privacy thresholding)
    const actionByStatusRaw = await db
      .select({
        status: icRecommendationActions.status,
        count: count(),
      })
      .from(icRecommendationActions)
      .groupBy(icRecommendationActions.status);
    const actionByStatus = applyPrivacyThreshold(actionByStatusRaw);

    // Outcomes by impact level (with privacy thresholding)
    const outcomeByImpactRaw = await db
      .select({
        impactLevel: icOutcomeObservations.impactLevel,
        count: count(),
      })
      .from(icOutcomeObservations)
      .groupBy(icOutcomeObservations.impactLevel);
    const outcomeByImpact = applyPrivacyThreshold(outcomeByImpactRaw);

    // Active rules count
    const [ruleCount] = await db
      .select({ count: count() })
      .from(icJudgmentRules)
      .where(eq(icJudgmentRules.status, "active"));

    return {
      totals: {
        diagnosticInstances: diagCount?.count ?? 0,
        recommendations: recCount?.count ?? 0,
        actions: actionCount?.count ?? 0,
        outcomes: outcomeCount?.count ?? 0,
        activeRules: ruleCount?.count ?? 0,
      },
      recommendationsByStatus: recByStatus,
      actionsByStatus: actionByStatus,
      outcomesByImpact: outcomeByImpact,
      privacyThreshold: PRIVACY_THRESHOLD,
    };
  }),

  /**
   * Get the full audit log (admin only).
   */
  getAuditLog: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
        .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db
        .select()
        .from(icAuditEvents)
        .orderBy(desc(icAuditEvents.occurredAt))
        .limit(input.limit)
        .offset(input.offset);
      return { events: result };
    }),

  // ─── 9. Practice Scenario Progress ──────────────────────────────────────────

  /**
   * Get the user's practice scenario progress for their latest ECI diagnostic.
   */
  getPracticeProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [instance] = await db
      .select()
      .from(icDiagnosticInstances)
      .where(and(
        eq(icDiagnosticInstances.userId, ctx.user.id),
        eq(icDiagnosticInstances.moduleType, "ECI"),
      ))
      .orderBy(desc(icDiagnosticInstances.completedAt))
      .limit(1);

    if (!instance) return { items: [] };

    const progress = await db
      .select()
      .from(icPracticeProgress)
      .where(and(
        eq(icPracticeProgress.userId, ctx.user.id),
        eq(icPracticeProgress.diagnosticInstanceId, instance.id),
      ));

    return { items: progress };
  }),

  /**
   * Toggle a practice scenario's completion status.
   */
  togglePracticeProgress: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
      dimensionId: z.string(),
      completed: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find the user's latest ECI diagnostic instance
      const [instance] = await db
        .select()
        .from(icDiagnosticInstances)
        .where(and(
          eq(icDiagnosticInstances.userId, ctx.user.id),
          eq(icDiagnosticInstances.moduleType, "ECI"),
        ))
        .orderBy(desc(icDiagnosticInstances.completedAt))
        .limit(1);

      if (!instance) throw new TRPCError({ code: "NOT_FOUND", message: "No ECI diagnostic found" });

      // Check if a progress record already exists
      const [existing] = await db
        .select()
        .from(icPracticeProgress)
        .where(and(
          eq(icPracticeProgress.userId, ctx.user.id),
          eq(icPracticeProgress.diagnosticInstanceId, instance.id),
          eq(icPracticeProgress.scenarioId, input.scenarioId),
        ))
        .limit(1);

      if (existing) {
        await db
          .update(icPracticeProgress)
          .set({
            completed: input.completed,
            completedAt: input.completed ? new Date() : null,
            notes: input.notes ?? existing.notes,
            updatedAt: new Date(),
          })
          .where(eq(icPracticeProgress.id, existing.id));
        return { success: true };
      }

      await db.insert(icPracticeProgress).values({
        userId: ctx.user.id,
        diagnosticInstanceId: instance.id,
        scenarioId: input.scenarioId,
        dimensionId: input.dimensionId,
        completed: input.completed,
        completedAt: input.completed ? new Date() : null,
        notes: input.notes ?? null,
      });

      return { success: true };
    }),

  // ─── 10. ECI Archetype Chat ──────────────────────────────────────────────────

  /**
   * Ask a question about the user's ECI archetype and pathways.
   * Uses the LLM gateway with a system prompt built from the user's ECI profile.
   */
  askEciQuestion: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find the user's most recent ECI diagnostic instance
      const [instance] = await db
        .select()
        .from(icDiagnosticInstances)
        .where(and(
          eq(icDiagnosticInstances.userId, ctx.user.id),
          eq(icDiagnosticInstances.moduleType, "ECI"),
        ))
        .orderBy(desc(icDiagnosticInstances.completedAt))
        .limit(1);

      if (!instance) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No ECI diagnostic found. Please complete an ECI assessment first." });
      }

      // Import ECI Judgement Spec data for the system prompt
      const {
        ECI_EXTENDED_ARCHETYPES,
        ECI_COACHING_INTERVENTIONS,
        ECI_EXECUTIVE_RISKS,
      } = await import("../../shared/modules/eciJudgementSpec");

      const archetypeId = instance.archetype ?? "";
      const archetype = ECI_EXTENDED_ARCHETYPES.find(a => a.id === archetypeId);
      const dimScores = (instance.dimensionScores as Record<string, number> | null) ?? {};

      // Build the system prompt with the user's ECI context
      const systemPrompt = `You are the LevelNext Intelligence Core, an AI coaching assistant specialized in Executive Communication Intelligence (ECI). You help users understand their communication archetype, development pathways, and practice scenarios.

User Context:
- Archetype: ${archetype?.label ?? "Unknown"}
- Archetype Description: ${archetype?.description ?? "N/A"}
- Core Strengths: ${(archetype?.coreStrengths ?? []).join(", ")}
- Blind Spots: ${(archetype?.blindSpots ?? []).join(", ")}
- Development Priorities: ${(archetype?.developmentPriorities ?? []).join(", ")}
- Dimension Scores: ${Object.entries(dimScores).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Edge Score: ${instance.edgeScore ?? "N/A"}

Guidelines:
- Answer questions about the user's archetype, strengths, blind spots, and development pathways.
- Provide specific, actionable advice grounded in the user's actual dimension scores.
- Reference practice scenarios and coaching interventions when relevant.
- Keep responses concise (max 300 words) and conversational.
- If the user asks about something outside ECI scope, gently redirect to communication development topics.
- Do not make up scores or assessments that aren't in the context.`;

      try {
        const { invokeLLM } = await import("../_core/llm");
        const response = await invokeLLM({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.question },
          ],
          maxTokens: 500,
        });

        const answer = response.choices?.[0]?.message?.content;
        const answerText = typeof answer === "string" ? answer : "I couldn't generate a response. Please try again.";

        return { answer: answerText };
      } catch (error) {
        console.error("[IC] ECI chat error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate response" });
      }
    }),
});
