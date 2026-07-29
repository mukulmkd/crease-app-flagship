"use client";

import { Car, Trophy, Users } from "lucide-react";

import { BodySm } from "@/components/common";
import { ErrorState, LoadingState } from "@/components/feedback";
import type { MembershipRole } from "@/constants/domain/enums";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { useMatchSettlementReport } from "@/features/payments/hooks";
import { SummaryMetric } from "@/features/team/components/past-match-charge";
import { PastMatchFees } from "@/features/team/components/past-match-fees";
import {
  useCarpoolAssignments,
  useMatchPolls,
  useTournament,
} from "@/features/team/hooks";
import {
  formatMatchDate,
  formatMatchTime,
} from "@/features/team/lib/match-format";
import type { Match, WeekendSettlement } from "@/types/models";

type PastMatchReportProps = {
  match: Match;
  role: MembershipRole | null | undefined;
};

/**
 * Read-only historical match report — squad, fees, settlement, tournament.
 */
function PastMatchReport({ match, role }: PastMatchReportProps) {
  const pollsQuery = useMatchPolls(match.id);
  const carpoolQuery = useCarpoolAssignments(match.id);
  const settlementQuery = useMatchSettlementReport(match.id);
  const tournamentQuery = useTournament(match.tournamentId);
  const canManageSettlement = hasPermission(
    role,
    PERMISSIONS.SETTLEMENT_MANAGE,
  );

  if (
    pollsQuery.isLoading ||
    settlementQuery.isLoading ||
    carpoolQuery.isLoading
  ) {
    return <LoadingState label="Loading match report" />;
  }

  if (pollsQuery.isError) {
    return (
      <ErrorState
        title="Could not load squad"
        onRetry={() => void pollsQuery.refetch()}
      />
    );
  }

  const polls = pollsQuery.data;
  const played =
    polls?.roster.filter((row) =>
      polls.squadFinalized ? row.inSquad : row.availability === "yes",
    ) ?? [];
  const rides = carpoolQuery.data ?? [];
  const passengerIds = new Set(
    rides.flatMap((ride) => ride.passengerUserIds.map(String)),
  );
  const driverIds = new Set(rides.map((ride) => String(ride.driverUserId)));
  const carpoolCount = passengerIds.size;
  const ownTravelCount = played.filter(
    (row) => !passengerIds.has(row.userId) && !driverIds.has(row.userId),
  ).length;
  const report = settlementQuery.data;
  const settlement = report?.settlement ?? null;

  function travelLabel(userId: string): string {
    if (driverIds.has(userId)) {
      const ride = rides.find((r) => String(r.driverUserId) === userId);
      const count = ride?.passengerUserIds.length ?? 0;
      return count > 0 ? `Driver · ${count} pax` : "Driver";
    }
    if (passengerIds.has(userId)) return "Passenger";
    return "Own";
  }

  return (
    <div className="space-y-6">
      <section aria-label="Final squad" className="space-y-2">
        <h2 className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Final squad
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <SummaryMetric
            icon={Users}
            value={String(played.length)}
            label="Played"
          />
          <SummaryMetric
            icon={Car}
            value={String(carpoolCount)}
            label="Passengers"
          />
          <SummaryMetric
            icon={Users}
            value={String(ownTravelCount)}
            label="Own"
          />
        </div>
      </section>

      {match.classification === "tournament" ? (
        <TournamentBlock
          loading={tournamentQuery.isLoading}
          name={tournamentQuery.data?.name}
          plannedMatchCount={tournamentQuery.data?.plannedMatchCount}
          totalFeesInr={tournamentQuery.data?.totalFeesInr}
        />
      ) : null}

      <section aria-labelledby="who-played-heading">
        <h2
          id="who-played-heading"
          className="font-heading text-xl font-bold uppercase"
        >
          Who played
        </h2>
        <ul className="mt-2 divide-y divide-outline-variant rounded-xl bg-surface-container-low">
          {played.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No playing squad was recorded for this match.
            </li>
          ) : (
            played.map((row) => (
              <li
                key={row.userId}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {row.fullName?.trim() || "Player"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {travelLabel(row.userId)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <PastMatchFees
        canManageSettlement={canManageSettlement}
        settlement={settlement}
        settlementError={settlementQuery.isError}
        myCharge={report?.viewerCharge ?? null}
        charges={report?.charges ?? []}
        nameFor={(userId) =>
          polls?.roster.find((row) => row.userId === userId)?.fullName ??
          "Player"
        }
      />

      <section aria-labelledby="timeline-heading" className="space-y-2">
        <h2
          id="timeline-heading"
          className="font-heading text-xl font-bold uppercase"
        >
          Timeline
        </h2>
        <ol className="space-y-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
          {timelineItems(match, settlement).map((item) => (
            <li key={item.label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums">{item.value}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function TournamentBlock({
  loading,
  name,
  plannedMatchCount,
  totalFeesInr,
}: {
  loading: boolean;
  name?: string;
  plannedMatchCount?: number;
  totalFeesInr?: number;
}) {
  return (
    <section
      aria-label="Tournament"
      className="rounded-xl bg-surface-container-low px-4 py-3"
    >
      <p className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
        <Trophy className="size-3.5 text-primary" aria-hidden />
        Tournament
      </p>
      {loading ? (
        <BodySm className="mt-1">Loading tournament…</BodySm>
      ) : name ? (
        <div className="mt-1 space-y-0.5">
          <p className="font-heading text-xl font-bold uppercase">{name}</p>
          <BodySm>
            {plannedMatchCount} planned matches · ₹
            {Math.round(totalFeesInr ?? 0)} total fees
          </BodySm>
        </div>
      ) : (
        <BodySm className="mt-1">Tournament details unavailable.</BodySm>
      )}
    </section>
  );
}

function timelineItems(
  match: Match,
  settlement: Pick<WeekendSettlement, "notifiedAt" | "settledAt"> | null,
) {
  const items: Array<{ label: string; value: string }> = [];
  if (match.confirmedAt) {
    items.push({
      label: "Confirmed",
      value: formatMatchDate(match.confirmedAt.slice(0, 10)),
    });
  }
  items.push({
    label: "Kickoff",
    value: `${formatMatchDate(match.matchDate)} · ${formatMatchTime(match.startTime)}`,
  });
  if (match.pollsFrozen) {
    items.push({ label: "Availability frozen", value: "Yes" });
  }
  if (settlement?.notifiedAt) {
    items.push({
      label: "Fees notified",
      value: formatMatchDate(settlement.notifiedAt.slice(0, 10)),
    });
  }
  if (settlement?.settledAt) {
    items.push({
      label: "Weekend settled",
      value: formatMatchDate(settlement.settledAt.slice(0, 10)),
    });
  }
  return items;
}

export { PastMatchReport };
