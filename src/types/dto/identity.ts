import type {
  MembershipRole,
  MembershipStatus,
} from "@/constants/domain/enums";
import type { MatchClassification } from "@/constants/domain/enums";

export type UpdateTeamSettingsDto = {
  name?: string;
  logoUrl?: string | null;
  upiVpa?: string | null;
  whatsappNotifyUrl?: string | null;
};

export type AddTeamMemberDto = {
  phone: string;
  fullName?: string;
  role?: MembershipRole;
};

export type UpdateMembershipDto = {
  membershipId: string;
  role?: MembershipRole;
  status?: MembershipStatus;
};

export type ListTeamMembersQuery = {
  status?: MembershipStatus;
  role?: MembershipRole;
  limit?: number;
  cursor?: string;
};

export type CreateTournamentDto = {
  name: string;
  plannedMatchCount: number;
  totalFeesInr: number;
};

export type CreateMatchDto = {
  matchDate: string;
  classification: MatchClassification;
  tournamentId?: string | null;
  opposition?: string | null;
  groundMapsUrl?: string | null;
  startTime?: string | null;
  matchFeesInr?: number | null;
  /** When true, confirm activates polls. Defaults true for this weekend. */
  pollsEnabled?: boolean;
};

/** One or more independently configured weekend matches. */
export type CreateWeekendMatchesDto = {
  matches: CreateMatchDto[];
};

export type UpdateMatchDto = {
  matchId: string;
  classification?: MatchClassification;
  tournamentId?: string | null;
  opposition?: string | null;
  groundMapsUrl?: string | null;
  startTime?: string | null;
  matchFeesInr?: number | null;
  pollsEnabled?: boolean;
};

export type CastAvailabilityVoteDto = {
  matchId: string;
  vote: "yes" | "no";
};

export type CastCarpoolVoteDto = {
  matchId: string;
  vote: "carpool" | "self";
};

export type OverrideVoteDto = {
  matchId: string;
  userId: string;
  availability?: "yes" | "no";
  carpool?: "carpool" | "self";
};

export type CreateNotificationDto = {
  userId: string;
  teamId?: string | null;
  type: "match" | "poll" | "payment" | "fund" | "membership" | "system";
  title: string;
  body: string;
  data?: Record<string, unknown>;
};
