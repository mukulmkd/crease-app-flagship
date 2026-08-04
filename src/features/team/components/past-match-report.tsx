"use client";

import { Car, CarFront, UserRound, Users } from "lucide-react";

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
  MatchRidesSummary,
  MatchTravelList,
} from "@/features/team/components/match-travel-summary";
import { useCarpoolAssignments, useMatchPolls } from "@/features/team/hooks";
import { buildTravelIndex } from "@/features/team/lib/carpool-travel";
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
 * Read-only historical match report — squad, fees, settlement.
 * Tournament progress lives on the match detail ticket card above.
 */
function PastMatchReport({ match, role }: PastMatchReportProps) {
  const pollsQuery = useMatchPolls(match.id);
  const carpoolQuery = useCarpoolAssignments(match.id);
  const settlementQuery = useMatchSettlementReport(match.id);
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
  const carpoolAssigned = Boolean(match.carpoolAssignedAt);
  const travelIndex = buildTravelIndex(rides);
  // Squad travel breakdown — drivers + passengers + own ≈ played.
  const driverCount = played.filter((row) =>
    travelIndex.passengerCountByDriver.has(row.userId),
  ).length;
  const passengerCount = played.filter((row) =>
    travelIndex.driverByPassenger.has(row.userId),
  ).length;
  const ownTravelCount = played.filter(
    (row) =>
      !travelIndex.driverByPassenger.has(row.userId) &&
      !travelIndex.passengerCountByDriver.has(row.userId),
  ).length;
  const report = settlementQuery.data;
  const settlement = report?.settlement ?? null;
  const nameFor = (userId: string) =>
    polls?.roster.find((row) => row.userId === userId)?.fullName ?? null;

  return (
    <div className="space-y-6">
      <section aria-label="Final squad" className="space-y-2">
        <h2 className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Final squad
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryMetric
            icon={Users}
            value={String(played.length)}
            label="Played"
          />
          <SummaryMetric
            icon={CarFront}
            value={String(driverCount)}
            label="Drivers"
          />
          <SummaryMetric
            icon={Car}
            value={String(passengerCount)}
            label="Passengers"
          />
          <SummaryMetric
            icon={UserRound}
            value={String(ownTravelCount)}
            label="Own"
          />
        </div>
      </section>

      <MatchTravelList
        headingId="who-played-heading"
        heading="Who played"
        rows={played}
        emptyLabel="No playing squad was recorded for this match."
        rides={rides}
        assigned={carpoolAssigned}
        nameFor={nameFor}
      />

      <MatchRidesSummary
        rides={rides}
        assigned={carpoolAssigned}
        nameFor={nameFor}
      />

      <PastMatchFees
        canManageSettlement={canManageSettlement}
        settlement={settlement}
        settlementError={settlementQuery.isError}
        myCharge={report?.viewerCharge ?? null}
        charges={report?.charges ?? []}
        nameFor={(userId) => nameFor(userId) ?? "Player"}
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
