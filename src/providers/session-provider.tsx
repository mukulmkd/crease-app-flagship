"use client";

/**
 * Session provider alias — keeps naming aligned with platform layer docs.
 * Implementation lives in AuthProvider (single source of truth).
 */
export {
  AuthProvider,
  SessionProvider,
  useAuth,
  useSession,
} from "@/providers/auth-provider";
