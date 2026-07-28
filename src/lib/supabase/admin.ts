import { createClient } from "@supabase/supabase-js";

import {
  getServerEnv,
  hasServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

/**
 * Service-role client — server-only, bypasses RLS.
 * Never import this module from Client Components.
 */
export function createAdminSupabaseClient(): TypedSupabaseClient {
  if (!isSupabaseConfigured() || !hasServiceRoleKey()) {
    throw new AppError(
      "NOT_CONFIGURED",
      "Admin Supabase client requires SUPABASE_SERVICE_ROLE_KEY on the server.",
      503,
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
    getServerEnv();

  return createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
