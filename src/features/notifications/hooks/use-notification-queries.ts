"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotificationService,
  invalidateQueries,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";

export function useUnreadNotificationCount() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => {
      requireActor(actor);
      return getNotificationService().unreadCount(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useNotifications() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => {
      requireActor(actor);
      return getNotificationService().listMine(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useMarkNotificationRead() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => {
      requireActor(actor);
      return getNotificationService().markRead(notificationId, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.notifications(client);
      await invalidateQueries.dashboard(client);
    },
  });
}
