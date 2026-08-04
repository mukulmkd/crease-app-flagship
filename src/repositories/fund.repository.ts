import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import {
  mapExpense,
  mapFundContribution,
  mapFundContributionAsk,
  mapFundTransaction,
  mapTeamFundAccount,
} from "@/repositories/shared/mappers";
import type { TablesInsert } from "@/types/database";
import type { Paginated, TeamId } from "@/types/common";
import type {
  Expense,
  FundContribution,
  FundContributionAsk,
  FundTransaction,
  TeamFundAccount,
} from "@/types/models";

/**
 * Funds account, expenses, asks, contributions — CRUD only.
 */
export class FundRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async getAccount(teamId: TeamId | string): Promise<TeamFundAccount | null> {
    const { data, error } = await this.client
      .from("team_fund_accounts")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();
    this.assertOk(error, "fund.getAccount");
    return data ? mapTeamFundAccount(data) : null;
  }

  async getAccountOrThrow(teamId: TeamId | string): Promise<TeamFundAccount> {
    const account = await this.getAccount(teamId);
    if (!account) {
      throw new AppError("NOT_FOUND", "Funds account not found", 404);
    }
    return account;
  }

  async updateBalance(
    accountId: string,
    balanceInr: number,
  ): Promise<TeamFundAccount> {
    const { data, error } = await this.client
      .from("team_fund_accounts")
      .update({ balance_inr: balanceInr })
      .eq("id", accountId)
      .select("*")
      .single();
    this.assertOk(error, "fund.updateBalance");
    return mapTeamFundAccount(this.requireData(data, "fund.updateBalance"));
  }

  async createExpense(input: TablesInsert<"expenses">): Promise<Expense> {
    const { data, error } = await this.client
      .from("expenses")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "fund.createExpense");
    return mapExpense(this.requireData(data, "fund.createExpense"));
  }

  async createTransaction(
    input: TablesInsert<"team_fund_transactions">,
  ): Promise<FundTransaction> {
    const { data, error } = await this.client
      .from("team_fund_transactions")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "fund.createTransaction");
    return mapFundTransaction(this.requireData(data, "fund.createTransaction"));
  }

  async listTransactions(
    teamId: TeamId | string,
  ): Promise<Paginated<FundTransaction>> {
    const { data, error } = await this.client
      .from("team_fund_transactions")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(200);
    this.assertOk(error, "fund.listTransactions");
    return this.paginate((data ?? []).map(mapFundTransaction), 200, 0);
  }

  async listExpenses(teamId: TeamId | string): Promise<Paginated<Expense>> {
    const { data, error } = await this.client
      .from("expenses")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(200);
    this.assertOk(error, "fund.listExpenses");
    return this.paginate((data ?? []).map(mapExpense), 200, 0);
  }

  async createContributionAsk(
    input: TablesInsert<"fund_contribution_asks">,
  ): Promise<FundContributionAsk> {
    const { data, error } = await this.client
      .from("fund_contribution_asks")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "fund.createAsk");
    return mapFundContributionAsk(this.requireData(data, "fund.createAsk"));
  }

  async updateContributionAsk(
    id: string,
    input: Partial<TablesInsert<"fund_contribution_asks">>,
  ): Promise<FundContributionAsk> {
    const { data, error } = await this.client
      .from("fund_contribution_asks")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "fund.updateAsk");
    return mapFundContributionAsk(this.requireData(data, "fund.updateAsk"));
  }

  async createContribution(
    input: TablesInsert<"fund_contributions">,
  ): Promise<FundContribution> {
    const { data, error } = await this.client
      .from("fund_contributions")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "fund.createContribution");
    return mapFundContribution(
      this.requireData(data, "fund.createContribution"),
    );
  }

  async listContributions(
    teamId: TeamId | string,
  ): Promise<Paginated<FundContribution>> {
    const { data, error } = await this.client
      .from("fund_contributions")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(500);
    this.assertOk(error, "fund.listContributions");
    return this.paginate((data ?? []).map(mapFundContribution), 500, 0);
  }
}

export function createBrowserFundRepository(): FundRepository {
  return new FundRepository(createBrowserSupabaseClient());
}
