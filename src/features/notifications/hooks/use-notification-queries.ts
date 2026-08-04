"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/feedback/toast";
import {
  getNotificationService,
  invalidateQueries,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";
import { playCreaseNotificationSound, unlockNotificationAudio } from "@/utils";

export function useUnreadNotificationCount() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => {
      requireActor(actor);
      return getNotificationService().unreadCount(actor);
    },
    enabled: Boolean(actor),
    refetchOnWindowFocus: true,
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
    refetchOnWindowFocus: true,
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

/**
 * Realtime + SW postMessage: chime when a new alert arrives while the app is open.
 */
export function useNotificationAlerts() {
  const actor = useActor();
  const client = useQueryClient();
  const primed = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (primed.current) return;
      primed.current = true;
      void unlockNotificationAudio();
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!actor) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const onInsert = () => {
      void playCreaseNotificationSound();
      void invalidateQueries.notifications(client);
      void invalidateQueries.dashboard(client);
    };

    void getNotificationService()
      .subscribeMine(actor, (notification) => {
        onInsert();
        toast.info({
          title: notification.title,
          description: notification.body,
        });
      })
      .then((stop) => {
        if (cancelled) {
          stop();
          return;
        }
        unsubscribe = stop;
      })
      .catch(() => undefined);

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "CREASE_PUSH") return;
      onInsert();
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    return () => {
      cancelled = true;
      unsubscribe?.();
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [actor, client]);
}
