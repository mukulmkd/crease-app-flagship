import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { BaseRepository } from "@/repositories/base.repository";

export type RepositoryConstructor<T extends BaseRepository> = new (
  client: TypedSupabaseClient,
) => T;
