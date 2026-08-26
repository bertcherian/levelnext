import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landing = readFileSync(new URL("./Landing.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./landing.css", import.meta.url), "utf8");

describe("LevelNext enriched stage visuals", () => {
  it("provides a keyboard-accessible explanation for every Professional Intelligence capability", () => {
    expect(landing).toContain("professionalCapabilities");
    expect(landing).toContain('className={`ln-professional-visual__cap');
    expect(landing).toContain('role="tooltip"');
    expect(landing).toContain("aria-label={`${capability}: ${explanation}`}");
    expect(styles).toContain(".ln-professional-visual__cap:focus-visible");
  });

  it("uses the same connected visual architecture for Manager and Executive Intelligence", () => {
    expect(landing).toContain("function ConnectedStageMap");
    expect(landing).toContain('kind="manager"');
    expect(landing).toContain('kind="executive"');
    expect(styles).toContain(".ln-stage-map__routes");
    expect(styles).toContain(".ln-stage-map--executive");
  });
});
