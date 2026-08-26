// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ user: { name: "Bert Cherian", role: "admin" } }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    mep: {
      getMyResults: { useQuery: () => ({ data: [] }) },
      listPlaybookSessions: { useQuery: () => ({ data: [] }) },
      listCommitments: { useQuery: () => ({ data: [] }) },
      listPracticeSessions: { useQuery: () => ({ data: [] }) },
      getTodayBriefSnapshot: { useQuery: () => ({ data: undefined, refetch: vi.fn() }) },
      getDailyBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    tenant: { myTenant: { useQuery: () => ({ data: null }) } },
    aiSuggestionFeedback: {
      listMine: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) },
      getMyFeedbackAnalytics: { useQuery: () => ({ data: { trend: [], distribution: { total: 0, helpful: 0, unhelpful: 0, malformed: 0 } }, isLoading: false, isError: false, refetch: vi.fn() }) },
      submit: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
vi.mock("wouter", () => ({ Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import ManagerHome from "./ManagerHome";

afterEach(cleanup);

describe("Manager dashboard Admin workspace shortcut", () => {
  it("renders the Admin workspace shortcut only for platform administrators", () => {
    authState.user = { name: "Bert Cherian", role: "admin" };
    const administratorView = render(<ManagerHome />);
    expect(screen.getByRole("link", { name: "Open Admin workspace" }).getAttribute("href")).toBe("/admin");
    administratorView.unmount();

    authState.user = { name: "Casey Manager", role: "user" };
    render(<ManagerHome />);
    expect(screen.queryByRole("link", { name: "Open Admin workspace" })).toBeNull();
  });
});
