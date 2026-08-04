import {
  getVapidPublicKey,
  hasServiceWorkerRegistration,
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

async function getPushRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  const ready = navigator.serviceWorker.ready;
  const timedOut = new Promise<never>((_, reject) => {
    window.setTimeout(
      () => reject(new Error("Service worker not ready")),
      4000,
    );
  });
  return Promise.race([ready, timedOut]);
}

/**
 * Ensure this device is subscribed for OS push (default-on path).
 * Skips when the player opted out. May prompt for Notification permission.
 * Call from a direct button tap on iOS — window listeners often never show the dialog.
 */
export async function enrollPushSubscription(opts?: {
  /** When true, clear opt-out first (Settings "Turn on"). */
  force?: boolean;
}): Promise<PushEnrollResult> {
  if (!isPushSupported()) return "unsupported";
  if (!opts?.force && isPushOptedOut()) return "opted_out";

  const vapidPublic = getVapidPublicKey();
  if (!vapidPublic) return "no_vapid";

  if (!(await hasServiceWorkerRegistration())) return "no_service_worker";

  if (opts?.force) setPushOptedOut(false);

  if (Notification.permission === "denied") return "denied";

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result === "denied") return "denied";
    if (result !== "granted") return "dismissed";
  }

  const registration = await getPushRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Incomplete push subscription");
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
    const registration = await getPushRegistration();
    const subscription = await registration.pushManager.getSubscription();
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
