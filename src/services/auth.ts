import { ONBOARDING_METADATA_KEY } from "@/constants/auth";
import { MVP_TEAM } from "@/constants/domain/enums";
import { isClientDevAuthEnabled, isDevAuthPhone } from "@/constants/dev-auth";
import {
  AuthError,
  mapAuthError,
  normalizePhoneNumber,
} from "@/lib/auth/utils";
import { isAppError } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import {
  loginFormSchema,
  otpVerifySchema,
  profileCompletionSchema,
  updateOwnProfileSchema,
  type LoginFormInput,
  type OtpVerifyInput,
  type ProfileCompletionInput,
  type UpdateOwnProfileInput,
} from "@/lib/validations/auth";
import { createBrowserAuthRepository } from "@/repositories/auth.repository";
import {
  createBrowserTeamRepository,
  createBrowserUserRepository,
} from "@/repositories";
import type { Profile } from "@/types/models";
import { avatarStoragePath, resolveAvatarUrl } from "@/utils/avatar";

/**
 * Auth service — validation + orchestration.
 * Never imports Supabase clients; repositories own data access.
 */

function assertReady() {
  if (!isSupabaseConfigured()) {
    throw new AuthError(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

function rethrow(error: unknown): never {
  logger.error("auth.service.error", {
    message: error instanceof Error ? error.message : "unknown",
    code: isAppError(error) ? error.code : undefined,
  });
  throw new AuthError(mapAuthError(error));
}

function repo() {
  return createBrowserAuthRepository();
}

function shouldUseDevOtp(phone: string): boolean {
  return isClientDevAuthEnabled() && isDevAuthPhone(phone);
}

async function assertActiveMember(userId: string): Promise<void> {
  const membership = await createBrowserTeamRepository().findMembership(
    MVP_TEAM.id,
    userId,
  );
  if (!membership || membership.status !== "active") {
    await repo()
      .signOut()
      .catch(() => undefined);
    throw new AuthError(
      "This number isn’t invited to Ranches Thunders. Ask your admin to add you.",
    );
  }
}

async function sendDevOtp(phone: string) {
  const response = await fetch("/api/dev/auth/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send", phone }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new AuthError(payload.error ?? "Dev OTP send failed");
  }
  return { phone };
}

async function verifyDevOtp(phone: string, token: string) {
  const response = await fetch("/api/dev/auth/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", phone, token }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    session?: {
      access_token: string;
      refresh_token: string;
    };
    user?: { id?: string };
  };
  if (!response.ok || !payload.session) {
    throw new AuthError(payload.error ?? "Dev OTP verify failed");
  }
  await repo().setSession({
    access_token: payload.session.access_token,
    refresh_token: payload.session.refresh_token,
  });
  return {
    session: payload.session,
    user: payload.user,
  };
}

export async function sendOtp(input: LoginFormInput) {
  assertReady();
  const { phone: local } = loginFormSchema.parse(input);
  const phone = normalizePhoneNumber(local);

  logger.info("auth.service.sendOtp");
  try {
    if (shouldUseDevOtp(phone)) {
      return await sendDevOtp(phone);
    }
    await repo().signInWithOtp(phone);
    return { phone };
  } catch (error) {
    rethrow(error);
  }
}

export async function verifyOtp(input: OtpVerifyInput) {
  assertReady();
  const parsed = otpVerifySchema.parse(input);
  const phone = normalizePhoneNumber(parsed.phone);

  logger.info("auth.service.verifyOtp");
  try {
    const result = shouldUseDevOtp(phone)
      ? await verifyDevOtp(phone, parsed.token)
      : await repo().verifyOtp(phone, parsed.token);

    const userId =
      (result.user as { id?: string } | null | undefined)?.id ??
      (await repo().getUser())?.id;
    if (!userId) {
      throw new AuthError("Authentication failed. Please try again.");
    }
    await assertActiveMember(userId);
    return result;
  } catch (error) {
    rethrow(error);
  }
}

export async function resendOtp(phone: string) {
  const local = phone.replace(/\D/g, "").slice(-10);
  return sendOtp({ phone: local });
}

export async function completeProfile(input: ProfileCompletionInput) {
  assertReady();
  const parsed = profileCompletionSchema.parse(input);
  const phone = normalizePhoneNumber(parsed.phone);

  logger.info("auth.service.completeProfile");
  try {
    const user = await repo().getUser();
    if (!user) {
      throw new AuthError("Sign in required");
    }
    await assertActiveMember(user.id);

    const sessionPhone = user.phone ? normalizePhoneNumber(user.phone) : null;
    if (sessionPhone && sessionPhone !== phone) {
      throw new AuthError(
        "Mobile number must match the number you used to sign in.",
      );
    }

    return await repo().updateUserProfile({
      onboardingKey: ONBOARDING_METADATA_KEY,
      name: parsed.name,
    });
  } catch (error) {
    rethrow(error);
  }
}

export async function getMyProfile(): Promise<Profile> {
  assertReady();
  logger.info("auth.service.getMyProfile");
  try {
    const user = await repo().getUser();
    if (!user) {
      throw new AuthError("Sign in required");
    }
    await assertActiveMember(user.id);
    return await createBrowserUserRepository().findByIdOrThrow(user.id);
  } catch (error) {
    rethrow(error);
  }
}

export async function updateMyProfile(
  input: UpdateOwnProfileInput,
): Promise<Profile> {
  assertReady();
  const parsed = updateOwnProfileSchema.parse(input);
  logger.info("auth.service.updateMyProfile");
  try {
    const user = await repo().getUser();
    if (!user) {
      throw new AuthError("Sign in required");
    }
    await assertActiveMember(user.id);
    await repo().updateUserProfile({
      onboardingKey: ONBOARDING_METADATA_KEY,
      name: parsed.name,
    });
    return await createBrowserUserRepository().findByIdOrThrow(user.id);
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Replace avatar: upload new → persist path → delete previous storage object.
 * Compression happens in the hook (browser canvas) before this call.
 */
export async function updateMyAvatar(blob: Blob): Promise<Profile> {
  assertReady();
  logger.info("auth.service.updateMyAvatar");
  try {
    const user = await repo().getUser();
    if (!user) {
      throw new AuthError("Sign in required");
    }
    await assertActiveMember(user.id);

    const users = createBrowserUserRepository();
    const existing = await users.findByIdOrThrow(user.id);
    const previousPath = avatarStoragePath(existing.avatarUrl);

    const nextPath = await users.uploadAvatar(user.id, blob);
    const profile = await users.update(user.id, { avatar_url: nextPath });
    await repo().updateAvatarMetadata(resolveAvatarUrl(nextPath));

    if (previousPath && previousPath !== nextPath) {
      try {
        await users.deleteAvatar(previousPath);
      } catch (error) {
        logger.warn("auth.service.updateMyAvatar.delete_old_failed", {
          path: previousPath,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return profile;
  } catch (error) {
    rethrow(error);
  }
}

export async function removeMyAvatar(): Promise<Profile> {
  assertReady();
  logger.info("auth.service.removeMyAvatar");
  try {
    const user = await repo().getUser();
    if (!user) {
      throw new AuthError("Sign in required");
    }
    await assertActiveMember(user.id);

    const users = createBrowserUserRepository();
    const existing = await users.findByIdOrThrow(user.id);
    const previousPath = avatarStoragePath(existing.avatarUrl);

    const profile = await users.update(user.id, { avatar_url: null });
    await repo().updateAvatarMetadata(null);

    if (previousPath) {
      try {
        await users.deleteAvatar(previousPath);
      } catch (error) {
        logger.warn("auth.service.removeMyAvatar.delete_failed", {
          path: previousPath,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    return profile;
  } catch (error) {
    rethrow(error);
  }
}

export async function signOut() {
  if (!isSupabaseConfigured()) return;
  logger.info("auth.service.signOut");
  try {
    await repo().signOut();
  } catch (error) {
    rethrow(error);
  }
}
