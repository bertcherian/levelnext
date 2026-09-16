# Tech Intelligence UX Enhancements — 16 September 2026

## Scope

Implement the two approved follow-ups from the Tech Intelligence audit:

1. Show a brief post-login restoration cue when a participant returns to a saved Tech Impact Diagnostic session.
2. Add illustrative technical-persona presets to the public Cost Calculator for Not Coaching, while keeping every assumption editable and clearly non-predictive.

## Implementation plan

- Add restoration state to `EngineeringDiagnostic.tsx` when an in-progress session contains saved responses or has advanced beyond the first question. Render a dismissible, accessible status prompt showing the saved-response count and current question.
- Add three illustrative persona profiles to `TechIntelligenceLanding.tsx`: Platform Engineering, Core Product Engineering, and Engineering Leadership Cohort. Applying a profile updates the calculator inputs and marks the profile as selected; editing any input switches the selection to Custom.
- Extend focused tests for the restoration cue and calculator presets without changing backend contracts or database schema.
- Run focused tests, TypeScript validation, production build, and preview smoke checks. Save a WebDev checkpoint after validation.

## Guardrails

- No database migration or external service integration is required.
- Preset values are planning examples only; preserve the page’s existing non-forecast/non-ROI disclosure.
- Keep the public Tech Intelligence visual language and protected-route privacy boundaries unchanged.
