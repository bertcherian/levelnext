/** Provides the appropriate Manager Effectiveness organisation destination. */
export function getMepOrganisationSetupHref(hasOrganisation: boolean) {
  return hasOrganisation ? "/organisation" : "/onboard?returnTo=/manager";
}
