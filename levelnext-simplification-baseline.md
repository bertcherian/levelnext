# LevelNext Simplification Programme — Phase 0 Baseline and Refactor Gates

**Date:** 19 August 2026  
**Scope:** Canonical LevelNext project, commit `228c8939`  
**Change status:** Baseline and inventory only. No runtime product logic, routes, database schema, schedules, or user data were modified.

## Executive baseline

The canonical project is in a strong type-safety and unit-test position, but its production-build baseline is currently **not green** in the sandbox. `pnpm check` completed successfully. The unit suite completed with **117 passing test files, one skipped file, 416 passing tests, and two skipped tests**. Two separate `pnpm build` attempts were terminated with exit code `143` after Vite transformed all 6,690 modules; one run stopped during chunk rendering. The development server’s Vite cache was affected by the build attempt, but restarting it restored server startup and clean TypeScript health. This is an environmental or build-pipeline gate that must be diagnosed before relying on a production build as a release signal.[1]

The inventory validates the audit’s central conclusion: LevelNext has real product complexity, but repeated technical boundaries increase change risk. The immediate next code change should remain the outbox decision, followed by the structured LLM boundary, rather than beginning with data migration or a broad router rewrite.

> **Approved operating principle:** retain differentiated product behaviour while removing repeated implementations of the same policy, parsing boundary, scheduler selection rule, and diagnostic-result fact.

## Baseline results

| Check | Result | Interpretation | Gate implication |
|---|---|---|---|
| Type check — `pnpm check` | Passed | The current canonical source type-checks cleanly. | Suitable as a per-change regression check. |
| Unit suite — `pnpm test` | Passed: 117 files / 416 tests; 1 file / 2 tests skipped | Existing automated coverage is substantial and provides a reliable baseline for small refactors. | Preserve and extend focused tests for every changed boundary. |
| Production build — `pnpm build` | Failed twice with exit `143` after all 6,690 Vite modules transformed | No TypeScript error was reported. The process was terminated while rendering chunks. | Do not use a production build as a release gate until the termination is resolved or reproduced in the managed deployment pipeline. |
| Development server | Restored after restart | The cache-clearing side effect of the build interrupted Vite’s esbuild service; restart returned the server to a running state. | Restart the server after future build diagnostics; do not interpret the historical cache error as an application defect. |
| Browser visual capture | Inconclusive | Capture failed after restart, although browser-console logs show the Vite client connected and no application console error was recorded. | Repeat visual smoke testing before shipping UI navigation work. |
| Tenant-membership duplicates | None returned by aggregate query | There is no observed data blocker for a composite `tenant_users(tenantId, userId)` uniqueness constraint. | Still generate and review a migration before applying the constraint. |
| Diagnostic-instance duplicate `reportId` values | None returned by aggregate query | No observed duplicate snapshot rows block a report-to-instance ownership decision. | Define the canonical lifecycle before adding a database uniqueness constraint. |
| Outbox state | 3 `published` rows, no other status returned | The publisher has already set operational records to `published`, even though its implementation has no delivery side effect. | Treat the outbox correction as the first behaviour-changing work item. |

## Inventory A — LLM and structured-output boundary

The server contains **117 textual `invokeLLM(` matches**, including the adapter declaration and call sites. This confirms that adapter narrowing is a later programme phase and should not be attempted by deleting aliases or retry handling now. The appropriate first change is narrower: introduce one typed structured-output helper and migrate the highest-risk JSON-producing paths to it.[2]

There are **31 direct regex JSON-object extractions** across ten router files. At least seven production paths call `safeJsonParse` directly: six Manager Effectiveness flows and one Career Access flow. The Manager Effectiveness router is the correct first migration cohort because it repeats the same invocation → text extraction → regex match → fallback parsing pattern in diagnostic analysis, playbook creation, daily briefs, practice feedback, team-member insights, and commitment suggestions.[3]

