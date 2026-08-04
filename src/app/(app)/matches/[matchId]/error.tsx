"use client";

import { RouteErrorState } from "@/components/feedback/route-error-state";
import type { RouteErrorStateProps } from "@/components/feedback/route-error-state";

export default function MatchDetailError({
  error,
  reset,
}: Pick<RouteErrorStateProps, "error" | "reset">) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Could not open this match"
      description="The match details failed to load. Check your connection and try again."
    />
  );
}
