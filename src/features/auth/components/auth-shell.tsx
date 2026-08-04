"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/common/brand-mark";
import { cn } from "@/utils";

type AuthShellProps = {
  children: ReactNode;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  className?: string;
};

/**
 * Unauthenticated Modern Scorebook Utility chrome (no app navigation).
 */
function AuthShell({
  children,
  showBack = false,
  backHref = "/login",
  title,
  className,
}: AuthShellProps) {
  return (
    <div
      data-slot="auth-shell"
      className={cn(
        "relative flex min-h-dvh flex-col bg-background",
        className,
      )}
    >
      <header className="safe-top relative z-10 flex h-14 items-center gap-2 border-b border-outline-variant/40 px-4">
        {showBack ? (
          <Button asChild variant="ghost" size="icon" aria-label="Go back">
            <Link href={backHref}>
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
        ) : null}

        <BrandMark
          href={null}
          className={showBack ? "flex-1 justify-center" : "flex-1"}
          markClassName="size-9"
        />
        <span className="sr-only">{title ?? "Crease"}</span>

        <span className="size-12" aria-hidden />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-4 pb-8">
        {children}
      </main>
    </div>
  );
}

export { AuthShell };
export type { AuthShellProps };
