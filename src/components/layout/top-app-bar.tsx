"use client";

import { Menu } from "lucide-react";

import { BrandMark } from "@/components/common/brand-mark";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { ThemeToggle } from "@/components/navigation/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type TopAppBarProps = {
  title?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  notificationCount?: number;
  className?: string;
};

/**
 * Top app bar — brand lockup + page title + chrome actions.
 * Stitch Athletic Precision: brand stays visible on mobile, not only page title.
 */
function TopAppBar({
  title = "Crease",
  onMenuClick,
  showMenuButton = false,
  notificationCount = 0,
  className,
}: TopAppBarProps) {
  const showTitle = Boolean(title) && title !== "Crease" && title !== "Home";

  return (
    <header
      data-slot="top-app-bar"
      className={cn(
        "safe-top sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-outline-variant/40 bg-background/95 px-3 backdrop-blur-sm supports-backdrop-filter:bg-background/80 md:px-4",
        className,
      )}
    >
      {showMenuButton ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu aria-hidden />
        </Button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <BrandMark showWordmark={!showTitle} className="shrink-0" />
        {showTitle ? (
          <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
            {title}
          </h1>
        ) : (
          <h1 className="sr-only">{title || "Crease"}</h1>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <ThemeToggle />
        <NotificationBell count={notificationCount} />
        <ProfileMenu />
      </div>
    </header>
  );
}

export { TopAppBar };
export type { TopAppBarProps };
