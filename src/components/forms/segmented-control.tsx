"use client";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils";

const segmentedControlVariants = cva(
  "inline-flex w-full items-center rounded-xl bg-surface-container p-1",
  {
    variants: {
      size: {
        default: "h-12",
        sm: "h-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const segmentedItemVariants = cva(
  "ease-emphasized inline-flex flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-10",
        sm: "h-8 text-xs",
      },
      active: {
        true: "bg-surface-container-lowest text-primary shadow-sm",
        false: "text-muted-foreground hover:text-foreground",
      },
    },
    defaultVariants: {
      size: "default",
      active: false,
    },
  },
);

type SegmentOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SegmentedControlProps<T extends string> = VariantProps<
  typeof segmentedControlVariants
> & {
  options: SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
};

/**
 * Stitch exclusive choice control — 48px track, tonal active state.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  size = "default",
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      data-slot="segmented-control"
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(segmentedControlVariants({ size }), className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={option.disabled}
            className={cn(segmentedItemVariants({ size, active: isActive }))}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl, segmentedControlVariants };
export type { SegmentedControlProps, SegmentOption };
