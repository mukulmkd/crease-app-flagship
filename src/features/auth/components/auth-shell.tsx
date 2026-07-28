"use client";

import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type AuthShellProps = {
  children: ReactNode;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  showHelp?: boolean;
  className?: string;
};

/**
 * Unauthenticated chrome — Stitch auth screens (no app shell nav).
 */
function AuthShell({
  children,
  showBack = false,
  backHref = "/login",
  title,
  showHelp = false,
  className,
}: AuthShellProps) {
  return (
    <div
      data-slot="auth-shell"
      className={cn(
        "relative flex min-h-dvh flex-col bg-background",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-48 before:bg-[radial-gradient(ellipse_at_top_right,oklch(0.92_0.04_145)_0%,transparent_55%)]",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-40 after:bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.94_0.03_25)_0%,transparent_50%)]",
        className,
      )}
    >
      <header className="safe-top relative z-10 flex h-14 items-center gap-2 px-4">
        {showBack ? (
          <Button asChild variant="ghost" size="icon" aria-label="Go back">
            <Link href={backHref}>
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            C
          </span>
        )}

        <p className="flex-1 text-center text-base font-bold text-primary">
          {title ?? "Crease"}
        </p>

        {showHelp ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Help"
            disabled
          >
            <HelpCircle aria-hidden />
          </Button>
        ) : (
          <span className="size-12" aria-hidden />
        )}
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8">
        {children}
      </div>
    </div>
  );
}

export { AuthShell };
export type { AuthShellProps };
