// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: 1, name: "Bert", email: "bert@example.com", role: "admin" },
  loading: false,
  isAuthenticated: true,
  logout: vi.fn(),
}));
const locationState = vi.hoisted(() => ({ value: "/admin" }));

vi.mock("wouter", () => ({
  Link: ({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) => <a href={href} onClick={onClick}>{children}</a>,
  useLocation: () => [locationState.value, vi.fn()],
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/components/ProductSwitcher", () => ({ default: () => <div>Product switcher</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: { logout: { useMutation: () => ({ mutate: vi.fn() }) } },
    report: { myReports: { useQuery: () => ({ data: [] }) } },
    products: { getActiveProduct: { useQuery: () => ({ data: { productId: "leadership_intelligence" } }) } },
    unlock: { getStatus: { useQuery: () => ({ data: [] }) } },
    tenant: { myTenant: { useQuery: () => ({ data: { role: "owner" } }) } },
  },
}));

import PlatformLayout from "./PlatformLayout";

describe("PlatformLayout role navigation wiring", () => {
  afterEach(cleanup);

  it("renders admin navigation in the real mobile drawer, applies active state, and closes after selection", () => {
    authState.user = { id: 1, name: "Bert", email: "bert@example.com", role: "admin" };
    locationState.value = "/admin";
    render(<PlatformLayout><div>Page</div></PlatformLayout>);

    const drawer = document.querySelector("aside.fixed") as HTMLElement;
    expect(drawer).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Open menu"));
    const adminItem = within(drawer).getByText("Admin Dashboard");
    expect(adminItem.parentElement?.className).toContain("text-ln-yellow");

    fireEvent.click(adminItem);
    expect(drawer.className).toContain("-translate-x-full");
  });

  it("renders only Success Partner navigation for the Success Partner role", () => {
    authState.user = { id: 2, name: "Partner", email: "partner@example.com", role: "success_partner" };
    locationState.value = "/admin/momentum";
    render(<PlatformLayout><div>Page</div></PlatformLayout>);

    fireEvent.click(screen.getByLabelText("Open menu"));
    const drawer = document.querySelector("aside.fixed") as HTMLElement;
    expect(within(drawer).getByText("Success Partner")).toBeTruthy();
    expect(within(drawer).getByText("Call Queue").parentElement?.className).toContain("text-ln-yellow");
    expect(within(drawer).queryByText("Admin Dashboard")).toBeNull();
  });
});
