// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCoachGuidedMirrorThemes: vi.fn((input: { periodDays: 30 | 90 } = { periodDays: 30 }) => ({
    isLoading: false,
    data: input.periodDays === 30
      ? { eligible: true, cohortSize: 6, minimumCohortSize: 5, themes: [{ dimension: "courage", distinctionId: "OD-22", label: "courage · OD-22", count: 6, experiments: 2 }], trends: [{ dimension: "courage", distinctionId: "OD-22", label: "courage · OD-22", currentCount: 6, previousCount: 5, change: 1, direction: "up" }] }
      : { eligible: true, cohortSize: 6, minimumCohortSize: 5, themes: [], trends: [] },
  })),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 7, name: "Coach" }, loading: false }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    coach: {
      getMyProfile: { useQuery: () => ({ data: { name: "Coach Avery", specialisation: null }, isLoading: false }) },
      getMyClients: { useQuery: () => ({ data: [], isLoading: false }) },
    },
    intelligenceCore: { getCoachGuidedMirrorThemes: { useQuery: mocks.getCoachGuidedMirrorThemes } },
  },
}));

import CoachPortal from "./CoachPortal";

describe("Coach Portal aggregate trend rendering", () => {
  beforeEach(() => mocks.getCoachGuidedMirrorThemes.mockClear());

  it("requests selected windows and renders trend rows only when the aggregate API returns eligible trend data", () => {
    render(<CoachPortal />);
    expect(screen.getAllByText("courage · OD-22")).toHaveLength(2);
    expect(screen.getByText("+1 vs prior period")).toBeTruthy();
    expect(mocks.getCoachGuidedMirrorThemes).toHaveBeenCalledWith({ periodDays: 30 }, expect.anything());

    fireEvent.click(screen.getByRole("button", { name: "90d" }));
    expect(mocks.getCoachGuidedMirrorThemes).toHaveBeenCalledWith({ periodDays: 90 }, expect.anything());
    expect(screen.queryByText("+1 vs prior period")).toBeNull();
  });
});
