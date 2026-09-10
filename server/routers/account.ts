import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { isValidWhatsappNumber } from "../../shared/whatsapp";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

const whatsappInput = z
  .string()
  .trim()
  .refine(isValidWhatsappNumber, "Enter a valid WhatsApp number")
  .nullable();

export const accountRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [profile] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        whatsappNumber: users.whatsappNumber,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
    return profile;
  }),

  updateWhatsapp: protectedProcedure
    .input(z.object({ whatsappNumber: whatsappInput }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const normalized = input.whatsappNumber ? `+${input.whatsappNumber.replace(/\D/g, "")}` : null;
      await db.update(users).set({ whatsappNumber: normalized }).where(eq(users.id, ctx.user.id));

      return { success: true as const, whatsappNumber: normalized };
    }),
});
