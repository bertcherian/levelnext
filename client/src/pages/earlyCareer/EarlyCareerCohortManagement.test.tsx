// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const createCohort = vi.hoisted(() => vi.fn());
const assignMember = vi.hoisted(() => vi.fn());
const intelligenceQuery = vi.hoisted(() => vi.fn());
const configQuery = vi.hoisted(() => vi.fn());
const managementQuery = vi.hoisted(() => vi.fn());
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ earlyCareer: { getCohortManagement: { invalidate: vi.fn() }, getManagerCompanion: { invalidate: vi.fn() } } }), earlyCareer: {
  getHRCohortIntelligence: { useQuery: () => intelligenceQuery() },
  getNudgeConfig: { useQuery: () => configQuery() }, saveNudgeConfig: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
  getCohortManagement: { useQuery: () => managementQuery() },
  createCohort: { useMutation: () => ({ mutate: createCohort, isPending: false }) }, assignCohortMember: { useMutation: () => ({ mutate: assignMember, isPending: false }) }, deleteCohort: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
} } }));
import EarlyCareerHR from "./EarlyCareerHR";
const refetch = vi.fn();
const intelligenceData = { data: { eligible: false, minimumCohortSize: 5, cohortSize: 1, privacyBoundary: "Aggregate only." }, isLoading: false, isError: false, refetch };
const managementData = { isLoading: false, isError: false, refetch, data: { canManageCohorts: true, tenantIds: [5], cohorts: [{ id: 21, tenantId: 5, name: "Engineering graduates", description: null, managerUserId: 9 }], employees: [{ employee: { id: 12, name: "Asha", email: "asha@example.com" }, profile: { tenantId: 5, cohortId: null, managerUserId: null, roleTitle: "Graduate engineer" } }], managers: [{ tenantId: 5, user: { id: 9, name: "Ravi", email: "ravi@example.com" } }] } };
beforeEach(() => { intelligenceQuery.mockReturnValue(intelligenceData); configQuery.mockReturnValue({ data: [], isLoading: false, isError: false, refetch }); managementQuery.mockReturnValue(managementData); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Early Career cohort management", () => {
  it("lets an authorised owner create a manager-led cohort and organise employee membership", () => {
    render(<EarlyCareerHR />);
    expect(screen.getByText("Create a cohort that reports to one manager.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Graduate engineering cohort"), { target: { value: "August graduates" } });
    fireEvent.change(screen.getByLabelText("Manager"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Create cohort" }));
    expect(createCohort).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 5, name: "August graduates", managerUserId: 9 }));
    fireEvent.change(screen.getAllByRole("combobox")[3], { target: { value: "21" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(assignMember).toHaveBeenCalledWith({ employeeUserId: 12, cohortId: 21 });
  });

  it("shows an explicit empty cohort state and retryable query failures", () => {
    managementQuery.mockReturnValue({ ...managementData, data: { ...managementData.data, cohorts: [] } });
    const { rerender } = render(<EarlyCareerHR />);
    expect(screen.getByText("No cohorts yet. Create one above, then organise its members.")).toBeTruthy();
    managementQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    rerender(<EarlyCareerHR />);
    expect(screen.getByText("Cohort administration could not load.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("does not disguise aggregate intelligence failures as access denials", () => {
    intelligenceQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    render(<EarlyCareerHR />);
    expect(screen.getByText("Organisation intelligence could not load.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });
});
