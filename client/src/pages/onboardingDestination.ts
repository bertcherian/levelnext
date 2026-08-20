/**
 * Preserve the product an individual selected while keeping redirect targets
 * inside the application. Home is organisation-gated and would re-open setup.
 */
export function getIndividualOnboardingDestination(returnTo: string | null) {
  if (
    returnTo
    && !returnTo.startsWith("//")
    && !returnTo.includes("\\")
    && (returnTo.startsWith("/career") || returnTo.startsWith("/manager"))
  ) {
    return returnTo;
  }

  return "/career";
}
