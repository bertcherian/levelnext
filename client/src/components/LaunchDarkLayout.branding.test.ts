import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Launch platform header branding", () => {
  it("uses a crisp text lockup and a cropped official emblem rather than scaling the full raster logo down", () => {
    const source = readFileSync("client/src/components/LaunchDarkLayout.tsx", "utf8");

    expect(source).toContain("function LaunchBrandMark()");
    expect(source).toContain('aria-label="LevelNext Launch Intelligence"');
    expect(source).toContain('height: 64');
    expect(source).toContain('className="launch-app-brand__mark"');
    expect(source).toContain('className="launch-app-brand__name"');
    expect(source).toContain('className="launch-app-brand__accent"');
  });
});
