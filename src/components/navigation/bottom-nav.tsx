"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath } from "@/components/navigation/nav-link";
import { typography } from "@/constants/design-tokens";
import { primaryNav } from "@/constants/navigation";
import { cn } from "@/utils";

type BottomNavProps = {
  className?: string;
};

/**
 * Mobile bottom navigation — Athletic Precision tonal active state.
 * Icons use a primary-container pill when selected; labels use caption scale.
 */
function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const items = primaryNav.filter((item) => item.mobile);

  return (
    <nav
      data-slot="bottom-nav"
      aria-label="Primary"
      className={cn(
        "safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface-container/95 backdrop-blur-sm supports-backdrop-filter:bg-surface-container/90 md:hidden",
        className,
      )}
    >
      <ul className="flex items-stretch justify-around px-1 pt-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "ease-emphasized touch-target flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 transition-colors duration-200",
                  typography.navLabel,
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-colors duration-200",
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { BottomNav };
export type { BottomNavProps };
