import {
  AUTH_ROUTES,
  ONBOARDING_METADATA_KEY,
  POST_AUTH_ROUTE,
} from "@/constants/auth";

export type RouteGuardDecision =
  | { action: "allow" }
  | { action: "redirect"; pathname: string; setRedirectQuery?: boolean };

function isOnboardingComplete(metadata: Record<string, unknown> | undefined) {
  return (
    metadata?.[ONBOARDING_METADATA_KEY] === true ||
    metadata?.onboarding_complete === true
  );
}

function isPublicPath(path: string) {
  return (
    path === "/offline" ||
    path.startsWith("/icons") ||
    path === "/manifest.webmanifest" ||
    // API routes authenticate themselves; never bounce them to /login HTML.
    path.startsWith("/api/")
  );
}

/**
 * Pure route-protection rules — used by middleware; unit-testable without Next.
 */
export function resolveRouteGuard(input: {
  path: string;
  user: { app_metadata?: unknown; user_metadata?: unknown } | null;
}): RouteGuardDecision {
  const { path, user } = input;

  if (isPublicPath(path)) {
    return { action: "allow" };
  }

  const isSplash = path === AUTH_ROUTES.splash;
  const isLogin = path === AUTH_ROUTES.login;
  const isOtp = path === AUTH_ROUTES.otp;
  const isCompleteProfile = path === AUTH_ROUTES.completeProfile;
  const isAuthFlow = isSplash || isLogin || isOtp || isCompleteProfile;

  const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const onboardingDone =
    isOnboardingComplete(appMeta) || isOnboardingComplete(userMeta);

  if (!user && !isAuthFlow && path !== "/") {
    return {
      action: "redirect",
      pathname: AUTH_ROUTES.login,
      setRedirectQuery: true,
    };
  }

  if (user && !onboardingDone && !isCompleteProfile && !isSplash && !isOtp) {
    if (isLogin || !isAuthFlow) {
      return { action: "redirect", pathname: AUTH_ROUTES.completeProfile };
    }
  }

  if (user && onboardingDone && (isLogin || isOtp || isCompleteProfile)) {
    return { action: "redirect", pathname: POST_AUTH_ROUTE };
  }

  return { action: "allow" };
}
