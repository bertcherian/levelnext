import { z } from "zod";
import { aiSuggestionFeedback } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const feedbackInput = z.object({
  surface: z.enum(["pe_daily_brief", "manager_daily_brief", "career_chief_of_staff", "career_weekly_report"]),
  contentKey: z.string().max(160).optional(),
  suggestionKind: z.enum(["development_suggestion", "daily_focus", "chief_of_staff_brief", "weekly_report"]),
  reason: z.enum(["malformed", "unhelpful"]),
  contentSnapshot: z.string().trim().min(1).max(12000),
});

export const aiSuggestionFeedbackRouter = router({
  submit: protectedProcedure.input(feedbackInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [created] = await db.insert(aiSuggestionFeedback).values({ ...input, userId: ctx.user.id }).$returningId();
    return { id: created.id, success: true } as const;
  }),
});
