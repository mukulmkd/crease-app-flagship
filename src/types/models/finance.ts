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
  FundTransactionId,
  IsoDate,
  IsoDateTime,
  MatchId,
  ProfileId,
  SettlementChargeId,
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
    totalInr: number;
    status: ChargeStatus;
    utr: string | null;
    screenshotPath: string | null;
    paidAt: IsoDateTime | null;
    markedPaidBy: ProfileId | null;
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
