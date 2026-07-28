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
import { useMatches, useMyMembership } from "@/features/team/hooks";

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

  const matches = matchesQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Matches"
          description="Weekend fixtures for Ranches Thunders"
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
              ? "Create Saturday and/or Sunday matches for the upcoming weekend."
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
        <ul className="space-y-3">
          {matches.map((match) => (
            <li key={match.id}>
              <Link href={`/matches/${match.id}`} className="block">
                <AppCard
                  interactive
                  variant={
                    match.status === "confirmed" ||
                    match.status === "pending_confirm"
                      ? "hero"
                      : "default"
                  }
                >
                  <AppCardContent className="space-y-2 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <Body className="font-semibold tracking-tight">
                        {match.matchDate}
                      </Body>
                      <StatusChip
                        status={
                          match.status === "confirmed" ? "success" : "pending"
                        }
                      >
                        {MATCH_STATUS_LABELS[match.status]}
                      </StatusChip>
                    </div>
                    <BodySm>
                      {MATCH_CLASSIFICATION_LABELS[match.classification]}
                      {match.opposition
                        ? ` · vs ${match.opposition}`
                        : " · TBD"}
                    </BodySm>
                    <BodySm>
                      {match.startTime === "06:30:00"
                        ? "6:30 AM"
                        : match.startTime === "09:30:00"
                          ? "9:30 AM"
                          : "Time TBD"}
                      {match.matchFeesInr != null
                        ? ` · ₹${match.matchFeesInr}`
                        : ""}
                    </BodySm>
                  </AppCardContent>
                </AppCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { MatchesListView };
