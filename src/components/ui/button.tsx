import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";

import { cn } from "@/utils";

/**
 * Modern Scorebook Utility buttons.
 * Filled / Outlined / Tonal — 48px touch targets.
 */
const buttonVariants = cva(
  "group/button ease-emphasized inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        tonal:
          "bg-surface-container-high text-primary hover:bg-surface-container-highest",
        outline:
          "border-primary bg-transparent text-primary hover:bg-primary/5",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-container",
        ghost: "text-foreground hover:bg-surface-container-high",
        urgency:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 min-h-12 px-5",
        sm: "h-10 min-h-10 gap-1.5 rounded-lg px-3.5 text-[0.8125rem]",
        lg: "h-14 min-h-14 rounded-lg px-6 text-base",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner and disables the control while an action runs. */
    loading?: boolean;
  }) {
  const sharedProps = {
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    className: cn(buttonVariants({ variant, size, className })),
    ...props,
  };

  // Slot accepts exactly one element child, so asChild never gets a spinner.
  if (asChild) {
    return (
      <Slot.Root {...sharedProps} aria-disabled={disabled || undefined}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      {...sharedProps}
      data-loading={loading ? "" : undefined}
      disabled={Boolean(disabled || loading)}
      aria-busy={loading || undefined}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
