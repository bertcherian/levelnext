# Project TODO

- [x] Review the live LevelNext architecture, existing Self-Leadership, Success Partner, diagnostic, and layout implementations for safe extension points.
- [x] Add Engineering Intelligence shared contracts, secure tenant/participant/partner permission helpers, and the schema required for diagnostic sessions, responses, results, profile snapshots, nudges, and agent runs.
- [x] Implement typed tRPC APIs for participant diagnostic completion, private Self-Leadership analysis, profile retrieval, Partner nudge generation, queue state updates, and Partner check-ins.
- [x] Register database migration SQL and verify the schema migration against the managed database.
- [x] Build the responsive Participant Diagnostic interface with adaptive save/resume, progress, privacy cues, and recovery states.
- [x] Build the Operating Profile interface with engine signals, impact radius, evidence lineage, Self-Leadership reflection, and Mission recommendation actions.
- [x] Register Engineering Intelligence routes and role-aware navigation without disrupting existing LevelNext modules.
- [x] Add Vitest coverage for scoring, ownership, tenant isolation, nudge privacy/assignment enforcement, and API contracts.
- [ ] Run type checking, targeted tests, and visual responsive verification for the new Participant screens.
- [x] Save an implementation checkpoint and deliver the published LevelNext version.
- [x] Create a repeatable seed script for Engineering Intelligence diagnostic fixtures, participant profiles, shared Missions, Partner assignments, and coaching lifecycle data.
- [x] Add comprehensive integration tests for diagnostic completion, private Self-Leadership analysis/feedback, Partner scope enforcement, deterministic nudge persistence, and check-in logging.
- [x] Verify the migration asset, seed script idempotency, expanded test suite, and production build before checkpointing.
- [x] Prove seed-script idempotency by executing two seed passes within one rollback-only transaction and asserting one row per stable Engineering Intelligence key.
