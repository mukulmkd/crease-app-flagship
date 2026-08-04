import type {
  AvailabilityVote,
  CarpoolVote,
  ChargeStatus,
  ContributionAskStatus,
  FundTxnDirection,
  MatchClassification,
  MatchStatus,
  MembershipRole,
  MembershipStatus,
  NotificationType,
  PollStatus,
  PollType,
  ReimbursementStatus,
  SettlementStatus,
  TournamentStatus,
} from "@/constants/domain/enums";
import {
  brandId,
  brandIdOrNull,
  asJsonValue,
} from "@/repositories/shared/brand";
import type { Tables } from "@/types/database";
import type {
  Expense,
  FundContribution,
  FundContributionAsk,
  FundTransaction,
  Match,
  MatchCarpoolRide,
  MatchPoll,
  MatchSquadMember,
  Notification,
  PollVote,
  Profile,
  SettlementCharge,
  SettlementOrganizerPayout,
  SettlementReimbursement,
  Team,
  TeamFundAccount,
  TeamMembership,
  Tournament,
  WeekendSettlement,
} from "@/types/models";

export function mapProfile(row: Tables<"profiles">): Profile {
  return {
    id: brandId<"ProfileId">(row.id),
    phone: row.phone,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    profileCompletedAt: row.profile_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTeam(row: Tables<"teams">): Team {
  return {
    id: brandId<"TeamId">(row.id),
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    upiVpa: row.upi_vpa,
    whatsappNotifyUrl: row.whatsapp_notify_url,
    carpoolFeeInr: Number(row.carpool_fee_inr),
    demoMode: Boolean(row.demo_mode),
    collectorUserId: brandIdOrNull<"ProfileId">(row.collector_user_id),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTeamMembership(
  row: Tables<"team_memberships">,
): TeamMembership {
  return {
    id: brandId<"TeamMembershipId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    userId: brandId<"ProfileId">(row.user_id),
    role: row.role as MembershipRole,
    status: row.status as MembershipStatus,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTournament(row: Tables<"tournaments">): Tournament {
  return {
    id: brandId<"TournamentId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    name: row.name,
    plannedMatchCount: row.planned_match_count,
    totalFeesInr: Number(row.total_fees_inr),
    status: row.status as TournamentStatus,
    feesPaidByUserId: brandIdOrNull<"ProfileId">(row.fees_paid_by_user_id),
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMatch(row: Tables<"matches">): Match {
  return {
    id: brandId<"MatchId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    matchDate: row.match_date,
    classification: row.classification as MatchClassification,
    tournamentId: brandIdOrNull<"TournamentId">(row.tournament_id),
    opposition: row.opposition,
    groundMapsUrl: row.ground_maps_url,
    startTime: row.start_time,
    matchFeesInr:
      row.match_fees_inr === null ? null : Number(row.match_fees_inr),
    status: row.status as MatchStatus,
    pollsFrozen: row.polls_frozen,
    pollsEnabled: row.polls_enabled,
    squadFinalizationPendingAt: row.squad_finalization_pending_at,
    squadFinalizedAt: row.squad_finalized_at,
    carpoolAssignedAt: row.carpool_assigned_at,
    carpoolAssignmentRemindedAt: row.carpool_assignment_reminded_at,
    feesSettledAt: row.fees_settled_at,
    confirmedAt: row.confirmed_at,
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMatchSquadMember(
  row: Tables<"match_squad_members">,
): MatchSquadMember {
  return {
    matchId: brandId<"MatchId">(row.match_id),
    userId: brandId<"ProfileId">(row.user_id),
    createdAt: row.created_at,
  };
}

export function mapMatchCarpoolRide(
  ride: Tables<"match_carpool_rides">,
  passengerUserIds: string[],
): MatchCarpoolRide {
  return {
    id: brandId<"MatchCarpoolRideId">(ride.id),
    matchId: brandId<"MatchId">(ride.match_id),
    driverUserId: brandId<"ProfileId">(ride.driver_user_id),
    passengerUserIds: passengerUserIds.map((id) => brandId<"ProfileId">(id)),
    createdAt: ride.created_at,
  };
}

export function mapSettlementReimbursement(
  row: Tables<"settlement_reimbursements">,
): SettlementReimbursement {
  return {
    id: brandId<"SettlementReimbursementId">(row.id),
    settlementId: brandId<"WeekendSettlementId">(row.settlement_id),
    teamId: brandId<"TeamId">(row.team_id),
    userId: brandId<"ProfileId">(row.user_id),
    amountInr: Number(row.amount_inr),
    status: row.status as ReimbursementStatus,
    utr: row.utr,
    screenshotPath: row.screenshot_path,
    paidAt: row.paid_at,
    markedPaidBy: brandIdOrNull<"ProfileId">(row.marked_paid_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSettlementOrganizerPayout(
  row: Tables<"settlement_organizer_payouts">,
): SettlementOrganizerPayout {
  return {
    id: brandId<"SettlementOrganizerPayoutId">(row.id),
    settlementId: brandId<"WeekendSettlementId">(row.settlement_id),
    teamId: brandId<"TeamId">(row.team_id),
    matchId: brandIdOrNull<"MatchId">(row.match_id),
    payeeName: row.payee_name,
    amountInr: Number(row.amount_inr),
    status: row.status as ReimbursementStatus,
    utr: row.utr,
    screenshotPath: row.screenshot_path,
    paidAt: row.paid_at,
    markedPaidBy: brandIdOrNull<"ProfileId">(row.marked_paid_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMatchPoll(row: Tables<"polls">): MatchPoll {
  return {
    id: brandId<"PollId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    matchId: brandId<"MatchId">(row.match_id),
    type: row.type as PollType,
    status: row.status as PollStatus,
    frozenAt: row.frozen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPollVote(row: Tables<"poll_votes">): PollVote {
  return {
    id: brandId<"PollVoteId">(row.id),
    pollId: brandId<"PollId">(row.poll_id),
    userId: brandId<"ProfileId">(row.user_id),
    availability: row.availability as AvailabilityVote | null,
    carpool: row.carpool as CarpoolVote | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotification(row: Tables<"notifications">): Notification {
  return {
    id: brandId<"NotificationId">(row.id),
    teamId: brandIdOrNull<"TeamId">(row.team_id),
    userId: brandIdOrNull<"ProfileId">(row.user_id),
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    data: asJsonValue(row.data),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function mapWeekendSettlement(
  row: Tables<"weekend_settlements">,
): WeekendSettlement {
  return {
    id: brandId<"WeekendSettlementId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    weekStartDate: row.week_start_date,
    status: row.status as SettlementStatus,
    notifiedAt: row.notified_at,
    organizerPayoutRemindedAt: row.organizer_payout_reminded_at ?? null,
    settledAt: row.settled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSettlementCharge(
  row: Tables<"settlement_charges">,
): SettlementCharge {
  return {
    id: brandId<"SettlementChargeId">(row.id),
    settlementId: brandId<"WeekendSettlementId">(row.settlement_id),
    matchId: brandId<"MatchId">(row.match_id),
    teamId: brandId<"TeamId">(row.team_id),
    userId: brandId<"ProfileId">(row.user_id),
    matchFeeShareInr: Number(row.match_fee_share_inr),
    carpoolFeeInr: Number(row.carpool_fee_inr),
    carpoolCreditInr: Number(row.carpool_credit_inr),
    tournamentCreditInr: Number(row.tournament_credit_inr),
    totalInr: Number(row.total_inr),
    status: row.status as ChargeStatus,
    utr: row.utr,
    screenshotPath: row.screenshot_path,
    paidAt: row.paid_at,
    markedPaidBy: brandIdOrNull<"ProfileId">(row.marked_paid_by),
    note: row.note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTeamFundAccount(
  row: Tables<"team_fund_accounts">,
): TeamFundAccount {
  return {
    id: brandId<"TeamFundAccountId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    balanceInr: Number(row.balance_inr),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExpense(row: Tables<"expenses">): Expense {
  return {
    id: brandId<"ExpenseId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    amountInr: Number(row.amount_inr),
    category: row.category,
    note: row.note,
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFundTransaction(
  row: Tables<"team_fund_transactions">,
): FundTransaction {
  return {
    id: brandId<"FundTransactionId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    accountId: brandId<"TeamFundAccountId">(row.account_id),
    direction: row.direction as FundTxnDirection,
    amountInr: Number(row.amount_inr),
    note: row.note,
    expenseId: brandIdOrNull<"ExpenseId">(row.expense_id),
    contributionId: brandIdOrNull<"FundContributionId">(row.contribution_id),
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
  };
}

export function mapFundContributionAsk(
  row: Tables<"fund_contribution_asks">,
): FundContributionAsk {
  return {
    id: brandId<"FundContributionAskId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    amountPerPlayerInr: Number(row.amount_per_player_inr),
    note: row.note,
    status: row.status as ContributionAskStatus,
    sentAt: row.sent_at,
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFundContribution(
  row: Tables<"fund_contributions">,
): FundContribution {
  return {
    id: brandId<"FundContributionId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    userId: brandId<"ProfileId">(row.user_id),
    amountInr: Number(row.amount_inr),
    askId: brandIdOrNull<"FundContributionAskId">(row.ask_id),
    note: row.note,
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
