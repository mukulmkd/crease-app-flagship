import type { ReactNode } from "react";

import { BodySm, Title } from "@/components/common/typography";
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
      className={cn(
        "flex min-h-12 items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <Title>{title}</Title>
        {description ? <BodySm>{description}</BodySm> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };
