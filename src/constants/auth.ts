export const AUTH_ROUTES = {
  splash: "/splash",
  login: "/login",
  otp: "/otp",
  completeProfile: "/complete-profile",
  accessDenied: "/access-denied",
} as const;

export const POST_AUTH_ROUTE = "/home";

/** Supabase SMS OTP default length */
export const OTP_LENGTH = 6;

export const OTP_RESEND_SECONDS = 30;

export const ONBOARDING_METADATA_KEY = "onboarding_complete";

export const DEFAULT_COUNTRY_CODE = "+91";
