/** Browser helpers for Web Push subscribe (VAPID). */

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

/**
 * Decode a VAPID public key for PushManager.subscribe.
 * Returns a tightly packed Uint8Array — Chrome rejects some ArrayBuffer views.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  // Fresh copy — avoids Cross-realm / detached-buffer subscribe failures.
  return new Uint8Array(output);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Home Screen / installed PWA — required for Web Push on iOS. */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

const SW_PATH = "/sw.js";

/** Register (or reuse) the Crease service worker required for push. */
export async function ensureServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      await navigator.serviceWorker.ready;
      return existing;
    }
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

/** True when a service worker is available (registered or /sw.js reachable). */
export async function hasServiceWorkerRegistration(): Promise<boolean> {
  const reg = await ensureServiceWorkerRegistration();
  if (reg) return true;
  try {
    const res = await fetch(SW_PATH, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
