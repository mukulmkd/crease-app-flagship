import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/** Centered empty state with an optional primary action. */
function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl bg-surface-container-low px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary-container/15">
        <Icon className="size-7 text-primary" aria-hidden />
      </div>
      <h3 className="text-title font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-body-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-6" type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
