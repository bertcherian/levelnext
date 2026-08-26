import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landing = readFileSync(new URL("./Landing.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./landing.css", import.meta.url), "utf8");

describe("LevelNext landing-page Professional Intelligence composition", () => {
  it("renders a connected seven-capability map instead of the prior loose label cluster", () => {
    expect(landing).toContain("ln-professional-visual__routes");
    expect(landing).toContain("ln-professional-visual__core");
    ["Communication", "Ownership", "Execution", "Collaboration", "Judgement", "Influence", "Adaptability"].forEach((label) => expect(landing).toContain(label));
  });

  it("uses compact primary-section spacing with a mobile-specific capability-map layout", () => {
    expect(styles).toContain(".ln-problem--simple { padding-block: clamp(56px, 7vw, 82px); }");
    expect(styles).toContain(".ln-core--simple { padding-block: clamp(58px, 7vw, 86px); }");
    expect(styles).toContain(".ln-professional-visual__cap--communication");
    expect(styles).toContain("@keyframes ln-capability-route");
  });
});
