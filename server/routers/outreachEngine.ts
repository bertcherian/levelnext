import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  brandStrategies,
  outreachDrafts,
  careerProfiles,
  reports,
  relationshipContacts,
} from "../../drizzle/schema";

// ─── Outreach Engine Router ───────────────────────────────────────────────────
// Sprint 3 of Career Access Intelligence™
// Covers: Personal Brand Strategy, Outreach Drafts, Conversation Prep

// Build career context from profile + CI scores
async function buildCareerContext(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  // Get career profile
  const [profile] = await db
    .select()
    .from(careerProfiles)
    .where(eq(careerProfiles.userId, userId))
    .limit(1);

  // Get CI diagnostic reports
  const ciModules = ["CPI", "CRS", "CMK", "CST", "CAO", "AIR"];
  const allReports = await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));
  const ciReports = allReports.filter((r) => ciModules.includes(r.moduleType));

  const lines: string[] = [];

  if (profile) {
    lines.push("=== Career Profile ===");
    if (profile.targetRole) lines.push(`Target Role: ${profile.targetRole}`);
    if (profile.targetRoleType) lines.push(`Role Type: ${profile.targetRoleType}`);
    if (profile.legacyStatement) lines.push(`Legacy Statement: ${profile.legacyStatement}`);
    if (profile.careerMotivation) lines.push(`Career Motivation: ${profile.careerMotivation}`);
    if (profile.keyAchievements) lines.push(`Key Achievements: ${profile.keyAchievements}`);
    if (profile.industryExpertise?.length) lines.push(`Industry Expertise: ${profile.industryExpertise.join(", ")}`);
    if (profile.speakingHistory) lines.push(`Speaking History: ${profile.speakingHistory}`);
    if (profile.publications) lines.push(`Publications: ${profile.publications}`);
    if (profile.careerHistory) lines.push(`Career History: ${profile.careerHistory}`);
  }

  if (ciReports.length > 0) {
    lines.push("\n=== Career Intelligence Diagnostic Scores ===");
    for (const r of ciReports) {
      lines.push(`- ${r.moduleType}: Archetype = ${r.archetype ?? "N/A"}, Zone = ${r.zone ?? "N/A"}, Edge Score = ${r.edgeScore}`);
    }
  }

  return lines.length > 0 ? lines.join("\n") : "No career profile or diagnostic data available yet.";
}

