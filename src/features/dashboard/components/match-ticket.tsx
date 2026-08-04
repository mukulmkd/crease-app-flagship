"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Car,
  CheckCircle2,
  MapPin,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import { toast } from "@/components/feedback/toast";
import { Progress } from "@/components/ui/progress";
import { MATCH_CLASSIFICATION_LABELS } from "@/constants/domain/labels";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { MatchPollControl } from "@/features/team/components/match-poll-control";
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

/** Dominant dashboard fixture surface for the next match. */
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
  const groundMapsHref = safeExternalUrl(match.groundMapsUrl);

  return (
    <article className="overflow-hidden rounded-xl bg-clubhouse text-white shadow-ticket">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <span>
            <span className="text-xs font-semibold tracking-[0.08em] text-tertiary uppercase">
              {formatMatchDate(match.matchDate)} ·{" "}
              {formatMatchTime(match.startTime)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-4 text-white/85" aria-hidden />
            <Link
              href={`/matches/${match.id}`}
              className="flex size-12 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:outline-none"
              aria-label={`Open ${matchOpposition(match)} match details`}
            >
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </span>
        </div>

        <div>
          <h2 className="font-heading text-[2rem] leading-none font-semibold tracking-tight sm:text-4xl">
            {matchOpposition(match)}
          </h2>
          <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-white/85 uppercase">
            {MATCH_CLASSIFICATION_LABELS[match.classification]}
            {match.pollsEnabled ? " · Polls on" : " · Polls off"}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-tertiary" />
              {formatMatchTime(match.startTime)}
            </span>
            {groundMapsHref ? (
              <a
                href={groundMapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-1.5 rounded-md underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:outline-none"
                aria-label="Open ground location in Maps"
              >
                <MapPin className="size-3" aria-hidden />
                Ground location
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3" aria-hidden />
                Ground TBD
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 border-t border-white/15 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.08em] text-white/85 uppercase">
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
            className="h-1.5 bg-white/15 [&_[data-slot=progress-indicator]]:bg-tertiary"
          />
        </div>

        <div className="space-y-2">
          <MatchPollControl<"yes" | "no">
            aria-label="Availability"
            variant="compact"
            value={myAvailability}
            loading={castAvailability.isPending}
            options={[
              {
                value: "yes",
                label: "Playing",
                icon: CheckCircle2,
                disabled: availabilityDisabled,
              },
              {
                value: "no",
                label: "Not playing",
                icon: UserRoundX,
                disabled: availabilityDisabled,
              },
            ]}
            onValueChange={(vote) =>
              void saveVote(
                () => castAvailability.mutateAsync({ matchId: match.id, vote }),
                "Availability saved",
              )
            }
          />
          <MatchPollControl<"carpool" | "self">
            aria-label="Travel"
            variant="compact"
            value={myCarpool}
            loading={castCarpool.isPending}
            options={[
              {
                value: "carpool",
                label: "Carpool",
                icon: Car,
                disabled: carpoolDisabled,
              },
              {
                value: "self",
                label: "Coming own",
                icon: UsersRound,
                disabled: carpoolDisabled,
              },
            ]}
            onValueChange={(vote) =>
              void saveVote(
                () => castCarpool.mutateAsync({ matchId: match.id, vote }),
                "Carpool saved",
              )
            }
          />
        </div>
        {match.status !== "confirmed" ? (
          <p className="text-center text-xs text-white/75">
            {match.pollsEnabled
              ? "Future fixture. Polls open Monday at 9 AM IST in match week."
              : "Future fixture. Publishes Monday at 9 AM IST; polls are off."}
          </p>
        ) : !match.pollsEnabled ? (
          <p className="text-center text-xs text-white/75">
            Polls not enabled yet. Admin can turn them on from match details.
          </p>
        ) : pollsQuery.data?.availabilityFrozen &&
          pollsQuery.data?.carpoolFrozen ? (
          <p className="text-center text-xs text-white/75">
            Polls are locked. Open the match for Admin overrides.
          </p>
        ) : pollsQuery.data?.availabilityFrozen ? (
          <p className="text-center text-xs text-white/75">
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

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export { MatchTicket };
