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
import { successPartnerRouter } from "./routers/successPartner";
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
import { lsosRouter } from "./routers/lsos";
import { outplacementEnquiryRouter } from "./routers/outplacementEnquiry";
import { spAssignmentsRouter } from "./routers/spAssignments";
import { mepDocumentsRouter } from "./routers/mepDocuments";
import { orgContextRouter } from "./routers/orgContext";
import { participantImportRouter } from "./routers/participantImport";
import { resumeMakeoverRouter } from "./routers/resumeMakeover";
import { simulatorRouter } from "./routers/simulator";
import { launchProgressRouter } from "./routers/launchProgress";
import { launchDailyMissionsRouter } from "./routers/launchDailyMissions";
import { launchCareerCompassRouter } from "./routers/launchCareerCompass";
import { launchStoryBuilderRouter } from "./routers/launchStoryBuilder";
import { launchSkillSprintRouter } from "./routers/launchSkillSprint";
import { launchApplicationsRouter } from "./routers/launchApplications";
import { launchInterviewRouter } from "./routers/launchInterview";
import { launchNegotiationRouter } from "./routers/launchNegotiation";
import { launchRemindersRouter } from "./routers/launchReminders";
import { launchUserPreferencesRouter } from "./routers/launchUserPreferences";
import { launchLeaderboardRouter } from "./routers/launchLeaderboard";
import { launchMissionHistoryRouter } from "./routers/launchMissionHistory";
import { launchWeeklyChallengesRouter } from "./routers/launchWeeklyChallenges";
import { launchWeeklyRecapRouter } from "./routers/launchWeeklyRecap";
import { peiRouter } from "./routers/pei";
import { intelligenceCoreRouter } from "./routers/intelligenceCore";
import { earlyCareerRouter } from "./routers/earlyCareer";
import { executiveIntelligenceRouter } from "./routers/executiveIntelligence";
import { salesIntelligenceRouter } from "./routers/salesIntelligence";
import { modelEvaluationRouter } from "./routers/modelEvaluation";
import { aiSuggestionFeedbackRouter } from "./routers/aiSuggestionFeedback";
import { adminOperationsRouter } from "./routers/adminOperations";
import { criticalThinkingRouter } from "./routers/criticalThinking";
import { clientTelemetryRouter } from "./routers/clientTelemetry";
import { engineeringIntelligenceRouter } from "./routers/engineeringIntelligence";
import { engineeringAdminRouter } from "./routers/engineeringAdmin";
import { narrativeIntelligenceRouter } from "./routers/narrativeIntelligence";
import { behaviouralIntelligenceRouter } from "./routers/behaviouralIntelligence";
import { academyRouter } from "./routers/academy";
import { accountRouter } from "./routers/account";

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
  account: accountRouter,
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
  adminOperations: adminOperationsRouter,
  successPartner: successPartnerRouter,
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
  lsos: lsosRouter,
  outplacementEnquiry: outplacementEnquiryRouter,
  spAssignments: spAssignmentsRouter,
  mepDocuments: mepDocumentsRouter,
  orgContext: orgContextRouter,
  participantImport: participantImportRouter,
  resumeMakeover: resumeMakeoverRouter,
  simulator: simulatorRouter,
  launchProgress: launchProgressRouter,
  launchDailyMissions: launchDailyMissionsRouter,
  launchCareerCompass: launchCareerCompassRouter,
  launchStoryBuilder: launchStoryBuilderRouter,
  launchSkillSprint: launchSkillSprintRouter,
  launchApplications: launchApplicationsRouter,
  launchInterview: launchInterviewRouter,
  launchNegotiation: launchNegotiationRouter,
  launchReminders: launchRemindersRouter,
  launchUserPreferences: launchUserPreferencesRouter,
  launchLeaderboard: launchLeaderboardRouter,
  launchMissionHistory: launchMissionHistoryRouter,
  launchWeeklyChallenges: launchWeeklyChallengesRouter,
  launchWeeklyRecap: launchWeeklyRecapRouter,
  pei: peiRouter,
  intelligenceCore: intelligenceCoreRouter,
  earlyCareer: earlyCareerRouter,
  executiveIntelligence: executiveIntelligenceRouter,
  salesIntelligence: salesIntelligenceRouter,
  modelEvaluation: modelEvaluationRouter,
  aiSuggestionFeedback: aiSuggestionFeedbackRouter,
  criticalThinking: criticalThinkingRouter,
  clientTelemetry: clientTelemetryRouter,
  engineering: engineeringIntelligenceRouter,
  engineeringAdmin: engineeringAdminRouter,
  narrativeIntelligence: narrativeIntelligenceRouter,
  behaviouralIntelligence: behaviouralIntelligenceRouter,
  academy: academyRouter,
});

export type AppRouter = typeof appRouter;
