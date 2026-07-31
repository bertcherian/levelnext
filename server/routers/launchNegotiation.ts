import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchNegotiationSessions, launchUserProgress } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const NEGOTIATION_SCENARIOS = [
  { id: "first_job", title: "First Job Offer", description: "You've received your first job offer. The salary is below your expectation.", initialOffer: "₹4.5 LPA", targetOffer: "₹5.5 LPA", context: "Fresh graduate, 0-1 years experience, tech/consulting role", difficulty: "beginner" },
  { id: "counter_offer", title: "Counter Offer Negotiation", description: "You have a competing offer and want to negotiate with your current employer.", initialOffer: "₹8 LPA", targetOffer: "₹10 LPA", context: "2-3 years experience, you have a competing offer for ₹10 LPA", difficulty: "intermediate" },
  { id: "promotion_raise", title: "Promotion & Raise", description: "You've been performing well and want to negotiate a promotion and salary increase.", initialOffer: "₹12 LPA", targetOffer: "₹15 LPA", context: "3-5 years experience, strong performance record, seeking promotion", difficulty: "intermediate" },
  { id: "senior_role", title: "Senior Role Negotiation", description: "Negotiating for a senior position with comprehensive compensation package.", initialOffer: "₹20 LPA", targetOffer: "₹26 LPA", context: "5+ years experience, leadership role, includes bonus and equity discussion", difficulty: "advanced" },
  { id: "remote_flexibility", title: "Remote Work & Benefits", description: "Negotiate for remote work flexibility and additional benefits beyond salary.", initialOffer: "₹10 LPA, office-based", targetOffer: "₹11 LPA + hybrid work", context: "Mid-level role, negotiating work arrangement and benefits package", difficulty: "beginner" },
];

