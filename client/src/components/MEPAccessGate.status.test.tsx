// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ loading: true, isAuthenticated: false }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => authState }));

import MEPAccessGate from "./MEPAccessGate";

describe("MEP access transition feedback", () => {
  it("shows an accessible secure-access status while the mobile session is resolving", () => {
    render(<MEPAccessGate><div>Protected manager workspace</div></MEPAccessGate>);
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Checking your secure access…");
    expect(status.textContent).toContain("Secure LevelNext access");
  });
});
