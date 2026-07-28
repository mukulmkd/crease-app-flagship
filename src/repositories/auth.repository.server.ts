import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthRepository } from "@/repositories/auth.repository";

/**
 * Server-only factory — kept out of auth.repository.ts so Client Components
 * never import next/headers via the browser auth entry.
 */
export async function createServerAuthRepository(): Promise<AuthRepository> {
  return new AuthRepository(await createServerSupabaseClient());
}
