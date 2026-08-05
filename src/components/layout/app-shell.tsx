"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { DesktopNav } from "@/components/navigation/desktop-nav";
import {
  useUnreadNotificationCount,
  useNotificationAlerts,
  useEnsureDefaultPush,
} from "@/features/notifications";
import { NotificationsSheet } from "@/features/notifications/components/notifications-sheet";
import { PushEnrollmentBanner } from "@/features/notifications/components/push-enrollment-banner";
import { NotificationsUiProvider } from "@/features/notifications/providers/notifications-ui-provider";
import { PullToRefresh } from "@/components/feedback/pull-to-refresh";
import { cn } from "@/utils";

const TITLE_BY_PATH: Record<string, string> = {
  "/home": "Home",
  "/matches": "Matches",
  "/team": "Team",
  "/profile": "Profile",
  "/payments": "Payments",
  "/expenses": "Expenses",
  "/settings": "Settings",
};

function resolveShellTitle(pathname: string, title?: string) {
  if (title) return title;
  if (pathname === "/matches/new") return "Create Match";
  if (pathname.startsWith("/matches/") && pathname !== "/matches") {
    return "Match";
  }
  if (pathname.startsWith("/team/") && pathname.endsWith("/members")) {
    return "Members";
  }
  if (pathname.startsWith("/team/") && pathname.endsWith("/settings")) {
    return "Settings";
  }
  if (pathname.startsWith("/team/") && pathname !== "/team") {
    return "Team";
  }
  return TITLE_BY_PATH[pathname] ?? "Crease";
}

type AppShellProps = {
  children: ReactNode;
  title?: string;
  /** Optional override — defaults to live unread count from the service. */
  notificationCount?: number;
  className?: string;
};

/**
 * Application chrome — responsive PWA shell.
 * Mobile: sticky top bar + bottom nav
 * Tablet: icon rail + sticky top bar + footer
 * Desktop: expanded sidebar + sticky header + footer
 */
function AppShell({
  children,
  title,
  notificationCount,
  className,
}: AppShellProps) {
  const pathname = usePathname();
  const unreadQuery = useUnreadNotificationCount();
  useNotificationAlerts();
  useEnsureDefaultPush();
  const resolvedCount = notificationCount ?? unreadQuery.data ?? 0;
  const resolvedTitle = resolveShellTitle(pathname, title);

  return (
    <NotificationsUiProvider>
      <div
        data-slot="app-shell"
        className={cn(
          "flex min-h-dvh bg-background text-foreground",
          className,
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        <div className="hidden md:flex lg:hidden">
          <DesktopNav collapsed />
        </div>
        <div className="hidden lg:flex">
          <DesktopNav collapsed={false} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopAppBar
            title={resolvedTitle}
            notificationCount={resolvedCount}
            className="lg:hidden"
          />
          <AppHeader title={resolvedTitle} notificationCount={resolvedCount} />

          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              "mx-auto w-full max-w-[var(--content-max-width)] flex-1 scroll-smooth px-4 py-4 outline-none",
              "pb-bottom-nav md:px-6 md:pb-6",
              pathname === "/home" && "max-w-md py-2 md:max-w-6xl md:py-6",
            )}
          >
            <PullToRefresh>{children}</PullToRefresh>
          </main>

          <AppFooter />
          <BottomNav />
        </div>
      </div>
      <PushEnrollmentBanner />
      <NotificationsSheet />
    </NotificationsUiProvider>
  );
}

export { AppShell };
export type { AppShellProps };
