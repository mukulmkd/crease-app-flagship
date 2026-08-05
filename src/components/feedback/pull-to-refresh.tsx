"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  PULL_THRESHOLD_PX,
  usePullToRefresh,
} from "@/hooks/use-pull-to-refresh";
import { cn } from "@/utils";

type PullToRefreshProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Mobile PWA pull-to-refresh — refetches active TanStack Query observers.
 * Disabled on fine-pointer / wide layouts so desktop scroll stays normal.
 */
function PullToRefresh({ children, className }: PullToRefreshProps) {
  const queryClient = useQueryClient();
  const [mobileEnabled, setMobileEnabled] = useState(false);

  useEffect(() => {
    // Match bottom-nav mobile shell; touch events keep desktop mice inert.
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobileEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const onRefresh = useCallback(async () => {
    await queryClient.refetchQueries({ type: "active" });
  }, [queryClient]);

  const { pullDistance, refreshing, armed } = usePullToRefresh({
    onRefresh,
    enabled: mobileEnabled,
  });

  const indicatorHeight =
    !mobileEnabled || (!refreshing && pullDistance <= 0)
      ? 0
      : refreshing
        ? PULL_THRESHOLD_PX
        : Math.round(pullDistance);

  return (
    <div data-slot="pull-to-refresh" className={cn("relative", className)}>
      <div
        aria-live="polite"
        aria-busy={refreshing}
        className={cn(
          "pointer-events-none flex items-center justify-center overflow-hidden md:hidden",
          "motion-reduce:transition-none",
          !refreshing && "transition-[height] duration-150 ease-out",
        )}
        style={{ height: indicatorHeight }}
      >
        {indicatorHeight > 8 ? (
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full bg-surface-container-high text-primary",
              armed && "bg-tertiary text-tertiary-foreground",
            )}
          >
            <Loader2
              className={cn(
                "size-4",
                (refreshing || armed) &&
                  "animate-spin motion-reduce:animate-none",
              )}
              aria-hidden
            />
            <span className="sr-only">
              {refreshing ? "Refreshing" : "Pull to refresh"}
            </span>
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export { PullToRefresh };
export type { PullToRefreshProps };
