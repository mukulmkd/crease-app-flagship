"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import appIcon from "../../../../public/icons/icon-512.png";

import { AUTH_ROUTES, POST_AUTH_ROUTE } from "@/constants/auth";
import { useAuth } from "@/providers/auth-provider";

const SPLASH_MS = 1800;

/**
 * Brand splash + progress, then route by session.
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
    // Clubhouse black in both themes so the OS launch screen and the installed
    // app icon flow into this view without a color flash.
    <div className="flex min-h-dvh flex-col bg-clubhouse px-8 text-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Image
          src={appIcon}
          alt=""
          priority
          className="size-24 rounded-3xl object-cover"
        />
        <div className="text-center">
          <h1 className="font-heading text-4xl leading-none font-semibold tracking-tight">
            Crease
          </h1>
          <p className="mt-2 text-xs font-semibold tracking-[0.24em] text-tertiary uppercase">
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
          className="h-0.5 overflow-hidden rounded-full bg-white/15"
        >
          <div
            className="h-full rounded-full bg-tertiary transition-[width] duration-100 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export { SplashView };
