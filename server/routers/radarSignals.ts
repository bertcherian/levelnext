import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  opportunityRadarSignals,
  opportunityUniverse,
  careerProfiles,
} from "../../drizzle/schema";

// ─── Opportunity Radar Signals Router ────────────────────────────────────────
// Priority 3 of the Executive Opportunity System™
// Generates AI signals for target companies and surfaces them in a Radar Feed

export const radarSignalsRouter = router({
  // ─── List signals ─────────────────────────────────────────────────────────

  listSignals: protectedProcedure
    .input(
      z.object({
        includesDismissed: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions = [eq(opportunityRadarSignals.userId, ctx.user.id)];
      if (!input.includesDismissed) {
        conditions.push(eq(opportunityRadarSignals.dismissed, false));
      }

      return db
        .select()
        .from(opportunityRadarSignals)
        .where(and(...conditions))
        .orderBy(desc(opportunityRadarSignals.createdAt));
    }),

  // ─── Generate signals for target companies ────────────────────────────────

  generateSignals: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get user's target companies from opportunity universe
    const targetOrgs = await db
      .select({
        id: opportunityUniverse.id,
        companyName: opportunityUniverse.companyName,
        industry: opportunityUniverse.industry,
        companyType: opportunityUniverse.companyType,
        status: opportunityUniverse.status,
      })
      .from(opportunityUniverse)
      .where(eq(opportunityUniverse.userId, ctx.user.id))
      .orderBy(desc(opportunityUniverse.createdAt))
      .limit(10);

    if (targetOrgs.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Add target organisations to your Opportunity Universe first.",
      });
    }

    // Get career profile for context
    const [profile] = await db
      .select()
      .from(careerProfiles)
      .where(eq(careerProfiles.userId, ctx.user.id))
      .limit(1);

    const targetRole = profile?.targetRole ?? "Senior Executive";
    const companyList = targetOrgs.map((o) => `- ${o.companyName} (${o.industry ?? o.companyType ?? "Unknown"})`).join("\n");

    const systemPrompt = `You are an executive intelligence analyst who monitors market signals for senior leaders in active career transitions. Your job is to identify strategic signals at target companies that create windows of opportunity.

For each company listed, generate 1-2 realistic, plausible signals that a ${targetRole} should act on. Return ONLY valid JSON array:
[
  {
    "company": "Company Name",
    "signalType": "hiring|expansion|leadership_change|funding|product_launch|partnership|award",
    "description": "Specific, realistic signal description (2-3 sentences). What happened, why it matters for the leader's target role.",
    "recommendedAction": "Specific action the leader should take within 48-72 hours",
    "urgency": "low|medium|high"
  }
]

Signal types:
- hiring: Company is hiring in the leader's target function
- expansion: Company is expanding into new markets, geographies, or business lines
- leadership_change: New CXO/VP hired, departure, or restructuring
- funding: New funding round, PE investment, or M&A activity
- product_launch: Major product or service announcement
- partnership: Strategic alliance or partnership announced
- award: Industry recognition, ranking, or certification

Generate realistic signals grounded in the company's industry. Prioritise high-urgency signals. Return 1-2 signals per company, maximum 12 total.`;

    const userMessage = `Target companies for ${targetRole}:\n${companyList}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "claude-haiku-4-5",
      maxTokens: 2500,
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText || typeof rawText !== "string") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned empty response" });
    }

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse LLM response" });
    }

    const signals: Array<{
      company: string;
      signalType: string;
      description: string;
      recommendedAction: string;
      urgency: string;
    }> = JSON.parse(jsonMatch[0]);

    const VALID_SIGNAL_TYPES = ["hiring", "expansion", "leadership_change", "funding", "product_launch", "partnership", "award"] as const;
    const VALID_URGENCY = ["low", "medium", "high"] as const;

    // Find matching pipeline IDs
    const orgMap = new Map(targetOrgs.map((o) => [o.companyName.toLowerCase(), o.id]));

    const insertRows = signals
      .filter((s) => VALID_SIGNAL_TYPES.includes(s.signalType as typeof VALID_SIGNAL_TYPES[number]))
      .map((s) => ({
        userId: ctx.user.id,
        opportunityId: orgMap.get(s.company.toLowerCase()) ?? null,
        company: s.company,
        signalType: s.signalType as typeof VALID_SIGNAL_TYPES[number],
        description: s.description,
        recommendedAction: s.recommendedAction,
        urgency: (VALID_URGENCY.includes(s.urgency as typeof VALID_URGENCY[number]) ? s.urgency : "medium") as typeof VALID_URGENCY[number],
        dismissed: false,
      }));

    if (insertRows.length > 0) {
      await db.insert(opportunityRadarSignals).values(insertRows);
    }

    return { generated: insertRows.length };
  }),

  // ─── Dismiss a signal ─────────────────────────────────────────────────────

  dismissSignal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [signal] = await db
        .select({ id: opportunityRadarSignals.id })
        .from(opportunityRadarSignals)
        .where(and(eq(opportunityRadarSignals.id, input.id), eq(opportunityRadarSignals.userId, ctx.user.id)))
        .limit(1);

      if (!signal) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(opportunityRadarSignals)
        .set({ dismissed: true })
        .where(eq(opportunityRadarSignals.id, input.id));

      return { success: true };
    }),

  // ─── Get top signals for Chief of Staff briefing ──────────────────────────

  getTopSignals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select()
      .from(opportunityRadarSignals)
      .where(
        and(
          eq(opportunityRadarSignals.userId, ctx.user.id),
          eq(opportunityRadarSignals.dismissed, false)
        )
      )
      .orderBy(desc(opportunityRadarSignals.createdAt))
      .limit(3);
  }),
});
