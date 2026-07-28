import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/utils";
import { typography } from "@/constants/design-tokens";

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

function Text<T extends ElementType = "p">({
  as,
  className,
  ...props
}: PolymorphicProps<T>) {
  const Comp = as ?? "p";
  return <Comp className={cn(typography.body, className)} {...props} />;
}

function Display({ className, ...props }: ComponentPropsWithoutRef<"h1">) {
  return <h1 className={cn(typography.display, className)} {...props} />;
}

function Title({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn(typography.title, className)} {...props} />;
}

function Heading({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn(typography.headline, className)} {...props} />;
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

function Caption({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(typography.caption, "text-muted-foreground", className)}
      {...props}
    />
  );
}

function Overline({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(typography.overline, "text-muted-foreground", className)}
      {...props}
    />
  );
}

function LabelText({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cn(typography.label, className)} {...props} />;
}

export {
  Display,
  Title,
  Heading,
  Body,
  BodySm,
  Caption,
  Overline,
  LabelText,
  Text,
};
