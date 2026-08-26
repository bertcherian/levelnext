// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import VersionUpdateBanner from "./VersionUpdateBanner";

describe("VersionUpdateBanner", () => {
  beforeEach(() => {
    document.head.innerHTML = '<script type="module" src="/assets/index-current.js"></script>';
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('<script type="module" src="/assets/index-next.js"></script>', { status: 200 })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("offers a controlled refresh when a newer deployment entry is detected", async () => {
    render(<VersionUpdateBanner />);
    fireEvent.focus(window);

    await waitFor(() => expect(screen.getByText("A new version is available")).toBeTruthy());
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss new version notice" }));
    expect(screen.queryByText("A new version is available")).toBeNull();
  });
});
