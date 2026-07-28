import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

type LoadingStateProps = {
  variant?: "spinner" | "skeleton" | "cards";
  label?: string;
  className?: string;
};

function LoadingState({
  variant = "spinner",
  label = "Loading",
  className,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div
        data-slot="loading-state"
        role="status"
        aria-label={label}
        className={cn("space-y-3", className)}
      >
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div
        data-slot="loading-state"
        role="status"
        aria-label={label}
        className={cn("grid gap-3", className)}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div
      data-slot="loading-state"
      role="status"
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12",
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export { LoadingState };
export type { LoadingStateProps };
