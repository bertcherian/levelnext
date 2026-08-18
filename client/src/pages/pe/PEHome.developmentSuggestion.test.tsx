// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { DevelopmentSuggestionCard } from "./PEHome";

describe("Professional Effectiveness development suggestion", () => {
  it("renders recommendation content without leaking citation markup", () => {
    const { container } = render(<DevelopmentSuggestionCard suggestion={{
      topic: '<cite index="10-1">AI fluency and helping teams work confidently with AI and automation</cite>',
      why: '<cite index="1-24">AI is changing leadership by increasing the need for data-informed decision-making.</cite>',
      action: "Identify one relevant AI capability and explore it for 15 minutes.",
    }} />);

    expect(screen.getByText("AI fluency and helping teams work confidently with AI and automation")).toBeTruthy();
    expect(screen.getByText("AI is changing leadership by increasing the need for data-informed decision-making.")).toBeTruthy();
    expect(screen.getByText("Identify one relevant AI capability and explore it for 15 minutes.")).toBeTruthy();
    expect(container.textContent).not.toContain("<cite");
    expect(container.textContent).not.toContain("</cite>");
  });
});
