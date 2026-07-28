import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

type LoadingCardProps = {
  className?: string;
  lines?: number;
};

function LoadingCard({ className, lines = 3 }: LoadingCardProps) {
  return (
    <div
      data-slot="loading-card"
      role="status"
      aria-label="Loading card"
      className={cn("rounded-xl bg-surface-container-low p-4", className)}
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            className={cn("h-3 w-full", index === lines - 1 && "w-2/3")}
          />
        ))}
      </div>
    </div>
  );
}

export { LoadingCard };
export type { LoadingCardProps };
