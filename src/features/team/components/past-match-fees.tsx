"use client";

import Link from "next/link";
import { CheckCircle2, CircleAlert, IndianRupee, Users } from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  chargeStatusLabel,
  SETTLEMENT_STATUS_LABELS,
} from "@/constants/domain/labels";
import {
  rollupCharges,
  isChargeSettled,
} from "@/features/payments/lib/charge-rollup";
import {
  ChargeCard,
  PaymentProofLinks,
  SummaryMetric,
} from "@/features/team/components/past-match-charge";
import { formatMatchDate } from "@/features/team/lib/match-format";
import type { SettlementCharge, WeekendSettlement } from "@/types/models";
import { formatInrAmount } from "@/utils";

type PastMatchFeesProps = {
  canManageSettlement: boolean;
  settlement: WeekendSettlement | null;
  settlementError: boolean;
  myCharge: SettlementCharge | null;
  charges: SettlementCharge[];
  nameFor: (userId: string) => string;
};

function PastMatchFees({
  canManageSettlement,
  settlement,
  settlementError,
  myCharge,
  charges,
  nameFor,
}: PastMatchFeesProps) {
  const rollup = rollupCharges(charges);
  const hasFees = charges.length > 0 || Boolean(myCharge);

  return (
    <section aria-labelledby="my-payment-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="my-payment-heading"
          className="font-heading text-xl font-bold uppercase"
        >
          {canManageSettlement ? "Fees & settlement" : "My payment"}
        </h2>
        {settlement ? (
          <StatusChip
            status={
              settlement.status === "settled"
                ? "success"
                : settlement.status === "cancelled"
                  ? "danger"
                  : "pending"
            }
          >
            {SETTLEMENT_STATUS_LABELS[settlement.status]}
          </StatusChip>
        ) : null}
      </div>

      {settlementError ? (
        <BodySm>Could not load fee details.</BodySm>
      ) : !settlement && !hasFees ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-3">
          <BodySm>No weekend fees were generated for this fixture yet.</BodySm>
          {canManageSettlement ? (
            <Button asChild variant="tonal" size="sm" className="mt-3">
              <Link href="/payments">Generate on Payments</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {settlement ? (
            <BodySm>
              Weekend of {formatMatchDate(settlement.weekStartDate)}
              {settlement.settledAt
                ? ` · closed ${formatMatchDate(settlement.settledAt.slice(0, 10))}`
                : null}
            </BodySm>
          ) : null}

          {canManageSettlement && charges.length > 0 ? (
            <div
              className="grid grid-cols-3 gap-2"
              aria-label="Match payment summary"
            >
              <SummaryMetric
                icon={IndianRupee}
                value={`₹${formatInrAmount(rollup.billedInr)}`}
                label="Billed"
              />
              <SummaryMetric
                icon={CheckCircle2}
                value={`₹${formatInrAmount(rollup.paidInr)}`}
                label="Collected"
              />
              <SummaryMetric
                icon={Users}
                value={
                  rollup.pendingCount > 0
                    ? `₹${formatInrAmount(rollup.pendingInr)}`
                    : "—"
                }
                label={
                  rollup.pendingCount > 0
                    ? `${rollup.pendingCount} unpaid`
                    : "All clear"
                }
              />
            </div>
          ) : null}

          {myCharge ? <ChargeCard charge={myCharge} highlight /> : null}

          {canManageSettlement && charges.length > 0 ? (
            <ul className="divide-y divide-outline-variant rounded-xl bg-surface-container-low">
              {charges.map((charge) => (
                <li key={charge.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <span className="truncate">
                          {nameFor(String(charge.userId))}
                        </span>
                        {isChargeSettled(charge) ? (
                          <span
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-success/20"
                            aria-label="Paid"
                          >
                            <CheckCircle2
                              className="size-5 fill-success/15 text-success"
                              aria-hidden
                            />
                          </span>
                        ) : charge.status === "pending" ? (
                          <span
                            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15"
                            aria-label="Payment pending"
                          >
                            <CircleAlert
                              className="size-5 fill-destructive/10 text-destructive"
                              aria-hidden
                            />
                          </span>
                        ) : null}
                      </p>
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
                    <div className="text-right">
                      <p className="font-heading text-lg font-bold tabular-nums">
                        ₹{formatInrAmount(charge.totalInr)}
                      </p>
                      <p
                        className={
                          charge.status === "pending"
                            ? "text-[0.65rem] font-bold tracking-wide text-destructive uppercase"
                            : isChargeSettled(charge)
                              ? "text-[0.65rem] font-bold tracking-wide text-success uppercase"
                              : "text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase"
                        }
                      >
                        {chargeStatusLabel(charge.status, charge.note)}
                      </p>
                    </div>
                  </div>
                  <PaymentProofLinks charge={charge} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}

export { PastMatchFees };
