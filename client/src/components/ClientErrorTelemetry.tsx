import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { CLIENT_TELEMETRY_EVENT, isClientTelemetryEvent } from "@/lib/clientTelemetry";

/** Persists only bounded, route-level load-failure categories for signed-in users. */
export default function ClientErrorTelemetry() {
  const record = trpc.clientTelemetry.record.useMutation();

  useEffect(() => {
    const handleTelemetry = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!isClientTelemetryEvent(detail)) return;
      record.mutate(detail);
    };
    window.addEventListener(CLIENT_TELEMETRY_EVENT, handleTelemetry);
    return () => window.removeEventListener(CLIENT_TELEMETRY_EVENT, handleTelemetry);
  }, [record]);

  return null;
}
