import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Tech Intelligence platform capability card readability", () => {
  it("uses larger pure-black supporting copy and chrome-yellow card borders", () => {
    const styles = readFileSync("client/src/pages/techIntelligenceEnhancements.css", "utf8");

    expect(styles).toContain(".ti-platform__grid p{color:#000;font-size:14px;line-height:1.65}");
    expect(styles).toContain(".ti-platform__grid article{border-right-color:#e6c865;border-bottom-color:#e6c865}");
    expect(styles).toContain(".ti-platform__grid{border-top-color:#e6c865;border-left-color:#e6c865}");
  });
});
