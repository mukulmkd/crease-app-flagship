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
 *
 * Gate order: auth → active membership → profile → app.
 */
export function resolveRouteGuard(input: {
  path: string;
  user: { app_metadata?: unknown; user_metadata?: unknown } | null;
  /** null = membership not checked yet / N/A (no user). */
  isActiveMember?: boolean | null;
}): RouteGuardDecision {
  const { path, user } = input;
  const isActiveMember = input.isActiveMember ?? null;

  if (isPublicPath(path)) {
    return { action: "allow" };
  }

  const isSplash = path === AUTH_ROUTES.splash;
  const isLogin = path === AUTH_ROUTES.login;
  const isOtp = path === AUTH_ROUTES.otp;
  const isCompleteProfile = path === AUTH_ROUTES.completeProfile;
  const isAccessDenied = path === AUTH_ROUTES.accessDenied;
  const isAuthFlow =
    isSplash || isLogin || isOtp || isCompleteProfile || isAccessDenied;

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

  // Invite-only: signed-in but not an active Ranches Thunders member.
  if (
    user &&
    isActiveMember === false &&
    !isAccessDenied &&
    !isLogin &&
    !isOtp
  ) {
    return { action: "redirect", pathname: AUTH_ROUTES.accessDenied };
  }

  if (
    user &&
    isActiveMember !== false &&
    !onboardingDone &&
    !isCompleteProfile &&
    !isSplash &&
    !isOtp
  ) {
    if (isLogin || isAccessDenied || !isAuthFlow) {
      return { action: "redirect", pathname: AUTH_ROUTES.completeProfile };
    }
  }

  if (
    user &&
    isActiveMember !== false &&
    onboardingDone &&
    (isLogin || isOtp || isCompleteProfile || isAccessDenied)
  ) {
    return { action: "redirect", pathname: POST_AUTH_ROUTE };
  }

  return { action: "allow" };
}
