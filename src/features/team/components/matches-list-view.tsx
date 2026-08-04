"use client";

import Link from "next/link";
import { useState } from "react";

import { SectionHeader } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { SegmentedControl } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { WeekendMatchGroup } from "@/features/team/components/weekend-match-group";
import { TournamentsListView } from "@/features/team/components/tournaments-list-view";
import { useMatchCollectionStatuses } from "@/features/payments/hooks";
import { groupMatchesByWeekend } from "@/features/team/lib/weekend-match-groups";
import type { WeekendMatchBucket } from "@/features/team/lib/weekend-match-groups";
import { useMatches, useMyMembership } from "@/features/team/hooks";
import { nextWeekendDates, todayIsoDate } from "@/utils";
import type { Match } from "@/types/models";

type MainTab = "matches" | "tournaments";

function isUpcomingMatch(match: Match, today: string): boolean {
  return match.matchDate >= today && match.status !== "cancelled";
}

function isPastMatch(match: Match, today: string): boolean {
  return match.matchDate < today || match.status === "completed";
}

function MatchesListView() {
  const [tab, setTab] = useState<MainTab>("matches");
  const membershipQuery = useMyMembership();
  const canCreate = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.MATCH_CREATE,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title={tab === "matches" ? "Matches" : "Tournaments"}
          description={
            tab === "matches"
              ? "Upcoming and past weekend fixtures"
              : "Active and past tournaments · remaining after fees settle"
          }
        />
        {tab === "matches" && canCreate ? (
          <Button
            asChild
            variant="tonal"
            className="touch-target h-12 shrink-0"
          >
            <Link href="/matches/new">Create</Link>
          </Button>
        ) : null}
      </div>

      <SegmentedControl
        aria-label="Matches or tournaments"
        value={tab}
        onValueChange={(value) => setTab(value as MainTab)}
        options={[
          { value: "matches", label: "Matches" },
          { value: "tournaments", label: "Tournaments" },
        ]}
      />

      {tab === "matches" ? <MatchesTabBody /> : <TournamentsListView />}
    </div>
  );
}

function MatchesTabBody() {
  const membershipQuery = useMyMembership();
  const matchesQuery = useMatches();
  const collectionQuery = useMatchCollectionStatuses();
  const canCreate = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.MATCH_CREATE,
  );
  const canManageSettlement = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.SETTLEMENT_MANAGE,
  );

  if (matchesQuery.isLoading || membershipQuery.isLoading) {
    return <LoadingState label="Loading matches" />;
  }

  if (matchesQuery.isError) {
    return (
      <ErrorState
        title="Could not load matches"
        onRetry={() => void matchesQuery.refetch()}
      />
    );
  }

  const today = todayIsoDate();
  const thisSaturday = nextWeekendDates().saturday;
  const matches = matchesQuery.data?.items ?? [];
  const collection = collectionQuery.data ?? [];
  const feesPendingMatchIds = new Set(
    collection.filter((row) => row.feesPending).map((row) => row.matchId),
  );
  const settlementIdByMatchId = new Map(
    collection.map((row) => [row.matchId, row.settlementId]),
  );
  const upcoming = groupMatchesByWeekend(
    matches.filter((match) => isUpcomingMatch(match, today)),
  ).sort((a, b) => a.saturday.localeCompare(b.saturday));
  const past = groupMatchesByWeekend(
    matches.filter((match) => isPastMatch(match, today)),
  ).sort((a, b) => b.saturday.localeCompare(a.saturday));

  if (matches.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description={
          canCreate
            ? "Create Saturday and/or Sunday matches for any upcoming weekend."
            : "Your admin will publish weekend matches here."
        }
        actionLabel={canCreate ? "Create match" : undefined}
        onAction={
          canCreate
            ? () => {
                window.location.href = "/matches/new";
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <MatchSection
        title="Upcoming"
        emptyTitle="No upcoming matches"
        emptyDescription={
          canCreate
            ? "Create fixtures for this weekend or a later weekend."
            : "Nothing scheduled yet."
        }
        weekends={upcoming}
        thisSaturday={thisSaturday}
        feesPendingMatchIds={feesPendingMatchIds}
        settlementIdByMatchId={settlementIdByMatchId}
        showSummary={false}
        defaultOpenAll
        highlight
      />
      <MatchSection
        title="Past"
        emptyTitle="No past matches"
        emptyDescription="Completed weekends will appear here."
        weekends={past}
        thisSaturday={thisSaturday}
        feesPendingMatchIds={feesPendingMatchIds}
        settlementIdByMatchId={settlementIdByMatchId}
        showSummary={canManageSettlement}
      />
    </>
  );
}

type MatchSectionProps = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  weekends: WeekendMatchBucket[];
  thisSaturday: string;
  feesPendingMatchIds: ReadonlySet<string>;
  settlementIdByMatchId: ReadonlyMap<string, string>;
  showSummary: boolean;
  defaultOpenAll?: boolean;
  highlight?: boolean;
};

function MatchSection({
  title,
  emptyTitle,
  emptyDescription,
  weekends,
  thisSaturday,
  feesPendingMatchIds,
  settlementIdByMatchId,
  showSummary,
  defaultOpenAll = false,
  highlight = false,
}: MatchSectionProps) {
  const matchCount = weekends.reduce((sum, w) => sum + w.matches.length, 0);

  return (
    <section
      aria-labelledby={`${title.toLowerCase()}-matches`}
      className="space-y-3"
    >
      <h2
        id={`${title.toLowerCase()}-matches`}
        className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {title}
        {matchCount > 0 ? ` · ${matchCount}` : ""}
      </h2>

      {weekends.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {weekends.map((weekend, index) => {
            const settlementId =
              weekend.matches
                .map((match) => settlementIdByMatchId.get(String(match.id)))
                .find(Boolean) ?? null;
            return (
              <li key={weekend.saturday}>
                <WeekendMatchGroup
                  weekend={weekend}
                  thisSaturday={thisSaturday}
                  defaultOpen={
                    defaultOpenAll ||
                    weekend.saturday === thisSaturday ||
                    index === 0
                  }
                  highlight={highlight}
                  feesPendingMatchIds={feesPendingMatchIds}
                  settlementId={settlementId}
                  showSummary={showSummary && Boolean(settlementId)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export { MatchesListView };
