/**
 * LevelNext Narrative Intelligence™ — tRPC Router
 *
 * Exposes participant endpoints for:
 * - Dashboard & command center payload
 * - Profile and role transition selection
 * - 4-week structured experience:
 *     Week 1: Notice (hypothesis generation & resonance)
 *     Week 2: Question (fact vs story vs prediction & narrative tax)
 *     Week 3: Choose (Next Chapter transition & commitments)
 *     Week 4: Test (behavioral experiment creation & outcome reflection)
 *     Weeks 5+: Prove (evidence ledger)
 * - 90-Second Narrative Reset protocol
 * - Selective sharing permissions (participant-controlled)
 * - Static libraries (role transitions, lenses, pattern library)
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router, successPartnerProcedure } from "../_core/trpc";
import {
  CURATED_ROLE_TRANSITIONS,
  NARRATIVE_LENSES,
  NARRATIVE_PATTERN_LIBRARY,
  participantResonanceSchema,
  narrativeStatusSchema,
  questionWorkspaceSchema,
  chooseNextChapterSchema,
  createExperimentSchema,
  recordOutcomeSchema,
  logEvidenceSchema,
  narrativeResetSchema,
  sharingGrantSchema,
} from "../../shared/modules/narrativeIntelligence";
import {
  getOrCreateOperatingProfile,
  generateHypothesesForParticipant,
  recordHypothesisResponse,
  saveQuestionAnalysis,
  chooseNextChapter,
  createExperiment,
  recordExperimentOutcome,
  logEvidence,
  runNarrativeReset,
  getDashboardPayload,
  saveSharingGrant,
  getSuccessPartnerSharedView,
  generateSuccessPartnerInquiryQuestions,
  getParticipantPrivacyActivity,
  getSuccessPartnerCohortConsentOverview,
} from "../narrativeIntelligence";
import { getDb } from "../db";
import { niNarratives, niOperatingProfiles, niExperiments, niEvidence, niSharingGrants } from "../../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";

export const narrativeIntelligenceRouter = router({
  // ── Public / Static Reference Endpoints ─────────────────────────────────────

  getCuratedRoleTransitions: publicProcedure.query(() => {
    return CURATED_ROLE_TRANSITIONS;
  }),

  getPatternLibrary: publicProcedure.query(() => {
    return NARRATIVE_PATTERN_LIBRARY;
  }),

  getCapabilityLenses: publicProcedure.query(() => {
    return NARRATIVE_LENSES;
  }),

  // ── Protected Participant Endpoints ─────────────────────────────────────────

  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardPayload(ctx.user.id);
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateOperatingProfile(ctx.user.id);
  }),

  getNarratives: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(niNarratives)
      .where(eq(niNarratives.userId, ctx.user.id))
      .orderBy(desc(niNarratives.isHighPriority), desc(niNarratives.createdAt));
  }),

  generateHypotheses: protectedProcedure
    .input(
      z
        .object({
          sourceModule: z.string().default("mep"),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      return generateHypothesesForParticipant(ctx.user.id, null, input?.sourceModule ?? "mep");
    }),

  respondToHypothesis: protectedProcedure
    .input(
      z.object({
        narrativeId: z.number().int().positive(),
        resonance: participantResonanceSchema,
        editedStatement: z.string().trim().min(5).max(500).optional(),
        reflectionNote: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return recordHypothesisResponse(
        ctx.user.id,
        input.narrativeId,
        input.resonance,
        input.editedStatement,
        input.reflectionNote
      );
    }),

  updateNarrativeStatus: protectedProcedure
    .input(
      z.object({
        narrativeId: z.number().int().positive(),
        status: narrativeStatusSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      await db
        .update(niNarratives)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(niNarratives.id, input.narrativeId), eq(niNarratives.userId, ctx.user.id)));
      const [updated] = await db.select().from(niNarratives).where(eq(niNarratives.id, input.narrativeId));
      return updated;
    }),

  saveQuestionAnalysis: protectedProcedure
    .input(questionWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      return saveQuestionAnalysis(ctx.user.id, input);
    }),

  chooseNextChapter: protectedProcedure
    .input(chooseNextChapterSchema)
    .mutation(async ({ ctx, input }) => {
      return chooseNextChapter(ctx.user.id, input);
    }),

  createExperiment: protectedProcedure
    .input(createExperimentSchema)
    .mutation(async ({ ctx, input }) => {
      return createExperiment(ctx.user.id, input);
    }),

  recordExperimentOutcome: protectedProcedure
    .input(recordOutcomeSchema)
    .mutation(async ({ ctx, input }) => {
      return recordExperimentOutcome(ctx.user.id, input);
    }),

  logEvidence: protectedProcedure
    .input(logEvidenceSchema)
    .mutation(async ({ ctx, input }) => {
      return logEvidence(ctx.user.id, input);
    }),

  runNarrativeReset: protectedProcedure
    .input(narrativeResetSchema)
    .mutation(async ({ ctx, input }) => {
      return runNarrativeReset(ctx.user.id, null, input);
    }),

  getEvidenceLedger: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(niEvidence)
      .where(eq(niEvidence.userId, ctx.user.id))
      .orderBy(desc(niEvidence.createdAt));
  }),

  saveSharingGrant: protectedProcedure
    .input(sharingGrantSchema)
    .mutation(async ({ ctx, input }) => {
      return saveSharingGrant(ctx.user.id, null, input);
    }),

  getSharingGrants: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(niSharingGrants)
      .where(eq(niSharingGrants.userId, ctx.user.id))
      .orderBy(desc(niSharingGrants.updatedAt));
  }),

  /**
   * Success Partner-only, participant-consented summary. The service enforces
   * both active assignment and an active participant sharing grant.
   */
  getSuccessPartnerSharedView: successPartnerProcedure
    .input(z.object({ participantUserId: z.number().int().positive() }))
    .query(({ ctx, input }) => getSuccessPartnerSharedView(ctx.user.id, input.participantUserId)),

  generateSuccessPartnerInquiryQuestions: successPartnerProcedure
    .input(z.object({ participantUserId: z.number().int().positive(), focus: z.string().trim().max(240).optional() }))
    .mutation(({ ctx, input }) => generateSuccessPartnerInquiryQuestions(ctx.user.id, input.participantUserId, input.focus)),

  getPrivacyActivity: protectedProcedure.query(({ ctx }) => getParticipantPrivacyActivity(ctx.user.id)),

  getSuccessPartnerCohortConsentOverview: successPartnerProcedure.query(({ ctx }) =>
    getSuccessPartnerCohortConsentOverview(ctx.user.id, ctx.user.role),
  ),
});
