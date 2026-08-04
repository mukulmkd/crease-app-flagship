"use client";

import { Copy } from "lucide-react";

import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { cn, formatInrAmount } from "@/utils";
import {
  buildUpiAppOptions,
  isAppleTouchDevice,
  isLikelyUpiVpa,
} from "@/utils/upi";

type UpiPayActionsProps = {
  vpa: string | null | undefined;
  amountInr: number;
  payeeName?: string | null;
  note?: string | null;
};

/**
 * Opens a chosen UPI app via deeplink, with copy-VPA fallback.
 * Uses named-app schemes so iOS does not dump the player into WhatsApp.
 */
function UpiPayActions({
  vpa,
  amountInr,
  payeeName,
  note,
}: UpiPayActionsProps) {
  const trimmedVpa = vpa?.trim() ?? "";
  const ready = isLikelyUpiVpa(trimmedVpa) && amountInr > 0;
  const options = ready
    ? buildUpiAppOptions({
        vpa: trimmedVpa,
        amountInr,
        payeeName,
        note,
      })
    : [];
  const apple = isAppleTouchDevice();

  async function copyVpa() {
    if (!trimmedVpa) return;
    try {
      await navigator.clipboard.writeText(trimmedVpa);
      toast.success({ title: "UPI ID copied" });
    } catch {
      toast.error({ title: "Couldn’t copy UPI ID" });
    }
  }

  if (!ready || options.length === 0) {
    return (
      <p className="rounded-xl bg-surface-container-low px-3 py-3 text-xs text-muted-foreground">
        Ask Admin to set a valid UPI VPA in Settings before paying.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-foreground">
        Pay ₹{formatInrAmount(amountInr)} with
      </p>
      <div
        className={cn(
          "grid gap-2",
          options.length <= 3 ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        {options.map((app) => (
          <Button
            key={app.id}
            asChild
            variant={app.id === "generic" ? "secondary" : "default"}
            size="lg"
            className="min-h-12 px-2 text-[0.75rem]"
          >
            <a href={app.href}>{app.label}</a>
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{trimmedVpa}</span>
          {payeeName?.trim() ? ` · ${payeeName.trim()}` : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-12 shrink-0 px-3 text-xs"
          onClick={() => void copyVpa()}
        >
          <Copy aria-hidden className="size-3.5" />
          Copy
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {apple
          ? "Pick your UPI app above (iPhone won’t show a chooser). Then return here with UTR + screenshot."
          : "After paying in your UPI app, return here and submit UTR + screenshot."}
      </p>
    </div>
  );
}

export { UpiPayActions };
