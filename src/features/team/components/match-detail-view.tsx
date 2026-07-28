"use client";

import Link from "next/link";

import { Body, BodySm, SectionHeader, StatusChip } from "@/components/common";
import { ErrorState, LoadingState } from "@/components/feedback";
import { toast } from "@/components/feedback/toast";
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
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useConfirmMatch,
  useMatch,
  useMyMembership,
} from "@/features/team/hooks";

type MatchDetailViewProps = {
  matchId: string;
};

function MatchDetailView({ matchId }: MatchDetailViewProps) {
  const membershipQuery = useMyMembership();
  const matchQuery = useMatch(matchId);
  const confirmMatch = useConfirmMatch();

  const canConfirm = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.MATCH_CONFIRM,
  );

  if (matchQuery.isLoading) {
    return <LoadingState label="Loading match" />;
  }

  if (matchQuery.isError || !matchQuery.data) {
    return (
      <ErrorState
        title="Match not found"
        onRetry={() => void matchQuery.refetch()}
      />
    );
  }

  const match = matchQuery.data;
  const needsConfirm =
    match.status === "draft" || match.status === "pending_confirm";

  return (
    <div className="space-y-5">
      <SectionHeader
        title={match.matchDate}
        description={MATCH_CLASSIFICATION_LABELS[match.classification]}
      />

      <AppCard variant="hero">
        <AppCardContent className="space-y-3 py-5">
          <div className="flex items-center justify-between gap-2">
            <Body className="font-semibold">
              {match.opposition ? `vs ${match.opposition}` : "Opposition TBD"}
            </Body>
            <StatusChip
              status={match.status === "confirmed" ? "success" : "pending"}
            >
              {MATCH_STATUS_LABELS[match.status]}
            </StatusChip>
          </div>
          <BodySm>
            {match.startTime === "06:30:00"
              ? "6:30 AM"
              : match.startTime === "09:30:00"
                ? "9:30 AM"
                : "Time TBD"}
          </BodySm>
          <BodySm>
            Fees:{" "}
            {match.matchFeesInr != null ? `₹${match.matchFeesInr}` : "TBD"}
          </BodySm>
          {match.groundMapsUrl ? (
            <Button asChild variant="link" className="h-10 px-0">
              <a href={match.groundMapsUrl} target="_blank" rel="noreferrer">
                Open ground location
              </a>
            </Button>
          ) : (
            <BodySm>Ground TBD</BodySm>
          )}
        </AppCardContent>
      </AppCard>

      {canConfirm && needsConfirm ? (
        <div className="space-y-2">
          <BodySm>
            Confirming opens availability and carpool polls and notifies the
            squad (push + WhatsApp group if configured).
          </BodySm>
          <Button
            type="button"
            className="touch-target h-12 w-full"
            disabled={confirmMatch.isPending}
            onClick={async () => {
              try {
                await confirmMatch.mutateAsync(match.id);
                toast.success({ title: "Match confirmed — polls are live" });
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            }}
          >
            {confirmMatch.isPending ? "Confirming…" : "Confirm match"}
          </Button>
        </div>
      ) : null}

      {match.status === "confirmed" ? (
        <BodySm>Polls are active. Players can vote until match day − 1.</BodySm>
      ) : null}

      <Button asChild variant="ghost" className="h-12 w-full">
        <Link href="/matches">Back to matches</Link>
      </Button>
    </div>
  );
}

export { MatchDetailView };
