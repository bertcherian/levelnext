# LevelNext 30-Day Behaviour Change Proof — implementation slice

## Product outcome
Turn the LevelNext homepage into a self-service pilot entry point that lets a sponsor describe one business problem, accept an AI-assisted default pilot, invite a small cohort, and see privacy-safe evidence of movement through Day 30.

## First-release slice
1. Public `/pilot` builder: one-question problem intake, suggested target behaviours, observable actions, business signals, sensible 30-day defaults, and low-friction participant paste-in.
2. Authenticated launch: persist the pilot, send participant invite emails, and show a sponsor dashboard with next-best action, activation counts, momentum, evidence strength, and Day 30 decision readiness.
3. Participant invite route: explain the 30-day proof, capture baseline, support a first Behaviour Rep, real-work opportunity, action check-in, and optional observer pulse without exposing private coaching text.
4. Day 30 proof: aggregate system, behavioural, human, and business-signal evidence into an honest proof snapshot with expansion choices; never claim causality or ROI from self-report alone.

## Reuse
- Existing tRPC, Manus auth, `platformInvites`/email infrastructure, `practice` and `simulator` surfaces, `pilotlab` event vocabulary, `biEvidence`/commitment concepts, and LevelNext brand tokens.
- Keep hidden ground truth and private participant reflections out of sponsor responses.

## Persistence
- `proof_pilots`: sponsor-owned pilot, problem, recommended behaviours, actions, signals, duration, status, start/end dates, activation timestamps.
- `proof_participants`: email/name/invite state, role, baseline/first-rep/first-real-work activation markers.
- `proof_observations`: source (`system`, `behavioural`, `human`, `business_signal`), participant-safe measure, evidence strength, privacy scope, and observer note.

## API
- Public `previewPilot`: deterministic recommendation from problem text.
- Protected `createPilot`, `getSponsorDashboard`, `inviteParticipants`, `recordParticipantBaseline`, `recordBehaviourRep`, `recordRealWorkApplication`, `recordObserverPulse`, `getDay30Proof`.
- Share-safe proof response excludes private coaching/reflection content and caps self-report evidence.

## UI
- Public `PilotBuilder` route with four progressive steps: problem → confirm behaviours → add people → launch.
- Protected `PilotProofDashboard` route with a persistent next-best-action card, activation funnel, momentum state, evidence mix, Day 15 pulse, Day 30 proof, and expansion CTAs.
- Protected `PilotParticipant` route with a short baseline and daily loop: Notice → Choose → Practise → Do → Reflect.
- Homepage primary `Start a Pilot` CTA opens `/pilot`; human help remains secondary.

## Guardrails
- Account creation deferred until save/invite/launch.
- Participant private coaching/reflection stays private by default.
- No ROI, causal, or business-impact claims from simulation or self-report alone.
- All timestamps persisted as UTC; display in local time.
- Deterministic recommendations first; AI generation can be added after the workflow is stable.

## Validation
- Shared recommendation and evidence aggregation tests.
- Router-level authorization and launch tests.
- UI contract tests for homepage CTA, pilot builder steps, participant flow, and sponsor proof boundary.
- `pnpm check`, focused Vitest suite, `pnpm build`, migration verification, and public/protected route checks.
