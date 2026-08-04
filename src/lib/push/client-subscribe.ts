import {
  ensureServiceWorkerRegistration,
  getVapidPublicKey,
  isPushSupported,
  urlBase64ToUint8Array,
} from "@/lib/push/browser";
import { isPushOptedOut, setPushOptedOut } from "@/lib/push/preference";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/services/push.actions";

export type PushEnrollResult =
  | "subscribed"
  | "opted_out"
  | "unsupported"
  | "no_vapid"
  | "no_service_worker"
  | "denied"
  | "dismissed";

export function pushEnrollErrorMessage(result: PushEnrollResult): string {
  switch (result) {
    case "subscribed":
      return "Push alerts on";
    case "opted_out":
      return "Push is turned off in Settings — turn it back on there.";
    case "unsupported":
      return "This browser cannot receive Web Push.";
    case "no_vapid":
      return "Server is missing NEXT_PUBLIC_VAPID_PUBLIC_KEY (must be set at build time).";
    case "no_service_worker":
      return "Service worker missing — open the installed PWA after a production deploy.";
    case "denied":
      return "Notifications are blocked in system settings.";
    case "dismissed":
      return "Notification permission was not granted. Tap Allow on the system prompt.";
  }
}

async function subscribeWithVapid(
  registration: ServiceWorkerRegistration,
  vapidPublic: string,
): Promise<PushSubscription> {
  const applicationServerKey = urlBase64ToUint8Array(vapidPublic);
  const existing = await registration.pushManager.getSubscription();

  if (existing) {
    // Reuse when possible; if the browser rejects later saves we re-subscribe below.
    return existing;
  }

  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  } catch (firstError) {
    // Stale subscription tied to an old VAPID key — drop and retry once.
    const stale = await registration.pushManager.getSubscription();
    if (stale) {
      await stale.unsubscribe().catch(() => undefined);
    }
    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("Push subscribe failed");
    }
  }
}

/**
 * Ensure this device is subscribed for OS push (default-on path).
 * Call from a direct button tap on iOS.
 */
export async function enrollPushSubscription(opts?: {
  /** When true, clear opt-out first (Settings "Turn on"). */
  force?: boolean;
}): Promise<PushEnrollResult> {
  if (!isPushSupported()) return "unsupported";
  if (!opts?.force && isPushOptedOut()) return "opted_out";

  const vapidPublic = getVapidPublicKey();
  if (!vapidPublic) return "no_vapid";

  if (opts?.force) setPushOptedOut(false);

  if (Notification.permission === "denied") return "denied";

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result === "denied") return "denied";
    if (result !== "granted") return "dismissed";
  }

  const registration = await ensureServiceWorkerRegistration();
  if (!registration) return "no_service_worker";

  const subscription = await subscribeWithVapid(registration, vapidPublic);
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Incomplete push subscription from the browser");
  }

  await savePushSubscriptionAction({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent,
  });

  return "subscribed";
}

/** Opt out: drop browser subscription + server row and remember preference. */
export async function optOutPushSubscription(): Promise<void> {
  setPushOptedOut(true);
  if (!isPushSupported()) return;

  try {
    const registration = await ensureServiceWorkerRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await deletePushSubscriptionAction(subscription.endpoint);
    await subscription.unsubscribe();
  } catch {
    // Preference is already opted out even if unsubscribe fails.
  }
}

/** Re-save subscription when OS permission is already granted (no prompt). */
export async function syncPushIfAlreadyGranted(): Promise<PushEnrollResult> {
  if (!isPushSupported()) return "unsupported";
  if (isPushOptedOut()) return "opted_out";
  if (Notification.permission !== "granted") return "dismissed";
  return enrollPushSubscription();
}
