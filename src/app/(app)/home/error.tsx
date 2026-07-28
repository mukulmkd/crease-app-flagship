"use client";

import { ErrorState } from "@/components/feedback";

export default function HomeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      description="Could not load home."
      onRetry={reset}
    />
  );
}
