"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleDot } from "lucide-react";

import { Progress } from "@/components/ui/progress";
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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="flex size-28 items-center justify-center rounded-full border border-outline-variant/60">
          <CircleDot
            className="size-14 text-primary"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Crease
          </h1>
          <p className="mt-2 text-caption font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Athletic Precision
          </p>
        </div>
      </div>

      <div className="safe-bottom w-full max-w-xs pb-10">
        <Progress value={progress} aria-label="Loading" />
      </div>
    </div>
  );
}

export { SplashView };
