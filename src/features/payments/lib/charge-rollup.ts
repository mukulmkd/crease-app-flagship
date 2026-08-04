import { COLLECTOR_AUTO_SETTLE_NOTE } from "@/constants/domain/enums";
import type { SettlementCharge } from "@/types/models";

export type MatchPaymentRollup = {
  billedInr: number;
  paidInr: number;
  pendingInr: number;
  waivedInr: number;
  /** Collector's own share — counted as collected, not written off. */
  autoSettledInr: number;
  pendingCount: number;
  paidCount: number;
  playerCount: number;
};

/**
 * The fee collector holds the cash, so their auto-settled line is money in
 * hand — never a waiver.
 */
function isCollectorAutoSettled(charge: SettlementCharge): boolean {
  return (
    charge.status === "waived" && charge.note === COLLECTOR_AUTO_SETTLE_NOTE
  );
}

/** Paid, offline paid, or collector auto-settled — show as collected. */
export function isChargeSettled(charge: SettlementCharge): boolean {
  return (
    charge.status === "paid" ||
    charge.status === "offline_paid" ||
    isCollectorAutoSettled(charge)
  );
}

/** Aggregate settlement charges for one match (or any charge list). */
export function rollupCharges(charges: SettlementCharge[]): MatchPaymentRollup {
  let billedInr = 0;
  let paidInr = 0;
  let pendingInr = 0;
  let waivedInr = 0;
  let autoSettledInr = 0;
  let pendingCount = 0;
  let paidCount = 0;

  for (const charge of charges) {
    const due = Math.max(0, charge.totalInr);
    billedInr += due;
    if (charge.status === "pending") {
      pendingInr += due;
      pendingCount += 1;
    } else if (charge.status === "paid" || charge.status === "offline_paid") {
      paidInr += due;
      paidCount += 1;
    } else if (isCollectorAutoSettled(charge)) {
      autoSettledInr += due;
      paidInr += due;
      paidCount += 1;
    } else if (charge.status === "waived") {
      waivedInr += due;
    }
  }

  return {
    billedInr,
    paidInr,
    pendingInr,
    waivedInr,
    autoSettledInr,
    pendingCount,
    paidCount,
    playerCount: charges.length,
  };
}
