import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { launchInterviewSessions, launchUserProgress } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const INTERVIEW_TYPES = {
  hr: { label: "HR / Screening", questions: 6, xp: 75, description: "Common HR questions about your background, goals, and fit" },
  behavioural: { label: "Behavioural (STAR)", questions: 6, xp: 75, description: "Situation-Task-Action-Result structured questions" },
  technical: { label: "Technical", questions: 5, xp: 100, description: "Role-specific technical and problem-solving questions" },
  case: { label: "Case Study", questions: 4, xp: 100, description: "Business problem-solving and analytical thinking" },
  presentation: { label: "Presentation / Communication", questions: 5, xp: 75, description: "Communication skills, storytelling, and presence" },
} as const;

export const launchInterviewRouter = router({
  getTypes: protectedProcedure.query(() => {
    return Object.entries(INTERVIEW_TYPES).map(([id, config]) => ({ id, ...config }));
  }),

  startSession: protectedProcedure
    .input(z.object({
      interviewType: z.enum(["hr", "behavioural", "technical", "case", "presentation"]),
      targetRole: z.string().optional(),
      targetCompany: z.string().optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const typeConfig = INTERVIEW_TYPES[input.interviewType];
      const openingPrompt = `You are an experienced interviewer conducting a ${typeConfig.label} interview${input.targetRole ? ` for a ${input.targetRole} role` : ""}${input.targetCompany ? ` at ${input.targetCompany}` : ""}. Difficulty: ${input.difficulty}. Ask Question 1 of ${typeConfig.questions}. Be direct and professional. Just ask the question — no preamble.`;
      const result = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "user", content: openingPrompt }], max_tokens: 300 });
      const rawContent = result?.choices?.[0]?.message?.content;
      const openingQuestion = typeof rawContent === "string" ? rawContent.trim() : "Tell me about yourself and why you're interested in this role.";
      const initialMessages = [{ role: "interviewer", content: openingQuestion, timestamp: new Date().toISOString(), questionIndex: 1 }];
      const [inserted] = await db.insert(launchInterviewSessions).values({
        userId: ctx.user.id,
        interviewType: input.interviewType,
        targetRole: input.targetRole || null,
        targetCompany: input.targetCompany || null,
        difficulty: input.difficulty,
        messages: initialMessages,
        xpEarned: 0,
        status: "in_progress",
      });
      return { sessionId: (inserted as { insertId: number }).insertId, firstQuestion: openingQuestion, totalQuestions: typeConfig.questions, messages: initialMessages };
    }),

  sendMessage: protectedProcedure
    .input(z.object({ sessionId: z.number(), answer: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [session] = await db.select().from(launchInterviewSessions).where(eq(launchInterviewSessions.id, input.sessionId)).limit(1);
      if (!session || session.userId !== ctx.user.id) throw new Error("Session not found");
      if (session.status === "completed") throw new Error("Session already completed");
      const typeConfig = INTERVIEW_TYPES[session.interviewType as keyof typeof INTERVIEW_TYPES];
      const messages = (session.messages as Array<{ role: string; content: string; timestamp: string; questionIndex?: number }>) || [];
      const questionCount = messages.filter((m) => m.role === "interviewer" && (m as { questionIndex?: number }).questionIndex).length;
      const updatedMessages = [...messages, { role: "candidate", content: input.answer, timestamp: new Date().toISOString() }];

      if (questionCount >= typeConfig.questions) {
        const transcript = updatedMessages.map((m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n\n");
        const debriefPrompt = `You are an expert interview coach. Analyse this ${typeConfig.label} interview transcript and return ONLY valid JSON (no markdown):\n{"overallScore":<0-100>,"dimensionScores":{"clarity":<0-100>,"relevance":<0-100>,"confidence":<0-100>,"structure":<0-100>},"feedback":{"strengths":["...","...","..."],"improvements":["...","..."],"nextSteps":["...","...","..."]},"summary":"<2-3 sentence assessment>"}\n\nTranscript:\n${transcript}`;
        const debriefResult = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "user", content: debriefPrompt }], max_tokens: 800 });
        const rawDebrief = debriefResult?.choices?.[0]?.message?.content;
        const debriefText = typeof rawDebrief === "string" ? rawDebrief.trim() : "{}";
        let feedback = { strengths: [] as string[], improvements: [] as string[], nextSteps: [] as string[] };
        let overallScore = 70;
        let dimensionScores: Record<string, number> = {};
        try { const p = JSON.parse(debriefText); overallScore = p.overallScore ?? 70; dimensionScores = p.dimensionScores ?? {}; feedback = p.feedback ?? feedback; } catch { /* defaults */ }
        const xpEarned = typeConfig.xp;
        await db.update(launchInterviewSessions).set({ messages: updatedMessages, overallScore, dimensionScores, feedback, xpEarned, status: "completed", completedAt: new Date() }).where(eq(launchInterviewSessions.id, input.sessionId));
        const [existing] = await db.select().from(launchUserProgress).where(eq(launchUserProgress.userId, ctx.user.id)).limit(1);
        if (existing) await db.update(launchUserProgress).set({ totalXp: (existing.totalXp || 0) + xpEarned }).where(eq(launchUserProgress.userId, ctx.user.id));
        return { isComplete: true as const, overallScore, dimensionScores, feedback, xpEarned, messages: updatedMessages };
      } else {
        const nextQuestionNum = questionCount + 1;
        const transcript = updatedMessages.filter((m) => m.role === "interviewer" && (m as { questionIndex?: number }).questionIndex).map((m, i) => `Q${i + 1}: ${m.content}`).join("\n");
        const nextQPrompt = `You are conducting a ${typeConfig.label} interview${session.targetRole ? ` for a ${session.targetRole} role` : ""}.\nQuestions so far:\n${transcript}\nCandidate just answered: "${input.answer}"\nAsk Question ${nextQuestionNum} of ${typeConfig.questions}. Build naturally on the conversation. Just ask the question.`;
        const nextQResult = await invokeLLM({ model: "claude-haiku-4-5", messages: [{ role: "user", content: nextQPrompt }], max_tokens: 300 });
        const rawNextQ = nextQResult?.choices?.[0]?.message?.content;
        const nextQuestion = typeof rawNextQ === "string" ? rawNextQ.trim() : `Question ${nextQuestionNum}: Tell me more.`;
        const finalMessages = [...updatedMessages, { role: "interviewer", content: nextQuestion, timestamp: new Date().toISOString(), questionIndex: nextQuestionNum }];
        await db.update(launchInterviewSessions).set({ messages: finalMessages }).where(eq(launchInterviewSessions.id, input.sessionId));
        return { isComplete: false as const, questionNumber: nextQuestionNum, totalQuestions: typeConfig.questions, messages: finalMessages };
      }
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(launchInterviewSessions).where(eq(launchInterviewSessions.userId, ctx.user.id)).orderBy(desc(launchInterviewSessions.createdAt)).limit(10);
  }),

  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const [session] = await db.select().from(launchInterviewSessions).where(eq(launchInterviewSessions.id, input.sessionId)).limit(1);
      if (!session || session.userId !== ctx.user.id) return null;
      return session;
    }),
});
