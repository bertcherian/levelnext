import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  careerProfiles,
  careerStrategyStatements,
  opportunityUniverse,
  relationshipContacts,
  accessPaths,
  assessmentSessions,
  reports,
  users,
} from "../../drizzle/schema";

// ─── Career Access Intelligence™ Router ──────────────────────────────────────

// Zod schema for the career profile intake
const CareerProfileInput = z.object({
  // Section 1: Role & Destination
  targetRole: z.string().optional(),
  targetRoleType: z.string().optional(),
  problemsToSolve: z.string().optional(),
  legacyStatement: z.string().optional(),
  // Section 2: Industry & Company
  targetIndustries: z.array(z.string()).optional(),
  avoidIndustries: z.array(z.string()).optional(),
  targetCompanyTypes: z.array(z.string()).optional(),
  dreamCompanies: z.array(z.string()).optional(),
  targetGeographies: z.array(z.string()).optional(),
  // Section 3: Compensation & Lifestyle
  targetCompensationMin: z.number().optional(),
  targetCompensationMax: z.number().optional(),
  compensationCurrency: z.string().optional(),
  preferredWorkStyle: z.string().optional(),
  lifestyleStatement: z.string().optional(),
  familyConstraints: z.string().optional(),
  // Section 4: Values & Motivation
  coreValues: z.array(z.string()).optional(),
  careerMotivation: z.string().optional(),
  riskAppetite: z.enum(["low", "medium", "high"]).optional(),
  // Section 5: Professional Assets
  linkedinUrl: z.string().optional(),
  resumeUrl: z.string().optional(),
  careerHistory: z.string().optional(),
  keyAchievements: z.string().optional(),
  awardsAndRecognition: z.string().optional(),
  speakingHistory: z.string().optional(),
  publications: z.string().optional(),
  industryExpertise: z.array(z.string()).optional(),
  completionPct: z.number().optional(),
});

// Build a rich context string from the user's CI diagnostic scores
async function buildCareerGraphContext(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const ciModules = ["CPI", "CRS", "CMK", "CST", "CAO", "AIR"];
  const ciReports = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));

  const relevantReports = ciReports.filter((r) =>
    ciModules.includes(r.moduleType)
  );

  if (relevantReports.length === 0) {
    return "No CI diagnostic data available yet.";
  }

  const lines: string[] = ["Career Intelligence Diagnostic Scores:"];
  for (const r of relevantReports) {
    const archetype = (r.archetype as string) ?? "Not determined";
    const zone = (r.zone as string) ?? "Not determined";
    lines.push(`- ${r.moduleType}: Archetype = ${archetype}, Zone = ${zone}, Edge = ${r.edgeScore ?? "N/A"}`);
    const scores = r.dimensionScores as Record<string, number> | null;
    if (scores) {
      const topDims = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      lines.push(`  Top dimensions: ${topDims}`);
    }
  }
  return lines.join("\n");
}

