import { isAppError } from "@/lib/errors";

export function getTeamErrorMessage(error: unknown) {
  if (isAppError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
