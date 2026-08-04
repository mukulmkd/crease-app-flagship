"use client";

import { Copy, ExternalLink } from "lucide-react";

import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { formatInrAmount } from "@/utils";
import { buildUpiPayUrl, isLikelyUpiVpa } from "@/utils/upi";

type UpiPayActionsProps = {
  vpa: string | null | undefined;
  amountInr: number;
  payeeName?: string | null;
  note?: string | null;
};

/**
 * Opens the device UPI app via deeplink, with copy-VPA fallback.
 */
function UpiPayActions({
  vpa,
  amountInr,
  payeeName,
  note,
}: UpiPayActionsProps) {
  const trimmedVpa = vpa?.trim() ?? "";
  const ready = isLikelyUpiVpa(trimmedVpa) && amountInr > 0;
  const href = ready
    ? buildUpiPayUrl({
        vpa: trimmedVpa,
        amountInr,
        payeeName,
        note,
      })
    : null;

  async function copyVpa() {
    if (!trimmedVpa) return;
    try {
      await navigator.clipboard.writeText(trimmedVpa);
      toast.success({ title: "UPI ID copied" });
    } catch {
      toast.error({ title: "Couldn’t copy UPI ID" });
    }
  }

  if (!ready || !href) {
    return (
      <p className="rounded-xl bg-surface-container-low px-3 py-3 text-[0.7rem] text-muted-foreground">
        Ask Admin to set a valid UPI VPA in Settings before paying.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button asChild className="w-full" size="lg">
        <a href={href}>
          <ExternalLink aria-hidden />
          Pay ₹{formatInrAmount(amountInr)} with UPI
        </a>
      </Button>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2">
        <p className="min-w-0 truncate text-[0.7rem] text-muted-foreground">
          <span className="font-medium text-foreground">{trimmedVpa}</span>
          {payeeName?.trim() ? ` · ${payeeName.trim()}` : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2 text-[0.65rem]"
          onClick={() => void copyVpa()}
        >
          <Copy aria-hidden className="size-3.5" />
          Copy
        </Button>
      </div>
      <p className="text-[0.65rem] text-muted-foreground">
        After paying in your UPI app, return here and submit UTR + screenshot.
      </p>
    </div>
  );
}

export { UpiPayActions };
