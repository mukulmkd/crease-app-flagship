import * as React from "react";

import { cn } from "@/utils";

/**
 * Modern Cricket Club field — tactile tonal surface with a clear focus ring.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ease-emphasized h-12 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-base text-foreground transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/10 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
