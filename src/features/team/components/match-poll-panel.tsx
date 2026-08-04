"use client";

import { ChevronDown } from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Progress } from "@/components/ui/progress";
import type { MembershipRole } from "@/constants/domain/enums";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useCarpoolAssignments,
  useCastAvailabilityVote,
  useCastCarpoolVote,
  useMatchPolls,
  useSquadLimits,
} from "@/features/team/hooks";
import { MatchPollControl } from "@/features/team/components/match-poll-control";
import { MatchSquadFinalize } from "@/features/team/components/match-squad-finalize";
import {
  MatchRidesSummary,
  MatchTravelList,
} from "@/features/team/components/match-travel-summary";
import { buildTravelIndex } from "@/features/team/lib/carpool-travel";

type MatchPollPanelProps = {
  matchId: string;
  role: MembershipRole | null | undefined;
};

function MatchPollPanel({ matchId, role }: MatchPollPanelProps) {
  const { min: squadMin, max: squadMax, demoMode } = useSquadLimits();
  const pollsQuery = useMatchPolls(matchId);
  const ridesQuery = useCarpoolAssignments(matchId);
  const castAvailability = useCastAvailabilityVote();
  const castCarpool = useCastCarpoolVote();

  const canVote = hasPermission(role, PERMISSIONS.POLL_VOTE);
  const canOverride = hasPermission(role, PERMISSIONS.MATCH_POLL_OVERRIDE);

  if (pollsQuery.isLoading) {
    return <BodySm>Loading polls…</BodySm>;
  }

  if (pollsQuery.isError || !pollsQuery.data) {
    return (
      <BodySm>
        Could not load polls.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void pollsQuery.refetch()}
        >
          Retry
        </button>
      </BodySm>
    );
  }

  const {
    availability,
    carpool,
    roster,
    availabilityFrozen,
    carpoolFrozen,
    squadFinalized,
    squadUserIds,
  } = pollsQuery.data;
  const finalizationPending = Boolean(
    pollsQuery.data.match.squadFinalizationPendingAt,
  );
  const yesCount = availability?.yesCount ?? 0;
  const squadCount = squadUserIds.length;
  const strengthLabel = squadFinalized
    ? `${squadCount} / ${squadMax}`
    : `${yesCount} available`;
  const progress = Math.min(
    100,
    Math.round(((squadFinalized ? squadCount : yesCount) / squadMin) * 100),
  );
  const myAvailability = availability?.myVote?.availability;
  const myCarpool = carpool?.myVote?.carpool;
  const myUserId = availability?.myVote?.userId;
  const inPlayingSquad = myUserId
    ? squadUserIds.includes(String(myUserId))
    : false;
  const availabilityLocked = availabilityFrozen && !canOverride;
  const carpoolLocked = carpoolFrozen && !canOverride;
  const showAdminFinalize =
    canOverride &&
    !squadFinalized &&
    (demoMode
      ? true
      : yesCount >= squadMin &&
        (availabilityFrozen || finalizationPending || yesCount > squadMax));
  const availablePool = roster.filter((r) => r.availability === "yes");
  const squadRows = roster.filter((r) => r.inSquad);
  const rides = ridesQuery.data ?? [];
  const carpoolAssigned = Boolean(pollsQuery.data.match.carpoolAssignedAt);
  const travelSummary = carpoolAssigned
    ? `Passengers ${buildTravelIndex(rides).passengerCount}`
    : `Carpool ${carpool?.carpoolCount ?? 0}`;
  const nameFor = (userId: string) =>
    roster.find((r) => r.userId === userId)?.fullName ?? null;

  const playingOpts = [
    { value: "yes" as const, label: "Playing" },
    { value: "no" as const, label: "Not playing" },
  ];
  const carpoolOpts = [
    { value: "carpool" as const, label: "Carpool" },
    { value: "self" as const, label: "Coming own" },
  ];

  const statusSummary = squadFinalized
    ? `Squad locked · ${squadCount} selected · Travel ${carpoolFrozen ? "locked" : "open"}`
    : availabilityFrozen
      ? `Availability locked · ${yesCount} in pool · Squad pending`
      : finalizationPending
        ? `Voting open · ${yesCount} available · Admin confirmation needed`
        : `Voting open · ${yesCount} available · Target ${squadMin}–${squadMax}`;
  const statusDetails = squadFinalized
    ? carpoolFrozen
      ? "The playing squad and travel poll are locked. An Admin can still correct a response."
      : "The playing squad is final. Travel votes remain open until kickoff."
    : availabilityFrozen
      ? yesCount > squadMax
        ? "The availability pool is frozen. An Admin must select the final playing squad."
        : "Availability is frozen, but the playing squad has not been finalized yet."
      : finalizationPending
        ? yesCount >= squadMin
          ? "Voting stays open until an Admin confirms the playing squad."
          : `Voting stays open while the team recruits players. An Admin can confirm once ${squadMin}–${squadMax} are selected.`
        : yesCount > squadMax
          ? "The available pool has no hard cap. An Admin will select the final playing squad."
          : `Availability is an open pool. The final ${squadMin}–${squadMax} players lock at freeze.`;
  const participation = inPlayingSquad
    ? {
        label: "Playing squad",
        description: "You’re selected for this match.",
        status: "accent" as const,
      }
    : myAvailability === "yes"
      ? {
          label: "Available pool · not selected",
          description: "You opted in but are not in the final squad.",
          status: "warning" as const,
        }
      : {
          label: "Not playing",
          description: "You’re not in the final squad.",
          status: "neutral" as const,
        };

  return (
    <div className="space-y-5">
      {squadFinalized ? (
        <section
          aria-label="Your participation"
          className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">
              Your participation
            </p>
            <BodySm className="mt-0.5">{participation.description}</BodySm>
          </div>
          <StatusChip status={participation.status} className="shrink-0">
            {participation.label}
          </StatusChip>
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="squad-strength">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p
              id="squad-strength"
              className="font-heading text-xl font-semibold"
            >
              Squad strength
            </p>
            <BodySm>{statusSummary}</BodySm>
          </div>
          <span className="font-heading text-2xl font-bold tabular-nums">
            {strengthLabel}
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2 [&_[data-slot=progress-indicator]]:bg-accent"
        />
        <BodySm>
          Target {squadMin}–{squadMax}
          {squadFinalized ? ` · Available ${yesCount}` : ""} · {travelSummary}
        </BodySm>
        <details className="group rounded-lg bg-surface-container-low">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
            Why this status?
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <BodySm className="px-3 pb-3">{statusDetails}</BodySm>
        </details>
      </section>

      {showAdminFinalize ? (
        <MatchSquadFinalize matchId={matchId} available={availablePool} />
      ) : null}

      {canVote ? (
        <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
          <h2 className="font-heading text-xl font-semibold">Your response</h2>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Availability
            </p>
            <MatchPollControl<"yes" | "no">
              aria-label="Availability"
              loading={castAvailability.isPending}
              options={playingOpts.map((option) => ({
                ...option,
                disabled: availabilityLocked,
              }))}
              value={myAvailability}
              onValueChange={async (vote) => {
                try {
                  await castAvailability.mutateAsync({ matchId, vote });
                  toast.success({ title: "Availability saved" });
                } catch (error) {
                  toast.error({ title: getMutationErrorMessage(error) });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Travel
            </p>
            <MatchPollControl<"carpool" | "self">
              aria-label="Travel"
              loading={castCarpool.isPending}
              options={carpoolOpts.map((option) => ({
                ...option,
                disabled: carpoolLocked,
              }))}
              value={myCarpool}
              onValueChange={async (vote) => {
                try {
                  await castCarpool.mutateAsync({ matchId, vote });
                  toast.success({ title: "Carpool saved" });
                } catch (error) {
                  toast.error({ title: getMutationErrorMessage(error) });
                }
              }}
            />
          </div>
        </section>
      ) : null}

      <MatchTravelList
        headingId="opted-in-heading"
        heading={squadFinalized ? "Playing squad" : "Who’s available"}
        rows={squadFinalized ? squadRows : availablePool}
        emptyLabel={
          squadFinalized
            ? "No playing squad finalized yet."
            : "No one has opted in yet."
        }
        rides={rides}
        assigned={carpoolAssigned}
        nameFor={nameFor}
      />

      {carpoolAssigned ? (
        <MatchRidesSummary
          rides={rides}
          assigned={carpoolAssigned}
          nameFor={nameFor}
        />
      ) : null}
    </div>
  );
}

export { MatchPollPanel };
