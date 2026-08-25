// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createCampaign: vi.fn(), addParticipant: vi.fn(), setLocation: vi.fn() }));

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    criticalThinking: {
      adminCampaigns: { useQuery: () => ({ data: { membership: { role: "owner" }, campaigns: [] }, isLoading: false, error: null }) },
      createCampaign: { useMutation: () => ({ mutateAsync: mocks.createCampaign, isPending: false }) },
      addParticipant: { useMutation: () => ({ mutateAsync: mocks.addParticipant, isPending: false }) },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/critical-thinking/pilot", mocks.setLocation] }));

import CriticalThinkingPilot from "./CriticalThinkingPilot";

describe("CriticalThinkingPilot", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCampaign.mockResolvedValue({ campaignId: 44 });
    mocks.addParticipant.mockResolvedValue({ participantId: 1 });
  });

  it("blocks invalid pilot email input before creating a campaign", async () => {
    const user = userEvent.setup();
    render(<CriticalThinkingPilot />);
    await user.type(screen.getByLabelText("Pilot participant emails"), "not-an-email");
    await user.click(screen.getByRole("button", { name: /launch pilot/i }));
    expect(await screen.findByText(/Correct these email addresses/i)).toBeTruthy();
    expect(mocks.createCampaign).not.toHaveBeenCalled();
  });

  it("creates a campaign, enrols valid participants, and renders the completion state", async () => {
    render(<CriticalThinkingPilot />);
    fireEvent.change(screen.getByLabelText("Pilot participant emails"), { target: { value: "alex@company.com\npriya@company.com" } });
    fireEvent.click(screen.getByRole("button", { name: /launch pilot/i }));
    expect(await screen.findByText("Your pilot cohort is ready to begin.")).toBeTruthy();
    await waitFor(() => expect(mocks.createCampaign).toHaveBeenCalledTimes(1));
    expect(mocks.addParticipant.mock.calls).toEqual([
      [{ campaignId: 44, email: "alex@company.com", participantRole: "Manager / senior individual contributor" }],
      [{ campaignId: 44, email: "priya@company.com", participantRole: "Manager / senior individual contributor" }],
    ]);
  });
});
