# Intelligence Core Phase 1 — Session TODO

## Phase 1: Database Schema & Foundation
- [x] Add Intelligence Core tables to drizzle/schema.ts (diagnostic_instances, judgment_rules, judgment_rule_versions, judgment_executions, recommendations, recommendation_actions, outcome_observations, outcome_metrics, outcome_evidence, processing_permissions, permission_events, audit_events, outbox_events)
- [x] Generate and apply database migration
- [x] Create shared types for Intelligence Core

## Phase 2: Permission & Consent System
- [x] Implement permission resolution service
- [x] Create permission tRPC procedures (getEffectivePermissions, grant, revoke)

## Phase 3: Rule Engine & Recommendations
- [x] Build deterministic rule engine with versioned rules
- [x] Create recommendation service (generate, list, getById)
- [x] Implement recommendation decision workflow (accept, reject, defer)

## Phase 4: Action & Outcome Tracking
- [x] Implement action service (create, updateStatus)
- [x] Build outcome observation service
- [x] Add evidence classification and verification

## Phase 5: Admin Dashboard & Analytics
- [x] Build projection service for user/tenant summaries
- [x] Implement privacy-thresholded analytics queries
- [x] Create admin dashboard with engagement funnel metrics

## Phase 6: Background Jobs & Observability
- [x] Implement outbox publisher job
- [x] Add follow-up reminder scheduler
- [x] Create outcome-eligibility evaluator
- [x] Add audit logging middleware

## Phase 7: Testing & Deployment
- [x] Write unit tests for rule engine

## Phase 8: ECI Judgement Specification & User-Facing Features
- [x] Create ECI Judgement Specification as structured shared data module (pillars, sub-dimensions, score bands, archetypes, risk catalogue, intervention library, practice scenarios)
- [x] Seed ECI single-dimension judgment rules into database (10 sub-dimensions × 3 score bands)
- [x] Seed ECI cross-dimensional judgment rules (High Expertise/Low Presence, Operational Expert, Hidden Executive, Political Blind Spot)
- [x] Seed ECI archetypes (10 archetypes with strengths, blind spots, risks, priorities)
- [x] Seed ECI executive risk catalogue (12 risks with indicators and coaching priorities)
- [x] Register Heartbeat cron job for IC follow-up reminders (daily 2:00 AM UTC)
- [x] Register Heartbeat cron job for IC outbox publisher (every 15 minutes)
- [x] Build user-facing /intelligence page with recommendation list, decision workflow, action creation, and outcome recording
- [x] Add tests for ECI rule seeding and user-facing procedures (54 tests passing)
- [x] Save checkpoint and deploy

## Phase 9: Outcomes Tab Progress Chart
- [x] Add impact distribution bar chart to Outcomes tab
- [x] Add summary stats (total actions, completed, outcomes recorded, avg impact)
- [x] Save checkpoint and verify
