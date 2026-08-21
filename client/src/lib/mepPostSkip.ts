export const MEP_POST_SKIP_WELCOME_KEY = "levelnext_mep_post_skip_welcome";
export const MEP_DEFERRED_ORG_SETUP_KEY = "levelnext_mep_deferred_org_setup";

export function isManagerEffectivenessDestination(destination: string) {
  return destination.startsWith("/manager");
}
