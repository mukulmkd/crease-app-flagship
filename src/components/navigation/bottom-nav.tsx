"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath } from "@/components/navigation/nav-link";
import { typography } from "@/constants/design-tokens";
import { hasPermission } from "@/constants/domain/team-permissions";
import { primaryNav, secondaryNav } from "@/constants/navigation";
import { useMyMembership } from "@/features/team/hooks";
import { cn } from "@/utils";

type BottomNavProps = {
  className?: string;
};

/**
 * Mobile bottom navigation — restrained lime active state.
 */
function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const membership = useMyMembership();
  const role = membership.data?.role;
  const items = [...primaryNav, ...secondaryNav].filter(
    (item) =>
      item.mobile && (!item.permission || hasPermission(role, item.permission)),
  );

  return (
    <nav
      data-slot="bottom-nav"
      aria-label="Primary"
      className={cn(
        "safe-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest md:hidden",
        className,
      )}
    >
      {/* Fixed row height keeps the bar in sync with --bottom-nav-height. */}
      <ul className="flex h-16 items-stretch justify-around px-1">
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
                  "ease-emphasized touch-target flex h-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-colors duration-200",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span
                  className={cn(
                    typography.navLabel,
                    "block max-w-full overflow-hidden text-[0.6rem] leading-3 text-ellipsis whitespace-nowrap",
                  )}
                >
                  {item.mobileLabel ?? item.label}
                </span>
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
