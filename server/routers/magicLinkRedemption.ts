import type { MagicLinkToken } from "../../drizzle/schema";
import { getMagicLinkRedirectLocation } from "./magicLinkDestination";

type RedemptionRedirectInput = {
  origin: string;
  sessionToken: string;
  isNewUser: boolean;
  isSPInvite: boolean;
  magicLink: Pick<MagicLinkToken, "returnTo" | "requestedOrganisation">;
};

/** Builds the post-redemption route from the same token fields persisted at request time. */
export function getMagicLinkRedemptionRedirect({
  origin,
  sessionToken,
  isNewUser,
  isSPInvite,
  magicLink,
}: RedemptionRedirectInput) {
  return getMagicLinkRedirectLocation({
    origin,
    sessionToken,
    isNewUser,
    isSPInvite,
    returnTo: magicLink.returnTo,
    requestedOrganisation: magicLink.requestedOrganisation,
  });
}
