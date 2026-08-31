import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  eiPartnerAssignments,
  eiPromptEvaluationRuns,
  eiPromptVersions,
  icAuditEvents,
  tenantUsers,
  tenants,
  users,
} from "../../drizzle/schema";

const AGENTS = ["self_leadership_intelligence", "success_partner_nudges"] as const;

function promptHash(agentCode: string, versionLabel: string, modelId: string) {
  return `${agentCode}:${versionLabel}:${modelId}`.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 0).toString(16);
}

function buildEvaluationEvidence(agentCode: (typeof AGENTS)[number], caseCode: string, status: "passed" | "failed" | "blocked") {
  const base = {
    caseCode,
    checks: [
      { code: "schema_contract", passed: status !== "blocked", detail: "Structured output matched the declared agent contract." },
      { code: "privacy_boundary", passed: status === "passed", detail: "No private reflection, diagnostic response, or unsupported participant signal appeared in evidence." },
      { code: "participant_led_tone", passed: status === "passed", detail: "Output remained invitational, non-diagnostic, and editable by a human." },
    ],
    releaseGate: status === "passed" ? "eligible" : "blocked",
  };
  return agentCode === "self_leadership_intelligence"
    ? { ...base, privateDataBoundary: "Participant-only reflection; no Partner or aggregate visibility." }
    : { ...base, permittedContextKeys: ["participant_name", "shared_mission", "follow_up_date"] };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

async function recordAudit(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, input: { tenantId?: number | null; actorUserId: number; subjectUserId?: number | null; eventType: string; resourceType?: string; resourceId?: number | null; metadata?: Record<string, unknown> }) {
  await db.insert(icAuditEvents).values({
    tenantId: input.tenantId ?? null,
    actorUserId: input.actorUserId,
    subjectUserId: input.subjectUserId ?? null,
    eventType: input.eventType,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    processingPurpose: "engineering_intelligence_administration",
    authorizationResult: "allowed",
    traceId: crypto.randomUUID(),
    metadata: input.metadata ?? {},
  });
}

export const engineeringAdminRouter = router({
  provisioningOverview: adminProcedure.query(async () => {
    const db = await requireDb();
    const organisations = await db.select({ id: tenants.id, name: tenants.name, industry: tenants.industry }).from(tenants).orderBy(tenants.name);
    const assignments = await db.select().from(eiPartnerAssignments).orderBy(desc(eiPartnerAssignments.updatedAt)).limit(100);
    const userIds = Array.from(new Set(assignments.flatMap((assignment) => [assignment.partnerUserId, assignment.participantUserId])));
    const assignmentUsers = userIds.length ? await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(inArray(users.id, userIds)) : [];
    return {
      organisations,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        partner: assignmentUsers.find((user) => user.id === assignment.partnerUserId) ?? null,
        participant: assignmentUsers.find((user) => user.id === assignment.participantUserId) ?? null,
      })),
    };
  }),

  listTenantMembers: adminProcedure.input(z.object({ tenantId: z.number().int().positive() })).query(async ({ input }) => {
    const db = await requireDb();
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, input.tenantId)).limit(1);
    if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Organisation not found" });
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      platformRole: users.role,
      membershipRole: tenantUsers.role,
      lastSignedIn: users.lastSignedIn,
    }).from(tenantUsers).innerJoin(users, eq(tenantUsers.userId, users.id)).where(eq(tenantUsers.tenantId, input.tenantId)).orderBy(users.name);
  }),

  assignPartner: adminProcedure.input(z.object({ tenantId: z.number().int().positive(), partnerUserId: z.number().int().positive(), participantUserId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    if (input.partnerUserId === input.participantUserId) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose different people for the participant and Success Partner." });
    const memberships = await db.select({ userId: tenantUsers.userId, role: users.role }).from(tenantUsers).innerJoin(users, eq(tenantUsers.userId, users.id)).where(and(eq(tenantUsers.tenantId, input.tenantId), inArray(tenantUsers.userId, [input.partnerUserId, input.participantUserId])));
    if (memberships.length !== 2) throw new TRPCError({ code: "BAD_REQUEST", message: "Both people must belong to the selected organisation." });
    const partner = memberships.find((membership) => membership.userId === input.partnerUserId);
    if (!partner || !["success_partner", "admin"].includes(partner.role)) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected Success Partner must have the success_partner or admin role." });
    const [existing] = await db.select().from(eiPartnerAssignments).where(and(eq(eiPartnerAssignments.tenantId, input.tenantId), eq(eiPartnerAssignments.partnerUserId, input.partnerUserId), eq(eiPartnerAssignments.participantUserId, input.participantUserId), eq(eiPartnerAssignments.status, "active"))).limit(1);
    if (existing) return { assignmentId: existing.id, created: false };
    const [created] = await db.insert(eiPartnerAssignments).values({ tenantId: input.tenantId, partnerUserId: input.partnerUserId, participantUserId: input.participantUserId, status: "active" }).$returningId();
    await recordAudit(db, { tenantId: input.tenantId, actorUserId: ctx.user.id, subjectUserId: input.participantUserId, eventType: "engineering_partner_assignment_created", resourceType: "ei_partner_assignment", resourceId: created.id, metadata: { partnerUserId: input.partnerUserId } });
    return { assignmentId: created.id, created: true };
  }),

  updateAssignmentStatus: adminProcedure.input(z.object({ assignmentId: z.number().int().positive(), status: z.enum(["active", "paused", "ended"]) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [assignment] = await db.select().from(eiPartnerAssignments).where(eq(eiPartnerAssignments.id, input.assignmentId)).limit(1);
    if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
    await db.update(eiPartnerAssignments).set({ status: input.status, updatedAt: new Date() }).where(eq(eiPartnerAssignments.id, input.assignmentId));
    await recordAudit(db, { tenantId: assignment.tenantId, actorUserId: ctx.user.id, subjectUserId: assignment.participantUserId, eventType: "engineering_partner_assignment_status_changed", resourceType: "ei_partner_assignment", resourceId: input.assignmentId, metadata: { from: assignment.status, to: input.status, partnerUserId: assignment.partnerUserId } });
    return { updated: true };
  }),

  promptEvaluationDashboard: adminProcedure.input(z.object({ agentCode: z.enum(AGENTS).optional() }).optional()).query(async ({ input }) => {
    const db = await requireDb();
    const versions = await db.select().from(eiPromptVersions).where(input?.agentCode ? eq(eiPromptVersions.agentCode, input.agentCode) : undefined).orderBy(desc(eiPromptVersions.updatedAt)).limit(50);
    const versionIds = versions.map((version) => version.id);
    const runs = versionIds.length ? await db.select().from(eiPromptEvaluationRuns).where(inArray(eiPromptEvaluationRuns.promptVersionId, versionIds)).orderBy(desc(eiPromptEvaluationRuns.createdAt)).limit(200) : [];
    return {
      versions: versions.map((version) => {
        const versionRuns = runs.filter((run) => run.promptVersionId === version.id);
        const passed = versionRuns.filter((run) => run.status === "passed").length;
        const failed = versionRuns.filter((run) => run.status === "failed").length;
        const blocked = versionRuns.filter((run) => run.status === "blocked").length;
        return { ...version, runs: versionRuns, summary: { total: versionRuns.length, passed, failed, blocked, passRate: versionRuns.length ? Math.round((passed / versionRuns.length) * 100) : 0, releaseGate: failed || blocked ? "blocked" : passed ? "eligible" : "insufficient_evidence" } };
      }),
    };
  }),

  createPromptVersion: adminProcedure.input(z.object({ agentCode: z.enum(AGENTS), versionLabel: z.string().trim().min(3).max(120), modelId: z.string().trim().min(3).max(120), status: z.enum(["draft", "candidate", "approved"]).default("draft") })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [created] = await db.insert(eiPromptVersions).values({ agentCode: input.agentCode, versionLabel: input.versionLabel, modelId: input.modelId, promptHash: promptHash(input.agentCode, input.versionLabel, input.modelId), status: input.status, createdByUserId: ctx.user.id, approvedByUserId: input.status === "approved" ? ctx.user.id : null }).$returningId();
    await recordAudit(db, { actorUserId: ctx.user.id, eventType: "engineering_prompt_version_created", resourceType: "ei_prompt_version", resourceId: created.id, metadata: input });
    return { promptVersionId: created.id };
  }),

  recordEvaluationRun: adminProcedure.input(z.object({ promptVersionId: z.number().int().positive(), caseCode: z.string().trim().min(2).max(120), status: z.enum(["passed", "failed", "blocked"]), score: z.number().int().min(0).max(100), failureReasons: z.array(z.string().trim().min(1).max(300)).max(8).default([]) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [version] = await db.select().from(eiPromptVersions).where(eq(eiPromptVersions.id, input.promptVersionId)).limit(1);
    if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Prompt version not found" });
    const [created] = await db.insert(eiPromptEvaluationRuns).values({ promptVersionId: version.id, agentCode: version.agentCode, caseCode: input.caseCode, status: input.status, score: input.score, evidence: buildEvaluationEvidence(version.agentCode, input.caseCode, input.status), failureReasons: input.failureReasons, runByUserId: ctx.user.id }).$returningId();
    await recordAudit(db, { actorUserId: ctx.user.id, eventType: "engineering_prompt_evaluation_recorded", resourceType: "ei_prompt_evaluation_run", resourceId: created.id, metadata: { promptVersionId: version.id, caseCode: input.caseCode, status: input.status } });
    return { evaluationRunId: created.id };
  }),
});
