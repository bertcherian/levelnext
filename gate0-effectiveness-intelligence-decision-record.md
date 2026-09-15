# LevelNext Effectiveness Intelligence — Gate 0 Architecture & Governance Decision Record

**Date:** 15 September 2026  
**Status:** Approved & Enforced  
**Context:** Canonical LevelNext WebDev project (`levelnext`, commit `e07f1718`)

---

## 1. Context & Business Mandate

LevelNext is upgrading its leadership capabilities from:
```
DIAGNOSTIC → REPORT → CONTENT → AI COACHING
```
to:
```
UNDERSTAND THE LEADER → UNDERSTAND WORK & CONTEXT → IDENTIFY GAP → HIGHEST-LEVERAGE CHANGE →
PRACTICE / SIMULATE → APPLY IN REAL WORK → CAPTURE EVIDENCE → MEASURE CHANGE → LEARN & ADAPT
```

The system asks: **"Did this leader become more effective in the real world?"**

This Gate 0 decision record defines the binding contracts, source-of-truth invariants, privacy boundaries, evidence ladder, and deterministic scoring policies before any schema migration or participant-facing code is merged.

---

## 2. Invariants & Source of Truth

### 2.1 Diagnostic Records
- `reports` remains the canonical immutable record of completed diagnostic Edge scores, zone, archetype, raw dimension scores, and LLM narrative analyses across all diagnostic modules (ECI, TII, LII, GCC, LDI, STI, NII, CPI, CRS, CMK, CST, CAO, AIR).
- `mepDiagnosticResults` remains the canonical record for Manager Effectiveness Platform 10-dimension diagnostics (MEI, DI, FI, CI_C, THI, EXI, CNFI, O1I, TCI, OWI, etc.).
- `users.leadershipGraph` is strictly a derived projection/summary, updated via `updateLeadershipGraph` on diagnostic completion. It is never an independent source of truth.
- `icDiagnosticInstances` remains an immutable evaluation snapshot when rules are processed.
- No existing diagnostic engine is duplicated. Effectiveness Intelligence ingests from `reports` and `mepDiagnosticResults`.

### 2.2 Behavioral & Narrative Entities
- Real-world moments, moves, practice rehearsals, action commitments, and reflections flow through or link to `biMoments`, `biMoves`, `biPracticeLinks`, `biActions`, `biEvidence`, and `biReflections`.
- Narrative hypotheses, conviction shifts, and 90-second resets flow through `niOperatingProfiles`, `niNarratives`, `niExperiments`, and `niResetLogs`.
- New Effectiveness Intelligence entities (`eiWorkScans`, `eiWorkActivities`, `eiCapacitySnapshots`, `eiOpportunityScans`, `eiBehaviorContracts`, `eiNextBestActions`) reference these existing tables via foreign keys and lineage IDs rather than duplicating their data.

---

## 3. Four-Tier Privacy & Consent Model

| Tier | Category | Scope & Permitted Viewers | Storage & Transmission Rules |
|---|---|---|---|
| **Tier 1** | **Participant-Private** | Participant + explicitly assigned human coach (when granted). Private reflections, diary notes, internal self-talk, unshared narrative hypotheses. | Encrypted at rest. Stripped from all cohort, sponsor, and organization exports. Never fed to training datasets. |
| **Tier 2** | **Development Data** | Participant, assigned coach, direct manager (if consented in onboarding contract). Selected 3 high-leverage behaviors, active contracts, practice attempt scores, real-world action commitments, evidence summaries. | Visible in participant workspace and coach workspace. Logged with non-sensitive metadata in `icAuditEvents`. |
| **Tier 3** | **Sponsor-Reportable (Aggregate)** | Enterprise HR / CHRO / BU Heads / Sponsors. Cohort-level capacity allocations, hours recovered, work-below-level reduction, behavior change velocity, evidence confidence breakdown. | Enforces **k-anonymity (minimum cohort size = 5)**. Never exposes individual names, verbatim reflections, or private narrative statements. |
| **Tier 4** | **Organizational Friction Intelligence** | Enterprise Leadership & System Admins. "Hidden Manager Tax" economic model, systemic meeting overloads, recurring approval bottlenecks, cross-functional coordination stalls. | Systemic and role-level aggregated patterns only. Strictly non-surveillance. |

---

## 4. The 7-Level Leadership Evidence Ladder

Every effectiveness claim and observed change is evaluated against the 7-level evidence hierarchy:

