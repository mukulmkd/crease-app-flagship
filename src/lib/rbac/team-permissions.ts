import type { MembershipRole } from "@/constants/domain/enums";
import {
  hasPermission,
  PERMISSIONS,
  TEAM_PERMISSIONS,
  type Permission,
  type TeamPermission,
} from "@/constants/domain/team-permissions";
import { AppError } from "@/lib/errors";

export { hasPermission, PERMISSIONS };

export function canTeamPermission(
  role: MembershipRole | null | undefined,
  permission: TeamPermission,
): boolean {
  if (!role) return false;
  return (
    TEAM_PERMISSIONS.view_team === permission ||
    TEAM_PERMISSIONS.view_members === permission ||
    TEAM_PERMISSIONS.leave_team === permission ||
    (permission === TEAM_PERMISSIONS.update_team &&
      hasPermission(role, PERMISSIONS.TEAM_SETTINGS_EDIT)) ||
    (permission === TEAM_PERMISSIONS.invite_member &&
      hasPermission(role, PERMISSIONS.TEAM_MEMBER_ADD)) ||
    (permission === TEAM_PERMISSIONS.manage_members &&
      hasPermission(role, PERMISSIONS.TEAM_MEMBER_REMOVE))
  );
}

export function requireTeamPermission(
  role: MembershipRole | null | undefined,
  permission: TeamPermission,
): void {
  if (!canTeamPermission(role, permission)) {
    throw new AppError("FORBIDDEN", `Missing permission: ${permission}`, 403);
  }
}

export function requirePermission(
  role: MembershipRole | null | undefined,
  permission: Permission,
): void {
  if (!hasPermission(role, permission)) {
    throw new AppError("FORBIDDEN", `Missing permission: ${permission}`, 403);
  }
}
