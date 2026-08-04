"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { BodySm } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";
import { useNotificationsUi } from "@/features/notifications/providers/notifications-ui-provider";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { useMyMembership } from "@/features/team/hooks";
import type { Notification } from "@/types/models";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";

function NotificationsSheet() {
  const router = useRouter();
  const { open, setOpen } = useNotificationsUi();
  const listQuery = useNotifications();
  const membershipQuery = useMyMembership();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = listQuery.data?.items ?? [];
  const hasUnread = items.some((item) => !item.readAt);

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Alerts
          </BottomSheetTitle>
          <BottomSheetDescription>
            Match, poll, payment, and fund notifications
          </BottomSheetDescription>
        </BottomSheetHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 pb-6">
          {hasUnread ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={markAllRead.isPending}
                onClick={async () => {
                  try {
                    await markAllRead.mutateAsync();
                    toast.success({ title: "All alerts marked read" });
                  } catch (error) {
                    toast.error({ title: getMutationErrorMessage(error) });
                  }
                }}
              >
                Mark all read
              </Button>
            </div>
          ) : null}
          {listQuery.isLoading ? (
            <LoadingState label="Loading alerts" />
          ) : listQuery.isError ? (
            <ErrorState
              title="Could not load alerts"
              onRetry={() => void listQuery.refetch()}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="You’re all caught up"
              description="New alerts will land here. Lock-screen push is on by default after you Allow once — turn it off in Settings anytime."
            />
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  canManageFund={hasPermission(
                    membershipQuery.data?.role,
                    PERMISSIONS.FUND_EXPENSE_ADD,
                  )}
                  canManageSettlement={hasPermission(
                    membershipQuery.data?.role,
                    PERMISSIONS.SETTLEMENT_MANAGE,
                  )}
                  onOpen={(href) => {
                    if (!n.readAt) markRead.mutate(String(n.id));
                    if (!href) return;
                    setOpen(false);
                    router.push(href);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function NotificationRow({
  notification,
  canManageFund,
  canManageSettlement,
  onOpen,
}: {
  notification: Notification;
  canManageFund: boolean;
  canManageSettlement: boolean;
  onOpen: (href: string | null) => void;
}) {
  const href = notificationHref(
    notification,
    canManageFund,
    canManageSettlement,
  );

  return (
    <li>
      <button
        type="button"
        className={
          notification.readAt
            ? "flex w-full items-center gap-3 rounded-xl bg-surface-container px-4 py-3 text-left transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            : "flex w-full items-center gap-3 rounded-xl border-l-2 border-primary bg-surface-container-low px-4 py-3 text-left transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        }
        onClick={() => onOpen(href)}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            {notification.title}
          </span>
          <BodySm className="mt-0.5 text-muted-foreground">
            {notification.body}
          </BodySm>
          <span className="mt-1 block text-xs text-muted-foreground">
            {formatRelativeTimestamp(notification.createdAt)}
          </span>
        </span>
        {href ? (
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </button>
    </li>
  );
}

function notificationHref(
  notification: Notification,
  canManageFund: boolean,
  canManageSettlement: boolean,
): string | null {
  const data = notification.data;
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  if (typeof data.matchId === "string" && data.matchId) {
    return `/matches/${encodeURIComponent(data.matchId)}`;
  }
  if (
    canManageSettlement &&
    typeof data.settlementId === "string" &&
    data.settlementId
  ) {
    return `/payments/${encodeURIComponent(data.settlementId)}`;
  }
  if (notification.type === "payment") {
    return "/payments";
  }
  if (
    canManageFund &&
    ((typeof data.askId === "string" && data.askId) ||
      notification.type === "fund")
  ) {
    return "/expenses";
  }
  return null;
}

function formatRelativeTimestamp(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return iso;

  const elapsedSeconds = Math.round((timestamp - Date.now()) / 1_000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(elapsedSeconds) >= seconds) {
      return formatter.format(Math.round(elapsedSeconds / seconds), unit);
    }
  }
  return formatter.format(elapsedSeconds, "second");
}

export { NotificationsSheet };
