import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { COOKIE_NAME } from "../../shared/const";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createProofPilot,
  createProofQrLink,
  getProofSecurityFastPack,
  getProofCommunicationPack,
  getProofDay30,
  getProofNudgeSettings,
  getProofQrOverview,
  getProofPackPayload,
  getProofParticipant,
  getProofSecurityWorkspace,
  getProofLivePilotGovernance,
  getProofSponsorDashboard,
  createProofSecurityRequirement,
  deliverProofNudges,
  inviteProofParticipants,
  recordProofBaseline,
  recordProofDailyAction,
  recordProofObserverPulse,
  recordProofRealWork,
  recordProofRep,
  reportProofAccessIssue,
  recordProofTrustEvent,
  recordProofMobileEvent,
  recordProofParticipantConsent,
  resolveProofQrJoin,
  revokeProofQrLink,
  saveProofPersonalGoal,
  setProofNudgeEnabled,
  setProofNudgeTaskUid,
  uploadProofSecurityDocument,
  updateProofSecurityDocument,
  updateProofSecurityRequirement,
  recommendPilot,
  requestProofSecurityReview,
  recordProofSponsorConsent,
  saveProofBaselineMeasure,
  saveProofDay30Review,
  withdrawProofParticipantConsent,
  getProofSponsorNotifications,
  markProofSponsorNotificationRead,
} from "../behaviourChangeProof";
import {
  proofAccessIssueSchema,
  proofBaselineSchema,
  proofBaselineMeasureSchema,
  proofCreatePilotSchema,
  proofDailyActionSchema,
  proofDay30ReviewSchema,
  proofDocumentUpdateSchema,
  proofDocumentUploadSchema,
  proofInviteSchema,
  proofNudgeSettingsSchema,
  proofPilotIdSchema,
  proofObserverPulseSchema,
  proofParticipantProfileSchema,
  proofParticipantConsentSchema,
  proofPreviewSchema,
  proofQrResolveSchema,
  proofMobileEventSchema,
  proofRequirementSchema,
  proofRequirementUpdateSchema,
  proofRepSchema,
  proofRealWorkSchema,
  proofTrustEventSchema,
  proofSponsorConsentSchema,
  proofTokenSchema,
} from "../../shared/modules/behaviourChangeProof";

