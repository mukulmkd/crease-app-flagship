"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/utils";

type PullToRefreshProps = {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  /** Accessible status announced while refreshing */
  refreshingLabel?: string;
};

/**
 * Touch pull-to-refresh wrapper for PWA / mobile scroll surfaces.
 */
function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  className,
  refreshingLabel = "Refreshing",
}: PullToRefreshProps) {
  const { pullDistance, refreshing, bind } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  const visible = pullDistance > 8 || refreshing;

  return (
    <div
      data-slot="pull-to-refresh"
      className={cn("relative touch-pan-y", className)}
      {...bind}
    >
      <div
        aria-live="polite"
        aria-busy={refreshing}
        className="pointer-events-none flex items-end justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{
          height: visible ? Math.max(pullDistance, refreshing ? 48 : 0) : 0,
        }}
      >
        <div
          className={cn(
            "mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary shadow-sm",
            refreshing && "animate-pulse",
          )}
        >
          <Loader2
            className={cn(
              "size-5",
              (refreshing || pullDistance > 48) && "animate-spin",
            )}
            aria-hidden
          />
          <span className="sr-only">
            {refreshing ? refreshingLabel : "Pull to refresh"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

export { PullToRefresh };
export type { PullToRefreshProps };
