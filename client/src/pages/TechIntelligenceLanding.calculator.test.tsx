// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TechIntelligenceLanding from "./TechIntelligenceLanding";

describe("TechIntelligenceLanding calculator", () => {
  afterEach(() => cleanup());

  it("uses the Not Coaching cost calculator label with its prominent treatment", () => {
    render(<TechIntelligenceLanding />);

    const label = screen.getByText("Cost Calculator for Not Coaching");
    expect(label.className).toContain("ti-calculator__kicker");
    expect(screen.queryByText(/Gap Selling cost calculator/i)).toBeNull();
  });
});
