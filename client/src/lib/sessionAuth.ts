import { COOKIE_NAME } from "@shared/const";

export const MAGIC_LINK_SESSION_STORAGE_KEY = "manus-cookie";

type BrowserLocation = Pick<Location, "hash" | "pathname" | "search">;
type BrowserHistory = Pick<History, "replaceState">;
type SessionStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type BootstrapSessionOptions = {
  location: BrowserLocation;
  history: BrowserHistory;
  storage: SessionStorage;
};

/**
 * Keeps a fresh email-link session in sync with the browser fallback token.
 * A normal OAuth callback clears that fallback so an older magic-link identity
 * cannot override the identity just selected in OAuth.
 */
export function bootstrapSessionFromUrl({ location, history, storage }: BootstrapSessionOptions) {
  const params = new URLSearchParams(location.search);
  const magicLinkToken = params.get("_st");
  const isOAuthCallback = params.get("_auth") === "oauth";

  if (!magicLinkToken && !isOAuthCallback) return false;

  if (magicLinkToken) {
    storage.setItem(MAGIC_LINK_SESSION_STORAGE_KEY, `${COOKIE_NAME}=${magicLinkToken}`);
  } else {
    storage.removeItem(MAGIC_LINK_SESSION_STORAGE_KEY);
  }

  params.delete("_st");
  params.delete("_auth");
  const nextSearch = params.toString();
  history.replaceState(null, "", `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}${location.hash}`);
  return true;
}
