import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landing = readFileSync(new URL("./Landing.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./landing.css", import.meta.url), "utf8");

describe("LevelNext landing-page business-diagnostic composition", () => {
  it("renders a connected business-performance chain instead of generic AI imagery", () => {
    expect(landing).toContain("ln-business-chain");
    expect(landing).toContain("MANAGEMENT BEHAVIOUR");
    expect(landing).toContain("BUSINESS IMPACT");
    expect(landing).toContain("Poor management behaviour has a business cost.");
    expect(landing).not.toContain("ln-professional-visual");
  });

  it("uses compact calculator, evidence-flow, and impact-test layouts", () => {
    expect(styles).toContain(".ln-calculator__layout");
    expect(styles).toContain(".ln-evidence-flow");
    expect(styles).toContain(".ln-impact-test__layout");
    expect(styles).toContain(".ln-test-card");
  });
});
