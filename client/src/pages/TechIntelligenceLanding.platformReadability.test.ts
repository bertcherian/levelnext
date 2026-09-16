import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Tech Intelligence platform capability card readability", () => {
  it("uses larger pure-black supporting copy and chrome-yellow card borders", () => {
    const styles = readFileSync("client/src/pages/techIntelligenceEnhancements.css", "utf8");

    expect(styles).toContain(".ti-platform__grid p{color:#000;font-size:14px;line-height:1.65}");
    expect(styles).toContain(".ti-platform__grid article{border-right-color:#e6c865;border-bottom-color:#e6c865}");
    expect(styles).toContain(".ti-platform__grid{border-top-color:#e6c865;border-left-color:#e6c865}");
    expect(styles).toContain(".ti-gap__card{border-color:#e6c865;box-shadow:0 8px 20px rgba(16,42,67,.08)}");
    expect(styles).toContain(".ti-gap__card>div{border-right-color:#e6c865;border-bottom-color:#e6c865}");
    expect(styles).toContain(".ti-platform__grid article:hover{background:#fff8df;box-shadow:0 10px 22px rgba(16,42,67,.1)}");
    expect(styles).toContain(".ti-platform__grid article:hover>div svg{transform:scale(1.12)}");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce){.ti-platform__grid article,.ti-platform__grid article>div svg{transition:none}.ti-platform__grid article:hover>div svg{transform:none}}");
  });
});
