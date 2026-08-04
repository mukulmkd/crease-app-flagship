"use client";

import { BodySm, StatusChip } from "@/components/common";
import { SegmentedControl } from "@/components/forms/segmented-control";
import { Button } from "@/components/ui/button";
import { formatMatchDate } from "@/features/team/lib/match-format";
import type { SettlementOrganizerPayout } from "@/types/models";
import { formatInrAmount } from "@/utils";

type OrganizerPayoutSectionProps = {
  rangeLabel: string;
  matchCount: number;
  payouts: SettlementOrganizerPayout[];
  pendingCount: number;
  paidCount: number;
  isSharedMode: boolean;
  matchDateById: Map<string, string>;
  weekStartDate: string;
  modeLoading: boolean;
  settled: boolean;
  onModeChange: (mode: "per_match" | "shared") => void;
  onUpload: (input: {
    payout: SettlementOrganizerPayout | null;
    shared: boolean;
    amountInr: number;
    label: string;
  }) => void;
};

/**
 * Admin confirms same vs different organizers for the weekend, then uploads
 * proof — one payout when shared, or one per match when different.
 */
function OrganizerPayoutSection({
  rangeLabel,
  matchCount,
  payouts,
  pendingCount,
  paidCount,
  isSharedMode,
  matchDateById,
  weekStartDate,
  modeLoading,
  settled,
  onModeChange,
  onUpload,
}: OrganizerPayoutSectionProps) {
  if (payouts.length === 0) return null;

  const canChooseOrganizerSetup =
    matchCount > 1 && pendingCount > 0 && paidCount === 0 && !settled;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-semibold">Pay organizers</h2>
      <BodySm>
        Upload proof for{" "}
        <span className="font-medium">match / ground fees</span> paid to
        organizers. Prepaid tournament entry fees stay with the collector.
      </BodySm>

      {canChooseOrganizerSetup ? (
        <div className="space-y-2 rounded-xl bg-surface-container-low p-3">
          <p className="text-sm font-medium">
            Did the same organizer arrange both matches?
          </p>
          <BodySm>
            Same organizer → one payment for the weekend. Different organizers →
            upload proof per match.
          </BodySm>
          <SegmentedControl
            aria-label="Same or different organizers"
            size="sm"
            options={[
              { value: "shared", label: "Same organizer" },
              { value: "per_match", label: "Different organizers" },
            ]}
            value={isSharedMode ? "shared" : "per_match"}
            loading={modeLoading}
            onValueChange={(value) =>
              onModeChange(value as "per_match" | "shared")
            }
          />
        </div>
      ) : null}

      {!canChooseOrganizerSetup && matchCount > 1 && !settled ? (
        <BodySm>
          {isSharedMode
            ? "Paying both matches to one organizer."
            : "Paying each match to its own organizer."}
          {paidCount > 0
            ? " Mode is locked after the first proof is uploaded."
            : null}
        </BodySm>
      ) : null}

      <ul className="divide-y divide-outline-variant overflow-hidden rounded-xl bg-surface-container-low">
        {payouts.map((payout) => {
          const date = payout.matchId
            ? matchDateById.get(String(payout.matchId))
            : null;
          const label = payout.matchId
            ? formatMatchDate(date ?? weekStartDate)
            : `${rangeLabel} · one organizer`;
          const pending = payout.status === "pending";
          return (
            <li
              key={payout.id}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {payout.payeeName?.trim() ||
                    (pending ? "Organizer TBD" : "Organizer paid")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-xl font-bold tabular-nums">
                  ₹{formatInrAmount(payout.amountInr)}
                </p>
                {pending ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="tonal"
                    className="mt-1"
                    onClick={() =>
                      onUpload({
                        payout,
                        shared: false,
                        amountInr: payout.amountInr,
                        label,
                      })
                    }
                  >
                    Upload proof
                  </Button>
                ) : (
                  <StatusChip status="success">Paid</StatusChip>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export { OrganizerPayoutSection };
