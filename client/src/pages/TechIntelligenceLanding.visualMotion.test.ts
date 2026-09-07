import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Tech Intelligence visual motion", () => {
  it("uses stronger ring borders and respects reduced-motion preferences", () => {
    const styles = readFileSync("client/src/pages/techIntelligenceLanding.css", "utf8");

    expect(styles).toContain(".ti-hero__visual:before{border-width:2px;border-color:rgba(255,255,255,.36)}");
    expect(styles).toContain(".ti-hero__visual:after{border-width:2px;border-color:rgba(217,179,67,.58)}");
    expect(styles).toContain("@media(prefers-reduced-motion:no-preference){.ti-hero__visual:before{animation:ti-ring-breathe");
    expect(styles).toContain("@keyframes ti-ring-breathe{from{opacity:.68;transform:translate(-50%,-50%) scale(.975)}to{opacity:1;transform:translate(-50%,-50%) scale(1.035)}}");
  });
});
