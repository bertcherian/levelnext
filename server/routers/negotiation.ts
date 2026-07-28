import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  negotiationSessions,
  careerProfiles,
} from "../../drizzle/schema";

// ─── Negotiation Intelligence Router ─────────────────────────────────────────
// Priority 5 of the Executive Opportunity System™
// Generates offer analysis, negotiation strategy, counter-offer scripts, and decision framework

export const negotiationRouter = router({
  // ─── Get latest session ───────────────────────────────────────────────────

  getLatestSession: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [session] = await db
      .select()
      .from(negotiationSessions)
      .where(eq(negotiationSessions.userId, ctx.user.id))
      .orderBy(desc(negotiationSessions.createdAt))
      .limit(1);

    return session ?? null;
  }),

  // ─── List sessions ────────────────────────────────────────────────────────

  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db
      .select({
        id: negotiationSessions.id,
        role: negotiationSessions.role,
        company: negotiationSessions.company,
        offeredSalary: negotiationSessions.offeredSalary,
        createdAt: negotiationSessions.createdAt,
      })
      .from(negotiationSessions)
      .where(eq(negotiationSessions.userId, ctx.user.id))
      .orderBy(desc(negotiationSessions.createdAt));
  }),

  // ─── Generate negotiation strategy ───────────────────────────────────────

  generateStrategy: protectedProcedure
    .input(
      z.object({
        role: z.string(),
        company: z.string(),
        offeredSalary: z.string().optional(),
        offeredBonus: z.string().optional(),
        offeredEquity: z.string().optional(),
        otherBenefits: z.string().optional(),
        currentSalary: z.string().optional(),
        targetSalary: z.string().optional(),
        marketContext: z.string().optional(),
        yourLeverage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get career profile for context
      const [profile] = await db
        .select()
        .from(careerProfiles)
        .where(eq(careerProfiles.userId, ctx.user.id))
        .limit(1);

      const profileContext = profile
        ? `Career Motivation: ${profile.careerMotivation ?? "Not specified"}
Key Achievements: ${profile.keyAchievements ?? "Not specified"}`
        : "";

      const systemPrompt = `You are an elite executive compensation negotiation advisor who has helped hundreds of senior leaders negotiate packages at Fortune 500 companies, PE-backed firms, and GCCs. You understand Indian executive compensation benchmarks deeply.

Analyse this offer and generate a comprehensive negotiation strategy. Return ONLY valid JSON:
{
  "offerAnalysis": {
    "compensationScore": 7,
    "marketPosition": "Below Market / At Market / Above Market",
    "negotiationRoom": "High / Medium / Low",
    "totalCompValue": "Estimated total annual value",
    "summary": "2-3 sentence honest assessment of the offer"
  },
  "strategy": {
    "whatToAskFor": [
      "Specific ask 1 with framing",
      "Specific ask 2",
      "Specific ask 3"
    ],
    "whatToAccept": [
      "Element you can accept without pushback",
      "Element 2"
    ],
    "walkAwayPoints": [
      "Non-negotiable minimum 1",
      "Non-negotiable 2"
    ],
    "sequencing": "How to sequence the negotiation conversation (2-3 sentences)"
  },
  "counterOfferScripts": [
    {
      "scenario": "Opening counter-offer",
      "script": "Exact words to say (2-3 sentences, professional and confident)"
    },
    {
      "scenario": "If they say the salary is fixed",
      "script": "Exact words to redirect to other elements"
    },
    {
      "scenario": "Closing / accepting with conditions",
      "script": "How to accept while confirming verbal commitments"
    }
  ],
  "decisionFramework": [
    {
      "dimension": "Compensation",
      "score": 7,
      "note": "Brief note on this dimension"
    },
    {
      "dimension": "Growth Opportunity",
      "score": 8,
      "note": "Brief note"
    },
    {
      "dimension": "Company Trajectory",
      "score": 6,
      "note": "Brief note"
    },
    {
      "dimension": "Role Fit",
      "score": 9,
      "note": "Brief note"
    },
    {
      "dimension": "Work-Life Quality",
      "score": 7,
      "note": "Brief note"
    }
  ]
}

Be honest and specific. Use Indian compensation context (₹ LPA). Score compensation fairly against market.`;

      const userMessage = `Role: ${input.role}
Company: ${input.company}
Offered Salary: ₹${input.offeredSalary ?? "Not specified"} LPA
Offered Bonus: ${input.offeredBonus ?? "Not specified"}
Offered Equity: ${input.offeredEquity ?? "Not specified"}
Other Benefits: ${input.otherBenefits ?? "Not specified"}
Current Salary: ₹${input.currentSalary ?? "Not specified"} LPA
Target Salary: ₹${input.targetSalary ?? "Not specified"} LPA
Market Context: ${input.marketContext ?? "Not specified"}
Your Leverage: ${input.yourLeverage ?? "Not specified"}

${profileContext}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "claude-sonnet-4-6",
        maxTokens: 3000,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText || typeof rawText !== "string") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned empty response" });
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse LLM response" });
      }

      const strategyData = JSON.parse(jsonMatch[0]);

      const [inserted] = await db
        .insert(negotiationSessions)
        .values({
          userId: ctx.user.id,
          role: input.role,
          company: input.company,
          offeredSalary: input.offeredSalary,
          offeredBonus: input.offeredBonus,
          offeredEquity: input.offeredEquity,
          otherBenefits: input.otherBenefits,
          currentSalary: input.currentSalary,
          targetSalary: input.targetSalary,
          marketContext: input.marketContext,
          yourLeverage: input.yourLeverage,
          strategyData,
        })
        .$returningId();

      const [result] = await db
        .select()
        .from(negotiationSessions)
        .where(eq(negotiationSessions.id, inserted.id));

      return result;
    }),

  // ─── Delete a session ─────────────────────────────────────────────────────

  deleteSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(negotiationSessions)
        .where(eq(negotiationSessions.id, input.id));

      return { success: true };
    }),
});
