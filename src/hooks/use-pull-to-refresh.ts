"use client";

import type { TouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_THRESHOLD = 72;
const MAX_PULL = 120;

type UsePullToRefreshOptions = {
  onRefresh: () => void | Promise<void>;
  /** Disable when a full-page loader is showing, etc. */
  disabled?: boolean;
  /** Pixels of pull required to trigger refresh */
  threshold?: number;
};

type UsePullToRefreshResult = {
  /** Current pull distance in px (for indicator UI) */
  pullDistance: number;
  refreshing: boolean;
  /** Bind to the scrollable / gesture surface */
  bind: {
    onTouchStart: (event: TouchEvent) => void;
    onTouchMove: (event: TouchEvent) => void;
    onTouchEnd: () => void;
  };
};

/**
 * Mobile pull-to-refresh when the page is scrolled to the top.
 * Works with document scroll (App Shell) — no overflow container required.
 */
function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = DEFAULT_THRESHOLD,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const updatePull = useCallback((value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  }, []);

  const reset = useCallback(() => {
    pulling.current = false;
    updatePull(0);
  }, [updatePull]);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      if (disabled || refreshing) return;
      if (typeof window !== "undefined" && window.scrollY > 0) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      pulling.current = true;
    },
    [disabled, refreshing],
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!pulling.current || disabled || refreshing) return;
      if (typeof window !== "undefined" && window.scrollY > 0) {
        reset();
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startY.current;
      if (delta <= 0) {
        updatePull(0);
        return;
      }

      // Resistive pull — feels native without fighting scroll.
      updatePull(Math.min(MAX_PULL, delta * 0.45));
    },
    [disabled, refreshing, reset, updatePull],
  );

  const onTouchEnd = useCallback(() => {
    if (!pulling.current || disabled) {
      reset();
      return;
    }

    const shouldRefresh = pullDistanceRef.current >= threshold && !refreshing;
    if (!shouldRefresh) {
      reset();
      return;
    }

    setRefreshing(true);
    updatePull(threshold * 0.6);

    void Promise.resolve(onRefreshRef.current())
      .catch(() => {
        /* caller surfaces errors */
      })
      .finally(() => {
        setRefreshing(false);
        reset();
      });
  }, [disabled, refreshing, reset, threshold, updatePull]);

  return {
    pullDistance,
    refreshing,
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}

export { usePullToRefresh };
export type { UsePullToRefreshOptions, UsePullToRefreshResult };
