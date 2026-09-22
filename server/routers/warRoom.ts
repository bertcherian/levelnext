import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  assessWarRoomEvidenceService,
  approveWarRoomOrderService,
  closeWarRoomReviewService,
  createWarRoomCampaignService,
  createWarRoomEvidenceService,
  getWarRoomCommandCenter,
  recordWarRoomDecisionService,
  upsertWarRoomConstraintService,
} from "../warRoomService";
import {
  warRoomAssessmentInputSchema,
  warRoomCampaignInputSchema,
  warRoomConstraintInputSchema,
  warRoomDecisionInputSchema,
  warRoomEvidenceInputSchema,
  warRoomOrderInputSchema,
  warRoomReviewInputSchema,
} from "../../shared/modules/warRoom";
import { getDb } from "../db";
import { tenants, users } from "../../drizzle/schema";

export const warRoomRouter = router({
  commandCenter: adminProcedure
    .input(z.object({ tenantId: z.number().int().positive().nullable().optional() }).optional())
    .query(async ({ input }) => {
      return getWarRoomCommandCenter(input?.tenantId ?? null);
    }),

  listOrganisations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: tenants.id, name: tenants.name }).from(tenants).orderBy(tenants.name);
  }),

  listEligibleOwners: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .orderBy(users.name);
  }),

  createCampaign: adminProcedure
    .input(warRoomCampaignInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createWarRoomCampaignService(ctx.user.id, input);
    }),

  createEvidence: adminProcedure
    .input(warRoomEvidenceInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createWarRoomEvidenceService(ctx.user.id, input);
    }),

  assessEvidence: adminProcedure
    .input(warRoomAssessmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      return assessWarRoomEvidenceService(ctx.user.id, input);
    }),

  upsertConstraint: adminProcedure
    .input(warRoomConstraintInputSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertWarRoomConstraintService(ctx.user.id, input);
    }),

  recordDecision: adminProcedure
    .input(warRoomDecisionInputSchema)
    .mutation(async ({ ctx, input }) => {
      return recordWarRoomDecisionService(ctx.user.id, input);
    }),

  approveOrder: adminProcedure
    .input(warRoomOrderInputSchema)
    .mutation(async ({ ctx, input }) => {
      return approveWarRoomOrderService(ctx.user.id, input);
    }),

  closeReview: adminProcedure
    .input(warRoomReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      return closeWarRoomReviewService(ctx.user.id, input);
    }),
});
