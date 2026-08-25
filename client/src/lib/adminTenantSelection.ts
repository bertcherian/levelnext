import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "levelnext-admin-active-tenant";
const CHANGE_EVENT = "levelnext-admin-tenant-change";

export function useAdminTenantSelection() {
  const [tenantId, setTenantIdState] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
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
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { tenantId, setTenantId };
}
