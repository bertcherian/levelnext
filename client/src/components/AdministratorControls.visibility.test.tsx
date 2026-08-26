// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  user: { id: 1, name: "Bert", email: "bert@example.com", role: "admin" as string },
}));
const locationState = vi.hoisted(() => ({ value: "/manager" }));

vi.mock("wouter", () => ({
  Link: ({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) => <a href={href} onClick={onClick}>{children}</a>,
  useLocation: () => [locationState.value, vi.fn()],
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: { logout: { useMutation: () => ({ mutate: vi.fn() }) } },
    products: { switchProduct: { useMutation: () => ({ mutate: vi.fn() }) } },
    launchProgress: { getProgress: { useQuery: () => ({ data: null }) } },
    launchUserPreferences: { getPreferences: { useQuery: () => ({ data: null }) } },
  },
}));

import MEPLayout from "./MEPLayout";
import PELayout from "./PELayout";
import EarlyCareerLayout from "./EarlyCareerLayout";
import { CareerAccessLayout } from "./CareerAccessLayout";
import LaunchDarkLayout from "./LaunchDarkLayout";

const shells = [
  { name: "Manager Effectiveness", render: () => <MEPLayout><div>Manager page</div></MEPLayout>, path: "/manager" },
  { name: "Professional Effectiveness", render: () => <PELayout><div>PE page</div></PELayout>, path: "/pe" },
  { name: "Early Career", render: () => <EarlyCareerLayout><div>Early page</div></EarlyCareerLayout>, path: "/early-career" },
  { name: "Career Access", render: () => <CareerAccessLayout><div>Career page</div></CareerAccessLayout>, path: "/career-access" },
  { name: "Launch", render: () => <LaunchDarkLayout><div>Launch page</div></LaunchDarkLayout>, path: "/launch/home" },
];

describe("dedicated platform administrator controls", () => {
  afterEach(cleanup);

  it("renders the shared controls in every dedicated shell for global administrators", () => {
    authState.user = { id: 1, name: "Bert", email: "bert@example.com", role: "admin" };
    for (const shell of shells) {
      locationState.value = shell.path;
      const view = render(shell.render());
      expect(view.getAllByText("Admin Dashboard").length, shell.name).toBeGreaterThan(0);
      view.unmount();
    }
  });

  it("does not render the shared administrator controls for participants in any dedicated shell", () => {
    authState.user = { id: 2, name: "Participant", email: "participant@example.com", role: "user" };
    for (const shell of shells) {
      locationState.value = shell.path;
      const view = render(shell.render());
      expect(view.queryByText("Admin Dashboard"), shell.name).toBeNull();
      view.unmount();
    }
  });

  it("shows the signed-in identity and current access level in the MEP sidebar", () => {
    authState.user = { id: 1, name: "Bert Cherian", email: "bert@example.com", role: "admin" };
    locationState.value = "/manager";
    const administratorView = render(<MEPLayout><div>Manager page</div></MEPLayout>);
    expect(administratorView.getAllByText("Bert Cherian").length).toBeGreaterThan(0);
    expect(administratorView.getAllByText("Administrator access").length).toBeGreaterThan(0);
    administratorView.unmount();

    authState.user = { id: 2, name: "Casey Manager", email: "casey@example.com", role: "user" };
    const memberView = render(<MEPLayout><div>Manager page</div></MEPLayout>);
    expect(memberView.getAllByText("Casey Manager").length).toBeGreaterThan(0);
    expect(memberView.getAllByText("Member access").length).toBeGreaterThan(0);
  });
});
