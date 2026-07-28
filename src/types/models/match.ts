import type {
  AvailabilityVote,
  CarpoolVote,
  MatchClassification,
  MatchStatus,
  PollStatus,
  PollType,
  TournamentStatus,
} from "@/constants/domain/enums";
import type {
  IsoDate,
  IsoDateTime,
  MatchId,
  PollId,
  PollVoteId,
  ProfileId,
  TeamScoped,
  Timestamps,
  TournamentId,
} from "@/types/common";

export type Tournament = Timestamps &
  TeamScoped & {
    id: TournamentId;
    name: string;
    plannedMatchCount: number;
    totalFeesInr: number;
    status: TournamentStatus;
    createdBy: ProfileId | null;
  };

export type Match = Timestamps &
  TeamScoped & {
    id: MatchId;
    matchDate: IsoDate;
    classification: MatchClassification;
    tournamentId: TournamentId | null;
    opposition: string | null;
    groundMapsUrl: string | null;
    startTime: string | null;
    matchFeesInr: number | null;
    status: MatchStatus;
    pollsFrozen: boolean;
    confirmedAt: IsoDateTime | null;
    createdBy: ProfileId | null;
  };

export type MatchPoll = Timestamps &
  TeamScoped & {
    id: PollId;
    matchId: MatchId;
    type: PollType;
    status: PollStatus;
    frozenAt: IsoDateTime | null;
  };

export type PollVote = Timestamps & {
  id: PollVoteId;
  pollId: PollId;
  userId: ProfileId;
  availability: AvailabilityVote | null;
  carpool: CarpoolVote | null;
};
