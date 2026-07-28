import * as React from "react";

import { cn } from "@/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "ease-emphasized flex min-h-28 w-full rounded-md border-0 border-b-2 border-transparent bg-surface-container-highest px-3 py-3 text-base text-foreground transition-all duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-surface-container-high focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive/5 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
