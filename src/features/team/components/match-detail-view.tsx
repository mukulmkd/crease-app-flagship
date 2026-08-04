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
import { MatchTournamentCard } from "@/features/team/components/match-tournament-card";
import { PastMatchReport } from "@/features/team/components/past-match-report";
import {
  useCancelMatch,
  useCompleteMatch,
  useEnableMatchPolls,
  useFreezePolls,
  useMatch,
  useMatchTournamentContext,
  useMyMembership,
  useSquadLimits,
  useUnfreezePolls,
} from "@/features/team/hooks";
import {
  formatMatchDate,
  formatMatchTime,
  matchOpposition,
} from "@/features/team/lib/match-format";
import { formatInrAmount, isMatchStartedIst, todayIsoDate } from "@/utils";
import { useState } from "react";

type MatchDetailViewProps = {
  matchId: string;
};

function MatchDetailView({ matchId }: MatchDetailViewProps) {
  const router = useRouter();
  const membershipQuery = useMyMembership();
  const { demoMode } = useSquadLimits();
  const matchQuery = useMatch(matchId);
  const match = matchQuery.data;
  const isTournament = match?.classification === "tournament";
  const tournamentContextQuery = useMatchTournamentContext(
    matchId,
    Boolean(isTournament),
  );
  const freezePolls = useFreezePolls();
  const unfreezePolls = useUnfreezePolls();
  const enablePolls = useEnableMatchPolls();
  const completeMatch = useCompleteMatch();
  const cancelMatch = useCancelMatch();
  const [editOpen, setEditOpen] = useState(false);
  const [carpoolOpen, setCarpoolOpen] = useState(false);

  const role = membershipQuery.data?.role;
  const canManageMatch = hasPermission(role, PERMISSIONS.MATCH_CONFIRM);
  const canEdit = hasPermission(role, PERMISSIONS.MATCH_EDIT);
  const canFreeze = hasPermission(role, PERMISSIONS.MATCH_POLL_OVERRIDE);

  if (matchQuery.isLoading) {
    return <LoadingState label="Loading match" />;
  }

  if (matchQuery.isError || !match) {
    return (
      <ErrorState
        title="Match not found"
        onRetry={() => void matchQuery.refetch()}
      />
    );
  }
  const today = todayIsoDate();
  const isUpcoming =
    match.matchDate >= today &&
    match.status !== "cancelled" &&
    match.status !== "completed";
  const isTerminal =
    match.status === "cancelled" || match.status === "completed";
  // Demo unlocks past fixtures for Admin E2E (edit, polls, carpool, complete).
  const manageLive = isUpcoming || (demoMode && !isTerminal);
  const showEdit = canEdit && manageLive;
  const showPollPanel =
    match.status === "confirmed" && match.pollsEnabled && manageLive;
  const showPastReport = !manageLive && match.status !== "cancelled";
  const kickoffReached =
    demoMode || isMatchStartedIst(match.matchDate, match.startTime);

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
            {isTournament ? (
              <>
                <div className="flex items-center gap-2 text-white/75">
                  <IndianRupee className="size-4 text-[#c9f64b]" aria-hidden />
                  Tournament fee for this match{" "}
                  {tournamentContextQuery.data
                    ? `₹${formatInrAmount(tournamentContextQuery.data.feePoolPerMatchInr)}`
                    : "…"}
                </div>
                <div className="flex items-center gap-2 text-white/75 sm:col-span-2">
                  <IndianRupee className="size-4 text-[#c9f64b]" aria-hidden />
                  Match fees{" "}
                  {match.matchFeesInr != null
                    ? `₹${formatInrAmount(match.matchFeesInr)}`
                    : "TBD"}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-white/75">
                <IndianRupee className="size-4 text-[#c9f64b]" aria-hidden />
                Match fee{" "}
                {match.matchFeesInr != null
                  ? `₹${formatInrAmount(match.matchFeesInr)}`
                  : "TBD"}
              </div>
            )}
          </div>
        </div>
      </article>

      {isTournament ? (
        <MatchTournamentCard
          loading={tournamentContextQuery.isLoading}
          context={tournamentContextQuery.data}
        />
      ) : null}

      {showPollPanel ? (
        <MatchPollPanel matchId={match.id} role={role} />
      ) : showPastReport ? (
        <PastMatchReport match={match} role={role} />
      ) : match.status === "confirmed" && !match.pollsEnabled ? (
        <BodySm>
          Polls are off for this fixture. Enable them when you want the squad to
          vote.
        </BodySm>
      ) : match.status === "pending_confirm" || match.status === "draft" ? (
        <BodySm>
          Scheduled for a future weekend. It will publish automatically at 9:00
          AM IST on Monday of match week
          {match.pollsEnabled
            ? ", then polls will open and notify the squad."
            : "."}
        </BodySm>
      ) : match.status === "cancelled" ? (
        <BodySm>This match was cancelled.</BodySm>
      ) : null}

      {canManageMatch &&
      manageLive &&
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
      manageLive &&
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
                    ? "Recruit more players, then confirm the playing squad."
                    : "Finalize the squad from the poll panel if needed.",
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
      manageLive &&
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

      {canManageMatch && match.status === "confirmed" && kickoffReached ? (
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

      {canManageMatch &&
      match.status === "confirmed" &&
      match.pollsFrozen &&
      match.carpoolAssignedAt &&
      match.squadFinalizedAt &&
      kickoffReached ? (
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

      {canManageMatch &&
      (match.status === "confirmed" ||
        match.status === "pending_confirm" ||
        match.status === "draft") ? (
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

      {showEdit ? (
        <EditMatchSheet
          match={match}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}

      {canManageMatch ? (
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