export const careerAccessRouter = router({
  // ── Profile CRUD ────────────────────────────────────────────────────────────

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [profile] = await db
      .select()
      .from(careerProfiles)
      .where(eq(careerProfiles.userId, ctx.user.id))
      .limit(1);
    return profile ?? null;
  }),

  saveProfile: protectedProcedure
    .input(CareerProfileInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [existing] = await db
        .select({ id: careerProfiles.id })
        .from(careerProfiles)
        .where(eq(careerProfiles.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(careerProfiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(careerProfiles.userId, ctx.user.id));
      } else {
        await db.insert(careerProfiles).values({
          userId: ctx.user.id,
          ...input,
          completionPct: input.completionPct ?? 0,
        });
      }
      return { success: true };
    }),

  // ── Career Strategy Statement ────────────────────────────────────────────────

  getCareerStrategy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [strategy] = await db
      .select()
      .from(careerStrategyStatements)
      .where(
        and(
          eq(careerStrategyStatements.userId, ctx.user.id),
          eq(careerStrategyStatements.isActive, true)
        )
      )
      .orderBy(desc(careerStrategyStatements.createdAt))
      .limit(1);
    return strategy ?? null;
  }),

  generateCareerStrategy: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Fetch the user's career profile
    const [profile] = await db
      .select()
      .from(careerProfiles)
      .where(eq(careerProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please complete your Career Profile before generating a strategy.",
      });
    }

    // Fetch user name
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    // Build CI diagnostic context
    const diagnosticContext = await buildCareerGraphContext(ctx.user.id);

    const systemPrompt = `You are the LevelNext Career Access Intelligence™ system — the world's most sophisticated AI career strategist for senior leaders.

You think like the best executive recruiter, board advisor, and career strategist combined.

Your task: Generate a highly personalised Career Strategy Statement for ${user?.name ?? "this leader"}.

You have access to:
1. Their complete Career Profile (goals, industries, compensation, values, constraints)
2. Their Career Intelligence diagnostic scores (CPI, CRS, and other CI modules)

CRITICAL RULES:
- Be specific, not generic. Use their actual data.
- Think like an elite executive search partner, not a career counsellor.
- Focus on creating access to opportunities, not applying for jobs.
- Be honest about gaps without being discouraging.
- The tone should be calm, strategic, and highly personalised.

Return ONLY valid JSON matching this exact structure:
{
  "headline": "A 10-15 word strategic headline summarising their career access mission",
  "positioningStatement": "2-3 sentences on their unique executive positioning",
  "uniqueValueProposition": "What makes this leader distinctively valuable to target organisations",
  "targetOpportunityTypes": ["Top 3 opportunity types to pursue, in priority order"],
  "primaryNarrative": "The story they should tell in every important conversation (3-4 sentences)",
  "keyStrengths": ["5 specific strengths to lead with, based on their profile and diagnostics"],
  "credibilityGaps": ["2-3 specific gaps to address proactively, with a brief note on how"],
  "timeHorizon": "Realistic timeline for their target role (e.g. 3-6 months for VP, 12-18 for CXO)",
  "northStarStatement": "One sentence: their career north star",
  "immediateActions": ["Top 3 specific actions to take in the next 30 days"]
}`;

    const userMessage = `Career Profile:
- Target Role: ${profile.targetRole ?? "Not specified"}
- Target Role Type: ${profile.targetRoleType ?? "Not specified"}
- Problems to Solve: ${profile.problemsToSolve ?? "Not specified"}
- Legacy Statement: ${profile.legacyStatement ?? "Not specified"}
- Target Industries: ${(profile.targetIndustries as string[] | null)?.join(", ") ?? "Not specified"}
- Avoid Industries: ${(profile.avoidIndustries as string[] | null)?.join(", ") ?? "None"}
- Target Company Types: ${(profile.targetCompanyTypes as string[] | null)?.join(", ") ?? "Not specified"}
- Dream Companies: ${(profile.dreamCompanies as string[] | null)?.join(", ") ?? "Not specified"}
- Target Geographies: ${(profile.targetGeographies as string[] | null)?.join(", ") ?? "Not specified"}
- Compensation Range: ${profile.targetCompensationMin ?? "?"} - ${profile.targetCompensationMax ?? "?"} ${profile.compensationCurrency ?? "INR"} (lakhs)
- Work Style: ${profile.preferredWorkStyle ?? "Not specified"}
- Core Values: ${(profile.coreValues as string[] | null)?.join(", ") ?? "Not specified"}
- Career Motivation: ${profile.careerMotivation ?? "Not specified"}
- Risk Appetite: ${profile.riskAppetite ?? "Not specified"}
- Career History: ${profile.careerHistory ?? "Not provided"}
- Key Achievements: ${profile.keyAchievements ?? "Not provided"}
- Industry Expertise: ${(profile.industryExpertise as string[] | null)?.join(", ") ?? "Not specified"}
- Speaking/Publications: ${profile.speakingHistory ?? "None"} | ${profile.publications ?? "None"}

${diagnosticContext}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "claude-sonnet-4-5",
      maxTokens: 2000,
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText || typeof rawText !== "string") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI did not return a response." });
    }

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse AI response." });
    }
    const strategyData = JSON.parse(jsonMatch[0]);

    // Deactivate previous strategies
    await db
      .update(careerStrategyStatements)
      .set({ isActive: false })
      .where(eq(careerStrategyStatements.userId, ctx.user.id));

    // Save new strategy
    await db.insert(careerStrategyStatements).values({
      userId: ctx.user.id,
      strategyData,
      profileVersion: 1,
      isActive: true,
    });

    return { success: true, strategyData };
  }),

  // ── Opportunity Universe ─────────────────────────────────────────────────────

  getOpportunityUniverse: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conditions = [eq(opportunityUniverse.userId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(opportunityUniverse.status, input.status));
      }
      const orgs = await db
        .select()
        .from(opportunityUniverse)
        .where(and(...conditions))
        .orderBy(desc(opportunityUniverse.compositeScore));
      return orgs;
    }),

  generateOpportunityUniverse: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [profile] = await db
      .select()
      .from(careerProfiles)
      .where(eq(careerProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please complete your Career Profile first.",
      });
    }

    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    const diagnosticContext = await buildCareerGraphContext(ctx.user.id);

    const systemPrompt = `You are the LevelNext Career Access Intelligence™ Opportunity Mapping Engine.

