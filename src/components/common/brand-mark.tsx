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
 * Crease brand lockup — scorebook crease mark + condensed wordmark.
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
          "relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#082417] text-primary-foreground",
          markClassName,
        )}
      >
        <span className="h-5 w-5 border-x-2 border-b-2 border-[#c9f64b]">
          <span className="mx-auto block h-full w-px bg-[#c9f64b]" />
        </span>
      </span>
      {showWordmark ? (
        <span
          data-brand-wordmark
          className="font-heading text-xl font-extrabold tracking-[0.06em] text-primary uppercase"
        >
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
