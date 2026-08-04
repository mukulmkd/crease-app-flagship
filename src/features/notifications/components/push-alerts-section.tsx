"use client";

import { useEffect, useState } from "react";

import { BodySm, StatusChip } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  getVapidPublicKey,
  isPushSupported,
  urlBase64ToUint8Array,
} from "@/lib/push/browser";
import {
  deletePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/services/push.actions";

type PermissionState = NotificationPermission | "unsupported";

function readPushPermission(): PermissionState {
  if (typeof window === "undefined" || !isPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Enable OS push for the installed PWA (background / locked screen alerts).
 */
function PushAlertsSection() {
  const [permission, setPermission] =
    useState<PermissionState>(readPushPermission);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const vapidPublic = getVapidPublicKey();

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;
    void navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setSubscribed(Boolean(sub));
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    if (!vapidPublic) {
      toast.error({
        title: "Push not configured",
        description: "Missing VAPID public key on the server.",
      });
      return;
    }
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error({
          title: "Permission blocked",
          description: "Allow notifications for Crease in system settings.",
        });
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublic,
          ) as BufferSource,
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
      setSubscribed(true);
      toast.success({ title: "Push alerts enabled" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      toast.success({ title: "Push alerts turned off" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Push alerts
          </p>
          <BodySm className="mt-1">
            Get Crease alerts on your lock screen when the app is closed. On
            iPhone, install Crease to the Home Screen first (Safari → Share →
            Add to Home Screen).
          </BodySm>
        </div>
        {permission === "unsupported" ? (
          <StatusChip status="warning">Unsupported</StatusChip>
        ) : subscribed ? (
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
      ) : subscribed ? (
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
          Enable push alerts
        </Button>
      )}
    </section>
  );
}

export { PushAlertsSection };
