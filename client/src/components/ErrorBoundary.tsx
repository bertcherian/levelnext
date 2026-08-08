import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw, ArrowLeft, Bug } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    this.setState({ errorInfo });
    // Log to console for debugging — in production this could be sent to an error tracking service
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isChunkLoadError =
        this.state.error?.name === "ChunkLoadError" ||
        /Loading chunk/.test(this.state.error?.message ?? "");

      return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-lg">
            {/* Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-2xl bg-destructive/20 rounded-full" />
              <AlertTriangle
                size={56}
                className="relative text-destructive"
              />
            </div>

            {/* Title and message */}
            <h1 className="text-2xl font-bold mb-2 text-foreground">
              {isChunkLoadError ? "Connection issue detected" : "Something went wrong"}
            </h1>
            <p className="text-muted-foreground text-center mb-8 max-w-sm">
              {isChunkLoadError
                ? "The page couldn't load properly. This is usually a temporary network issue. Reloading should fix it."
                : "An unexpected error occurred while rendering this page. Your data is safe. Try reloading or navigating back."}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mb-6">
              <button
                onClick={this.handleReload}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer",
                  "flex-1"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
              <button
                onClick={this.handleGoBack}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                  "border border-border bg-background text-foreground",
                  "hover:bg-muted active:scale-[0.97] transition-all cursor-pointer",
                  "flex-1"
                )}
              >
                <ArrowLeft size={16} />
                Go Back
              </button>
            </div>

            <button
              onClick={this.handleGoHome}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm",
                "text-muted-foreground hover:text-foreground",
                "transition-colors cursor-pointer mb-8"
              )}
            >
              <Home size={14} />
              Go to Home
            </button>

            {/* Error details (collapsible) */}
            <div className="w-full">
              <button
                onClick={this.toggleDetails}
                className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground",
                  "hover:text-foreground transition-colors cursor-pointer mb-2"
                )}
              >
                <Bug size={14} />
                {this.state.showDetails ? "Hide" : "Show"} error details
              </button>

              {this.state.showDetails && (
                <div className="p-4 w-full rounded-lg bg-muted overflow-auto max-h-64">
                  <pre className="text-xs text-muted-foreground whitespace-break-spaces font-mono">
                    {this.state.error?.message}
                    {"\n\n"}
                    {this.state.error?.stack}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {"\n\nComponent Stack:\n"}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
