"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";

type RouteErrorStateProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
};

function RouteErrorState({
  error,
  reset,
  title,
  description,
}: RouteErrorStateProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title={title}
      description={description}
      onRetry={reset}
      className="min-h-64"
    />
  );
}

export { RouteErrorState };
export type { RouteErrorStateProps };