Your task: Generate a personalised Opportunity Universe for ${user?.name ?? "this leader"} — a curated list of 15-20 organisations where they could create access to senior leadership opportunities.

CRITICAL RULES:
- Be specific: use real company names where possible, or realistic archetypes where not.
- Cover ALL 6 required category types: Dream, Likely, Emerging, GCC, PE-backed, and at least one of Board/Advisory/Fractional.
- Score each organisation honestly on all 10 dimensions (1-10).
- The hiddenOpportunitySignal should be a specific, credible signal (e.g. "Series C raised Q1 2024, scaling APAC leadership team").
- Think like an elite executive search partner who knows this market deeply.

Return ONLY valid JSON as an array of objects:
[
  {
    "companyName": "Company Name",
    "companyType": "Dream|Likely|Emerging|GCC|PE|FamilyBusiness|Consulting|Board|Advisory|Fractional|OperatingPartner",
    "industry": "Industry sector",
    "geography": "City/Country",
    "description": "Why this organisation is relevant to this leader",
    "potentialRole": "Specific role title they could target",
    "scoreFit": 8,
    "scoreGrowth": 7,
    "scoreLearning": 6,
    "scoreInfluence": 9,
    "scoreCompensation": 7,
    "scoreLeadershipCulture": 8,
    "scoreInnovation": 7,
    "scoreStability": 6,
    "scoreCareerAcceleration": 8,
    "scorePurposeAlignment": 9,
    "compositeScore": 75,
    "whyThisCompany": "Strategic reason this is a high-priority target",
    "hiddenOpportunitySignal": "Specific business signal suggesting they need this leader's skills now"
  }
]`;

    const userMessage = `Career Profile Summary:
- Target Role: ${profile.targetRole ?? "Senior Leadership"}
- Target Role Type: ${profile.targetRoleType ?? "CXO/VP"}
- Target Industries: ${(profile.targetIndustries as string[] | null)?.join(", ") ?? "Open"}
- Avoid Industries: ${(profile.avoidIndustries as string[] | null)?.join(", ") ?? "None"}
- Target Company Types: ${(profile.targetCompanyTypes as string[] | null)?.join(", ") ?? "All types"}
- Dream Companies: ${(profile.dreamCompanies as string[] | null)?.join(", ") ?? "Not specified"}
- Target Geographies: ${(profile.targetGeographies as string[] | null)?.join(", ") ?? "India"}
- Compensation Range: ${profile.targetCompensationMin ?? "?"} - ${profile.targetCompensationMax ?? "?"} ${profile.compensationCurrency ?? "INR"} lakhs
- Career History: ${profile.careerHistory ?? "Senior leader with cross-functional experience"}
- Key Achievements: ${profile.keyAchievements ?? "Not provided"}
- Industry Expertise: ${(profile.industryExpertise as string[] | null)?.join(", ") ?? "Not specified"}
- Risk Appetite: ${profile.riskAppetite ?? "medium"}

${diagnosticContext}

