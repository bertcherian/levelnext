import { TRPCError } from "@trpc/server";
import { eq, desc, gte, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { guideConversations, guideSessions, users, tenantUsers, organisations, commitments, userProductEnrollments, type GuideMessage, type LeadershipGraph } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

type OrgContext = {
  legalName: string;
  displayName?: string | null;
  missionStatement?: string | null;
  visionStatement?: string | null;
  purposeStatement?: string | null;
  values?: any[];
  competencies?: any[];
  strategicPriorities?: any[];
  branding?: any;
  industry?: string | null;
} | null;

// ─── Career Strategist system prompt ───────────────────────────────────────
const CAREER_STRATEGIST_PROMPT = (ciData: Record<string, any> | null, userName: string): string => {
  const moduleLabels: Record<string, string> = {
    CPI: "Career Positioning", CRS: "Career Resilience", CMK: "Career Marketability",
    CST: "Career Strategy", CAO: "Career Optionality", AIR: "AI Readiness",
  };
  const moduleContext = ciData && Object.keys(ciData).length > 0
    ? Object.entries(ciData).map(([key, mod]: [string, any]) => {
        const label = moduleLabels[key] ?? key;
        const lines = [
          `[${label} Diagnostic]`,
          `- Career Edge: ${Math.round(mod.edgeScore ?? 0)}/100`,
          `- Zone: ${mod.zoneLabel ?? mod.zone}`,
          `- Archetype: ${mod.archetypeLabel ?? mod.archetype}`,
        ];
        if (mod.dimensionScores && Object.keys(mod.dimensionScores).length > 0) {
          const dimEntries = Object.entries(mod.dimensionScores as Record<string, number>)
            .sort(([, a], [, b]) => (b as number) - (a as number));
          const topDims = dimEntries.slice(0, 3).map(([k, v]) => `${k.replace(/_/g, ' ')} (${Math.round(v as number)})`).join(', ');
          lines.push(`- Strongest dimensions: ${topDims}`);
          const bottomDims = dimEntries.slice(-2).map(([k, v]) => `${k.replace(/_/g, ' ')} (${Math.round(v as number)})`).join(', ');
          lines.push(`- Growth edge dimensions: ${bottomDims}`);
        }
        if (mod.llmAnalysis && typeof mod.llmAnalysis === 'object') {
          const llm = mod.llmAnalysis as any;
          if (llm.coachFocusAreas?.length) lines.push(`- Coach focus areas: ${(llm.coachFocusAreas as string[]).join('; ')}`);
          if (llm.blindSpots?.length) {
            const bsTitles = (llm.blindSpots as any[]).slice(0, 2).map((b: any) => b.title).join('; ');
            lines.push(`- Key blind spots: ${bsTitles}`);
          }
          if (llm.coachChallengeQuestion) lines.push(`- Challenge question: ${llm.coachChallengeQuestion}`);
        }
        return lines.join('\n');
      }).join('\n\n')
    : 'No Career Intelligence diagnostics completed yet — encourage the professional to complete their first Career Positioning diagnostic to unlock personalised career coaching.';
  return `You are Career Strategist — the personal AI career coach inside LevelNext, the Career Intelligence Platform.
Your role is to help ${userName} design and accelerate their career with clarity, strategy, and confidence.
CAREER INTELLIGENCE PROFILE FOR ${userName.toUpperCase()}:
${moduleContext}
COACHING PRINCIPLES:
1. Be direct, strategic, and executive in tone — never generic or HR-textbook-like
2. Always reference ${userName}'s actual career archetype, strengths, and growth edges when giving advice
3. Suggest specific, actionable "Career Missions" — short practices for today or this week
4. Never use the words: score, assessment, test, training, course, module, bot, chatbot, weakness, failure
5. Always use: Career Edge, Career Capital, Career Mission, Career Positioning, Marketability, Optionality, Career Momentum
6. Keep responses concise — 2-4 paragraphs maximum unless asked for depth
7. End with a question or a suggested Career Mission to maintain momentum
8. You are a trusted career strategist, not a cheerleader — be honest when a career pivot or repositioning is needed
9. Focus on: career positioning, marketability, salary negotiation, career transitions, executive presence in the job market, building optionality
10. Always distinguish between short-term career moves and long-term career capital building
Respond in a warm, strategic, and confident tone.`.trim();
};

// ─── Leadership Guide system prompt ─────────────────────────────────────────
const GUIDE_SYSTEM_PROMPT = (graph: LeadershipGraph | null, userName: string, orgCtx?: OrgContext): string => {
  const g = graph as any;
  const modules = g?.modules ?? {};

  const moduleContext = Object.keys(modules).length > 0
    ? Object.entries(modules).map(([key, mod]: [string, any]) => {
        const moduleLabel = key === 'ECI' ? 'Executive Communication' : key === 'LII' ? 'Leadership Influence' : 'GCC Readiness';
        const lines = [
          `[${moduleLabel} Diagnostic]`,
          `- Edge: ${Math.round(mod.edgeScore ?? 0)}/100`,
          `- Zone: ${mod.zoneLabel ?? mod.zone}`,
          `- Archetype: ${mod.archetypeLabel ?? mod.archetype}`,
        ];
        if (mod.archetypeDescription) lines.push(`- Profile: ${mod.archetypeDescription}`);
        if (mod.archetypeStrengths?.length) lines.push(`- Strengths: ${mod.archetypeStrengths.join('; ')}`);
        if (mod.archetypeRisks?.length) lines.push(`- Growth Edges: ${mod.archetypeRisks.join('; ')}`);
        if (mod.dimensionScores && Object.keys(mod.dimensionScores).length > 0) {
          const topDims = Object.entries(mod.dimensionScores as Record<string, number>)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([k, v]) => `${k.replace(/_/g, ' ')} (${Math.round(v as number)})`)
            .join(', ');
          lines.push(`- Strongest dimensions: ${topDims}`);
        }
        return lines.join('\n');
      }).join('\n\n')
    : 'No diagnostic data yet — encourage the leader to complete their first diagnostic to unlock personalised coaching.';

  // Build company context section if available
  let companySection = '';
  if (orgCtx) {
    const orgName = orgCtx.displayName ?? orgCtx.legalName;
    const lines = [`COMPANY CONTEXT FOR ${orgName.toUpperCase()}:`];
    if (orgCtx.missionStatement) lines.push(`- Mission: ${orgCtx.missionStatement}`);
    if (orgCtx.visionStatement) lines.push(`- Vision: ${orgCtx.visionStatement}`);
    if (orgCtx.purposeStatement) lines.push(`- Purpose: ${orgCtx.purposeStatement}`);
    if (orgCtx.industry) lines.push(`- Industry: ${orgCtx.industry}`);
    const values = (orgCtx.values ?? []) as any[];
    if (values.length > 0) {
      lines.push(`- Core Values: ${values.map((v: any) => v.name).join(', ')}`);
    }
    const competencies = (orgCtx.competencies ?? []) as any[];
    if (competencies.length > 0) {
      lines.push(`- Leadership Competencies: ${competencies.map((c: any) => c.name + (c.level ? ` (${c.level})` : '')).join(', ')}`);
    }
    const priorities = (orgCtx.strategicPriorities ?? []) as any[];
    if (priorities.length > 0) {
      lines.push(`- Strategic Priorities: ${priorities.map((p: any, i: number) => `${i + 1}. ${p.title ?? p.name}`).join('; ')}`);
    }
    const branding = orgCtx.branding as any;
    if (branding?.customTerminology) {
      const terms = Object.entries(branding.customTerminology)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k} → "${v}"`)
        .join(', ');
      if (terms) lines.push(`- Company Terminology: ${terms}`);
    }
    companySection = `\n\n${lines.join('\n')}\n\nIMPORTANT: When coaching ${userName}, always align your advice to ${orgName}'s values, competencies, and strategic priorities listed above. Reference them naturally in your responses — e.g. "Given ${orgName}'s focus on [value/priority]…" Use the company's own terminology where specified.`;
  }

  return `You are Guide — the personal AI leadership coach inside LevelNext, The Leadership Intelligence Platform.

Your role is to help ${userName} grow their leadership Edge through practical, personalised coaching conversations.${companySection}

LEADERSHIP PROFILE FOR ${userName.toUpperCase()}:
- Composite Edge: ${g?.compositeEdge ?? 'Not yet assessed'}/100
- Completed Diagnostics: ${(g?.completedModules ?? []).join(', ') || 'None yet'}

${moduleContext}

COACHING PRINCIPLES:
1. Be direct, practical, and executive in tone — never generic or classroom-like
2. Always reference ${userName}'s actual archetype, strengths, and growth edges when giving advice
3. Suggest specific, actionable "Missions" — short leadership practices for today or this week
4. Never use the words: score, assessment, test, training, course, module, bot, chatbot, weakness, failure
5. Always use: Edge, Insight, Mission, Growth, Capability, Influence, Progress
6. Keep responses concise — 2-4 paragraphs maximum unless asked for depth
7. End with a question or a suggested Mission to maintain momentum
8. You are a trusted advisor, not a cheerleader — be honest when growth is needed
9. When referencing archetypes, use their full label (e.g. "Strategic Influencer", "Invisible Expert")
${orgCtx ? '10. Weave in the company context naturally — reference values, competencies, and priorities when they are directly relevant to the coaching conversation' : ''}

Respond in a warm, executive, and confident tone.`.trim();
};

