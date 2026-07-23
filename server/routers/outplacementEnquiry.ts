/**
 * outplacementEnquiry router
 * Handles contact form submissions from organisations interested in
 * using Career Intelligence as an outplacement benefit.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { outplacementEnquiries } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";

export const outplacementEnquiryRouter = router({
  submitEnquiry: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        title: z.string().min(2).max(200),
        organisation: z.string().min(2).max(300),
        email: z.string().email().max(300),
        phone: z.string().max(50).optional(),
        cohortSize: z.string().max(50).optional(),
        message: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Store in DB
      await db.insert(outplacementEnquiries).values({
        name: input.name.trim(),
        title: input.title.trim(),
        organisation: input.organisation.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone?.trim() ?? null,
        cohortSize: input.cohortSize?.trim() ?? null,
        message: input.message?.trim() ?? null,
      });

      // Send notification email to Bert
      const ownerEmail = "bert@metaresults.in";
      const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      await sendEmail({
        to: ownerEmail,
        subject: `New Outplacement Enquiry — ${input.organisation}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: #0A1A2F; padding: 24px 32px;">
      <div style="color: #D4AF37; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">LevelNext</div>
      <div style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 2px;">Career Intelligence — Outplacement Enquiry</div>
    </div>
    <!-- Body -->
    <div style="padding: 28px 32px;">
      <h2 style="margin: 0 0 4px; font-size: 20px; color: #0A1A2F;">New Enquiry from ${input.organisation}</h2>
      <p style="margin: 0 0 24px; color: #666; font-size: 13px;">${submittedAt} IST</p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888; width: 140px; vertical-align: top;">Name</td>
          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${input.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; vertical-align: top;">Title</td>
          <td style="padding: 8px 0; color: #1a1a1a;">${input.title}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; vertical-align: top;">Organisation</td>
          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${input.organisation}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; vertical-align: top;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${input.email}" style="color: #D4AF37;">${input.email}</a></td>
        </tr>
        ${input.phone ? `
        <tr>
          <td style="padding: 8px 0; color: #888; vertical-align: top;">Phone</td>
          <td style="padding: 8px 0; color: #1a1a1a;">${input.phone}</td>
        </tr>` : ""}
        ${input.cohortSize ? `
        <tr>
          <td style="padding: 8px 0; color: #888; vertical-align: top;">Cohort Size</td>
          <td style="padding: 8px 0; color: #1a1a1a;">${input.cohortSize}</td>
        </tr>` : ""}
        ${input.message ? `
        <tr>
          <td style="padding: 8px 0; color: #888; vertical-align: top;">Message</td>
          <td style="padding: 8px 0; color: #1a1a1a; white-space: pre-wrap;">${input.message}</td>
        </tr>` : ""}
      </table>

      <div style="margin-top: 28px; padding: 16px; background: #f8f5f0; border-radius: 6px; border-left: 3px solid #D4AF37;">
        <p style="margin: 0; font-size: 13px; color: #555;">
          <strong>Suggested next step:</strong> Reply within 24 hours to schedule a discovery call.
          This organisation is interested in Career Intelligence as an outplacement benefit for their employees.
        </p>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding: 16px 32px; background: #f0ede8; border-top: 1px solid #e8e4de;">
      <p style="margin: 0; font-size: 11px; color: #999; text-align: center;">
        LevelNext Career Intelligence · Meta Results Pvt. Ltd. · Bengaluru, India
      </p>
    </div>
  </div>
</body>
</html>`,
      });

      // Send acknowledgement to the enquirer
      await sendEmail({
        to: input.email,
        subject: `Thank you for your enquiry — LevelNext Career Intelligence`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #0A1A2F; padding: 24px 32px;">
      <div style="color: #D4AF37; font-size: 18px; font-weight: 700;">LevelNext</div>
      <div style="color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 2px;">Career Intelligence</div>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 12px; font-size: 20px; color: #0A1A2F;">Thank you, ${input.name.split(" ")[0]}.</h2>
      <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        We've received your enquiry about using LevelNext Career Intelligence as an outplacement benefit for ${input.organisation}.
      </p>
      <p style="color: #444; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Bert Cherian will be in touch within one business day to discuss how we can support your employees through their transition.
      </p>
      <div style="padding: 16px; background: #f8f5f0; border-radius: 6px; border-left: 3px solid #D4AF37; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #555;">
          In the meantime, you're welcome to explore the platform at <a href="https://levelnext.coach/career-intelligence" style="color: #D4AF37;">levelnext.coach/career-intelligence</a>
        </p>
      </div>
      <p style="color: #888; font-size: 13px; margin: 0;">
        Warm regards,<br>
        <strong style="color: #0A1A2F;">Bert Cherian</strong><br>
        Founder & CEO, Meta Results Pvt. Ltd.
      </p>
    </div>
    <div style="padding: 16px 32px; background: #f0ede8; border-top: 1px solid #e8e4de;">
      <p style="margin: 0; font-size: 11px; color: #999; text-align: center;">
        Meta Results Pvt. Ltd. · Bengaluru, India · <a href="https://levelnext.coach" style="color: #999;">levelnext.coach</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      });

      return { success: true };
    }),
});
