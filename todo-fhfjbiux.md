# Project TODO

- [x] Trace the magic-link sign-up callback and confirm that the authenticated email and display name come from the redeeming user rather than a prior session.
- [x] Trace the Manager Effectiveness onboarding flow and retain the selected Broadridge organization and onboarding user name through authentication.
- [x] Identify and correct the client or server code path causing the `Cannot read properties of undefined (reading '0')` error after sign-in.
- [x] Add focused regression tests for identity selection, organization-context preservation, and safe handling of empty Manager Effectiveness data.
- [x] Run the relevant test suite, verify the repaired application in the browser, and create a published checkpoint.
- [x] Capture the selected organisation name in the Manager Effectiveness sign-up flow and persist it with the magic-link request.
- [x] Prefill first-time Manager Effectiveness onboarding with the selected organisation after the email link is redeemed.
- [x] Add regression tests that prove the submitted organisation survives the magic-link handoff into onboarding.
- [x] Add server-side tests for persisting the requested organisation in a magic-link token and using it when building the post-redemption onboarding redirect.
- [x] Inspect the live magic-link request and redemption records for care@metaresults.com and reconcile them with the account shown after login.
- [x] Eliminate any remaining credential precedence or cookie-domain path that can resolve a newly redeemed email link as Bert.
- [x] Locate and guard the exact remaining `Cannot read properties of undefined (reading '0')` path observed immediately after Manager Effectiveness login.
- [x] Add regression coverage for the care-account redemption path, run validation, and publish the corrective checkpoint.
- [x] Use a dedicated magic-link session cookie and explicit precedence so a fresh care redemption cannot collide with any stale Bert standard-session cookie.
