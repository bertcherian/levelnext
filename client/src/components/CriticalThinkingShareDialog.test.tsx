// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CriticalThinkingShareDialog } from "./CriticalThinkingShareDialog";

afterEach(cleanup);
describe("CriticalThinkingShareDialog", () => {
  it("requires explicit consent before preparing a manager share", () => {
    const onShare = vi.fn().mockResolvedValue(undefined);
    render(<CriticalThinkingShareDialog open onOpenChange={vi.fn()} onShare={onShare} sharing={false} />);
    fireEvent.change(screen.getByLabelText("Manager’s work email"), { target: { value: "manager@company.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Prepare manager share" }));
    expect(onShare).not.toHaveBeenCalled();
    expect(screen.getByText("Confirm that you have chosen to share this private report.")).toBeTruthy();
  });
});
