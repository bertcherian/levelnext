// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const listRecentMock = vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
const captureMock = vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false });

vi.mock("@/lib/trpc", () => ({
  trpc: {
    v3Situation: {
      listRecent: { useQuery: () => listRecentMock() },
      capture: { useMutation: () => captureMock() },
    },
  },
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/manager/today", vi.fn()],
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import V3Today from "./V3Today";

afterEach(cleanup);

describe("V3 Today entry page", () => {
  it("renders the situation question, text input, and intent choices", () => {
    render(<V3Today />);
    expect(screen.getByRole("heading", { name: "What are you dealing with today?" })).not.toBeNull();
    expect(screen.getByLabelText("Describe your workplace situation")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Talk it through/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Find my next move/i })).not.toBeNull();
  });
});
