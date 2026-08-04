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
        "safe-top sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-outline-variant/50 bg-surface-container-lowest px-3 md:min-h-16 md:bg-background md:px-4",
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
          <span className="truncate font-heading text-xl font-semibold tracking-tight md:text-2xl">
            {title}
          </span>
        ) : (
          <span className="sr-only">{title || "Crease"}</span>
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
