"use client";

import { useEffect, useState } from "react";

import { BodySm, StatusChip } from "@/components/common";
import { Overline } from "@/components/common/typography";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  getVapidPublicKey,
  hasServiceWorkerRegistration,
  isAppleTouchDevice,
  isPushSupported,
  isStandalonePwa,
} from "@/lib/push/browser";
import {
  enrollPushSubscription,
  optOutPushSubscription,
  pushEnrollErrorMessage,
} from "@/lib/push/client-subscribe";
import { isPushOptedOut } from "@/lib/push/preference";

type PermissionState = NotificationPermission | "unsupported";

function readPushPermission(): PermissionState {
  if (typeof window === "undefined" || !isPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * OS push preference — on by default after Allow; players may turn off here.
 */
function PushAlertsSection() {
  const [permission, setPermission] =
    useState<PermissionState>(readPushPermission);
  const [subscribed, setSubscribed] = useState(false);
  const [optedOut, setOptedOut] = useState(() =>
    typeof window === "undefined" ? false : isPushOptedOut(),
  );
  const [swReady, setSwReady] = useState<boolean | null>(null);
  const [standalone] = useState(() =>
    typeof window === "undefined" ? true : isStandalonePwa(),
  );
  const [busy, setBusy] = useState(false);
  const vapidPublic = getVapidPublicKey();
  const apple = typeof window !== "undefined" && isAppleTouchDevice();

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;
    void (async () => {
      const ok = await hasServiceWorkerRegistration();
      if (cancelled) return;
      setSwReady(ok);
      if (!ok) {
        setSubscribed(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setSubscribed(Boolean(sub));
      } catch {
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const result = await enrollPushSubscription({ force: true });
      setPermission(readPushPermission());
      setOptedOut(isPushOptedOut());
      if (result === "subscribed") {
        setSubscribed(true);
        setSwReady(true);
        toast.success({ title: "Push alerts on" });
        return;
      }
      toast.error({
        title: "Couldn’t enable push alerts",
        description: pushEnrollErrorMessage(result),
      });
      if (result === "no_service_worker") setSwReady(false);
    } catch (error) {
      toast.error({
        title: "Couldn’t enable push alerts",
        description: getMutationErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await optOutPushSubscription();
      setSubscribed(false);
      setOptedOut(true);
      toast.success({ title: "Push alerts turned off" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const isOn = subscribed && !optedOut && permission === "granted";
  const needsInstall = apple && !standalone;

  return (
    <section className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Overline className="text-muted-foreground">Notifications</Overline>
          <BodySm className="mt-1">
            Lock-screen alerts are on by default after you Allow once. Turn them
            off anytime here. On iPhone, install Crease to the Home Screen first
            (Safari → Share → Add to Home Screen).
          </BodySm>
        </div>
        {permission === "unsupported" ? (
          <StatusChip status="warning">Unsupported</StatusChip>
        ) : isOn ? (
          <StatusChip status="success">On</StatusChip>
        ) : (
          <StatusChip status="warning">Off</StatusChip>
        )}
      </div>

      {permission === "unsupported" ? (
        <BodySm className="text-muted-foreground">
          This browser cannot receive Web Push.
        </BodySm>
      ) : !vapidPublic ? (
        <BodySm className="text-muted-foreground">
          Server is missing VAPID keys — ask Admin to configure env.
        </BodySm>
      ) : swReady === false ? (
        <BodySm className="text-muted-foreground">
          No service worker on this build. For local iPhone testing run{" "}
          <span className="font-medium text-foreground">npm run dev:pwa</span>,
          reinstall the Home Screen app, then Allow.
        </BodySm>
      ) : needsInstall ? (
        <BodySm className="text-muted-foreground">
          Open Crease from the Home Screen icon (not a Safari tab) before
          allowing notifications.
        </BodySm>
      ) : isOn ? (
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full"
          loading={busy}
          onClick={() => void disable()}
        >
          Turn off push
        </Button>
      ) : (
        <Button
          type="button"
          variant="tonal"
          className="h-12 w-full"
          loading={busy}
          onClick={() => void enable()}
        >
          {optedOut ? "Turn push back on" : "Allow push alerts"}
        </Button>
      )}
    </section>
  );
}

export { PushAlertsSection };
