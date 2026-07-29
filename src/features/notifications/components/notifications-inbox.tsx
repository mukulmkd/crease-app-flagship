"use client";

import { BodySm, Title } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks";

function NotificationsInbox() {
  const listQuery = useNotifications();
  const markRead = useMarkNotificationRead();

  if (listQuery.isLoading) {
    return <LoadingState label="Loading alerts" />;
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        title="Could not load alerts"
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  const items = listQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div>
        <Title>Alerts</Title>
        <BodySm>Match, poll, payment, and fund notifications</BodySm>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="You’re all caught up"
          description="New alerts will land here."
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
                <span className="mt-0.5 text-[0.7rem] text-muted-foreground">
                  {n.body}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { NotificationsInbox };