Generate 15-20 organisations across all required categories. Be specific and realistic.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "claude-sonnet-4-5",
      maxTokens: 4000,
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText || typeof rawText !== "string") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI did not return a response." });
    }

    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse AI response." });
    }
    const organisations = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;

    // Generate a batch ID (timestamp-based)
    const batchId = Date.now();

    // Insert all organisations
    for (const org of organisations) {
      await db.insert(opportunityUniverse).values({
        userId: ctx.user.id,
        companyName: String(org.companyName ?? "Unknown"),
        companyType: String(org.companyType ?? "Likely"),
        industry: org.industry ? String(org.industry) : null,
        geography: org.geography ? String(org.geography) : null,
        description: org.description ? String(org.description) : null,
        potentialRole: org.potentialRole ? String(org.potentialRole) : null,
        scoreFit: org.scoreFit ? Number(org.scoreFit) : null,
        scoreGrowth: org.scoreGrowth ? Number(org.scoreGrowth) : null,
        scoreLearning: org.scoreLearning ? Number(org.scoreLearning) : null,
        scoreInfluence: org.scoreInfluence ? Number(org.scoreInfluence) : null,
        scoreCompensation: org.scoreCompensation ? Number(org.scoreCompensation) : null,
        scoreLeadershipCulture: org.scoreLeadershipCulture ? Number(org.scoreLeadershipCulture) : null,
        scoreInnovation: org.scoreInnovation ? Number(org.scoreInnovation) : null,
        scoreStability: org.scoreStability ? Number(org.scoreStability) : null,
        scoreCareerAcceleration: org.scoreCareerAcceleration ? Number(org.scoreCareerAcceleration) : null,
        scorePurposeAlignment: org.scorePurposeAlignment ? Number(org.scorePurposeAlignment) : null,
        compositeScore: org.compositeScore ? Number(org.compositeScore) : null,
        whyThisCompany: org.whyThisCompany ? String(org.whyThisCompany) : null,
        hiddenOpportunitySignal: org.hiddenOpportunitySignal ? String(org.hiddenOpportunitySignal) : null,
        status: "identified",
        batchId,
      });
    }

    return { success: true, count: organisations.length, batchId };
  }),

  updateOpportunityStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string(), userNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(opportunityUniverse)
        .set({ status: input.status, userNotes: input.userNotes, updatedAt: new Date() })
        .where(
          and(
            eq(opportunityUniverse.id, input.id),
            eq(opportunityUniverse.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  clearOpportunityUniverse: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db
      .update(opportunityUniverse)
      .set({ status: "removed" })
      .where(eq(opportunityUniverse.userId, ctx.user.id));
    return { success: true };
  }),

  // ── SPRINT 2: Relationship Graph ─────────────────────────────────────────────

  getRelationships: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(relationshipContacts)
      .where(eq(relationshipContacts.userId, ctx.user.id))
      .orderBy(desc(relationshipContacts.compositeScore));
  }),

  addRelationship: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      currentTitle: z.string().optional(),
      currentCompany: z.string().optional(),
      industry: z.string().optional(),
      geography: z.string().optional(),
      linkedinUrl: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      relationshipType: z.string(),
      howWeKnowEachOther: z.string().optional(),
      sharedHistory: z.string().optional(),
      notes: z.string().optional(),
      isKeyConnector: z.boolean().optional(),
      linkedOpportunityIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [inserted] = await db.insert(relationshipContacts).values({
        userId: ctx.user.id,
        ...input,
        linkedOpportunityIds: input.linkedOpportunityIds ?? [],
      });
      // Score the relationship with AI
      const scoreResult = await scoreRelationshipWithAI(input);
      if (scoreResult) {
        await db.update(relationshipContacts)
          .set(scoreResult)
          .where(eq(relationshipContacts.userId, ctx.user.id));
      }
      return { success: true };
    }),

  updateRelationship: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      currentTitle: z.string().optional(),
      currentCompany: z.string().optional(),
      industry: z.string().optional(),
      geography: z.string().optional(),
      linkedinUrl: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      relationshipType: z.string().optional(),
      howWeKnowEachOther: z.string().optional(),
      sharedHistory: z.string().optional(),
      notes: z.string().optional(),
      isKeyConnector: z.boolean().optional(),
      linkedOpportunityIds: z.array(z.number()).optional(),
      lastContactDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, lastContactDate, ...rest } = input;
      await db.update(relationshipContacts)
        .set({
          ...rest,
          ...(lastContactDate ? { lastContactDate: new Date(lastContactDate) } : {}),
          updatedAt: new Date(),
        })
        .where(and(
          eq(relationshipContacts.id, id),
          eq(relationshipContacts.userId, ctx.user.id)
        ));
      return { success: true };
    }),

  deleteRelationship: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(relationshipContacts)
        .where(and(
          eq(relationshipContacts.id, input.id),
          eq(relationshipContacts.userId, ctx.user.id)
        ));
      return { success: true };
    }),

  scoreRelationship: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [contact] = await db.select().from(relationshipContacts)
        .where(and(eq(relationshipContacts.id, input.id), eq(relationshipContacts.userId, ctx.user.id)))
        .limit(1);
      if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
      const scoreResult = await scoreRelationshipWithAI(contact);
      if (scoreResult) {
        await db.update(relationshipContacts).set({ ...scoreResult, updatedAt: new Date() })
          .where(eq(relationshipContacts.id, input.id));
      }
      return { success: true, scores: scoreResult };
    }),

  // ── SPRINT 2: Access Path Intelligence ──────────────────────────────────────

  getAccessPaths: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(accessPaths)
      .where(eq(accessPaths.userId, ctx.user.id))
      .orderBy(desc(accessPaths.createdAt));
  }),

  getAccessPathForOpportunity: protectedProcedure
    .input(z.object({ opportunityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [path] = await db.select().from(accessPaths)
        .where(and(
          eq(accessPaths.opportunityId, input.opportunityId),
          eq(accessPaths.userId, ctx.user.id)
        ))
        .limit(1);
      return path ?? null;
    }),

  generateAccessPath: protectedProcedure
    .input(z.object({ opportunityId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Fetch the target opportunity
      const [opp] = await db.select().from(opportunityUniverse)
        .where(and(eq(opportunityUniverse.id, input.opportunityId), eq(opportunityUniverse.userId, ctx.user.id)))
        .limit(1);
      if (!opp) throw new TRPCError({ code: "NOT_FOUND", message: "Opportunity not found." });

      // Fetch user profile
      const [profile] = await db.select().from(careerProfiles)
        .where(eq(careerProfiles.userId, ctx.user.id)).limit(1);

      // Fetch existing relationships for context
      const contacts = await db.select().from(relationshipContacts)
        .where(eq(relationshipContacts.userId, ctx.user.id))
        .orderBy(desc(relationshipContacts.compositeScore))
        .limit(20);

      const [user] = await db.select({ name: users.name }).from(users)
        .where(eq(users.id, ctx.user.id)).limit(1);

      const contactSummary = contacts.length > 0
        ? contacts.map(c => `- ${c.name} (${c.currentTitle ?? ""} at ${c.currentCompany ?? ""}, ${c.relationshipType}, score: ${c.compositeScore ?? "unscored"})`).join("\n")
        : "No contacts added yet.";

      const systemPrompt = `You are the LevelNext Career Access Intelligence™ Access Path Engine.

Your task: Generate a comprehensive Access Path Strategy for ${user?.name ?? "this leader"} to create access to ${opp.companyName}.

You think like the world's best executive search partner. You always prefer warm introductions over cold outreach.
You identify the most strategic paths — not the most obvious ones.

Return ONLY valid JSON matching this exact structure:
{
  "decisionMakers": [
    { "name": "Name or Title if unknown", "title": "Exact title", "linkedinUrl": "", "whyTheyMatter": "Why this person is key" }
  ],
  "bestPath": {
    "description": "The optimal path to access",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "keyContact": "Name of the key person to engage first",
    "estimatedTimeWeeks": 8,
    "confidenceScore": 8
  },
  "alternativePath": { "description": "", "steps": [], "keyContact": "", "estimatedTimeWeeks": 12, "confidenceScore": 6 },
  "fastestPath": { "description": "", "steps": [], "keyContact": "", "estimatedTimeWeeks": 4, "confidenceScore": 5 },
  "safestPath": { "description": "", "steps": [], "keyContact": "", "estimatedTimeWeeks": 16, "confidenceScore": 9 },
  "highestProbabilityPath": { "description": "", "steps": [], "keyContact": "", "estimatedTimeWeeks": 10, "confidenceScore": 9 },
  "mutualConnections": [
    { "contactName": "Name", "connectionType": "alumni|conference|community|second_degree|direct", "strengthOfLink": "Strong/Medium/Weak", "suggestedAsk": "Specific ask to make" }
  ],
  "warmIntroRequest": "A short, warm, executive-tone message to send to a mutual connection asking for an introduction",
  "directOutreachEmail": "A compelling, short, value-first cold email as a last resort",
  "linkedinMessage": "A 3-sentence LinkedIn connection note that creates curiosity without desperation",
  "overallAccessScore": 7,
  "primaryBarrier": "The single biggest obstacle to access",
  "keyInsight": "The one strategic insight that changes how they should approach this company"
}`;

      const userMessage = `Target Company: ${opp.companyName}
Industry: ${opp.industry ?? "Not specified"}
Geography: ${opp.geography ?? "Not specified"}
Potential Role: ${opp.potentialRole ?? profile?.targetRole ?? "Senior Leadership"}
Hidden Opportunity Signal: ${opp.hiddenOpportunitySignal ?? "Not identified"}
Why This Company: ${opp.whyThisCompany ?? "High strategic fit"}

Leader Profile:
- Name: ${user?.name ?? "Not specified"}
- Target Role: ${profile?.targetRole ?? "Senior Leadership"}
- Career History: ${profile?.careerHistory ?? "Senior leader"}
- Industry Expertise: ${(profile?.industryExpertise as string[] | null)?.join(", ") ?? "Not specified"}
- Key Achievements: ${profile?.keyAchievements ?? "Not specified"}
- LinkedIn: ${profile?.linkedinUrl ?? "Not provided"}

Existing Network (top contacts by score):
${contactSummary}

Generate the most strategic access path for this leader to create access to ${opp.companyName}.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "claude-sonnet-4-5",
        maxTokens: 3000,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText || typeof rawText !== "string") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI did not return a response." });
      }
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse AI response." });
      const pathData = JSON.parse(jsonMatch[0]);

      // Upsert the access path
      const [existing] = await db.select({ id: accessPaths.id }).from(accessPaths)
        .where(and(eq(accessPaths.opportunityId, input.opportunityId), eq(accessPaths.userId, ctx.user.id)))
        .limit(1);

      if (existing) {
        await db.update(accessPaths).set({ ...pathData, updatedAt: new Date() })
          .where(eq(accessPaths.id, existing.id));
      } else {
        await db.insert(accessPaths).values({
          userId: ctx.user.id,
          opportunityId: input.opportunityId,
          companyName: opp.companyName,
          targetRole: opp.potentialRole ?? profile?.targetRole ?? "Senior Leadership",
          ...pathData,
        });
      }
      return { success: true, pathData };
    }),

  updateAccessPathStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string(), userNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(accessPaths)
        .set({ status: input.status, userNotes: input.userNotes, updatedAt: new Date() })
        .where(and(eq(accessPaths.id, input.id), eq(accessPaths.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ── Helper: AI relationship scoring ──────────────────────────────────────────
async function scoreRelationshipWithAI(contact: {
  name: string;
  currentTitle?: string | null;
  currentCompany?: string | null;
  relationshipType: string;
  howWeKnowEachOther?: string | null;
  sharedHistory?: string | null;
}) {
  try {
    const systemPrompt = `You are a relationship intelligence engine. Score this professional relationship on 7 dimensions (1-10 each) and recommend the best next action.

Return ONLY valid JSON:
{
  "scoreTrust": 7,
  "scoreInfluence": 6,
  "scoreAccessibility": 8,
  "scoreRecency": 5,
  "scoreWarmth": 7,
  "scoreStrategicValue": 8,
  "scoreLikelihoodToHelp": 7,
  "compositeScore": 71,
  "recommendedAction": "reconnect|strengthen|ask_advice|offer_value|request_intro|maintain|celebrate|share_article|coffee",
  "recommendedActionReason": "One sentence explaining why this action makes sense now"
}`;

    const userMessage = `Contact: ${contact.name}
Title: ${contact.currentTitle ?? "Unknown"}
Company: ${contact.currentCompany ?? "Unknown"}
Relationship Type: ${contact.relationshipType}
How We Know Each Other: ${contact.howWeKnowEachOther ?? "Not specified"}
Shared History: ${contact.sharedHistory ?? "Not specified"}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "claude-haiku-4-5",
      maxTokens: 500,
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText || typeof rawText !== "string") return null;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
