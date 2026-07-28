import {
  AVAILABILITY_VOTES,
  CARPOOL_VOTES,
  CHARGE_STATUSES,
  MATCH_CLASSIFICATIONS,
  MATCH_STATUSES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  NOTIFICATION_TYPES,
  POLL_STATUSES,
  POLL_TYPES,
  SETTLEMENT_STATUSES,
  TOURNAMENT_STATUSES,
  type AvailabilityVote,
  type CarpoolVote,
  type ChargeStatus,
  type MatchClassification,
  type MatchStatus,
  type MembershipRole,
  type MembershipStatus,
  type NotificationType,
  type PollStatus,
  type PollType,
  type SettlementStatus,
  type TournamentStatus,
} from "@/constants/domain/enums";

/** Human-readable labels for UI — no logic. */

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  admin: "Admin",
  player: "Player",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
  left: "Left",
};

export const MATCH_CLASSIFICATION_LABELS: Record<MatchClassification, string> =
  {
    warmup: "Warmup",
    tournament: "Tournament",
  };

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  draft: "Draft",
  pending_confirm: "Pending confirm",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const POLL_TYPE_LABELS: Record<PollType, string> = {
  availability: "Availability",
  carpool: "Carpool",
};

export const POLL_STATUS_LABELS: Record<PollStatus, string> = {
  draft: "Draft",
  active: "Active",
  frozen: "Frozen",
  closed: "Closed",
};

export const AVAILABILITY_VOTE_LABELS: Record<AvailabilityVote, string> = {
  yes: "Playing",
  no: "Not playing",
};

export const CARPOOL_VOTE_LABELS: Record<CarpoolVote, string> = {
  carpool: "Carpool",
  self: "Coming on my own",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  open: "Open",
  collecting: "Collecting",
  settled: "Settled",
  cancelled: "Cancelled",
};

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  offline_paid: "Paid offline",
  waived: "Waived",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  match: "Match",
  poll: "Poll",
  payment: "Payment",
  fund: "Team fund",
  membership: "Membership",
  system: "System",
};

/** Guard helpers for exhaustive label maps */
export const LABELLED_MEMBERSHIP_ROLES = MEMBERSHIP_ROLES;
export const LABELLED_MEMBERSHIP_STATUSES = MEMBERSHIP_STATUSES;
export const LABELLED_MATCH_CLASSIFICATIONS = MATCH_CLASSIFICATIONS;
export const LABELLED_MATCH_STATUSES = MATCH_STATUSES;
export const LABELLED_TOURNAMENT_STATUSES = TOURNAMENT_STATUSES;
export const LABELLED_POLL_TYPES = POLL_TYPES;
export const LABELLED_POLL_STATUSES = POLL_STATUSES;
export const LABELLED_AVAILABILITY_VOTES = AVAILABILITY_VOTES;
export const LABELLED_CARPOOL_VOTES = CARPOOL_VOTES;
export const LABELLED_SETTLEMENT_STATUSES = SETTLEMENT_STATUSES;
export const LABELLED_CHARGE_STATUSES = CHARGE_STATUSES;
export const LABELLED_NOTIFICATION_TYPES = NOTIFICATION_TYPES;
