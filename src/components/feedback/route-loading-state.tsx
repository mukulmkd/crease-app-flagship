import { LoadingState } from "@/components/feedback/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

type RouteLoadingStateProps = {
  label: string;
  detail?: boolean;
};

function RouteLoadingState({ label, detail = false }: RouteLoadingStateProps) {
  return (
    <div className="space-y-6" aria-label={label}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {detail ? (
        <>
          <Skeleton className="h-56 w-full rounded-2xl" />
          <LoadingState variant="cards" label={label} />
        </>
      ) : (
        <LoadingState variant="cards" label={label} />
      )}
    </div>
  );
}

export { RouteLoadingState };
