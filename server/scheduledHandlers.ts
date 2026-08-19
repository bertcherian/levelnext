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
  icRecommendationActions,
  icRecommendations,
  icOutcomeObservations,
  icGuidedMirrorReminderSettings,
  icSelfLeadershipMirrors,
  earlyCareerNudgeConfigs,
  earlyCareerNudgeDeliveries,
  earlyCareerProfiles,
  executiveDecisionJournal,
  executiveDecisionReviewReminderSettings,
} from "../drizzle/schema";
import { eq, gte, and, desc, sql, isNotNull, lte } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { decideGuidedMirrorReminder, isLocalReminderTime, resolveRequestOrigin } from "./guidedMirrorReminderHelpers";
import { cadenceWindowKey, nudgeMessage } from "./earlyCareerNudgeDelivery";

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

// ── Intelligence Core: Follow-up Reminders ─────────────────────────────────────
// Daily at 2:00 AM UTC (7:30 AM IST) — sends reminders for actions that are
// past their planned complete date and outcomes that are due for check-in.
export async function icFollowUpReminderHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "no-db" });

    const now = new Date();
    let remindersSent = 0;

    // 1. Actions past their planned complete date that are still in_progress
    const overdueActions = await db
      .select({
        action: icRecommendationActions,
        user: users,
      })
      .from(icRecommendationActions)
      .innerJoin(users, eq(users.id, icRecommendationActions.userId))
      .where(and(
        eq(icRecommendationActions.status, "in_progress"),
        sql`${icRecommendationActions.plannedCompleteAt} < ${now}`,
      ));

    for (const { action, user } of overdueActions) {
      if (!user?.email) continue;
      try {
        await sendEmail({
          to: user.email,
          subject: "LevelNext Intelligence Core — Action Reminder",
          html: `
            <h2>Action Reminder</h2>
            <p>You have an action that is past its planned completion date:</p>
            <p><strong>${action.actionDescription}</strong></p>
            <p>Planned completion: ${action.plannedCompleteAt ? new Date(action.plannedCompleteAt).toLocaleDateString() : "N/A"}</p>
            <p>Please update the status or record an outcome in your LevelNext dashboard.</p>
          `,
        });
        remindersSent++;
      } catch (e) {
        console.error("[IC Reminder] Failed to send to user", user.id, e);
      }
    }

    // 2. Recommendations that have been accepted but have no action created yet
    // and their action check-in period has passed
    const acceptedWithoutAction = await db
      .select({
        rec: icRecommendations,
        user: users,
      })
      .from(icRecommendations)
      .innerJoin(users, eq(users.id, icRecommendations.userId))
      .leftJoin(icRecommendationActions, eq(icRecommendationActions.recommendationId, icRecommendations.id))
      .where(and(
        eq(icRecommendations.status, "accepted"),
        sql`${icRecommendationActions.id} IS NULL`,
        sql`${icRecommendations.createdAt} < ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}`,
      ));

    for (const { rec, user } of acceptedWithoutAction) {
      if (!user?.email) continue;
      try {
        await sendEmail({
          to: user.email,
          subject: "LevelNext Intelligence Core — Recommendation Awaiting Action",
          html: `
            <h2>Recommendation Awaiting Action</h2>
            <p>You accepted a recommendation but haven't created an action yet:</p>
            <p><strong>${rec.title}</strong></p>
            <p>${rec.description ?? ""}</p>
            <p>Visit your LevelNext dashboard to create an action plan.</p>
          `,
        });
        remindersSent++;
      } catch (e) {
        console.error("[IC Reminder] Failed to send to user", user.id, e);
      }
    }

    // 3. Completed actions that are due for outcome check-in (30 days after completion)
    const actionsDueForOutcome = await db
      .select({
        action: icRecommendationActions,
        user: users,
      })
      .from(icRecommendationActions)
      .innerJoin(users, eq(users.id, icRecommendationActions.userId))
      .leftJoin(icOutcomeObservations, eq(icOutcomeObservations.actionId, icRecommendationActions.id))
      .where(and(
        eq(icRecommendationActions.status, "completed"),
        sql`${icOutcomeObservations.id} IS NULL`,
        sql`${icRecommendationActions.completedAt} < ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}`,
      ));

    for (const { action, user } of actionsDueForOutcome) {
      if (!user?.email) continue;
      try {
        await sendEmail({
          to: user.email,
          subject: "LevelNext Intelligence Core — Outcome Check-in Due",
          html: `
            <h2>Outcome Check-in Due</h2>
            <p>You completed an action 30 days ago. It's time to record the outcome:</p>
            <p><strong>${action.actionDescription}</strong></p>
            <p>Visit your LevelNext dashboard to record the outcome and its impact.</p>
          `,
        });
        remindersSent++;
      } catch (e) {
        console.error("[IC Reminder] Failed to send to user", user.id, e);
      }
    }

    return res.json({ ok: true, remindersSent });
  } catch (error) {
    console.error("[IC Follow-up Reminder] Error:", error);
    return res.status(500).json({ ok: false, error: String(error) });
  }
}

