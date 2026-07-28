import type * as React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/utils";

type AppCardVariant = "default" | "hero" | "lowest";

type AppCardProps = React.ComponentProps<typeof Card> & {
  interactive?: boolean;
  /**
   * Tonal elevation variants (Athletic Precision):
   * - default: Level 1 surface-container-low
   * - hero: primary-tinted highlight for next-up / greeting surfaces
   * - lowest: white/lowest container for nested content
   */
  variant?: AppCardVariant;
};

const VARIANT_CLASS: Record<AppCardVariant, string> = {
  default: "bg-surface-container-low",
  hero: "bg-primary/8 dark:bg-primary/15",
  lowest: "bg-surface-container-lowest",
};

/**
 * Stitch tonal card surface — Level 1 elevation via color, not outline.
 */
function AppCard({
  className,
  interactive = false,
  variant = "default",
  ...props
}: AppCardProps) {
  return (
    <Card
      data-slot="app-card"
      data-variant={variant}
      className={cn(
        "rounded-xl border-0 shadow-none",
        VARIANT_CLASS[variant],
        interactive &&
          "ease-emphasized cursor-pointer transition-colors duration-200 hover:bg-surface-container active:bg-surface-container-high",
        className,
      )}
      {...props}
    />
  );
}

const AppCardHeader = CardHeader;
const AppCardTitle = CardTitle;
const AppCardDescription = CardDescription;
const AppCardAction = CardAction;
const AppCardContent = CardContent;
const AppCardFooter = CardFooter;

export {
  AppCard,
  AppCardHeader,
  AppCardTitle,
  AppCardDescription,
  AppCardAction,
  AppCardContent,
  AppCardFooter,
};
export type { AppCardProps, AppCardVariant };
