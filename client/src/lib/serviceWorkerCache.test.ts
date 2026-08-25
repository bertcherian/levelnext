import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

describe("service worker authentication release safety", () => {
  it("uses a new cache version and refreshes JavaScript and CSS from the network", () => {
    expect(serviceWorker).toContain("const CACHE_NAME = 'levelnext-v3'");
    expect(serviceWorker).toContain("fetch(request)");
    expect(serviceWorker).toContain("Cached code remains an offline");
  });
});
