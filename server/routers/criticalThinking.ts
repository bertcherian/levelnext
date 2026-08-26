import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  ctdmAdminAudit,
  ctdmAssessments,
  ctdmCampaigns,
  ctdmParticipants,
  ctdmReports,
  tenantUsers,
  tenants,
  users,
} from "../../drizzle/schema";
import {
  CTDM_BEHAVIOUR_ITEMS,
  CTDM_DIMENSIONS,
  CTDM_ENVIRONMENT_ITEMS,
  CTDM_ENVIRONMENT_SCALE,
  CTDM_GOVERNANCE,
  CTDM_PARTICIPANT_REPORT_SPEC,
  CTDM_REFLECTIVE_QUESTIONS,
  CTDM_RESPONSE_SCALE,
  CTDM_SCENARIOS,
  CTDM_TEAM_REPORT_SPEC,
  scoreCriticalThinkingDiagnostic,
  type CtdmAssessmentResponses,
} from "../../shared/modules/criticalThinkingDiagnostic";
import { canShowCriticalThinkingTeamReport, isCriticalThinkingTenantAdmin } from "../../shared/modules/criticalThinkingAccess";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const campaignInput = z.object({
  name: z.string().trim().min(3).max(255),
  reportingGroup: z.string().trim().min(2).max(255),
  targetAudience: z.string().trim().max(2000).optional(),
  targetRoles: z.string().trim().max(2000).optional(),
  industryContext: z.string().trim().max(150).optional(),
  geographicContext: z.string().trim().max(150).optional(),
  intendedUse: z.string().trim().max(120).optional(),
  administrationFormat: z.string().trim().max(80).optional(),
  readingLevel: z.string().trim().max(100).optional(),
  reportingMode: z.enum(["individual", "team", "both"]).optional(),
  minTeamSize: z.number().int().min(5).max(1000).optional(),
  namedReportAccess: z.boolean().optional(),
  consentStatement: z.string().trim().max(4000).optional(),
  retentionDays: z.number().int().min(30).max(3650).optional(),
  status: z.enum(["draft", "active", "closed", "archived"]).optional(),
  startsAt: z.date().nullable().optional(),
  closesAt: z.date().nullable().optional(),
});

const progressInput = z.object({
  assessmentId: z.number().int().positive(),
  currentSection: z.enum(["profile", "behaviour", "scenarios", "environment", "reflection"]),
  behaviourResponses: z.record(z.string(), z.number().int().min(0).max(5)),
  scenarioResponses: z.record(z.string(), z.object({ optionId: z.string().min(1), confidence: z.number().min(0).max(100) })),
  environmentResponses: z.record(z.string(), z.number().int().min(0).max(5)),
  reflections: z.record(z.string(), z.string().max(4000)),
});

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function getTenantMembership(db: Database, userId: number) {
  const rows = await db.select().from(tenantUsers).where(eq(tenantUsers.userId, userId)).limit(1);
  return rows[0] ?? null;
}

