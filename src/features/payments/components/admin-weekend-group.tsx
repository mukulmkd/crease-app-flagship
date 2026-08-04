"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import { AdminPlayerDuesCard } from "@/features/payments/components/admin-player-dues-card";
import { formatWeekendRange } from "@/features/team/lib/match-format";
import type {
  AdminPlayerDues,
  AdminReimbursementRow,
} from "@/services/payment.service";
import type {
  SettlementReimbursement,
  WeekendSettlement,
} from "@/types/models";
import { cn, formatInrAmount, nextWeekendDates } from "@/utils";

export type WeekendAdminBucket = {
  settlementId: string;
  weekStartDate: string;
  weekEndDate: string;
  players: AdminPlayerDues[];
  reimbursements: AdminReimbursementRow[];
  settlement: WeekendSettlement | null;
  /** Pending organizer payout rows — blocks Confirm settled. */
  organizerPendingCount: number;
};

type AdminWeekendGroupProps = {
  weekend: WeekendAdminBucket;
  defaultOpen: boolean;
  confirmPending: boolean;
  onMarkOffline: (player: AdminPlayerDues) => void;
  onReimburse: (input: {
    row: SettlementReimbursement;
    fullName: string | null;
  }) => void;
  onConfirm: () => Promise<void>;
};

/** One weekend shell for Admin settlement — players, drivers, confirm. */
function AdminWeekendGroup({
  weekend,
  defaultOpen,
  confirmPending,
  onMarkOffline,
  onReimburse,
  onConfirm,
}: AdminWeekendGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `admin-weekend-${weekend.settlementId}`;
  const unpaidTotal = weekend.players.reduce(
    (sum, player) => sum + player.totalDueInr,
    0,
  );
  const hasPending =
    unpaidTotal > 0 ||
    weekend.reimbursements.length > 0 ||
    weekend.organizerPendingCount > 0;
  const isSettled = weekend.settlement?.status === "settled";
  const nextAction =
    unpaidTotal > 0
      ? `Collect ₹${formatInrAmount(unpaidTotal)} from players`
      : weekend.reimbursements.length > 0
        ? `Pay ${weekend.reimbursements.length} pending reimbursement${weekend.reimbursements.length === 1 ? "" : "s"}`
        : weekend.organizerPendingCount > 0
          ? "Upload organizer payment proof"
          : weekend.settlement?.status === "collecting"
            ? "Confirm this weekend settled"
            : "No action needed";
  const thisSat = nextWeekendDates().saturday;
  const range = formatWeekendRange(weekend.weekStartDate, weekend.weekEndDate);
  const title =
    weekend.weekStartDate === thisSat ? `This weekend · ${range}` : range;

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low">
      <div className="flex items-stretch gap-1 pr-2">
        <button
          type="button"
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="min-w-0">
            <span className="block font-heading text-lg font-semibold tracking-tight">
              {title}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {weekend.players.length === 1
                ? "1 player"
                : `${weekend.players.length} players`}
              {weekend.reimbursements.length > 0
                ? ` · ${weekend.reimbursements.length} reimbursement${weekend.reimbursements.length === 1 ? "" : "s"}`
                : ""}
            </span>
            <span className="mt-2 inline-flex flex-wrap gap-2">
              {unpaidTotal > 0 ? (
                <StatusChip status="danger">
                  Unpaid ₹{formatInrAmount(unpaidTotal)}
                </StatusChip>
              ) : weekend.players.length > 0 ? (
                <StatusChip status="success">Fees collected</StatusChip>
              ) : null}
              {weekend.organizerPendingCount > 0 && unpaidTotal <= 0 ? (
                <StatusChip status="warning">
                  Organizer payout pending
                </StatusChip>
              ) : isSettled ? (
                <StatusChip status="success">Settled</StatusChip>
              ) : null}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {weekend.players.length > 0 ? (
          <Button
            asChild
            variant={
              weekend.organizerPendingCount > 0 && unpaidTotal <= 0
                ? "default"
                : "tonal"
            }
            size="sm"
            className="my-3 shrink-0 self-center"
          >
            <Link href={`/payments/${weekend.settlementId}`}>Summary</Link>
          </Button>
        ) : null}
      </div>

      {open ? (
        <div
          id={panelId}
          className="space-y-3 border-t border-outline-variant px-3 py-3"
        >
          {!isSettled ? (
            <div className="rounded-lg border-l-2 border-primary bg-primary/8 px-3 py-2">
              <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Next action
              </p>
              <p className="mt-0.5 text-sm font-semibold">{nextAction}</p>
            </div>
          ) : null}
          {weekend.players.length === 0 ? (
            <BodySm>No player charges for this weekend yet.</BodySm>
          ) : (
            <ul className="space-y-2">
              {weekend.players.map((player) => (
                <AdminPlayerDuesCard
                  key={`${player.settlementId}:${player.userId}`}
                  player={player}
                  onMarkOffline={onMarkOffline}
                  nested
                />
              ))}
            </ul>
          )}

          {weekend.reimbursements.length > 0 ? (
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Owed to drivers
              </p>
              <ul className="space-y-2">
                {weekend.reimbursements.map(({ reimbursement, fullName }) => (
                  <li
                    key={reimbursement.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest px-4 py-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {fullName?.trim() || "Player"}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ₹{formatInrAmount(reimbursement.amountInr)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="tonal"
                      onClick={() =>
                        onReimburse({ row: reimbursement, fullName })
                      }
                    >
                      Mark paid
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {weekend.settlement && weekend.players.length > 0 ? (
            <div className="space-y-2">
              {weekend.organizerPendingCount > 0 && unpaidTotal <= 0 ? (
                <BodySm>
                  Upload organizer payment proof on Summary before confirming.
                </BodySm>
              ) : null}
              <Button
                type="button"
                className="w-full"
                loading={confirmPending}
                disabled={hasPending}
                onClick={() => void onConfirm()}
              >
                Confirm settled
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { AdminWeekendGroup };
