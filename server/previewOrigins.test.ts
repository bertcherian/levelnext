import { describe, expect, it } from "vitest";
import { isAllowedCorsOrigin } from "./_core/originPolicy";

describe("managed preview CORS origin policy", () => {
  it("allows regional Manus preview origins during development", () => {
    expect(isAllowedCorsOrigin("http://127.0.0.1:3000", "development")).toBe(true);
    expect(isAllowedCorsOrigin("https://3000-ih8pm3foywu7hs0toabfn-70aae77a.sg1.manus.computer", "development")).toBe(true);
    expect(isAllowedCorsOrigin("https://preview.manus.space", "development")).toBe(true);
  });

  it("keeps custom production domains available while rejecting untrusted origins", () => {
    expect(isAllowedCorsOrigin("https://levelnext.coach", "production")).toBe(true);
    expect(isAllowedCorsOrigin("https://malicious.example", "development")).toBe(false);
    expect(isAllowedCorsOrigin("https://preview.manus.computer.evil.example", "development")).toBe(false);
  });
});
