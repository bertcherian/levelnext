import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  academyAssessmentAttempts,
  academyAssessmentResponses,
  academyKnowledgeObjects,
  academyMentorMessages,
  academyMentorThreads,
  academyProfiles,
  academyProgressEvents,
  tenantUsers,
  type AcademyProfile,
} from "../drizzle/schema";
import {
  ACADEMY_DIMENSIONS,
  academyFluencyLevel,
  academyStageForScore,
  confidenceSignal,
  scoreAcademyFluency,
  type AcademyDimension,
  type AcademyDimensionScores,
  type AcademyRoleTrack,
} from "../shared/modules/academy";
import { ACADEMY_SEED_KNOWLEDGE } from "./academySeedData";
import { invokeStructured } from "./structuredLlm";
import { z } from "zod";

export interface DiagnosticItem {
  id: string;
  dimension: AcademyDimension;
  question: string;
  scenario: string;
  options: { key: string; label: string; isCorrect: boolean; explanation: string }[];
  gapCode: string;
}

export const ACADEMY_DIAGNOSTIC_ITEMS: DiagnosticItem[] = [
  {
    id: "diag-understand-1",
    dimension: "understand",
    question: "Why do traditional leadership workshops often fail to create lasting behavioral change in demanding environments?",
    scenario: "A scaling software firm ran a 2-day offsite on difficult conversations. Three months later, managers still avoid confrontational reviews.",
    options: [
      {
        key: "A",
        label: "Because workshops transfer intellectual awareness, but under pressure managers revert to legacy emotional habits without safe phrase-level rehearsal.",
        isCorrect: true,
        explanation: "Correct. LevelNext bridges the gap between knowing what to do and having the visceral rehearsal and visible commitments to do it.",
      },
      {
        key: "B",
        label: "Because the slides were not engaging enough and should have included more video summaries.",
        isCorrect: false,
        explanation: "Adding more passive content does not resolve the behavioral freeze when confronting another human.",
      },
      {
        key: "C",
        label: "Because managers do not care about team accountability unless compensated with spot bonuses.",
        isCorrect: false,
        explanation: "Motivation is rarely the core failure mode; lack of practiced behavioral moves under pressure is.",
      },
    ],
    gapCode: "misconception_training_equals_behavior",
  },
  {
    id: "diag-navigate-1",
    dimension: "navigate",
    question: "Where in LevelNext does a manager transform a diagnostic gap into rehearsable verbatim phrases?",
    scenario: "A manager completed MEP diagnostics and identified low courage in pushback conversations. What is their immediate next navigation step?",
    options: [
      {
        key: "A",
        label: "Click 'Transform into Behavioural Move' to open the Behavioural Studio, select the move, and launch the Voice Practice Simulator.",
        isCorrect: true,
        explanation: "Correct. The diagnostic reports feed directly into Behavioural Moments and phrase-linked simulator practice.",
      },
      {
        key: "B",
        label: "Download the report as a PDF and wait for quarterly HR review meetings.",
        isCorrect: false,
        explanation: "LevelNext emphasizes immediate in-flow practice rather than static quarterly reviews.",
      },
      {
        key: "C",
        label: "Re-take the diagnostic until the score reaches 90%.",
        isCorrect: false,
        explanation: "Re-taking assessments without intervening practice creates diagnostic fatigue rather than capability.",
      },
    ],
    gapCode: "navigation_practice_bridge",
  },
  {
    id: "diag-apply-1",
    dimension: "apply",
    question: "A Vice President of Engineering notices team leads are missing delivery milestones without raising early risk alerts. Which product and intervention fit best?",
    scenario: "Senior leads hide sprint slippage until release week because they fear looking incompetent in front of executive sponsors.",
    options: [
      {
        key: "A",
        label: "Deploy Manager Effectiveness (MEP) with focus on 'Contracting Clarity' and 'Risk Escalation' moves, rehearsed in the simulator.",
        isCorrect: true,
        explanation: "Correct. MEP addresses the specific managerial transition from engineering contributor to accountability steward.",
      },
      {
        key: "B",
        label: "Assign resume makeover modules to the entire engineering team.",
        isCorrect: false,
        explanation: "Resume makeover is for career transition and outplacement, not engineering delivery alignment.",
      },
      {
        key: "C",
        label: "Send a company-wide email mandating stricter Jira updates.",
        isCorrect: false,
        explanation: "Process mandates without psychological safety and behavioral moves do not change escalation habits.",
      },
    ],
    gapCode: "product_problem_mapping",
  },
  {
    id: "diag-explain-1",
    dimension: "explain",
    question: "How should a LevelNext team member explain the platform to an HR sponsor concerned about participant privacy?",
    scenario: "An enterprise CHRO wants reassurance that individual coaching conversations and diagnostic vulnerabilities won't be exposed to line managers.",
    options: [
      {
        key: "A",
        label: "Explain that individual reflections, verbatim moments, and coaching transcripts are strictly private; HR sponsors only see aggregate heatmaps once cohorts reach 5+ participants.",
        isCorrect: true,
        explanation: "Correct. The 5+ threshold privacy rule is a core platform guarantee across all LevelNext sponsor views.",
      },
      {
        key: "B",
        label: "Tell the CHRO that all transcripts are visible to senior leadership to enforce compliance.",
        isCorrect: false,
        explanation: "This destroys psychological safety and violates LevelNext core privacy architecture.",
      },
      {
        key: "C",
        label: "State that LevelNext does not store any data anywhere.",
        isCorrect: false,
        explanation: "This is inaccurate and evades the enterprise data governance explanation.",
      },
    ],
    gapCode: "privacy_posture_explanation",
  },
];

