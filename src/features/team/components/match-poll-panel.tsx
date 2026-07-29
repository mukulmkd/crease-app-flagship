"use client";

import { SegmentedControl } from "@/components/forms/segmented-control";
import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Progress } from "@/components/ui/progress";
import { SQUAD_MAX, SQUAD_MIN } from "@/constants/domain/enums";
import type { MembershipRole } from "@/constants/domain/enums";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useCastAvailabilityVote,
  useCastCarpoolVote,
  useMatchPolls,
} from "@/features/team/hooks";
import { MatchSquadFinalize } from "@/features/team/components/match-squad-finalize";

type MatchPollPanelProps = {
  matchId: string;
  role: MembershipRole | null | undefined;
};

function MatchPollPanel({ matchId, role }: MatchPollPanelProps) {
  const pollsQuery = useMatchPolls(matchId);
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
    ? `${squadCount} / ${SQUAD_MAX}`
    : `${yesCount} available`;
  const progress = Math.min(
    100,
    Math.round(((squadFinalized ? squadCount : yesCount) / SQUAD_MIN) * 100),
  );
  const myAvailability = availability?.myVote?.availability;
  const myCarpool = carpool?.myVote?.carpool;
  const availabilityLocked = availabilityFrozen && !canOverride;
  const carpoolLocked = carpoolFrozen && !canOverride;
  const showAdminFinalize =
    canOverride &&
    !squadFinalized &&
    yesCount >= SQUAD_MIN &&
    (availabilityFrozen || finalizationPending || yesCount > SQUAD_MAX);
  const availablePool = roster.filter((r) => r.availability === "yes");

  const playingOpts = [
    { value: "yes" as const, label: "Playing" },
    { value: "no" as const, label: "Not playing" },
  ];
  const carpoolOpts = [
    { value: "carpool" as const, label: "Carpool" },
    { value: "self" as const, label: "Coming own" },
  ];

  const statusHint = squadFinalized
    ? carpoolFrozen
      ? "Playing squad and travel locked — Admin can still override"
      : "Playing squad locked — travel votes stay open until kickoff"
    : availabilityFrozen
      ? yesCount > SQUAD_MAX
        ? "Availability frozen — Admin must pick the XI/XII"
        : "Availability frozen — squad not finalized yet"
      : finalizationPending
        ? yesCount >= SQUAD_MIN
          ? "Voting stays open — Admin must confirm the playing XI/XII"
          : `Voting stays open — recruit players, then confirm at ${SQUAD_MIN}–${SQUAD_MAX}`
        : yesCount > SQUAD_MAX
          ? "Pool is oversubscribed — Admin should finalize before freeze time"
          : "Availability is a pool (no hard cap). Final XI/XII locks at freeze.";

  return (
    <div className="space-y-5">
      <section className="space-y-3" aria-labelledby="squad-strength">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p
              id="squad-strength"
              className="font-heading text-xl font-bold uppercase"
            >
              Squad strength
            </p>
            <BodySm>{statusHint}</BodySm>
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
          Target {SQUAD_MIN}–{SQUAD_MAX}
          {squadFinalized ? ` · Available ${yesCount}` : ""} · Carpool{" "}
          {carpool?.carpoolCount ?? 0}
        </BodySm>
      </section>

      {showAdminFinalize ? (
        <MatchSquadFinalize matchId={matchId} available={availablePool} />
      ) : null}

      {canVote ? (
        <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
          <h2 className="font-heading text-xl font-bold uppercase">
            Your response
          </h2>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Availability
            </p>
            <SegmentedControl
              aria-label="Availability"
              loading={castAvailability.isPending}
              options={playingOpts.map((o) => ({
                ...o,
                disabled: availabilityLocked,
              }))}
              value={myAvailability ?? ("no" as const)}
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
            <SegmentedControl
              aria-label="Carpool"
              loading={castCarpool.isPending}
              options={carpoolOpts.map((o) => ({
                ...o,
                disabled: carpoolLocked,
              }))}
              value={myCarpool ?? ("self" as const)}
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

      <section aria-labelledby="opted-in-heading">
        <h2
          id="opted-in-heading"
          className="font-heading text-xl font-bold uppercase"
        >
          {squadFinalized ? "Playing squad" : "Who’s available"}
        </h2>
        <ul className="mt-2 divide-y divide-outline-variant rounded-xl bg-surface-container-low">
          {(squadFinalized
            ? roster.filter((r) => r.inSquad)
            : availablePool
          ).map((r) => (
            <li
              key={r.userId}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium">
                {r.fullName?.trim() || "Player"}
              </span>
              <span className="text-xs text-muted-foreground">
                {r.carpool === "carpool" ? "Carpool" : "Own"}
              </span>
            </li>
          ))}
          {(squadFinalized ? roster.filter((r) => r.inSquad) : availablePool)
            .length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              {squadFinalized
                ? "No playing squad finalized yet."
                : "No one has opted in yet."}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

export { MatchPollPanel };
