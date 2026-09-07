// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import TechIntelligenceLanding from "./TechIntelligenceLanding";

afterEach(cleanup);

describe("Tech Intelligence landing branding", () => {
  it("uses the transparent LevelNext logo in both public-facing brand placements", () => {
    render(createElement(TechIntelligenceLanding));

    const logos = screen.getAllByAltText("LevelNext");

    expect(logos).toHaveLength(2);
    for (const logo of logos) {
      expect(logo.getAttribute("src")).toBe("/manus-storage/levelnext-logo-supplied_39366b94.png");
      expect(logo.getAttribute("src")).not.toBe("/logo.png");
    }
  });
});
