"use client";

import { useEffect } from "react";

import { toast } from "@/components/feedback/toast";

const SW_PATH = "/sw.js";
const UPDATE_TOAST_ID = "pwa-update-available";
const PWA_RUNTIME_ENABLED =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === "true";

async function clearStaleDevelopmentWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const hadController = Boolean(navigator.serviceWorker.controller);

  await Promise.all(
    registrations.map((registration) => registration.unregister()),
  );
  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
  }

  // A worker keeps controlling the current tab until the next navigation.
  // Reload once after cleanup; the session flag prevents a development loop.
  if (
    hadController &&
    window.sessionStorage.getItem("crease-dev-sw-reset") !== "1"
  ) {
    window.sessionStorage.setItem("crease-dev-sw-reset", "1");
    window.location.reload();
    return;
  }
  if (!hadController) {
    window.sessionStorage.removeItem("crease-dev-sw-reset");
  }
}

/**
 * - Checks for a new service worker whenever the app opens / becomes visible
 * - Leaves an update waiting until the player chooses to reload
 */
function PwaUpdateProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (!PWA_RUNTIME_ENABLED) {
      void clearStaleDevelopmentWorker().catch(() => {
        // Development cleanup must never block the app.
      });
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let applyingUpdate = false;

    const applyUpdate = (worker: ServiceWorker) => {
      applyingUpdate = true;
      worker.postMessage({ type: "SKIP_WAITING" });
    };

    const announceUpdate = (worker: ServiceWorker) => {
      toast.action({
        id: UPDATE_TOAST_ID,
        title: "Update available",
        description:
          "Reload when you’re ready. Your current screen and form input will stay in place until then.",
        actionLabel: "Reload",
        onAction: () => applyUpdate(worker),
      });
    };

    const onControllerChange = () => {
      if (applyingUpdate) window.location.reload();
    };

    const checkForUpdates = () => {
      void registration?.update().catch(() => {
        // Offline or SW not reachable — keep running the last good build.
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) checkForUpdates();
    };

    void navigator.serviceWorker
      .register(SW_PATH, { scope: "/" })
      .then((reg) => {
        registration = reg;
        checkForUpdates();

        if (reg.waiting) {
          announceUpdate(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              announceUpdate(worker);
            }
          });
        });
      })
      .catch(() => {
        // Registration failure should not block the app.
      });

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", checkForUpdates);
    window.addEventListener("online", checkForUpdates);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      toast.dismiss(UPDATE_TOAST_ID);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", checkForUpdates);
      window.removeEventListener("online", checkForUpdates);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}

export { PwaUpdateProvider };
