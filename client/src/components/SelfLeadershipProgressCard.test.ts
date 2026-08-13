import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Self-Leadership dashboard progress", () => {
  const source = readFileSync("client/src/components/SelfLeadershipProgressCard.tsx", "utf8");
  it("renders all private guided-mirror dimensions without presenting a personality score", () => {
    expect(source).toContain("getSelfLeadershipProgress.useQuery");
    expect(source).toContain("Your six behavioural dimensions");
    expect(source).toContain("not a personality score");
    expect(source).toContain("experiment");
  });
});
