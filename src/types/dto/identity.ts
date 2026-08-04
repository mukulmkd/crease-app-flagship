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
  demoMode?: boolean;
};

/** Assign the single Admin who collects weekend UPI payments. */
export type AssignPaymentCollectorDto = {
  userId: string;
  /** Collector's UPI VPA — becomes the team payment destination. */
  upiVpa: string;
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
  /** Required when totalFeesInr > 0 — Admin who prepaid entry. */
  feesPaidByUserId: string | null;
};

export type UpdateTournamentDto = {
  tournamentId: string;
  name?: string;
  plannedMatchCount?: number;
  totalFeesInr?: number;
  feesPaidByUserId?: string | null;
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
  /** Demo mode only — any Saturday/Sunday (including past). */
  matchDate?: string;
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
