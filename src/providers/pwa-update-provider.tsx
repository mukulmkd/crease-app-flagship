"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

/**
 * Keep installed PWA clients on the latest deploy without player action.
 *
 * - Checks for a new service worker whenever the app opens / becomes visible
 * - Reloads once when an updated worker takes control (skipWaiting + clientsClaim)
 */
function PwaUpdateProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let refreshing = false;

    const reloadForUpdate = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    // Only auto-reload on *updates*. First install should not bounce the page.
    const hadControllerAtStart = Boolean(navigator.serviceWorker.controller);
    if (hadControllerAtStart) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        reloadForUpdate,
      );
    }

    const checkForUpdates = () => {
      void registration?.update().catch(() => {
        // Offline or SW not reachable — keep running the last good build.
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdates();
    };

    void navigator.serviceWorker
      .register(SW_PATH, { scope: "/" })
      .then((reg) => {
        registration = reg;
        checkForUpdates();

        // If a worker is already waiting (rare with skipWaiting), nudge activation.
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // skipWaiting is on; controllerchange + reload finishes the swap.
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        // Registration failure should not block the app.
      });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", checkForUpdates);
    window.addEventListener("online", checkForUpdates);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) checkForUpdates();
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", checkForUpdates);
      window.removeEventListener("online", checkForUpdates);
      if (hadControllerAtStart) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          reloadForUpdate,
        );
      }
    };
  }, []);

  return null;
}

export { PwaUpdateProvider };
