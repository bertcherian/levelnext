# Project TODO

- [x] Record the canonical-project baseline for type checking, unit tests, production build, and development-server health.
- [x] Inventory all active LLM invocation and JSON-parsing call sites, including direct helper imports and dynamic imports.
- [x] Inventory route families, repeated layout/access wrappers, navigation definitions, and legacy-route behaviour.
- [x] Inventory scheduled handler entry points, active schedule registrations, outbox producers and consumers, and Early Career delivery idempotency controls; verified that no external outbox consumer or cadence-window uniqueness constraint exists.
- [x] Map all reads and writes of diagnostic intelligence across users.leadershipGraph, reports, and Intelligence Core diagnostic records.
- [x] Write the approved Phase 0 baseline and refactor-gate record without modifying runtime product behaviour.
- [x] Add or update baseline-focused Vitest coverage only if an existing verification gap prevents reliable inventory validation; existing checks were sufficient for this documentation-only phase.
- [ ] Read and apply the project’s periodic-work guidance before changing scheduled service behaviour.
- [ ] Deprecate the dormant Intelligence Core outbox publisher while preserving outbox history and preventing future status misrepresentation.
- [ ] Add focused tests that verify no scheduled outbox endpoint remains registered and no outbox event is relabelled as delivered without a consumer.
- [ ] Audit other scheduled endpoints, services, database tables, and client/server routes for verified dormancy without removing active behaviour.
- [ ] Document deprecation decisions, retained dormant artifacts, and evidence-based follow-up recommendations.
