"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PULL_THRESHOLD_PX = 72;
const PULL_MAX_PX = 112;
const RESISTANCE = 0.42;

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<unknown>;
  /** When false, gestures are ignored (desktop / sheets open). */
  enabled?: boolean;
};

type UsePullToRefreshResult = {
  pullDistance: number;
  refreshing: boolean;
  armed: boolean;
};

/**
 * Document-level pull-to-refresh for mobile PWAs.
 * Activates only at the top of the page scroll.
 */
function usePullToRefresh({
  onRefresh,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const reset = useCallback(() => {
    startYRef.current = null;
    pullingRef.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const isBlocked = () => {
      if (refreshingRef.current) return true;
      if (typeof window === "undefined") return true;
      if (window.scrollY > 1) return true;
      // Sheets / dialogs own the gesture surface.
      if (
        document.querySelector(
          '[data-slot="bottom-sheet-content"][data-state="open"], [role="dialog"][data-state="open"]',
        )
      ) {
        return true;
      }
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable)
      ) {
        return true;
      }
      return false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isBlocked() || event.touches.length !== 1) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      pullingRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startYRef.current == null || event.touches.length !== 1) return;
      if (isBlocked() && !pullingRef.current) {
        reset();
        return;
      }

      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        if (pullingRef.current) reset();
        return;
      }

      pullingRef.current = true;
      // Custom rubber-band — avoid fighting browser overscroll.
      if (event.cancelable) event.preventDefault();
      const resisted = Math.min(PULL_MAX_PX, delta * RESISTANCE);
      pullDistanceRef.current = resisted;
      setPullDistance(resisted);
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) {
        reset();
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD_PX;
      if (!shouldRefresh) {
        reset();
        return;
      }

      refreshingRef.current = true;
      setRefreshing(true);
      pullDistanceRef.current = PULL_THRESHOLD_PX;
      setPullDistance(PULL_THRESHOLD_PX);

      void Promise.resolve(onRefreshRef.current())
        .catch(() => {
          // Keep UI quiet — screens already surface query errors.
        })
        .finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          reset();
        });
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", reset);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", reset);
    };
  }, [enabled, reset]);

  return {
    pullDistance,
    refreshing,
    armed: pullDistance >= PULL_THRESHOLD_PX || refreshing,
  };
}

export { usePullToRefresh, PULL_THRESHOLD_PX };
export type { UsePullToRefreshOptions, UsePullToRefreshResult };
