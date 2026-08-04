"use client";

import { RouteErrorState } from "@/components/feedback/route-error-state";
import type { RouteErrorStateProps } from "@/components/feedback/route-error-state";

export default function SettingsError({
  error,
  reset,
}: Pick<RouteErrorStateProps, "error" | "reset">) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Could not open settings"
      description="Your saved preferences were not changed. Try loading settings again."
    />
  );
}
