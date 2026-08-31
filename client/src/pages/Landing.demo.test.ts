import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";
import EngineeringDemo from "./EngineeringDemo";

describe("LevelNext public demo pathway", () => {
  it("keeps the LevelNext logo visible and provides a public demo link", () => {
    const page = renderToStaticMarkup(createElement(Landing));
    expect(page).toContain('src="/logo.png"');
    expect(page).toContain('href="/demo"');
    expect(page).toContain("View the demo");
  });

  it("renders a product walkthrough without creating or displaying personal participant data", () => {
    const page = renderToStaticMarkup(createElement(EngineeringDemo));
    expect(page).toContain("Interactive product walkthrough");
    expect(page).toContain("Engineering Impact Diagnostic");
    expect(page).toContain("Operating Profile");
    expect(page).toContain("Partner support");
    expect(page).toContain("It contains no personal data");
    expect(page).toContain('href="/engineering/diagnostic"');
  });
});