// ── Private Guided Mirror Weekly Reminder ───────────────────────────────────────
export async function guidedMirrorReminderHandler(req: Request, res: Response) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "no-db" });
    const [setting] = await db.select().from(icGuidedMirrorReminderSettings).where(eq(icGuidedMirrorReminderSettings.scheduleCronTaskUid, cronUser.taskUid)).limit(1);
    if (!setting) return res.json({ ok: true, skipped: "orphan" });
    if (!isLocalReminderTime({ timeZone: setting.timeZone, localDayOfWeek: setting.dayOfWeek, localHour: setting.localHour })) return res.json({ ok: true, skipped: "outside-local-window" });
    const [user] = await db.select().from(users).where(eq(users.id, setting.userId)).limit(1);
    if (!user?.email) return res.json({ ok: true, skipped: "no-email" });
    const [recentMirror] = await db.select({ createdAt: icSelfLeadershipMirrors.createdAt }).from(icSelfLeadershipMirrors).where(eq(icSelfLeadershipMirrors.userId, setting.userId)).orderBy(desc(icSelfLeadershipMirrors.createdAt)).limit(1);
    const decision = decideGuidedMirrorReminder({ enabled: setting.enabled, lastReminderAt: setting.lastReminderAt, latestMirrorAt: recentMirror?.createdAt });
    if (!decision.shouldSend) return res.json({ ok: true, skipped: decision.reason });
    const guideUrl = `${resolveRequestOrigin(req)}/guide`;
    await sendEmail({ to: user.email, subject: "A private Guided Mirror for your week", html: `<h2>Make one workplace moment useful</h2><p>Take a quiet moment to notice what happened and choose one next experiment.</p><p><a href="${guideUrl}">Open your private Guided Mirror</a></p><p style="color:#666;font-size:12px">You are receiving this because you enabled weekly Guided Mirror reminders. You can change this in Guide at any time.</p>` });
    await db.update(icGuidedMirrorReminderSettings).set({ lastReminderAt: new Date() }).where(eq(icGuidedMirrorReminderSettings.id, setting.id));
    return res.json({ ok: true, sent: 1 });
  } catch (error) {
    console.error("[GuidedMirrorReminder] Error:", error);
    return res.status(500).json({ ok: false, error: String(error), timestamp: new Date().toISOString() });
  }
}

function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

// ── Executive Intelligence: Decision-review reminder ───────────────────────────
// The user-owned Heartbeat runs hourly, evaluates local time, and sends one
// private weekly review prompt only when one or more journal entries are due.
export async function executiveDecisionReviewReminderHandler(req: Request, res: Response) {
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "no-db" });
    const [setting] = await db.select().from(executiveDecisionReviewReminderSettings)
      .where(eq(executiveDecisionReviewReminderSettings.scheduleCronTaskUid, cronUser.taskUid)).limit(1);
    if (!setting || !setting.enabled) return res.json({ ok: true, skipped: setting ? "disabled" : "orphan" });
    if (!isLocalReminderTime({ timeZone: setting.timeZone, localDayOfWeek: setting.localDayOfWeek, localHour: setting.localHour })) return res.json({ ok: true, skipped: "outside-local-window" });
    const now = new Date();
    if (setting.lastReminderAt && setting.lastReminderAt.getTime() > now.getTime() - 6 * 24 * 60 * 60 * 1000) return res.json({ ok: true, skipped: "recently-sent" });
    const [user] = await db.select().from(users).where(eq(users.id, setting.userId)).limit(1);
    if (!user?.email) return res.json({ ok: true, skipped: "no-email" });
    const decisions = await db.select().from(executiveDecisionJournal)
      .where(and(eq(executiveDecisionJournal.userId, setting.userId), isNotNull(executiveDecisionJournal.reviewDate), lte(executiveDecisionJournal.reviewDate, now)))
      .orderBy(executiveDecisionJournal.reviewDate).limit(5);
    if (!decisions.length) return res.json({ ok: true, skipped: "no-decisions-due" });
    const decisionList = decisions.map((entry) => `<li style="margin:0 0 8px"><strong>${escapeEmailHtml(entry.decision)}</strong><br/><span style="color:#667385">Review date: ${entry.reviewDate?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "Due"}</span></li>`).join("");
    const executiveUrl = `${resolveRequestOrigin(req)}/executive`;
    await sendEmail({
      to: user.email,
      subject: `${decisions.length} decision${decisions.length === 1 ? "" : "s"} ready for review`,
      html: `<div style="font-family:Arial,sans-serif;color:#10243e;max-width:560px"><p style="color:#9a6a24;font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase">LevelNext Executive</p><h2 style="margin:0 0 12px">Return to the reasoning behind your decisions.</h2><p>Outcomes are not the only measure of a good decision. Revisit the assumptions, trade-offs, and evidence that informed the choice.</p><ul style="padding-left:20px">${decisionList}</ul><p><a href="${executiveUrl}" style="display:inline-block;background:#10243e;color:#fff;text-decoration:none;padding:12px 18px;font-weight:700">Open decision journal</a></p><p style="color:#667385;font-size:12px">You are receiving this because you enabled private decision-review reminders. You can change these preferences in Executive Intelligence at any time.</p></div>`,
    });
    await db.update(executiveDecisionReviewReminderSettings).set({ lastReminderAt: now }).where(eq(executiveDecisionReviewReminderSettings.id, setting.id));
    return res.json({ ok: true, sent: 1, decisions: decisions.length });
  } catch (error) {
    console.error("[ExecutiveDecisionReviewReminder] Error:", error);
    return res.status(500).json({ ok: false, error: String(error), timestamp: new Date().toISOString() });
  }
}

