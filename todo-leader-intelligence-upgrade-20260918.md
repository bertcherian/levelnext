# Leader Intelligence Upgrade — 18 September 2026

## Completed scope

- Made `/leader` the canonical Leader Intelligence URL and updated navigation, product switching, login return paths, onboarding, signup, and public landing links.
- Added a concise “How to use Guide” explainer to the Guide page.
- Removed GCC Readiness from Leader-facing diagnostics, My Edge, Progress, onboarding, and signup summary surfaces while preserving historical/backend organisation data.
- Removed the Engineering Intelligence card from Leader diagnostics and added an explicit Tech Impact Diagnostic entry point to Tech Intelligence.
- Shortened the Tech Intelligence landing page by removing the Evidence, next-move, and booking-gap sections; preserved focused diagnostic, calculator, platform, and pilot CTAs.
- Redesigned Next Chapter with a clear orientation header, progress summary, lighter stage navigation, portfolio CTA, and improved chat workspace hierarchy.

## Validation gates

- `pnpm check` passed.
- Focused regression suite passed: 25 tests across 7 files.
- `pnpm build` passed with existing large-chunk warnings only.
- Preview smoke check confirmed the shortened Tech Intelligence page and its `/engineering/diagnostic` CTA.
