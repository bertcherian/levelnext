import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SalesPracticePanel recovery controls", () => {
  const source = readFileSync("client/src/components/SalesPracticePanel.tsx", "utf8");

  it("retries the action that failed rather than only reloading the session", () => {
    expect(source).toContain('if (retryAction === "start") return startPractice()');
    expect(source).toContain('if (retryAction === "send") return sendBuyerTurn()');
    expect(source).toContain('if (retryAction === "finish") return finishPractice()');
  });

  it("surfaces separate retry paths for scenario start, session load, buyer turn, and debrief", () => {
    expect(source).toContain('setRetryAction("start")');
    expect(source).toContain('setRetryAction("send")');
    expect(source).toContain('setRetryAction("finish")');
    expect(source).toContain("We could not load this rehearsal.");
  });
});
