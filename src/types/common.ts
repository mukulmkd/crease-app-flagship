/**
 * Shared domain primitives — branded IDs, timestamps, pagination.
 */

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ProfileId = Brand<string, "ProfileId">;
export type TeamId = Brand<string, "TeamId">;
export type TeamMembershipId = Brand<string, "TeamMembershipId">;
export type MatchId = Brand<string, "MatchId">;
export type TournamentId = Brand<string, "TournamentId">;
export type PollId = Brand<string, "PollId">;
export type PollVoteId = Brand<string, "PollVoteId">;
export type WeekendSettlementId = Brand<string, "WeekendSettlementId">;
export type SettlementChargeId = Brand<string, "SettlementChargeId">;
export type SettlementReimbursementId = Brand<
  string,
  "SettlementReimbursementId"
>;
export type SettlementOrganizerPayoutId = Brand<
  string,
  "SettlementOrganizerPayoutId"
>;
export type MatchCarpoolRideId = Brand<string, "MatchCarpoolRideId">;
export type TeamFundAccountId = Brand<string, "TeamFundAccountId">;
export type ExpenseId = Brand<string, "ExpenseId">;
export type FundTransactionId = Brand<string, "FundTransactionId">;
export type FundContributionAskId = Brand<string, "FundContributionAskId">;
export type FundContributionId = Brand<string, "FundContributionId">;
export type NotificationId = Brand<string, "NotificationId">;

export type IsoDateTime = string;
export type IsoDate = string;

export type Timestamps = {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type TeamScoped = {
  teamId: TeamId;
};

export type Paginated<T> = {
  items: T[];
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor?: string | null;
};

export type SortDirection = "asc" | "desc";

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
