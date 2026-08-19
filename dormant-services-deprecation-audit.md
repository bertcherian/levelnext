# LevelNext Dormant-Service Deprecation Record

**Date:** 19 August 2026  
**Scope:** Follow-on simplification tranche after the Phase 0 architecture inventory  
**Outcome:** One nonfunctional scheduled service and one empty infrastructure abstraction were safely retired. No other currently inspected service met the evidence threshold for removal.

## Retirement decisions

| Artifact | Evidence | Action taken | Behavioural effect |
|---|---|---|---|
| Intelligence Core outbox publisher | The only source writers were Intelligence Core procedures and helpers. The only source reader was the publisher itself; no webhook, event-bus, or downstream consumer existed. The live job ran every 15 minutes and the database held three historical `published` rows. | Removed the endpoint, handler, and all no-consumer writes. Paused the live job `FB8xGvYVjkSLf3Ernfcs3y`. Retained the table as history-only. | Stops misleading publication state and prevents future `pending` rows from accumulating. No current user-facing delivery path was removed. |
| `drizzle/relations.ts` | The file contained only an empty schema import and no tracked source file imported it. | Removed the file. | No schema, table, relation, or query behaviour changed. |

## Verification

The published outbox schedule was re-read after the pause and returned `is_enable: false`. The server no longer registers `/api/scheduled/icOutboxPublisher`, and the publisher handler and all writer imports have been removed. The new `outboxDeprecation.test.ts` verifies these conditions in source. `pnpm check` passed. The targeted test passed, and the network-independent suite passed with **115 test files and 415 tests**.

The complete suite was also run. Four checks failed because OpenRouter requests timed out: `openRouterCredential.test.ts`, `openRouterQwen.test.ts`, and the OpenRouter-dependent model-evaluation integration workflow. These failures are external connectivity failures and are unrelated to the outbox or relations changes. They should be re-run once OpenRouter connectivity is available.

## Services reviewed and deliberately retained

| Service or artifact | Evidence | Decision |
|---|---|---|
| Intelligence Core follow-up reminder | It remains enabled and has recent successful daily executions. Recent responses reported zero reminders due, not a failed or unused service. | Retain. |
| Early Career scheduled nudges | The configuration table currently has no rows, but the HR UI actively queries and saves nudge configuration. | Retain; absence of current configuration is not proof of feature dormancy. |
| Guided Mirror and executive decision reminders | Their configuration tables currently have no rows, but active router procedures create and manage schedules. | Retain; they are user-configurable capabilities. |
| Browser service worker | It is registered from `client/index.html` and therefore is active client infrastructure. | Retain. |
| Framework-level server-core adapters | Several have no direct production imports but are platform capabilities or covered by integration tests. No safe end-to-end removal evidence was established. | Retain and revisit only as part of a broader adapter-usage inventory. |
| `ic_outbox_events` table | It contains historical records and now has explicit history-only documentation. | Retain; do not infer delivery from prior status values. |

## Follow-up rule

> A service may be retired only when its trigger, source consumers, external side effects, data retention need, and configuration surface have all been checked. A zero-row table, a zero-reminder execution, or a sparse import graph alone is insufficient evidence of dormancy.

The next approved simplification target remains the typed structured-LLM boundary for the six repeated Manager Effectiveness JSON-producing flows. That work can remove duplicated parsing without changing the application’s model prompts or diagnostic logic.