// ── Early Career Nudge Delivery ───────────────────────────────────────────────
// Invoked hourly by a platform-managed schedule. Owner settings determine the
// precise day/hour; deliveries retain only development-safe text and never store
// raw diagnostic answers, Guide content, or Practice Partner transcripts.
export async function earlyCareerNudgeDeliveryHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const cronUser = await sdk.authenticateRequest(req);
    if (!cronUser.isCron || !cronUser.taskUid) return res.status(403).json({ error: "cron-only" });
    taskUid = cronUser.taskUid;
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "no-db" });

    const now = new Date();
    const [config] = await db
      .select()
      .from(earlyCareerNudgeConfigs)
      .where(and(
        eq(earlyCareerNudgeConfigs.scheduleCronTaskUid, taskUid),
        eq(earlyCareerNudgeConfigs.enabled, true),
      ))
      .limit(1);
    if (!config) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    if (config.dayOfWeek !== now.getUTCDay() || config.hourUtc !== now.getUTCHours()) {
      return res.json({ ok: true, skipped: "outside-schedule-window" });
    }

    const anchorAt = config.cadenceAnchorAt ?? now;
    if (!config.cadenceAnchorAt) {
      await db.update(earlyCareerNudgeConfigs).set({ cadenceAnchorAt: anchorAt }).where(eq(earlyCareerNudgeConfigs.id, config.id));
    }
    const windowKey = cadenceWindowKey({ cadence: config.cadence, anchorAt, scheduledAt: now });
    const { title, body } = nudgeMessage(config.audience);
    const recipient = config.audience === "employees" ? sql`p.\`userId\`` : sql`p.\`managerUserId\``;
    const employee = config.audience === "managers" ? sql`p.\`userId\`` : sql`NULL`;
    const managerEligibility = config.audience === "managers" ? sql`AND p.\`managerUserId\` IS NOT NULL` : sql``;
    const stageEligibility = config.journeyStage === "all" ? sql`` : sql`AND p.\`journeyStage\` = ${config.journeyStage}`;

    await db.execute(sql`
      INSERT INTO \`early_career_nudge_deliveries\`
        (\`configId\`, \`recipientUserId\`, \`employeeUserId\`, \`tenantId\`, \`title\`, \`body\`, \`cadenceWindowKey\`)
      SELECT ${config.id}, ${recipient}, ${employee}, ${config.tenantId}, ${title}, ${body}, ${windowKey}
      FROM \`early_career_profiles\` p
      WHERE p.\`tenantId\` = ${config.tenantId}
        ${stageEligibility}
        ${managerEligibility}
      ON DUPLICATE KEY UPDATE \`id\` = \`id\`
    `);

    return res.json({ ok: true, configId: config.id, cadenceWindowKey: windowKey, at: now.toISOString() });
  } catch (error) {
    console.error("[EarlyCareerNudgeDelivery] Error:", error);
    return res.status(500).json({ ok: false, error: String(error), context: { taskUid }, timestamp: new Date().toISOString() });
  }
}
