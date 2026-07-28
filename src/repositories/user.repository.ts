import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import { mapProfile } from "@/repositories/shared/mappers";
import type { TablesUpdate } from "@/types/database";
import type { ProfileId } from "@/types/common";
import type { Profile } from "@/types/models";

/**
 * Profiles CRUD — MVP (no soft-delete column).
 */
export class UserRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async findById(id: ProfileId | string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "user.findById");
    return data ? mapProfile(data) : null;
  }

  async findByIdOrThrow(id: ProfileId | string): Promise<Profile> {
    const profile = await this.findById(id);
    if (!profile) throw new AppError("NOT_FOUND", "Profile not found", 404);
    return profile;
  }

  async findByPhone(phone: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    this.assertOk(error, "user.findByPhone");
    return data ? mapProfile(data) : null;
  }

  async update(
    id: ProfileId | string,
    input: TablesUpdate<"profiles">,
  ): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "user.update");
    return mapProfile(this.requireData(data, "user.update"));
  }
}

export function createBrowserUserRepository(): UserRepository {
  return new UserRepository(createBrowserSupabaseClient());
}
