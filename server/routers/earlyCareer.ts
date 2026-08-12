import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  earlyCareerCommitments,
  earlyCareerEvidence,
  earlyCareerManagerNudges,
  earlyCareerProfiles,
  tenantUsers,
  users,
} from "../../drizzle/schema";
import {
  EARLY_CAREER_CAPABILITIES,
  EARLY_CAREER_STAGES,
  getEarlyCareerManagerNudge,
  getEarlyCareerNextMove,
  getEarlyCareerStage,
  type EarlyCareerCapabilityId,
  type EarlyCareerStageId,
} from "../../shared/modules/earlyCareerData";

const stages = ["orient", "deliver", "connect", "navigate", "grow", "contribute", "accelerate"] as const;
const capabilities = [
  "ownership_reliability",
  "communication",
  "collaboration",
  "manager_partnership",
  "organisational_navigation",
  "learning_agility",
  "professional_judgment",
  "value_creation",
] as const;

const managerPrivacyBoundary =
  "This Manager Companion view uses manager-visible profile context and employee-shared commitments only. Private AI coaching, private reflections, raw diagnostic answers, and hidden employee labels are never included.";

async function getTenantIdForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [membership] = await db
    .select({ tenantId: tenantUsers.tenantId })
    .from(tenantUsers)
    .where(eq(tenantUsers.userId, userId))
    .limit(1);
  return membership?.tenantId ?? null;
}

function stageIdFrom(value: string | null | undefined): EarlyCareerStageId {
  return stages.includes(value as EarlyCareerStageId) ? (value as EarlyCareerStageId) : "orient";
}