| Boundary finding | Evidence | Refactor instruction |
|---|---|---|
| Broad adapter surface | 117 `invokeLLM` textual matches across the server | First create a caller inventory; retain adapter compatibility until active usage is classified. |
| Repeated JSON extraction | 31 regex object matches in ten routers | Prohibit new direct extraction outside the shared helper after the helper lands. |
| Immediate MEP cohort | Six MEP JSON-producing flows use the repeated pattern | Migrate this cohort first while keeping prompts, deterministic score logic, and fallbacks stable. |
| Wider later cohort | Career Access, ChatGPT Import, ECI Import, Interview Prep, Leadership Coach, LSOS, Negotiation, Outreach Engine, and PEI also extract JSON directly | Schedule these only after the MEP helper proves its error, validation, and observability contract. |
| Dynamic safety dependency | Intelligence Core dynamically imports `eciJudgementSpec` in two paths | Do not classify sparse static imports as unused code. Preserve dynamic import coverage during extraction. |

**Refactor gate:** Before adding `invokeStructured`, define the exact Zod schema, fallback behaviour, logging redaction policy, and unit cases for each MEP response family. A malformed response must result in a typed, observable fallback rather than an unvalidated broad JSON object.

## Inventory B — route and navigation policy

`App.tsx` repeats the same layout and access policy at route declarations. The current registry applies `MEPLayout` to 11 Manager routes, including five legacy routes; `PEAccessGate` to seven Professional Effectiveness routes and `PELayout` to six of them; and `EarlyCareerLayout` to seven Early Career routes.[4] These are candidate extractions because the URLs and page components can remain unchanged while composition becomes shared.

`PlatformLayout.tsx` separately expresses mobile drawer, desktop sidebar, admin-only navigation, and bottom-tab paths. The product-specific lists, journey progress, badges, and responsive projections are legitimate. The duplicated active-state, group-label, admin-visibility, and item-render policy is not.[5]

| Refactor gate | Required proof before merge |
|---|---|
| Shared navigation model | One typed item definition supplies desktop and mobile renderers; bottom tabs remain an intentional subset rather than a duplicate list. |
| Route wrapper extraction | Every current URL, including legacy Manager paths, resolves to the same page and retains the same outer layout/access rule. |
| Admin visibility | Admin-only item visibility and active-state behaviour are covered by focused rendering tests. |
| Visual regression | Desktop and mobile screenshots must be captured successfully and reviewed before shipping navigation extraction. |

## Inventory C — scheduled work and outbox semantics

The application registers seven scheduled endpoints through the server entry point: weekly summary, momentum check-in, Intelligence Core follow-up reminder, outbox publisher, Early Career nudges, Guided Mirror reminder, and executive decision-review reminder.[6] The task identity infrastructure provides a platform-issued `taskUid`, but the Early Career configuration creates jobs with a request payload containing `configId`; the delivery handler then filters enabled configurations using `req.body.configId`.[7]

The existing outbox publisher selects pending events and marks them `published`. Its own comment says that production delivery to an event bus or webhook is hypothetical. The only identified writers are `intelligenceCore.ts` and `intelligenceCoreHelpers.ts`; the only identified reader is the scheduled publisher itself, and no external dispatcher, webhook client, or event-bus consumer exists in the application source. The database currently contains three published events. Therefore, the status is not presently reliable evidence that a consumer received an event.[8]

The Early Career nudge handler filters configurations in application code, loads profiles per configuration, then queries for an existing delivery for every profile. The delivery table has only a primary key and foreign keys; it has no unique constraint or persisted cadence-window identifier covering configuration, recipient, and delivery period. Its current anti-duplication control is therefore the application-level recent-delivery query. The future set-based implementation must retain the existing weekly, fortnightly, and four-weekly meanings and must not remove privacy or per-user delivery constraints.[8]

| Refactor gate | Required decision or evidence |
|---|---|
| Outbox correction | Confirm whether any real consumer is required now. If not, disable the publisher schedule and document the table as dormant. If yes, define delivery, retry, failure, and idempotency semantics before retaining `published`. |
| Scheduler selector | Decide whether Early Career scheduling remains one job per configuration or becomes a single domain job. In either design, the platform task identity must identify the owning record; do not rely on an arbitrary request-body selector. |
| Delivery idempotency | Define a cadence-window uniqueness key before replacing loops with set-based SQL. |
| Notification validation | Add tests for duplicate concurrent runs, retries, disabled configuration, recipient eligibility, and each cadence. |

