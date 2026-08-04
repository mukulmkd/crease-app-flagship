"use client";

import { useEffect, useState } from "react";

import { BodySm, StatusChip } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { getVapidPublicKey, isPushSupported } from "@/lib/push/browser";
import {
  enrollPushSubscription,
  optOutPushSubscription,
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
    setBusy(true);
    try {
      const result = await enrollPushSubscription({ force: true });
      setPermission(readPushPermission());
      setOptedOut(isPushOptedOut());
      if (result === "subscribed") {
        setSubscribed(true);
        toast.success({ title: "Push alerts on" });
        return;
      }
      if (result === "denied") {
        toast.error({
          title: "Permission blocked",
          description: "Allow notifications for Crease in system settings.",
        });
        return;
      }
      if (result === "no_vapid") {
        toast.error({
          title: "Push not configured",
          description: "Missing VAPID public key on the server.",
        });
        return;
      }
      if (result === "unsupported") {
        toast.error({ title: "This browser cannot receive Web Push" });
        return;
      }
      toast.error({ title: "Couldn’t enable push alerts" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
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

  return (
    <section className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Push alerts
          </p>
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
