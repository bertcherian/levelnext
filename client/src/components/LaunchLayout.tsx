/**
 * Backward-compatible Launch layout adapter.
 * Existing feature pages retain their import while inheriting the unified dark shell.
 */
import LaunchDarkLayout from "@/components/LaunchDarkLayout";

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return <LaunchDarkLayout>{children}</LaunchDarkLayout>;
}
