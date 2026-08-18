import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("Professional Effectiveness route protection", () => {
  it("wraps every Professional Effectiveness route in the authentication-first access gate", () => {
    for (const route of ["/pe/onboarding", "/pe", "/pe/assessment", "/pe/coach", "/pe/practice", "/pe/progress", "/pe/settings"]) {
      const routePosition = appSource.indexOf(`<Route path="${route}"`);
      expect(routePosition).toBeGreaterThan(-1);
      expect(appSource.slice(routePosition, routePosition + 180)).toContain("<PEAccessGate>");
    }
  });
});

