"use client";

import Link from "next/link";

import { NotificationBell } from "@/components/navigation/notification-bell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { typography } from "@/constants/design-tokens";
import { cn } from "@/utils";

type AppHeaderProps = {
  title?: string;
  notificationCount?: number;
  className?: string;
};

/**
 * Desktop header — page title + chrome actions. Branding lives in the sidebar.
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
        "safe-top sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-outline-variant/30 bg-surface-container-low px-6 py-3 lg:flex",
        className,
      )}
    >
      <div className="min-w-0">
        <p className={cn(typography.overline, "text-muted-foreground")}>
          Overview
        </p>
        <p className={cn(typography.title, "truncate")}>{title}</p>
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
