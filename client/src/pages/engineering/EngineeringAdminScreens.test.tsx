// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigate = vi.fn();
const invalidate = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 99, name: "Platform Admin", role: "admin" }, isAuthenticated: true, loading: false }) }));
vi.mock("@/components/PlatformLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ useLocation: () => ["/engineering/admin/provisioning", navigate] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ engineeringAdmin: { provisioningOverview: { invalidate }, promptEvaluationDashboard: { invalidate } } }),
    engineeringAdmin: {
      provisioningOverview: { useQuery: () => ({ data: { organisations: [{ id: 1, name: "Meta Results", industry: "Consulting" }], assignments: [] }, isLoading: false }) },
      listTenantMembers: { useQuery: () => ({ data: [{ id: 1, name: "Bert Cherian", email: "bert@example.com", platformRole: "admin", membershipRole: "admin" }, { id: 2, name: "Pilot Participant", email: "pilot@example.com", platformRole: "user", membershipRole: "member" }], isLoading: false }) },
      assignPartner: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
      updateAssignmentStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      promptEvaluationDashboard: { useQuery: () => ({ data: { versions: [{ id: 7, agentCode: "self_leadership_intelligence", versionLabel: "self-leadership-v1", modelId: "claude-sonnet-4-6", promptHash: "abc", status: "candidate", runs: [{ id: 1, caseCode: "privacy_boundary", status: "passed", score: 96, failureReasons: [], createdAt: new Date() }], summary: { total: 1, passed: 1, failed: 0, blocked: 0, passRate: 100, releaseGate: "eligible" } }] }, isLoading: false }) },
      createPromptVersion: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      recordEvaluationRun: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import EngineeringAdminProvisioning from "./EngineeringAdminProvisioning";
import EngineeringPromptEvaluation from "./EngineeringPromptEvaluation";

afterEach(() => cleanup());

describe("Engineering admin screens", () => {
  it("renders tenant provisioning controls and the Partner privacy boundary", () => {
    render(<EngineeringAdminProvisioning />);

    expect(screen.getByRole("heading", { name: "Admin Provisioning" })).toBeTruthy();
    expect(screen.getByText(/does not expose private reflections or diagnostic responses/i)).toBeTruthy();
    expect(screen.getByText("Create assignment")).toBeTruthy();
    expect(screen.getByText("Assignment history")).toBeTruthy();
  });

  it("renders per-version prompt evidence and release-gate status", () => {
    render(<EngineeringPromptEvaluation />);

    expect(screen.getByRole("heading", { name: "Prompt Evaluation Evidence" })).toBeTruthy();
    expect(screen.getByText("self-leadership-v1")).toBeTruthy();
    expect(screen.getByText("privacy_boundary")).toBeTruthy();
    expect(screen.getByText("eligible")).toBeTruthy();
  });
});
