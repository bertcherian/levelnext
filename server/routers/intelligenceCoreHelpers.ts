/**
 * Intelligence Core Helpers — Shared functions for auto-registration and rule execution.
 *
 * Used by assessment.ts and eciImport.ts to automatically register diagnostic
 * instances and execute judgment rules when a report is created.
 */

import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  icDiagnosticInstances,
  icJudgmentRules,
  icJudgmentRuleVersions,
  icJudgmentExecutions,
  icRecommendations,
  icAuditEvents,
  reports,
} from "../../drizzle/schema";

// ─── Condition Evaluator ─────────────────────────────────────────────────────

type RuleCondition = { field: string; operator: string; value: number | string };

function evaluateConditions(
  conditions: RuleCondition[],
  edgeScore: number | null,
  dimensionScores: Record<string, number> | null,
): boolean {
  if (!conditions || conditions.length === 0) return false;
  return conditions.every((cond) => {
    let actual: number | string | undefined;
    if (cond.field === "edgeScore" || cond.field === "edge_score") {
      actual = edgeScore ?? undefined;
    } else if (dimensionScores) {
      actual = dimensionScores[cond.field];
    }
    if (actual === undefined || actual === null) return false;
    const expected = cond.value;
    switch (cond.operator) {
      case ">": return actual > expected;
      case ">=": return actual >= expected;
      case "<": return actual < expected;
      case "<=": return actual <= expected;
      case "=": case "==": return actual === expected;
      case "!=": return actual !== expected;
      default: return false;
    }
  });
}

// ─── Auto-Register and Execute Rules ──────────────────────────────────────────

/**
 * Automatically register a diagnostic instance from a report and execute all
 * active rules for that module type. This is called after a report is created
 * (either via assessment.submit or eciImport.confirmEciImport) to generate
 * recommendations without requiring manual admin action.
 *
 * Returns the diagnostic instance ID and the number of recommendations generated.
 */
export async function autoRegisterAndExecuteRules(
  reportId: number,
  actorUserId: number,
): Promise<{ diagnosticInstanceId: number; recommendationsGenerated: number; alreadyRegistered: boolean }> {
  const db = await getDb();
  if (!db) {
    console.warn("[IntelligenceCore] Cannot auto-register: database not available");
    return { diagnosticInstanceId: 0, recommendationsGenerated: 0, alreadyRegistered: false };
  }

  // Fetch the report
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    console.warn(`[IntelligenceCore] Report ${reportId} not found for auto-registration`);
    return { diagnosticInstanceId: 0, recommendationsGenerated: 0, alreadyRegistered: false };
  }

  // Check if already registered
  const [existing] = await db
    .select()
    .from(icDiagnosticInstances)
    .where(eq(icDiagnosticInstances.reportId, reportId))
    .limit(1);

  if (existing) {
    return { diagnosticInstanceId: existing.id, recommendationsGenerated: 0, alreadyRegistered: true };
  }

  // Register the diagnostic instance
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

  const diagnosticInstanceId = Number(instance.insertId);

  // Write audit event
  await db.insert(icAuditEvents).values({
    tenantId: report.tenantId ?? null,
    actorUserId,
    subjectUserId: report.userId ?? null,
    eventType: "diagnostic_registered",
    resourceType: "ic_diagnostic_instance",
    resourceId: diagnosticInstanceId,
    authorizationResult: "allowed",
    metadata: { autoRegistered: true, moduleType: report.moduleType },
  });

  // Execute all active rules for this module type
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
      eq(icJudgmentRules.moduleType, report.moduleType),
      eq(icJudgmentRules.status, "active"),
      eq(icJudgmentRuleVersions.status, "active"),
    ))
    .orderBy(desc(icJudgmentRules.priority));

  const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let recommendationsGenerated = 0;

  for (const { rule, version } of activeRules) {
    const matched = evaluateConditions(
      version.conditions as RuleCondition[],
      report.edgeScore,
      report.dimensionScores as Record<string, number> | null,
    );

    const [execution] = await db.insert(icJudgmentExecutions).values({
      diagnosticInstanceId,
      ruleVersionId: version.id,
      tenantId: report.tenantId ?? null,
      userId: report.userId ?? null,
      inputSnapshot: {
        edgeScore: report.edgeScore,
        dimensionScores: report.dimensionScores,
        archetype: report.archetype,
        zone: report.zone,
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

    if (matched) {
      await db.insert(icRecommendations).values({
        diagnosticInstanceId,
        judgmentExecutionId: executionId,
        ruleId: rule.id,
        ruleVersionId: version.id,
        tenantId: report.tenantId ?? null,
        userId: report.userId ?? actorUserId,
        title: version.recommendationTitle,
        description: version.recommendationDescription,
        recommendationType: version.recommendationType,
        priority: rule.priority,
        explanation: version.explanationTemplate ?? null,
        status: "generated",
      });
      recommendationsGenerated++;
    }
  }

  // Write audit event for rule execution
  await db.insert(icAuditEvents).values({
    tenantId: report.tenantId ?? null,
    actorUserId,
    subjectUserId: report.userId ?? null,
    eventType: "rules_executed",
    resourceType: "ic_diagnostic_instance",
    resourceId: diagnosticInstanceId,
    authorizationResult: "allowed",
    metadata: {
      autoExecuted: true,
      ruleCount: activeRules.length,
      matchedCount: recommendationsGenerated,
      traceId,
    },
  });

  console.log(
    `[IntelligenceCore] Auto-registered report ${reportId} (${report.moduleType}), ` +
    `executed ${activeRules.length} rules, generated ${recommendationsGenerated} recommendations`,
  );

  return { diagnosticInstanceId, recommendationsGenerated, alreadyRegistered: false };
}
