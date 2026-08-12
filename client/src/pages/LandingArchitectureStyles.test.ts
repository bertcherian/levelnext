import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const landingStyles = readFileSync(
  resolve(process.cwd(), "client/src/pages/landing.css"),
  "utf8",
);

describe("LevelNext landing architecture refinements", () => {
  it("keeps the Why LevelNext statement comfortably spaced and legible on navy", () => {
    expect(landingStyles).toContain(".ln-difference h2 { letter-spacing: -.035em; }");
    expect(landingStyles).toContain(".ln-difference h2 span { color: #bdd9ed;");
  });

  it("uses visible, centered product cards and stronger animated signal lines", () => {
    expect(landingStyles).toContain(".ln-core__product-card { min-height: 96px;");
    expect(landingStyles).toContain("display: grid; place-items: center;");
    expect(landingStyles).toContain("border: 2px solid #84929b;");
    expect(landingStyles).toContain(".ln-core__signals i { width: 2px; background: #b58932;");
    expect(landingStyles).toContain(".ln-core__signals i::after { width: 7px; height: 7px;");
    expect(landingStyles).toContain(".ln-core__signals i.is-active { width: 4px;");
  });

  it("keeps key decorative guides stronger than the earlier low-contrast treatment", () => {
    expect(landingStyles).toContain(".ln-journey__line { height: 2px; background: rgba(255,255,255,.42);");
    expect(landingStyles).toContain(".ln-difference__divider { height: 2px; background: rgba(255,255,255,.42);");
    expect(landingStyles).toContain(".ln-enterprise__pipeline::before { height: 2px;");
    expect(landingStyles).toContain(".ln-professional-visual::before { border-width: 2px;");
    expect(landingStyles).toContain(".ln-leader-visual::before, .ln-leader-visual::after { border-width: 2px;");
  });

  it("centres the hero and Intelligence Core while strengthening light-surface explanatory copy", () => {
    expect(landingStyles).toContain(".ln-hero__content { padding-right: 0; display: grid; justify-items: center; text-align: center;");
    expect(landingStyles).toContain(".ln-hero h1 { max-width: 100%; font-size: clamp(46px, 4.9vw, 70px); white-space: nowrap;");
    expect(landingStyles).toContain(".ln-core__base > div { justify-content: center; gap: 12px;");
    expect(landingStyles).toContain("border: 2px solid rgba(255,255,255,.56);");
    expect(landingStyles).toContain("color: rgba(0,0,0,.8) !important;");
  });
});
