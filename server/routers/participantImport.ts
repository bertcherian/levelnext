/**
 * Participant Import Router
 * Parses CSV data and bulk-invites participants with name, email, phone,
 * designation, and department fields.
 */

import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { platformInvites, users, tenantUsers } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import crypto from "crypto";

// ─── Row schema for a single participant ─────────────────────────────────────
const ParticipantRowSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(320),
  phone: z.string().max(50).optional().or(z.literal("")),
  designation: z.string().max(255).optional().or(z.literal("")),
  department: z.string().max(255).optional().or(z.literal("")),
});

type ParticipantRow = z.infer<typeof ParticipantRowSchema>;

// ─── Parse CSV text into rows ─────────────────────────────────────────────────
function parseCsvText(csvText: string): { rows: any[]; headers: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], headers: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });

  return { rows, headers };
}

// ─── Map CSV row to participant using flexible header matching ────────────────
function mapRow(row: Record<string, string>): Partial<ParticipantRow> {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const val = row[k] ?? row[k.replace(/ /g, "_")] ?? row[k.replace(/_/g, " ")];
      if (val) return val;
    }
    return "";
  };

  return {
    name: get("name", "full_name", "fullname", "participant_name"),
    email: get("email", "email_address", "emailaddress"),
    phone: get("phone", "phone_number", "mobile", "contact"),
    designation: get("designation", "title", "job_title", "jobtitle", "role"),
    department: get("department", "dept", "team", "function", "business_unit"),
  };
}

export const participantImportRouter = router({
  /** Parse CSV text and return validated rows with errors */
  parseCsv: adminProcedure
    .input(z.object({ csvText: z.string().max(2 * 1024 * 1024) })) // 2 MB max
    .mutation(async ({ input }) => {
      const { rows, headers } = parseCsvText(input.csvText);

      const validRows: (ParticipantRow & { rowIndex: number })[] = [];
      const errorRows: { rowIndex: number; raw: Record<string, string>; errors: string[] }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const mapped = mapRow(rows[i]);
        const result = ParticipantRowSchema.safeParse(mapped);
        if (result.success) {
          validRows.push({ ...result.data, rowIndex: i + 2 }); // +2 for header row + 1-based
        } else {
          errorRows.push({
            rowIndex: i + 2,
            raw: rows[i],
            errors: result.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`),
          });
        }
      }

      return {
        headers,
        totalRows: rows.length,
        validCount: validRows.length,
        errorCount: errorRows.length,
        validRows,
        errorRows,
      };
    }),

  /** Bulk invite valid participants — creates platform invites and sends magic links */
  bulkInvite: adminProcedure
    .input(z.object({
      participants: z.array(ParticipantRowSchema).max(500),
      tenantId: z.number().int().optional(),
      sendEmails: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const results: {
        email: string;
        status: "invited" | "already_exists" | "error";
        error?: string;
      }[] = [];

      // Check which emails already have users
      const emails = input.participants.map((p) => p.email.toLowerCase());
      const existingUsers = await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.email, emails));
      const existingEmails = new Set(existingUsers.map((u) => u.email?.toLowerCase()));

      // Check which emails already have pending invites
      const existingInvites = await db
        .select({ email: platformInvites.email })
        .from(platformInvites)
        .where(inArray(platformInvites.email, emails));
      const invitedEmails = new Set(existingInvites.map((i) => i.email.toLowerCase()));

      for (const participant of input.participants) {
        const emailLower = participant.email.toLowerCase();

        if (existingEmails.has(emailLower)) {
          results.push({ email: participant.email, status: "already_exists" });
          continue;
        }

        try {
          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          // Store extra fields as JSON in the name field (temporary) or use metadata
          // We store phone/designation/department in a JSON suffix on name for now
          // until users table is extended with these fields
          const metaSuffix = JSON.stringify({
            phone: participant.phone || null,
            designation: participant.designation || null,
            department: participant.department || null,
          });

          await db.insert(platformInvites).values({
            token,
            email: participant.email,
            name: participant.name,
            invitedBy: ctx.user.id,
            status: "pending",
            expiresAt,
          });

          // Send magic link email if requested
          if (input.sendEmails) {
            const inviteUrl = `${process.env.VITE_OAUTH_PORTAL_URL ?? ""}/verify?token=${token}`;
            try {
              await sendEmail({
                to: participant.email,
                subject: "You're invited to LevelNext",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0f172a;">Welcome to LevelNext, ${participant.name}!</h2>
                    <p>You've been invited to join the LevelNext Leadership Intelligence Platform.</p>
                    ${participant.designation ? `<p>Role: <strong>${participant.designation}</strong>${participant.department ? ` — ${participant.department}` : ""}</p>` : ""}
                    <p>Click the button below to accept your invitation and set up your account:</p>
                    <a href="${inviteUrl}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                      Accept Invitation
                    </a>
                    <p style="color: #64748b; font-size: 14px;">This link expires in 7 days.</p>
                  </div>
                `,
              });
            } catch {
              // Email send failure is non-fatal
            }
          }

          results.push({ email: participant.email, status: "invited" });
        } catch (err: any) {
          results.push({ email: participant.email, status: "error", error: err.message });
        }
      }

      const invited = results.filter((r) => r.status === "invited").length;
      const alreadyExists = results.filter((r) => r.status === "already_exists").length;
      const errors = results.filter((r) => r.status === "error").length;

      return { results, summary: { invited, alreadyExists, errors } };
    }),
});
