import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { platformInvites, users } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";
import crypto from "crypto";

export const platformInvitesRouter = router({
  // Admin: generate a magic link invite for a user
  generateInvite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        pilotApplicationId: z.number().optional(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Expire any existing pending invites for this email
      await db
        .update(platformInvites)
        .set({ status: "expired" })
        .where(
          and(
            eq(platformInvites.email, input.email),
            eq(platformInvites.status, "pending")
          )
        );

      await db.insert(platformInvites).values({
        token,
        email: input.email,
        name: input.name,
        invitedBy: ctx.user.id,
        pilotApplicationId: input.pilotApplicationId,
        expiresAt,
        status: "pending",
      });

      const inviteUrl = `${input.origin}/join?token=${token}`;

      // Send invite email
      const firstName = input.name?.split(" ")[0] || "there";
      await sendEmail({
        to: input.email,
        subject: "You're invited to LevelNext — Your Leadership Intelligence Platform",
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8f7f4; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://manus.space/manus-storage/LevelNext_logo_transparent_a1b2c3.png" alt="LevelNext" style="height: 60px;" />
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e8e6e0;">
              <h1 style="color: #12345A; font-size: 24px; margin: 0 0 16px;">Hi ${firstName},</h1>
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                You've been personally invited to access <strong>LevelNext</strong> — the Leadership Intelligence Platform built for senior leaders who want to know exactly where they stand and close the gap to what's next.
              </p>
              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Your invite gives you access to:
              </p>
              <ul style="color: #1a1a1a; font-size: 15px; line-height: 1.8; margin: 0 0 32px; padding-left: 20px;">
                <li>6 precision leadership diagnostics</li>
                <li>Your personalised Leadership Edge score</li>
                <li>AI Practice Coach for real leadership conversations</li>
                <li>Guide — your AI leadership development advisor</li>
                <li>A 90-day personalised growth plan</li>
              </ul>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${inviteUrl}" style="display: inline-block; background: #F2B705; color: #12345A; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 8px; text-decoration: none;">
                  Accept Your Invitation →
                </a>
              </div>
              <p style="color: #555; font-size: 13px; text-align: center; margin: 0;">
                This invite link expires in 7 days. If you have any questions, reply to this email.
              </p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 24px;">
              LevelNext by Meta Results Pvt. Ltd. · Bangalore, India
            </p>
          </div>
        `,
      });

      // Notify owner
      await notifyOwner({
        title: "Invite Sent",
        content: `Magic link invite sent to ${input.email}${input.name ? ` (${input.name})` : ""}. Expires in 7 days.`,
      });

      return { success: true, inviteUrl, expiresAt };
    }),

  // Admin: list all invites
  listInvites: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
    }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const invites = await db
      .select()
      .from(platformInvites)
      .orderBy(desc(platformInvites.createdAt));
    return invites;
  }),

  // Admin: revoke an invite
  revokeInvite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(platformInvites)
        .set({ status: "expired" })
        .where(eq(platformInvites.id, input.id));
      return { success: true };
    }),

  // Public: validate a token (called when user lands on /join?token=...)
  validateToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [invite] = await db
        .select()
        .from(platformInvites)
        .where(eq(platformInvites.token, input.token))
        .limit(1);

      if (!invite) {
        return { valid: false, reason: "not_found" as const };
      }
      if (invite.status === "accepted") {
        return { valid: false, reason: "already_used" as const };
      }
      if (invite.status === "expired" || new Date() > invite.expiresAt) {
        return { valid: false, reason: "expired" as const };
      }
      return {
        valid: true,
        email: invite.email,
        name: invite.name,
        expiresAt: invite.expiresAt,
      };
    }),

  // Called after user successfully logs in via the invite link — marks invite as accepted
  markAccepted: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(platformInvites)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(
          and(
            eq(platformInvites.token, input.token),
            eq(platformInvites.status, "pending")
          )
        );
      return { success: true };
    }),
});
