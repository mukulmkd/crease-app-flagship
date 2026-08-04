export type UpiPayParams = {
  /** Payee VPA from team settings (e.g. collector@upi). */
  vpa: string;
  amountInr: number;
  /** Display name in UPI apps. */
  payeeName?: string | null;
  /** Short transaction note (UPI apps often cap ~50 chars). */
  note?: string | null;
};

/** Loose check — must look like a VPA before building a deeplink. */
export function isLikelyUpiVpa(vpa: string | null | undefined): boolean {
  if (!vpa) return false;
  const trimmed = vpa.trim();
  return trimmed.includes("@") && trimmed.length >= 3 && !/\s/.test(trimmed);
}

/**
 * Builds a standard UPI intent URI for installed apps (GPay, PhonePe, etc.).
 * Players still submit UTR + screenshot in Crease after paying.
 */
export function buildUpiPayUrl(params: UpiPayParams): string | null {
  if (!isLikelyUpiVpa(params.vpa)) return null;
  if (!Number.isFinite(params.amountInr) || params.amountInr <= 0) return null;

  const query = new URLSearchParams();
  query.set("pa", params.vpa.trim());
  const payee = params.payeeName?.trim();
  if (payee) query.set("pn", payee);
  // Fixed 2 decimals — most UPI apps expect this form.
  query.set("am", params.amountInr.toFixed(2));
  query.set("cu", "INR");
  const note = params.note?.trim();
  if (note) query.set("tn", note.slice(0, 50));

  return `upi://pay?${query.toString()}`;
}
