import { AppError, isAppError, toAppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";

/**
 * Abstract service base — all domain services should extend this.
 * Encapsulates logging + error mapping so modules stay consistent.
 */
export abstract class BaseService {
  /** Dot-namespaced id, e.g. `team.service`. */
  protected abstract readonly serviceName: string;

  protected log(event: string, context?: Record<string, unknown>): void {
    logger.info(`${this.serviceName}.${event}`, context);
  }

  protected debug(event: string, context?: Record<string, unknown>): void {
    logger.debug(`${this.serviceName}.${event}`, context);
  }

  protected warn(event: string, context?: Record<string, unknown>): void {
    logger.warn(`${this.serviceName}.${event}`, context);
  }

  /**
   * Run a unit of work; map unknown errors to AppError and log.
   */
  protected async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.rethrow(error);
    }
  }

  protected rethrow(error: unknown): never {
    logger.error(`${this.serviceName}.error`, {
      message: error instanceof Error ? error.message : "unknown",
      code: isAppError(error) ? error.code : undefined,
    });
    throw isAppError(error) ? error : toAppError(error);
  }

  protected forbidden(message: string): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  protected conflict(message: string): AppError {
    return new AppError("CONFLICT", message, 409);
  }

  protected validation(message: string): AppError {
    return new AppError("VALIDATION", message, 400);
  }

  protected notFound(message: string): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }
}

/** Actor passed into mutating service methods. */
export type ServiceActor = {
  actorId: string;
};
