import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  biEvidence,
  biMoments,
  personaBuilderCheckins,
  personaBuilderCommitments,
  personaBuilderEpisodes,
  personaBuilderJourneys,
  personaBuilderPatternSnapshots,
  personaBuilderPersonas,
  personaBuilderReps,
} from "../drizzle/schema";
import {
  PERSONA_CANDIDATE_FALLBACKS,
  PERSONA_PATTERN_FALLBACK,
  PERSONA_REP_FALLBACK,
  chooseFallbackIntervention,
  deriveNextPersonaAction,
  personaCandidateSchema,
  personaPatternSchema,
  personaRepContentSchema,
  type AddPersonaEpisodeInput,
  type PersonaCheckinInput,
  type StartPersonaJourneyInput,
} from "../shared/modules/personaBuilder";
import { createMomentService, recordEvidenceService } from "./behaviouralIntelligence";
import { getDb } from "./db";
import { invokeStructured } from "./structuredLlm";

const candidateBatchSchema = z.object({ candidates: z.array(personaCandidateSchema).length(3) });

async function getOwnedJourney(journeyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [journey] = await db
    .select()
    .from(personaBuilderJourneys)
    .where(and(eq(personaBuilderJourneys.id, journeyId), eq(personaBuilderJourneys.userId, userId)))
    .limit(1);
  if (!journey) throw new Error("Persona Builder journey not found or access denied.");
  return { db, journey };
}

function provenance(kind: "user_stated" | "user_confirmed", sourceType: string, sourceId?: number) {
  return { kind, sourceType, ...(sourceId ? { sourceId } : {}), createdAt: new Date().toISOString() };
}

export async function getPersonaBuilderHome(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [journey] = await db
    .select()
    .from(personaBuilderJourneys)
    .where(and(eq(personaBuilderJourneys.userId, userId), eq(personaBuilderJourneys.status, "active")))
    .orderBy(desc(personaBuilderJourneys.updatedAt))
    .limit(1);
  if (!journey) return { journey: null };

  const [moment] = await db.select().from(biMoments).where(eq(biMoments.id, journey.momentId)).limit(1);
  const episodes = await db.select().from(personaBuilderEpisodes).where(eq(personaBuilderEpisodes.journeyId, journey.id)).orderBy(desc(personaBuilderEpisodes.createdAt));
  const [pattern] = await db.select().from(personaBuilderPatternSnapshots).where(eq(personaBuilderPatternSnapshots.journeyId, journey.id)).orderBy(desc(personaBuilderPatternSnapshots.version)).limit(1);
  const commitments = await db.select().from(personaBuilderCommitments).where(and(eq(personaBuilderCommitments.journeyId, journey.id), eq(personaBuilderCommitments.status, "active"))).orderBy(desc(personaBuilderCommitments.createdAt));
  const personas = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "selected"))).orderBy(desc(personaBuilderPersonas.createdAt));
  const personaCandidates = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "proposed"))).orderBy(personaBuilderPersonas.candidateIndex);
  const reps = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.journeyId, journey.id), eq(personaBuilderReps.status, "active"))).orderBy(desc(personaBuilderReps.createdAt)).limit(1);
  const checkins = await db.select().from(personaBuilderCheckins).where(eq(personaBuilderCheckins.journeyId, journey.id)).orderBy(desc(personaBuilderCheckins.createdAt)).limit(5);
  const evidence = await db.select().from(biEvidence).where(and(eq(biEvidence.momentId, journey.momentId), eq(biEvidence.userId, userId))).orderBy(desc(biEvidence.createdAt)).limit(5);

  return {
    journey,
    moment,
    episodes,
    pattern: pattern ? { ...pattern, pattern: pattern.pattern } : null,
    commitments,
    persona: personas[0] ?? null,
    personaCandidates,
    rep: reps[0] ?? null,
    checkins,
    evidence,
  };
}

