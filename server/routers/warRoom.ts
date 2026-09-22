import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import {
  warRoomAssessmentInputSchema,
  warRoomCampaignInputSchema,
  warRoomConstraintInputSchema,
  warRoomDecisionInputSchema,
  warRoomEvidenceInputSchema,
  warRoomOrderInputSchema,
  warRoomProductKeySchema,
  warRoomReviewInputSchema,
  warRoomProducts,
} from "../../shared/modules/warRoom";
import {
  approveWarRoomOrderService,
  assessWarRoomEvidenceService,
  closeWarRoomReviewService,
  createWarRoomCampaignService,
  createWarRoomEvidenceService,
  getWarRoomCommandCenter,
  recordWarRoomDecisionService,
  upsertWarRoomConstraintService,
} from "../warRoomService";

export const warRoomRouter = router({
  listProducts: adminProcedure.query(() => warRoomProducts),

  commandCenter: adminProcedure
    .input(warRoomProductKeySchema)
    .query(async ({ input }) => getWarRoomCommandCenter(input)),

  listEligibleOwners: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).orderBy(users.name);
  }),

  createCampaign: adminProcedure.input(warRoomCampaignInputSchema).mutation(async ({ ctx, input }) => createWarRoomCampaignService(ctx.user.id, input)),
  createEvidence: adminProcedure.input(warRoomEvidenceInputSchema).mutation(async ({ ctx, input }) => createWarRoomEvidenceService(ctx.user.id, input)),
  assessEvidence: adminProcedure.input(warRoomAssessmentInputSchema).mutation(async ({ ctx, input }) => assessWarRoomEvidenceService(ctx.user.id, input)),
  upsertConstraint: adminProcedure.input(warRoomConstraintInputSchema).mutation(async ({ ctx, input }) => upsertWarRoomConstraintService(ctx.user.id, input)),
  recordDecision: adminProcedure.input(warRoomDecisionInputSchema).mutation(async ({ ctx, input }) => recordWarRoomDecisionService(ctx.user.id, input)),
  approveOrder: adminProcedure.input(warRoomOrderInputSchema).mutation(async ({ ctx, input }) => approveWarRoomOrderService(ctx.user.id, input)),
  closeReview: adminProcedure.input(warRoomReviewInputSchema).mutation(async ({ ctx, input }) => closeWarRoomReviewService(ctx.user.id, input)),
});