```
Level 1: INSIGHT             — Leader understands the gap (diagnostic completed, narrative reflected).
Level 2: PRACTICE            — Leader demonstrates the behavior in rehearsal / simulation / role-play.
Level 3: COMMITMENT          — Leader explicitly chooses and contracts a real-world action with target date.
Level 4: APPLICATION         — Leader performs the behavior in a real workplace situation.
Level 5: REPETITION           — Leader demonstrates repeated application across multiple weeks/situations.
Level 6: EXTERNAL OBSERVATION— Team member, peer, manager, or stakeholder observes and confirms the shift.
Level 7: BUSINESS EFFECT     — Measurable work or organizational outcome improves (e.g., recovered hours, team velocity, decision speed).
```

### Claim Classification Rule:
Every insight presented on the dashboard must be explicitly typed as:
- **FACT:** Directly observed or recorded data point (e.g., "Logged 12 hours in routine operational syncs this week").
- **INFERENCE:** Analytical deduction with stated confidence (e.g., "Delegation capacity appears restricted by operational checking").
- **HYPOTHESIS:** Development opportunity to test (e.g., "Distinguishing accountability from execution may recover ~3.5 hrs/week").

Never merge facts with hypotheses.

---

## 5. Non-Surveillance & Anti-Shaming Mandates

1. **Work Genome is NOT Employee Surveillance:**
   - It measures **leadership capacity allocation** (Strategy, People, Stakeholders, Decisions, Operations, Meetings, Firefighting).
   - It **never** tracks keystrokes, mouse movement, screen recordings, presence status, webcam telemetry, or email volume surveillance.
2. **Supportive, Exploratory Coaching Tone:**
   - Low scores or work-below-level findings are framed as **"Hypotheses for Capacity Recovery"**, never as incompetence, failure, or character deficit.
   - SAGE and NBLA must never diagnose mental health conditions, offer clinical therapy, or recommend disciplinary/termination actions.
3. **The "Nothing Today" Principle:**
   - When a leader is experiencing high workload, recent intervention fatigue, or has outstanding real-world commitments pending execution, the Next Best Action engine must have the option to output:
     `{ actionType: "do_nothing", headline: "Protect your focus today", reason: "Focus on executing your Friday delegation commitment before introducing new actions." }`

---

## 6. Mathematical & Scoring Rules

### 6.1 Capacity Score & Capacity Gap
- Total Leadership Capacity = 100% across 8 standardized categories:
  1. `strategic_thinking`
  2. `people_development`
  3. `stakeholder_leadership`
  4. `decision_making`
  5. `operational_execution`
  6. `meetings_coordination`
  7. `administrative_reporting`
  8. `firefighting_reactive`
- Target benchmarks vary by career stage / altitude (Manager vs. Senior Leader vs. Executive).
- Capacity Gap = Sum of absolute differences between Current and Target allocations divided by 2.
- Recoverable Hours = Estimated weekly hours spent in `operational_execution` below level + avoidable `meetings_coordination` + `administrative_reporting`.

### 6.2 Work-at-Level Taxonomy
- `below_level`: Tasks that could reasonably be delegated, automated, or eliminated.
- `at_level`: Core leadership responsibilities appropriate for the leader's span and altitude.
- `above_level_strategic`: High-leverage strategic thinking, future capacity creation, enterprise alignment.

### 6.3 Capacity Reallocation Engine (6-way taxonomy)
- `ELIMINATE`: Work that produces no meaningful outcome.
- `SIMPLIFY`: Processes that can be streamlined or shortened.
- `AUTOMATE`: Deterministic routines suitable for tooling/software.
- `AUTONOMIZE`: AI capabilities that can handle draft synthesis/summaries.
- `AUGMENT`: Leader retains responsibility with AI assistance.
- `ELEVATE`: High-leverage leadership moments that deserve *more* time.

---

## 7. Immediate Next Code Steps

1. Export shared types, Zod schemas, and deterministic scoring helpers in `shared/modules/effectivenessIntelligence.ts`.
2. Add new schema tables in `drizzle/schema.ts` (`eiWorkScans`, `eiWorkActivities`, `eiCapacitySnapshots`, `eiOpportunityScans`, `eiBehaviorContracts`, `eiNextBestActions`, `eiEvidenceClaims`).
3. Run `pnpm drizzle-kit generate` to produce migration SQL.
4. Apply migration via database connection in sandbox.
5. Implement server domain logic in `server/effectivenessIntelligence.ts`.
6. Implement typed tRPC procedures in `server/routers/effectivenessIntelligence.ts` and mount on `appRouter`.
7. Upgrade `/manager` participant experience with Work Genome interview, Capacity Visual, and Next Best Action card.
8. Validate with Vitest unit tests, `pnpm check`, and browser tests.
