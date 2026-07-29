import {
  DEFAULT_COUNTRY_CODE,
  ONBOARDING_METADATA_KEY,
} from "@/constants/auth";
import { isAppError } from "@/lib/errors";
import { isSupabaseConfigured as envIsSupabaseConfigured } from "@/lib/env";

/** Re-export canonical env check so auth helpers stay in sync with platform env. */
export function isSupabaseConfigured(): boolean {
  return envIsSupabaseConfigured();
}

/** Normalize to E.164 (+91…) for Indian mobiles. */
export function normalizePhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (input.trim().startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return `${DEFAULT_COUNTRY_CODE}${digits.slice(-10)}`;
}

export function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const local = digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
  if (local.length !== 10) return e164;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

export function isOnboardingComplete(
  metadata: Record<string, unknown> | undefined | null,
): boolean {
  if (!metadata) return false;
  return metadata[ONBOARDING_METADATA_KEY] === true;
}

export function mapAuthError(error: unknown): string {
  if (isAppError(error)) {
    return mapAuthError({ message: error.message });
  }

  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "";

  const lower = message.toLowerCase();
  if (
    lower.includes("signups not allowed") ||
    lower.includes("user not found") ||
    lower.includes("unable to find user") ||
    lower.includes("otp_disabled")
  ) {
    return "This number isn’t invited to Ranches Thunders. Ask your admin to add you.";
  }
  if (lower.includes("not an active member") || lower.includes("not invited")) {
    return "This number isn’t invited to Ranches Thunders. Ask your admin to add you.";
  }
  if (lower.includes("otp") || lower.includes("token")) {
    return "Invalid or expired OTP. Please try again.";
  }
  if (lower.includes("rate") || lower.includes("sms")) {
    return "Too many attempts. Please wait and try again.";
  }
  if (lower.includes("phone")) {
    return "Unable to send OTP to this number.";
  }
  return message || "Authentication failed. Please try again.";
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
