import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";
import { ReactNode } from "react";

// ── Base skeleton primitives ──────────────────────────────────────────────────

export function SkeletonBar({ className, width }: { className?: string; width?: string }) {
  return (
    <div
      className={cn("rounded-md bg-muted animate-pulse", className)}
      style={width ? { width } : undefined}
    />
  );
}

export function SkeletonCircle({ className, size = 48 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn("rounded-full bg-muted animate-pulse", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 rounded-xl border border-border bg-card space-y-3", className)}>
      <SkeletonBar className="h-4" width="40%" />
      <SkeletonBar className="h-3" width="80%" />
      <SkeletonBar className="h-3" width="65%" />
      <div className="flex gap-2 pt-2">
        <SkeletonBar className="h-6 w-16 rounded-full" />
        <SkeletonBar className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ── LLM Processing Skeleton ───────────────────────────────────────────────────

interface LLMProcessingSkeletonProps {
  title?: string;
  subtitle?: string;
  steps?: string[];
  className?: string;
}

/**
 * A visually engaging skeleton loader for LLM-heavy endpoints.
 * Shows an animated spinner with contextual messaging and optional
 * step-by-step progress indicators.
 */
export function LLMProcessingSkeleton({
  title = "Generating your report…",
  subtitle = "Our AI is analysing your responses to create personalised insights.",
  steps,
  className,
}: LLMProcessingSkeletonProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 min-h-[400px]", className)}>
      {/* Animated icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary/60 animate-pulse" />
      </div>

      {/* Title and subtitle */}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{subtitle}</p>

      {/* Optional steps */}
      {steps && steps.length > 0 && (
        <div className="w-full max-w-md space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-primary/30">
                <div
                  className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                  style={{ animationDelay: `${i * 300}ms` }}
                />
              </div>
              <SkeletonBar className="h-3 flex-1" />
            </div>
          ))}
        </div>
      )}

      {/* Shimmer bar */}
      <div className="w-full max-w-xs mt-6 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-primary/40 animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

// ── Report Skeleton ────────────────────────────────────────────────────────────

/**
 * A skeleton that mimics a diagnostic report layout with radar chart placeholder,
 * dimension scores, and insight sections.
 */
export function ReportSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBar className="h-6" width="200px" />
          <SkeletonBar className="h-4" width="120px" />
        </div>
        <SkeletonCircle size={56} />
      </div>

      {/* Radar chart placeholder + score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-center p-8 rounded-xl border border-border bg-card">
          <SkeletonCircle size={160} />
        </div>
        <div className="space-y-4">
          <SkeletonBar className="h-8" width="60%" />
          <SkeletonBar className="h-4" width="80%" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBar className="h-3 w-24" />
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-muted-foreground/30 animate-pulse"
                    style={{ width: `${30 + i * 15}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// ── Inline Loading Wrapper ────────────────────────────────────────────────────

interface LoadingWrapperProps {
  isLoading: boolean;
  children: ReactNode;
  skeleton?: ReactNode;
  fallback?: "llm" | "report" | "card";
  title?: string;
  subtitle?: string;
}

/**
 * Wraps content with a skeleton loader while data is being fetched/processed.
 *
 * Usage:
 *   <LoadingWrapper isLoading={mutation.isPending} fallback="llm" title="Generating…">
 *     <ReportContent data={mutation.data} />
 *   </LoadingWrapper>
 */
export function LoadingWrapper({
  isLoading,
  children,
  skeleton,
  fallback = "card",
  title,
  subtitle,
}: LoadingWrapperProps) {
  if (!isLoading) return <>{children}</>;

  if (skeleton) return <>{skeleton}</>;

  switch (fallback) {
    case "llm":
      return <LLMProcessingSkeleton title={title} subtitle={subtitle} />;
    case "report":
      return <ReportSkeleton />;
    case "card":
    default:
      return (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
  }
}