export const behaviourChangeProofRouter = router({
  previewPilot: publicProcedure.input(proofPreviewSchema).query(({ input }) => recommendPilot(input.problem)),

  createPilot: protectedProcedure.input(proofCreatePilotSchema).mutation(({ ctx, input }) => createProofPilot(ctx.user.id, input)),

  sponsorDashboard: protectedProcedure.input(z.object({ pilotId: z.number().int().positive().optional() }).optional()).query(async ({ ctx, input }) => {
    return getProofSponsorDashboard(ctx.user.id, input?.pilotId);
  }),
  livePilotGovernance: protectedProcedure.input(proofPilotIdSchema).query(({ ctx, input }) => getProofLivePilotGovernance(ctx.user.id, input.pilotId)),
  recordSponsorConsent: protectedProcedure.input(proofSponsorConsentSchema).mutation(({ ctx, input }) => recordProofSponsorConsent(ctx.user.id, input)),
  saveBaselineMeasure: protectedProcedure.input(proofBaselineMeasureSchema).mutation(({ ctx, input }) => saveProofBaselineMeasure(ctx.user.id, input)),
  saveDay30Review: protectedProcedure.input(proofDay30ReviewSchema).mutation(({ ctx, input }) => saveProofDay30Review(ctx.user.id, input)),
  sponsorNotifications: protectedProcedure.input(z.object({ pilotId: z.number().int().positive().optional() }).optional()).query(({ ctx, input }) => getProofSponsorNotifications(ctx.user.id, input?.pilotId)),
  markSponsorNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ ctx, input }) => markProofSponsorNotificationRead(ctx.user.id, input.notificationId)),

  inviteParticipants: protectedProcedure.input(proofInviteSchema).mutation(async ({ ctx, input }) => {
    const result = await inviteProofParticipants(ctx.user.id, input.pilotId, input.participants, input.origin);
    const settings = await getProofNudgeSettings(ctx.user.id, input.pilotId);
    if (!settings.scheduleCronTaskUid) {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
      const job = await createHeartbeatJob({ name: `proof-nudges-${ctx.user.id}-${input.pilotId}`, cron: "0 0 * * * *", path: "/api/scheduled/proofNudges", method: "POST", description: "30-Day Behaviour Change Proof sponsor and participant milestone nudges" }, sessionToken);
      await setProofNudgeTaskUid(ctx.user.id, input.pilotId, job.taskUid);
    }
    return result;
  }),

  day30Proof: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(async ({ ctx, input }) => getProofDay30(ctx.user.id, input.pilotId)),
  proofPack: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(({ ctx, input }) => getProofPackPayload(ctx.user.id, input.pilotId)),
  communicationPack: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(({ ctx, input }) => getProofCommunicationPack(ctx.user.id, input.pilotId)),
  qrOverview: protectedProcedure.input(z.object({ pilotId: z.number().int().positive(), origin: z.string().url() })).query(({ ctx, input }) => getProofQrOverview(ctx.user.id, input.pilotId, input.origin)),
  rotateQr: protectedProcedure.input(proofPilotIdSchema).mutation(({ ctx, input }) => createProofQrLink(ctx.user.id, input.pilotId, true)),
  revokeQr: protectedProcedure.input(proofPilotIdSchema).mutation(({ ctx, input }) => revokeProofQrLink(ctx.user.id, input.pilotId)),
  securityFastPack: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(({ ctx, input }) => getProofSecurityFastPack(ctx.user.id, input.pilotId)),
  securityWorkspace: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(({ ctx, input }) => getProofSecurityWorkspace(ctx.user.id, input.pilotId)),
  requestSecurityReview: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).mutation(({ ctx, input }) => requestProofSecurityReview(ctx.user.id, input.pilotId)),
  uploadSecurityDocument: protectedProcedure.input(proofDocumentUploadSchema).mutation(({ ctx, input }) => uploadProofSecurityDocument(ctx.user.id, input)),
  updateSecurityDocument: protectedProcedure.input(proofDocumentUpdateSchema).mutation(({ ctx, input }) => updateProofSecurityDocument(ctx.user.id, input)),
  createSecurityRequirement: protectedProcedure.input(proofRequirementSchema).mutation(({ ctx, input }) => createProofSecurityRequirement(ctx.user.id, input)),
  updateSecurityRequirement: protectedProcedure.input(proofRequirementUpdateSchema).mutation(({ ctx, input }) => updateProofSecurityRequirement(ctx.user.id, input)),
  nudgeSettings: protectedProcedure.input(z.object({ pilotId: z.number().int().positive() })).query(({ ctx, input }) => getProofNudgeSettings(ctx.user.id, input.pilotId)),
  saveNudgeSettings: protectedProcedure.input(proofNudgeSettingsSchema).mutation(async ({ ctx, input }) => {
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    const current = await getProofNudgeSettings(ctx.user.id, input.pilotId);
    let taskUid = current.scheduleCronTaskUid;
    const cron = "0 0 * * * *";
    const description = "30-Day Behaviour Change Proof sponsor and participant milestone nudges";
    if (taskUid) await updateHeartbeatJob(taskUid, { cron, path: "/api/scheduled/proofNudges", method: "POST", description, enable: input.enabled }, sessionToken);
    else {
      const job = await createHeartbeatJob({ name: `proof-nudges-${ctx.user.id}-${input.pilotId}`, cron, path: "/api/scheduled/proofNudges", method: "POST", description }, sessionToken);
      taskUid = job.taskUid;
      if (!input.enabled) await updateHeartbeatJob(taskUid, { enable: false }, sessionToken);
      await setProofNudgeTaskUid(ctx.user.id, input.pilotId, taskUid);
    }
    await setProofNudgeEnabled(ctx.user.id, input.pilotId, input.enabled);
    return { pilotId: input.pilotId, enabled: input.enabled, scheduleCronTaskUid: taskUid };
  }),

  participant: publicProcedure.input(proofTokenSchema).query(({ input }) => getProofParticipant(input.token)),
  resolveQrJoin: publicProcedure.input(proofQrResolveSchema).mutation(({ input }) => resolveProofQrJoin(input.token, input.email, input.isMobile)),
  recordMobileEvent: publicProcedure.input(proofMobileEventSchema).mutation(({ input }) => recordProofMobileEvent(input)),
  recordTrustEvent: publicProcedure.input(proofTrustEventSchema).mutation(({ input }) => recordProofTrustEvent(input.token, input.eventType, input.response, input.detail)),
  recordParticipantConsent: publicProcedure.input(proofParticipantConsentSchema).mutation(({ input }) => recordProofParticipantConsent(input.token)),
  withdrawParticipantConsent: publicProcedure.input(proofTokenSchema).mutation(({ input }) => withdrawProofParticipantConsent(input.token)),
  savePersonalGoal: publicProcedure.input(proofParticipantProfileSchema).mutation(({ input }) => saveProofPersonalGoal(input.token, input.personalGoal)),
  completeBaseline: publicProcedure.input(proofBaselineSchema).mutation(({ input }) => recordProofBaseline(input.token, input.currentSituation, input.desiredMovement)),
  completeRep: publicProcedure.input(proofRepSchema).mutation(({ input }) => recordProofRep(input.token, input.practiceRole)),
  recordRealWork: publicProcedure.input(proofRealWorkSchema).mutation(({ input }) => recordProofRealWork(input.token, input.situationType, input.actionTaken, input.outcomeSignal)),
  observerPulse: publicProcedure.input(proofObserverPulseSchema).mutation(({ input }) => recordProofObserverPulse(input.token, input.movement)),
  completeDailyAction: publicProcedure.input(proofDailyActionSchema).mutation(({ input }) => recordProofDailyAction(input.token, input.completed, input.barrier)),
  reportAccessIssue: publicProcedure.input(proofAccessIssueSchema).mutation(({ input }) => reportProofAccessIssue(input.token, input.issue)),
});