export const guideRouter = router({
  // Get or create a conversation for the current user
  getConversation: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { id: null, messages: [] };

    const result = await db
      .select()
      .from(guideConversations)
      .where(eq(guideConversations.userId, ctx.user.id))
      .orderBy(desc(guideConversations.updatedAt))
      .limit(1);

    if (result[0]) {
      return { id: result[0].id, messages: result[0].messages as GuideMessage[] };
    }

    // Create a new conversation
    const [conv] = await db
      .insert(guideConversations)
      .values({ userId: ctx.user.id, messages: [] })
      .$returningId();

    return { id: conv.id, messages: [] as GuideMessage[] };
  }),

  // Send a message to Guide and get a response
  sendMessage: protectedProcedure
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get user's Leadership Graph
      const userResult = await db
        .select({ leadershipGraph: users.leadershipGraph, name: users.name })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const graph = (userResult[0]?.leadershipGraph as LeadershipGraph) ?? null;
      const userName = userResult[0]?.name ?? "Leader";

      // Fetch company context if the user belongs to an org with activated context
      let orgContext: OrgContext = null;
      try {
        const membership = await db
          .select({ tenantId: tenantUsers.tenantId })
          .from(tenantUsers)
          .where(eq(tenantUsers.userId, ctx.user.id))
          .limit(1);
        if (membership.length) {
          const orgResult = await db
            .select()
            .from(organisations)
            .where(eq(organisations.tenantId, membership[0].tenantId))
            .limit(1);
          if (orgResult.length && orgResult[0].contextActivated) {
            const o = orgResult[0];
            orgContext = {
              legalName: o.legalName,
              displayName: o.displayName,
              missionStatement: o.missionStatement,
              visionStatement: o.visionStatement,
              purposeStatement: o.purposeStatement,
              values: (o.values ?? []) as any[],
              competencies: (o.competencies ?? []) as any[],
              strategicPriorities: (o.strategicPriorities ?? []) as any[],
              branding: o.branding,
              industry: o.industry,
            };
          }
        }
      } catch {
        // Non-fatal — proceed without company context
      }

      // Get or create conversation
      let conversation = await db
        .select()
        .from(guideConversations)
        .where(eq(guideConversations.userId, ctx.user.id))
        .orderBy(desc(guideConversations.updatedAt))
        .limit(1);

      let convId: number;
      let messages: GuideMessage[] = [];

      if (conversation[0]) {
        convId = conversation[0].id;
        messages = conversation[0].messages as GuideMessage[];
      } else {
        const [conv] = await db
          .insert(guideConversations)
          .values({ userId: ctx.user.id, messages: [] })
          .$returningId();
        convId = conv.id;
      }

      // Add user message
      const userMessage: GuideMessage = {
        role: "user",
        content: input.message,
        timestamp: new Date().toISOString(),
      };
      messages = [...messages, userMessage];

      // Build LLM messages (keep last 10 for context)
      const recentMessages = messages.slice(-10);
      const llmMessages = recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Detect active product to select the right coach identity
      let activeProductId = "leadership_intelligence";
      try {
        const enrollResult = await db
          .select({ productId: userProductEnrollments.productId })
          .from(userProductEnrollments)
          .where(and(eq(userProductEnrollments.userId, ctx.user.id), eq(userProductEnrollments.isActive, true)))
          .limit(1);
        if (enrollResult[0]) activeProductId = enrollResult[0].productId;
      } catch { /* non-fatal */ }

      // Build appropriate system prompt based on active product
      let systemPromptContent: string;
      if (activeProductId === "career_intelligence") {
        const { reports: reportsTable } = await import('../../drizzle/schema');
        const ciCodes = ["CPI", "CRS", "CMK", "CST", "CAO", "AIR"];
        const ciReports = await db.select().from(reportsTable).where(eq(reportsTable.userId, ctx.user.id)).orderBy(desc(reportsTable.createdAt));
        const ciData: Record<string, any> = {};
        for (const r of ciReports) {
          const code = r.moduleType as string;
          if (ciCodes.includes(code) && !ciData[code]) {
            ciData[code] = { edgeScore: r.edgeScore, zone: r.zone, zoneLabel: r.zone?.replace(/_/g, ' '), archetype: r.archetype, archetypeLabel: r.archetype?.replace(/_/g, ' '), dimensionScores: r.dimensionScores, llmAnalysis: r.llmAnalysis };
          }
        }
        systemPromptContent = CAREER_STRATEGIST_PROMPT(ciData, userName);
      } else {
        systemPromptContent = GUIDE_SYSTEM_PROMPT(graph, userName, orgContext);
      }

      // Call the LLM — prepend system prompt as a system message
      const systemMsg = { role: "system" as const, content: systemPromptContent };
      const llmResult = await invokeLLM({
        model: "gpt-4o-mini",
        messages: [systemMsg, ...llmMessages],
        maxTokens: 800,
      });
      const rawContent = llmResult.choices[0]?.message?.content ?? "I'm here to help. What's on your mind?";
      const response = typeof rawContent === "string" ? rawContent : rawContent.map((c: any) => c.text ?? "").join("");

      const assistantMessage: GuideMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      messages = [...messages, assistantMessage];

      // Save updated conversation
      await db
        .update(guideConversations)
        .set({ messages })
        .where(eq(guideConversations.id, convId));

      // Record a guide session for unlock gate tracking.
      // Deduplicated per user + moduleType + calendar day so module-specific gate counts are accurate.
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const completedModules = (graph?.completedModules ?? []) as string[];
      const lastModule: "ECI" | "LII" | "GCC" | "GENERAL" = completedModules.length > 0
        ? (completedModules[completedModules.length - 1] as "ECI" | "LII" | "GCC")
        : "GENERAL";
      const existingSession = await db
        .select({ id: guideSessions.id })
        .from(guideSessions)
        .where(
          and(
            eq(guideSessions.userId, ctx.user.id),
            eq(guideSessions.moduleType, lastModule),
            gte(guideSessions.createdAt, todayStart)
          )
        )
        .limit(1);
      if (existingSession.length === 0) {
        await db.insert(guideSessions).values({
          userId: ctx.user.id,
          moduleType: lastModule,
          conversationId: convId,
        });
      }

      return { message: assistantMessage, conversationId: convId };
    }),

  // Generate follow-up questions based on the latest completed diagnostic report
  generateFollowUpQuestions: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get the report
      const { reports } = await import('../../drizzle/schema');
      const reportResult = await db
        .select()
        .from(reports)
        .where(eq(reports.id, input.reportId))
        .limit(1);

      const report = reportResult[0];
      if (!report || report.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const moduleLabel = report.moduleType === 'ECI' ? 'Executive Communication'
        : report.moduleType === 'LII' ? 'Leadership Influence'
        : 'GCC Readiness';

      const archetypeLabel = (report.archetype as string)
        ?.replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Unknown';

      const zoneLabel = (report.zone as string)
        ?.replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Unknown';

      const dimScores = report.dimensionScores as Record<string, number> | null;
      const topDims = dimScores
        ? Object.entries(dimScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([k]) => k.replace(/_/g, ' '))
            .join(', ')
        : '';

      const prompt = `You are Guide, a leadership coach inside LevelNext. A leader just completed the ${moduleLabel} diagnostic.

Their results:
- Archetype: ${archetypeLabel}
- Zone: ${zoneLabel}
- Edge Score: ${Math.round(report.edgeScore)}/100
- Top Dimensions: ${topDims}

Generate exactly 4 specific, practical follow-up questions this leader should ask you to deepen their understanding and start acting on their results. Each question should be directly tied to their archetype or zone.

Return ONLY a JSON array of 4 strings. No explanation, no markdown, just the array. Example format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]`;

      const llmResult = await invokeLLM({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
      });

      const raw = llmResult.choices[0]?.message?.content ?? '[]';
      const content = typeof raw === 'string' ? raw : raw.map((c: any) => c.text ?? '').join('');

      try {
        // Extract JSON array from response (avoid dotAll flag for TS compat)
        const start = content.indexOf('[');
        const end = content.lastIndexOf(']');
        const jsonStr = start !== -1 && end !== -1 ? content.slice(start, end + 1) : '[]';
        const questions: string[] = JSON.parse(jsonStr);
        return { questions: questions.slice(0, 4) };
      } catch {
        return { questions: [] as string[] };
      }
    }),

  // Save a commitment from a Guide session
  saveCommitment: protectedProcedure
    .input(z.object({
      text: z.string().min(5).max(500),
      conversationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Supersede any existing pending guide commitments — only one active at a time
      await db.update(commitments)
        .set({ status: "postponed" })
        .where(and(
          eq(commitments.userId, ctx.user.id),
          eq(commitments.status, "pending"),
          eq(commitments.sourceType, "guide"),
        ));
      await db.insert(commitments).values({
        userId: ctx.user.id,
        text: input.text,
        sourceType: "guide",
        sourceId: input.conversationId ?? null,
        status: "pending",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      return { saved: true, text: input.text };
    }),

  // Get the current active commitment for this user
  getActiveCommitment: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select()
      .from(commitments)
      .where(and(eq(commitments.userId, ctx.user.id), eq(commitments.status, "pending")))
      .orderBy(desc(commitments.createdAt))
      .limit(1);
    return result[0] ?? null;
  }),

  // Clear conversation history
  clearConversation: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db
      .update(guideConversations)
      .set({ messages: [] })
      .where(eq(guideConversations.userId, ctx.user.id));
    return { cleared: true };
  }),
});
