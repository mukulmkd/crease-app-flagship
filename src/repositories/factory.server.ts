import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BaseRepository } from "@/repositories/base.repository";
import type { RepositoryConstructor } from "@/repositories/factory";

/**
 * Server-only repository factory — never import from Client Components.
 */
export async function createServerRepository<T extends BaseRepository>(
  Ctor: RepositoryConstructor<T>,
): Promise<T> {
  return new Ctor(await createServerSupabaseClient());
}
