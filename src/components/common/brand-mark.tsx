import Link from "next/link";
import Image from "next/image";

import appIcon from "../../../public/icons/icon-192.png";

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
 * Crease brand lockup — official cricket-operations artwork + Oswald wordmark.
 * Team identity is shown separately in the centered top-bar logo.
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
          "relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-clubhouse",
          markClassName,
        )}
      >
        <Image
          src={appIcon}
          alt=""
          className="size-full rounded-[inherit] object-cover"
          priority
        />
      </span>
      {showWordmark ? (
        <span
          data-brand-wordmark
          className="font-heading text-xl font-semibold tracking-[0.04em] text-primary"
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
      aria-label="Crease home"
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
