"use client";

import { BrandMark } from "@/components/common/brand-mark";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { cn } from "@/utils";

type TopAppBarProps = {
  title?: string;
  notificationCount?: number;
  className?: string;
};

/**
 * Top app bar — brand lockup + page title + chrome actions.
 * Modern Cricket Club: compact scorebook chrome with persistent brand.
 */
function TopAppBar({
  title = "Crease",
  notificationCount = 0,
  className,
}: TopAppBarProps) {
  const showTitle = Boolean(title) && title !== "Crease" && title !== "Home";

  return (
    <header
      data-slot="top-app-bar"
      className={cn(
        "safe-top sticky top-0 z-30 flex min-h-14 items-center gap-2 bg-surface-container-lowest px-3 md:min-h-16 md:border-b md:border-outline-variant md:bg-background md:px-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <BrandMark
          showWordmark={!showTitle}
          className="shrink-0 [&_[data-brand-wordmark]]:text-base"
          markClassName="size-7 rounded-md [&>span]:scale-75 md:size-10 md:rounded-lg md:[&>span]:scale-100"
        />
        {showTitle ? (
          <h1 className="truncate font-heading text-xl font-bold tracking-tight uppercase md:text-2xl">
            {title}
          </h1>
        ) : (
          <h1 className="sr-only">{title || "Crease"}</h1>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <ProfileMenu className="h-10 px-1 md:h-12 md:px-2" />
        <NotificationBell count={notificationCount} />
      </div>
    </header>
  );
}

export { TopAppBar };
export type { TopAppBarProps };
