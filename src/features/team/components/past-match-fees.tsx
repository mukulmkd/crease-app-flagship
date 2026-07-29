"use client";

import Link from "next/link";

import { BodySm, StatusChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  CHARGE_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
} from "@/constants/domain/labels";
import {
  ChargeCard,
  PaymentProofLinks,
} from "@/features/team/components/past-match-charge";
import { formatMatchDate } from "@/features/team/lib/match-format";
import type { SettlementCharge, WeekendSettlement } from "@/types/models";

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
  return (
    <section aria-labelledby="my-payment-heading" className="space-y-2">
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
      ) : !settlement && !myCharge ? (
        <div className="rounded-xl bg-surface-container-low px-4 py-3">
          <BodySm>No weekend fees were generated for this fixture yet.</BodySm>
          {canManageSettlement ? (
            <Button asChild variant="tonal" size="sm" className="mt-3">
              <Link href="/payments">Open Payments</Link>
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

          {myCharge ? <ChargeCard charge={myCharge} highlight /> : null}

          {canManageSettlement && charges.length > 0 ? (
            <ul className="divide-y divide-outline-variant rounded-xl bg-surface-container-low">
              {charges.map((charge) => (
                <li key={charge.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {nameFor(String(charge.userId))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Match ₹{Math.round(charge.matchFeeShareInr)}
                        {charge.carpoolFeeInr > 0
                          ? ` + carpool ₹${Math.round(charge.carpoolFeeInr)}`
                          : ""}
                        {charge.carpoolCreditInr > 0
                          ? ` − credit ₹${Math.round(charge.carpoolCreditInr)}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-lg font-bold tabular-nums">
                        ₹{Math.round(charge.totalInr)}
                      </p>
                      <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                        {CHARGE_STATUS_LABELS[charge.status]}
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
