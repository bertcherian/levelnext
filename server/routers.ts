import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { tenantRouter } from "./routers/tenant";
import { assessmentRouter } from "./routers/assessment";
import { reportRouter } from "./routers/report";
import { guideRouter } from "./routers/guide";
import { leadershipGraphRouter } from "./routers/leadershipGraph";
import { missionRouter } from "./routers/mission";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  tenant: tenantRouter,
  assessment: assessmentRouter,
  report: reportRouter,
  guide: guideRouter,
  leadershipGraph: leadershipGraphRouter,
  mission: missionRouter,
});

export type AppRouter = typeof appRouter;
