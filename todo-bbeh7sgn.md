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
