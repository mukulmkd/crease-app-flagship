export type UpiPayParams = {
  /** Payee VPA from team settings (e.g. collector@upi). */
  vpa: string;
  amountInr: number;
  /** Display name in UPI apps. */
  payeeName?: string | null;
  /** Short transaction note (UPI apps often cap ~50 chars). */
  note?: string | null;
};

/** Named apps that expose a reliable custom scheme (needed on iOS). */
export type UpiAppId = "gpay" | "phonepe" | "paytm" | "generic";

export type UpiAppOption = {
  id: UpiAppId;
  label: string;
  href: string;
};

/** Loose check — must look like a VPA before building a deeplink. */
export function isLikelyUpiVpa(vpa: string | null | undefined): boolean {
  if (!vpa) return false;
  const trimmed = vpa.trim();
  return trimmed.includes("@") && trimmed.length >= 3 && !/\s/.test(trimmed);
}

/**
 * iOS (and iPadOS) never shows an app chooser for `upi://` — one registered
 * handler wins (often WhatsApp). Detect so we can prefer named-app schemes.
 */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  // iPadOS desktop UA
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function buildUpiQuery(params: UpiPayParams): string | null {
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

  return query.toString();
}

/**
 * Builds a standard UPI intent URI. On Android this usually opens a chooser;
 * on iOS it often launches WhatsApp — prefer {@link buildUpiAppOptions}.
 */
export function buildUpiPayUrl(params: UpiPayParams): string | null {
  const query = buildUpiQuery(params);
  return query ? `upi://pay?${query}` : null;
}

/** App-specific schemes so the player picks GPay / PhonePe / Paytm explicitly. */
export function buildUpiAppPayUrl(
  app: UpiAppId,
  params: UpiPayParams,
): string | null {
  const query = buildUpiQuery(params);
  if (!query) return null;

  switch (app) {
    case "gpay":
      return `gpay://upi/pay?${query}`;
    case "phonepe":
      return `phonepe://pay?${query}`;
    case "paytm":
      return `paytmmp://pay?${query}`;
    case "generic":
      return `upi://pay?${query}`;
  }
}

/**
 * Payment app buttons for the pay sheet.
 * On Apple devices, skip generic `upi://` (WhatsApp hijack).
 */
export function buildUpiAppOptions(params: UpiPayParams): UpiAppOption[] {
  const apps: Array<{ id: UpiAppId; label: string }> = [
    { id: "gpay", label: "GPay" },
    { id: "phonepe", label: "PhonePe" },
    { id: "paytm", label: "Paytm" },
  ];

  if (!isAppleTouchDevice()) {
    apps.push({ id: "generic", label: "Other UPI" });
  }

  const options: UpiAppOption[] = [];
  for (const app of apps) {
    const href = buildUpiAppPayUrl(app.id, params);
    if (href) options.push({ id: app.id, label: app.label, href });
  }
  return options;
}
