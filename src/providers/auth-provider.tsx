"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { isOnboardingComplete } from "@/lib/auth/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { createBrowserAuthRepository } from "@/repositories/auth.repository";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  isSupabaseReady: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Session / auth provider — listens via AuthRepository only (no direct Supabase).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const ready = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(() => ready);

  const refresh = useCallback(async () => {
    if (!ready) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const next = await createBrowserAuthRepository().getSession();
      setSession(next);
    } catch (error) {
      logger.error("auth.provider.refresh_failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const auth = createBrowserAuthRepository();
    // INITIAL_SESSION fires on subscribe — avoid sync setState in effect body.
    const { subscription } = auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    // Fallback if INITIAL_SESSION never arrives (flaky mobile / LAN).
    const fallback = window.setTimeout(() => {
      void refresh();
    }, 2500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallback);
    };
  }, [ready, refresh]);
  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const meta = {
      ...(user?.app_metadata as Record<string, unknown> | undefined),
      ...(user?.user_metadata as Record<string, unknown> | undefined),
    };
    return {
      session,
      user,
      isLoading,
      isAuthenticated: Boolean(session),
      isOnboardingComplete: isOnboardingComplete(meta),
      isSupabaseReady: ready,
      refresh,
    };
  }, [session, isLoading, ready, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
