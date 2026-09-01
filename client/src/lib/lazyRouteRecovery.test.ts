import { describe, expect, it } from "vitest";
import {
  isLazyRouteLoadError,
  lazyRouteRecoveryKey,
  shouldRecoverLazyRoute,
} from "./lazyRouteRecovery";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("lazy route recovery", () => {
  it("recognises browser dynamic-import and webpack chunk-load failures", () => {
    expect(isLazyRouteLoadError(new Error("Failed to fetch dynamically imported module: /assets/AdminDashboard.js"))).toBe(true);
    expect(isLazyRouteLoadError(new Error("Loading chunk 42 failed."))).toBe(true);
    expect(isLazyRouteLoadError(new Error("Importing a module script failed."))).toBe(true);
    expect(isLazyRouteLoadError(new Error("Admin metrics request failed"))).toBe(false);
  });

  it("permits exactly one refresh attempt for the Manager Diagnostics route", () => {
    const storage = createStorage();
    const error = new Error("Failed to fetch dynamically imported module");

    expect(shouldRecoverLazyRoute(error, "manager-diagnostics", storage)).toBe(true);
    expect(storage.getItem(lazyRouteRecoveryKey("manager-diagnostics"))).toBe("attempted");
    expect(shouldRecoverLazyRoute(error, "manager-diagnostics", storage)).toBe(false);
  });
});