export const launchNegotiationRouter = router({
  getScenarios: protectedProcedure.query(() => NEGOTIATION_SCENARIOS),

  startSession: protectedProcedure
    .input(z.object({
      scenarioId: z.string(),
      targetRole: z.string().optional(),
      targetCompany: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const scenario = NEGOTIATION_SCENARIOS.find((s) => s.id === input.scenarioId);
      if (!scenario) throw new Error("Scenario not found");
      const openingPrompt = `You are an HR manager in a salary negotiation. Scenario: ${scenario.title}. Context: ${scenario.context}. You are offering ${scenario.initialOffer}. Open the negotiation by presenting the offer and asking for the candidate's thoughts. Be realistic and professional. Keep it to 2-3 sentences.`;
      const result = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "user", content: openingPrompt }], max_tokens: 300 });
      const rawContent = result?.choices?.[0]?.message?.content;
      const openingMessage = typeof rawContent === "string" ? rawContent.trim() : `We'd like to offer you ${scenario.initialOffer}. What are your thoughts?`;
      const initialMessages = [{ role: "employer", content: openingMessage, timestamp: new Date().toISOString() }];
      const [inserted] = await db.insert(launchNegotiationSessions).values({
        userId: ctx.user.id,
        scenarioId: input.scenarioId,
        scenarioTitle: scenario.title,
        targetRole: input.targetRole || null,
        targetCompany: input.targetCompany || null,
        initialOffer: scenario.initialOffer,
        messages: initialMessages,
        xpEarned: 0,
        status: "in_progress",
      });
      return { sessionId: (inserted as { insertId: number }).insertId, openingMessage, scenario, messages: initialMessages };
    }),

  sendMessage: protectedProcedure
    .input(z.object({ sessionId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [session] = await db.select().from(launchNegotiationSessions).where(eq(launchNegotiationSessions.id, input.sessionId)).limit(1);
      if (!session || session.userId !== ctx.user.id) throw new Error("Session not found");
      if (session.status === "completed") throw new Error("Session already completed");
      const scenario = NEGOTIATION_SCENARIOS.find((s) => s.id === session.scenarioId);
      const messages = (session.messages as Array<{ role: string; content: string; timestamp: string }>) || [];
      const exchangeCount = messages.filter((m) => m.role === "candidate").length;
      const updatedMessages = [...messages, { role: "candidate", content: input.message, timestamp: new Date().toISOString() }];

      if (exchangeCount >= 4) {
        const transcript = updatedMessages.map((m) => `${m.role === "employer" ? "Employer" : "Candidate"}: ${m.content}`).join("\n\n");
        const debriefPrompt = `You are an expert negotiation coach. Analyse this salary negotiation and return ONLY valid JSON (no markdown):\n{"finalOutcome":"<what was agreed>","outcomeScore":<0-100>,"feedback":{"strengths":["...","..."],"improvements":["...","..."],"tactics":["...","..."]},"closingMessage":"<2-3 sentence wrap-up as employer>"}\n\nScenario: ${scenario?.title}. Initial: ${scenario?.initialOffer}. Target: ${scenario?.targetOffer}.\n\nTranscript:\n${transcript}`;
        const debriefResult = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "user", content: debriefPrompt }], max_tokens: 700 });
        const rawDebrief = debriefResult?.choices?.[0]?.message?.content;
        const debriefText = typeof rawDebrief === "string" ? rawDebrief.trim() : "{}";
        let feedback = { strengths: [] as string[], improvements: [] as string[], tactics: [] as string[] };
        let outcomeScore = 65;
        let finalOutcome = "Negotiation concluded";
        let closingMessage = "Thank you for the discussion. We'll be in touch.";
        try { const p = JSON.parse(debriefText); outcomeScore = p.outcomeScore ?? 65; finalOutcome = p.finalOutcome ?? finalOutcome; feedback = p.feedback ?? feedback; closingMessage = p.closingMessage ?? closingMessage; } catch { /* defaults */ }
        const xpEarned = 100;
        const finalMessages = [...updatedMessages, { role: "employer", content: closingMessage, timestamp: new Date().toISOString() }];
        await db.update(launchNegotiationSessions).set({ messages: finalMessages, finalOutcome, outcomeScore, feedback, xpEarned, status: "completed", completedAt: new Date() }).where(eq(launchNegotiationSessions.id, input.sessionId));
        const [existing] = await db.select().from(launchUserProgress).where(eq(launchUserProgress.userId, ctx.user.id)).limit(1);
        if (existing) await db.update(launchUserProgress).set({ totalXp: (existing.totalXp || 0) + xpEarned }).where(eq(launchUserProgress.userId, ctx.user.id));
        return { isComplete: true as const, outcomeScore, finalOutcome, feedback, xpEarned, messages: finalMessages };
      } else {
        const transcript = updatedMessages.map((m) => `${m.role === "employer" ? "Employer" : "Candidate"}: ${m.content}`).join("\n\n");
        const responsePrompt = `You are an HR manager in a salary negotiation. Scenario: ${scenario?.title}. Initial offer: ${scenario?.initialOffer}.\nTranscript:\n${transcript}\nRespond as the employer. Be realistic — make small concessions but not immediately agree to everything. Keep it to 2-3 sentences.`;
        const responseResult = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "user", content: responsePrompt }], max_tokens: 300 });
        const rawResponse = responseResult?.choices?.[0]?.message?.content;
        const employerResponse = typeof rawResponse === "string" ? rawResponse.trim() : "I appreciate your perspective. Let me consider what we can do.";
        const finalMessages = [...updatedMessages, { role: "employer", content: employerResponse, timestamp: new Date().toISOString() }];
        await db.update(launchNegotiationSessions).set({ messages: finalMessages }).where(eq(launchNegotiationSessions.id, input.sessionId));
        return { isComplete: false as const, employerResponse, exchangeCount: exchangeCount + 1, messages: finalMessages };
      }
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(launchNegotiationSessions).where(eq(launchNegotiationSessions.userId, ctx.user.id)).orderBy(desc(launchNegotiationSessions.createdAt)).limit(10);
  }),
});
