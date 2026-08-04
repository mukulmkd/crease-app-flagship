import type { MembershipRole } from "@/constants/domain/enums";
import { MEMBERSHIP_ROLE_LABELS } from "@/constants/domain/labels";

export function membershipRoleLabel(role: MembershipRole) {
  return MEMBERSHIP_ROLE_LABELS[role];
}

export function membershipRoleChip(
  role: MembershipRole,
): "accent" | "info" | "neutral" {
  switch (role) {
    case "admin":
      return "accent";
    case "player":
    default:
      return "neutral";
  }
}
