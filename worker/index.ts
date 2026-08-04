/// <reference lib="webworker" />

/**
 * Custom service worker chunk (bundled into next-pwa sw.js).
 * Shows OS notifications when Crease is backgrounded / closed.
 *
 * iOS requires a user-visible notification for every push event. Skipping
 * showNotification (e.g. when a window looks "visible") can stop Apple from
 * delivering further pushes — always show the banner.
 */

declare const self: ServiceWorkerGlobalScope;

type CreasePushPayload = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
  notificationId?: string;
};

function readPushPayload(
  event: PushEvent,
): Required<Pick<CreasePushPayload, "title" | "body" | "url" | "tag">> {
  let raw: CreasePushPayload | null = null;
  try {
    raw = (event.data?.json() as CreasePushPayload | null) ?? null;
  } catch {
    try {
      const text = event.data?.text();
      raw = text ? { body: text } : null;
    } catch {
      raw = null;
    }
  }

  return {
    title: raw?.title?.trim() || "Crease",
    body: raw?.body?.trim() || "You have a new alert",
    url: raw?.url?.trim() || "/home?alerts=1",
    tag: raw?.tag?.trim() || raw?.notificationId || "crease-alert",
  };
}

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);

  event.waitUntil(
    (async () => {
      // Always show — required on iOS; Android may also show while foreground.
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: payload.tag,
        renotify: true,
        data: { url: payload.url },
      });

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clients) {
        client.postMessage({ type: "CREASE_PUSH_REFRESH", payload });
      }
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
