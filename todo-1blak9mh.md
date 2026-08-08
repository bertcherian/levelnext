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

- [x] Create safeJsonParse utility and wrap 20 unprotected JSON.parse calls
  - [x] careerAccess.ts (7 calls fixed)
  - [x] chatgptImport.ts (3 calls fixed)
  - [x] ciReport.ts (1 call fixed)
  - [x] cpiReport.ts (1 call fixed)
  - [x] eciImport.ts (1 call fixed)
  - [x] interviewPrep.ts (1 call fixed)
  - [x] launchCareerCompass.ts (1 call fixed)
  - [x] launchDailyMissions.ts (1 call fixed)
  - [x] launchStoryBuilder.ts (2 calls fixed)
  - [x] liReport.ts (1 call fixed)
  - [x] mep.ts (6 calls fixed)
- [x] Install and configure Helmet, CORS, and rate limiting middleware
  - [x] Install helmet, express-rate-limit, cors packages
  - [x] Configure Helmet with CSP for production domain
  - [x] Configure CORS for production domains
  - [x] Add rate limiting (general 60/min + strict 20/min for LLM endpoints)
  - [x] Wire middleware into Express server
- [x] Add onError callbacks to unhandled useMutation calls across client pages
  - [x] Created shared mutationError.ts utility for reusable onError handler
  - [x] Added global mutation cache subscriber in main.tsx that auto-toasts errors for mutations without their own onError handler
  - [x] Global handler respects per-mutation onError (no duplicate toasts)
- [x] Write tests and verify TypeScript compilation
- [x] Save checkpoint
