/**
 * Domain enums — Ranches Thunders MVP.
 * Roles: admin | player only.
 */

export const MEMBERSHIP_ROLES = ["admin", "player"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = [
  "active",
  "invited",
  "suspended",
  "left",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MATCH_CLASSIFICATIONS = ["warmup", "tournament"] as const;
export type MatchClassification = (typeof MATCH_CLASSIFICATIONS)[number];

export const MATCH_STATUSES = [
  "draft",
  "pending_confirm",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** Preferred kickoff slots (IST). */
export const MATCH_START_TIMES = ["06:30:00", "09:30:00"] as const;
export type MatchStartTime = (typeof MATCH_START_TIMES)[number];

export const TOURNAMENT_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const POLL_TYPES = ["availability", "carpool"] as const;
export type PollType = (typeof POLL_TYPES)[number];

export const POLL_STATUSES = ["draft", "active", "frozen", "closed"] as const;
export type PollStatus = (typeof POLL_STATUSES)[number];

export const AVAILABILITY_VOTES = ["yes", "no"] as const;
export type AvailabilityVote = (typeof AVAILABILITY_VOTES)[number];

export const CARPOOL_VOTES = ["carpool", "self"] as const;
export type CarpoolVote = (typeof CARPOOL_VOTES)[number];

/** Soft squad targets for availability yes-votes (production). */
export const SQUAD_MIN = 11;
export const SQUAD_MAX = 12;

/** Squad targets when team.demo_mode is on (4-player QA squad). */
export const DEMO_SQUAD_MIN = 4;
export const DEMO_SQUAD_MAX = 4;

/** Placeholder storage path accepted only while demo_mode is on. */
export const DEMO_PAYMENT_PROOF_PATH = "demo/placeholder";

export function squadLimits(demoMode: boolean): {
  min: number;
  max: number;
} {
  return demoMode
    ? { min: DEMO_SQUAD_MIN, max: DEMO_SQUAD_MAX }
    : { min: SQUAD_MIN, max: SQUAD_MAX };
}

/** Default carpool to-and-fro fee (INR). */
export const CARPOOL_FEE_INR = 100;

/** Demo mode carpool passenger fee / driver credit per passenger (INR). */
export const DEMO_CARPOOL_FEE_INR = 0.25;

export function carpoolFeeInr(demoMode: boolean): number {
  return demoMode ? DEMO_CARPOOL_FEE_INR : CARPOOL_FEE_INR;
}

/**
 * Note stamped on the fee collector's own charges. They hold the money, so the
 * line closes without a UPI transfer — it is not a written-off fee.
 */
export const COLLECTOR_AUTO_SETTLE_NOTE = "Collector so auto settled";

/** Default manual fund contribution ask (INR). */
export const FUND_CONTRIBUTION_ASK_INR = 300;

export const SETTLEMENT_STATUSES = [
  "open",
  "collecting",
  "settled",
  "cancelled",
] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const CHARGE_STATUSES = [
  "pending",
  "paid",
  "offline_paid",
  "waived",
] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];

export const REIMBURSEMENT_STATUSES = [
  "pending",
  "paid",
  "offline_paid",
] as const;
export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];

export const FUND_TXN_DIRECTIONS = ["credit", "debit"] as const;
export type FundTxnDirection = (typeof FUND_TXN_DIRECTIONS)[number];

export const CONTRIBUTION_ASK_STATUSES = ["draft", "sent", "closed"] as const;
export type ContributionAskStatus = (typeof CONTRIBUTION_ASK_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "match",
  "poll",
  "payment",
  "fund",
  "membership",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const AUDIT_ACTIONS = [
  "create",
  "update",
  "soft_delete",
  "restore",
  "status_change",
  "role_change",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Seeded MVP team. */
export const MVP_TEAM = {
  id: "a0000000-0000-4000-8000-000000000001",
  name: "Ranches Thunders",
  slug: "ranches-thunders",
} as const;
