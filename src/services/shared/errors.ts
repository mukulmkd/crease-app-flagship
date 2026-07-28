import { AppError, isAppError, toAppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";

/** @deprecated Prefer BaseService.rethrow / helpers — kept for existing services. */
export function logServiceError(service: string, error: unknown): void {
  logger.error(`${service}.error`, {
    message: error instanceof Error ? error.message : "unknown",
    code: isAppError(error) ? error.code : undefined,
  });
}

/** @deprecated Prefer BaseService.run() */
export function rethrowServiceError(service: string, error: unknown): never {
  logServiceError(service, error);
  throw isAppError(error) ? error : toAppError(error);
}

export function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message, 403);
}

export function conflict(message: string): AppError {
  return new AppError("CONFLICT", message, 409);
}

export function validation(message: string): AppError {
  return new AppError("VALIDATION", message, 400);
}

export function notFound(message: string): AppError {
  return new AppError("NOT_FOUND", message, 404);
}
