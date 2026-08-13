import { describe, expect, it } from "vitest";
import { isAllowedCorsOrigin } from "./originPolicy";

describe("isAllowedCorsOrigin", () => {
  it("allows the configured public domains in production", () => {
    expect(isAllowedCorsOrigin("https://levelnext.coach", "production")).toBe(true);
    expect(isAllowedCorsOrigin("https://www.levelnext.coach", "production")).toBe(true);
  });

  it("allows the managed Cloud Run origin used by the production container", () => {
    expect(isAllowedCorsOrigin("https://fcxcpqxlw7-rd4hpxe4ya-uk.a.run.app", "production")).toBe(true);
  });

  it("continues to reject arbitrary origins in production", () => {
    expect(isAllowedCorsOrigin("https://malicious.example", "production")).toBe(false);
    expect(isAllowedCorsOrigin("http://localhost:3000", "production")).toBe(false);
  });
});

