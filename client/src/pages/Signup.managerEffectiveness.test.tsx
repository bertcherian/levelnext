// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const mutate = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc", () => ({
  trpc: {
    emailAuth: {
      requestMagicLink: {
        useMutation: () => ({ mutate, isPending: false }),
      },
    },
  },
}));

import Signup from "./Signup";

describe("Manager Effectiveness sign-up", () => {
  beforeEach(() => {
    mutate.mockReset();
    window.history.replaceState({}, "", "/signup?platform=mep");
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/signup");
  });

  it("requests a magic link with Manager Effectiveness as the destination", () => {
    render(<Signup />);

    fireEvent.change(screen.getByPlaceholderText("Priya Sharma"), { target: { value: "Bert Cherian" } });
    fireEvent.change(screen.getByPlaceholderText("you@company.com"), { target: { value: "bert@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Broadridge"), { target: { value: "Broadridge" } });
    fireEvent.change(screen.getByPlaceholderText("98765 43210"), { target: { value: "98765 43210" } });
    fireEvent.click(screen.getByRole("button", { name: /get started free/i }));

    expect(mutate).toHaveBeenCalledWith({
      email: "bert@example.com",
      name: "Bert Cherian",
      organisation: "Broadridge",
      whatsappNumber: "+919876543210",
      origin: window.location.origin,
      returnTo: "/manager",
    });
  });
});
