import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { BaseRepository } from "@/repositories/base.repository";

export type RepositoryConstructor<T extends BaseRepository> = new (
  client: TypedSupabaseClient,
) => T;

/**
 * Browser repository factory — safe for Client Components.
 * Server factories live in `factory.server.ts`.
 */
export function createBrowserRepository<T extends BaseRepository>(
  Ctor: RepositoryConstructor<T>,
): T {
  return new Ctor(createBrowserSupabaseClient());
}

export function createRepositoryWithClient<T extends BaseRepository>(
  Ctor: RepositoryConstructor<T>,
  client: TypedSupabaseClient,
): T {
  return new Ctor(client);
}
