"use client";

import { RouteErrorState } from "@/components/feedback/route-error-state";
import type { RouteErrorStateProps } from "@/components/feedback/route-error-state";

export default function MatchesError({
  error,
  reset,
}: Pick<RouteErrorStateProps, "error" | "reset">) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Could not open matches"
      description="The fixtures screen failed to load. Check your connection and try again."
    />
  );
}
