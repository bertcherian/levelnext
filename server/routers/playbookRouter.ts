/**
 * playbookRouter.ts
 * Leader Playbook Engine — situation-first AI advisor
 *
 * Procedures:
 *   classify        — LLM classifies the leader's situation into type/urgency/competencies
 *   generate        — LLM generates the full 13-section playbook, personalised from Leadership Graph
 *   getSession      — fetch a single playbook session by id
 *   listSessions    — list all sessions for the current user
 *   markDone        — mark conversation as done (triggers reflection prompt)
 *   saveChecklist   — persist checklist state
 *   saveScript      — persist script edits
 *   saveReflection  — submit post-meeting reflection + generate LLM insight
 *   getPatterns     — return aggregated pattern intelligence for the user
 */

import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  playbookSessions,
  playbookReflections,
  playbookPatterns,
  users,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// ─── Situation Library ────────────────────────────────────────────────────────
// Used to ground the classification LLM and provide quick-start tiles on the UI
export const SITUATION_CATEGORIES = {
  "Strategic Leadership": [
    "Setting strategy", "Strategic planning", "Annual planning", "Prioritisation",
    "Innovation", "Crisis leadership", "Business transformation",
  ],
  "People Leadership": [
    "Giving feedback", "Difficult conversations", "Performance management",
    "Coaching", "Delegation", "Hiring", "Succession planning",
    "Team motivation", "Conflict resolution",
  ],
  "Executive Influence": [
    "Managing upwards", "Influencing peers", "Executive alignment",
    "Stakeholder management", "Organisational politics", "Cross-functional leadership",
  ],
  "Customer Leadership": [
    "Executive client meetings", "Customer escalations", "Negotiation",
    "Sales conversations", "Executive business reviews", "Renewals",
    "Strategic partnerships",
  ],
  "Communication": [
    "Board presentations", "CEO updates", "Town halls",
    "Executive storytelling", "Media interviews", "Investor presentations",
  ],
  "Decision Leadership": [
    "Difficult decisions", "Ethical dilemmas", "Risk decisions",
    "Trade-offs", "Resource allocation",
  ],
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildLeadershipContext(graph: any): string {
  if (!graph) return "No diagnostic data available yet.";
  const lines: string[] = [];
  if (graph.compositeEdge) lines.push(`Composite Edge Score: ${graph.compositeEdge}/100`);
  if (graph.completedModules?.length) lines.push(`Completed diagnostics: ${graph.completedModules.join(", ")}`);
  if (graph.strengths?.length) lines.push(`Leadership strengths: ${graph.strengths.slice(0, 5).join(", ")}`);
  if (graph.growthOpportunities?.length) lines.push(`Growth opportunities: ${graph.growthOpportunities.slice(0, 5).join(", ")}`);
  // Per-module archetypes
  if (graph.archetypes) {
    const archetypeLines = Object.entries(graph.archetypes)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (archetypeLines.length) lines.push(`Archetypes: ${archetypeLines.join(", ")}`);
  }
  // Per-module zones
  if (graph.zones) {
    const zoneLines = Object.entries(graph.zones)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (zoneLines.length) lines.push(`Zones: ${zoneLines.join(", ")}`);
  }
  return lines.join("\n") || "Diagnostic data is being built.";
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const playbookRouter = router({

  // ── classify ─────────────────────────────────────────────────────────────────
  // Takes the leader's raw situation text and returns a structured classification
  classify: protectedProcedure
    .input(z.object({ situationText: z.string().min(5).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Fetch leadership graph for personalisation
      const userRow = await db.select({ leadershipGraph: users.leadershipGraph })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const graph = userRow[0]?.leadershipGraph ?? null;
      const leaderContext = buildLeadershipContext(graph);

      const classificationSchema = {
        type: "object",
        properties: {
          primarySituation: { type: "string", description: "The main leadership situation category (e.g. 'Managing Upwards', 'Customer Escalation')" },
          secondarySituations: { type: "array", items: { type: "string" }, description: "Up to 3 related situation types" },
          urgency: { type: "string", enum: ["immediate", "today", "this_week", "planning"], description: "How urgent is this situation" },
          emotionalIntensity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Emotional stakes involved" },
          businessRisk: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Business risk if handled poorly" },
          competencies: { type: "array", items: { type: "string" }, description: "Leadership competencies most relevant (e.g. Executive Communication, Negotiation, Emotional Intelligence)" },
          stakeholders: { type: "array", items: { type: "string" }, description: "Key stakeholders involved (e.g. CEO, Client, Peer, Team)" },
          coachingOpening: { type: "string", description: "A 2–3 sentence coaching response that acknowledges the situation and sets up the playbook — written as an elite executive coach, not a search engine" },
          supportingPlaybooks: { type: "array", items: { type: "string" }, description: "Up to 3 supporting playbook types that complement the primary" },
        },
        required: ["primarySituation", "secondarySituations", "urgency", "emotionalIntensity", "businessRisk", "competencies", "stakeholders", "coachingOpening", "supportingPlaybooks"],
        additionalProperties: false,
      };

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the Leader Playbook Engine inside the LevelNext Leadership Intelligence Platform.
You are a world-class executive advisor combining the wisdom of elite executive coaches, CEOs, psychologists, communication experts, negotiation experts, strategy consultants, and leadership researchers.
You understand that every leadership challenge is ultimately a conversation, decision, relationship, or influence problem.

Leader's profile:
${leaderContext}

Your task: Classify the leader's situation into a structured JSON response. Be specific and actionable. Do not be generic.`,
          },
          {
            role: "user",
            content: `Here is my situation:\n\n${input.situationText}`,
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: { name: "classification", schema: classificationSchema, strict: true },
        },
      });

      const classification = JSON.parse((result as any)?.content ?? (result as any)?.choices?.[0]?.message?.content ?? "{}");

      // Create the session row with classification
      const [session] = await db.insert(playbookSessions).values({
        userId: ctx.user.id,
        situationText: input.situationText,
        classification,
        playbookType: classification.primarySituation,
      }).$returningId();

      return { sessionId: session.id, classification };
    }),

  // ── generate ─────────────────────────────────────────────────────────────────
  // Generates the full 13-section playbook for a session
  generate: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Load session
      const sessionRows = await db.select().from(playbookSessions)
        .where(eq(playbookSessions.id, input.sessionId)).limit(1);
      const session = sessionRows[0];
      if (!session || session.userId !== ctx.user.id)
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      // Fetch leadership graph
      const userRow = await db.select({ leadershipGraph: users.leadershipGraph, name: users.name })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const graph = userRow[0]?.leadershipGraph ?? null;
      const leaderName = userRow[0]?.name ?? "Leader";
      const leaderContext = buildLeadershipContext(graph);

      const classification = session.classification as any;
      const playbookType = session.playbookType ?? "Leadership Challenge";

      const playbookSchema = {
        type: "object",
        properties: {
          situationSummary: {
            type: "object",
            properties: {
              summary: { type: "string" },
              whyDifficult: { type: "string" },
              whatExcellentLeadersDo: { type: "string" },
            },
            required: ["summary", "whyDifficult", "whatExcellentLeadersDo"],
            additionalProperties: false,
          },
          desiredOutcome: {
            type: "object",
            properties: {
              successDefinition: { type: "string" },
              endOfConversationGoal: { type: "string" },
              measurableOutcomes: { type: "array", items: { type: "string" } },
            },
            required: ["successDefinition", "endOfConversationGoal", "measurableOutcomes"],
            additionalProperties: false,
          },
          hiddenRisks: {
            type: "object",
            properties: {
              blindSpots: { type: "array", items: { type: "string" } },
              politicalRisks: { type: "array", items: { type: "string" } },
              relationshipRisks: { type: "array", items: { type: "string" } },
              communicationTraps: { type: "array", items: { type: "string" } },
              commonExecutiveMistakes: { type: "array", items: { type: "string" } },
            },
            required: ["blindSpots", "politicalRisks", "relationshipRisks", "communicationTraps", "commonExecutiveMistakes"],
            additionalProperties: false,
          },
          stakeholderAnalysis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                stakeholder: { type: "string" },
                goals: { type: "string" },
                concerns: { type: "string" },
                power: { type: "string", enum: ["low", "medium", "high"] },
                influence: { type: "string", enum: ["low", "medium", "high"] },
                likelyObjections: { type: "array", items: { type: "string" } },
                decisionCriteria: { type: "string" },
                politicalDynamics: { type: "string" },
              },
              required: ["stakeholder", "goals", "concerns", "power", "influence", "likelyObjections", "decisionCriteria", "politicalDynamics"],
              additionalProperties: false,
            },
          },
          frameworkRecommendation: {
            type: "object",
            properties: {
              primaryFramework: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  whyItFits: { type: "string" },
                  whenToUse: { type: "string" },
                  whenNotToUse: { type: "string" },
                  advantages: { type: "array", items: { type: "string" } },
                  limitations: { type: "array", items: { type: "string" } },
                  applicationToSituation: { type: "string" },
                },
                required: ["name", "whyItFits", "whenToUse", "whenNotToUse", "advantages", "limitations", "applicationToSituation"],
                additionalProperties: false,
              },
              supportingFrameworks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    whyItFits: { type: "string" },
                  },
                  required: ["name", "whyItFits"],
                  additionalProperties: false,
                },
              },
            },
            required: ["primaryFramework", "supportingFrameworks"],
            additionalProperties: false,
          },
          conversationStrategy: {
            type: "object",
            properties: {
              opening: { type: "string" },
              discoveryQuestions: { type: "array", items: { type: "string" } },
              influencingQuestions: { type: "array", items: { type: "string" } },
              keyMessages: { type: "array", items: { type: "string" } },
              handlingResistance: { type: "array", items: { type: "string" } },
              closing: { type: "string" },
              commitmentAsk: { type: "string" },
              nextSteps: { type: "array", items: { type: "string" } },
            },
            required: ["opening", "discoveryQuestions", "influencingQuestions", "keyMessages", "handlingResistance", "closing", "commitmentAsk", "nextSteps"],
            additionalProperties: false,
          },
          executiveScript: {
            type: "object",
            properties: {
              openingStatement: { type: "string" },
              keyTransitions: { type: "array", items: { type: "string" } },
              handlingObjection: { type: "string" },
              closingStatement: { type: "string" },
              coachingNote: { type: "string" },
            },
            required: ["openingStatement", "keyTransitions", "handlingObjection", "closingStatement", "coachingNote"],
            additionalProperties: false,
          },
          preparationCoach: {
            type: "object",
            properties: {
              assumptionsToChallenge: { type: "array", items: { type: "string" } },
              logicStressTest: { type: "array", items: { type: "string" } },
              predictedObjections: { type: "array", items: { type: "string" } },
              strongerAlternatives: { type: "array", items: { type: "string" } },
              confidenceBuilders: { type: "array", items: { type: "string" } },
            },
            required: ["assumptionsToChallenge", "logicStressTest", "predictedObjections", "strongerAlternatives", "confidenceBuilders"],
            additionalProperties: false,
          },
          rolePlaySetup: {
            type: "object",
            properties: {
              persona: { type: "string" },
              personaDescription: { type: "string" },
              openingLine: { type: "string" },
              difficultyLevel: { type: "string", enum: ["Medium", "Hard", "Executive"] },
              escalationTriggers: { type: "array", items: { type: "string" } },
            },
            required: ["persona", "personaDescription", "openingLine", "difficultyLevel", "escalationTriggers"],
            additionalProperties: false,
          },
          decisionSupport: {
            type: "object",
            properties: {
              isDecisionRequired: { type: "boolean" },
              tradeoffs: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } },
              unknowns: { type: "array", items: { type: "string" } },
              scenarioAnalysis: { type: "array", items: { type: "string" } },
              secondOrderConsequences: { type: "array", items: { type: "string" } },
              recommendedDecision: { type: "string" },
            },
            required: ["isDecisionRequired", "tradeoffs", "risks", "unknowns", "scenarioAnalysis", "secondOrderConsequences", "recommendedDecision"],
            additionalProperties: false,
          },
          executionChecklist: {
            type: "object",
            properties: {
              before: { type: "array", items: { type: "string" } },
              during: { type: "array", items: { type: "string" } },
              after: { type: "array", items: { type: "string" } },
            },
            required: ["before", "during", "after"],
            additionalProperties: false,
          },
          reflectionPrompts: {
            type: "object",
            properties: {
              prompts: { type: "array", items: { type: "string" } },
              successIndicators: { type: "array", items: { type: "string" } },
            },
            required: ["prompts", "successIndicators"],
            additionalProperties: false,
          },
          continuousLearning: {
            type: "object",
            properties: {
              lessonsToCapture: { type: "array", items: { type: "string" } },
              patternToWatch: { type: "string" },
              developmentConnection: { type: "string" },
            },
            required: ["lessonsToCapture", "patternToWatch", "developmentConnection"],
            additionalProperties: false,
          },
          personalisation: {
            type: "object",
            properties: {
              strengthsToLeverage: { type: "array", items: { type: "string" } },
              blindSpotsToWatch: { type: "array", items: { type: "string" } },
              coachingInsight: { type: "string" },
            },
            required: ["strengthsToLeverage", "blindSpotsToWatch", "coachingInsight"],
            additionalProperties: false,
          },
        },
        required: [
          "situationSummary", "desiredOutcome", "hiddenRisks", "stakeholderAnalysis",
          "frameworkRecommendation", "conversationStrategy", "executiveScript",
          "preparationCoach", "rolePlaySetup", "decisionSupport",
          "executionChecklist", "reflectionPrompts", "continuousLearning", "personalisation",
        ],
        additionalProperties: false,
      };

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the Leader Playbook Engine inside the LevelNext Leadership Intelligence Platform.

