import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
  biEvidence,
  biMoments,
  personaBuilderCheckins,
  personaBuilderCompletionReviews,
  personaBuilderCommitments,
  personaBuilderDays,
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
  deriveNextDayNumber,
  deriveNextPersonaAction,
  getPersonaDayPlan,
  PERSONA_DAY_PLANS,
  personaCandidateSchema,
  personaPatternSchema,
  personaRepContentSchema,
  type AddPersonaEpisodeInput,
  type CreatePersonaCompletionReviewInput,
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

async function ensurePersonaDays(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, journeyId: number, userId: number) {
  const existing = await db.select().from(personaBuilderDays).where(eq(personaBuilderDays.journeyId, journeyId)).orderBy(personaBuilderDays.dayNumber);
  if (existing.length === PERSONA_DAY_PLANS.length) return existing;
  const existingNumbers = new Set(existing.map((day) => day.dayNumber));
  for (let index = 0; index < PERSONA_DAY_PLANS.length; index += 1) {
    const dayNumber = index + 1;
    if (existingNumbers.has(dayNumber)) continue;
    const plan = getPersonaDayPlan(dayNumber);
    await db.insert(personaBuilderDays).values({
      journeyId,
      userId,
      dayNumber,
      title: plan.title,
      focus: plan.focus,
      status: dayNumber === 1 ? "in_progress" : "locked",
      availableAt: dayNumber === 1 ? new Date() : new Date(Date.now() + (dayNumber - 1) * 24 * 60 * 60 * 1000),
    });
  }
  return db.select().from(personaBuilderDays).where(eq(personaBuilderDays.journeyId, journeyId)).orderBy(personaBuilderDays.dayNumber);
}

async function getCurrentPersonaDay(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, journeyId: number) {
  const [day] = await db.select().from(personaBuilderDays).where(and(eq(personaBuilderDays.journeyId, journeyId), eq(personaBuilderDays.status, "in_progress"))).orderBy(personaBuilderDays.dayNumber).limit(1);
  return day;
}

