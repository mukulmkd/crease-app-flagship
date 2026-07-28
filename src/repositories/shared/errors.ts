import type { PostgrestError } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";

/**
 * Map PostgREST / Supabase errors to AppError. No business rules.
 */
export function mapSupabaseError(
  error: PostgrestError,
  context?: string,
): AppError {
  logger.error("repository.supabase_error", {
    context,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  if (error.code === "PGRST116") {
    return new AppError(
      "NOT_FOUND",
      error.message || "Resource not found",
      404,
      error,
    );
  }
  if (error.code === "23505") {
    return new AppError("CONFLICT", error.message || "Conflict", 409, error);
  }
  if (error.code === "23503") {
    return new AppError(
      "VALIDATION",
      error.message || "Invalid reference",
      400,
      error,
    );
  }
  if (error.code === "42501") {
    return new AppError("FORBIDDEN", error.message || "Forbidden", 403, error);
  }

  return new AppError(
    "EXTERNAL",
    error.message || "Database error",
    502,
    error,
  );
}

export function throwIfError(
  error: PostgrestError | null,
  context?: string,
): asserts error is null {
  if (error) {
    throw mapSupabaseError(error, context);
  }
}
