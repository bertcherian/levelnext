/**
 * ChatGPT Conversation Import Router (Option A — Process & Delete)
 *
 * Allows leaders to upload their ChatGPT conversation export ZIP and have
 * their leadership thinking synthesised into Guide context — without storing
 * any raw conversation data.
 *
 * Privacy architecture:
 *  - Raw ZIP is held in memory only (never written to disk or S3)
 *  - LLM synthesis runs server-side
 *  - Only the approved structured summary is persisted to the DB
 *  - rawFileDeleted flag is set to true immediately after processing
 *
 * Flow:
 *  1. parseChatgptZip   — accepts base64-encoded ZIP, extracts conversations.json,
 *                         filters to leadership-relevant conversations, runs LLM
 *                         synthesis, returns structured theme preview.
 *  2. confirmChatgptImport — persists the leader-approved themes to the
 *                            conversation_intelligence table.
 */

import { z } from "zod";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip") as new (buffer: Buffer) => {
  getEntries(): Array<{ entryName: string; getData(): Buffer }>;
};

import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { conversationIntelligence } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { eq } from "drizzle-orm";
import type { ConversationIntelligenceTheme } from "../../drizzle/schema";

// ─── Leadership keyword filter ────────────────────────────────────────────────
// Conversations containing any of these keywords are considered leadership-relevant.
const LEADERSHIP_KEYWORDS = [
  "leadership", "leader", "team", "manager", "management", "employee",
  "feedback", "performance", "strategy", "strategic", "stakeholder",
  "executive", "decision", "conflict", "communication", "influence",
  "difficult conversation", "promotion", "career", "coaching", "mentor",
  "culture", "organisation", "organization", "board", "ceo", "cto", "cfo",
  "chro", "vp", "director", "delegate", "delegation", "accountability",
  "trust", "vision", "alignment", "change management", "transformation",
  "hire", "firing", "restructure", "presentation", "negotiation",
  "burnout", "stress", "work-life", "boundary", "priorit",
];

function isLeadershipRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return LEADERSHIP_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── ChatGPT export format types ─────────────────────────────────────────────
type ChatGptMessage = {
  id: string;
  author: { role: string };
  content: { content_type: string; parts?: (string | null)[] };
  create_time: number | null;
};

type ChatGptConversation = {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, { message?: ChatGptMessage }>;
};

// ─── Extract readable text from a conversation ────────────────────────────────
function extractConversationText(conv: ChatGptConversation): string {
  const messages: string[] = [];
  for (const node of Object.values(conv.mapping)) {
    const msg = node.message;
    if (!msg) continue;
    if (msg.author.role !== "user" && msg.author.role !== "assistant") continue;
    const parts = msg.content?.parts ?? [];
    const text = parts
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .join(" ");
    if (text.trim()) {
      messages.push(`[${msg.author.role.toUpperCase()}]: ${text.trim()}`);
    }
  }
  return messages.join("\n");
}

