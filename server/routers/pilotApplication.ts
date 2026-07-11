import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { pilotApplications } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../_core/email";

export const pilotApplicationRouter = router({
  // Public: submit a pilot application
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name is required"),
        email: z.string().email("Valid email required"),
        phone: z.string().optional(),
        company: z.string().min(2, "Company name is required"),
        companyUrl: z.string().optional(),
        teamSize: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.insert(pilotApplications).values({
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company,
        companyUrl: input.companyUrl || null,
        teamSize: input.teamSize ?? null,
        message: input.message ?? null,
        status: "new",
      });

      // Notify the owner of the new pilot application (fire-and-forget)
      notifyOwner({
        title: `🚀 New Pilot Application — ${input.name}`,
        content: [
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          input.phone ? `Phone: ${input.phone}` : null,
          `Company: ${input.company}`,
          input.companyUrl ? `Website: ${input.companyUrl}` : null,
          input.teamSize ? `Team Size: ${input.teamSize}` : null,
          input.message ? `\nMessage: ${input.message}` : null,
          `\nView all applications: /admin/pilot-applications`,
        ].filter(Boolean).join("\n"),
      }).catch(() => { /* non-critical — don't fail the submission */ });

      // Send confirmation email to applicant (fire-and-forget)
      sendEmail({
        to: input.email,
        subject: "Your LevelNext Pilot Application — We've received it!",
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#12345A;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Level<span style="color:#F5A623;">Next</span></h1>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-transform:uppercase;">The Leadership Intelligence Platform</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#12345A;font-weight:600;">Hi ${input.name},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">Thank you for applying to the <strong>LevelNext Pilot Programme</strong>. We've received your application and are excited to learn more about you and ${input.company}.</p>
          <div style="background:#f0f4f8;border-left:4px solid #F5A623;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0;font-size:13px;color:#12345A;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What happens next</p>
            <ol style="margin:10px 0 0;padding-left:18px;color:#444;font-size:14px;line-height:1.8;">
              <li>Our team will review your application within <strong>1–2 business days</strong>.</li>
              <li>We'll reach out to schedule a <strong>30-minute discovery call</strong> to understand your leadership context.</li>
              <li>If it's a fit, we'll onboard you to the LevelNext platform and begin your diagnostic journey.</li>
            </ol>
          </div>
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">In the meantime, if you have any questions, simply reply to this email.</p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#F5A623;border-radius:8px;">
            <a href="https://tidycal.com/metaresults/pilot" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#12345A;text-decoration:none;">Book a Discovery Call →</a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f0f4f8;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#888;">LevelNext is a product of <strong>Meta Results Pvt. Ltd.</strong> · Bengaluru, India</p>
          <p style="margin:6px 0 0;font-size:12px;color:#aaa;">You're receiving this because you applied at levelnext.coach</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }).catch(() => { /* non-critical — don't fail the submission */ });

      return { success: true };
    }),

  // Admin: list all applications
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select()
      .from(pilotApplications)
      .orderBy(desc(pilotApplications.createdAt));
  }),

  // Admin: update status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "booked", "declined"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db
        .update(pilotApplications)
        .set({ status: input.status })
        .where(eq(pilotApplications.id, input.id));
      return { success: true };
    }),
});