export const earlyCareerRouter = router({
  getHome: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [profile] = await db
      .select()
      .from(earlyCareerProfiles)
      .where(eq(earlyCareerProfiles.userId, ctx.user.id))
      .limit(1);

    const stageId = stageIdFrom(profile?.journeyStage);
    const [commitments, evidence] = await Promise.all([
      db
        .select()
        .from(earlyCareerCommitments)
        .where(eq(earlyCareerCommitments.userId, ctx.user.id))
        .orderBy(desc(earlyCareerCommitments.createdAt))
        .limit(8),
      db
        .select()
        .from(earlyCareerEvidence)
        .where(eq(earlyCareerEvidence.userId, ctx.user.id))
        .orderBy(desc(earlyCareerEvidence.occurredAt))
        .limit(6),
    ]);

    return {
      profile: profile ?? null,
      journey: {
        stages: EARLY_CAREER_STAGES,
        currentStage: getEarlyCareerStage(stageId),
        currentStageId: stageId,
      },
      nextMove: getEarlyCareerNextMove(stageId),
      capabilities: EARLY_CAREER_CAPABILITIES,
      commitments,
      evidence,
      privacyMessage: "Private to you: your AI coaching conversations and reflections are not shared with your manager or HR.",
    };
  }),

  saveProfile: protectedProcedure
    .input(
      z.object({
        joiningDate: z.string().datetime().nullable().optional(),
        roleTitle: z.string().trim().max(255).nullable().optional(),
        functionName: z.string().trim().max(150).nullable().optional(),
        teamName: z.string().trim().max(150).nullable().optional(),
        journeyStage: z.enum(stages),
        privacyAcknowledged: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const tenantId = await getTenantIdForUser(ctx.user.id);
      const payload = {
        tenantId,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
        roleTitle: input.roleTitle ?? null,
        functionName: input.functionName ?? null,
        teamName: input.teamName ?? null,
        journeyStage: input.journeyStage,
        onboardingComplete: true,
        privacyAcknowledgedAt: input.privacyAcknowledged ? new Date() : null,
      };

      const [existing] = await db
        .select()
        .from(earlyCareerProfiles)
        .where(eq(earlyCareerProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db.update(earlyCareerProfiles).set(payload).where(eq(earlyCareerProfiles.id, existing.id));
        return { ...existing, ...payload };
      }

      const [created] = await db.insert(earlyCareerProfiles).values({ userId: ctx.user.id, ...payload }).$returningId();
      return { id: created.id, userId: ctx.user.id, ...payload };
    }),

  createCommitment: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(3).max(255),
        description: z.string().trim().max(1000).optional(),
        journeyStage: z.enum(stages),
        capabilityId: z.enum(capabilities),
        dueDate: z.string().datetime().nullable().optional(),
        sharingScope: z.enum(["private", "employee_and_manager"]).default("private"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const tenantId = await getTenantIdForUser(ctx.user.id);
      const [created] = await db
        .insert(earlyCareerCommitments)
        .values({
          userId: ctx.user.id,
          tenantId,
          createdByUserId: ctx.user.id,
          title: input.title,
          description: input.description ?? null,
          journeyStage: input.journeyStage,
          capabilityId: input.capabilityId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          sharingScope: input.sharingScope,
        })
        .$returningId();
      return { id: created.id };
    }),

  completeCommitment: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), outcome: z.string().trim().min(3).max(1500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [commitment] = await db
        .select()
        .from(earlyCareerCommitments)
        .where(and(eq(earlyCareerCommitments.id, input.id), eq(earlyCareerCommitments.userId, ctx.user.id)))
        .limit(1);
      if (!commitment) throw new TRPCError({ code: "NOT_FOUND", message: "Commitment not found" });
      await db
        .update(earlyCareerCommitments)
        .set({ status: "completed", outcome: input.outcome, completedAt: new Date() })
        .where(eq(earlyCareerCommitments.id, commitment.id));
      return { success: true };
    }),

  addEvidence: protectedProcedure
    .input(
      z.object({
        commitmentId: z.number().int().positive().nullable().optional(),
        capabilityId: z.enum(capabilities),
        evidenceType: z.enum(["self_report", "shared_commitment", "practice", "manager_confirmation"]),
        privacyScope: z.enum(["private", "employee_and_manager"]).default("private"),
        summary: z.string().trim().min(3).max(1500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      if (input.commitmentId) {
        const [commitment] = await db
          .select()
          .from(earlyCareerCommitments)
          .where(and(eq(earlyCareerCommitments.id, input.commitmentId), eq(earlyCareerCommitments.userId, ctx.user.id)))
          .limit(1);
        if (!commitment) throw new TRPCError({ code: "NOT_FOUND", message: "Commitment not found" });
      }
      const tenantId = await getTenantIdForUser(ctx.user.id);
      const [created] = await db
        .insert(earlyCareerEvidence)
        .values({
          userId: ctx.user.id,
          tenantId,
          commitmentId: input.commitmentId ?? null,
          capabilityId: input.capabilityId,
          evidenceType: input.evidenceType,
          privacyScope: input.privacyScope,
          summary: input.summary,
        })
        .$returningId();
      return { id: created.id };
    }),

  getManagerCompanion: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const employees = await db
      .select({
        profile: earlyCareerProfiles,
        employee: { id: users.id, name: users.name, email: users.email },
      })
      .from(earlyCareerProfiles)
      .innerJoin(users, eq(earlyCareerProfiles.userId, users.id))
      .where(eq(earlyCareerProfiles.managerUserId, ctx.user.id))
      .orderBy(desc(earlyCareerProfiles.updatedAt));

    const employeeIds = employees.map((item) => item.employee.id);
    const sharedCommitments = await Promise.all(
      employeeIds.map((employeeId) =>
        db
          .select()
          .from(earlyCareerCommitments)
          .where(
            and(
              eq(earlyCareerCommitments.userId, employeeId),
              eq(earlyCareerCommitments.sharingScope, "employee_and_manager")
            )
          )
          .orderBy(desc(earlyCareerCommitments.updatedAt))
          .limit(4)
      )
    );

    const nudges = await db
      .select()
      .from(earlyCareerManagerNudges)
      .where(eq(earlyCareerManagerNudges.managerUserId, ctx.user.id))
      .orderBy(desc(earlyCareerManagerNudges.createdAt))
      .limit(12);

    return {
      privacyBoundary: managerPrivacyBoundary,
      employees: employees.map((item, index) => ({
        ...item,
        stage: getEarlyCareerStage(stageIdFrom(item.profile.journeyStage)),
        suggestedNudge: getEarlyCareerManagerNudge(stageIdFrom(item.profile.journeyStage)),
        sharedCommitments: sharedCommitments[index] ?? [],
      })),
      nudges,
    };
  }),

  getManagerAssignmentDirectory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const ownerMemberships = await db
      .select({ tenantId: tenantUsers.tenantId })
      .from(tenantUsers)
      .where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.role, "owner")));
    const tenantIds = ctx.user.role === "admin"
      ? Array.from(new Set((await db.select({ tenantId: earlyCareerProfiles.tenantId }).from(earlyCareerProfiles)).map((row) => row.tenantId).filter((id): id is number => id !== null)))
      : ownerMemberships.map((membership) => membership.tenantId);

    if (tenantIds.length === 0) return { canManageAssignments: false, employees: [], managers: [] };

    const [employees, managers] = await Promise.all([
      db
        .select({
          profile: earlyCareerProfiles,
          employee: { id: users.id, name: users.name, email: users.email },
        })
        .from(earlyCareerProfiles)
        .innerJoin(users, eq(earlyCareerProfiles.userId, users.id))
        .where(inArray(earlyCareerProfiles.tenantId, tenantIds))
        .orderBy(desc(earlyCareerProfiles.updatedAt)),
      db
        .select({
          tenantId: tenantUsers.tenantId,
          user: { id: users.id, name: users.name, email: users.email },
        })
        .from(tenantUsers)
        .innerJoin(users, eq(tenantUsers.userId, users.id))
        .where(inArray(tenantUsers.tenantId, tenantIds)),
    ]);

    return { canManageAssignments: true, employees, managers };
  }),

  createManagerNudge: protectedProcedure
    .input(z.object({ employeeUserId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [profile] = await db
        .select()
        .from(earlyCareerProfiles)
        .where(and(eq(earlyCareerProfiles.userId, input.employeeUserId), eq(earlyCareerProfiles.managerUserId, ctx.user.id)))
        .limit(1);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned as this employee's manager." });
      const nudge = getEarlyCareerManagerNudge(stageIdFrom(profile.journeyStage));
      const [created] = await db
        .insert(earlyCareerManagerNudges)
        .values({
          managerUserId: ctx.user.id,
          employeeUserId: input.employeeUserId,
          tenantId: profile.tenantId,
          nudgeCode: nudge.code,
          title: nudge.title,
          rationale: nudge.rationale,
          conversationObjective: nudge.objective,
          suggestedQuestions: nudge.questions,
          privacyBoundary: nudge.privacyBoundary,
        })
        .$returningId();
      return { id: created.id, ...nudge };
    }),

  assignManager: protectedProcedure
    .input(z.object({ employeeUserId: z.number().int().positive(), managerUserId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [employeeProfile] = await db
        .select()
        .from(earlyCareerProfiles)
        .where(eq(earlyCareerProfiles.userId, input.employeeUserId))
        .limit(1);
      if (!employeeProfile?.tenantId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The employee must have an Early Career profile and tenant membership before manager assignment." });
      }

      if (ctx.user.role !== "admin") {
        const [requesterMembership] = await db
          .select()
          .from(tenantUsers)
          .where(and(eq(tenantUsers.userId, ctx.user.id), eq(tenantUsers.tenantId, employeeProfile.tenantId)))
          .limit(1);
        if (!requesterMembership || requesterMembership.role !== "owner") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only an organisation owner can assign a manager." });
        }
      }

      const [managerMembership] = await db
        .select()
        .from(tenantUsers)
        .where(and(eq(tenantUsers.userId, input.managerUserId), eq(tenantUsers.tenantId, employeeProfile.tenantId)))
        .limit(1);
      if (!managerMembership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The selected manager must belong to the same organisation." });
      }

      await db
        .update(earlyCareerProfiles)
        .set({ managerUserId: input.managerUserId })
        .where(eq(earlyCareerProfiles.id, employeeProfile.id));
      return { success: true };
    }),

  updateManagerNudgeStatus: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["accepted", "dismissed", "completed"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [nudge] = await db
        .select()
        .from(earlyCareerManagerNudges)
        .where(and(eq(earlyCareerManagerNudges.id, input.id), eq(earlyCareerManagerNudges.managerUserId, ctx.user.id)))
        .limit(1);
      if (!nudge) throw new TRPCError({ code: "NOT_FOUND", message: "Manager nudge not found" });
      await db
        .update(earlyCareerManagerNudges)
        .set({ status: input.status, completedAt: input.status === "completed" ? new Date() : null })
        .where(eq(earlyCareerManagerNudges.id, nudge.id));
      return { success: true };
    }),
});
