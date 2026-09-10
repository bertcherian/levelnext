export function getMagicLinkRequestedProfile(name?: string, organisation?: string, whatsappNumber?: string) {
  return {
    requestedName: name?.trim() || null,
    requestedOrganisation: organisation?.trim() || null,
    requestedWhatsappNumber: whatsappNumber?.trim() || null,
  };
}
