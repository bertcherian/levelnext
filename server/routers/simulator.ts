import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { extractJsonObject, invokeLLM } from "../_core/llm";
import { academyProgressEvents, simSessions } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { getOrCreateAcademyProfile } from "../academyService";
import { getPersonaRepPracticeContext, linkPersonaSimulatorSession } from "../personaBuilder";

const PLATFORM_CONTEXT: Record<string, { label: string; coachingStyle: string; behaviourDimensions: string[] }> = {
  leadership: {
    label: "Leadership Intelligence",
    coachingStyle: "Executive coaching — focus on strategic influence, presence, and systemic thinking",
    behaviourDimensions: ["Executive Presence", "Strategic Clarity", "Emotional Regulation", "Influence & Persuasion", "Listening Quality"],
  },
  manager: {
    label: "Manager Effectiveness",
    coachingStyle: "Management coaching — focus on accountability, feedback quality, and team dynamics",
    behaviourDimensions: ["Clarity of Message", "Empathy & Tone", "Accountability Language", "Active Listening", "Outcome Focus"],
  },
  career: {
    label: "Career Transition Intelligence",
    coachingStyle: "Career coaching — focus on positioning, confidence, negotiation, and narrative",
    behaviourDimensions: ["Confidence & Presence", "Value Articulation", "Negotiation Skill", "Narrative Clarity", "Resilience Under Pressure"],
  },
  young: {
    label: "Young Talent Platform",
    coachingStyle: "Early career coaching — focus on communication, initiative, and professional presence",
    behaviourDimensions: ["Professional Communication", "Initiative & Proactivity", "Listening & Curiosity", "Clarity of Thought", "Confidence"],
  },
};

function extractContent(raw: string | Array<{ text?: string } | unknown>): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.map((c: any) => c.text ?? "").join("");
  return "";
}

type InferredScenario = {
  conversationType: string;
  stakeholder: string;
  objective: string;
  expectedChallenge: string;
  difficulty: number;
  estimatedMinutes: number;
  characterName: string;
  characterStyle: string;
  followUpQuestion: string | null;
};

function scenarioText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function scenarioInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric)
    ? Math.round(Math.min(max, Math.max(min, numeric)))
    : fallback;
}

const TTS_PROVIDER_TIMEOUT_MS = 12_000;

