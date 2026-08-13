import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Launch Home dashboard contrast", () => {
  it("uses shared high-contrast card classes for every dashboard section", () => {
    const page = readFileSync("client/src/pages/launch/LaunchHome.tsx", "utf8");
    const styles = readFileSync("client/src/index.css", "utf8");

    expect(page).toContain("launch-dashboard-card--missions");
    expect(page).toContain("launch-dashboard-card--progress");
    expect(page).toContain("launch-dashboard-card--target");
    expect(page).toContain("launch-dashboard-card--journey");
    expect(page).toContain("launch-dashboard-card--achievements");
    expect(styles).toContain(".launch-brutal-app .launch-dashboard-card {");
    expect(styles).toContain("box-shadow: var(--launch-shadow) !important;");
  });

  it("keeps mission descriptions strong and legible", () => {
    const page = readFileSync("client/src/pages/launch/LaunchHome.tsx", "utf8");
    const styles = readFileSync("client/src/index.css", "utf8");

    expect(page).toContain("launch-mission-card__description");
    expect(styles).toContain(".launch-brutal-app .launch-mission-card__description {");
    expect(styles).toContain("font-weight: 600;");
    expect(styles).toContain("line-height: 1.55;");
  });
});