You are a world-class executive advisor that combines the wisdom of elite executive coaches, CEOs, psychologists, communication experts, negotiation experts, strategy consultants, military decision-makers, behavioural scientists and leadership researchers.

You understand that every leadership challenge is ultimately a conversation, decision, relationship, or influence problem.

The leader should feel like they have an experienced executive coach sitting beside them before, during and after every important leadership moment.

Leader: ${leaderName}
Leadership Profile:
${leaderContext}

Situation Classification:
- Primary Situation: ${classification?.primarySituation ?? playbookType}
- Urgency: ${classification?.urgency ?? "unknown"}
- Emotional Intensity: ${classification?.emotionalIntensity ?? "unknown"}
- Business Risk: ${classification?.businessRisk ?? "unknown"}
- Key Competencies: ${(classification?.competencies ?? []).join(", ")}
- Stakeholders: ${(classification?.stakeholders ?? []).join(", ")}

Design principles:
- Situation-first, never framework-first
- Executive-grade, concise, and actionable
- Recommend the BEST framework — not a list of all frameworks
- Blend coaching, decision support, and preparation seamlessly
- Personalise deeply using the leader's diagnostic profile
- Write the executive script in natural, confident, professional language — not robotic
- Every response should feel like advice from a trusted executive coach who knows this leader`,
          },
          {
            role: "user",
            content: `Here is my situation:\n\n${session.situationText}\n\nPlease generate my complete Leader Playbook.`,
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: { name: "playbook", schema: playbookSchema, strict: true },
        },
      });

      const playbookContent = JSON.parse((result as any)?.content ?? (result as any)?.choices?.[0]?.message?.content ?? "{}");

      // Save playbook content to session
      await db.update(playbookSessions)
        .set({ playbookContent })
        .where(eq(playbookSessions.id, input.sessionId));

      // Update pattern intelligence
      await updatePatterns(db, ctx.user.id, classification, null);

      return { playbookContent };
    }),

  // ── getSession ───────────────────────────────────────────────────────────────
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const rows = await db.select().from(playbookSessions)
        .where(eq(playbookSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id)
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      // Also fetch reflection if exists
      const reflectionRows = await db.select().from(playbookReflections)
        .where(eq(playbookReflections.sessionId, input.sessionId)).limit(1);

      return { session, reflection: reflectionRows[0] ?? null };
    }),

  // ── listSessions ─────────────────────────────────────────────────────────────
  listSessions: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const sessions = await db.select({
        id: playbookSessions.id,
        situationText: playbookSessions.situationText,
        playbookType: playbookSessions.playbookType,
        conversationDone: playbookSessions.conversationDone,
        createdAt: playbookSessions.createdAt,
        updatedAt: playbookSessions.updatedAt,
      })
        .from(playbookSessions)
        .where(eq(playbookSessions.userId, ctx.user.id))
        .orderBy(desc(playbookSessions.createdAt))
        .limit(input.limit);

      return sessions;
    }),

  // ── markDone ─────────────────────────────────────────────────────────────────
  markDone: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.update(playbookSessions)
        .set({ conversationDone: true })
        .where(eq(playbookSessions.id, input.sessionId));

      return { success: true };
    }),

  // ── saveChecklist ────────────────────────────────────────────────────────────
  saveChecklist: protectedProcedure
    .input(z.object({
      sessionId: z.number().int().positive(),
      checklistState: z.object({
        before: z.array(z.boolean()),
        during: z.array(z.boolean()),
        after: z.array(z.boolean()),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.update(playbookSessions)
        .set({ checklistState: input.checklistState })
        .where(eq(playbookSessions.id, input.sessionId));

      return { success: true };
    }),

  // ── saveScript ───────────────────────────────────────────────────────────────
  saveScript: protectedProcedure
    .input(z.object({
      sessionId: z.number().int().positive(),
      scriptEdits: z.object({
        openingStatement: z.string().optional(),
        handlingObjection: z.string().optional(),
        closingStatement: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.update(playbookSessions)
        .set({ scriptEdits: input.scriptEdits })
        .where(eq(playbookSessions.id, input.sessionId));

      return { success: true };
    }),

  // ── saveReflection ───────────────────────────────────────────────────────────
  saveReflection: protectedProcedure
    .input(z.object({
      sessionId: z.number().int().positive(),
      whatHappened: z.string().min(1),
      whatSurprised: z.string().optional(),
      whatWorked: z.string().optional(),
      whatDidnt: z.string().optional(),
      whatToChange: z.string().optional(),
      outcome: z.enum(["win", "partial", "loss", "unclear"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Load session for context
      const sessionRows = await db.select().from(playbookSessions)
        .where(eq(playbookSessions.id, input.sessionId)).limit(1);
      const session = sessionRows[0];
      if (!session || session.userId !== ctx.user.id)
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

      // Generate LLM reflection insight
      let reflectionInsight = "";
      try {
        const insightResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an elite executive coach. The leader has just completed a difficult leadership situation and is reflecting on it. 
Generate a concise, insightful coaching observation (3–4 sentences) that:
1. Acknowledges what they learned
2. Connects it to a pattern or growth edge
3. Suggests one specific behaviour to strengthen for next time
Be direct, warm, and executive-grade. Do not be generic.`,
            },
            {
              role: "user",
              content: `Situation: ${session.situationText}
Playbook type: ${session.playbookType}
Outcome: ${input.outcome}
What happened: ${input.whatHappened}
What surprised me: ${input.whatSurprised ?? "Not shared"}
What worked: ${input.whatWorked ?? "Not shared"}
What didn't work: ${input.whatDidnt ?? "Not shared"}
What I'd change: ${input.whatToChange ?? "Not shared"}`,
            },
          ],
        });
        reflectionInsight = (insightResult as any)?.content ?? (insightResult as any)?.choices?.[0]?.message?.content ?? "";
      } catch {
        reflectionInsight = "Your reflection has been saved. Review it before your next similar situation.";
      }

      // Insert reflection
      const [reflection] = await db.insert(playbookReflections).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        whatHappened: input.whatHappened,
        whatSurprised: input.whatSurprised,
        whatWorked: input.whatWorked,
        whatDidnt: input.whatDidnt,
        whatToChange: input.whatToChange,
        outcome: input.outcome,
        reflectionInsight,
      }).$returningId();

      // Update pattern intelligence with outcome
      const classification = session.classification as any;
      await updatePatterns(db, ctx.user.id, classification, input.outcome);

      return { reflectionId: reflection.id, reflectionInsight };
    }),

  // ── getPatterns ──────────────────────────────────────────────────────────────
  getPatterns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const rows = await db.select().from(playbookPatterns)
        .where(eq(playbookPatterns.userId, ctx.user.id)).limit(1);

      return rows[0] ?? null;
    }),
});

