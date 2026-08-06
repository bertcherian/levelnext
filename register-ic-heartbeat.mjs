/**
 * Register Intelligence Core Heartbeat cron jobs.
 *
 * This script creates two cron jobs:
 *   1. icFollowUpReminder — daily at 2:00 AM UTC (7:30 AM IST)
 *      Sends follow-up reminders for overdue actions, accepted recommendations
 *      without actions, and completed actions due for outcome check-in.
 *
 *   2. icOutboxPublisher — every 15 minutes
 *      Processes pending outbox events and publishes them.
 *
 * Usage: node register-ic-heartbeat.mjs
 *
 * The script is idempotent — it checks existing jobs by name and only
 * creates missing ones. Run it again after deployment to ensure jobs
 * are registered in the production environment.
 */

import dotenv from "dotenv";
import { createHeartbeatJob, listHeartbeatJobs } from "./server/_core/heartbeat.ts";

dotenv.config();

const OWNER_SESSION = ""; // Empty string = project owner identity

const IC_JOBS = [
  {
    name: "IC Follow-Up Reminder",
    cron: "0 0 2 * * *", // Daily at 2:00 AM UTC
    path: "/api/scheduled/icFollowUpReminder",
    method: "POST",
    description: "Daily follow-up reminders for Intelligence Core: overdue actions, accepted recommendations without actions, and completed actions due for outcome check-in.",
  },
  {
    name: "IC Outbox Publisher",
    cron: "0 */15 * * * *", // Every 15 minutes
    path: "/api/scheduled/icOutboxPublisher",
    method: "POST",
    description: "Processes pending Intelligence Core outbox events every 15 minutes.",
  },
];

async function register() {
  console.log("Registering Intelligence Core Heartbeat cron jobs...\n");

  // List existing jobs to check for duplicates
  let existingJobs = [];
  try {
    const result = await listHeartbeatJobs(OWNER_SESSION);
    existingJobs = result?.jobs ?? [];
    console.log(`Found ${existingJobs.length} existing Heartbeat jobs.`);
  } catch (err) {
    console.warn("Could not list existing jobs (will attempt to create anyway):", err.message);
  }

  for (const job of IC_JOBS) {
    // Check if a job with the same name already exists
    const existing = existingJobs.find(j => j.name === job.name);
    if (existing) {
      console.log(`  ✓ "${job.name}" already registered (taskUid: ${existing.taskUid})`);
      continue;
    }

    try {
      const result = await createHeartbeatJob(job, OWNER_SESSION);
      console.log(`  ✓ Created "${job.name}" — taskUid: ${result.taskUid}, next execution: ${result.nextExecutionAt ?? "N/A"}`);
    } catch (err) {
      console.error(`  ✗ Failed to create "${job.name}":`, err.message);
    }
  }

  console.log("\nHeartbeat registration complete.");
}

register().catch((err) => {
  console.error("Registration failed:", err);
  process.exit(1);
});
