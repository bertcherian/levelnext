import { describe, expect, it } from "vitest";
import { COOKIE_NAME, MAGIC_LINK_SESSION_COOKIE_NAME } from "@shared/const";
import { selectSessionToken } from "./sdk";

describe("selectSessionToken", () => {
  it("uses the freshly redeemed magic-link bearer session instead of an older Bert cookie", () => {
    expect(selectSessionToken({
      cookieHeader: `${COOKIE_NAME}=bert-session`,
      authorization: "Bearer care-fresh-session",
    })).toBe("care-fresh-session");
  });

  it("uses the normal cookie session when no explicit magic-link session is supplied", () => {
    expect(selectSessionToken({ cookieHeader: `${COOKIE_NAME}=care-session` })).toBe("care-session");
  });

  it("uses the dedicated fresh magic-link cookie instead of a stale standard Bert cookie", () => {
    expect(selectSessionToken({
      cookieHeader: `${COOKIE_NAME}=bert-stale; ${MAGIC_LINK_SESSION_COOKIE_NAME}=care-fresh`,
    })).toBe("care-fresh");
  });
});
