import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/utils";
import { typography } from "@/constants/design-tokens";

function Title({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn(typography.title, className)} {...props} />;
}

function Body({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn(typography.body, className)} {...props} />;
}

function BodySm({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(typography.bodySm, "text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Title, Body, BodySm };
