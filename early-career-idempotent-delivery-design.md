# Early Career Nudge Delivery — Idempotent Delivery Design

**Status:** Implementation-ready design only. The current delivery handler, schedule registrations, database schema, and notifications are unchanged by this document.

## Objective

The existing Early Career delivery flow selects enabled configurations, trusts an optional `configId` in the request body, performs a per-profile recent-delivery lookup, and inserts rows one at a time. This preserves basic cadence behaviour but is vulnerable to concurrent retries and performs an N+1 query pattern.[1]

The replacement will keep one Heartbeat job per owner-managed configuration, but identify the configuration from the platform-authenticated `taskUid`, calculate a deterministic cadence window, and insert all eligible recipients in one database statement. The database, rather than a preceding application read, will enforce at-most-once delivery per recipient and cadence window.[1] [2]

> **Invariant:** A delivery is created at most once for each `(configId, recipientUserId, cadenceWindowKey)`, even if the platform retries the handler or two invocations overlap.

## Target operating model

| Concern | Current behaviour | Target behaviour |
|---|---|---|
| Schedule ownership | A configuration persists `scheduleCronTaskUid`, but the callback selects with `req.body.configId`. | The handler authenticates the Heartbeat request and looks up the configuration exclusively by `scheduleCronTaskUid = taskUid`. |
| Selector | Per-configuration profile query, followed by one recent-delivery query per profile. | One set-based `INSERT … SELECT` for the owned configuration and all eligible recipients. |
| Idempotency | A cutoff-time read prevents many duplicates but can race under concurrent execution. | A unique composite key makes duplicate writes impossible at the database layer. |
| Cadence | Weekly, fortnightly, and 28-day monthly periods are inferred from prior delivery timestamps. | A deterministic `cadenceWindowKey` is derived from a persisted cadence anchor and the scheduled instant. |
| Retry response | Any partial success can be followed by a duplicate-prone retry. | A retry re-runs the same insert; previously inserted recipients conflict on the unique key and are ignored. |

## Data model change

The delivery table needs an explicit key for the cadence period. The configuration needs a stable anchor for calculating that period. The anchor is a delivery schedule concern, not employee data; no diagnostic answers, Guide text, or Practice Partner transcripts are added.[2]

| Table | Field or index | Purpose |
|---|---|---|
| `early_career_nudge_configs` | `cadenceAnchorAt timestamp` | First eligible scheduled instant for the current cadence settings; it remains stable until a deliberate scheduling-policy change resets it. |
| `early_career_nudge_deliveries` | `cadenceWindowKey varchar(64)` | A deterministic label, such as `v1:0`, `v1:1`, or `v1:2`, calculated from the anchor and the 7/14/28-day period. |
| `early_career_nudge_deliveries` | Unique index on `(configId, recipientUserId, cadenceWindowKey)` | The authoritative at-most-once constraint. |
| `early_career_nudge_deliveries` | Supporting index on `(configId, cadenceWindowKey)` | Efficient observability and delivery-status queries for one run. |

The migration should add both columns as nullable, backfill every configuration anchor from its historical scheduling baseline, assign existing delivery rows a non-conflicting `legacy:<id>` key, review the generated SQL, then make `cadenceWindowKey` non-null and add the indexes. Since the current baseline has no configured Early Career jobs, the migration is low-data-volume but must still be safe for future tenant data.[2]

## Handler flow

The callback remains a Heartbeat endpoint at `/api/scheduled/earlyCareerNudges`; no in-process timer is introduced. The platform passes the authenticated `taskUid` with cron identity, which is the appropriate ownership key.[3]

1. Authenticate with `sdk.authenticateRequest(req)`. Return `403` unless `isCron` and `taskUid` are present.
2. Load one enabled configuration where `scheduleCronTaskUid = taskUid`. Return `{ ok: true, skipped: "orphan-or-disabled" }` when no row exists, so an obsolete paused/deleted job does not retry indefinitely.
3. Compute the current deterministic window from `cadenceAnchorAt` and the existing cadence period: 7 days for weekly, 14 days for fortnightly, and 28 days for monthly. Use the expected scheduled UTC instant, not recipient-local time.
4. Execute one `INSERT … SELECT` joining the owned configuration to eligible profiles in its tenant and optional journey stage. Derive `recipientUserId` from the current audience rule, retain `employeeUserId` for manager nudges, and apply the unchanged development-safe title/body text.
5. Use `ON DUPLICATE KEY UPDATE id = id` (or the equivalent safe ignore form) against the composite idempotency key. Report inserted and already-existing counts without exposing recipient information.
6. Return a compact execution result: `{ ok, configId, cadenceWindowKey, created, duplicateOrExisting, skippedIneligible }`.

## Scheduler ownership and configuration updates

`saveNudgeConfig` will keep the existing one-config-per-tenant-and-audience rule and the persisted `scheduleCronTaskUid`. On creation or update it must create or update the job without sending `configId` as callback payload; the task UID is the sole trusted selector.[4]

When a change alters cadence, day of week, or UTC hour, the transaction should deliberately set a new anchor at the next valid scheduled instant. This makes the new schedule a new sequence rather than accidentally suppressing it because of an old cadence window. Changing only enabled state must not reset the anchor. This policy should be surfaced in the HR configuration copy before implementation.

## Test and rollout plan

| Test class | Required proof |
|---|---|
| Authentication | A non-cron request is rejected; a cron request without task UID is rejected. |
| Ownership | The handler reads the config only by task UID and ignores a malicious or stale body payload. |
| Idempotency | Two concurrent invocations for the same task and window leave exactly one delivery per recipient. |
| Retry | A partially completed first run can be retried without duplicate deliveries; remaining eligible recipients are created. |
| Cadence | Weekly, fortnightly, and 28-day monthly settings map to stable window keys across repeated scheduled runs. |
| Eligibility | Tenant, journey stage, manager/employee audience, and missing-manager handling match current behaviour. |
| Privacy | Delivery content remains fixed development text; no private diagnostic or coaching data is stored or returned. |
| Schedule lifecycle | Create, update, pause, resume, and orphan-task handling retain durable task-UID ownership. |

Rollout should occur in four reversible steps: first land schema and migration; then add set-based selection behind a dedicated unit/integration suite; then deploy and update existing schedules to remove their body payloads; finally observe the first runs and retain the old handler only long enough to confirm the task-UID lookup path. Do not run a global project-owned delivery cron, because each tenant configuration already owns its own delivery schedule.[3] [4]

## References

[1]: file:///home/ubuntu/levelnext/server/scheduledHandlers.ts "Current Early Career nudge delivery handler"
[2]: file:///home/ubuntu/levelnext/drizzle/schema.ts "Early Career nudge configuration and delivery tables"
[3]: file:///home/ubuntu/skills/webdev-periodic-updates/SKILL.md "Heartbeat authentication, task UID ownership, and idempotency rules"
[4]: file:///home/ubuntu/levelnext/server/routers/earlyCareer.ts "Current Early Career scheduling mutation"
