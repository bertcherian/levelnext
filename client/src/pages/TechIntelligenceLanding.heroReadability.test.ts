import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Tech Intelligence hero readability", () => {
  it("uses black CTA text and larger supporting copy on the dark hero", () => {
    const styles = readFileSync("client/src/pages/techIntelligenceLanding.css", "utf8");

    expect(styles).toContain(".ti-page a.ti-button--gold,.ti-page a.ti-button--gold:visited,.ti-page a.ti-button--gold:hover{color:#000}");
    expect(styles).toContain(".ti-hero__note{color:rgba(255,255,255,.76);font-size:12px;line-height:1.5}");
    expect(styles).toContain(".ti-visual__caption{max-width:275px;color:rgba(255,255,255,.76);font-size:12px;line-height:1.6}");
  });
});
