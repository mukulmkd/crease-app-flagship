import { AppError, isAppError } from "@/lib/errors/app-error";

export type Result<T, E = AppError> =
  { ok: true; data: T } | { ok: false; error: E };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function fromThrowable<T>(fn: () => T): Result<T> {
  try {
    return ok(fn());
  } catch (error) {
    return err(
      isAppError(error) ? error : new AppError("INTERNAL", String(error)),
    );
  }
}

export async function fromPromise<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return ok(await promise);
  } catch (error) {
    return err(
      isAppError(error)
        ? error
        : new AppError(
            "INTERNAL",
            error instanceof Error ? error.message : String(error),
            500,
            error,
          ),
    );
  }
}