// ─── Pattern Intelligence Helper ─────────────────────────────────────────────
async function updatePatterns(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  classification: any,
  outcome: string | null
) {
  if (!db || !classification) return;

  const existing = await db.select().from(playbookPatterns)
    .where(eq(playbookPatterns.userId, userId)).limit(1);

  const current = existing[0];
  const primarySituation = classification.primarySituation ?? "Unknown";
  const competencies: string[] = classification.competencies ?? [];

  // Update situation frequency
  const freq = (current?.situationFrequency as Record<string, number>) ?? {};
  freq[primarySituation] = (freq[primarySituation] ?? 0) + 1;

  // Update competency signals
  const signals = (current?.competencySignals as Record<string, { count: number; wins: number }>) ?? {};
  for (const comp of competencies) {
    if (!signals[comp]) signals[comp] = { count: 0, wins: 0 };
    signals[comp].count += 1;
    if (outcome === "win") signals[comp].wins += 1;
  }

  const totalSessions = (current?.totalSessions ?? 0) + 1;
  const totalReflections = outcome !== null ? (current?.totalReflections ?? 0) + 1 : (current?.totalReflections ?? 0);

  if (current) {
    await db.update(playbookPatterns)
      .set({ situationFrequency: freq, competencySignals: signals, totalSessions, totalReflections })
      .where(eq(playbookPatterns.userId, userId));
  } else {
    await db.insert(playbookPatterns).values({
      userId,
      situationFrequency: freq,
      competencySignals: signals,
      totalSessions,
      totalReflections,
    });
  }
}
