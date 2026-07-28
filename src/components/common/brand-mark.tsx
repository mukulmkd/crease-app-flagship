import Link from "next/link";

import { cn } from "@/utils";

type BrandMarkProps = {
  /** Show wordmark next to the mark */
  showWordmark?: boolean;
  /** Link to home (default) or render as a static mark */
  href?: string | null;
  className?: string;
  markClassName?: string;
};

/**
 * Crease brand lockup — Athletic Precision mark + wordmark.
 * Prefer this over ad-hoc “C” squares so chrome stays consistent.
 */
function BrandMark({
  showWordmark = true,
  href = "/home",
  className,
  markClassName,
}: BrandMarkProps) {
  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground",
          markClassName,
        )}
      >
        C
      </span>
      {showWordmark ? (
        <span className="text-sm font-bold tracking-wide text-foreground uppercase">
          Crease
        </span>
      ) : (
        <span className="sr-only">Crease</span>
      )}
    </>
  );

  if (href === null) {
    return (
      <span
        data-slot="brand-mark"
        className={cn("inline-flex items-center gap-2", className)}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-slot="brand-mark"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        className,
      )}
    >
      {content}
    </Link>
  );
}

export { BrandMark };
export type { BrandMarkProps };
