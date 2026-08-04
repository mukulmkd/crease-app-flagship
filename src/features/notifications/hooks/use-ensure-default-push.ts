"use client";

import { useEffect, useRef } from "react";

import { isPushSupported } from "@/lib/push/browser";
import {
  enrollPushSubscription,
  syncPushIfAlreadyGranted,
} from "@/lib/push/client-subscribe";
import { isPushOptedOut } from "@/lib/push/preference";

const SESSION_PROMPT_KEY = "crease.push.prompted";

/**
 * Default-on push: sync when already allowed; on first tap, request permission
 * once per session if the player has not opted out.
 *
 * Browsers never grant Notification permission without a user gesture / prompt —
 * we cannot silently force push on.
 */
export function useEnsureDefaultPush() {
  const enrolled = useRef(false);

  useEffect(() => {
    if (!isPushSupported() || isPushOptedOut()) return;
    let cancelled = false;
    void syncPushIfAlreadyGranted().then((result) => {
      if (!cancelled && result === "subscribed") enrolled.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPushSupported()) return;

    const onGesture = () => {
      if (enrolled.current || isPushOptedOut()) return;
      if (Notification.permission === "denied") return;

      try {
        if (sessionStorage.getItem(SESSION_PROMPT_KEY) === "1") return;
        sessionStorage.setItem(SESSION_PROMPT_KEY, "1");
      } catch {
        // Continue — still attempt once this session via ref.
      }

      enrolled.current = true;
      void enrollPushSubscription().then((result) => {
        if (result !== "subscribed") enrolled.current = false;
      });
    };

    window.addEventListener("pointerdown", onGesture, { passive: true });
    window.addEventListener("keydown", onGesture);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);
}
