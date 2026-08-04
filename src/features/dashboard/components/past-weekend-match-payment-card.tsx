"use client";

import Link from "next/link";

import { MATCH_STATUS_LABELS } from "@/constants/domain/labels";
import type { DashboardMatchPaymentSummary } from "@/services/dashboard.service";
import { formatMatchDate } from "@/features/team/lib/match-format";
import { formatInrAmount } from "@/utils";

type PastWeekendMatchPaymentCardProps = {
  summary: DashboardMatchPaymentSummary;
};

/** Admin home row — one past-weekend fixture with payment rollup. */
function PastWeekendMatchPaymentCard({
  summary,
}: PastWeekendMatchPaymentCardProps) {
  const title = summary.opposition?.trim() || "Opposition TBD";
  const statusLabel =
    MATCH_STATUS_LABELS[summary.status as keyof typeof MATCH_STATUS_LABELS] ??
    summary.status;

  let detail: string;
  if (!summary.hasCharges) {
    detail =
      summary.status === "completed" ? "Fees not generated yet" : statusLabel;
  } else if (summary.pendingCount > 0) {
    detail = `${summary.pendingCount} unpaid · ₹${formatInrAmount(summary.pendingInr)} due`;
  } else {
    detail = `All clear · ₹${formatInrAmount(summary.paidInr)} collected`;
  }

  return (
    <Link
      href={`/matches/${summary.matchId}`}
      className="flex min-h-16 items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3 transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <span className="min-w-0">
        <span className="block truncate font-heading text-lg font-semibold">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatMatchDate(summary.matchDate)} · {detail}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-heading text-xl font-bold tabular-nums">
          {summary.hasCharges ? `₹${formatInrAmount(summary.billedInr)}` : "—"}
        </span>
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {summary.hasCharges ? `${summary.playerCount} charged` : statusLabel}
        </span>
      </span>
    </Link>
  );
}

export { PastWeekendMatchPaymentCard };
