// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Home, Settings } from "lucide-react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoleNavigationByRole, RoleNavigationSection } from "./PlatformLayout";

describe("RoleNavigationSection", () => {
  afterEach(cleanup);

  it("renders role items, marks the active target, and invokes the mobile close callback", () => {
    const onNavigate = vi.fn();
    render(
      <ul>
        <RoleNavigationSection
          label="Admin"
          items={[
            { label: "Admin Dashboard", icon: Home, href: "/admin" },
            { label: "Settings", icon: Settings, href: "/settings" },
          ]}
          isNavActive={(href) => href === "/admin"}
          compact={false}
          onNavigate={onNavigate}
        />
      </ul>,
    );

    const activeLabel = screen.getByText("Admin Dashboard");
    expect(screen.getByText("Admin")).toBeTruthy();
    expect(activeLabel.parentElement?.className).toContain("text-ln-yellow");

    fireEvent.click(activeLabel);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders only the permitted role projection and preserves its active target", () => {
    const adminView = render(<ul><RoleNavigationByRole role="admin" isNavActive={(href) => href === "/admin"} compact /></ul>);
    expect(screen.getByText("Admin")).toBeTruthy();
    expect(screen.getByText("Admin Dashboard").parentElement?.className).toContain("text-ln-yellow");
    expect(screen.queryByText("Call Queue")).toBeNull();
    adminView.unmount();

    render(<ul><RoleNavigationByRole role="success_partner" isNavActive={(href) => href === "/admin/momentum"} compact /></ul>);
    expect(screen.getByText("Success Partner")).toBeTruthy();
    expect(screen.getByText("Call Queue").parentElement?.className).toContain("text-ln-yellow");
    expect(screen.queryByText("Admin Dashboard")).toBeNull();
  });
});
