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
  MatchCarpoolRideId,
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
    pollsEnabled: boolean;
    /** Freeze was requested below 11; voting stays open until strength recovers. */
    squadFinalizationPendingAt: IsoDateTime | null;
    /** When set, fees charge these members only (not the full availability pool). */
    squadFinalizedAt: IsoDateTime | null;
    /** Admin saved post-match driver/passenger assignments (may be empty). */
    carpoolAssignedAt: IsoDateTime | null;
    /** Cron claimed the 2 PM Admin assignment reminder. */
    carpoolAssignmentRemindedAt: IsoDateTime | null;
    confirmedAt: IsoDateTime | null;
    createdBy: ProfileId | null;
  };

export type MatchSquadMember = {
  matchId: MatchId;
  userId: ProfileId;
  createdAt: IsoDateTime;
};

export type MatchCarpoolRide = {
  id: MatchCarpoolRideId;
  matchId: MatchId;
  driverUserId: ProfileId;
  passengerUserIds: ProfileId[];
  createdAt: IsoDateTime;
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
