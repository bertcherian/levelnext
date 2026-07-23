/**
 * spAssignments router
 * Manages Success Partner (SP) invitations and user assignments.
 *
 * Admin procedures:
 *   inviteSP          — invite a new SP by email (sends magic link + sets role on first sign-in)
 *   listSPs           — list all users with role 'success_partner' with assignment counts
 *   promoteToSP       — promote an existing user to success_partner role
 *   demoteFromSP      — demote a success_partner back to user role
 *   assignUser        — assign a managed user to an SP
 *   unassignUser      — remove a user from an SP's cohort
 *   getSPAssignments  — list all users assigned to a given SP
 *   listUnassignedUsers — list users not yet assigned to any SP
 *
 * SP procedure (success_partner OR admin):
 *   getMyAssignments  — returns users assigned to ctx.user.id
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { and, eq, notInArray, desc } from "drizzle-orm";
import { router, adminProcedure, successPartnerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  spAssignments,
  platformInvites,
  magicLinkTokens,
} from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { notifyOwner } from "../_core/notification";

export const spAssignmentsRouter = router({
  // ── Invite a new Success Partner ────────────────────────────────────────────
  inviteSP: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const firstName = input.name.trim().split(" ")[0];

      // Check if user already exists with this email
      const [existingUser] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        // If they exist but aren't an SP yet, promote them directly
        if (existingUser.role !== "success_partner") {
          await db
            .update(users)
            .set({ role: "success_partner" })
            .where(eq(users.id, existingUser.id));
        }
        // Send a notification email letting them know they've been added as SP
        await sendEmail({
          to: email,
          subject: `${firstName}, you've been added as a Success Partner on LevelNext`,
          html: buildSPWelcomeEmail(firstName, `${input.origin}/home`, false),
        });
        await notifyOwner({
          title: "Success Partner Promoted",
          content: `Existing user ${input.name} (${email}) promoted to Success Partner.`,
        });
        return { success: true, type: "promoted" as const };
      }

      // New user — generate a platform invite with SP role metadata stored in the invite token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Expire any existing pending invites for this email
      await db
        .update(platformInvites)
        .set({ status: "expired" })
        .where(and(eq(platformInvites.email, email), eq(platformInvites.status, "pending")));

      await db.insert(platformInvites).values({
        token,
        email,
        name: input.name,
        invitedBy: ctx.user.id,
        expiresAt,
        status: "pending",
      });

      // Generate a magic link token that carries the invite token
      const mlToken = crypto.randomBytes(48).toString("hex");
      const mlExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(magicLinkTokens).values({
        token: mlToken,
        email,
        inviteToken: token,
        expiresAt: mlExpiresAt,
      });

      // The verify route will set role to success_partner when it sees this invite token
      // We store the SP role intent in the invite token name field as a convention
      // (the verify route will be updated to check for SP invites and set role accordingly)
      const magicLinkUrl = `${input.origin}/api/auth/magic-link/verify?token=${mlToken}&sp=1`;

      await sendEmail({
        to: email,
        subject: `${firstName}, you've been invited as a Success Partner on LevelNext`,
        html: buildSPWelcomeEmail(firstName, magicLinkUrl, true),
      });

      await notifyOwner({
        title: "Success Partner Invited",
        content: `SP invite sent to ${input.name} (${email}). Link expires in 7 days.`,
      });

      return { success: true, type: "invited" as const, expiresAt };
    }),

  // ── List all Success Partners with assignment counts ─────────────────────────
  listSPs: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const sps = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.role, "success_partner"))
      .orderBy(desc(users.createdAt));

    // Enrich with assignment counts
    const enriched = await Promise.all(
      sps.map(async (sp) => {
        const assignments = await db
          .select({ id: spAssignments.id })
          .from(spAssignments)
          .where(eq(spAssignments.spUserId, sp.id));
        return { ...sp, assignedCount: assignments.length };
      })
    );

    return enriched;
  }),

  // ── Promote an existing user to success_partner role ────────────────────────
  promoteToSP: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      if (user.role === "admin") throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change role of an admin." });

      await db.update(users).set({ role: "success_partner" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ── Demote a success_partner back to user role ───────────────────────────────
  demoteFromSP: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      if (user.role !== "success_partner") throw new TRPCError({ code: "BAD_REQUEST", message: "User is not a Success Partner." });

      await db.update(users).set({ role: "user" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ── Assign a user to a Success Partner ──────────────────────────────────────
  assignUser: adminProcedure
    .input(z.object({ spUserId: z.number(), managedUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify SP exists and has correct role
      const [sp] = await db.select({ role: users.role }).from(users).where(eq(users.id, input.spUserId)).limit(1);
      if (!sp) throw new TRPCError({ code: "NOT_FOUND", message: "Success Partner not found." });
      if (sp.role !== "success_partner" && sp.role !== "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Target user is not a Success Partner." });
      }

      // Verify managed user exists
      const [managed] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.managedUserId)).limit(1);
      if (!managed) throw new TRPCError({ code: "NOT_FOUND", message: "Managed user not found." });

      // Check for duplicate assignment
      const [existing] = await db
        .select({ id: spAssignments.id })
        .from(spAssignments)
        .where(and(eq(spAssignments.spUserId, input.spUserId), eq(spAssignments.managedUserId, input.managedUserId)))
        .limit(1);

      if (existing) throw new TRPCError({ code: "CONFLICT", message: "User is already assigned to this Success Partner." });

      await db.insert(spAssignments).values({
        spUserId: input.spUserId,
        managedUserId: input.managedUserId,
        assignedBy: ctx.user.id,
      });

      return { success: true };
    }),

  // ── Remove a user from a Success Partner's cohort ───────────────────────────
  unassignUser: adminProcedure
    .input(z.object({ spUserId: z.number(), managedUserId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(spAssignments)
        .where(and(eq(spAssignments.spUserId, input.spUserId), eq(spAssignments.managedUserId, input.managedUserId)));

      return { success: true };
    }),

  // ── Get all users assigned to a given SP (admin view) ───────────────────────
  getSPAssignments: adminProcedure
    .input(z.object({ spUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const assignments = await db
        .select({
          assignmentId: spAssignments.id,
          assignedAt: spAssignments.assignedAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            lastSignedIn: users.lastSignedIn,
            createdAt: users.createdAt,
          },
        })
        .from(spAssignments)
        .innerJoin(users, eq(spAssignments.managedUserId, users.id))
        .where(eq(spAssignments.spUserId, input.spUserId))
        .orderBy(desc(spAssignments.assignedAt));

      return assignments;
    }),

  // ── List users not yet assigned to any SP ───────────────────────────────────
  listUnassignedUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get all assigned managedUserIds
    const assigned = await db
      .select({ managedUserId: spAssignments.managedUserId })
      .from(spAssignments);

    const assignedIds = assigned.map((a) => a.managedUserId);

    const query = db
      .select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(eq(users.role, "user"))
      .orderBy(desc(users.lastSignedIn));

    if (assignedIds.length === 0) {
      return query;
    }

    return db
      .select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(and(eq(users.role, "user"), notInArray(users.id, assignedIds)))
      .orderBy(desc(users.lastSignedIn));
  }),

  // ── Get my assigned cohort (SP view) ────────────────────────────────────────
  getMyAssignments: successPartnerProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const assignments = await db
      .select({
        assignmentId: spAssignments.id,
        assignedAt: spAssignments.assignedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          lastSignedIn: users.lastSignedIn,
          createdAt: users.createdAt,
        },
      })
      .from(spAssignments)
      .innerJoin(users, eq(spAssignments.managedUserId, users.id))
      .where(eq(spAssignments.spUserId, ctx.user.id))
      .orderBy(desc(spAssignments.assignedAt));

    return assignments;
  }),
});

// ─── Email templates ─────────────────────────────────────────────────────────

function buildSPWelcomeEmail(firstName: string, actionUrl: string, isNewUser: boolean): string {
  const subject = isNewUser
    ? "Accept your invitation and set up your Success Partner workspace"
    : "Your Success Partner workspace is ready";
  const ctaText = isNewUser ? "Accept Invitation & Get Started →" : "Open My Workspace →";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0A1A2F;font-family:'Segoe UI',Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1A2F;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:0 0 32px;text-align:center;">
          <img src="https://storage.manus.space/public/LevelNext_logo_transparent_570ab0aa.png" alt="LevelNext" height="52" style="display:block;margin:0 auto;" />
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:48px 48px 40px;">

          <h1 style="color:#0A1A2F;font-size:24px;font-weight:700;margin:0 0 12px;">Hi ${firstName},</h1>

          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px;">
            You've been added as a <strong>Success Partner</strong> on LevelNext — the Leadership Intelligence Platform by Meta Results.
          </p>

          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
            As a Success Partner, you'll have access to:
          </p>

          <ul style="color:#333;font-size:15px;line-height:1.8;margin:0 0 32px;padding-left:20px;">
            <li>Your assigned cohort of leaders</li>
            <li>Leadership Health Scores for each leader</li>
            <li>AI-generated daily missions and briefings</li>
            <li>Call queue and pre-call intelligence</li>
            <li>Escalation inbox for coach handoffs</li>
          </ul>

          <!-- CTA -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${actionUrl}"
               style="display:inline-block;background:#D4AF37;color:#0A1A2F;font-weight:700;font-size:16px;padding:16px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
              ${ctaText}
            </a>
          </div>

          <p style="color:#888;font-size:13px;text-align:center;margin:0;">
            ${isNewUser ? "This invitation link expires in 7 days." : "You can sign in at any time at levelnext.coach."}
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 0 0;text-align:center;">
          <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0 0 6px;">
            If you didn't expect this email, you can safely ignore it.
          </p>
          <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">
            LevelNext &nbsp;&middot;&nbsp; Meta Results Pvt. Ltd. &nbsp;&middot;&nbsp; Bangalore, India
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
