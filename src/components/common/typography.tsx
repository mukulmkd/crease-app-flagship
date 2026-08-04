import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/utils";
import { typography } from "@/constants/design-tokens";

function Display({ className, ...props }: ComponentPropsWithoutRef<"h1">) {
  return <h1 className={cn(typography.display, className)} {...props} />;
}

function Headline({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn(typography.headline, className)} {...props} />;
}

function Title({ className, ...props }: ComponentPropsWithoutRef<"h1">) {
  return <h1 className={cn(typography.title, className)} {...props} />;
}

function Stat({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn(typography.statValue, className)} {...props} />;
}

function Label({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cn(typography.label, className)} {...props} />;
}

function Overline({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn(typography.overline, className)} {...props} />;
}

function Caption({ className, ...props }: ComponentPropsWithoutRef<"p">) {
  return <p className={cn(typography.caption, className)} {...props} />;
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

export {
  Display,
  Headline,
  Title,
  Stat,
  Label,
  Overline,
  Caption,
  Body,
  BodySm,
};
