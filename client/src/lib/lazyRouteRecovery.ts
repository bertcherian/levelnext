import { lazy, type ComponentType } from "react";

type LazyModule<T extends ComponentType<any>> = { default: T };
type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

const RECOVERY_PREFIX = "levelnext-lazy-route-recovery:";

/**
 * A newly deployed app shell can momentarily request a JavaScript chunk from a
 * prior deployment. A full page reload obtains the matching build manifest.
 */
export function isLazyRouteLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return [
    /Loading chunk/i,
    /Failed to fetch dynamically imported module/i,
    /Importing a module script failed/i,
  ].some((pattern) => pattern.test(message));
}

export function lazyRouteRecoveryKey(routeKey: string) {
  return `${RECOVERY_PREFIX}${routeKey}`;
}

export function shouldRecoverLazyRoute(
  error: unknown,
  routeKey: string,
  storage: StorageLike,
) {
  if (!isLazyRouteLoadError(error)) return false;
  const key = lazyRouteRecoveryKey(routeKey);
  if (storage.getItem(key)) return false;
  storage.setItem(key, "attempted");
  return true;
}

function getSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Retries a stale deployment-chunk failure once by reloading the document. The
 * recovery marker is cleared only after the requested module loads successfully,
 * preventing a reload loop if the route has a genuine code error.
 */
export function lazyWithRouteRecovery<T extends ComponentType<any>>(
  factory: () => Promise<LazyModule<T>>,
  routeKey: string,
) {
  return lazy(async () => {
    try {
      const module = await factory();
      getSessionStorage()?.removeItem(lazyRouteRecoveryKey(routeKey));
      return module;
    } catch (error) {
      const storage = getSessionStorage();
      if (storage && shouldRecoverLazyRoute(error, routeKey, storage)) {
        window.location.reload();
        return new Promise<LazyModule<T>>(() => undefined);
      }
      throw error;
    }
  });
}
