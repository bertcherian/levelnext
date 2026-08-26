import { desc, gte } from "drizzle-orm";
import { z } from "zod";
import { clientErrorEvents } from "../../drizzle/schema";
import { getDb } from "../db";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";

const telemetryInput = z.object({
  eventType: z.enum(["lazy_chunk_load_failure", "render_failure"]),
  route: z.string().regex(/^\/[A-Za-z0-9/_-]*$/).max(255),
});

export const clientTelemetryRouter = router({
  record: protectedProcedure.input(telemetryInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false } as const;
    await db.insert(clientErrorEvents).values({ ...input, userId: ctx.user.id });
    return { success: true } as const;
  }),
  recent: adminProcedure.input(z.object({ days: z.number().int().min(1).max(30).default(7) }).default({ days: 7 })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - input.days);
    return db.select().from(clientErrorEvents).where(gte(clientErrorEvents.createdAt, threshold)).orderBy(desc(clientErrorEvents.createdAt)).limit(200);
  }),
});
