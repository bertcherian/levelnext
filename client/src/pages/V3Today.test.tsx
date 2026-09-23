// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

afterEach(() => {
  delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
});

describe("V3 Today entry page", () => {
  it("renders the situation question, text input, and intent choices", () => {
    render(<V3Today />);
    expect(screen.getByRole("heading", { name: "What are you dealing with today?" })).not.toBeNull();
    expect(screen.getByLabelText("Describe your workplace situation")).not.toBeNull();
    expect(screen.getByRole("button", { name: /Talk it through/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Find my next move/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Use voice input" })).not.toBeNull();
  });

  it("explains when browser voice input is unavailable", async () => {
    render(<V3Today />);
    await waitFor(() => expect(screen.getByText(/Voice input is not available in this browser/i)).not.toBeNull());
    expect(screen.getByRole("button", { name: "Use voice input" })).toHaveProperty("disabled", true);
  });

  it("inserts a completed browser transcript into the situation input", async () => {
    class FakeSpeechRecognition {
      static instance: FakeSpeechRecognition | null = null;
      continuous = false;
      interimResults = false;
      lang = "";
      onstart: (() => void) | null = null;
      onresult: ((event: { resultIndex: number; results: Array<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null = null;
      onerror: ((event: { error?: string }) => void) | null = null;
      onend: (() => void) | null = null;
      constructor() { FakeSpeechRecognition.instance = this; }
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: FakeSpeechRecognition });
    render(<V3Today />);
    const voiceButton = screen.getByRole("button", { name: "Use voice input" });
    await waitFor(() => expect(voiceButton).toHaveProperty("disabled", false));
    fireEvent.click(voiceButton);
    expect(screen.getByRole("status", { name: /Audio waveform: microphone is listening/i })).not.toBeNull();
    FakeSpeechRecognition.instance?.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "I need to reset expectations with my team" } }],
    });
    FakeSpeechRecognition.instance?.onend?.();
    await waitFor(() => expect((screen.getByLabelText("Describe your workplace situation") as HTMLTextAreaElement).value).toBe("I need to reset expectations with my team"));
    expect(screen.getByText(/Voice note added/i)).not.toBeNull();
  });
});