export const outreachEngineRouter = router({
  // ─── Brand Strategy ─────────────────────────────────────────────────────────

  getBrandStrategy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [strategy] = await db
      .select()
      .from(brandStrategies)
      .where(eq(brandStrategies.userId, ctx.user.id))
      .orderBy(desc(brandStrategies.createdAt))
      .limit(1);
    return strategy ?? null;
  }),

  generateBrandStrategy: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const careerContext = await buildCareerContext(ctx.user.id);

    const systemPrompt = `You are an elite executive personal branding strategist and LinkedIn expert. You help senior leaders build powerful, authentic personal brands that attract the right opportunities.

Based on the leader's career profile and CI diagnostic scores, generate a comprehensive personal brand strategy. Return ONLY valid JSON with this exact structure:
{
  "linkedinHeadline": "Compelling 220-char LinkedIn headline",
  "linkedinSummary": "3-paragraph LinkedIn summary (About section intro)",
  "linkedinAboutSection": "Full 2000-char LinkedIn About section with story, value, and CTA",
  "brandStatement": "One crisp sentence: who you serve, what you do, the outcome you create",
  "uniqueValueProposition": "2-3 sentences on what makes this leader distinctively valuable",
  "targetAudience": "Who needs to know about this leader (hiring managers, board members, etc.)",
  "careerNarrative": "3-paragraph narrative arc: past credibility → present expertise → future vision",
  "elevatorPitch": "60-second spoken pitch for networking events",
  "executiveBio": "200-word third-person executive bio for conference programs",
  "thoughtLeadershipPillars": [
    {
      "pillar": "Pillar name",
      "description": "What this pillar stands for",
      "contentIdeas": ["idea 1", "idea 2", "idea 3"],
      "hashtags": ["#tag1", "#tag2"]
    }
  ],
  "contentCalendar": [
    {
      "week": 1,
      "contentType": "LinkedIn Post",
      "topic": "Topic title",
      "hook": "Opening line that stops the scroll",
      "format": "Carousel / Text / Poll / Video",
      "callToAction": "What you want readers to do"
    }
  ],
  "visibilityPlan": {
    "shortTerm": ["Action 1 (0-30 days)", "Action 2"],
    "mediumTerm": ["Action 1 (30-90 days)", "Action 2"],
    "longTerm": ["Action 1 (90+ days)", "Action 2"],
    "keyPlatforms": ["LinkedIn", "Industry forums"],
    "networkingEvents": ["Event type 1", "Event type 2"],
    "speakingOpportunities": ["Opportunity 1", "Opportunity 2"]
  }
}

Generate 3 thought leadership pillars and 4 weeks of content calendar entries. Be specific, actionable, and authentic to the leader's actual background.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: careerContext },
      ],
      model: "claude-sonnet-4-6",
      maxTokens: 4000,
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText || typeof rawText !== "string") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned empty response" });
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse LLM response" });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Upsert: delete existing and insert new
    const existing = await db
      .select({ id: brandStrategies.id })
      .from(brandStrategies)
      .where(eq(brandStrategies.userId, ctx.user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(brandStrategies)
        .set({
          linkedinHeadline: parsed.linkedinHeadline,
          linkedinSummary: parsed.linkedinSummary,
          linkedinAboutSection: parsed.linkedinAboutSection,
          brandStatement: parsed.brandStatement,
          uniqueValueProposition: parsed.uniqueValueProposition,
          targetAudience: parsed.targetAudience,
          thoughtLeadershipPillars: parsed.thoughtLeadershipPillars ?? [],
          contentCalendar: parsed.contentCalendar ?? [],
          visibilityPlan: parsed.visibilityPlan,
          careerNarrative: parsed.careerNarrative,
          elevatorPitch: parsed.elevatorPitch,
          executiveBio: parsed.executiveBio,
        })
        .where(eq(brandStrategies.userId, ctx.user.id));
    } else {
      await db.insert(brandStrategies).values({
        userId: ctx.user.id,
        linkedinHeadline: parsed.linkedinHeadline,
        linkedinSummary: parsed.linkedinSummary,
        linkedinAboutSection: parsed.linkedinAboutSection,
        brandStatement: parsed.brandStatement,
        uniqueValueProposition: parsed.uniqueValueProposition,
        targetAudience: parsed.targetAudience,
        thoughtLeadershipPillars: parsed.thoughtLeadershipPillars ?? [],
        contentCalendar: parsed.contentCalendar ?? [],
        visibilityPlan: parsed.visibilityPlan,
        careerNarrative: parsed.careerNarrative,
        elevatorPitch: parsed.elevatorPitch,
        executiveBio: parsed.executiveBio,
      });
    }

    const [result] = await db
      .select()
      .from(brandStrategies)
      .where(eq(brandStrategies.userId, ctx.user.id))
      .orderBy(desc(brandStrategies.createdAt))
      .limit(1);

    return result;
  }),

  // ─── Outreach Drafts ─────────────────────────────────────────────────────────

  listOutreachDrafts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select()
      .from(outreachDrafts)
      .where(eq(outreachDrafts.userId, ctx.user.id))
      .orderBy(desc(outreachDrafts.createdAt));
  }),

  generateOutreachDraft: protectedProcedure
    .input(
      z.object({
        contactName: z.string(),
        contactTitle: z.string().optional(),
        contactCompany: z.string().optional(),
        outreachGoal: z.string(),
        contactId: z.number().optional(),
        howWeKnowEachOther: z.string().optional(),
        sharedHistory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const careerContext = await buildCareerContext(ctx.user.id);

      // Get brand strategy if available
      const [brand] = await db
        .select()
        .from(brandStrategies)
        .where(eq(brandStrategies.userId, ctx.user.id))
        .limit(1);

      const brandContext = brand
        ? `\nMy Brand Statement: ${brand.brandStatement ?? ""}\nMy Unique Value Proposition: ${brand.uniqueValueProposition ?? ""}\nMy Elevator Pitch: ${brand.elevatorPitch ?? ""}`
        : "";

      const systemPrompt = `You are an expert executive outreach coach who helps senior leaders craft compelling, authentic outreach messages. You understand that great outreach is specific, warm, and focused on mutual value — never generic or transactional.

Generate outreach messages and conversation prep for the leader. Return ONLY valid JSON:
{
  "linkedinMessage": "300-char LinkedIn connection request or message (warm, specific, no fluff)",
  "emailSubject": "Compelling email subject line",
  "emailBody": "Full email body (3 short paragraphs: connection, value, ask)",
  "warmIntroRequest": "Message to send to a mutual connection asking for an introduction",
  "followUpMessage": "Follow-up message if no response after 1 week"
}

Rules: Be specific to this contact and goal. Reference real context. Never use generic phrases like 'I hope this finds you well'. Keep LinkedIn message under 300 chars.`;

      const userMessage = `${careerContext}${brandContext}

