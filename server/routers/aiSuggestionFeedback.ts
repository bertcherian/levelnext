import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { aiSuggestionFeedback } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

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

type FeedbackReason = "helpful" | "unhelpful" | "malformed";

function startOfUtcDay(daysAgo: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildTrend(entries: Array<{ createdAt: Date; reason: FeedbackReason }>, days: number) {
  const buckets = new Map<string, { date: string; total: number; helpful: number; unhelpful: number; malformed: number }>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = startOfUtcDay(offset);
    buckets.set(dayKey(date), { date: dayKey(date), total: 0, helpful: 0, unhelpful: 0, malformed: 0 });
  }
  for (const entry of entries) {
    const bucket = buckets.get(dayKey(entry.createdAt));
    if (!bucket) continue;
    bucket.total += 1;
    bucket[entry.reason] += 1;
  }
  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function distribution(entries: Array<{ reason: FeedbackReason }>) {
  const counts = { helpful: 0, unhelpful: 0, malformed: 0 };
  for (const entry of entries) counts[entry.reason] += 1;
  const total = counts.helpful + counts.unhelpful + counts.malformed;
  return { total, ...counts, helpfulRate: total ? Math.round((counts.helpful / total) * 100) : 0, concernRate: total ? Math.round(((counts.unhelpful + counts.malformed) / total) * 100) : 0 };
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
  getMyFeedbackAnalytics: protectedProcedure.input(z.object({ days: z.union([z.literal(7), z.literal(14), z.literal(30)]).default(14) }).default({ days: 14 })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const entries = await db.select({ createdAt: aiSuggestionFeedback.createdAt, reason: aiSuggestionFeedback.reason }).from(aiSuggestionFeedback).where(and(eq(aiSuggestionFeedback.userId, ctx.user.id), gte(aiSuggestionFeedback.createdAt, startOfUtcDay(input.days - 1)))).orderBy(desc(aiSuggestionFeedback.createdAt)).limit(500);
    return { days: input.days, trend: buildTrend(entries as Array<{ createdAt: Date; reason: FeedbackReason }>, input.days), distribution: distribution(entries as Array<{ reason: FeedbackReason }>) };
  }),
  getWeeklyQualitySummary: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Platform administrator access is required." });
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const currentStart = startOfUtcDay(6);
    const priorStart = startOfUtcDay(13);
    const entries = await db.select({ createdAt: aiSuggestionFeedback.createdAt, reason: aiSuggestionFeedback.reason, surface: aiSuggestionFeedback.surface }).from(aiSuggestionFeedback).where(gte(aiSuggestionFeedback.createdAt, priorStart)).orderBy(desc(aiSuggestionFeedback.createdAt)).limit(2000);
    const currentEntries = entries.filter((entry) => entry.createdAt >= currentStart) as Array<{ createdAt: Date; reason: FeedbackReason; surface: string }>;
    const priorEntries = entries.filter((entry) => entry.createdAt < currentStart) as Array<{ createdAt: Date; reason: FeedbackReason; surface: string }>;
    const surfaceCounts = new Map<string, number>();
    for (const entry of currentEntries) surfaceCounts.set(entry.surface, (surfaceCounts.get(entry.surface) ?? 0) + 1);
    return { windowStart: dayKey(currentStart), windowEnd: dayKey(new Date()), feedback: distribution(currentEntries), priorWeekVolume: priorEntries.length, volumeChange: currentEntries.length - priorEntries.length, dailyTrend: buildTrend(currentEntries, 7), surfaces: Array.from(surfaceCounts.entries()).map(([surface, count]) => ({ surface, count })).sort((a, b) => b.count - a.count || a.surface.localeCompare(b.surface)) };
  }),
});
