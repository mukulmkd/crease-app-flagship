import type {
  AuthChangeEvent,
  Session,
  Subscription,
  User,
} from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";

export type AuthStateCallback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

export type CompleteProfilePayload = {
  onboardingKey: string;
  name: string;
  avatarUrl?: string | null;
};

/**
 * Auth data access — sole owner of supabase.auth calls.
 */
export class AuthRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async signInWithOtp(phone: string): Promise<void> {
    logger.debug("auth.repository.signInWithOtp");
    // Invite-only: Admin must create the Auth user first (add player).
    const { error } = await this.client.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
  }

  async verifyOtp(phone: string, token: string) {
    logger.debug("auth.repository.verifyOtp");
    const { data, error } = await this.client.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
    return data;
  }

  /** Apply a session minted by the server (dev OTP bypass). */
  async setSession(tokens: {
    access_token: string;
    refresh_token: string;
  }): Promise<Session> {
    logger.debug("auth.repository.setSession");
    const { data, error } = await this.client.auth.setSession(tokens);
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
    if (!data.session) {
      throw new AppError("INTERNAL", "setSession returned no session", 500);
    }
    return data.session;
  }

  async updateUserProfile(payload: CompleteProfilePayload): Promise<User> {
    logger.debug("auth.repository.updateUserProfile");
    const metadata: Record<string, unknown> = {
      [payload.onboardingKey]: true,
      name: payload.name,
      full_name: payload.name,
    };
    if (payload.avatarUrl !== undefined) {
      metadata.avatar_url = payload.avatarUrl;
    }
    const { data, error } = await this.client.auth.updateUser({
      data: metadata,
    });
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
    if (!data.user) {
      throw new AppError("INTERNAL", "Profile update returned no user", 500);
    }

    const profilePatch: {
      full_name: string;
      profile_completed_at: string;
      avatar_url?: string | null;
    } = {
      full_name: payload.name,
      profile_completed_at: new Date().toISOString(),
    };
    if (payload.avatarUrl !== undefined) {
      profilePatch.avatar_url = payload.avatarUrl;
    }

    const { error: profileError } = await this.client
      .from("profiles")
      .update(profilePatch)
      .eq("id", data.user.id);
    if (profileError) {
      throw new AppError("EXTERNAL", profileError.message, 502, profileError);
    }

    return data.user;
  }

  async updateAvatarMetadata(avatarUrl: string | null): Promise<User> {
    logger.debug("auth.repository.updateAvatarMetadata");
    const { data, error } = await this.client.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
    if (!data.user) {
      throw new AppError("INTERNAL", "Avatar update returned no user", 500);
    }
    return data.user;
  }

  async signOut(): Promise<void> {
    logger.debug("auth.repository.signOut");
    const { error } = await this.client.auth.signOut({ scope: "local" });
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      throw new AppError("UNAUTHORIZED", error.message, 401, error);
    }
    return data.user;
  }

  onAuthStateChange(callback: AuthStateCallback): {
    subscription: Subscription;
  } {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange(callback);
    return { subscription };
  }
}

/** Browser-scoped auth repository (Client Components / providers). */
export function createBrowserAuthRepository(): AuthRepository {
  return new AuthRepository(createBrowserSupabaseClient());
}
