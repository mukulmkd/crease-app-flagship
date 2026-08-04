"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Body, BodySm, StatusChip } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  MATCH_CLASSIFICATION_LABELS,
  MATCH_STATUS_LABELS,
} from "@/constants/domain/labels";
import {
  formatMatchDate,
  formatMatchTime,
  formatWeekendRange,
  matchOpposition,
} from "@/features/team/lib/match-format";
import {
  weekendDayLabels,
  type WeekendMatchBucket,
} from "@/features/team/lib/weekend-match-groups";
import { useTournaments } from "@/features/team/hooks";
import { cn, formatInrAmount, tournamentMatchFeePoolInr } from "@/utils";
import type { Match } from "@/types/models";

type WeekendMatchGroupProps = {
  weekend: WeekendMatchBucket;
  thisSaturday: string;
  defaultOpen: boolean;
  highlight: boolean;
  /** Match ids that still have at least one unpaid team charge. */
  feesPendingMatchIds: ReadonlySet<string>;
  /** Weekend payment summary — Admin only when a settlement exists. */
  settlementId?: string | null;
  showSummary?: boolean;
};

/** One Sat–Sun shell — header toggles the day rows underneath. */
function WeekendMatchGroup({
  weekend,
  thisSaturday,
  defaultOpen,
  highlight,
  feesPendingMatchIds,
  settlementId = null,
  showSummary = false,
}: WeekendMatchGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const tournamentsQuery = useTournaments();
  const tournamentFeePoolById = useMemo(() => {
    const map = new Map<string, number>();
    for (const tournament of tournamentsQuery.data?.items ?? []) {
      map.set(String(tournament.id), tournamentMatchFeePoolInr(tournament));
    }
    return map;
  }, [tournamentsQuery.data?.items]);

  const panelId = `weekend-${weekend.saturday}`;
  const range = formatWeekendRange(weekend.saturday, weekend.sunday);
  const title =
    weekend.saturday === thisSaturday ? `This weekend · ${range}` : range;
  const count =
    weekend.matches.length === 1
      ? "1 match"
      : `${weekend.matches.length} matches`;
  const weekendFeesPending = weekend.matches.some((match) =>
    feesPendingMatchIds.has(String(match.id)),
  );

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
            <span className="block font-heading text-lg font-bold tracking-tight uppercase">
              {title}
            </span>
            <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
              {count} · {weekendDayLabels(weekend)}
            </span>
            {weekendFeesPending ? (
              <span className="mt-2 inline-flex">
                <StatusChip status="danger">Team fees unpaid</StatusChip>
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {showSummary && settlementId ? (
          <Button
            asChild
            variant="tonal"
            size="sm"
            className="my-3 shrink-0 self-center"
          >
            <Link href={`/payments/${settlementId}`}>Summary</Link>
          </Button>
        ) : null}
      </div>

      {open ? (
        <ul
          id={panelId}
          className="divide-y divide-outline-variant border-t border-outline-variant"
        >
          {weekend.matches.map((match) => (
            <li key={match.id}>
              <MatchRow
                match={match}
                highlight={highlight}
                feesPending={feesPendingMatchIds.has(String(match.id))}
                tournamentFeePoolInr={
                  match.tournamentId
                    ? (tournamentFeePoolById.get(String(match.tournamentId)) ??
                      null)
                    : null
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MatchRow({
  match,
  highlight,
  feesPending,
  tournamentFeePoolInr,
}: {
  match: Match;
  highlight: boolean;
  feesPending: boolean;
  /** Prepaid tournament entry allocated to this fixture (null if N/A). */
  tournamentFeePoolInr: number | null;
}) {
  const hero =
    highlight &&
    (match.status === "confirmed" || match.status === "pending_confirm");

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "block px-4 py-3 transition-colors hover:bg-surface-container-highest/40",
        hero && "bg-primary/8 dark:bg-primary/15",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Body className="font-semibold tracking-tight">
          {formatMatchDate(match.matchDate)}
        </Body>
        <StatusChip
          status={
            match.status === "confirmed"
              ? "success"
              : match.status === "cancelled"
                ? "danger"
                : "pending"
          }
        >
          {MATCH_STATUS_LABELS[match.status]}
        </StatusChip>
      </div>
      <BodySm className="mt-1">
        {MATCH_CLASSIFICATION_LABELS[match.classification]}
        {" · "}
        {matchOpposition(match)}
      </BodySm>
      <BodySm className="mt-0.5">
        {formatMatchTime(match.startTime)}
        {" · "}
        {formatMatchFeesLine(match, tournamentFeePoolInr)}
        {showPollsFlag(match)
          ? match.pollsEnabled
            ? " · Polls on"
            : " · Polls off"
          : ""}
      </BodySm>
      {feesPending ? (
        <div className="mt-2">
          <StatusChip status="danger">
            Full payment yet to be received
          </StatusChip>
        </div>
      ) : null}
    </Link>
  );
}

/** Warmup: match fees only. Tournament: entry pool + match/ground fees. */
function formatMatchFeesLine(
  match: Match,
  tournamentFeePoolInr: number | null,
): string {
  const matchFeesLabel =
    match.matchFeesInr != null
      ? `₹${formatInrAmount(match.matchFeesInr)}`
      : "TBD";

  if (match.classification !== "tournament") {
    return `Match fees ${matchFeesLabel}`;
  }

  const entryLabel =
    tournamentFeePoolInr != null
      ? `₹${formatInrAmount(tournamentFeePoolInr)}`
      : "TBD";
  return `Tournament fee for this match ${entryLabel} · Match fees ${matchFeesLabel}`;
}

/** Polls matter before/during the fixture — not after complete/cancel. */
function showPollsFlag(match: Match): boolean {
  return match.status === "confirmed" || match.status === "pending_confirm";
}

export { WeekendMatchGroup };