## Inventory D — diagnostic intelligence source of truth

The diagnostic data flow has three overlapping representations. `reports` stores completed diagnostic score, zone, archetype, dimensions, responses, analysis, provenance, and report metadata. `users.leadershipGraph` stores a cumulative cross-diagnostic summary and is written through `updateLeadershipGraph`, which is called by assessment completion and ECI import; it is subsequently read by Guide, Leadership Coach, Mission, Playbook, Tenant, Unlock, and related paths.[9] Intelligence Core adds `icDiagnosticInstances`, described in the schema as an immutable completed-diagnostic record linked to `reports`, and duplicates report-level score, dimensions, archetype, zone, tenant, and user fields.[10]

The current database does not show duplicate `(tenantId, userId)` membership records or duplicate Intelligence Core snapshots per `reportId`. Those results reduce, but do not eliminate, migration risk. The canonical model still requires a deliberate lifecycle decision because report imports, re-runs, corrections, generated PDFs, and derived leadership summaries have different responsibilities.

| Representation | Observed role | Provisional policy for the next phase |
|---|---|---|
| `assessmentSessions` | In-progress answers and completion lifecycle | Retain as the session record. |
| `reports` | Broad completed-result and provenance record; read across many product routers | Evaluate first as the canonical immutable completed-result record rather than creating a new duplicate table. |
| `users.leadershipGraph` | Cumulative personalized summary, read by multiple coaching and progress features | Treat as a derived view or explicitly refreshed summary; stop treating it as independent source-of-truth data. |
| `icDiagnosticInstances` | Intelligence Core processing snapshot linked to a report | Retain only for a deliberately immutable processing purpose; join shared facts from the canonical result rather than copying them. |

**Refactor gate:** No schema migration or field deletion is permitted until a lifecycle decision record maps all reads and writes, including imported reports, report regeneration, user summary refresh, and Intelligence Core rule execution. The likely direction is to make `reports` canonical only if its current invariants meet those lifecycle needs.

## Outbox deprecation status

The dormant outbox publisher has now been retired. Its source endpoint, handler, and no-consumer producer writes were removed; the project-owned Heartbeat job was paused after deployment; the history table remains explicitly marked as history-only. The detailed decision record is in [`dormant-services-deprecation-audit.md`](./dormant-services-deprecation-audit.md).

## Approved next implementation order

| Order | Work item | Why it is next | Prerequisite |
|---:|---|---|---|
| 1 | Add structured LLM helper and MEP schemas | High value, bounded scope, no schema migration, and clear repeated call pattern. | Schema/fallback/redaction contracts approved. |
| 2 | Replace route-wrapper duplication and normalize navigation data | Low data risk and preserves URLs. | Visual capture and legacy-route test plan. |
| 3 | Split scheduled domains and make Early Career delivery idempotent | Reduces operational work after selector and cadence decisions are made. | Scheduler ownership and cadence-window key. |
| 4 | Decide and stage canonical diagnostic result | Highest value but requires historical-data governance. | Complete lifecycle decision record and migration design. |

## References

[1]: file:///home/ubuntu/levelnext/package.json "LevelNext scripts and dependencies"
[2]: file:///home/ubuntu/levelnext/server/_core/llm.ts "LevelNext LLM adapter"
[3]: file:///home/ubuntu/levelnext/server/routers/mep.ts "Manager Effectiveness router"
[4]: file:///home/ubuntu/levelnext/client/src/App.tsx "LevelNext route registry"
[5]: file:///home/ubuntu/levelnext/client/src/components/PlatformLayout.tsx "LevelNext platform navigation"
[6]: file:///home/ubuntu/levelnext/server/_core/index.ts "Scheduled endpoint registration"
[7]: file:///home/ubuntu/levelnext/server/routers/earlyCareer.ts "Early Career schedule configuration"
[8]: file:///home/ubuntu/levelnext/server/scheduledHandlers.ts "Outbox and Early Career delivery handlers"
[9]: file:///home/ubuntu/levelnext/server/routers/leadershipGraph.ts "Leadership Graph aggregation"
[10]: file:///home/ubuntu/levelnext/drizzle/schema.ts "Diagnostic and Intelligence Core schema"
