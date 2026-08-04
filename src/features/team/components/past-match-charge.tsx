"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, IndianRupee } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { chargeStatusLabel } from "@/constants/domain/labels";
import { isChargeSettled } from "@/features/payments/lib/charge-rollup";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SettlementCharge } from "@/types/models";
import { formatInrAmount } from "@/utils";

function SummaryMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl bg-surface-container-low px-2 py-3 text-center">
      <Icon className="size-4 text-primary" aria-hidden />
      <p className="mt-1 font-heading text-xl font-bold tabular-nums">
        {value}
      </p>
      <p className="text-[0.65rem] font-bold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}

function ChargeCard({
  charge,
  highlight = false,
}: {
  charge: SettlementCharge;
  highlight?: boolean;
}) {
  const settled = isChargeSettled(charge);

  return (
    <div
      className={
        highlight
          ? "space-y-2 rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-3"
          : "space-y-2 rounded-xl bg-surface-container-low px-4 py-3"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="size-4 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Your share</p>
            <p className="text-xs text-muted-foreground">
              Match ₹{formatInrAmount(charge.matchFeeShareInr)}
              {charge.carpoolFeeInr > 0
                ? ` + carpool ₹${formatInrAmount(charge.carpoolFeeInr)}`
                : ""}
              {charge.carpoolCreditInr > 0
                ? ` − carpool credit ₹${formatInrAmount(charge.carpoolCreditInr)}`
                : ""}
              {charge.tournamentCreditInr > 0
                ? ` − tournament credit ₹${formatInrAmount(charge.tournamentCreditInr)}`
                : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl font-bold tabular-nums">
            ₹{formatInrAmount(charge.totalInr)}
          </p>
          <p className="inline-flex items-center gap-1 text-[0.65rem] font-semibold tracking-wide uppercase">
            {settled ? (
              <CheckCircle2 className="size-3 text-success" aria-hidden />
            ) : null}
            {chargeStatusLabel(charge.status, charge.note)}
          </p>
        </div>
      </div>
      <PaymentProofLinks charge={charge} />
      {charge.status === "pending" ? (
        <Button asChild variant="tonal" size="sm" className="w-full">
          <Link href="/payments">Pay now</Link>
        </Button>
      ) : null}
    </div>
  );
}

function PaymentProofLinks({ charge }: { charge: SettlementCharge }) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!charge.screenshotPath) {
        setProofUrl(null);
        return;
      }
      const client = createBrowserSupabaseClient();
      const { data } = await client.storage
        .from("payment-proofs")
        .createSignedUrl(charge.screenshotPath, 60 * 30);
      if (!cancelled) setProofUrl(data?.signedUrl ?? null);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [charge.screenshotPath]);

  if (!charge.utr && !proofUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {charge.utr ? (
        <span className="text-muted-foreground">
          UTR <span className="font-medium text-foreground">{charge.utr}</span>
        </span>
      ) : null}
      {proofUrl ? (
        <a
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline"
        >
          Screenshot
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

export { ChargeCard, PaymentProofLinks, SummaryMetric };
