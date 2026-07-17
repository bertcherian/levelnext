/**
 * emailAuth router
 * Provides magic link email authentication so clients can sign in
 * without a Manus account — just their email address.
 *
 * Flow:
 * 1. Client enters email on /login page
 * 2. requestMagicLink: generates a one-time token, emails a sign-in link
 * 3. Client clicks the link → GET /api/auth/magic-link/verify?token=...
 * 4. Server validates token, creates/upserts user, sets session cookie, redirects to /
 */

import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { magicLinkTokens, platformInvites, userProductEnrollments, users } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export const emailAuthRouter = router({
  /**
   * Step 1: Client submits their email.
   * We generate a token, store it, and email a sign-in link.
   * If inviteToken is provided (from /login?invite=...), we store it
   * so it can be auto-accepted after sign-in.
   */
  requestMagicLink: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        origin: z.string().url(),
        inviteToken: z.string().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const email = input.email.toLowerCase().trim();
      const firstName = input.name?.trim().split(" ")[0] ?? null;
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

      // Store the magic link token
      await db.insert(magicLinkTokens).values({
        token,
        email,
        inviteToken: input.inviteToken ?? null,
        expiresAt,
      });

      const magicLinkUrl = `${input.origin}/api/auth/magic-link/verify?token=${token}`;

      // Send the email
      const greeting = firstName ? `Hi ${firstName},` : "Hi,";
      const emailSent = await sendEmail({
        to: email,
        subject: "Your LevelNext sign-in link",
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; background: #f9f7f4;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663042201754/bTOVEpcgUNmrJVXC.png" alt="LevelNext" style="height: 40px;" />
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e8e6e0;">
              <h1 style="color: #12345A; font-size: 22px; margin: 0 0 8px;">Sign in to LevelNext</h1>
              <p style="color: #555; font-size: 15px; margin: 0 0 24px;">${greeting}</p>
              <p style="color: #1a1a1a; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Click the button below to sign in. This link is valid for ${MAGIC_LINK_EXPIRY_MINUTES} minutes and can only be used once.
              </p>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${magicLinkUrl}" style="display: inline-block; background: #F2B705; color: #12345A; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 8px; text-decoration: none;">
                  Sign In to LevelNext →
                </a>
              </div>
              <p style="color: #555; font-size: 13px; text-align: center; margin: 0 0 8px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #888; font-size: 12px; text-align: center; word-break: break-all; margin: 0;">
                ${magicLinkUrl}
              </p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.<br/>
              LevelNext by Meta Results Pvt. Ltd. · Bangalore, India
            </p>
          </div>
        `,
      });

      if (!emailSent) {
        // SMTP not configured — in dev, return the token so we can test without email
        if (process.env.NODE_ENV === "development") {
          console.log(`[MagicLink] DEV MODE — token for ${email}: ${token}`);
          console.log(`[MagicLink] DEV MODE — link: ${magicLinkUrl}`);
          return { success: true, devToken: token };
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send sign-in email. Please try again or contact support.",
        });
      }

      return { success: true };
    }),

  /**
   * Check if an invite token is valid and return the associated email.
   * Used to pre-fill the email field on /login?invite=...
   */
  getInviteInfo: publicProcedure
    .input(z.object({ inviteToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [invite] = await db
        .select()
        .from(platformInvites)
        .where(
          and(
            eq(platformInvites.token, input.inviteToken),
            eq(platformInvites.status, "pending")
          )
        )
        .limit(1);

      if (!invite) return { valid: false as const };
      if (new Date() > invite.expiresAt) return { valid: false as const, reason: "expired" as const };

      return {
        valid: true as const,
        email: invite.email,
        name: invite.name ?? null,
      };
    }),
});

/**
 * Express route: GET /api/auth/magic-link/verify?token=...
 * Validates the token, creates/finds the user, sets the session cookie,
 * auto-accepts any linked platform invite, and redirects to the app.
 *
 * This is a plain Express route (not tRPC) because it needs to set a cookie
 * and perform a browser redirect.
 */
export async function registerMagicLinkVerifyRoute(app: import("express").Express) {
  const { sdk } = await import("../_core/sdk");
  const { getSessionCookieOptions } = await import("../_core/cookies");
  const { COOKIE_NAME, ONE_YEAR_MS } = await import("../../shared/const");

  app.get("/api/auth/magic-link/verify", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : null;
    const origin = `${req.protocol}://${req.get("host")}`;

    if (!token) {
      res.redirect(`${origin}/login?error=missing_token`);
      return;
    }

    const db = await getDb();
    if (!db) {
      res.redirect(`${origin}/login?error=db_unavailable`);
      return;
    }

    try {
      // Find the token
      const [magicLink] = await db
        .select()
        .from(magicLinkTokens)
        .where(
          and(
            eq(magicLinkTokens.token, token),
            isNull(magicLinkTokens.usedAt),
            gt(magicLinkTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!magicLink) {
        res.redirect(`${origin}/login?error=invalid_or_expired`);
        return;
      }

      const email = magicLink.email;

      // Find or create the user
      // For magic link users, openId is derived from their email (email-based identity)
      const openId = `email_${Buffer.from(email).toString("base64url")}`;

      // Track whether this is a brand-new user for post-login redirect
      let isNewUser = false;

      // Check if user already exists by openId
      let [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      if (!existingUser) {
        // Also check by email (in case they previously signed in via Manus OAuth with same email)
        const [userByEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (userByEmail) {
          // Merge: link the email-based openId to the existing account
          existingUser = userByEmail;
        } else {
          // Create a new user
          isNewUser = true;
          await db.insert(users).values({
            openId,
            email,
            name: email.split("@")[0], // default name from email prefix
            loginMethod: "magic_link",
            lastSignedIn: new Date(),
          });
          const [newUser] = await db
            .select()
            .from(users)
            .where(eq(users.openId, openId))
            .limit(1);
          existingUser = newUser;
        }
      }

      if (!existingUser) {
        res.redirect(`${origin}/login?error=user_creation_failed`);
        return;
      }

      // Mark token as used
      await db
        .update(magicLinkTokens)
        .set({ usedAt: new Date(), userId: existingUser.id })
        .where(eq(magicLinkTokens.token, token));

      // Auto-accept platform invite if present, and auto-enroll in the specified product
      if (magicLink.inviteToken) {
        // Fetch the invite to get productId before marking accepted
        const [invite] = await db
          .select()
          .from(platformInvites)
          .where(
            and(
              eq(platformInvites.token, magicLink.inviteToken),
              eq(platformInvites.status, "pending")
            )
          )
          .limit(1);

        await db
          .update(platformInvites)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(
            and(
              eq(platformInvites.token, magicLink.inviteToken),
              eq(platformInvites.status, "pending")
            )
          );

        // Auto-enroll user in the product specified on the invite
        if (invite?.productId) {
          const [existing] = await db
            .select()
            .from(userProductEnrollments)
            .where(
              and(
                eq(userProductEnrollments.userId, existingUser.id),
                eq(userProductEnrollments.productId, invite.productId)
              )
            )
            .limit(1);

          if (existing) {
            await db
              .update(userProductEnrollments)
              .set({ isActive: true, lastActiveAt: new Date() })
              .where(eq(userProductEnrollments.id, existing.id));
          } else {
            await db.insert(userProductEnrollments).values({
              userId: existingUser.id,
              productId: invite.productId,
              enrolledBy: invite.invitedBy ?? null,
              isActive: true,
              lastActiveAt: new Date(),
            });
          }
        }
      }

      // Update lastSignedIn
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, existingUser.id));

      // Create session token
      const sessionToken = await sdk.createSessionToken(existingUser.openId, {
        name: existingUser.name ?? email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Determine the correct post-login destination:
      // - New users → /onboard
      // - Returning users → route to their active product home
      let postLoginPath = "/home"; // default: Leadership Intelligence
      if (!isNewUser) {
        // Look up the user's most recently active enrollment to pick the right home
        const [activeEnrollment] = await db
          .select({ productId: userProductEnrollments.productId })
          .from(userProductEnrollments)
          .where(
            and(
              eq(userProductEnrollments.userId, existingUser.id),
              eq(userProductEnrollments.isActive, true)
            )
          )
          .orderBy(desc(userProductEnrollments.lastActiveAt))
          .limit(1);
        if (activeEnrollment?.productId === "manager_effectiveness") {
          postLoginPath = "/manager";
        } else if (activeEnrollment?.productId === "career_intelligence") {
          postLoginPath = "/career";
        }
      } else {
        postLoginPath = "/onboard";
      }
      res.redirect(302, `${origin}${postLoginPath}`);
    } catch (error) {
      console.error("[MagicLink] Verify failed:", error);
      res.redirect(`${origin}/login?error=server_error`);
    }
  });
}
