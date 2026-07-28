import type {
  MembershipRole,
  MembershipStatus,
} from "@/constants/domain/enums";
import {
  MEMBERSHIP_ROLE_LABELS,
  MEMBERSHIP_STATUS_LABELS,
} from "@/constants/domain/labels";

export function membershipRoleLabel(role: MembershipRole) {
  return MEMBERSHIP_ROLE_LABELS[role];
}

export function membershipStatusLabel(status: MembershipStatus) {
  return MEMBERSHIP_STATUS_LABELS[status];
}

export function membershipStatusChip(
  status: MembershipStatus,
): "success" | "pending" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "active":
      return "success";
    case "invited":
      return "pending";
    case "suspended":
      return "warning";
    case "left":
      return "neutral";
    default:
      return "neutral";
  }
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

export function shortMemberLabel(userId: string) {
  return `Member ${userId.slice(0, 8)}`;
}
