import type {
  ChargeStatus,
  MatchClassification,
  MatchStatus,
  MembershipRole,
  SettlementStatus,
} from "@/constants/domain/enums";

/** Human-readable labels for UI — no logic. */

export const MEMBERSHIP_ROLE_LABELS: Record<MembershipRole, string> = {
  admin: "Admin",
  player: "Player",
};

export const MATCH_CLASSIFICATION_LABELS: Record<MatchClassification, string> =
  {
    warmup: "Warmup",
    tournament: "Tournament",
  };

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  draft: "Draft",
  pending_confirm: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  open: "Open",
  collecting: "Collecting",
  settled: "Settled",
  cancelled: "Cancelled",
};

const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  offline_paid: "Paid offline",
  waived: "Waived",
};

/** Prefer charge.note when present (collector auto-settle). */
export function chargeStatusLabel(
  status: ChargeStatus,
  note?: string | null,
): string {
  if (note?.trim()) return note.trim();
  return CHARGE_STATUS_LABELS[status];
}
