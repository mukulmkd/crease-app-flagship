"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Loader2,
  MapPin,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import { toast } from "@/components/feedback/toast";
import { Progress } from "@/components/ui/progress";
import { MATCH_CLASSIFICATION_LABELS } from "@/constants/domain/labels";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useCastAvailabilityVote,
  useCastCarpoolVote,
  useMatchPolls,
  useSquadLimits,
} from "@/features/team/hooks";
import {
  formatMatchDate,
  formatMatchTime,
  matchOpposition,
} from "@/features/team/lib/match-format";
import type { Match } from "@/types/models";

type MatchTicketProps = {
  match: Match;
};

/** Dominant dashboard fixture surface from the Stitch match-ticket concept. */
function MatchTicket({ match }: MatchTicketProps) {
  const { min: squadMin } = useSquadLimits();
  const pollsOpen = match.status === "confirmed" && match.pollsEnabled;
  const pollsQuery = useMatchPolls(pollsOpen ? match.id : undefined);
  const castAvailability = useCastAvailabilityVote();
  const castCarpool = useCastCarpoolVote();
  const yesCount = pollsQuery.data?.availability?.yesCount ?? 0;
  const squadFinalized = Boolean(pollsQuery.data?.squadFinalized);
  const squadCount = pollsQuery.data?.squadUserIds.length ?? 0;
  const strengthCount = squadFinalized ? squadCount : yesCount;
  const myAvailability = pollsQuery.data?.availability?.myVote?.availability;
  const myCarpool = pollsQuery.data?.carpool?.myVote?.carpool;
  const pollsLoading = !pollsOpen || pollsQuery.isLoading || pollsQuery.isError;
  const availabilityDisabled =
    pollsLoading || Boolean(pollsQuery.data?.availabilityFrozen);
  const carpoolDisabled =
    pollsLoading || Boolean(pollsQuery.data?.carpoolFrozen);
  const progress = pollsOpen
    ? Math.min(100, Math.round((strengthCount / squadMin) * 100))
    : 0;

  return (
    <article className="overflow-hidden rounded-xl bg-[#082417] text-white shadow-[0_8px_20px_rgba(8,36,23,0.16)]">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="text-[0.65rem] font-bold tracking-[0.08em] text-[#c9f64b] uppercase">
              {formatMatchDate(match.matchDate)} ·{" "}
              {formatMatchTime(match.startTime)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-4 text-white/75" aria-hidden />
            <Link
              href={`/matches/${match.id}`}
              className="flex size-12 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#c9f64b] focus-visible:outline-none"
              aria-label={`Open ${matchOpposition(match)} match details`}
            >
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </span>
        </div>

        <div>
          <h2 className="font-heading text-[2rem] leading-none font-extrabold tracking-tight uppercase sm:text-4xl">
            {matchOpposition(match)}
          </h2>
          <p className="mt-1 text-[0.65rem] font-semibold tracking-[0.08em] text-white/65 uppercase">
            {MATCH_CLASSIFICATION_LABELS[match.classification]}
            {match.pollsEnabled ? " · Polls on" : " · Polls off"}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[0.65rem] text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#c9f64b]" />
              {formatMatchTime(match.startTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3" aria-hidden />
              {match.groundMapsUrl ? "Ground location" : "Ground TBD"}
            </span>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/15 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.6rem] font-bold tracking-[0.08em] text-white/65 uppercase">
              {squadFinalized ? "Playing squad" : "Available"}
            </p>
            <p className="font-heading text-base font-bold tabular-nums">
              {pollsOpen
                ? squadFinalized
                  ? `${squadCount} of ${squadMin} selected`
                  : `${yesCount} available`
                : `— of ${squadMin} available`}
            </p>
          </div>
          <Progress
            value={progress}
            aria-label="Squad strength"
            className="h-1.5 bg-white/15 [&_[data-slot=progress-indicator]]:bg-[#c9f64b]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2" aria-label="Quick match voting">
          <PollVoteButton
            icon={CheckCircle2}
            label="Playing"
            active={myAvailability === "yes"}
            disabled={availabilityDisabled}
            loading={castAvailability.isPending}
            onClick={() =>
              saveVote(
                () =>
                  castAvailability.mutateAsync({
                    matchId: match.id,
                    vote: "yes",
                  }),
                "Availability saved",
              )
            }
          />
          <PollVoteButton
            icon={UserRoundX}
            label="Not playing"
            active={myAvailability === "no"}
            disabled={availabilityDisabled}
            loading={castAvailability.isPending}
            onClick={() =>
              saveVote(
                () =>
                  castAvailability.mutateAsync({
                    matchId: match.id,
                    vote: "no",
                  }),
                "Availability saved",
              )
            }
          />
          <PollVoteButton
            icon={Car}
            label="Carpool"
            active={myCarpool === "carpool"}
            disabled={carpoolDisabled}
            loading={castCarpool.isPending}
            onClick={() =>
              saveVote(
                () =>
                  castCarpool.mutateAsync({
                    matchId: match.id,
                    vote: "carpool",
                  }),
                "Carpool saved",
              )
            }
          />
          <PollVoteButton
            icon={UsersRound}
            label="Coming own"
            active={myCarpool === "self"}
            disabled={carpoolDisabled}
            loading={castCarpool.isPending}
            onClick={() =>
              saveVote(
                () =>
                  castCarpool.mutateAsync({
                    matchId: match.id,
                    vote: "self",
                  }),
                "Carpool saved",
              )
            }
          />
        </div>
        {match.status !== "confirmed" ? (
          <p className="text-center text-[0.65rem] text-white/55">
            {match.pollsEnabled
              ? "Future fixture. Polls open Monday at 9 AM IST in match week."
              : "Future fixture. Publishes Monday at 9 AM IST; polls are off."}
          </p>
        ) : !match.pollsEnabled ? (
          <p className="text-center text-[0.65rem] text-white/55">
            Polls not enabled yet. Admin can turn them on from match details.
          </p>
        ) : pollsQuery.data?.availabilityFrozen &&
          pollsQuery.data?.carpoolFrozen ? (
          <p className="text-center text-[0.65rem] text-white/55">
            Polls are locked. Open the match for Admin overrides.
          </p>
        ) : pollsQuery.data?.availabilityFrozen ? (
          <p className="text-center text-[0.65rem] text-white/55">
            Squad locked. Travel votes stay open until kickoff.
          </p>
        ) : null}
      </div>
    </article>
  );
}

async function saveVote(action: () => Promise<unknown>, successTitle: string) {
  try {
    await action();
    toast.success({ title: successTitle });
  } catch (error) {
    toast.error({ title: getMutationErrorMessage(error) });
  }
}

type PollVoteButtonProps = {
  icon: typeof CheckCircle2;
  label: string;
  active: boolean;
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
};

function PollVoteButton({
  icon: Icon,
  label,
  active,
  disabled,
  loading = false,
  onClick,
}: PollVoteButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-pressed={active}
      aria-busy={loading || undefined}
      className={
        active
          ? "flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#c9f64b] px-2 text-xs font-semibold text-[#152000] transition-colors"
          : "flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white/10 px-2 text-xs font-semibold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-45"
      }
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Icon className="size-3.5" aria-hidden />
      )}
      {label}
    </button>
  );
}

export { MatchTicket };
