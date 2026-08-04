/** Format INR for UI — keeps paise like 0.25 without trailing zeros on whole rupees. */
export function formatInrAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function roundInr(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Prepaid tournament total is split across planned matches, then each match
 * pool is divided equally among that match's playing squad at settlement.
 * Match (ground) fees are separate and added on top.
 */
export function tournamentMatchFeePoolInr(tournament: {
  totalFeesInr: number;
  plannedMatchCount: number;
}): number {
  if (tournament.plannedMatchCount <= 0) return 0;
  return roundInr(tournament.totalFeesInr / tournament.plannedMatchCount);
}

/** Squad share of a fee pool (₹0 when empty). */
export function squadFeeShareInr(poolInr: number, squadSize: number): number {
  if (poolInr <= 0 || squadSize <= 0) return 0;
  return roundInr(poolInr / squadSize);
}
