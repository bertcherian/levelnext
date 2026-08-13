import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Launch Intelligence in-app Neo-brutalist theme", () => {
  it("scopes the landing page visual language to the shared in-app layout", () => {
    const layout = readFileSync("client/src/components/LaunchDarkLayout.tsx", "utf8");
    const styles = readFileSync("client/src/index.css", "utf8");

    expect(layout).toContain('"launch-brutal-app"');
    expect(styles).toContain(".launch-brutal-app .ld-card");
    expect(styles).toContain("--launch-shadow");
    expect(styles).toContain("border: 2px solid var(--launch-ink)");
    expect(styles).toContain(".launch-brutal-app p,");
    expect(styles).toContain("color: var(--launch-ink) !important;");
    expect(styles).toContain("--ld-text: var(--launch-ink);");
    expect(styles).toContain("--ld-text-muted: #4f493f;");
    expect(styles).toContain(".launch-brutal-app :is(p, h1, h2, h3, h4, h5, h6).text-white,");
    expect(styles).toContain("[style*=\"color: rgba(255\"]");
    expect(styles).toContain("button[class*=\"rounded\"]:not(.launch-app-select-card):not(.launch-app-button):not(.ld-bottom-nav-item)");
    expect(styles).toContain("button[style*=\"#3B82F6\"]:not(.launch-app-button)");
  });

  it("places the standalone onboarding flow inside the same visual system", () => {
    const onboarding = readFileSync("client/src/pages/launch/LaunchOnboarding.tsx", "utf8");

    expect(onboarding).toContain("launch-brutal-app--onboarding");
    expect(onboarding).toContain("launch-app-onboarding-card");
    expect(onboarding).toContain("launch-app-select-card");
    expect(onboarding).toContain('aria-pressed={isSelected}');
  });
});
