export function getMagicLinkRequestedProfile(name?: string, organisation?: string) {
  return {
    requestedName: name?.trim() || null,
    requestedOrganisation: organisation?.trim() || null,
  };
}
