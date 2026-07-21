import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { tenantRouter } from "./routers/tenant";
import { assessmentRouter } from "./routers/assessment";
import { pdfReportRouter } from "./routers/pdfReport";
import { reportRouter } from "./routers/report";
import { guideRouter } from "./routers/guide";
import { leadershipGraphRouter } from "./routers/leadershipGraph";
import { missionRouter } from "./routers/mission";
import { practiceRouter } from "./routers/practice";
import { leadershipCoachRouter } from "./routers/leadershipCoach";
import { unlockRouter } from "./routers/unlock";
import { eciImportRouter } from "./routers/eciImport";
import { chatgptImportRouter } from "./routers/chatgptImport";
import { priorAssessmentImportRouter } from "./routers/priorAssessmentImport";
import { enterpriseOnboardingRouter } from "./routers/enterpriseOnboarding";
import { pilotApplicationRouter } from "./routers/pilotApplication";
import { platformInvitesRouter } from "./routers/platformInvites";
import { adminStatsRouter } from "./routers/adminStats";
import { momentumPartnerRouter } from "./routers/momentumPartner";
import { cpiReportRouter } from "./routers/cpiReport";
import { ciReportRouter } from "./routers/ciReport";
import { niiReportRouter } from "./routers/niiReport";
import { productsRouter } from "./routers/products";
import { emailAuthRouter } from "./routers/emailAuth";
import { liReportRouter } from "./routers/liReport";
import { leadsRouter } from "./routers/leads";
import { playbookRouter } from "./routers/playbookRouter";
import { careerAccessRouter } from "./routers/careerAccess";
import { outreachEngineRouter } from "./routers/outreachEngine";
import { mepRouter } from "./routers/mep";
import { radarSignalsRouter } from "./routers/radarSignals";
import { interviewPrepRouter } from "./routers/interviewPrep";
import { negotiationRouter } from "./routers/negotiation";
import { orgIntelligenceRouter } from "./routers/orgIntelligence";
import { coachRouter } from "./routers/coach";
import { adminCoachRouter } from "./routers/adminCoach";
import { nextChapterRouter } from "./routers/nextChapter";

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
  pdfReport: pdfReportRouter,
  report: reportRouter,
  guide: guideRouter,
  leadershipGraph: leadershipGraphRouter,
  mission: missionRouter,
  practice: practiceRouter,
  leadershipCoach: leadershipCoachRouter,
  unlock: unlockRouter,
  eciImport: eciImportRouter,
  chatgptImport: chatgptImportRouter,
  priorAssessmentImport: priorAssessmentImportRouter,
  enterpriseOnboarding: enterpriseOnboardingRouter,
  pilotApplication: pilotApplicationRouter,
  platformInvites: platformInvitesRouter,
  adminStats: adminStatsRouter,
  momentumPartner: momentumPartnerRouter,
  cpiReport: cpiReportRouter,
  ciReport: ciReportRouter,
  niiReport: niiReportRouter,
  products: productsRouter,
  emailAuth: emailAuthRouter,
  liReport: liReportRouter,
  leads: leadsRouter,
  playbook: playbookRouter,
  careerAccess: careerAccessRouter,
  outreachEngine: outreachEngineRouter,
  mep: mepRouter,
  radarSignals: radarSignalsRouter,
  interviewPrep: interviewPrepRouter,
  negotiation: negotiationRouter,
  orgIntelligence: orgIntelligenceRouter,
  coach: coachRouter,
  adminCoach: adminCoachRouter,
  nextChapter: nextChapterRouter,
});

export type AppRouter = typeof appRouter;
