/**
 * ProductSwitcher
 *
 * Enrollment-gated platform switcher:
 * - Admin users: always see all platforms in the dropdown (bypass enrollment check)
 * - Non-admin with 2+ enrollments: see a dropdown filtered to their enrolled platforms only
 * - Non-admin with exactly 1 enrollment: see a static label — NO dropdown, no way to switch
 * - Non-admin with 0 enrollments: nothing rendered (edge case)
 *
 * This prevents clients from accidentally (or intentionally) roaming into platforms
 * they have not purchased.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronDown, Briefcase, Brain, Check, Loader2, Users, Rocket, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const PRODUCT_CONFIG: Record<string, {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  description: string;
  homeRoute: string;
}> = {
  leadership_intelligence: {
    label: "Leadership Intelligence",
    shortLabel: "Leadership",
    icon: Brain,
    color: "var(--color-ln-yellow)",
    description: "Lead with clarity and impact",
    homeRoute: "/leader",
  },
  career_intelligence: {
    label: "Career Transition Intelligence",
    shortLabel: "Career",
    icon: Briefcase,
    color: "#818cf8",
    description: "Own your career trajectory",
    homeRoute: "/career",
  },
  manager_effectiveness: {
    label: "Manager Effectiveness",
    shortLabel: "Manager",
    icon: Users,
    color: "#34d399",
    description: "Lead your team with impact",
    homeRoute: "/manager",
  },
  launch_intelligence: {
    label: "Launch Intelligence",
    shortLabel: "Launch",
    icon: Rocket,
    color: "#3B82F6",
    description: "Your career launch starts here",
    homeRoute: "/launch/home",
  },
  professional_effectiveness: {
    label: "Professional Effectiveness",
    shortLabel: "Professional",
    icon: Award,
    color: "#d4af37",
    description: "Elevate your professional impact",
    homeRoute: "/pe",
  },
};

// All known product IDs — used for admin override
const ALL_PRODUCT_IDS = Object.keys(PRODUCT_CONFIG);

export default function ProductSwitcher() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const utils = trpc.useUtils();
  const { data: activeProduct, refetch } = trpc.products.getActiveProduct.useQuery();
  const { data: enrolledProducts } = trpc.products.getEnrolledProducts.useQuery(undefined, {
    staleTime: 5_000,
    refetchOnWindowFocus: true,
  });

  const switchProduct = trpc.products.switchProduct.useMutation({
    onSuccess: (_data, variables) => {
      refetch();
      utils.products.getEnrolledProducts.invalidate();
      const config = PRODUCT_CONFIG[variables.productId];
      if (config) {
        toast.success(`Switched to ${config.label}`);
        navigate(config.homeRoute);
      }
      setOpen(false);
    },
    onError: () => toast.error("Could not switch product"),
  });

  const activeId = activeProduct?.productId ?? "leadership_intelligence";
  const activeConfig = PRODUCT_CONFIG[activeId];
  const ActiveIcon = activeConfig?.icon ?? Brain;

  // Determine which product IDs to show in the switcher
  const enrolledIds: string[] = enrolledProducts?.map((e: any) => e.enrollment.productId) ?? [];
  // Admins see all platforms; non-admins see only their enrolled platforms
  const visibleIds: string[] = isAdmin ? ALL_PRODUCT_IDS : enrolledIds;

  // ── Case 1: Nothing to show (0 enrolled, non-admin) ──────────────────────
  if (!isAdmin && enrolledIds.length === 0) return null;

  // ── Case 2: Single enrollment (non-admin) — static label, no dropdown ────
  if (!isAdmin && enrolledIds.length === 1) {
    return (
      <div className="px-3 pb-3">
        <div
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: "oklch(from white 15% 0 0 / 0.08)", border: "1px solid oklch(from white 15% 0 0 / 0.1)" }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `oklch(from ${activeConfig?.color ?? "var(--color-ln-yellow)"} l c h / 0.2)` }}
          >
            <ActiveIcon size={13} style={{ color: activeConfig?.color ?? "var(--color-ln-yellow)" }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold truncate text-white">{activeConfig?.shortLabel ?? "Product"}</p>
            <p className="text-[10px] truncate" style={{ color: "oklch(55% 0.02 248.6)" }}>
              {activeConfig?.description ?? ""}
            </p>
          </div>
          {/* No chevron — no dropdown */}
        </div>
      </div>
    );
  }

  // ── Case 3: Multiple products visible (multi-enrollment user or admin) ────
  return (
    <div className="relative px-3 pb-3">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
          "border hover:border-white/20",
          open ? "border-white/20" : "border-white/10"
        )}
        style={{ background: "oklch(from white 15% 0 0 / 0.08)" }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `oklch(from ${activeConfig?.color ?? "var(--color-ln-yellow)"} l c h / 0.2)` }}
        >
          <ActiveIcon size={13} style={{ color: activeConfig?.color ?? "var(--color-ln-yellow)" }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold truncate text-white">{activeConfig?.shortLabel ?? "Product"}</p>
          <p className="text-[10px] truncate" style={{ color: "oklch(55% 0.02 248.6)" }}>
            {activeConfig?.description ?? ""}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={cn("flex-shrink-0 transition-transform duration-200", open ? "rotate-180" : "")}
          style={{ color: "oklch(55% 0.02 248.6)" }}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div
            className="absolute left-3 right-3 z-50 rounded-xl overflow-hidden shadow-xl"
            style={{ top: "calc(100% + 4px)", background: "oklch(18% 0.04 248.6)", border: "1px solid oklch(30% 0.04 248.6)" }}
          >
            <div className="p-1">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-3 py-2"
                style={{ color: "oklch(45% 0.02 248.6)" }}
              >
                {isAdmin ? "All Platforms" : "Your Products"}
              </p>
              {visibleIds.map((productId: string) => {
                const config = PRODUCT_CONFIG[productId];
                if (!config) return null;
                const Icon = config.icon;
                const isActive = productId === activeId;
                const isSwitching = switchProduct.isPending && switchProduct.variables?.productId === productId;

                return (
                  <button
                    key={productId}
                    onClick={() => {
                      if (!isActive) switchProduct.mutate({ productId });
                      else setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100 hover:bg-white/8"
                    disabled={isSwitching}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `oklch(from ${config.color} l c h / 0.18)`,
                        border: `1px solid oklch(from ${config.color} l c h / 0.3)`,
                      }}
                    >
                      {isSwitching
                        ? <Loader2 size={13} className="animate-spin" style={{ color: config.color }} />
                        : <Icon size={13} style={{ color: config.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{config.label}</p>
                      <p className="text-[10px]" style={{ color: "oklch(50% 0.02 248.6)" }}>{config.description}</p>
                    </div>
                    {isActive && <Check size={13} style={{ color: config.color }} className="flex-shrink-0" />}
                  </button>
                );
              })}

              {/* Admin badge */}
              {isAdmin && (
                <div className="px-3 pt-1 pb-2">
                  <p className="text-[9px]" style={{ color: "oklch(40% 0.02 248.6)" }}>
                    Admin view — all platforms visible regardless of enrollment
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
