// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ setLocation: vi.fn(), captureLead: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, isAuthenticated: false }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    criticalThinking: { myCampaigns: { useQuery: () => ({ data: [], isLoading: false }) } },
    tenant: { myTenant: { useQuery: () => ({ data: undefined }) } },
    leads: { captureEmail: { useMutation: () => ({ mutate: mocks.captureLead, isPending: false }) } },
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

  it("provides a sample report CTA, interactive practice details, and an enterprise enquiry form", () => {
    render(<CriticalThinkingHome />);

    const sampleReport = screen.getByRole("link", { name: /download the sample report/i });
    expect(sampleReport.getAttribute("href")).toMatch(/LevelNext-Critical-Thinking-Diagnostic-Sample-Report/);
    expect(sampleReport.getAttribute("download")).toBe("LevelNext-Critical-Thinking-Diagnostic-Sample-Report.pdf");

    const framePractice = screen.getByRole("button", { name: /frame/i });
    fireEvent.focus(framePractice);
    expect(screen.getAllByText(/practice detail shown/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/it prevents an unowned conversation from being mistaken for a decision/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /enterprise enquiry/i }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /explore an enterprise pilot/i })).toBeTruthy();
    expect(screen.getByLabelText(/work email/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: "client@example.com" } });
    fireEvent.change(screen.getByLabelText(/^organisation/i), { target: { value: "Example Co" } });
    fireEvent.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(mocks.captureLead).toHaveBeenCalledWith(expect.objectContaining({
      email: "client@example.com",
      company: "Example Co",
      source: "ctdm_enterprise_enquiry",
      moduleCode: "ctdm",
    }));
  });
});
