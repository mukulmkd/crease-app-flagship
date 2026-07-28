import { Loader2 } from "lucide-react";

import { cn } from "@/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
    </span>
  );
}

export { Spinner };
export type { SpinnerProps };
