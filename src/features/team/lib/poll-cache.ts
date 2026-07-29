import type { QueryClient } from "@tanstack/react-query";

import type { AvailabilityVote, CarpoolVote } from "@/constants/domain/enums";
import { queryKeys } from "@/lib/query/keys";
import { brandId } from "@/repositories/shared/brand";
import type {
  MatchPollSummary,
  MatchPollsSnapshot,
} from "@/services/match.service";
import type { PollVote } from "@/types/models";

export type PollVotePatch =
  | { kind: "availability"; vote: AvailabilityVote }
  | { kind: "carpool"; vote: CarpoolVote };

/**
 * Optimistic poll patch so one-tap voting feels instant.
 * The server snapshot replaces it on the follow-up refetch.
 */
export function patchPollSnapshot(
  client: QueryClient,
  params: { matchId: string; userId: string; patch: PollVotePatch },
): void {
  const { matchId, userId, patch } = params;

  client.setQueryData<MatchPollsSnapshot>(
    queryKeys.matches.polls(matchId),
    (current) => {
      if (!current) return current;
      const summary =
        patch.kind === "availability" ? current.availability : current.carpool;
      if (!summary) return current;

      const patched = applyVote(summary, userId, patch);
      return {
        ...current,
        availability:
          patch.kind === "availability" ? patched : current.availability,
        carpool: patch.kind === "carpool" ? patched : current.carpool,
        roster: current.roster.map((entry) => {
          if (entry.userId !== userId) return entry;
          return patch.kind === "availability"
            ? { ...entry, availability: patch.vote }
            : { ...entry, carpool: patch.vote };
        }),
        squadFinalized: current.squadFinalized,
        squadUserIds: current.squadUserIds,
      };
    },
  );
}

function applyVote(
  summary: MatchPollSummary,
  userId: string,
  patch: PollVotePatch,
): MatchPollSummary {
  const now = new Date().toISOString();
  const existing =
    summary.votes.find((vote) => String(vote.userId) === userId) ??
    summary.myVote;

  const myVote: PollVote = {
    id: existing?.id ?? brandId<"PollVoteId">(`optimistic-${userId}`),
    pollId: summary.poll.id,
    userId: brandId<"ProfileId">(userId),
    availability:
      patch.kind === "availability"
        ? patch.vote
        : (existing?.availability ?? null),
    carpool:
      patch.kind === "carpool" ? patch.vote : (existing?.carpool ?? null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const votes = summary.votes.some((vote) => String(vote.userId) === userId)
    ? summary.votes.map((vote) =>
        String(vote.userId) === userId ? myVote : vote,
      )
    : [...summary.votes, myVote];

  return {
    ...summary,
    votes,
    myVote,
    yesCount: votes.filter((vote) => vote.availability === "yes").length,
    noCount: votes.filter((vote) => vote.availability === "no").length,
    carpoolCount: votes.filter((vote) => vote.carpool === "carpool").length,
    selfCount: votes.filter((vote) => vote.carpool === "self").length,
  };
}
