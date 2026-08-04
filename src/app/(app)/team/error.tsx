"use client";

import { RouteErrorState } from "@/components/feedback/route-error-state";
import type { RouteErrorStateProps } from "@/components/feedback/route-error-state";

export default function TeamError({
  error,
  reset,
}: Pick<RouteErrorStateProps, "error" | "reset">) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Could not open the team"
      description="The squad list failed to load. Check your connection and try again."
    />
  );
}