Contact: ${input.contactName}
Title: ${input.contactTitle ?? "Unknown"}
Company: ${input.contactCompany ?? "Unknown"}
Outreach Goal: ${input.outreachGoal}
How We Know Each Other: ${input.howWeKnowEachOther ?? "Not specified"}
Shared History: ${input.sharedHistory ?? "Not specified"}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "claude-haiku-4-5",
        maxTokens: 1500,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText || typeof rawText !== "string") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned empty response" });
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse LLM response" });
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const [inserted] = await db
        .insert(outreachDrafts)
        .values({
          userId: ctx.user.id,
          contactId: input.contactId,
          contactName: input.contactName,
          contactTitle: input.contactTitle,
          contactCompany: input.contactCompany,
          outreachGoal: input.outreachGoal,
          linkedinMessage: parsed.linkedinMessage,
          emailSubject: parsed.emailSubject,
          emailBody: parsed.emailBody,
          warmIntroRequest: parsed.warmIntroRequest,
          followUpMessage: parsed.followUpMessage,
          status: "draft",
        })
        .$returningId();

      const [result] = await db
        .select()
        .from(outreachDrafts)
        .where(eq(outreachDrafts.id, inserted.id));

      return result;
    }),

  updateOutreachDraft: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        linkedinMessage: z.string().optional(),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
        warmIntroRequest: z.string().optional(),
        followUpMessage: z.string().optional(),
        status: z.enum(["draft", "sent", "responded", "archived"]).optional(),
        userNotes: z.string().optional(),
        responseReceived: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, ...updates } = input;

      // Verify ownership
      const [draft] = await db
        .select({ id: outreachDrafts.id })
        .from(outreachDrafts)
        .where(and(eq(outreachDrafts.id, id), eq(outreachDrafts.userId, ctx.user.id)))
        .limit(1);

      if (!draft) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(outreachDrafts)
        .set({ ...updates, ...(updates.status === "sent" ? { sentAt: new Date() } : {}) })
        .where(eq(outreachDrafts.id, id));

      const [result] = await db
        .select()
        .from(outreachDrafts)
        .where(eq(outreachDrafts.id, id));

      return result;
    }),

  deleteOutreachDraft: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [draft] = await db
        .select({ id: outreachDrafts.id })
        .from(outreachDrafts)
        .where(and(eq(outreachDrafts.id, input.id), eq(outreachDrafts.userId, ctx.user.id)))
        .limit(1);

      if (!draft) throw new TRPCError({ code: "NOT_FOUND" });

      await db.delete(outreachDrafts).where(eq(outreachDrafts.id, input.id));
      return { success: true };
    }),

  // ─── Conversation Prep ───────────────────────────────────────────────────────

  generateConversationPrep: protectedProcedure
    .input(
      z.object({
        draftId: z.number(),
        meetingContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [draft] = await db
        .select()
        .from(outreachDrafts)
        .where(and(eq(outreachDrafts.id, input.draftId), eq(outreachDrafts.userId, ctx.user.id)))
        .limit(1);

      if (!draft) throw new TRPCError({ code: "NOT_FOUND" });

      const careerContext = await buildCareerContext(ctx.user.id);

      const systemPrompt = `You are an executive coach specialising in high-stakes conversations. Help the leader prepare for a meeting with this contact. Return ONLY valid JSON:
{
  "meetingAgenda": ["Agenda item 1", "Agenda item 2", "Agenda item 3", "Agenda item 4"],
  "talkingPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "questionsToAsk": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"],
  "thingsToAvoid": ["Avoid doing X", "Don't mention Y", "Avoid topic Z"],
  "desiredOutcome": "Specific outcome to achieve in this meeting",
  "followUpPlan": "What to do within 24 hours of the meeting"
}

Be specific to the contact's role, the outreach goal, and the leader's background. Questions should be genuinely curious, not interrogative.`;

      const userMessage = `${careerContext}

Contact: ${draft.contactName}
Title: ${draft.contactTitle ?? "Unknown"}
Company: ${draft.contactCompany ?? "Unknown"}
Outreach Goal: ${draft.outreachGoal ?? "Not specified"}
Meeting Context: ${input.meetingContext ?? "First meeting / exploratory conversation"}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "claude-haiku-4-5",
        maxTokens: 1200,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText || typeof rawText !== "string") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned empty response" });
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not parse LLM response" });
      }

      const parsed = JSON.parse(jsonMatch[0]);

      await db
        .update(outreachDrafts)
        .set({
          meetingAgenda: parsed.meetingAgenda ?? [],
          talkingPoints: parsed.talkingPoints ?? [],
          questionsToAsk: parsed.questionsToAsk ?? [],
          thingsToAvoid: parsed.thingsToAvoid ?? [],
          desiredOutcome: parsed.desiredOutcome,
          followUpPlan: parsed.followUpPlan,
        })
        .where(eq(outreachDrafts.id, input.draftId));

      const [result] = await db
        .select()
        .from(outreachDrafts)
        .where(eq(outreachDrafts.id, input.draftId));

      return result;
    }),

  // ─── Contacts list for outreach draft creation ───────────────────────────────

  listContactsForOutreach: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select({
        id: relationshipContacts.id,
        name: relationshipContacts.name,
        currentTitle: relationshipContacts.currentTitle,
        currentCompany: relationshipContacts.currentCompany,
        relationshipType: relationshipContacts.relationshipType,
        howWeKnowEachOther: relationshipContacts.howWeKnowEachOther,
        sharedHistory: relationshipContacts.sharedHistory,
      })
      .from(relationshipContacts)
      .where(eq(relationshipContacts.userId, ctx.user.id))
      .orderBy(desc(relationshipContacts.createdAt));
  }),
});
