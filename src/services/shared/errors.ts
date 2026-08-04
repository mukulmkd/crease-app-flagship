import { AppError } from "@/lib/errors";

export function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message, 403);
}
