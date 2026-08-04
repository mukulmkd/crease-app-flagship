import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client (anon key). Client Components / repositories only.
 */
export function createBrowserSupabaseClient(): TypedSupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      "NOT_CONFIGURED",
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      503,
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    getPublicEnv();

  return createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
