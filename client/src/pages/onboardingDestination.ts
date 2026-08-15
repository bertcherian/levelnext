/**
 * Individual onboarding is entered from personal Career Transition journeys.
 * Keep users in that personal flow and never send an unprovisioned user back
 * to Home, which requires an organisation and would re-open onboarding.
 */
export function getIndividualOnboardingDestination(returnTo: string | null) {
  if (returnTo && returnTo.startsWith("/career") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  return "/career";
}
