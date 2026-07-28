export {
  createBrowserSupabaseClient,
  createClient,
} from "@/lib/supabase/client";
export { createAdminSupabaseClient } from "@/lib/supabase/admin";
export type { TypedSupabaseClient } from "@/lib/supabase/types";

/** Server client: `@/lib/supabase/server`. Session middleware: `@/lib/supabase/middleware`. */
