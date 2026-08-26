// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Landing from "./Landing";

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
});

describe("Professional Intelligence capability explanations", () => {
  it("exposes a concise capability explanation when the map node receives keyboard focus", () => {
    render(<Landing />);

    const communication = screen.getByRole("button", {
      name: "Communication: Make intent, risk and progress easy to understand.",
    });

    fireEvent.focus(communication);

    expect(screen.getByText("Make intent, risk and progress easy to understand.", { selector: '[role="tooltip"]' })).toBeTruthy();
  });

  it("renders the related connected visual system when Manager and Executive stages are selected", () => {
    render(<Landing />);

    fireEvent.click(screen.getByRole("tab", { name: /03.*Manager/ }));
    expect(screen.getByText("Manager Intelligence")).toBeTruthy();
    expect(screen.getByText("Accountability")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /05.*Executive/ }));
    expect(screen.getByText("Executive Intelligence", { selector: ".ln-stage-map__core strong" })).toBeTruthy();
    expect(screen.getByText("Stakeholders")).toBeTruthy();
  });

  it("supports a direct stage query without changing the default landing experience", () => {
    window.history.replaceState({}, "", "/?stage=executive");
    render(<Landing />);

    expect(screen.getByText("Executive Intelligence", { selector: ".ln-stage-map__core strong" })).toBeTruthy();
    expect(screen.getByText("Impact")).toBeTruthy();
  });
});
