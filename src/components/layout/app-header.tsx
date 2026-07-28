"use client";

import Link from "next/link";

import { BrandMark } from "@/components/common/brand-mark";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { cn } from "@/utils";

type AppHeaderProps = {
  title?: string;
  notificationCount?: number;
  className?: string;
};

/**
 * Desktop header — brand lockup + page title + chrome actions.
 */
function AppHeader({
  title = "Crease",
  notificationCount = 0,
  className,
}: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className={cn(
        "safe-top sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-outline-variant/30 bg-surface-container-low/95 px-6 py-3 backdrop-blur-sm supports-backdrop-filter:bg-surface-container-low/85 lg:flex",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <BrandMark className="shrink-0" />
        <div className="min-w-0 border-l border-outline-variant/40 pl-4">
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Overview
          </p>
          <p className="truncate text-title font-semibold tracking-tight">
            {title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/home"
          className="mr-2 hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground xl:inline"
        >
          Home
        </Link>
        <ThemeToggle />
        <NotificationBell count={notificationCount} />
        <ProfileMenu />
      </div>
    </header>
  );
}

export { AppHeader };
export type { AppHeaderProps };
