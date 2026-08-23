// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { COOKIE_NAME } from "@shared/const";
import { bootstrapSessionFromUrl, MAGIC_LINK_SESSION_STORAGE_KEY } from "./sessionAuth";

describe("bootstrapSessionFromUrl", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/manager");
  });

  it("replaces an older fallback identity with the freshly redeemed magic-link session", () => {
    window.sessionStorage.setItem(MAGIC_LINK_SESSION_STORAGE_KEY, `${COOKIE_NAME}=bert-session`);
    window.history.replaceState({}, "", "/manager?_st=sheila-session&keep=1");

    const changed = bootstrapSessionFromUrl({ location: window.location, history: window.history, storage: window.sessionStorage });

    expect(changed).toBe(true);
    expect(window.sessionStorage.getItem(MAGIC_LINK_SESSION_STORAGE_KEY)).toBe(`${COOKIE_NAME}=sheila-session`);
    expect(window.location.search).toBe("?keep=1");
  });

  it("clears a stale magic-link fallback after a normal OAuth callback", () => {
    window.sessionStorage.setItem(MAGIC_LINK_SESSION_STORAGE_KEY, `${COOKIE_NAME}=sheila-session`);
    window.history.replaceState({}, "", "/home?_auth=oauth");

    const changed = bootstrapSessionFromUrl({ location: window.location, history: window.history, storage: window.sessionStorage });

    expect(changed).toBe(true);
    expect(window.sessionStorage.getItem(MAGIC_LINK_SESSION_STORAGE_KEY)).toBeNull();
    expect(window.location.search).toBe("");
  });
});
