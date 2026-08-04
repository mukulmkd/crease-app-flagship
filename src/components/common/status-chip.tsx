import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils";

const statusChipVariants = cva(
  "inline-flex h-8 w-fit items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
  {
    variants: {
      status: {
        success: "bg-success/15 text-success",
        warning: "bg-warning/25 text-warning-foreground",
        danger: "bg-secondary/15 text-secondary",
        info: "bg-info/15 text-info",
        pending: "bg-info/15 text-info",
        neutral: "bg-surface-container-highest text-muted-foreground",
        accent: "bg-primary-container/20 text-primary",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  },
);

type StatusChipProps = React.ComponentProps<"span"> &
  VariantProps<typeof statusChipVariants> & {
    dot?: boolean;
  };

/**
 * Stitch status chip — roles, availability, match events.
 */
function StatusChip({
  className,
  status = "neutral",
  dot = true,
  children,
  ...props
}: StatusChipProps) {
  return (
    <span
      data-slot="status-chip"
      data-status={status}
      className={cn(statusChipVariants({ status }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
        />
      ) : null}
      {children}
    </span>
  );
}

export { StatusChip };
export type { StatusChipProps };
