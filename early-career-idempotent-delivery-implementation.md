# Early Career Idempotent Delivery — Implementation Record

**Date:** 19 August 2026  
**Status:** Implemented, schema applied, and test-validated. No existing tenant nudge configuration or delivery history required backfill.

## Implemented safeguards

| Area | Implemented change | Effect |
|---|---|---|
| Schema | Added nullable `cadenceAnchorAt` to `early_career_nudge_configs`. | A configuration has a stable cadence origin that can be deliberately reset when its timing policy changes. |
| Delivery idempotency | Added non-null `cadenceWindowKey` plus a unique index on `(configId, recipientUserId, cadenceWindowKey)`. | Concurrent runs and Heartbeat retries cannot create duplicate deliveries in the same cadence window. |
| Lookup performance | Added task-UID and config-window indexes. | Schedule ownership and per-window delivery state are directly queryable. |
| Scheduled handler | Authenticates the cron request, selects the enabled configuration only by `taskUid`, derives a stable cadence window, and performs one `INSERT … SELECT` with duplicate-key suppression. | Removes body-payload trust and N+1 per-recipient recent-delivery queries. |
| Scheduling mutation | Uses the decoded session token, writes an empty callback payload, and resets the anchor only when cadence, scheduled day, or UTC hour changes. | Configuration lifecycle follows durable task-UID ownership without accidental cadence resets. |
| Navigation | Admin and Success Partner runtime projections share typed item definitions and the same standard item renderer used by the primary navigation. | Mobile and desktop role navigation retain existing visibility, labels, active states, and route targets with one runtime renderer. |

## Data and rollout position

The migration was applied after confirming that both Early Career nudge tables contained zero rows. The new columns and indexes were verified in the database. There were no existing Heartbeat-owned nudge configurations to update, pause, resume, or backfill. Consequently, no live schedule action is required until an organisation owner saves a nudge configuration after this release.

The next owner-created or owner-updated Early Career schedule will use the deployed `/api/scheduled/earlyCareerNudges` handler. It remains a Heartbeat callback; no in-process scheduler or background worker was introduced.

## Validation

Type checking passed. The complete suite passed with **128 test files, 447 tests, one skipped file, and two skipped tests**. Focused coverage verifies cadence windows, retry-stable keys, message privacy, cron authentication, task-UID ownership, audience and stage eligibility SQL, duplicate-key insertion, empty schedule payloads, and role-navigation shared projections. The role-navigation tests render both the shared role selector and the real `PlatformLayout` drawer for admin and Success Partner roles.
