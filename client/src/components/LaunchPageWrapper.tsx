/**
 * Backward-compatible Launch page-wrapper adapter.
 * Multi-step journeys retain their existing layouts while inheriting the unified dark shell.
 */
import LaunchDarkLayout from "@/components/LaunchDarkLayout";

export default function LaunchPageWrapper({ children }: { children: React.ReactNode }) {
  return <LaunchDarkLayout>{children}</LaunchDarkLayout>;
}
