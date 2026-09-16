// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("applies a technical persona preset while keeping the assumptions editable", () => {
    render(<TechIntelligenceLanding />);

    const platformPreset = screen.getByRole("button", { name: "Platform Engineering" });
    expect(platformPreset.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(platformPreset);

    expect(platformPreset.getAttribute("aria-pressed")).toBe("true");
    const populationInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(populationInput.value).toBe("120");
    expect(screen.getByText("Preset selected — all values remain editable")).toBeTruthy();

    fireEvent.change(populationInput, { target: { value: "140" } });

    expect(populationInput.value).toBe("140");
    expect(screen.getByText("Custom inputs selected")).toBeTruthy();
    expect(platformPreset.getAttribute("aria-pressed")).toBe("false");
  });
});
