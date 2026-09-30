import { router, adminProcedure } from "../_core/trpc";
import { getIntelligenceFabricStatus, runIntelligenceDecision } from "../intelligenceFabric";
import { intelligenceDecisionRequestSchema } from "../../shared/modules/intelligenceFabric";

export const intelligenceFabricRouter = router({
  status: adminProcedure.query(() => getIntelligenceFabricStatus()),
  runDecision: adminProcedure
    .input(intelligenceDecisionRequestSchema)
    .mutation(({ ctx, input }) => runIntelligenceDecision(input, ctx.user.id)),
});
