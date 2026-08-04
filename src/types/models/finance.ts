import type {
  ChargeStatus,
  ContributionAskStatus,
  FundTxnDirection,
  ReimbursementStatus,
  SettlementStatus,
} from "@/constants/domain/enums";
import type {
  ExpenseId,
  FundContributionAskId,
  FundContributionId,
  FundTransactionId,
  IsoDate,
  IsoDateTime,
  MatchId,
  ProfileId,
  SettlementChargeId,
  SettlementOrganizerPayoutId,
  SettlementReimbursementId,
  TeamFundAccountId,
  TeamScoped,
  Timestamps,
  WeekendSettlementId,
} from "@/types/common";

export type WeekendSettlement = Timestamps &
  TeamScoped & {
    id: WeekendSettlementId;
    weekStartDate: IsoDate;
    status: SettlementStatus;
    notifiedAt: IsoDateTime | null;
    /** Admin reminded to upload organizer payment proofs. */
    organizerPayoutRemindedAt: IsoDateTime | null;
    settledAt: IsoDateTime | null;
  };

export type SettlementCharge = Timestamps &
  TeamScoped & {
    id: SettlementChargeId;
    settlementId: WeekendSettlementId;
    matchId: MatchId;
    userId: ProfileId;
    matchFeeShareInr: number;
    carpoolFeeInr: number;
    carpoolCreditInr: number;
    /** Prepaid tournament pool credited to fees_paid_by Admin for this match. */
    tournamentCreditInr: number;
    totalInr: number;
    status: ChargeStatus;
    utr: string | null;
    screenshotPath: string | null;
    paidAt: IsoDateTime | null;
    markedPaidBy: ProfileId | null;
    /** e.g. "Collector so auto settled" when the fee collector is also billed. */
    note: string | null;
  };

export type SettlementReimbursement = Timestamps &
  TeamScoped & {
    id: SettlementReimbursementId;
    settlementId: WeekendSettlementId;
    userId: ProfileId;
    amountInr: number;
    status: ReimbursementStatus;
    utr: string | null;
    screenshotPath: string | null;
    paidAt: IsoDateTime | null;
    markedPaidBy: ProfileId | null;
  };

/** Admin pays collected match fees onward to the tournament/ground organizer. */
export type SettlementOrganizerPayout = Timestamps &
  TeamScoped & {
    id: SettlementOrganizerPayoutId;
    settlementId: WeekendSettlementId;
    /** Null = one organizer for the whole weekend. */
    matchId: MatchId | null;
    payeeName: string | null;
    amountInr: number;
    status: ReimbursementStatus;
    utr: string | null;
    screenshotPath: string | null;
    paidAt: IsoDateTime | null;
    markedPaidBy: ProfileId | null;
  };

export type TeamFundAccount = Timestamps &
  TeamScoped & {
    id: TeamFundAccountId;
    balanceInr: number;
  };

export type Expense = Timestamps &
  TeamScoped & {
    id: ExpenseId;
    amountInr: number;
    category: string;
    note: string | null;
    createdBy: ProfileId | null;
  };

export type FundTransaction = TeamScoped & {
  id: FundTransactionId;
  accountId: TeamFundAccountId;
  direction: FundTxnDirection;
  amountInr: number;
  note: string | null;
  expenseId: ExpenseId | null;
  contributionId: FundContributionId | null;
  createdBy: ProfileId | null;
  createdAt: IsoDateTime;
};

export type FundContributionAsk = Timestamps &
  TeamScoped & {
    id: FundContributionAskId;
    amountPerPlayerInr: number;
    note: string | null;
    status: ContributionAskStatus;
    sentAt: IsoDateTime | null;
    createdBy: ProfileId | null;
  };

/** Single recorded contribution payment from a player into the funds. */
export type FundContribution = Timestamps &
  TeamScoped & {
    id: FundContributionId;
    userId: ProfileId;
    amountInr: number;
    askId: FundContributionAskId | null;
    note: string | null;
    createdBy: ProfileId | null;
  };

/** Aggregated contribution total for one active member. */
export type PlayerFundContributionSummary = {
  userId: ProfileId;
  fullName: string | null;
  avatarUrl: string | null;
  totalInr: number;
  paymentCount: number;
};

export type ExpenseHub = {
  balanceInr: number;
  totalContributedInr: number;
  totalExpensesInr: number;
  playerContributions: PlayerFundContributionSummary[];
  expenses: Expense[];
};
