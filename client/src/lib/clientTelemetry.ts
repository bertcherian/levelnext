export const CLIENT_TELEMETRY_EVENT = "levelnext-client-telemetry";

export type ClientTelemetryEvent = {
  eventType: "lazy_chunk_load_failure" | "render_failure";
  route: string;
};

export function safeTelemetryRoute(pathname: string) {
  const route = pathname.split("?")[0]?.trim() || "/";
  return route.startsWith("/") ? route.slice(0, 255) : "/";
}

export function isClientTelemetryEvent(value: unknown): value is ClientTelemetryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ClientTelemetryEvent>;
  return (event.eventType === "lazy_chunk_load_failure" || event.eventType === "render_failure")
    && typeof event.route === "string"
    && /^\/[A-Za-z0-9/_-]*$/.test(event.route);
}

/**
 * Emits only route-level, categorical error data. Error messages, query strings,
 * form values, and user-provided content are deliberately excluded.
 */
export function emitClientTelemetry(eventType: ClientTelemetryEvent["eventType"], pathname?: string) {
  if (typeof window === "undefined") return;
  const route = safeTelemetryRoute(pathname ?? window.location.pathname);
  const dedupeKey = `levelnext-client-telemetry:${eventType}:${route}`;
  try {
    if (window.sessionStorage.getItem(dedupeKey)) return;
    window.sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // If storage is unavailable, report the bounded event once in memory.
  }
  window.dispatchEvent(new CustomEvent<ClientTelemetryEvent>(CLIENT_TELEMETRY_EVENT, { detail: { eventType, route } }));
}
