import type { MembershipRole } from "@/constants/domain/enums";

/**
 * MVP permission constants — Admin vs Player.
 * Services enforce; UI hides.
 */
export const PERMISSIONS = {
  TEAM_MEMBER_ADD: "team:member_add",
  TEAM_MEMBER_REMOVE: "team:member_remove",
  TEAM_SETTINGS_EDIT: "team:settings_edit",

  MATCH_CREATE: "match:create",
  MATCH_EDIT: "match:edit",
  MATCH_CONFIRM: "match:confirm",
  MATCH_POLL_OVERRIDE: "match:poll_override",

  TOURNAMENT_CREATE: "tournament:create",
  TOURNAMENT_EDIT: "tournament:edit",

  POLL_VOTE: "poll:vote",
  POLL_VIEW_RESULTS: "poll:view_results",

  PAYMENT_SUBMIT: "payment:submit",
  PAYMENT_MARK_OFFLINE: "payment:mark_offline",
  SETTLEMENT_MANAGE: "settlement:manage",

  FUND_VIEW: "fund:view",
  FUND_EXPENSE_ADD: "fund:expense_add",
  FUND_CONTRIBUTION_ASK: "fund:contribution_ask",

  NOTIFICATION_SEND: "notification:send",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.TEAM_MEMBER_ADD,
  PERMISSIONS.TEAM_MEMBER_REMOVE,
  PERMISSIONS.TEAM_SETTINGS_EDIT,
  PERMISSIONS.MATCH_CREATE,
  PERMISSIONS.MATCH_EDIT,
  PERMISSIONS.MATCH_CONFIRM,
  PERMISSIONS.MATCH_POLL_OVERRIDE,
  PERMISSIONS.TOURNAMENT_CREATE,
  PERMISSIONS.TOURNAMENT_EDIT,
  PERMISSIONS.POLL_VOTE,
  PERMISSIONS.POLL_VIEW_RESULTS,
  PERMISSIONS.PAYMENT_SUBMIT,
  PERMISSIONS.PAYMENT_MARK_OFFLINE,
  PERMISSIONS.SETTLEMENT_MANAGE,
  PERMISSIONS.FUND_VIEW,
  PERMISSIONS.FUND_EXPENSE_ADD,
  PERMISSIONS.FUND_CONTRIBUTION_ASK,
  PERMISSIONS.NOTIFICATION_SEND,
];

const PLAYER_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.POLL_VOTE,
  PERMISSIONS.POLL_VIEW_RESULTS,
  PERMISSIONS.PAYMENT_SUBMIT,
  PERMISSIONS.FUND_VIEW,
];

const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  player: PLAYER_PERMISSIONS,
};

export function hasPermission(
  role: MembershipRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}