// ─── LLM synthesis ────────────────────────────────────────────────────────────
async function synthesiseLeadershipThemes(
  conversations: Array<{ title: string; text: string; date: string }>
): Promise<{
  overallSynthesis: string;
  themes: ConversationIntelligenceTheme[];
}> {
  // Build a condensed digest — cap at ~6000 chars to stay within context
  const digest = conversations
    .slice(0, 30)
    .map((c) => `### ${c.title} (${c.date})\n${c.text.slice(0, 400)}`)
    .join("\n\n")
    .slice(0, 6000);

  const prompt = `You are an executive coach analysing a leader's AI conversation history to identify recurring leadership themes, challenges, and patterns.

The following are excerpts from ${conversations.length} leadership-relevant conversations this leader had with an AI assistant:

---
${digest}
---

Your task: synthesise the most significant leadership themes. Return ONLY valid JSON (no markdown, no explanation):

{
  "overallSynthesis": "3-4 sentence executive summary of this leader's recurring leadership patterns, challenges, and thinking style",
  "themes": [
    {
      "id": "snake_case_id",
      "title": "Theme Title (3-5 words)",
      "description": "2-3 sentence description of this pattern and why it matters for this leader's development",
      "frequency": "high|medium|low",
      "evidenceCount": <number of conversations where this appeared>,
      "category": "challenge|strength|pattern|goal"
    }
  ]
}

Rules:
- Identify 4-7 themes maximum
- Be specific and honest — name the actual pattern, not a generic label
- category "challenge" = recurring difficulty or blind spot
- category "strength" = demonstrated capability
- category "pattern" = neutral recurring behaviour or thinking style
- category "goal" = aspirations or development intentions the leader expressed
- frequency "high" = appeared in >40% of conversations, "medium" = 20-40%, "low" = <20%
- Do NOT invent themes not evidenced in the text`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
  });

  const rawContent = response.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      overallSynthesis: "Leadership themes were extracted from your conversation history.",
      themes: [],
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    overallSynthesis: parsed.overallSynthesis ?? "",
    themes: (parsed.themes ?? []) as ConversationIntelligenceTheme[],
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const chatgptImportRouter = router({
  /**
   * Step 1: Parse the ChatGPT export ZIP, filter to leadership conversations,
   * run LLM synthesis, and return structured theme preview.
   * Raw data is NEVER persisted — only the synthesis is returned.
   */
  parseChatgptZip: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(), // base64-encoded ZIP bytes
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Decode base64 → Buffer (held in memory only, never written to disk/S3)
      const zipBuffer = Buffer.from(input.fileBase64, "base64");

      // Unzip and find conversations.json
      let conversations: ChatGptConversation[] = [];
      try {
        const zip = new AdmZip(zipBuffer);
        const entries = zip.getEntries();
        const convEntry = entries.find(
          (e) => e.entryName === "conversations.json" || e.entryName.endsWith("/conversations.json")
        );
        if (!convEntry) {
          throw new Error(
            "conversations.json not found in the ZIP. Please export your full ChatGPT data from Settings → Data Controls → Export Data."
          );
        }
        const raw = convEntry.getData().toString("utf-8");
        conversations = JSON.parse(raw) as ChatGptConversation[];
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("conversations.json")) throw err;
        throw new Error("Could not read the ZIP file. Please ensure it is the original ChatGPT export.");
      }

      if (!Array.isArray(conversations) || conversations.length === 0) {
        throw new Error("No conversations found in the export file.");
      }

      // Determine date range
      const timestamps = conversations
        .map((c) => c.create_time)
        .filter((t) => typeof t === "number" && t > 0)
        .sort();
      const dateFrom = timestamps.length > 0
        ? new Date(timestamps[0] * 1000).toISOString().split("T")[0]
        : "unknown";
      const dateTo = timestamps.length > 0
        ? new Date(timestamps[timestamps.length - 1] * 1000).toISOString().split("T")[0]
        : "unknown";

      // Filter to leadership-relevant conversations
      const leadershipConvs = conversations
        .map((conv) => {
          const text = extractConversationText(conv);
          return {
            title: conv.title ?? "Untitled",
            text,
            date: conv.create_time
              ? new Date(conv.create_time * 1000).toISOString().split("T")[0]
              : "unknown",
            isLeadership: isLeadershipRelevant(conv.title + " " + text),
          };
        })
        .filter((c) => c.isLeadership && c.text.length > 50);

      if (leadershipConvs.length === 0) {
        throw new Error(
          "No leadership-related conversations were found in your export. " +
          "LevelNext looks for conversations about teams, strategy, communication, stakeholders, and leadership challenges."
        );
      }

      // LLM synthesis — raw data is discarded after this call
      const { overallSynthesis, themes } = await synthesiseLeadershipThemes(leadershipConvs);

      // Raw ZIP buffer goes out of scope here — never persisted
      return {
        totalConversations: conversations.length,
        leadershipConversations: leadershipConvs.length,
        dateFrom,
        dateTo,
        overallSynthesis,
        themes,
      };
    }),

  /**
   * Step 2: Persist the leader-approved themes to the conversation_intelligence table.
   * Only called after the leader reviews and confirms the extracted themes.
   */
  confirmChatgptImport: protectedProcedure
    .input(
      z.object({
        totalConversations: z.number(),
        leadershipConversations: z.number(),
        dateFrom: z.string(),
        dateTo: z.string(),
        overallSynthesis: z.string(),
        themes: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            frequency: z.enum(["high", "medium", "low"]),
            evidenceCount: z.number(),
            category: z.enum(["challenge", "strength", "pattern", "goal"]),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const summary = {
        totalConversations: input.totalConversations,
        leadershipConversations: input.leadershipConversations,
        dateRange: { from: input.dateFrom, to: input.dateTo },
        overallSynthesis: input.overallSynthesis,
        themes: input.themes,
        importedAt: new Date().toISOString(),
        sourceApp: "chatgpt" as const,
      };

      // Upsert — if a previous import exists, replace it
      const existing = await db
        .select({ id: conversationIntelligence.id })
        .from(conversationIntelligence)
        .where(eq(conversationIntelligence.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(conversationIntelligence)
          .set({
            sourceApp: "chatgpt",
            summary,
            themes: input.themes,
            totalConversations: input.totalConversations,
            leadershipConversations: input.leadershipConversations,
            dateRangeFrom: input.dateFrom,
            dateRangeTo: input.dateTo,
            rawFileDeleted: true,
          })
          .where(eq(conversationIntelligence.userId, ctx.user.id));
      } else {
        await db.insert(conversationIntelligence).values({
          userId: ctx.user.id,
          sourceApp: "chatgpt",
          summary,
          themes: input.themes,
          totalConversations: input.totalConversations,
          leadershipConversations: input.leadershipConversations,
          dateRangeFrom: input.dateFrom,
          dateRangeTo: input.dateTo,
          rawFileDeleted: true,
        });
      }

      return {
        success: true,
        themeCount: input.themes.length,
        leadershipConversations: input.leadershipConversations,
      };
    }),

  /**
   * Get the current user's conversation intelligence (if any).
   * Used by Guide to enrich its coaching context.
   */
  getConversationIntelligence: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(conversationIntelligence)
      .where(eq(conversationIntelligence.userId, ctx.user.id))
      .limit(1);

    return rows[0] ?? null;
  }),
});
