import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type QueryErrorStateProps = {
  title?: string;
  message?: string;
  onRetry: () => void;
  compact?: boolean;
};

export default function QueryErrorState({
  title = "We couldn't load this section",
  message = "There was a temporary problem loading your data. Try again.",
  onRetry,
  compact = false,
}: QueryErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10" : "min-h-[280px] py-16"}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle size={21} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-[var(--color-ln-navy)]">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}>
        <RefreshCw size={14} /> Try again
      </Button>
    </div>
  );
}

export function LaunchQueryErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.14)", color: "#F87171" }}>
        <AlertCircle size={21} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-white">Launch data could not be loaded</h2>
      <p className="mt-1 max-w-md text-sm" style={{ color: "var(--ld-text-muted)" }}>Your session is fine, but this section did not respond. Try again.</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "var(--ld-cyan)", color: "#07111f" }}>
        <RefreshCw size={14} /> Try again
      </button>
    </div>
  );
}
