"use client";

import { useRef, type KeyboardEvent } from "react";
import { Loader2, type LucideIcon } from "lucide-react";

import { cn } from "@/utils";

type MatchPollOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
};

type MatchPollControlProps<T extends string> = {
  "aria-label": string;
  options: readonly MatchPollOption<T>[];
  value?: T | null;
  onValueChange: (value: T) => void;
  variant?: "compact" | "full";
  loading?: boolean;
  className?: string;
};

/**
 * Exclusive match-vote control shared by dashboard tickets and match details.
 * Arrow keys follow native radio-group behavior and keep one roving tab stop.
 */
function MatchPollControl<T extends string>({
  options,
  value,
  onValueChange,
  variant = "full",
  loading = false,
  className,
  "aria-label": ariaLabel,
}: MatchPollControlProps<T>) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const firstEnabledIndex = options.findIndex((option) => !option.disabled);

  function moveSelection(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!direction) return;

    event.preventDefault();
    let nextIndex = currentIndex;
    for (let attempts = 0; attempts < options.length; attempts += 1) {
      nextIndex = (nextIndex + direction + options.length) % options.length;
      const option = options[nextIndex];
      if (option && !option.disabled) {
        itemRefs.current[nextIndex]?.focus();
        onValueChange(option.value);
        return;
      }
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn(
        variant === "compact"
          ? "grid grid-cols-2 gap-2"
          : "inline-flex min-h-12 w-full items-center rounded-xl bg-surface-container-high p-1",
        className,
      )}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        const Icon = option.icon;
        const disabled = option.disabled || loading;
        return (
          <button
            key={option.value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-busy={loading || undefined}
            disabled={disabled}
            tabIndex={
              active || (selectedIndex < 0 && index === firstEnabledIndex)
                ? 0
                : -1
            }
            className={cn(
              "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-45",
              variant === "compact"
                ? active
                  ? "bg-tertiary text-tertiary-foreground focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-clubhouse"
                  : "bg-white/10 text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-clubhouse"
                : active
                  ? "bg-tertiary text-tertiary-foreground shadow-sm focus-visible:ring-3 focus-visible:ring-ring/40"
                  : "text-muted-foreground hover:bg-surface-container-highest/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
            )}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => moveSelection(event, index)}
          >
            {loading && active ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : Icon ? (
              <Icon className="size-3.5" aria-hidden />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { MatchPollControl };
export type { MatchPollControlProps, MatchPollOption };