export async function ensureAcademySeedKnowledge(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const item of ACADEMY_SEED_KNOWLEDGE) {
    const existing = await db
      .select({ id: academyKnowledgeObjects.id })
      .from(academyKnowledgeObjects)
      .where(eq(academyKnowledgeObjects.slug, item.slug))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(academyKnowledgeObjects).values({
        slug: item.slug,
        title: item.title,
        objectType: item.objectType,
        summary: item.summary,
        disclosureBand: item.disclosureBand,
        approvalStatus: "approved",
        version: 1,
        productCode: item.productCode ?? null,
        roleRelevance: item.roleRelevance,
        content: item.content,
      });
    }
  }
}

export async function getOrCreateAcademyProfile(userId: number): Promise<AcademyProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await ensureAcademySeedKnowledge();

  const [existing] = await db
    .select()
    .from(academyProfiles)
    .where(eq(academyProfiles.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Resolve user tenant if present
  const [membership] = await db
    .select({ tenantId: tenantUsers.tenantId })
    .from(tenantUsers)
    .where(eq(tenantUsers.userId, userId))
    .limit(1);

  const initialScores: Record<string, number> = {
    understand: 25,
    navigate: 20,
    apply: 20,
    explain: 15,
  };

  const [inserted] = await db.insert(academyProfiles).values({
    userId,
    tenantId: membership?.tenantId ?? null,
    roleTrack: "other",
    stage: "orientation",
    fluencyLevel: "product_aware",
    dimensionScores: initialScores,
    gaps: ["complete_diagnostic_baseline"],
  });

  const [created] = await db
    .select()
    .from(academyProfiles)
    .where(eq(academyProfiles.id, inserted.insertId))
    .limit(1);

  return created!;
}

export async function submitDiagnosticAttempt(params: {
  userId: number;
  roleTrack?: AcademyRoleTrack;
  responses: { itemKey: string; response: string; confidence: "low" | "medium" | "high" }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const profile = await getOrCreateAcademyProfile(params.userId);

  const dimensionTotals: Record<AcademyDimension, { correct: number; total: number }> = {
    understand: { correct: 0, total: 0 },
    navigate: { correct: 0, total: 0 },
    apply: { correct: 0, total: 0 },
    explain: { correct: 0, total: 0 },
  };

  const confidenceSignals: Record<string, number> = {
    strong_understanding: 0,
    needs_reinforcement: 0,
    misconception: 0,
    learning_gap: 0,
  };

  const gaps: string[] = [];

  const evaluated = params.responses.map((r) => {
    const item = ACADEMY_DIAGNOSTIC_ITEMS.find((it) => it.id === r.itemKey);
    const chosenOption = item?.options.find((opt) => opt.key === r.response);
    const isCorrect = Boolean(chosenOption?.isCorrect);

    if (item) {
      dimensionTotals[item.dimension].total += 1;
      if (isCorrect) {
        dimensionTotals[item.dimension].correct += 1;
      } else {
        gaps.push(item.gapCode);
      }
    }

    const signal = confidenceSignal(isCorrect, r.confidence);
    confidenceSignals[signal] = (confidenceSignals[signal] ?? 0) + 1;

    return {
      itemKey: r.itemKey,
      response: r.response,
      confidence: r.confidence,
      isCorrect,
      dimension: item?.dimension ?? "understand",
      gapCode: isCorrect ? null : item?.gapCode ?? null,
    };
  });

  const calculatedDimensionScores: AcademyDimensionScores = {
    understand: Math.round(
      ((dimensionTotals.understand.correct || 1) / (dimensionTotals.understand.total || 1)) * 100,
    ),
    navigate: Math.round(
      ((dimensionTotals.navigate.correct || 1) / (dimensionTotals.navigate.total || 1)) * 100,
    ),
    apply: Math.round(
      ((dimensionTotals.apply.correct || 1) / (dimensionTotals.apply.total || 1)) * 100,
    ),
    explain: Math.round(
      ((dimensionTotals.explain.correct || 1) / (dimensionTotals.explain.total || 1)) * 100,
    ),
  };

  const overallScore = scoreAcademyFluency(calculatedDimensionScores);
  const fluency = academyFluencyLevel(overallScore);
  const nextStage = academyStageForScore(overallScore);

  const [attempt] = await db.insert(academyAssessmentAttempts).values({
    profileId: profile.id,
    assessmentType: "baseline_diagnostic",
    score: overallScore,
    dimensionScores: calculatedDimensionScores,
    confidenceSignals,
    completedAt: new Date(),
  });

  for (const resp of evaluated) {
    await db.insert(academyAssessmentResponses).values({
      attemptId: attempt.insertId,
      itemKey: resp.itemKey,
      response: resp.response,
      confidence: resp.confidence,
      isCorrect: resp.isCorrect,
      dimension: resp.dimension,
      gapCode: resp.gapCode,
    });
  }

  await db
    .update(academyProfiles)
    .set({
      roleTrack: params.roleTrack ?? profile.roleTrack,
      stage: nextStage,
      fluencyLevel: fluency,
      dimensionScores: calculatedDimensionScores,
      gaps: gaps.length > 0 ? gaps : ["deepen_voice_simulator_practice"],
      lastActiveAt: new Date(),
    })
    .where(eq(academyProfiles.id, profile.id));

  await db.insert(academyProgressEvents).values({
    profileId: profile.id,
    eventType: "diagnostic_completed",
    dimension: "understand",
    objectKey: "baseline_diagnostic",
    evidenceRef: {
      score: overallScore,
      fluencyLevel: fluency,
      gaps,
    },
  });

  return {
    attemptId: attempt.insertId,
    overallScore,
    fluencyLevel: fluency,
    dimensionScores: calculatedDimensionScores,
    gaps,
    stage: nextStage,
  };
}

export async function askProductMentor(params: {
  userId: number;
  question: string;
  mode?: "ask" | "explain" | "show" | "test" | "challenge";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const profile = await getOrCreateAcademyProfile(params.userId);
  const mode = params.mode ?? "ask";

  // Fetch approved knowledge context
  const knowledge = await db
    .select({
      slug: academyKnowledgeObjects.slug,
      title: academyKnowledgeObjects.title,
      summary: academyKnowledgeObjects.summary,
      objectType: academyKnowledgeObjects.objectType,
    })
    .from(academyKnowledgeObjects)
    .where(eq(academyKnowledgeObjects.approvalStatus, "approved"))
    .limit(10);

  const knowledgeSummary = knowledge
    .map((k) => `[${k.objectType}] ${k.title} (${k.slug}): ${k.summary}`)
    .join("\n");

  const prompt = `You are the LevelNext Product Mentor, an AI guide built to help new team members and leaders develop rigorous Product Fluency.
User Role Track: ${profile.roleTrack}
Current Fluency: ${profile.fluencyLevel}
Current Gaps: ${JSON.stringify(profile.gaps)}
Mode: ${mode}

APPROVED LEVELNEXT PRODUCT KNOWLEDGE:
${knowledgeSummary}

USER QUESTION:
"${params.question}"

RULES:
1. Ground your response firmly in LevelNext's core architecture: Problem-first diagnosis, Behavioural Breakthrough moves, Voice Simulator rehearsal, and observable evidence in real work.
2. Under no circumstances describe LevelNext as an LMS, a video course platform, or generic slide training.
3. Keep the answer direct, confident, and professional.
4. Always suggest one immediate next action inside LevelNext (e.g. explore the MEP Golden Journey, run the diagnostic, or test a move in the simulator).
5. Output structured JSON matching the requested schema.`;

  const fallbackAnswer = {
    answer:
      "LevelNext is built around a practical capability loop: Diagnose → Understand → Practise → Act → Reflect → Evidence. Instead of teaching abstract frameworks in workshops, it helps leaders identify their personal development edge, rehearse high-stakes conversations with AI voice simulation, and produce observable evidence in the flow of work.",
    whatWasCorrect: "Focusing on how capability actually shifts under pressure.",
    specificGap: "Connecting diagnostic insights to immediate simulator rehearsals.",
    suggestedNextAction: "Explore the First-Time Manager Golden Journey on the Product Map.",
    citations: ["levelnext-change-thesis", "product-mep", "engine-behavioural-intelligence"],
  };

  const mentorSchema = z.object({
    answer: z.string(),
    whatWasCorrect: z.string(),
    specificGap: z.string(),
    suggestedNextAction: z.string(),
    citations: z.array(z.string()),
  });

  const structuredResult = await invokeStructured({
    context: "academy_product_mentor",
    schemaName: "AcademyProductMentorResponse",
    schema: mentorSchema,
    fallback: fallbackAnswer,
    request: {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      maxTokens: 1200,
    },
  });

  const structuredResponse = structuredResult.value;

  // Persist thread and message
  const [thread] = await db.insert(academyMentorThreads).values({
    profileId: profile.id,
    mode,
    contextSnapshot: {
      fluencyLevel: profile.fluencyLevel,
      roleTrack: profile.roleTrack,
      gaps: profile.gaps,
    },
  });

  await db.insert(academyMentorMessages).values([
    {
      threadId: thread.insertId,
      role: "user",
      content: params.question,
      citations: [],
    },
    {
      threadId: thread.insertId,
      role: "assistant",
      content: structuredResponse.answer,
      citations: structuredResponse.citations,
    },
  ]);

  return {
    threadId: thread.insertId,
    mode,
    ...structuredResponse,
  };
}

export async function getAcademyPassportSummary(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const profile = await getOrCreateAcademyProfile(userId);

  const attempts = await db
    .select()
    .from(academyAssessmentAttempts)
    .where(eq(academyAssessmentAttempts.profileId, profile.id))
    .orderBy(desc(academyAssessmentAttempts.createdAt))
    .limit(5);

  const events = await db
    .select()
    .from(academyProgressEvents)
    .where(eq(academyProgressEvents.profileId, profile.id))
    .orderBy(desc(academyProgressEvents.createdAt))
    .limit(10);

  const scores = (profile.dimensionScores as AcademyDimensionScores) ?? {
    understand: 25,
    navigate: 20,
    apply: 20,
    explain: 15,
  };

  const compositeScore = scoreAcademyFluency(scores);

  return {
    profile,
    compositeScore,
    fluencyLevel: academyFluencyLevel(compositeScore),
    dimensionScores: scores,
    gaps: (profile.gaps as string[]) ?? [],
    recentAttempts: attempts,
    evidenceLedger: events,
  };
}