export async function requestTts(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_PROVIDER_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new TRPCError({
        code: "TIMEOUT",
        message: "Voice preview took too long. Please try again.",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalises an LLM scenario response, including responses that contain a
 * markdown fence or a brief preamble before the requested JSON object.
 */
export function parseInferredScenarioResponse(raw: string): InferredScenario | null {
  const parsed = extractJsonObject<Record<string, unknown> | null>(
    raw,
    null,
    "simulator.inferScenario"
  );

  if (!parsed || Array.isArray(parsed)) return null;

  return {
    conversationType: scenarioText(parsed.conversationType, "Leadership Conversation"),
    stakeholder: scenarioText(parsed.stakeholder, "Your counterpart"),
    objective: scenarioText(parsed.objective, "Achieve a positive outcome"),
    expectedChallenge: scenarioText(parsed.expectedChallenge, "Expect pushback and probing questions"),
    difficulty: scenarioInteger(parsed.difficulty, 3, 1, 5),
    estimatedMinutes: scenarioInteger(parsed.estimatedMinutes, 6, 4, 10),
    characterName: scenarioText(parsed.characterName, "Alex"),
    characterStyle: scenarioText(parsed.characterStyle, "Professional and direct"),
    followUpQuestion: typeof parsed.followUpQuestion === "string" && parsed.followUpQuestion.trim().length > 0
      ? parsed.followUpQuestion.trim()
      : null,
  };
}

export const simulatorRouter = router({

  inferScenario: protectedProcedure
    .input(z.object({
      prompt: z.string().min(3).max(500),
      platform: z.enum(["leadership", "manager", "career", "young"]),
    }))
    .mutation(async ({ input }) => {
      const ctx_platform = PLATFORM_CONTEXT[input.platform];
      const result = await invokeLLM({
        model: "claude-haiku-4-5",
        maxTokens: 500,
        messages: [
          {
            role: "system",
            content: `You are an AI scenario designer for a leadership practice simulator.
Platform: ${ctx_platform.label}
Coaching style: ${ctx_platform.coachingStyle}

Given a user's free-form description of a conversation they want to practise, generate a concise scenario summary.
Return ONLY valid JSON with this exact structure:
{
  "conversationType": "short label e.g. Salary Negotiation",
  "stakeholder": "who they are speaking with e.g. Your VP",
  "objective": "one sentence what the user wants to achieve",
  "expectedChallenge": "one sentence what resistance or difficulty to expect",
  "difficulty": 3,
  "estimatedMinutes": 6,
  "characterName": "first name of the AI character e.g. Priya",
  "characterStyle": "brief personality note e.g. Analytical, data-driven, asks probing questions",
  "followUpQuestion": null
}
difficulty is 1-5. estimatedMinutes is 4-10.
followUpQuestion: if you genuinely need one clarification, include a short question string. Otherwise null.`,
          },
          { role: "user", content: `I want to practise: "${input.prompt}"` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "practice_scenario",
            strict: true,
            schema: {
              type: "object",
              properties: {
                conversationType: { type: "string" },
                stakeholder: { type: "string" },
                objective: { type: "string" },
                expectedChallenge: { type: "string" },
                difficulty: { type: "integer", minimum: 1, maximum: 5 },
                estimatedMinutes: { type: "integer", minimum: 4, maximum: 10 },
                characterName: { type: "string" },
                characterStyle: { type: "string" },
                followUpQuestion: { type: ["string", "null"] },
              },
              required: [
                "conversationType",
                "stakeholder",
                "objective",
                "expectedChallenge",
                "difficulty",
                "estimatedMinutes",
                "characterName",
                "characterStyle",
                "followUpQuestion",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const text = extractContent(result.choices[0]?.message?.content ?? "");
      const scenario = parseInferredScenarioResponse(text);
      if (!scenario) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate scenario" });
      }

      return scenario;
    }),

  startSession: protectedProcedure
    .input(z.object({
      platform: z.enum(["leadership", "manager", "career", "young"]),
      userPrompt: z.string(),
      conversationType: z.string(),
      stakeholder: z.string(),
      objective: z.string(),
      expectedChallenge: z.string(),
      difficulty: z.number().min(1).max(5),
      estimatedMinutes: z.number().min(4).max(10),
      characterName: z.string(),
      characterStyle: z.string(),
      voice: z.enum(["nova", "shimmer", "alloy", "fable", "shubh", "sumit", "simran", "ishita"]).default("shubh"),
      personaRepId: z.number().int().positive().optional(),
      personaJourneyId: z.number().int().positive().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
      try {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const ctx_platform = PLATFORM_CONTEXT[input.platform];
      const personaContext = input.personaRepId ? await getPersonaRepPracticeContext(ctx.user.id, input.personaRepId) : null;
      // Ensure integers (LLM may return floats)
      const difficulty = Math.round(input.difficulty);
      const estimatedMinutes = Math.round(input.estimatedMinutes);
      const openingResult = await invokeLLM({
        model: "claude-haiku-4-5",
        messages: [
          {
            role: "system",
                        content: `You are ${input.characterName}, playing the role of ${input.stakeholder} in a realistic leadership practice simulation.
The USER is the MANAGER or leader conducting this conversation. YOU are the ${input.stakeholder} — the person being managed, coached, or spoken with.
Character style: ${input.characterStyle}
Scenario: ${input.conversationType}
What the manager (user) wants to achieve: ${input.objective}
How you (${input.characterName}) will make it challenging: ${input.expectedChallenge}
${personaContext ? `Persona Rep to rehearse: ${personaContext.rep.instruction}\nTrigger: ${personaContext.rep.trigger}\nSuccess signal: ${personaContext.rep.successSignal}` : ""}

IMPORTANT: You are NOT the manager. You are the ${input.stakeholder}. React to the manager, do not lead the conversation.
Write a single opening line (1-2 sentences) as ${input.characterName} to set the scene — you are waiting for the manager to address you, perhaps slightly guarded or neutral. Do not take charge. Do not break the fourth wall.`,
          },
          { role: "user", content: "Begin." },
        ],
      });

      const opening = extractContent(openingResult.choices[0].message.content ?? "Hi, I'm ready when you are.");
      const now = Date.now();
      const messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }> = [
        { role: "assistant", content: opening, timestamp: now },
      ];

      const result = await db.insert(simSessions).values({
        userId: ctx.user.id,
        personaRepId: personaContext?.rep.id ?? input.personaRepId ?? null,
        personaJourneyId: personaContext?.journey?.id ?? input.personaJourneyId ?? null,
        personaDayNumber: personaContext?.day?.dayNumber ?? null,
        platform: input.platform,
        userPrompt: input.userPrompt,
        conversationType: input.conversationType,
        stakeholder: input.stakeholder,
        objective: input.objective,
        expectedChallenge: input.expectedChallenge,
        difficulty,
        estimatedMinutes,
        characterName: input.characterName,
        characterStyle: input.characterStyle,
        voice: input.voice,
        messages,
        status: "active",
      }).$returningId();

      const sessionId = result[0].id;
      if (personaContext?.rep.id) await linkPersonaSimulatorSession(ctx.user.id, personaContext.rep.id, sessionId);
      return { sessionId, opening };
      } catch (err: any) {
        console.error("[simulator.startSession] ERROR:", err?.message ?? err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message ?? "Session start failed" });
      }
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number().int(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Session already completed" });

      const ctx_platform = PLATFORM_CONTEXT[session.platform as string] ?? PLATFORM_CONTEXT.leadership;
      const existingMessages = (session.messages ?? []) as Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
      const now = Date.now();
      const updatedMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }> = [
        ...existingMessages,
        { role: "user", content: input.message, timestamp: now },
      ];

      const llmMessages = [
        {
          role: "system" as const,
                    content: `You are ${session.characterName}, playing the role of ${session.stakeholder} in a realistic leadership practice simulation.
The USER is the MANAGER or leader. YOU are the ${session.stakeholder} — the person being managed, coached, or spoken with. Never act as the manager.
Character style: ${session.characterStyle}
Scenario: ${session.conversationType}
What the manager (user) wants to achieve: ${session.objective}
How you (${session.characterName}) will make it challenging: ${session.expectedChallenge}
Platform context: ${ctx_platform.coachingStyle}
Difficulty level: ${session.difficulty}/5

RULES:
- You are ALWAYS the ${session.stakeholder}, never the manager.
- React to what the user says — do not initiate agenda items or take control.
- Stay in character: ${session.characterStyle}
- Be realistic, occasionally challenging, and human.
- Do not provide coaching feedback or break the fourth wall.
- Keep responses concise (2-4 sentences).`,
        },
        ...existingMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: input.message },
      ];

      const replyResult = await invokeLLM({ model: "claude-haiku-4-5", messages: llmMessages });
      const reply = extractContent(replyResult.choices[0].message.content ?? "I see. Go on.");
      const finalMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }> = [
        ...updatedMessages,
        { role: "assistant", content: reply, timestamp: Date.now() },
      ];

      await db.update(simSessions).set({ messages: finalMessages }).where(eq(simSessions.id, input.sessionId));
      return { reply };
    }),

  endSession: protectedProcedure
    .input(z.object({
      sessionId: z.number().int(),
      phraseTelemetry: z.array(z.object({
        phraseKey: z.string().trim().min(1).max(40),
        matched: z.boolean(),
        matchCount: z.number().int().min(0).max(50),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });

      const ctx_platform = PLATFORM_CONTEXT[session.platform as string] ?? PLATFORM_CONTEXT.leadership;
      const messages = (session.messages ?? []) as Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
      const userTurns = messages.filter(m => m.role === "user").map(m => m.content).join("\n\n");

      const debriefResult = await invokeLLM({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a world-class executive coach providing a post-session debrief for a leadership practice simulation.
Platform: ${ctx_platform.label}
Scenario: ${session.conversationType}
Objective: ${session.objective}
Behaviour dimensions to score: ${ctx_platform.behaviourDimensions.join(", ")}

Analyse the user's messages and return ONLY valid JSON:
{
  "overallScore": 72,
  "behaviourScores": [
    { "label": "Executive Presence", "score": 7, "max": 10 }
  ],
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "coachingInsights": [
    { "moment": "When you said X", "tryInstead": "Try saying Y instead" }
  ],
  "keyTakeaway": "One sentence the user should remember from this session."
}
Be specific, honest, and constructive. Reference actual things the user said.`,
          },
          { role: "user", content: `User's messages:\n\n${userTurns || "(No messages yet)"}` },
        ],
      });

      try {
        const text = extractContent(debriefResult.choices[0].message.content ?? "{}");
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const debrief = JSON.parse(clean);

        await db.update(simSessions).set({
          status: "completed",
          overallScore: debrief.overallScore,
          behaviourScores: debrief.behaviourScores,
          strengths: debrief.strengths,
          improvements: debrief.improvements,
          coachingInsights: debrief.coachingInsights,
          keyTakeaway: debrief.keyTakeaway,
          phraseTelemetry: input.phraseTelemetry ?? null,
          completedAt: new Date(),
        }).where(eq(simSessions.id, input.sessionId));

        try {
          const academyProfile = await getOrCreateAcademyProfile(ctx.user.id);
          await db.insert(academyProgressEvents).values({
            profileId: academyProfile.id,
            eventType: "simulator_practice_completed",
            objectKey: "voice_simulator_practice",
            dimension: "apply",
            evidenceRef: {
              sessionId: input.sessionId,
              platform: session.platform,
              overallScore: debrief.overallScore,
              completedAt: new Date().toISOString(),
            },
          });
        } catch (academyBridgeError) {
          console.warn("[AcademySimulatorBridge] Failed to record Passport timeline event:", academyBridgeError);
        }

        try {
          const { logSimulatorEvidenceIfApplicable } = await import("../narrativeIntelligence");
          await logSimulatorEvidenceIfApplicable(ctx.user.id, input.sessionId, debrief);
        } catch (bridgeErr) {
          console.warn("[NarrativeSimulatorBridge] Failed to record simulator evidence:", bridgeErr);
        }

        return { debrief, sessionId: input.sessionId };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate debrief" });
      }
    }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  generateActionPlan: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions).where(eq(simSessions.id, input.sessionId)).limit(1);
      const session = rows[0];
      if (!session || session.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (session.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Session not yet completed" });

      const ctx_platform = PLATFORM_CONTEXT[session.platform as string] ?? PLATFORM_CONTEXT.leadership;
      const behaviourScores = (session.behaviourScores ?? []) as Array<{ label: string; score: number; max: number }>;
      const improvements = (session.improvements ?? []) as string[];
      const coachingInsights = (session.coachingInsights ?? []) as Array<{ moment: string; tryInstead: string }>;
      const strengths = (session.strengths ?? []) as string[];

      const result = await invokeLLM({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a world-class executive coach creating a personalised action plan after a practice simulation debrief.
Platform: ${ctx_platform.label}
Scenario: ${session.conversationType}
Objective: ${session.objective}

Based on the debrief data below, create a concise, actionable 7-day practice plan.
Return ONLY valid JSON with this exact structure:
{
  "headline": "Short motivating headline for the plan (e.g. 'Your 7-Day Executive Presence Sprint')",
  "summary": "2-3 sentence personalised summary of what this plan addresses and why it matters for them",
  "actions": [
    {
      "day": "Day 1–2",
      "title": "Short action title",
      "description": "Specific, concrete action they can take. Reference their actual behaviour from the session.",
      "category": "practice" | "reflection" | "reading" | "conversation"
    }
  ],
  "weeklyCommitment": "One sentence on the minimum weekly commitment (e.g. '15 minutes daily')",
  "successIndicator": "How they will know they have improved — one concrete, observable behaviour"
}
Generate 4–5 actions. Be specific, honest, and reference actual things from the debrief. Avoid generic advice.`,
          },
          {
            role: "user",
            content: `Debrief data:

Overall score: ${session.overallScore}/100
Key takeaway: ${session.keyTakeaway ?? "N/A"}

Behaviour scores:\n${behaviourScores.map(b => `- ${b.label}: ${b.score}/${b.max}`).join("\n")}

Strengths:\n${strengths.map(s => `- ${s}`).join("\n")}

Areas to develop:\n${improvements.map(s => `- ${s}`).join("\n")}

Coaching insights:\n${coachingInsights.map(c => `- Said: "${c.moment}" → Try: "${c.tryInstead}"`).join("\n")}`,
          },
        ],
      });

      try {
        const text = extractContent(result.choices[0].message.content ?? "{}");
        const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const plan = JSON.parse(clean);
        return {
          headline: plan.headline ?? "Your Personalised Practice Plan",
          summary: plan.summary ?? "",
          actions: (plan.actions ?? []) as Array<{ day: string; title: string; description: string; category: string }>,
          weeklyCommitment: plan.weeklyCommitment ?? "",
          successIndicator: plan.successIndicator ?? "",
        };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate action plan" });
      }
    }),

  tts: protectedProcedure
    .input(z.object({
      text: z.string().min(1).max(1000),
      voice: z.enum(["nova", "shimmer", "alloy", "fable", "shubh", "sumit", "simran", "ishita"]).default("nova"),
    }))
    .mutation(async ({ input }) => {
      const SARVAM_VOICES = ["shubh", "sumit", "simran", "ishita"];
      const isSarvam = SARVAM_VOICES.includes(input.voice);

      if (isSarvam) {
        // Sarvam AI TTS
        if (!ENV.sarvamApiKey) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sarvam API key not configured" });
        }
        const response = await requestTts("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": ENV.sarvamApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [input.text],
            target_language_code: "en-IN",
            speaker: input.voice,
            model: "bulbul:v3-beta",
          }),
        });
        if (!response.ok) {
          const err = await response.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Sarvam TTS failed: ${err.substring(0, 100)}` });
        }
        const data = await response.json() as { audios?: string[] };
        if (typeof data.audios?.[0] !== "string" || data.audios[0].length === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sarvam TTS returned no playable audio" });
        }
        // Sarvam returns base64 WAV audio
        return { audioBase64: data.audios[0], mimeType: "audio/wav" };
      } else {
        // OpenAI TTS
        if (!ENV.openAiApiKey) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "OpenAI API key not configured" });
        }
        const response = await requestTts("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ENV.openAiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: input.text,
            voice: input.voice,
            response_format: "mp3",
          }),
        });
        if (!response.ok) {
          const err = await response.text();
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `OpenAI TTS failed: ${err.substring(0, 100)}` });
        }
        const audioBuffer = await response.arrayBuffer();
        if (audioBuffer.byteLength === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "OpenAI TTS returned no playable audio" });
        }
        const base64 = Buffer.from(audioBuffer).toString("base64");
        return { audioBase64: base64, mimeType: "audio/mpeg" };
      }
    }),

  listSessions: protectedProcedure
    .input(z.object({ platform: z.enum(["leadership", "manager", "career", "young"]).optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(simSessions)
        .where(eq(simSessions.userId, ctx.user.id))
        .orderBy(desc(simSessions.createdAt))
        .limit(20);
      if (input.platform) return rows.filter(r => r.platform === input.platform);
      return rows;
    }),
});
