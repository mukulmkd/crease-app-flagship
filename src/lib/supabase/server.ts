import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

/**
 * Server Supabase client — Server Components, Route Handlers, Server Actions.
 */
export async function createServerSupabaseClient(): Promise<TypedSupabaseClient> {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      "NOT_CONFIGURED",
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      503,
    );
  }

  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    getPublicEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component context — proxy/middleware refreshes sessions.
          }
        },
      },
    },
  );
}

/** @deprecated Prefer createServerSupabaseClient() */
export async function createClient() {
  return createServerSupabaseClient();
}