async function assertTenantAdmin(db: Database, userId: number) {
  const membership = await getTenantMembership(db, userId);
  if (!membership || !isCriticalThinkingTenantAdmin(membership.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Tenant administrator access is required." });
  }
  return membership;
}

async function getOwnedCampaign(db: Database, campaignId: number, tenantId: number) {
  const rows = await db.select().from(ctdmCampaigns).where(and(eq(ctdmCampaigns.id, campaignId), eq(ctdmCampaigns.tenantId, tenantId))).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic campaign not found in your organisation." });
  return rows[0];
}

async function recordAudit(db: Database, tenantId: number, actorUserId: number, action: string, targetType: string, targetId?: number, metadata?: Record<string, unknown>) {
  await db.insert(ctdmAdminAudit).values({ tenantId, actorUserId, action, targetType, targetId, metadata });
}

function makeAssessmentResponses(assessment: {
  behaviourResponses: Record<string, number> | null;
  scenarioResponses: Record<string, { optionId: string; confidence: number }> | null;
  environmentResponses: Record<string, number> | null;
  reflections: Record<string, string> | null;
}): CtdmAssessmentResponses {
  return {
    behaviour: assessment.behaviourResponses ?? {},
    scenarios: assessment.scenarioResponses ?? {},
    environment: assessment.environmentResponses ?? {},
    reflections: assessment.reflections ?? {},
  };
}

function isSubmissionComplete(responses: CtdmAssessmentResponses) {
  const behaviouralComplete = CTDM_DIMENSIONS.every((dimension) =>
    CTDM_BEHAVIOUR_ITEMS.filter((item) => item.dimensionId === dimension.id)
      .filter((item) => (responses.behaviour[item.id] ?? 0) >= 1).length >= 3,
  );
  const scenariosComplete = CTDM_SCENARIOS.every((scenario) => {
    const response = responses.scenarios[scenario.id];
    return Boolean(response && scenario.options.some((option) => option.id === response.optionId) && response.confidence >= 0 && response.confidence <= 100);
  });
  const environmentComplete = CTDM_ENVIRONMENT_ITEMS.filter((item) => (responses.environment[item.id] ?? 0) >= 1).length >= 8;
  const reflectionsComplete = CTDM_REFLECTIVE_QUESTIONS.every((question) => (responses.reflections[question.id] ?? "").trim().length >= 3);
  return { behaviouralComplete, scenariosComplete, environmentComplete, reflectionsComplete, complete: behaviouralComplete && scenariosComplete && environmentComplete && reflectionsComplete };
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function aggregateReports(scoreSnapshots: Record<string, unknown>[]) {
  const dimensionAverages = Object.fromEntries(
    CTDM_DIMENSIONS.map((dimension) => {
      const values = scoreSnapshots
        .map((snapshot) => (snapshot.dimensionScores as Record<string, unknown> | undefined)?.[dimension.id])
        .filter((value): value is number => typeof value === "number");
      return [dimension.id, average(values)];
    }),
  );
  const valuesFor = (field: string) => scoreSnapshots.map((snapshot) => snapshot[field]).filter((value): value is number => typeof value === "number");
  const calibration = scoreSnapshots.reduce<Record<string, number>>((result, snapshot) => {
    const label = (snapshot.calibration as { label?: string } | undefined)?.label;
    if (label) result[label] = (result[label] ?? 0) + 1;
    return result;
  }, {});
  const ranked = Object.entries(dimensionAverages).filter((entry): entry is [string, number] => typeof entry[1] === "number").sort(([, left], [, right]) => right - left);
  return {
    participantCount: scoreSnapshots.length,
    dimensionAverages,
    averageBehaviouralScore: average(valuesFor("behaviouralScore")),
    averageAppliedJudgmentScore: average(valuesFor("appliedJudgmentScore")),
    averageEnvironmentScore: average(valuesFor("environmentScore")),
    averageBiasManagementScore: average(valuesFor("biasManagementScore")),
    averageIntellectualHabitsScore: average(valuesFor("intellectualHabitsScore")),
    calibration,
    sharedStrengths: ranked.slice(0, 2).map(([id]) => id),
    sharedPriorities: ranked.slice(-2).reverse().map(([id]) => id),
  };
}

function assertPlatformAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Platform administrator access is required." });
}

export const criticalThinkingRouter = router({
  getInstrument: protectedProcedure.query(() => ({
    responseScale: CTDM_RESPONSE_SCALE,
    environmentScale: CTDM_ENVIRONMENT_SCALE,
    dimensions: CTDM_DIMENSIONS.map(({ id, label, definition }) => ({ id, label, definition })),
    behaviourItems: CTDM_BEHAVIOUR_ITEMS.map(({ id, dimensionId, wording }) => ({ id, dimensionId, wording })),
    scenarios: CTDM_SCENARIOS.map(({ id, title, context, text, dimensions, embeddedRisks, reversibility, delayCost, options }) => ({
      id, title, context, text, dimensions, embeddedRisks, reversibility, delayCost,
      options: options.map(({ id: optionId, label }) => ({ id: optionId, label })),
    })),
    environmentItems: CTDM_ENVIRONMENT_ITEMS,
    reflectiveQuestions: CTDM_REFLECTIVE_QUESTIONS,
    disclaimer: CTDM_GOVERNANCE.prohibitedUse,
  })),

  myCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({ campaign: ctdmCampaigns, participant: ctdmParticipants, assessment: ctdmAssessments, report: ctdmReports })
      .from(ctdmParticipants)
      .innerJoin(ctdmCampaigns, eq(ctdmParticipants.campaignId, ctdmCampaigns.id))
      .leftJoin(ctdmAssessments, eq(ctdmAssessments.participantId, ctdmParticipants.id))
      .leftJoin(ctdmReports, eq(ctdmReports.assessmentId, ctdmAssessments.id))
      .where(and(eq(ctdmParticipants.userId, ctx.user.id), eq(ctdmParticipants.tenantId, ctdmCampaigns.tenantId)))
      .orderBy(desc(ctdmCampaigns.createdAt));
  }),

  start: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive(), participantRole: z.string().trim().max(255).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const membership = await getTenantMembership(db, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Join the organisation before starting this diagnostic." });
      const campaign = await getOwnedCampaign(db, input.campaignId, membership.tenantId);
      if (campaign.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "This diagnostic campaign is not currently active." });

      const candidates = await db.select().from(ctdmParticipants).where(and(eq(ctdmParticipants.campaignId, campaign.id), eq(ctdmParticipants.tenantId, membership.tenantId)));
      let participant = candidates.find((candidate) => candidate.userId === ctx.user.id || (!candidate.userId && !!ctx.user.email && candidate.email?.toLowerCase() === ctx.user.email.toLowerCase()));
      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "You have not been enrolled in this diagnostic campaign." });
      if (participant.status === "withdrawn") throw new TRPCError({ code: "FORBIDDEN", message: "Your participation in this campaign has been withdrawn." });
      if (participant.userId !== ctx.user.id || participant.status === "invited") {
        await db.update(ctdmParticipants).set({ userId: ctx.user.id, status: participant.status === "completed" ? "completed" : "in_progress", consentAt: participant.consentAt ?? new Date(), participantRole: input.participantRole ?? participant.participantRole }).where(eq(ctdmParticipants.id, participant.id));
        participant = { ...participant, userId: ctx.user.id, status: participant.status === "completed" ? "completed" : "in_progress" };
      }
      const existing = await db.select().from(ctdmAssessments).where(eq(ctdmAssessments.participantId, participant.id)).limit(1);
      if (existing[0]) return { assessment: existing[0], campaign };
      const [created] = await db.insert(ctdmAssessments).values({ campaignId: campaign.id, tenantId: membership.tenantId, participantId: participant.id, userId: ctx.user.id, status: "in_progress", currentSection: "behaviour", behaviourResponses: {}, scenarioResponses: {}, environmentResponses: {}, reflections: {} }).$returningId();
      const assessment = (await db.select().from(ctdmAssessments).where(eq(ctdmAssessments.id, created.id)).limit(1))[0];
      return { assessment, campaign };
    }),

  saveProgress: protectedProcedure.input(progressInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(ctdmAssessments).where(and(eq(ctdmAssessments.id, input.assessmentId), eq(ctdmAssessments.userId, ctx.user.id))).limit(1);
    const assessment = rows[0];
    if (!assessment) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot update this diagnostic." });
    if (assessment.status !== "in_progress") throw new TRPCError({ code: "CONFLICT", message: "This diagnostic is no longer open for changes." });
    await db.update(ctdmAssessments).set({ currentSection: input.currentSection, behaviourResponses: input.behaviourResponses, scenarioResponses: input.scenarioResponses, environmentResponses: input.environmentResponses, reflections: input.reflections }).where(eq(ctdmAssessments.id, assessment.id));
    return { saved: true };
  }),

  submit: protectedProcedure.input(progressInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(ctdmAssessments).where(and(eq(ctdmAssessments.id, input.assessmentId), eq(ctdmAssessments.userId, ctx.user.id))).limit(1);
    const assessment = rows[0];
    if (!assessment) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot submit this diagnostic." });
    if (assessment.status !== "in_progress") throw new TRPCError({ code: "CONFLICT", message: "This diagnostic has already been completed or closed." });
    const responses: CtdmAssessmentResponses = { behaviour: input.behaviourResponses, scenarios: input.scenarioResponses, environment: input.environmentResponses, reflections: input.reflections };
    const completion = isSubmissionComplete(responses);
    if (!completion.complete) throw new TRPCError({ code: "BAD_REQUEST", message: "Complete each section before submitting. At least three behavioural observations are required per core dimension, all scenarios, eight environment observations, and all three reflections." });
    const scores = scoreCriticalThinkingDiagnostic(responses);
    const completedAt = new Date();
    await db.update(ctdmAssessments).set({ status: "completed", currentSection: "complete", behaviourResponses: input.behaviourResponses, scenarioResponses: input.scenarioResponses, environmentResponses: input.environmentResponses, reflections: input.reflections, completedAt }).where(eq(ctdmAssessments.id, assessment.id));
    await db.update(ctdmParticipants).set({ status: "completed", completedAt }).where(eq(ctdmParticipants.id, assessment.participantId));
    const [report] = await db.insert(ctdmReports).values({ campaignId: assessment.campaignId, tenantId: assessment.tenantId, participantId: assessment.participantId, assessmentId: assessment.id, userId: ctx.user.id, scoreSnapshot: scores }).$returningId();
    return { reportId: report.id, scores };
  }),

  getMyReport: protectedProcedure.input(z.object({ reportId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select({ report: ctdmReports, campaign: ctdmCampaigns, assessment: ctdmAssessments }).from(ctdmReports).innerJoin(ctdmCampaigns, eq(ctdmReports.campaignId, ctdmCampaigns.id)).innerJoin(ctdmAssessments, eq(ctdmReports.assessmentId, ctdmAssessments.id)).where(and(eq(ctdmReports.id, input.reportId), eq(ctdmReports.userId, ctx.user.id))).limit(1);
    const row = rows[0];
    if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access this report." });
    return { ...row, participantReportSpec: CTDM_PARTICIPANT_REPORT_SPEC, governance: CTDM_GOVERNANCE, dimensions: CTDM_DIMENSIONS };
  }),

  myReportHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ report: ctdmReports, campaign: ctdmCampaigns })
      .from(ctdmReports)
      .innerJoin(ctdmCampaigns, eq(ctdmReports.campaignId, ctdmCampaigns.id))
      .where(eq(ctdmReports.userId, ctx.user.id))
      .orderBy(desc(ctdmReports.createdAt));
    return rows.map(({ report, campaign }) => ({
      id: report.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      reportingGroup: campaign.reportingGroup,
      completedAt: report.createdAt,
      scoreSnapshot: report.scoreSnapshot,
    }));
  }),

  adminCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { membership: null, campaigns: [] };
    const membership = await assertTenantAdmin(db, ctx.user.id);
    const campaigns = await db.select().from(ctdmCampaigns).where(eq(ctdmCampaigns.tenantId, membership.tenantId)).orderBy(desc(ctdmCampaigns.createdAt));
    const campaignCounts = await Promise.all(campaigns.map(async (campaign) => {
      const participants = await db.select({ id: ctdmParticipants.id, status: ctdmParticipants.status }).from(ctdmParticipants).where(eq(ctdmParticipants.campaignId, campaign.id));
      return { ...campaign, participantCount: participants.length, completedCount: participants.filter((participant) => participant.status === "completed").length };
    }));
    return { membership, campaigns: campaignCounts };
  }),

  createCampaign: protectedProcedure.input(campaignInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const membership = await assertTenantAdmin(db, ctx.user.id);
    const [created] = await db.insert(ctdmCampaigns).values({ tenantId: membership.tenantId, name: input.name, reportingGroup: input.reportingGroup, targetAudience: input.targetAudience, targetRoles: input.targetRoles, industryContext: input.industryContext, geographicContext: input.geographicContext, intendedUse: input.intendedUse, administrationFormat: input.administrationFormat ?? "online", readingLevel: input.readingLevel ?? "professional workplace English", reportingMode: input.reportingMode ?? "both", minTeamSize: input.minTeamSize ?? 5, namedReportAccess: input.namedReportAccess ?? false, consentStatement: input.consentStatement, retentionDays: input.retentionDays ?? 365, status: input.status ?? "draft", startsAt: input.startsAt ?? null, closesAt: input.closesAt ?? null, createdByUserId: ctx.user.id }).$returningId();
    await recordAudit(db, membership.tenantId, ctx.user.id, "campaign_created", "campaign", created.id, { status: input.status ?? "draft" });
    return { campaignId: created.id };
  }),

  updateCampaign: protectedProcedure.input(campaignInput.partial().extend({ campaignId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const membership = await assertTenantAdmin(db, ctx.user.id);
    await getOwnedCampaign(db, input.campaignId, membership.tenantId);
    const { campaignId, ...updates } = input;
    await db.update(ctdmCampaigns).set(updates).where(and(eq(ctdmCampaigns.id, campaignId), eq(ctdmCampaigns.tenantId, membership.tenantId)));
    await recordAudit(db, membership.tenantId, ctx.user.id, "campaign_updated", "campaign", campaignId, { fields: Object.keys(updates) });
    return { updated: true };
  }),

  addParticipant: protectedProcedure.input(z.object({ campaignId: z.number().int().positive(), email: z.string().trim().email(), displayName: z.string().trim().max(255).optional(), participantRole: z.string().trim().max(255).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const membership = await assertTenantAdmin(db, ctx.user.id);
    await getOwnedCampaign(db, input.campaignId, membership.tenantId);
    const matchedUser = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.email, input.email)).limit(1);
    const [created] = await db.insert(ctdmParticipants).values({ campaignId: input.campaignId, tenantId: membership.tenantId, userId: matchedUser[0]?.id ?? null, email: input.email.toLowerCase(), displayName: input.displayName ?? matchedUser[0]?.name ?? null, participantRole: input.participantRole ?? null, status: "invited" }).$returningId();
    await recordAudit(db, membership.tenantId, ctx.user.id, "participant_added", "participant", created.id, { campaignId: input.campaignId });
    return { participantId: created.id };
  }),

  campaignDashboard: protectedProcedure.input(z.object({ campaignId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const membership = await assertTenantAdmin(db, ctx.user.id);
    const campaign = await getOwnedCampaign(db, input.campaignId, membership.tenantId);
    const participants = await db.select().from(ctdmParticipants).where(and(eq(ctdmParticipants.campaignId, campaign.id), eq(ctdmParticipants.tenantId, membership.tenantId))).orderBy(desc(ctdmParticipants.updatedAt));
    const reports = await db.select().from(ctdmReports).where(and(eq(ctdmReports.campaignId, campaign.id), eq(ctdmReports.tenantId, membership.tenantId)));
    const reportByParticipant = new Map(reports.map((report) => [report.participantId, report]));
    const aggregateEligible = canShowCriticalThinkingTeamReport(reports.length, campaign.minTeamSize);
    const aggregate = aggregateEligible ? aggregateReports(reports.map((report) => report.scoreSnapshot)) : null;
    return {
      campaign,
      participantSummary: participants.map((participant) => {
        const report = reportByParticipant.get(participant.id);
        const result = campaign.namedReportAccess && report ? report.scoreSnapshot : null;
        return { id: participant.id, displayName: participant.displayName, email: participant.email, participantRole: participant.participantRole, status: participant.status, invitedAt: participant.invitedAt, completedAt: participant.completedAt, reportId: campaign.namedReportAccess ? report?.id ?? null : null, behaviouralScore: campaign.namedReportAccess ? (result as Record<string, unknown> | null)?.behaviouralScore ?? null : null };
      }),
      aggregateEligible,
      remainingForTeamReport: Math.max(0, campaign.minTeamSize - reports.length),
      aggregate,
      teamReportSpec: CTDM_TEAM_REPORT_SPEC,
    };
  }),

  platformCampaigns: protectedProcedure.query(async ({ ctx }) => {
    assertPlatformAdmin(ctx.user.role);
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ campaign: ctdmCampaigns, tenant: tenants })
      .from(ctdmCampaigns)
      .innerJoin(tenants, eq(ctdmCampaigns.tenantId, tenants.id))
      .orderBy(desc(ctdmCampaigns.createdAt));
    return Promise.all(rows.map(async ({ campaign, tenant }) => {
      const participantRows = await db.select({ status: ctdmParticipants.status }).from(ctdmParticipants).where(eq(ctdmParticipants.campaignId, campaign.id));
      return {
        campaign,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        participantCount: participantRows.length,
        completedCount: participantRows.filter((participant) => participant.status === "completed").length,
      };
    }));
  }),

  platformSetCampaignStatus: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive(), status: z.enum(["draft", "active", "closed", "archived"]) }))
    .mutation(async ({ ctx, input }) => {
      assertPlatformAdmin(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(ctdmCampaigns).where(eq(ctdmCampaigns.id, input.campaignId)).limit(1);
      const campaign = rows[0];
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Diagnostic campaign not found." });
      await db.update(ctdmCampaigns).set({ status: input.status }).where(eq(ctdmCampaigns.id, campaign.id));
      await recordAudit(db, campaign.tenantId, ctx.user.id, "platform_campaign_status_updated", "campaign", campaign.id, { status: input.status });
      return { updated: true };
    }),

  getMethodology: protectedProcedure.query(() => ({ governance: CTDM_GOVERNANCE, participantReport: CTDM_PARTICIPANT_REPORT_SPEC, teamReport: CTDM_TEAM_REPORT_SPEC, dimensions: CTDM_DIMENSIONS })),
});
