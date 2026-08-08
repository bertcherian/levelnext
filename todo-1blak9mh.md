# Project TODO

- [x] Fix MEP diagnostic submission scale mismatch: backend accepts 1-5 but frontend sends 1-7
  - [x] Update Zod validation in submitDiagnostic to accept 1-7
  - [x] Update scoreMepDiagnostic scoring function for 7-point scale
  - [x] Update reversed question scoring from `6 - raw` to `8 - raw`
  - [x] Update normalization from `(avg - 1) / 4` to `(avg - 1) / 6`
  - [x] Add server-side error logging for easier future debugging
  - [x] Write vitest test for the fix

- [x] Add loading spinner and disable submit button while diagnostic report is being generated
- [x] Create dashboard section for viewing past MEI diagnostic scores and reports
- [x] Enhance error handling with retry button on submission failure toast
