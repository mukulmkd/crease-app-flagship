/// <reference lib="webworker" />

/**
 * Custom service worker chunk (bundled into next-pwa sw.js).
 * Shows OS notifications when Crease is backgrounded / closed.
 */

declare const self: ServiceWorkerGlobalScope;

type CreasePushPayload = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  notificationId?: string;
};

self.addEventListener("push", (event) => {
  const raw = event.data?.json() as CreasePushPayload | null;
  const title = raw?.title?.trim() || "Crease";
  const body = raw?.body?.trim() || "You have a new alert";
  const url = raw?.url?.trim() || "/home?alerts=1";
  const tag = raw?.tag?.trim() || raw?.notificationId || "crease-alert";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const visible = clients.some(
        (client) =>
          "visibilityState" in client && client.visibilityState === "visible",
      );

      // Foreground: Realtime already toasts + chimes. Only nudge a refresh —
      // do not play a second sound via postMessage.
      if (visible) {
        for (const client of clients) {
          client.postMessage({ type: "CREASE_PUSH_REFRESH", payload: raw });
        }
        return;
      }

      // Background / locked / killed: OS banner via the service worker.
      await self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag,
        renotify: true,
        data: { url },
        vibrate: [60, 40, 60, 40, 120],
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data as { url?: string } | undefined)?.url ||
    "/home?alerts=1";
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await (client as WindowClient).navigate(absolute);
          }
          return;
        }
      }
      await self.clients.openWindow(absolute);
    })(),
  );
});

export {};
