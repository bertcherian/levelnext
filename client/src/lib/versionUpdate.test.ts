import { describe, expect, it } from "vitest";
import { getMainModuleSignature, isNewBuildAvailable } from "./versionUpdate";

describe("deployment version detection", () => {
  it("extracts the built application entry from a published HTML shell", () => {
    const html = '<!doctype html><html><head><script type="module" crossorigin src="/assets/index-current.js"></script></head></html>';
    expect(getMainModuleSignature(html)).toBe("/assets/index-current.js");
  });

  it("only signals an update when the published entry differs from the current build", () => {
    expect(isNewBuildAvailable("/assets/index-current.js", "/assets/index-next.js")).toBe(true);
    expect(isNewBuildAvailable("/assets/index-current.js", "/assets/index-current.js")).toBe(false);
    expect(isNewBuildAvailable(null, "/assets/index-next.js")).toBe(false);
  });
});
