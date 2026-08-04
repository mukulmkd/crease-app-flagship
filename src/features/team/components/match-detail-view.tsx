"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  IndianRupee,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  MATCH_CLASSIFICATION_LABELS,
  MATCH_STATUS_LABELS,
} from "@/constants/domain/labels";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { MatchPollPanel } from "@/features/team/components/match-poll-panel";
import { MatchTournamentCard } from "@/features/team/components/match-tournament-card";
import { PastMatchReport } from "@/features/team/components/past-match-report";
import {
  useMatch,
  useMatchTournamentContext,
  useMyMembership,
  useSquadLimits,
} from "@/features/team/hooks";
import {
  formatMatchDate,
  formatMatchTime,
  matchOpposition,
} from "@/features/team/lib/match-format";
import { formatInrAmount, isMatchStartedIst, todayIsoDate } from "@/utils";
import { useState } from "react";

const EditMatchSheet = dynamic(() =>
  import("@/features/team/components/edit-match-sheet").then(
    (module) => module.EditMatchSheet,
  ),
);
const ManageMatchSheet = dynamic(() =>
  import("@/features/team/components/manage-match-sheet").then(
    (module) => module.ManageMatchSheet,
  ),
);
const MatchCarpoolAssign = dynamic(() =>
  import("@/features/team/components/match-carpool-assign").then(
    (module) => module.MatchCarpoolAssign,
  ),
);

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
  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [carpoolOpen, setCarpoolOpen] = useState(false);
  const [loadedSheets, setLoadedSheets] = useState({
    manage: false,
    edit: false,
    carpool: false,
  });

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
  const showManage = !isTerminal && (canManageMatch || canFreeze || showEdit);

  return (
    <div className="-mt-4 space-y-6 md:mt-0">
      <article className="relative -mx-4 overflow-hidden bg-clubhouse text-white md:mx-0 md:rounded-2xl">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 z-10 bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white md:top-4 md:left-4"
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
        {showManage ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 z-10 bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white md:top-4 md:right-4"
            onClick={() => {
              setLoadedSheets((loaded) => ({ ...loaded, manage: true }));
              setManageOpen(true);
            }}
          >
            <SlidersHorizontal aria-hidden />
            Manage
          </Button>
        ) : null}

        <div className="space-y-5 px-5 pt-20 pb-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-tertiary uppercase">
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
            <h1 className="font-heading text-5xl leading-none font-semibold tracking-tight">
              {matchOpposition(match)}
            </h1>
            <p className="mt-2 text-sm font-semibold tracking-[0.08em] text-white/70 uppercase">
              {MATCH_CLASSIFICATION_LABELS[match.classification]}
            </p>
          </div>

          <div className="grid gap-3 border-t border-white/15 pt-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-white/75">
              <MapPin className="size-4 text-tertiary" aria-hidden />
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
                  <IndianRupee className="size-4 text-tertiary" aria-hidden />
                  Tournament fee for this match{" "}
                  {tournamentContextQuery.data
                    ? `₹${formatInrAmount(tournamentContextQuery.data.feePoolPerMatchInr)}`
                    : "…"}
                </div>
                <div className="flex items-center gap-2 text-white/75 sm:col-span-2">
                  <IndianRupee className="size-4 text-tertiary" aria-hidden />
                  Match fees{" "}
                  {match.matchFeesInr != null
                    ? `₹${formatInrAmount(match.matchFeesInr)}`
                    : "TBD"}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-white/75">
                <IndianRupee className="size-4 text-tertiary" aria-hidden />
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

      {showManage && loadedSheets.manage ? (
        <ManageMatchSheet
          match={match}
          open={manageOpen}
          onOpenChange={setManageOpen}
          canManageMatch={canManageMatch}
          canFreeze={canFreeze}
          showEdit={showEdit}
          manageLive={manageLive}
          kickoffReached={kickoffReached}
          onEdit={() => {
            setLoadedSheets((loaded) => ({ ...loaded, edit: true }));
            setEditOpen(true);
          }}
          onCarpool={() => {
            setLoadedSheets((loaded) => ({ ...loaded, carpool: true }));
            setCarpoolOpen(true);
          }}
        />
      ) : null}

      {showEdit && loadedSheets.edit ? (
        <EditMatchSheet
          match={match}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}

      {canManageMatch && loadedSheets.carpool ? (
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
