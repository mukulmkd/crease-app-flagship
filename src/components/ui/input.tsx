import * as React from "react";

import { cn } from "@/utils";

/**
 * Stitch filled M3-style field — 48px height, focus ring as bottom emphasis.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ease-emphasized h-12 w-full min-w-0 rounded-md border-0 border-b-2 border-transparent bg-surface-container-highest px-3 py-2 text-base text-foreground transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-surface-container-high focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive/5 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
