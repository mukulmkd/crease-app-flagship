"use client";

import { useEffect, useRef } from "react";

import { isPushSupported } from "@/lib/push/browser";
import { syncPushIfAlreadyGranted } from "@/lib/push/client-subscribe";
import { isPushOptedOut } from "@/lib/push/preference";

/**
 * Quiet sync when OS permission is already granted.
 * Permission prompts must come from PushEnrollmentBanner / Settings button taps —
 * iOS ignores silent requestPermission() from window listeners.
 */
export function useEnsureDefaultPush() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !isPushSupported() || isPushOptedOut()) return;
    ran.current = true;
    void syncPushIfAlreadyGranted();
  }, []);
}
