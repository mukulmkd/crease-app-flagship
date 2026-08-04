import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/utils";

function MetricRail({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="metric-rail"
      className={cn("grid grid-cols-3 gap-2", className)}
      {...props}
    />
  );
}

export { MetricRail };
