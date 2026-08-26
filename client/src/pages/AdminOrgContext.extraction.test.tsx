// @vitest-environment jsdom
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  scrape: vi.fn(),
  scrapeSuccess: undefined as undefined | ((payload: any) => void),
}));

vi.mock("@/lib/adminTenantSelection", () => ({ useAdminTenantSelection: () => ({ tenantId: 42 }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    orgContext: {
      getOrgContext: { useQuery: () => ({ data: null, refetch: vi.fn(), isLoading: false }) },
      saveOrgContext: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      scrapeWebsite: { useMutation: (options: { onSuccess?: (payload: any) => void }) => { mocks.scrapeSuccess = options.onSuccess; return { mutate: mocks.scrape, isPending: false }; } },
      uploadLogo: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      saveLeadershipFrameworks: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import AdminOrgContext from "./AdminOrgContext";

afterEach(() => {
  mocks.scrape.mockReset();
  mocks.scrapeSuccess = undefined;
  document.body.innerHTML = "";
});

describe("Organisation Context website extraction", () => {
  it("normalises a Park Controls-style URL and populates the editable identity fields after a successful scrape", () => {
    render(<AdminOrgContext />);
    const website = screen.getByPlaceholderText("https://yourcompany.com");
    fireEvent.change(website, { target: { value: "www.parkcontrols.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Extract/i }));

    expect(mocks.scrape).toHaveBeenCalledWith({ url: "https://www.parkcontrols.com/", tenantId: 42 });

    act(() => mocks.scrapeSuccess?.({
      rawTextLength: 8000,
      extracted: {
        companyName: "Park Controls",
        mission: "Engineer reliable industrial controls.",
        vision: "Create safer, smarter operations.",
        northStar: "Trusted control partner",
        strategicGoals: ["Expand automation services"],
        values: ["Safety", "Reliability"],
      },
    }));

    expect((screen.getByPlaceholderText("e.g. Acme Corporation") as HTMLInputElement).value).toBe("Park Controls");
    expect((screen.getByPlaceholderText(/To empower every person/i) as HTMLTextAreaElement).value).toContain("Engineer reliable industrial controls.");
    expect((screen.getByPlaceholderText(/A world where every leader/i) as HTMLTextAreaElement).value).toContain("Create safer, smarter operations.");
    expect((screen.getByPlaceholderText(/Become the most trusted/i) as HTMLTextAreaElement).value).toContain("Trusted control partner");
    expect((screen.getByDisplayValue("Expand automation services") as HTMLInputElement).value).toBe("Expand automation services");
    expect((screen.getByDisplayValue("Safety") as HTMLInputElement).value).toBe("Safety");
  });
});
