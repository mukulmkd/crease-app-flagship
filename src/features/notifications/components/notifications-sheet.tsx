"use client";

import { BodySm } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";
import { useNotificationsUi } from "@/features/notifications/providers/notifications-ui-provider";

function NotificationsSheet() {
  const { open, setOpen } = useNotificationsUi();
  const listQuery = useNotifications();
  const markRead = useMarkNotificationRead();

  const items = listQuery.data?.items ?? [];

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
            Alerts
          </BottomSheetTitle>
          <BottomSheetDescription>
            Match, poll, payment, and fund notifications
          </BottomSheetDescription>
        </BottomSheetHeader>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 pb-6">
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
              description="New alerts will land here. Enable push in Settings for lock-screen alerts."
            />
          ) : (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={
                      n.readAt
                        ? "flex w-full flex-col rounded-xl bg-surface-container px-4 py-3 text-left"
                        : "flex w-full flex-col rounded-xl border-l-2 border-primary bg-surface-container-low px-4 py-3 text-left"
                    }
                    onClick={() => {
                      if (!n.readAt) void markRead.mutateAsync(n.id);
                    }}
                  >
                    <span className="text-sm font-semibold">{n.title}</span>
                    <BodySm className="mt-0.5 text-muted-foreground">
                      {n.body}
                    </BodySm>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { NotificationsSheet };