export async function getPersonaBuilderHome(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [journey] = await db
    .select()
    .from(personaBuilderJourneys)
    .where(and(eq(personaBuilderJourneys.userId, userId), or(eq(personaBuilderJourneys.status, "active"), eq(personaBuilderJourneys.status, "completed"))))
    .orderBy(desc(personaBuilderJourneys.updatedAt))
    .limit(1);
  if (!journey) return { journey: null };

  const timeline = await ensurePersonaDays(db, journey.id, userId);

  const [moment] = await db.select().from(biMoments).where(eq(biMoments.id, journey.momentId)).limit(1);
  const episodes = await db.select().from(personaBuilderEpisodes).where(eq(personaBuilderEpisodes.journeyId, journey.id)).orderBy(desc(personaBuilderEpisodes.createdAt));
  const [pattern] = await db.select().from(personaBuilderPatternSnapshots).where(eq(personaBuilderPatternSnapshots.journeyId, journey.id)).orderBy(desc(personaBuilderPatternSnapshots.version)).limit(1);
  const commitments = await db.select().from(personaBuilderCommitments).where(and(eq(personaBuilderCommitments.journeyId, journey.id), eq(personaBuilderCommitments.status, "active"))).orderBy(desc(personaBuilderCommitments.createdAt));
  const personas = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "selected"))).orderBy(desc(personaBuilderPersonas.createdAt));
  const personaCandidates = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "proposed"))).orderBy(personaBuilderPersonas.candidateIndex);
  const reps = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.journeyId, journey.id), eq(personaBuilderReps.status, "active"))).orderBy(desc(personaBuilderReps.createdAt)).limit(1);
  const checkins = await db.select().from(personaBuilderCheckins).where(eq(personaBuilderCheckins.journeyId, journey.id)).orderBy(desc(personaBuilderCheckins.createdAt)).limit(5);
  const evidence = await db.select().from(biEvidence).where(and(eq(biEvidence.momentId, journey.momentId), eq(biEvidence.userId, userId))).orderBy(desc(biEvidence.createdAt)).limit(5);
  const [completionReview] = await db.select().from(personaBuilderCompletionReviews).where(and(eq(personaBuilderCompletionReviews.journeyId, journey.id), eq(personaBuilderCompletionReviews.userId, userId))).orderBy(desc(personaBuilderCompletionReviews.createdAt)).limit(1);

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
    timeline,
    completionReview: completionReview ?? null,
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
  await ensurePersonaDays(db, inserted.insertId, userId);
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
  if (journey.status !== "active") throw new Error("This Persona Builder journey is complete. Start a new Moment to create another Rep.");
  const day = await getCurrentPersonaDay(db, journey.id);
  if (!day) throw new Error("There is no active day in this journey yet.");
  const [existingRep] = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.journeyId, journey.id), eq(personaBuilderReps.status, "active"))).limit(1);
  if (existingRep) return existingRep;
  const [previousCheckin] = await db.select().from(personaBuilderCheckins).where(eq(personaBuilderCheckins.journeyId, journey.id)).orderBy(desc(personaBuilderCheckins.createdAt)).limit(1);
  const adaptiveDirection = day.dayNumber === 1
    ? "Start with the smallest useful, low-risk version of the behavior."
    : previousCheckin?.nextAction === "increase_difficulty"
      ? "Increase difficulty one notch: retain the behavior but use a more consequential stakeholder, more resistance, or a clearer decision point."
      : previousCheckin?.nextAction === "repeat_with_adjustment"
        ? "Repeat the same core behavior with one concrete adjustment that makes it easier to notice and execute."
        : previousCheckin?.nextAction === "simplify_and_practice"
          ? "Simplify the behavior and make it rehearsal-ready before expecting it in real work."
          : "Keep the behavior small and seek the next realistic opportunity to apply it.";
  const [commitment] = await db.select().from(personaBuilderCommitments).where(and(eq(personaBuilderCommitments.journeyId, journey.id), eq(personaBuilderCommitments.status, "active"))).orderBy(desc(personaBuilderCommitments.createdAt)).limit(1);
  if (!commitment) throw new Error("Confirm one Commitment before creating a Rep.");
  const [persona] = await db.select().from(personaBuilderPersonas).where(and(eq(personaBuilderPersonas.journeyId, journey.id), eq(personaBuilderPersonas.status, "selected"))).orderBy(desc(personaBuilderPersonas.createdAt)).limit(1);
  const fallback = { ...PERSONA_REP_FALLBACK, difficulty: Math.min(5, Math.max(1, day.dayNumber >= 10 ? 3 : day.dayNumber >= 6 ? 2 : 1)) };
  const result = await invokeStructured({
    context: "persona_builder.generate_rep",
    schemaName: "persona_builder_rep",
    schema: personaRepContentSchema,
    fallback,
    request: {
      model: "claude-haiku-4-5",
      messages: [
        { role: "system", content: "Create exactly one small, observable, safe workplace behavior experiment connected to the Commitment. Avoid vague traits. The Rep must fit the supplied adaptive direction and stay appropriate for the stated day. Return only JSON." },
        { role: "user", content: `Journey day ${day.dayNumber}: ${day.title}\nDay focus: ${day.focus}\nAdaptive direction: ${adaptiveDirection}\nCommitment: ${commitment.statement}\nObservable behavior: ${commitment.observableBehavior}\nPersona: ${persona ? JSON.stringify(persona.persona) : "No Persona; use the smallest useful intervention."}` },
      ],
    },
  });
  const [inserted] = await db.insert(personaBuilderReps).values({
    journeyId: journey.id,
    momentId: journey.momentId,
    userId,
    personaId: persona?.id ?? null,
    commitmentId: commitment.id,
    dayNumber: day.dayNumber,
    instruction: result.value.instruction,
    trigger: result.value.trigger,
    successSignal: result.value.successSignal,
    fallbackIfUnsafe: result.value.fallbackIfUnsafe,
    difficulty: result.value.difficulty,
    status: "active",
  });
  await db.update(personaBuilderDays).set({ repId: inserted.insertId, status: "in_progress", updatedAt: new Date() }).where(eq(personaBuilderDays.id, day.id));
  await db.update(personaBuilderJourneys).set({ currentStage: "evidence", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  const [rep] = await db.select().from(personaBuilderReps).where(eq(personaBuilderReps.id, inserted.insertId)).limit(1);
  return rep;
}

export async function recordPersonaCheckin(userId: number, input: PersonaCheckinInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [rep] = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.id, input.repId), eq(personaBuilderReps.userId, userId))).limit(1);
  if (!rep) throw new Error("Rep not found or access denied.");
  if (rep.status !== "active") throw new Error("This Rep has already been checked in. Create the next Rep from your journey timeline.");
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
  const [day] = await db.select().from(personaBuilderDays).where(and(eq(personaBuilderDays.journeyId, rep.journeyId), eq(personaBuilderDays.dayNumber, rep.dayNumber))).limit(1);
  if (day) {
    const nextDayNumber = deriveNextDayNumber(day.dayNumber, nextAction);
    const isFinalDayComplete = day.dayNumber === 14 && input.opportunityStatus === "arose" && ["yes", "partly"].includes(input.executionStatus);
    const advanced = nextDayNumber > day.dayNumber || isFinalDayComplete;
    await db.update(personaBuilderDays).set({
      status: advanced ? "complete" : "in_progress",
      evidenceCount: day.evidenceCount + (evidenceId ? 1 : 0),
      adaptation: {
        source: "checkin",
        decision: nextAction,
        reason: input.opportunityStatus === "did_not_arise" ? "The opportunity did not arise; repeat the same small Rep." : "The check-in indicates whether to repeat, simplify, or increase difficulty.",
      },
      completedAt: advanced ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(personaBuilderDays.id, day.id));
    if (advanced && nextDayNumber > day.dayNumber) {
      await db.update(personaBuilderDays).set({ status: "in_progress", updatedAt: new Date() }).where(and(eq(personaBuilderDays.journeyId, rep.journeyId), eq(personaBuilderDays.dayNumber, nextDayNumber)));
    }
  }
  await db.update(personaBuilderJourneys).set({ currentStage: "evidence", updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, rep.journeyId));
  const [checkin] = await db.select().from(personaBuilderCheckins).where(eq(personaBuilderCheckins.id, inserted.insertId)).limit(1);
  return { checkin, evidenceId, nextAction };
}

