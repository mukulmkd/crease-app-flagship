"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  IndianRupee,
  MapPin,
  Pencil,
} from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { ErrorState, LoadingState } from "@/components/feedback";
import { toast } from "@/components/feedback/toast";
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
import { EditMatchSheet } from "@/features/team/components/edit-match-sheet";
import { MatchCarpoolAssign } from "@/features/team/components/match-carpool-assign";
import { MatchPollPanel } from "@/features/team/components/match-poll-panel";
import { PastMatchReport } from "@/features/team/components/past-match-report";
import {
  useCancelMatch,
  useCompleteMatch,
  useConfirmMatch,
  useEnableMatchPolls,
  useFreezePolls,
  useMatch,
  useMyMembership,
  useUnfreezePolls,
} from "@/features/team/hooks";
import {
  formatMatchDate,
  formatMatchTime,
  matchOpposition,
} from "@/features/team/lib/match-format";
import { isMatchStartedIst, todayIsoDate } from "@/utils";
import { useState } from "react";

type MatchDetailViewProps = {
  matchId: string;
};

function MatchDetailView({ matchId }: MatchDetailViewProps) {
  const router = useRouter();
  const membershipQuery = useMyMembership();
  const matchQuery = useMatch(matchId);
  const confirmMatch = useConfirmMatch();
  const freezePolls = useFreezePolls();
  const unfreezePolls = useUnfreezePolls();
  const enablePolls = useEnableMatchPolls();
  const completeMatch = useCompleteMatch();
  const cancelMatch = useCancelMatch();
  const [editOpen, setEditOpen] = useState(false);
  const [carpoolOpen, setCarpoolOpen] = useState(false);

  const role = membershipQuery.data?.role;
  const canConfirm = hasPermission(role, PERMISSIONS.MATCH_CONFIRM);
  const canEdit = hasPermission(role, PERMISSIONS.MATCH_EDIT);
  const canFreeze = hasPermission(role, PERMISSIONS.MATCH_POLL_OVERRIDE);

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
  const today = todayIsoDate();
  const isUpcoming =
    match.matchDate >= today &&
    match.status !== "cancelled" &&
    match.status !== "completed";
  // Admin may edit upcoming fixtures only; past matches stay read-only.
  const showEdit = canEdit && isUpcoming;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2"
          aria-label="Go back"
          onClick={() => {
            // Deep links (share / notification) have no in-app history to pop.
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/matches");
          }}
        >
          <ArrowLeft aria-hidden />
        </Button>
        {showEdit ? (
          <Button
            type="button"
            variant="tonal"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil aria-hidden />
            Edit
          </Button>
        ) : null}
      </div>

      <article className="-mx-4 overflow-hidden bg-[#082417] text-white md:mx-0 md:rounded-2xl">
        <div className="space-y-5 px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[#c9f64b] uppercase">
              <CalendarDays className="size-4" aria-hidden />
              {formatMatchDate(match.matchDate)} ·{" "}
              {formatMatchTime(match.startTime)} IST
            </span>
            <StatusChip
              status={match.status === "confirmed" ? "success" : "pending"}
            >
              {MATCH_STATUS_LABELS[match.status]}
            </StatusChip>
          </div>

          <div>
            <h1 className="font-heading text-5xl leading-none font-extrabold tracking-tight uppercase">
              {matchOpposition(match)}
            </h1>
            <p className="mt-2 text-sm font-semibold tracking-[0.08em] text-white/60 uppercase">
              {MATCH_CLASSIFICATION_LABELS[match.classification]}
            </p>
          </div>

          <div className="grid gap-3 border-t border-white/15 pt-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-white/75">
              <MapPin className="size-4 text-[#c9f64b]" aria-hidden />
              {match.groundMapsUrl ? (
                <a
                  href={match.groundMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Open in Maps
                </a>
              ) : (
                "Ground TBD"
              )}
            </div>
            <div className="flex items-center gap-2 text-white/75">
              <IndianRupee className="size-4 text-[#c9f64b]" aria-hidden />
              Match fee{" "}
              {match.matchFeesInr != null ? `₹${match.matchFeesInr}` : "TBD"}
            </div>
          </div>
        </div>
      </article>

      {match.status === "confirmed" && match.pollsEnabled && isUpcoming ? (
        <MatchPollPanel matchId={match.id} role={role} />
      ) : !isUpcoming && match.status !== "cancelled" ? (
        <PastMatchReport match={match} role={role} />
      ) : match.status === "confirmed" && !match.pollsEnabled ? (
        <BodySm>
          Match is confirmed, but polls are off. Enable polls when you want the
          squad to vote.
        </BodySm>
      ) : match.status === "cancelled" ? (
        <BodySm>This match was cancelled.</BodySm>
      ) : (
        <BodySm>
          {match.pollsEnabled
            ? "Confirm to open availability and carpool polls for the squad."
            : "Confirm the fixture now. Polls stay off until you enable them."}
        </BodySm>
      )}

      {canConfirm &&
      isUpcoming &&
      match.status === "confirmed" &&
      !match.pollsEnabled ? (
        <Button
          type="button"
          className="w-full"
          loading={enablePolls.isPending}
          onClick={async () => {
            try {
              await enablePolls.mutateAsync(match.id);
              toast.success({ title: "Polls enabled — squad notified" });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Enable polls now
        </Button>
      ) : null}

      {canFreeze &&
      isUpcoming &&
      match.status === "confirmed" &&
      match.pollsEnabled &&
      !match.pollsFrozen &&
      !match.squadFinalizationPendingAt ? (
        <Button
          type="button"
          variant="tonal"
          className="w-full"
          loading={freezePolls.isPending}
          onClick={async () => {
            try {
              const frozen = await freezePolls.mutateAsync(match.id);
              toast.success({
                title: frozen.squadFinalizedAt
                  ? "Playing squad locked"
                  : frozen.squadFinalizationPendingAt
                    ? "Voting remains open"
                    : "Availability frozen",
                description: frozen.squadFinalizedAt
                  ? undefined
                  : frozen.squadFinalizationPendingAt
                    ? "Recruit more players, then confirm the playing XI/XII."
                    : "Finalize the XI/XII from the poll panel if needed.",
              });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Freeze availability (keep carpool open)
        </Button>
      ) : null}

      {canFreeze &&
      isUpcoming &&
      match.status === "confirmed" &&
      match.pollsEnabled &&
      match.pollsFrozen ? (
        <Button
          type="button"
          variant="tonal"
          className="w-full"
          loading={unfreezePolls.isPending}
          onClick={async () => {
            try {
              await unfreezePolls.mutateAsync(match.id);
              toast.success({ title: "Squad unlocked" });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Unfreeze availability
        </Button>
      ) : null}

      {canConfirm &&
      match.status === "confirmed" &&
      isMatchStartedIst(match.matchDate, match.startTime) ? (
        <Button
          type="button"
          variant="tonal"
          className="w-full"
          onClick={() => setCarpoolOpen(true)}
        >
          {match.carpoolAssignedAt
            ? "Edit carpool assignment"
            : "Assign carpool rides"}
        </Button>
      ) : null}

      {canConfirm &&
      match.status === "confirmed" &&
      match.pollsFrozen &&
      match.carpoolAssignedAt &&
      match.squadFinalizedAt &&
      isMatchStartedIst(match.matchDate, match.startTime) ? (
        <Button
          type="button"
          variant="tonal"
          className="w-full"
          loading={completeMatch.isPending}
          onClick={async () => {
            try {
              await completeMatch.mutateAsync(match.id);
              toast.success({ title: "Match marked completed" });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Mark match completed
        </Button>
      ) : null}

      {canConfirm && match.status === "confirmed" ? (
        <Button
          type="button"
          variant="outline"
          className="w-full text-destructive"
          loading={cancelMatch.isPending}
          onClick={async () => {
            if (
              !window.confirm(
                "Cancel this match? No weekend fees will be charged.",
              )
            ) {
              return;
            }
            try {
              await cancelMatch.mutateAsync(match.id);
              toast.success({ title: "Match cancelled — no fees" });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Cancel match
        </Button>
      ) : null}

      {canConfirm && isUpcoming && needsConfirm ? (
        <div className="sticky bottom-[calc(var(--bottom-nav-height)+0.5rem)] z-10 space-y-2 bg-background/95 py-2 md:static md:bg-transparent">
          <BodySm>
            {match.pollsEnabled
              ? "Confirming opens both polls and notifies the squad."
              : "Confirming publishes the fixture. Polls stay off until you enable them."}
          </BodySm>
          <Button
            type="button"
            className="h-14 w-full"
            loading={confirmMatch.isPending}
            onClick={async () => {
              try {
                await confirmMatch.mutateAsync(match.id);
                toast.success({
                  title: match.pollsEnabled
                    ? "Match confirmed — polls are live"
                    : "Match confirmed — polls still off",
                });
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            }}
          >
            Confirm match
          </Button>
        </div>
      ) : null}

      {showEdit ? (
        <EditMatchSheet
          match={match}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}

      {canConfirm ? (
        <MatchCarpoolAssign
          matchId={match.id}
          open={carpoolOpen}
          onOpenChange={setCarpoolOpen}
        />
      ) : null}
    </div>
  );
}

export { MatchDetailView };
