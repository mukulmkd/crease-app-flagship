import { ONBOARDING_METADATA_KEY } from "@/constants/auth";
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
  type LoginFormInput,
  type OtpVerifyInput,
  type ProfileCompletionInput,
} from "@/lib/validations/auth";
import { createBrowserAuthRepository } from "@/repositories/auth.repository";

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
    user?: unknown;
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
    if (shouldUseDevOtp(phone)) {
      return await verifyDevOtp(phone, parsed.token);
    }
    return await repo().verifyOtp(phone, parsed.token);
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

  logger.info("auth.service.completeProfile");
  try {
    return await repo().updateUserProfile({
      onboardingKey: ONBOARDING_METADATA_KEY,
      name: parsed.name,
    });
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

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  try {
    return await repo().getSession();
  } catch (error) {
    rethrow(error);
  }
}
