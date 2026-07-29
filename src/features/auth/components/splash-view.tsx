"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AUTH_ROUTES, POST_AUTH_ROUTE } from "@/constants/auth";
import { useAuth } from "@/providers/auth-provider";

const SPLASH_MS = 1800;

/**
 * Stitch splash — brand mark + progress, then route by session.
 */
function SplashView() {
  const router = useRouter();
  const { isLoading, isAuthenticated, isOnboardingComplete, isSupabaseReady } =
    useAuth();
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, Math.round((elapsed / SPLASH_MS) * 100)));
    }, 50);

    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    // Don't wait forever if auth never settles (common on flaky mobile/network).
    const maxWaitMs = isLoading ? SPLASH_MS + 4000 : SPLASH_MS;

    const timer = window.setTimeout(() => {
      setProgress(100);
      if (isLoading || !isSupabaseReady || !isAuthenticated) {
        router.replace(AUTH_ROUTES.login);
        return;
      }
      router.replace(
        isOnboardingComplete ? POST_AUTH_ROUTE : AUTH_ROUTES.completeProfile,
      );
    }, maxWaitMs);

    return () => window.clearTimeout(timer);
  }, [
    isLoading,
    isAuthenticated,
    isOnboardingComplete,
    isSupabaseReady,
    router,
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-container-lowest px-8 text-primary">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex size-28 items-center justify-center rounded-full border border-primary/20">
          <span className="relative block size-14" aria-hidden>
            <span className="absolute top-3 left-2 h-4 w-9 -rotate-45 rounded-sm border-[3px] border-primary" />
            <span className="absolute top-7 left-7 h-4 w-4 rounded-full border-[3px] border-primary bg-surface-container-lowest" />
            <span className="absolute right-1 bottom-2 h-1 w-6 rotate-45 rounded-full bg-primary" />
          </span>
        </div>
        <div className="-mt-1 text-center">
          <h1 className="font-heading text-3xl leading-none font-bold tracking-tight">
            Crease
          </h1>
          <p className="mt-2 text-[0.6rem] font-semibold tracking-[0.24em] text-primary/45 uppercase">
            Ranches Thunders
          </p>
        </div>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-56 pb-12">
        <div
          role="progressbar"
          aria-label="Loading Crease"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-px overflow-hidden bg-primary/15"
        >
          <div
            className="h-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export { SplashView };
