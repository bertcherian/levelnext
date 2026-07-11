/**
 * Scheduled Heartbeat handlers for LevelNext Practice Coach
 *
 * 1. /api/scheduled/weeklySummary  — every Monday 1:30 AM UTC (7 AM IST)
 *    Sends a weekly practice digest to all users who have weeklyEmailEnabled = true
 *
 * 2. /api/scheduled/momentumCheckin — every day 1:30 AM UTC (7 AM IST)
 *    Sends a daily Momentum Mode check-in notification to users with momentumMode = true
 *    who have at least one pending commitment
 */

import type { Request, Response } from "express";
import { getDb } from "./db";
import { sendEmail } from "./_core/email";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import {
  users,
  leadershipMemory,
  practiceSessions,
  practiceAttempts,
  commitments,
} from "../drizzle/schema";
import { eq, gte, and, desc } from "drizzle-orm";

// ── Weekly Practice Summary ───────────────────────────────────────────────────
export async function weeklySummaryHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "no-db" });

    // Get all users with weeklyEmailEnabled = true who have an email address
    const eligibleMemory = await db
      .select({
        userId: leadershipMemory.userId,
        weeklyEmailEnabled: leadershipMemory.weeklyEmailEnabled,
        aiSummary: leadershipMemory.aiSummary,
      })
      .from(leadershipMemory)
      .where(eq(leadershipMemory.weeklyEmailEnabled, true));

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let sent = 0;

    for (const mem of eligibleMemory) {
      try {
        // Get user details
        const [user] = await db.select().from(users).where(eq(users.id, mem.userId));
        if (!user?.email) continue;

        // Get this week's practice sessions
        const recentSessions = await db
          .select()
          .from(practiceSessions)
          .where(and(eq(practiceSessions.userId, mem.userId), gte(practiceSessions.createdAt, oneWeekAgo)))
          .orderBy(desc(practiceSessions.createdAt));

        // Get this week's attempts with scores
        const recentAttempts = await db
          .select()
          .from(practiceAttempts)
          .where(and(eq(practiceAttempts.userId, mem.userId), gte(practiceAttempts.createdAt, oneWeekAgo)));

        // Get open commitments
        const openCommitments = await db
          .select()
          .from(commitments)
          .where(and(eq(commitments.userId, mem.userId), eq(commitments.status, "pending")))
          .orderBy(desc(commitments.createdAt))
          .limit(3);

        const totalSessions = recentSessions.length;
        const avgScore =
          recentAttempts.length > 0
            ? Math.round(
                recentAttempts.reduce((sum, a) => sum + (a.overallScore ?? 0), 0) / recentAttempts.length
              )
            : null;

        // Generate a personalised AI summary for the email
        let aiInsight = "";
        if (totalSessions > 0) {
          try {
            const prompt = `You are a supportive leadership coach. Write a 2-sentence personalised insight for a leader's weekly practice summary email.
Leader: ${user.name ?? "Leader"}
Sessions this week: ${totalSessions}
Average score: ${avgScore ?? "N/A"}/100
Open commitments: ${openCommitments.map(c => c.text).join("; ") || "None"}
Leadership memory: ${mem.aiSummary ?? "No summary yet"}

Write 2 warm, specific sentences that acknowledge their practice effort and give one concrete nudge for the coming week. Be direct and personal, not generic.`;
            const response = await invokeLLM({
              messages: [{ role: "user", content: prompt }],
              maxTokens: 120,
            });
            aiInsight = (response.choices[0].message.content as string).trim();
          } catch {
            aiInsight = "Keep up the great work — consistent practice is what separates good leaders from great ones.";
          }
        }

        const html = buildWeeklySummaryEmail({
          name: user.name ?? "Leader",
          totalSessions,
          avgScore,
          openCommitments: openCommitments.map(c => c.text),
          aiInsight,
        });

        await sendEmail({
          to: user.email,
          subject: `Your LevelNext Practice Week — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
          html,
        });
        sent++;
      } catch (userErr) {
        console.error(`[WeeklySummary] Error for userId=${mem.userId}:`, userErr);
      }
    }

    res.json({ ok: true, sent, total: eligibleMemory.length });
  } catch (err) {
    console.error("[WeeklySummary] Handler error:", err);
    res.status(500).json({ error: String(err), timestamp: new Date().toISOString() });
  }
}

// ── Momentum Mode Daily Check-in ──────────────────────────────────────────────
export async function momentumCheckinHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "no-db" });

    // Get all users with momentumMode = true
    const momentumUsers = await db
      .select({ userId: leadershipMemory.userId })
      .from(leadershipMemory)
      .where(eq(leadershipMemory.momentumMode, true));

    let notified = 0;

    for (const { userId } of momentumUsers) {
      try {
        // Get their open commitments
        const openCommitments = await db
          .select()
          .from(commitments)
          .where(and(eq(commitments.userId, userId), eq(commitments.status, "pending")))
          .orderBy(desc(commitments.createdAt))
          .limit(1);

        if (openCommitments.length === 0) continue;

        const commitment = openCommitments[0];
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) continue;

        // Send push notification (works without email setup)
        await notifyOwner({
          title: "🎯 Momentum Check-in",
          content: `${user.name ?? "Leader"}, did you act on your commitment today? "${commitment.text.slice(0, 80)}${commitment.text.length > 80 ? "\u2026" : ""}" — open Practice Coach to log your progress.`,
        });

        notified++;
      } catch (userErr) {
        console.error(`[MomentumCheckin] Error for userId=${userId}:`, userErr);
      }
    }

    res.json({ ok: true, notified, total: momentumUsers.length });
  } catch (err) {
    console.error("[MomentumCheckin] Handler error:", err);
    res.status(500).json({ error: String(err), timestamp: new Date().toISOString() });
  }
}

// ── Email Template ────────────────────────────────────────────────────────────
function buildWeeklySummaryEmail({
  name,
  totalSessions,
  avgScore,
  openCommitments,
  aiInsight,
}: {
  name: string;
  totalSessions: number;
  avgScore: number | null;
  openCommitments: string[];
  aiInsight: string;
}) {
  const NAVY = "#12345A";
  const GOLD = "#F5A623";

  const commitmentRows =
    openCommitments.length > 0
      ? openCommitments
          .map(
            c => `<tr><td style="padding:6px 0;font-size:13px;color:#444;border-bottom:1px solid #f0f0f0;">→ ${c}</td></tr>`
          )
          .join("")
      : `<tr><td style="padding:6px 0;font-size:13px;color:#999;">No open commitments — great job staying on top of your practice!</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:${NAVY};padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff;">LevelNext</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Leadership Intelligence Platform</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:${NAVY};">Your Weekly Practice Summary</p>
          <p style="margin:0 0 24px;font-size:14px;color:#666;">Hi ${name}, here's how your practice week looked.</p>

          <!-- Stats -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="50%" style="padding:16px;background:#f8f9fa;border-radius:8px;text-align:center;margin-right:8px;">
                <p style="margin:0;font-size:32px;font-weight:900;color:${NAVY};">${totalSessions}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#888;">Practice Sessions</p>
              </td>
              <td width="8px"></td>
              <td width="50%" style="padding:16px;background:#f8f9fa;border-radius:8px;text-align:center;">
                <p style="margin:0;font-size:32px;font-weight:900;color:${avgScore && avgScore >= 70 ? "#16a34a" : avgScore ? "#d97706" : NAVY};">${avgScore !== null ? avgScore : "—"}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#888;">Avg Score</p>
              </td>
            </tr>
          </table>

          ${
            aiInsight
              ? `<!-- AI Insight -->
          <div style="background:#f0f4f8;border-left:4px solid ${GOLD};border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:${NAVY};line-height:1.6;">${aiInsight}</p>
          </div>`
              : ""
          }

          <!-- Open Commitments -->
          <p style="margin:0 0 12px;font-size:14px;font-weight:bold;color:${NAVY};">Open Practice Commitments</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${commitmentRows}
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin-top:8px;">
            <a href="https://levelnextai-m9hb5g5z.manus.space/practice" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:bold;">Continue Practising →</a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f9fa;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#aaa;">LevelNext · Leadership Intelligence Platform</p>
          <p style="margin:4px 0 0;font-size:11px;color:#ccc;">You're receiving this because you have Weekly Summary enabled. <a href="https://levelnextai-m9hb5g5z.manus.space/practice?screen=practice-plan" style="color:#aaa;">Manage settings</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
