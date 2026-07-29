"use client";

import Link from "next/link";

import { Body, BodySm, SectionHeader, StatusChip } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { AppCard, AppCardContent } from "@/components/cards";
import { Button } from "@/components/ui/button";
import {
  MATCH_CLASSIFICATION_LABELS,
  MATCH_STATUS_LABELS,
} from "@/constants/domain/labels";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import {
  formatMatchDate,
  formatMatchTime,
  matchOpposition,
} from "@/features/team/lib/match-format";
import { useMatches, useMyMembership } from "@/features/team/hooks";
import { todayIsoDate } from "@/utils";
import type { Match } from "@/types/models";

function isUpcomingMatch(match: Match, today: string): boolean {
  return match.matchDate >= today && match.status !== "cancelled";
}

function isPastMatch(match: Match, today: string): boolean {
  return match.matchDate < today || match.status === "completed";
}

function MatchesListView() {
  const membershipQuery = useMyMembership();
  const matchesQuery = useMatches();
  const canCreate = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.MATCH_CREATE,
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
  const matches = matchesQuery.data?.items ?? [];
  const upcoming = matches
    .filter((match) => isUpcomingMatch(match, today))
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate));
  const past = matches
    .filter((match) => isPastMatch(match, today))
    .sort((a, b) => b.matchDate.localeCompare(a.matchDate));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Matches"
          description="Upcoming and past weekend fixtures"
        />
        {canCreate ? (
          <Button
            asChild
            variant="tonal"
            className="touch-target h-12 shrink-0"
          >
            <Link href="/matches/new">Create</Link>
          </Button>
        ) : null}
      </div>

      {matches.length === 0 ? (
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
      ) : (
        <>
          <MatchSection
            title="Upcoming"
            emptyTitle="No upcoming matches"
            emptyDescription={
              canCreate
                ? "Create fixtures for this weekend or a later weekend."
                : "Nothing scheduled yet."
            }
            matches={upcoming}
            highlight
          />
          <MatchSection
            title="Past"
            emptyTitle="No past matches"
            emptyDescription="Completed weekends will appear here."
            matches={past}
          />
        </>
      )}
    </div>
  );
}

type MatchSectionProps = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  matches: Match[];
  highlight?: boolean;
};

function MatchSection({
  title,
  emptyTitle,
  emptyDescription,
  matches,
  highlight = false,
}: MatchSectionProps) {
  return (
    <section
      aria-labelledby={`${title.toLowerCase()}-matches`}
      className="space-y-3"
    >
      <h2
        id={`${title.toLowerCase()}-matches`}
        className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {title}
        {matches.length > 0 ? ` · ${matches.length}` : ""}
      </h2>

      {matches.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => (
            <li key={match.id}>
              <Link href={`/matches/${match.id}`} className="block">
                <AppCard
                  interactive
                  variant={
                    highlight &&
                    (match.status === "confirmed" ||
                      match.status === "pending_confirm")
                      ? "hero"
                      : "default"
                  }
                >
                  <AppCardContent className="space-y-2 py-4">
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
                    <BodySm>
                      {MATCH_CLASSIFICATION_LABELS[match.classification]}
                      {" · "}
                      {matchOpposition(match)}
                    </BodySm>
                    <BodySm>
                      {formatMatchTime(match.startTime)}
                      {match.matchFeesInr != null
                        ? ` · ₹${match.matchFeesInr}`
                        : ""}
                      {match.pollsEnabled ? " · Polls on" : " · Polls off"}
                    </BodySm>
                  </AppCardContent>
                </AppCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { MatchesListView };
