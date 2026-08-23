// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MEP_DEFERRED_ORG_SETUP_KEY, MEP_POST_SKIP_WELCOME_KEY } from "@/lib/mepPostSkip";

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

describe("Onboarding tester bypass", () => {
  beforeEach(() => {
    navigate.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => { cleanup(); window.history.replaceState({}, "", "/onboard"); });

  it("moves an individual first-time user to Career Transition rather than organisation-gated Home", () => {
    render(<Onboarding />);
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(navigate).toHaveBeenCalledWith("/career");
    expect(navigate).not.toHaveBeenCalledWith("/home");
  });

  it("preserves a safe Career sub-route after individual onboarding", () => {
    window.history.replaceState({}, "", "/onboard?returnTo=/career/market-intel");
    render(<Onboarding />);
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(navigate).toHaveBeenCalledWith("/career/market-intel");
  });

  it("keeps a manager-effectiveness tester in Manager Effectiveness", () => {
    window.history.replaceState({}, "", "/onboard?returnTo=/manager");
    render(<Onboarding />);
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));
    expect(navigate).toHaveBeenCalledWith("/manager?onboarding=skipped");
    expect(window.sessionStorage.getItem(MEP_POST_SKIP_WELCOME_KEY)).toBe("true");
    expect(window.localStorage.getItem(MEP_DEFERRED_ORG_SETUP_KEY)).toBe("true");
  });

  it("prefills an organisation selected before email verification", () => {
    window.history.replaceState({}, "", "/onboard?returnTo=%2Fmanager&org=Broadridge");
    render(<Onboarding />);
    expect(screen.getByDisplayValue("Broadridge")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /create your organisation/i })).toBeTruthy();
  });
});