export async function getPersonaRepPracticeContext(userId: number, repId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [rep] = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.id, repId), eq(personaBuilderReps.userId, userId))).limit(1);
  if (!rep) throw new Error("Persona Rep not found or access denied.");
  const [journey] = await db.select().from(personaBuilderJourneys).where(and(eq(personaBuilderJourneys.id, rep.journeyId), eq(personaBuilderJourneys.userId, userId))).limit(1);
  const [moment] = await db.select().from(biMoments).where(eq(biMoments.id, rep.momentId)).limit(1);
  const [commitment] = await db.select().from(personaBuilderCommitments).where(eq(personaBuilderCommitments.id, rep.commitmentId)).limit(1);
  const [persona] = rep.personaId ? await db.select().from(personaBuilderPersonas).where(eq(personaBuilderPersonas.id, rep.personaId)).limit(1) : [];
  const [day] = await db.select().from(personaBuilderDays).where(and(eq(personaBuilderDays.journeyId, rep.journeyId), eq(personaBuilderDays.dayNumber, rep.dayNumber))).limit(1);
  return {
    rep,
    journey,
    day,
    moment,
    commitment,
    persona,
    practice: {
      scenarioId: `persona_rep_${rep.id}`,
      scenarioLabel: `Persona Rep — ${rep.instruction}`,
      stakeholder: moment?.role || "Workplace stakeholder",
      objective: rep.successSignal,
      expectedChallenge: "The stakeholder may challenge the assumption or ask you to defend your position. Stay with the Rep before explaining.",
      characterStyle: "Realistic, mildly resistant, and responsive to clear listening.",
      userPrompt: `${rep.instruction} Trigger: ${rep.trigger}. Success: ${rep.successSignal}`,
    },
  };
}

async function updatePersonaDaySessionLink(userId: number, repId: number, field: "practiceSessionId" | "simulatorSessionId", sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [rep] = await db.select().from(personaBuilderReps).where(and(eq(personaBuilderReps.id, repId), eq(personaBuilderReps.userId, userId))).limit(1);
  if (!rep) throw new Error("Persona Rep not found or access denied.");
  await db.update(personaBuilderDays).set({ [field]: sessionId, updatedAt: new Date() }).where(and(eq(personaBuilderDays.journeyId, rep.journeyId), eq(personaBuilderDays.dayNumber, rep.dayNumber)));
  return { linked: true, repId, sessionId, field };
}

export function linkPersonaPracticeSession(userId: number, repId: number, sessionId: number) {
  return updatePersonaDaySessionLink(userId, repId, "practiceSessionId", sessionId);
}

export function linkPersonaSimulatorSession(userId: number, repId: number, sessionId: number) {
  return updatePersonaDaySessionLink(userId, repId, "simulatorSessionId", sessionId);
}

export async function createPersonaCompletionReview(userId: number, input: CreatePersonaCompletionReviewInput) {
  const { db, journey } = await getOwnedJourney(input.journeyId, userId);
  const [day14] = await db.select().from(personaBuilderDays).where(and(eq(personaBuilderDays.journeyId, journey.id), eq(personaBuilderDays.dayNumber, 14))).limit(1);
  if (!day14 || day14.status !== "complete") throw new Error("Complete the Day 14 Rep before writing the completion review.");
  const [reviewInsert] = await db.insert(personaBuilderCompletionReviews).values({
    journeyId: journey.id,
    userId,
    overallShift: input.overallShift,
    whatChanged: input.whatChanged,
    whatDidNotChange: input.whatDidNotChange,
    nextExperiment: input.nextExperiment,
    rating: input.rating,
    nextChoice: input.nextChoice,
  });
  const integrationStatus = input.nextChoice === "retire_persona" ? "integrated" : input.nextChoice === "continue_persona" ? "increasingly_natural" : input.nextChoice === "switch_intervention" ? "less_activation_needed" : "scaffold_can_be_activated";
  await db.update(personaBuilderJourneys).set({ status: "completed", currentStage: "completed", integrationStatus, completedAt: new Date(), updatedAt: new Date() }).where(eq(personaBuilderJourneys.id, journey.id));
  const [review] = await db.select().from(personaBuilderCompletionReviews).where(eq(personaBuilderCompletionReviews.id, reviewInsert.insertId)).limit(1);
  return review;
}
