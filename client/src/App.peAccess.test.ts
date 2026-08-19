import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("Professional Effectiveness route protection", () => {
  it("keeps every Professional Effectiveness route behind the authentication-first shared access wrapper", () => {
    expect(appSource).toContain("const withPeAccess");
    expect(appSource).toContain("const withPeLayout");

    for (const route of ["/pe", "/pe/assessment", "/pe/coach", "/pe/practice", "/pe/progress", "/pe/settings"]) {
      const routePosition = appSource.indexOf(`<Route path="${route}"`);
      expect(routePosition).toBeGreaterThan(-1);
      expect(appSource.slice(routePosition, routePosition + 150)).toContain("component={withPeLayout(");
    }

    const onboardingPosition = appSource.indexOf('<Route path="/pe/onboarding"');
    expect(onboardingPosition).toBeGreaterThan(-1);
    expect(appSource.slice(onboardingPosition, onboardingPosition + 150)).toContain("component={withPeAccess(");
  });
});
