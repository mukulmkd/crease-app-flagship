"use client";

import { StatusChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import { chargeStatusLabel } from "@/constants/domain/labels";
import { formatMatchDate } from "@/features/team/lib/match-format";
import type { AdminPlayerDues } from "@/services/payment.service";
import { cn, formatInrAmount } from "@/utils";

type AdminPlayerDuesCardProps = {
  player: AdminPlayerDues;
  onMarkOffline: (player: AdminPlayerDues) => void;
  /** Flatten into a weekend expand shell — no nested card chrome. */
  nested?: boolean;
};

/** Admin settlement row — one player's weekend total plus the matches billed. */
function AdminPlayerDuesCard({
  player,
  onMarkOffline,
  nested = false,
}: AdminPlayerDuesCardProps) {
  const outstanding = player.totalDueInr > 0;
  const displayAmount = outstanding ? player.totalDueInr : player.paidInr;

  return (
    <li
      className={cn(
        nested
          ? "bg-surface-container-lowest"
          : "overflow-hidden rounded-xl bg-surface-container-low",
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <p className="font-heading text-xl font-semibold">
            {player.fullName?.trim() || "Player"}
            {player.isCollector ? (
              <span className="ml-2 text-xs font-bold tracking-[0.08em] text-muted-foreground normal-case">
                · Collector
              </span>
            ) : null}
          </p>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums">
            ₹{formatInrAmount(displayAmount)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {player.matches.length === 1
              ? "1 match"
              : `${player.matches.length} matches`}{" "}
            · billed ₹{formatInrAmount(player.billedInr)}
            {outstanding && player.paidInr > 0
              ? ` · paid ₹${formatInrAmount(player.paidInr)}`
              : ""}
            {player.isCollector && !outstanding
              ? " · Collector so auto settled"
              : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusChip
            status={
              outstanding ? "danger" : player.isCollector ? "info" : "success"
            }
          >
            {outstanding
              ? "Unpaid"
              : player.isCollector
                ? "Auto settled"
                : "Settled"}
          </StatusChip>
          {outstanding && !player.isCollector ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMarkOffline(player)}
            >
              Offline paid
            </Button>
          ) : null}
        </div>
      </div>

      <ul className="divide-y divide-outline-variant border-t border-outline-variant">
        {player.matches.map((match) => (
          <li
            key={match.chargeId}
            className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                vs {match.opposition?.trim() || "Opposition TBD"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {formatMatchDate(match.matchDate)} ·{" "}
                {chargeStatusLabel(match.status, match.note)}
              </span>
            </span>
            <span className="shrink-0 font-heading text-lg font-bold tabular-nums">
              ₹{formatInrAmount(match.totalInr)}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export { AdminPlayerDuesCard };
