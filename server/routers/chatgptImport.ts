/**
 * AI Conversation Intelligence Import Router (Option A — Process & Delete)
 *
 * Supports three import modes:
 *  1. ChatGPT ZIP export  — parses conversations.json
 *  2. Claude ZIP export   — parses claude_conversations.json or HTML files
 *  3. Text paste          — raw text from emails, documents, or copied conversations
 *
 * Privacy architecture:
 *  - Raw ZIP / text is held in memory only (never written to disk or S3)
 *  - LLM synthesis runs server-side
 *  - Only the leader-approved structured summary is persisted to the DB
 *  - rawFileDeleted flag is always set to true
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
import { invokeLLM, safeJsonParse } from "../_core/llm";
import { eq } from "drizzle-orm";
import type { ConversationIntelligenceTheme } from "../../drizzle/schema";

// ─── Leadership keyword filter ────────────────────────────────────────────────
const LEADERSHIP_KEYWORDS = [
  "leadership", "leader", "team", "manager", "management", "employee",
  "feedback", "performance", "strategy", "strategic", "stakeholder",
  "executive", "decision", "conflict", "communication", "influence",
  "difficult conversation", "promotion", "career", "coaching", "mentor",
  "culture", "organisation", "organization", "board", "ceo", "cto", "cfo",
  "chro", "vp", "director", "delegate", "delegation", "accountability",
  "trust", "vision", "alignment", "change management", "transformation",
  "hire", "firing", "restructure", "presentation", "negotiation",
  "burnout", "stress", "work-life", "boundary", "priorit", "scale",
  "founder", "startup", "investor", "pitch", "fundrais",
];

function isLeadershipRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return LEADERSHIP_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── ChatGPT export types ─────────────────────────────────────────────────────
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

function extractChatGptText(conv: ChatGptConversation): string {
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

// ─── Claude export types ──────────────────────────────────────────────────────
// Claude exports conversations.json with a slightly different schema
type ClaudeMessage = {
  uuid: string;
  text: string;
  sender: "human" | "assistant";
  created_at: string;
};
type ClaudeConversation = {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  chat_messages: ClaudeMessage[];
};

function extractClaudeText(conv: ClaudeConversation): string {
  return (conv.chat_messages ?? [])
    .map((m) => `[${m.sender === "human" ? "USER" : "ASSISTANT"}]: ${m.text?.trim() ?? ""}`)
    .filter((line) => line.length > 10)
    .join("\n");
}

// ─── HTML fallback parser for Claude ─────────────────────────────────────────
// Claude may export HTML files alongside or instead of JSON
function extractTextFromHtml(html: string): string {
  // Strip all HTML tags and decode basic entities
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Parse ChatGPT ZIP ────────────────────────────────────────────────────────
function parseChatGptZip(zipBuffer: Buffer): Array<{ title: string; text: string; date: string }> {
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
  const conversations = JSON.parse(raw) as ChatGptConversation[];
  if (!Array.isArray(conversations) || conversations.length === 0) {
    throw new Error("No conversations found in the ChatGPT export file.");
  }
  return conversations.map((conv) => ({
    title: conv.title ?? "Untitled",
    text: extractChatGptText(conv),
    date: conv.create_time
      ? new Date(conv.create_time * 1000).toISOString().split("T")[0]
      : "unknown",
  }));
}

// ─── Parse Claude ZIP ─────────────────────────────────────────────────────────
function parseClaudeZip(zipBuffer: Buffer): Array<{ title: string; text: string; date: string }> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  // Try JSON first — Claude exports conversations.json
  const jsonEntry = entries.find(
    (e) =>
      e.entryName === "conversations.json" ||
      e.entryName.endsWith("/conversations.json") ||
      e.entryName === "claude_conversations.json" ||
      e.entryName.endsWith("/claude_conversations.json")
  );

  if (jsonEntry) {
    const raw = jsonEntry.getData().toString("utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fall through to HTML
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      // Check if it looks like Claude format (has chat_messages) or ChatGPT format (has mapping)
      const first = parsed[0] as Record<string, unknown>;
      if (first.chat_messages !== undefined) {
        // Claude format
        return (parsed as ClaudeConversation[]).map((conv) => ({
          title: conv.name ?? "Untitled",
          text: extractClaudeText(conv),
          date: conv.created_at ? conv.created_at.split("T")[0] : "unknown",
        }));
      } else if (first.mapping !== undefined) {
        // ChatGPT format inside a Claude-labelled ZIP (edge case)
        return (parsed as ChatGptConversation[]).map((conv) => ({
          title: conv.title ?? "Untitled",
          text: extractChatGptText(conv),
          date: conv.create_time
            ? new Date(conv.create_time * 1000).toISOString().split("T")[0]
            : "unknown",
        }));
      }
    }
  }

  // HTML fallback — collect all .html files in the ZIP
  const htmlEntries = entries.filter(
    (e) => e.entryName.endsWith(".html") && !e.entryName.includes("__MACOSX")
  );
  if (htmlEntries.length > 0) {
    return htmlEntries.map((e) => {
      const html = e.getData().toString("utf-8");
      const text = extractTextFromHtml(html);
      const name = e.entryName.replace(/.*\//, "").replace(".html", "");
      return { title: name, text, date: "unknown" };
    });
  }

  throw new Error(
    "Could not find conversation data in the Claude export ZIP. " +
    "Please ensure you downloaded the full export from Settings → Privacy → Export Data."
  );
}

// ─── Detect ZIP source ────────────────────────────────────────────────────────
function detectZipSource(zipBuffer: Buffer): "chatgpt" | "claude" | "unknown" {
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries().map((e) => e.entryName);

    // ChatGPT exports always have conversations.json at root + user.json
    if (entries.some((e) => e === "conversations.json") && entries.some((e) => e.includes("user.json"))) {
      return "chatgpt";
    }
    // Claude exports typically have conversations.json but also account.json or projects.json
    if (entries.some((e) => e.includes("conversations.json"))) {
      if (entries.some((e) => e.includes("account.json") || e.includes("projects.json"))) {
        return "claude";
      }
      // Ambiguous — try to detect by parsing the JSON structure
      const convEntry = entries.find((e) => e.endsWith("conversations.json"));
      if (convEntry) {
        const zip2 = new AdmZip(zipBuffer);
        const raw = zip2.getEntries().find((e) => e.entryName.endsWith("conversations.json"))?.getData().toString("utf-8") ?? "[]";
        const parsed = safeJsonParse<unknown[]>(raw, [], "chatgptImport.detectFormat");
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0] as Record<string, unknown>;
          if (first.chat_messages !== undefined) return "claude";
          if (first.mapping !== undefined) return "chatgpt";
        }
      }
    }
    // HTML files only → likely Claude
    if (entries.some((e) => e.endsWith(".html"))) return "claude";
  } catch {
    // ignore
  }
  return "unknown";
}

// ─── LLM synthesis (shared) ───────────────────────────────────────────────────
async function synthesiseLeadershipThemes(
  conversations: Array<{ title: string; text: string; date: string }>,
  sourceLabel: string
): Promise<{
  overallSynthesis: string;
  themes: ConversationIntelligenceTheme[];
}> {
  const digest = conversations
    .slice(0, 30)
    .map((c) => `### ${c.title} (${c.date})\n${c.text.slice(0, 400)}`)
    .join("\n\n")
    .slice(0, 6000);

  const prompt = `You are an executive coach analysing a leader's AI conversation history (source: ${sourceLabel}) to identify recurring leadership themes, challenges, and patterns.

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

  const parsed = safeJsonParse<{ overallSynthesis?: string; themes?: ConversationIntelligenceTheme[] }>(jsonMatch[0], { overallSynthesis: "", themes: [] }, "chatgptImport.synthesiseFromZip");
  return {
    overallSynthesis: parsed.overallSynthesis ?? "",
    themes: (parsed.themes ?? []) as ConversationIntelligenceTheme[],
  };
}

// ─── Text paste synthesis ─────────────────────────────────────────────────────
async function synthesiseFromText(
  text: string,
  sourceLabel: string
): Promise<{
  overallSynthesis: string;
  themes: ConversationIntelligenceTheme[];
}> {
  const truncated = text.slice(0, 8000);

  const prompt = `You are an executive coach analysing text provided by a leader (source: ${sourceLabel}) to identify leadership themes, challenges, and patterns.

The following is text the leader has shared — it may be emails, documents, conversation excerpts, or notes:

---
${truncated}
---

Your task: synthesise the most significant leadership themes. Return ONLY valid JSON (no markdown, no explanation):

{
  "overallSynthesis": "3-4 sentence executive summary of the leadership patterns, challenges, and thinking style evident in this text",
  "themes": [
    {
      "id": "snake_case_id",
      "title": "Theme Title (3-5 words)",
      "description": "2-3 sentence description of this pattern and why it matters for this leader's development",
      "frequency": "high|medium|low",
      "evidenceCount": <number of distinct instances or references>,
      "category": "challenge|strength|pattern|goal"
    }
  ]
}

Rules:
- Identify 3-6 themes maximum
- Be specific and honest — name the actual pattern, not a generic label
- category "challenge" = recurring difficulty or blind spot
- category "strength" = demonstrated capability
- category "pattern" = neutral recurring behaviour or thinking style
- category "goal" = aspirations or development intentions expressed
- Do NOT invent themes not evidenced in the text`;

  const response = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
  });

  const rawContent = response.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      overallSynthesis: "Leadership themes were extracted from the provided text.",
      themes: [],
    };
  }

  const parsed = safeJsonParse<{ overallSynthesis?: string; themes?: ConversationIntelligenceTheme[] }>(jsonMatch[0], { overallSynthesis: "", themes: [] }, "chatgptImport.synthesiseFromText");
  return {
    overallSynthesis: parsed.overallSynthesis ?? "",
    themes: (parsed.themes ?? []) as ConversationIntelligenceTheme[],
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const chatgptImportRouter = router({
  /**
   * Parse a ChatGPT or Claude ZIP export.
   * Auto-detects the source from the ZIP structure.
   * Raw data is NEVER persisted — only the synthesis is returned.
   */
  parseAiZip: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        fileName: z.string().optional(),
        hintSource: z.enum(["chatgpt", "claude", "auto"]).default("auto"),
      })
    )
    .mutation(async ({ input }) => {
      const zipBuffer = Buffer.from(input.fileBase64, "base64");

      // Detect source
      const detectedSource =
        input.hintSource !== "auto"
          ? input.hintSource
          : detectZipSource(zipBuffer);

      let allConversations: Array<{ title: string; text: string; date: string }>;
      let resolvedSource: "chatgpt" | "claude";

      if (detectedSource === "claude") {
        allConversations = parseClaudeZip(zipBuffer);
        resolvedSource = "claude";
      } else {
        // Default to ChatGPT parser; if it fails, try Claude
        try {
          allConversations = parseChatGptZip(zipBuffer);
          resolvedSource = "chatgpt";
        } catch (chatgptErr) {
          try {
            allConversations = parseClaudeZip(zipBuffer);
            resolvedSource = "claude";
          } catch {
            throw chatgptErr; // surface the original error
          }
        }
      }

      if (allConversations.length === 0) {
        throw new Error("No conversations found in the export file.");
      }

      // Date range
      const dates = allConversations
        .map((c) => c.date)
        .filter((d) => d !== "unknown")
        .sort();
      const dateFrom = dates[0] ?? "unknown";
      const dateTo = dates[dates.length - 1] ?? "unknown";

      // Filter to leadership-relevant
      const leadershipConvs = allConversations.filter(
        (c) => isLeadershipRelevant(c.title + " " + c.text) && c.text.length > 50
      );

      if (leadershipConvs.length === 0) {
        throw new Error(
          "No leadership-related conversations were found in your export. " +
          "LevelNext looks for conversations about teams, strategy, communication, stakeholders, and leadership challenges."
        );
      }

      const sourceLabel = resolvedSource === "claude" ? "Claude (Anthropic)" : "ChatGPT (OpenAI)";
      const { overallSynthesis, themes } = await synthesiseLeadershipThemes(leadershipConvs, sourceLabel);

      return {
        source: resolvedSource,
        totalConversations: allConversations.length,
        leadershipConversations: leadershipConvs.length,
        dateFrom,
        dateTo,
        overallSynthesis,
        themes,
      };
    }),

  /**
   * Synthesise leadership themes from pasted text (emails, documents, conversations).
   * Raw text is NEVER persisted — only the synthesis is returned.
   */
  parseTextPaste: protectedProcedure
    .input(
      z.object({
        text: z.string().min(100, "Please paste at least 100 characters of text.").max(50000),
        sourceLabel: z.string().default("Pasted text"),
      })
    )
    .mutation(async ({ input }) => {
      if (!isLeadershipRelevant(input.text)) {
        throw new Error(
          "The pasted text does not appear to contain leadership-related content. " +
          "Please paste emails, documents, or conversations about your work as a leader."
        );
      }

      const { overallSynthesis, themes } = await synthesiseFromText(input.text, input.sourceLabel);

      return {
        source: "text_paste" as const,
        characterCount: input.text.length,
        overallSynthesis,
        themes,
      };
    }),

  /**
   * Persist the leader-approved themes to the conversation_intelligence table.
   * Supports all three sources: chatgpt, claude, text_paste.
   */
  confirmImport: protectedProcedure
    .input(
      z.object({
        source: z.enum(["chatgpt", "claude", "text_paste"]),
        totalConversations: z.number().optional(),
        leadershipConversations: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
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
        totalConversations: input.totalConversations ?? 0,
        leadershipConversations: input.leadershipConversations ?? 0,
        dateRange: { from: input.dateFrom ?? "", to: input.dateTo ?? "" },
        overallSynthesis: input.overallSynthesis,
        themes: input.themes,
        importedAt: new Date().toISOString(),
        sourceApp: input.source,
      };

      const existing = await db
        .select({ id: conversationIntelligence.id })
        .from(conversationIntelligence)
        .where(eq(conversationIntelligence.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(conversationIntelligence)
          .set({
            sourceApp: input.source,
            summary,
            themes: input.themes,
            totalConversations: input.totalConversations ?? 0,
            leadershipConversations: input.leadershipConversations ?? 0,
            dateRangeFrom: input.dateFrom ?? "",
            dateRangeTo: input.dateTo ?? "",
            rawFileDeleted: true,
          })
          .where(eq(conversationIntelligence.userId, ctx.user.id));
      } else {
        await db.insert(conversationIntelligence).values({
          userId: ctx.user.id,
          sourceApp: input.source,
          summary,
          themes: input.themes,
          totalConversations: input.totalConversations ?? 0,
          leadershipConversations: input.leadershipConversations ?? 0,
          dateRangeFrom: input.dateFrom ?? "",
          dateRangeTo: input.dateTo ?? "",
          rawFileDeleted: true,
        });
      }

      return {
        success: true,
        themeCount: input.themes.length,
        source: input.source,
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

  // Keep backward-compat aliases for any existing calls
  parseChatgptZip: protectedProcedure
    .input(z.object({ fileBase64: z.string(), fileName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const zipBuffer = Buffer.from(input.fileBase64, "base64");
      const allConversations = parseChatGptZip(zipBuffer);
      const dates = allConversations.map((c) => c.date).filter((d) => d !== "unknown").sort();
      const leadershipConvs = allConversations.filter(
        (c) => isLeadershipRelevant(c.title + " " + c.text) && c.text.length > 50
      );
      if (leadershipConvs.length === 0) throw new Error("No leadership conversations found.");
      const { overallSynthesis, themes } = await synthesiseLeadershipThemes(leadershipConvs, "ChatGPT");
      return {
        source: "chatgpt" as const,
        totalConversations: allConversations.length,
        leadershipConversations: leadershipConvs.length,
        dateFrom: dates[0] ?? "unknown",
        dateTo: dates[dates.length - 1] ?? "unknown",
        overallSynthesis,
        themes,
      };
    }),

  confirmChatgptImport: protectedProcedure
    .input(z.object({
      totalConversations: z.number(),
      leadershipConversations: z.number(),
      dateFrom: z.string(),
      dateTo: z.string(),
      overallSynthesis: z.string(),
      themes: z.array(z.object({
        id: z.string(), title: z.string(), description: z.string(),
        frequency: z.enum(["high", "medium", "low"]),
        evidenceCount: z.number(),
        category: z.enum(["challenge", "strength", "pattern", "goal"]),
      })),
    }))
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
      const existing = await db.select({ id: conversationIntelligence.id })
        .from(conversationIntelligence)
        .where(eq(conversationIntelligence.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) {
        await db.update(conversationIntelligence).set({
          sourceApp: "chatgpt", summary, themes: input.themes,
          totalConversations: input.totalConversations,
          leadershipConversations: input.leadershipConversations,
          dateRangeFrom: input.dateFrom, dateRangeTo: input.dateTo, rawFileDeleted: true,
        }).where(eq(conversationIntelligence.userId, ctx.user.id));
      } else {
        await db.insert(conversationIntelligence).values({
          userId: ctx.user.id, sourceApp: "chatgpt", summary, themes: input.themes,
          totalConversations: input.totalConversations,
          leadershipConversations: input.leadershipConversations,
          dateRangeFrom: input.dateFrom, dateRangeTo: input.dateTo, rawFileDeleted: true,
        });
      }
      return { success: true, themeCount: input.themes.length };
    }),
});
