// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({ useLocation: () => [window.location.pathname, navigate] }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Career User" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    tenant: {
      create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      join: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import Onboarding from "./Onboarding";

describe("Onboarding individual Career bypass", () => {
  beforeEach(() => { navigate.mockReset(); });
  afterEach(() => { cleanup(); window.history.replaceState({}, "", "/onboard"); });

  it("moves an individual first-time user to Career Transition rather than organisation-gated Home", () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole("button", { name: /go to career transition/i }));
    expect(navigate).toHaveBeenCalledWith("/career");
    expect(navigate).not.toHaveBeenCalledWith("/home");
  });

  it("preserves a safe Career sub-route after individual onboarding", () => {
    window.history.replaceState({}, "", "/onboard?returnTo=/career/market-intel");
    render(<Onboarding />);
    fireEvent.click(screen.getByRole("button", { name: /go to career transition/i }));
    expect(navigate).toHaveBeenCalledWith("/career/market-intel");
  });
});
