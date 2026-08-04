import type { MembershipRole } from "@/constants/domain/enums";
import {
  hasPermission,
  type Permission,
} from "@/constants/domain/team-permissions";
import { AppError } from "@/lib/errors";

export function requirePermission(
  role: MembershipRole | null | undefined,
  permission: Permission,
): void {
  if (!hasPermission(role, permission)) {
    throw new AppError("FORBIDDEN", `Missing permission: ${permission}`, 403);
  }
}
