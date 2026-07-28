/**
 * Crease Supabase platform — single import surface for future modules.
 *
 * Plug-in contract:
 * 1. Extend BaseRepository (data access only)
 * 2. Extend BaseService (business rules; compose repositories)
 * 3. Use TypedSupabaseClient — never create raw Supabase clients in features
 * 4. Throw AppError / use Result for failures
 * 5. Log via logger (no PII)
 *
 * Flow: UI → Hook → Service → Repository → Supabase
 *
 * Server-only: import from `@/lib/supabase/server`, `@/repositories/server`,
 * or `@/repositories/factory.server` — do not re-export those here (keeps
 * Client Components free of next/headers).
 */

export {
  getPublicEnv,
  getServerEnv,
  isSupabaseConfigured,
  assertSupabaseConfigured,
  hasServiceRoleKey,
  type PublicEnv,
  type ServerEnv,
} from "@/lib/env";

export {
  AppError,
  isAppError,
  toAppError,
  ok,
  err,
  fromPromise,
  fromThrowable,
  type Result,
  type ErrorCode,
} from "@/lib/errors";

export { logger } from "@/lib/logging";

export {
  createBrowserSupabaseClient,
  createAdminSupabaseClient,
  type TypedSupabaseClient,
} from "@/lib/supabase";

export { BaseRepository } from "@/repositories/base.repository";
export {
  createBrowserRepository,
  createRepositoryWithClient,
  type RepositoryConstructor,
} from "@/repositories/factory";
export type { RepositoryListParams } from "@/repositories/shared/pagination";
export { mapSupabaseError, throwIfError } from "@/repositories/shared/errors";

export { BaseService, type ServiceActor } from "@/services/base.service";

export {
  AuthProvider,
  SessionProvider,
  useAuth,
  useSession,
} from "@/providers/auth-provider";
