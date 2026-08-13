import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Launch Home mission interactions", () => {
  const source = readFileSync("client/src/pages/launch/LaunchHome.tsx", "utf8");
  const styles = readFileSync("client/src/index.css", "utf8");

  it("exposes a manual refresh control while retaining completed work", () => {
    expect(source).toContain("refreshToday.useMutation");
    expect(source).toContain("Refresh pending missions");
    expect(source).toContain("refreshMissions.isPending || allDone");
  });

  it("adds accessible thumbs-up and thumbs-down relevance feedback", () => {
    expect(source).toContain('aria-label="This mission is relevant"');
    expect(source).toContain('aria-label="This mission is not relevant"');
    expect(source).toContain("rateMission.useMutation");
  });

  it("uses a dedicated reduced-motion-safe skeleton rather than blank loading space", () => {
    expect(source).toContain("MissionCardSkeleton");
    expect(styles).toContain(".launch-brutal-app .launch-mission-skeleton");
    expect(styles).toContain("@keyframes launch-mission-shimmer");
  });
});
