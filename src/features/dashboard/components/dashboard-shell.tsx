"use client";

import Link from "next/link";

import { Body, BodySm, SectionHeader } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { AppCard, AppCardContent } from "@/components/cards";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import {
  MATCH_CLASSIFICATION_LABELS,
  MATCH_STATUS_LABELS,
} from "@/constants/domain/labels";
import { useMatches, useMyMembership } from "@/features/team/hooks";
import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";

/**
 * MVP home — Admin quick actions + upcoming matches.
 */
function DashboardShell() {
  const membershipQuery = useMyMembership();
  const matchesQuery = useMatches();

  if (membershipQuery.isLoading) {
    return <LoadingState label="Loading home" />;
  }

  if (membershipQuery.isError) {
    return (
      <ErrorState
        title="Access denied"
        description="You must be an active Ranches Thunders member to use the app."
        onRetry={() => void membershipQuery.refetch()}
      />
    );
  }

  const role = membershipQuery.data?.role;
  const canCreate = hasPermission(role, PERMISSIONS.MATCH_CREATE);
  const canAdd = hasPermission(role, PERMISSIONS.TEAM_MEMBER_ADD);
  const upcoming =
    matchesQuery.data?.items.filter(
      (m) => m.status === "confirmed" || m.status === "pending_confirm",
    ) ?? [];

  return (
    <div className="space-y-6">
      <DashboardGreeting />

      {(canCreate || canAdd) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {canCreate ? (
            <Button asChild className="touch-target h-12">
              <Link href="/matches/new">Create weekend match</Link>
            </Button>
          ) : null}
          {canAdd ? (
            <Button asChild variant="tonal" className="touch-target h-12">
              <Link href="/team">Add player</Link>
            </Button>
          ) : null}
        </div>
      )}

      <SectionHeader title="Upcoming matches" />

      {matchesQuery.isLoading ? (
        <LoadingState label="Loading matches" />
      ) : upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming matches"
          description={
            canCreate
              ? "Create Saturday or Sunday fixtures to start polls."
              : "Wait for your admin to publish the weekend schedule."
          }
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.slice(0, 4).map((match) => (
            <li key={match.id}>
              <Link href={`/matches/${match.id}`}>
                <AppCard interactive variant="hero">
                  <AppCardContent className="space-y-1 py-4">
                    <Body className="font-semibold">{match.matchDate}</Body>
                    <BodySm>
                      {MATCH_CLASSIFICATION_LABELS[match.classification]} ·{" "}
                      {MATCH_STATUS_LABELS[match.status]}
                      {match.opposition ? ` · vs ${match.opposition}` : ""}
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

export { DashboardShell };
