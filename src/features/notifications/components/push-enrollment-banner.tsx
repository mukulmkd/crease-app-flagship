"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  hasServiceWorkerRegistration,
  isAppleTouchDevice,
  isPushSupported,
  isStandalonePwa,
} from "@/lib/push/browser";
import {
  enrollPushSubscription,
  pushEnrollErrorMessage,
} from "@/lib/push/client-subscribe";
import { isPushOptedOut } from "@/lib/push/preference";

const DISMISS_KEY = "crease.push.bannerDismissed";

type BannerMode =
  "hidden" | "allow" | "install_ios" | "no_service_worker" | "denied";

/**
 * Visible push CTA — iOS only shows Notification.permission from a direct tap,
 * not from silent window listeners. Also explains Home Screen + SW requirements.
 */
function PushEnrollmentBanner() {
  const [mode, setMode] = useState<BannerMode>("hidden");
  const [busy, setBusy] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      if (!isPushSupported() || isPushOptedOut()) {
        if (!cancelled) setMode("hidden");
        return;
      }
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === "1") {
          if (!cancelled) setMode("hidden");
          return;
        }
      } catch {
        // ignore
      }

      if (Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          if (!cancelled) setMode("hidden");
          return;
        }
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setMode("denied");
        return;
      }

      const swOk = await hasServiceWorkerRegistration();
      if (!swOk) {
        if (!cancelled) setMode("no_service_worker");
        return;
      }

      if (isAppleTouchDevice() && !isStandalonePwa()) {
        if (!cancelled) setMode("install_ios");
        return;
      }

      if (!cancelled) setMode("allow");
    }

    void evaluate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const banner = bannerRef.current;
    if (mode === "hidden" || !banner) {
      root.style.setProperty("--push-banner-height", "0px");
      return;
    }

    const updateHeight = () => {
      root.style.setProperty(
        "--push-banner-height",
        `${Math.ceil(banner.getBoundingClientRect().height)}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(banner);

    return () => {
      observer.disconnect();
      root.style.setProperty("--push-banner-height", "0px");
    };
  }, [mode]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setMode("hidden");
  }

  async function allow() {
    setBusy(true);
    try {
      const result = await enrollPushSubscription({ force: true });
      if (result === "subscribed") {
        toast.success({ title: "Push alerts on" });
        setMode("hidden");
        return;
      }
      if (result === "denied") {
        setMode("denied");
      } else if (result === "no_service_worker") {
        setMode("no_service_worker");
      }
      toast.error({
        title: "Couldn’t enable push alerts",
        description: pushEnrollErrorMessage(result),
      });
    } catch (error) {
      toast.error({
        title: "Couldn’t enable push alerts",
        description: getMutationErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  if (mode === "hidden") return null;

  const copy =
    mode === "install_ios"
      ? {
          title: "Install Crease for alerts",
          body: "On iPhone, open in Safari → Share → Add to Home Screen, then open the Home Screen app and allow notifications.",
          action: null as string | null,
        }
      : mode === "no_service_worker"
        ? {
            title: "Push isn’t available yet",
            body: "This build has no service worker (common in local `npm run dev`). Use `npm run dev:pwa` or a production build, install the PWA, then allow alerts.",
            action: null,
          }
        : mode === "denied"
          ? {
              title: "Notifications blocked",
              body: "Enable Crease in iOS Settings → Notifications, then reopen the Home Screen app.",
              action: null,
            }
          : {
              title: "Turn on lock-screen alerts",
              body: "Crease needs one Allow tap so you get match and payment alerts when the app is closed.",
              action: "Allow notifications",
            };

  return (
    <div
      ref={bannerRef}
      role="region"
      aria-label="Push alerts"
      className="fixed inset-x-0 bottom-[var(--chrome-bottom-offset)] z-[var(--layer-push-banner)] border-t border-outline-variant/40 bg-surface-container-lowest p-3 shadow-lg"
    >
      <div className="mx-auto flex max-w-lg gap-3">
        <Bell aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-heading text-base font-semibold tracking-wide">
            {copy.title}
          </p>
          <BodySm className="text-muted-foreground">{copy.body}</BodySm>
          <div className="flex flex-wrap gap-2">
            {copy.action ? (
              <Button
                type="button"
                size="sm"
                className="h-11 min-w-28"
                loading={busy}
                onClick={() => void allow()}
              >
                {copy.action}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-11"
              onClick={dismiss}
            >
              Not now
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-12 shrink-0"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          <X aria-hidden className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export { PushEnrollmentBanner };
