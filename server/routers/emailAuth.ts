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
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { magicLinkTokens, platformInvites, users } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { getMagicLinkRedirectLocation } from "./magicLinkDestination";

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
        returnTo: z.string().optional(), // post-login redirect path e.g. /career, /manager
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
        returnTo: input.returnTo ?? null,
        expiresAt,
      });

      const magicLinkUrl = `${input.origin}/api/auth/magic-link/verify?token=${token}`;

      // Send the email
      const greeting = firstName ? `Hi ${firstName},` : "Hi,";
      const isNewUser = !firstName; // rough heuristic — name only set on signup
      const emailSent = await sendEmail({
        to: email,
        subject: firstName ? `${firstName}, your LevelNext sign-in link` : "Your LevelNext sign-in link",
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Sign in to LevelNext</title></head>
<body style="margin:0;padding:0;background:#0A1A2F;font-family:'Segoe UI',Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1A2F;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:0 0 32px;text-align:center;">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663042201754/lFoigStnAEQVqCmi.png" alt="LevelNext" height="52" style="display:block;margin:0 auto;" />
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#ffffff;border-radius:16px;padding:48px 48px 40px;">

          <!-- Gold accent bar -->
          <div style="width:48px;height:4px;background:#D4AF37;border-radius:2px;margin-bottom:28px;"></div>

          <!-- Greeting -->
          <h1 style="color:#0A1A2F;font-size:24px;font-weight:700;margin:0 0 8px;line-height:1.3;">
            ${greeting}
          </h1>
          <p style="color:#1C1C1C;font-size:16px;line-height:1.6;margin:0 0 28px;">
            ${isNewUser
              ? "Welcome to LevelNext — your Leadership Intelligence Platform. Click below to access your account and begin your leadership journey."
              : "Your sign-in link is ready. Click the button below to access LevelNext."
            }
          </p>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#D4AF37;border-radius:10px;">
              <a href="${magicLinkUrl}" style="display:inline-block;background:#D4AF37;color:#0A1A2F;font-weight:700;font-size:17px;padding:18px 48px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                Sign In to LevelNext &rarr;
              </a>
            </td></tr>
          </table>

          <!-- Expiry notice -->
          <p style="color:#666;font-size:13px;text-align:center;margin:0 0 32px;">
            This link expires in <strong>${MAGIC_LINK_EXPIRY_MINUTES} minutes</strong> and can only be used once.
          </p>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #F0EDE8;margin:0 0 28px;" />

          <!-- What's inside (only for new users) -->
          ${isNewUser ? `
          <p style="color:#0A1A2F;font-size:13px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.06em;">What's waiting for you</p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td width="50%" style="padding:0 8px 12px 0;vertical-align:top;">
                <div style="background:#F8F5F0;border-radius:8px;padding:14px;">
                  <p style="color:#D4AF37;font-size:18px;margin:0 0 4px;">&#129504;</p>
                  <p style="color:#0A1A2F;font-size:13px;font-weight:600;margin:0 0 2px;">6 Precision Diagnostics</p>
                  <p style="color:#666;font-size:12px;margin:0;">ECI, LII, TII, GCC, LDI, STI</p>
                </div>
              </td>
              <td width="50%" style="padding:0 0 12px 8px;vertical-align:top;">
                <div style="background:#F8F5F0;border-radius:8px;padding:14px;">
                  <p style="color:#D4AF37;font-size:18px;margin:0 0 4px;">&#127919;</p>
                  <p style="color:#0A1A2F;font-size:13px;font-weight:600;margin:0 0 2px;">Daily AI Coaching</p>
                  <p style="color:#666;font-size:12px;margin:0;">Guide knows your exact profile</p>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                <div style="background:#F8F5F0;border-radius:8px;padding:14px;">
                  <p style="color:#D4AF37;font-size:18px;margin:0 0 4px;">&#9889;</p>
                  <p style="color:#0A1A2F;font-size:13px;font-weight:600;margin:0 0 2px;">AI Practice Coach</p>
                  <p style="color:#666;font-size:12px;margin:0;">Rehearse real conversations</p>
                </div>
              </td>
              <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                <div style="background:#F8F5F0;border-radius:8px;padding:14px;">
                  <p style="color:#D4AF37;font-size:18px;margin:0 0 4px;">&#128200;</p>
                  <p style="color:#0A1A2F;font-size:13px;font-weight:600;margin:0 0 2px;">Career Intelligence</p>
                  <p style="color:#666;font-size:12px;margin:0;">Map your leadership graph</p>
                </div>
              </td>
            </tr>
          </table>
          ` : ""}

          <!-- Fallback link -->
          <p style="color:#999;font-size:12px;text-align:center;margin:0 0 4px;">Button not working? Copy and paste this link:</p>
          <p style="color:#0A1A2F;font-size:11px;text-align:center;word-break:break-all;margin:0;">${magicLinkUrl}</p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 0 0;text-align:center;">
          <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0 0 6px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
          <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">
            LevelNext &nbsp;&middot;&nbsp; Meta Results Pvt. Ltd. &nbsp;&middot;&nbsp; Bangalore, India
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
    // Use X-Forwarded-Host when behind a reverse proxy (Cloud Run / CDN) so the
    // cookie domain and redirect URL match the real public hostname (e.g. levelnext.coach)
    // rather than the internal Cloud Run hostname.
    const forwardedHost = req.headers["x-forwarded-host"];
    const publicHost = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get("host");
    const origin = `${req.protocol}://${publicHost}`;

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

      // Auto-accept platform invite if present
      if (magicLink.inviteToken) {
        await db
          .update(platformInvites)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(
            and(
              eq(platformInvites.token, magicLink.inviteToken),
              eq(platformInvites.status, "pending")
            )
          );
      }

      // If this is a Success Partner invite (sp=1 query param), promote the user
      const isSPInvite = req.query.sp === "1";
      if (isSPInvite && existingUser.role !== "admin" && existingUser.role !== "success_partner") {
        await db
          .update(users)
          .set({ role: "success_partner" })
          .where(eq(users.id, existingUser.id));
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

      // Pass the session token as _st URL param so the client can store it in
      // sessionStorage as a Bearer token fallback when SameSite cookies are
      // blocked (Cloud Run cross-origin, Safari ITP, WebView, etc.).
      res.redirect(302, getMagicLinkRedirectLocation({
        origin,
        sessionToken,
        isNewUser,
        isSPInvite,
        returnTo: magicLink.returnTo,
      }));
    } catch (error) {
      console.error("[MagicLink] Verify failed:", error);
      res.redirect(`${origin}/login?error=server_error`);
    }
  });
}