export async function startPersonaJourney(userId: number, input: StartPersonaJourneyInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: personaBuilderJourneys.id })
    .from(personaBuilderJourneys)
    .where(and(eq(personaBuilderJourneys.userId, userId), eq(personaBuilderJourneys.status, "active")))
    .limit(1);
  if (existing[0]) return getPersonaBuilderHome(userId);

  const moment = await createMomentService({
    userId,
    input: {
      sourceApp: input.sourceApp,
      moduleType: "persona_builder",
      situation: input.situation,
      desiredOutcome: input.desiredOutcome,
      role: input.role,
      careerStage: "manager",
      evidence: [],
    },
  });
  const [inserted] = await db.insert(personaBuilderJourneys).values({
    userId,
    tenantId: null,
    momentId: moment.id,
    sourceApp: input.sourceApp,
    status: "active",
    currentStage: "discovery",
    integrationStatus: "scaffold_needed",
    targetEndAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  await db.update(biMoments).set({ status: "draft", updatedAt: new Date() }).where(eq(biMoments.id, moment.id));
  return getPersonaBuilderHome(userId);
}

export async function addPersonaEpisode(userId: number, input: AddPersonaEpisodeInput) {
  const { db, journey } = await getOwnedJourney(input.journeyId, userId);
  const [inserted] = await db.insert(personaBuilderEpisodes).values({
    journeyId: journey.id,
    userId,
    episodeText: input.episodeText,
    provenance: provenance("user_stated", "typed_episode"),
  });
  await db.update(personaBuilderJourneys).set({ currentStage: "pattern", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  const [episode] = await db.select().from(personaBuilderEpisodes).where(eq(personaBuilderEpisodes.id, inserted.insertId)).limit(1);
  return episode;
}

export async function analysePersonaPattern(userId: number, journeyId: number) {
  const { db, journey } = await getOwnedJourney(journeyId, userId);
  const [moment] = await db.select().from(biMoments).where(eq(biMoments.id, journey.momentId)).limit(1);
  const episodes = await db.select().from(personaBuilderEpisodes).where(eq(personaBuilderEpisodes.journeyId, journey.id)).orderBy(desc(personaBuilderEpisodes.createdAt));
  if (!moment || episodes.length === 0) throw new Error("Add one real episode before analysing the pattern.");

  const context = [`Situation: ${moment.situation}`, `Desired outcome: ${moment.desiredOutcome ?? "Not stated"}`, ...episodes.map((episode, index) => `Episode ${index + 1}: ${episode.episodeText}`)].join("\n\n");
  const fallback = { ...PERSONA_PATTERN_FALLBACK, intervention: chooseFallbackIntervention(context) };
  const result = await invokeStructured({
    context: "persona_builder.analyse_pattern",
    schemaName: "persona_builder_pattern",
    schema: personaPatternSchema,
    fallback,
    request: {
      model: "claude-haiku-4-5",
      messages: [
        {
          role: "system",
          content: "You are a careful behavior-change coach. Separate facts from hypotheses. Never diagnose motives. Account for skill, information, state, context, power, and safety before recommending a Persona. Return only JSON matching the schema.",
        },
        { role: "user", content: context },
      ],
    },
  });
  const prior = await db.select({ version: personaBuilderPatternSnapshots.version }).from(personaBuilderPatternSnapshots).where(eq(personaBuilderPatternSnapshots.journeyId, journey.id)).orderBy(desc(personaBuilderPatternSnapshots.version)).limit(1);
  const [inserted] = await db.insert(personaBuilderPatternSnapshots).values({
    journeyId: journey.id,
    userId,
    version: (prior[0]?.version ?? 0) + 1,
    pattern: result.value,
    modelStatus: result.status === "success" ? "success" : "fallback",
    fallbackReason: result.status === "fallback" ? result.failure : null,
  });
  await db.update(personaBuilderJourneys).set({ currentStage: "commitment", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  const [snapshot] = await db.select().from(personaBuilderPatternSnapshots).where(eq(personaBuilderPatternSnapshots.id, inserted.insertId)).limit(1);
  return snapshot;
}

export async function createPersonaCommitment(userId: number, input: { journeyId: number; statement: string; observableBehavior: string }) {
  const { db, journey } = await getOwnedJourney(input.journeyId, userId);
  const [inserted] = await db.insert(personaBuilderCommitments).values({
    journeyId: journey.id,
    userId,
    statement: input.statement,
    observableBehavior: input.observableBehavior,
    provenance: provenance("user_confirmed", "commitment_confirmation"),
    status: "active",
  });
  await db.update(personaBuilderJourneys).set({ currentStage: "rep", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  const [commitment] = await db.select().from(personaBuilderCommitments).where(eq(personaBuilderCommitments.id, inserted.insertId)).limit(1);
  return commitment;
}

export async function generatePersonaCandidates(userId: number, journeyId: number) {
  const { db, journey } = await getOwnedJourney(journeyId, userId);
  const [patternRow] = await db.select().from(personaBuilderPatternSnapshots).where(eq(personaBuilderPatternSnapshots.journeyId, journey.id)).orderBy(desc(personaBuilderPatternSnapshots.version)).limit(1);
  if (!patternRow) throw new Error("Analyse the pattern before generating Persona candidates.");
  const pattern = personaPatternSchema.parse(patternRow.pattern);
  if (pattern.intervention !== "persona") throw new Error("The current pattern points to a non-Persona intervention first.");

  const context = `Situation: ${(await db.select().from(biMoments).where(eq(biMoments.id, journey.momentId)).limit(1))[0]?.situation ?? ""}\nPattern: ${JSON.stringify(pattern)}`;
  const result = await invokeStructured({
    context: "persona_builder.generate_candidates",
    schemaName: "persona_builder_candidates",
    schema: candidateBatchSchema,
    fallback: { candidates: PERSONA_CANDIDATE_FALLBACKS },
    request: {
      model: "claude-haiku-4-5",
      messages: [
        { role: "system", content: "Generate three behaviorally distinct, context-aware Persona candidates. Each is a scaffold for accessing the user's own capability, not a replacement identity. Include boundaries and shadow risks. Return only JSON." },
        { role: "user", content: context },
      ],
    },
  });
  await db.update(personaBuilderPersonas).set({ status: "retired", updatedAt: new Date() }).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "proposed")));
  for (let candidateIndex = 0; candidateIndex < result.value.candidates.length; candidateIndex += 1) {
    const persona = result.value.candidates[candidateIndex];
    await db.insert(personaBuilderPersonas).values({ journeyId: journey.id, userId, candidateIndex, persona, status: "proposed" });
  }
  await db.update(personaBuilderJourneys).set({ currentStage: "persona", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  return getPersonaBuilderHome(userId);
}

export async function selectPersona(userId: number, journeyId: number, candidateIndex: number) {
  const { db, journey } = await getOwnedJourney(journeyId, userId);
  const [candidate] = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.userId, userId), eq(personaBuilderPersonas.candidateIndex, candidateIndex), eq(personaBuilderPersonas.status, "proposed"))).orderBy(desc(personaBuilderPersonas.createdAt)).limit(1);
  if (!candidate) throw new Error("Persona candidate not found or no longer available.");
  await db.update(personaBuilderPersonas).set({ status: "retired", updatedAt: new Date() }).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "selected")));
  await db.update(personaBuilderPersonas).set({ status: "selected", updatedAt: new Date() }).where(eq(personaBuilderPersonas.id, candidate.id));
  await db.update(personaBuilderJourneys).set({ activePersonaId: candidate.id, currentStage: "rep", integrationStatus: "scaffold_can_be_activated", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  return candidate;
}

export async function createPersonaRep(userId: number, journeyId: number) {
  const { db, journey } = await getOwnedJourney(journeyId, userId);
  const [commitment] = await db.select().from(personaBuilderCommitments).where(and(eq(personaBuilderCommitments.journeyId, journey.id), eq(personaBuilderCommitments.status, "active"))).orderBy(desc(personaBuilderCommitments.createdAt)).limit(1);
  if (!commitment) throw new Error("Confirm one Commitment before creating a Rep.");
  const [persona] = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "selected"))).orderBy(desc(personaBuilderPersonas.createdAt)).limit(1);
  const fallback = PERSONA_REP_FALLBACK;
  const result = await invokeStructured({
    context: "persona_builder.generate_rep",
    schemaName: "persona_builder_rep",
    schema: personaRepContentSchema,
    fallback,
    request: {
      model: "claude-haiku-4-5",
      messages: [
        { role: "system", content: "Create exactly one small, observable, safe workplace behavior experiment connected to the Commitment. Avoid vague traits. Return only JSON." },
        { role: "user", content: `Commitment: ${commitment.statement}\nObservable behavior: ${commitment.observableBehavior}\nPersona: ${persona ? JSON.stringify(persona.persona) : "No Persona; use the smallest useful intervention."}` },
      ],
    },
  });
  const [inserted] = await db.insert(personaBuilderReps).values({
    journeyId: journey.id,
    momentId: journey.momentId,
    userId,
    personaId: persona?.id ?? null,
    commitmentId: commitment.id,
    instruction: result.value.instruction,
    trigger: result.value.trigger,
    successSignal: result.value.successSignal,
    fallbackIfUnsafe: result.value.fallbackIfUnsafe,
    difficulty: result.value.difficulty,
    status: "active",
  });
  await db.update(personaBuilderJourneys).set({ currentStage: "evidence", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  const [rep] = await db.select().from(personaBuilderReps).where(eq(personaBuilderReps.id, inserted.insertId)).limit(1);
  return rep;
}

export async function recordPersonaCheckin(userId: number, input: PersonaCheckinInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [rep] = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.id, input.repId), eq(personaBuilderReps.userId, userId))).limit(1);
  if (!rep) throw new Error("Rep not found or access denied.");
  const nextAction = deriveNextPersonaAction(input.opportunityStatus, input.executionStatus);
  let evidenceId: number | null = null;
  if (input.opportunityStatus === "arose" && ["yes", "partly"].includes(input.executionStatus)) {
    const evidence = await recordEvidenceService({
      momentId: rep.momentId,
      userId,
      sourceType: input.outcome ? "real_world_outcome" : "self_report",
      situation: rep.trigger,
      actionTaken: rep.instruction,
      outcome: input.outcome || "The participant reported the Rep attempt; outcome not yet clear.",
      learning: input.reflection || "Check-in recorded; learning to be clarified in the next reflection.",
      evidenceLevel: "applied",
    });
    evidenceId = evidence.id;
  }
  const [inserted] = await db.insert(personaBuilderCheckins).values({
    repId: rep.id,
    journeyId: rep.journeyId,
    userId,
    opportunityStatus: input.opportunityStatus,
    executionStatus: input.executionStatus,
    reflection: input.reflection || null,
    outcome: input.outcome || null,
    evidenceId,
    nextAction,
  });
  await db.update(personaBuilderReps).set({ status: "completed", updatedAt: new Date() }).where(eq(personaBuilderReps.id, rep.id));
  await db.update(personaBuilderJourneys).set({ currentStage: "evidence", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, rep.journeyId));
  const [checkin] = await db.select().from(personaBuilderCheckins).where(eq(personaBuilderCheckins.id, inserted.insertId)).limit(1);
  return { checkin, evidenceId, nextAction };
}
