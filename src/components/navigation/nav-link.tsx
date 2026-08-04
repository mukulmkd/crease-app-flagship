"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/constants/navigation";
import { cn } from "@/utils";

type NavLinkProps = {
  item: NavItem;
  collapsed?: boolean;
  className?: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Shared presentational nav link — active state from pathname only.
 */
function NavLink({ item, collapsed = false, className }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/nav-link ease-emphasized flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        collapsed ? "size-12 justify-center" : "h-12 px-3",
        active
          ? "text-primary"
          : "text-muted-foreground hover:bg-surface-container hover:text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
          active && "bg-tertiary text-tertiary-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {collapsed ? <span className="sr-only">{item.label}</span> : null}
    </Link>
  );
}

export { NavLink, isActivePath };
export type { NavLinkProps };
