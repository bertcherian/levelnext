import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { aiSuggestionFeedback } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const feedbackInput = z.object({
  surface: z.enum(["pe_daily_brief", "manager_daily_brief", "career_chief_of_staff", "career_weekly_report"]),
  contentKey: z.string().max(160).optional(),
  suggestionKind: z.enum(["development_suggestion", "daily_focus", "chief_of_staff_brief", "weekly_report"]),
  reason: z.enum(["helpful", "malformed", "unhelpful"]),
  contentSnapshot: z.string().trim().min(1).max(12000),
});

const feedbackDiscoveryInput = z.object({
  reliability: z.enum(["all", "helpful", "unhelpful", "malformed"]).default("all"),
  dateRange: z.enum(["all", "7d", "30d", "90d", "year"]).default("all"),
  sort: z.enum(["newest", "oldest", "reliability"]).default("newest"),
}).default({ reliability: "all", dateRange: "all", sort: "newest" });

function dateThreshold(range: "all" | "7d" | "30d" | "90d" | "year") {
  if (range === "all") return null;
  const date = new Date();
  date.setDate(date.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365));
  return date;
}

export const aiSuggestionFeedbackRouter = router({
  submit: protectedProcedure.input(feedbackInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [created] = await db.insert(aiSuggestionFeedback).values({ ...input, userId: ctx.user.id }).$returningId();
    return { id: created.id, success: true } as const;
  }),
  listMine: protectedProcedure.input(feedbackDiscoveryInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const entries = await db.select().from(aiSuggestionFeedback).where(eq(aiSuggestionFeedback.userId, ctx.user.id)).orderBy(desc(aiSuggestionFeedback.createdAt)).limit(100);
    const threshold = dateThreshold(input.dateRange);
    const filtered = entries.filter((entry) => (input.reliability === "all" || entry.reason === input.reliability) && (!threshold || entry.createdAt >= threshold));
    const severity = { malformed: 0, unhelpful: 1, helpful: 2 } as const;
    return filtered.sort((a, b) => input.sort === "oldest" ? a.createdAt.getTime() - b.createdAt.getTime() : input.sort === "reliability" ? severity[a.reason] - severity[b.reason] || b.createdAt.getTime() - a.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime());
  }),
});
