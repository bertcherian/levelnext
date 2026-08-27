// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, isAuthenticated: false }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    criticalThinking: { myCampaigns: { useQuery: () => ({ data: [], isLoading: false }) } },
    tenant: { myTenant: { useQuery: () => ({ data: undefined }) } },
  },
}));

vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
  useLocation: () => ["/critical-thinking", mocks.setLocation],
}));

import CriticalThinkingHome from "./CriticalThinkingHome";

describe("CriticalThinkingHome decision-intelligence visual system", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the decision-intelligence visual, all three evidence lenses, and the seven-practice map", () => {
    render(<CriticalThinkingHome />);

    expect(screen.getByRole("img", { name: /abstract constellation representing connected decision practices/i })).toBeTruthy();
    expect(screen.getByText("A more complete view")).toBeTruthy();
    expect(screen.getByText("What you say you tend to do")).toBeTruthy();
    expect(screen.getByText("What you choose in context")).toBeTruthy();
    expect(screen.getByText("What the context makes easier")).toBeTruthy();
    expect(screen.getByText("Seven practices. One stronger way to work through uncertainty.")).toBeTruthy();
    expect(screen.getByText(/^frame$/i)).toBeTruthy();
    expect(screen.getByText(/^learn$/i)).toBeTruthy();
  });

  it("retains the campaign access path from the primary hero call to action", () => {
    render(<CriticalThinkingHome />);

    const target = document.getElementById("your-campaigns");
    expect(target).toBeTruthy();
    const scrollIntoView = vi.fn();
    Object.defineProperty(target!, "scrollIntoView", { value: scrollIntoView, configurable: true });
    fireEvent.click(screen.getByRole("button", { name: /view my diagnostic/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});
