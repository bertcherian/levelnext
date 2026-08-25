import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "levelnext-admin-active-tenant";
const CHANGE_EVENT = "levelnext-admin-tenant-change";

export function getTenantScopedAdminHref(path: string, tenantId: number | null) {
  if (!tenantId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}tenant=${tenantId}`;
}

export function useAdminTenantSelection() {
  const [tenantId, setTenantIdState] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = Number(new URLSearchParams(window.location.search).get("tenant"));
    if (Number.isInteger(fromUrl) && fromUrl > 0) return fromUrl;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });

  useEffect(() => {
    const onChange = () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : NaN;
      setTenantIdState(Number.isInteger(parsed) && parsed > 0 ? parsed : null);
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const setTenantId = useCallback((next: number | null) => {
    if (next) window.localStorage.setItem(STORAGE_KEY, String(next));
    else window.localStorage.removeItem(STORAGE_KEY);
    setTenantIdState(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("tenant", String(next));
    else url.searchParams.delete("tenant");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { tenantId, setTenantId };
}
