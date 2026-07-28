import type { ReactNode } from "react";

import { cn } from "@/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className={cn("flex items-start justify-between gap-4", className)}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="text-title font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };
