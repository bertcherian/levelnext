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
    expect(landingStyles).toContain(".ln-core__products span { display: flex; align-items: center; justify-content: center;");
    expect(landingStyles).toContain("border: 2px solid #84929b;");
    expect(landingStyles).toContain(".ln-core__signals i { width: 2px; background: #b58932;");
    expect(landingStyles).toContain(".ln-core__signals i::after { width: 7px; height: 7px;");
  });
});
