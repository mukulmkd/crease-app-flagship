import { FUND_CONTRIBUTION_ASK_INR, MVP_TEAM } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  addExpenseSchema,
  createContributionAskSchema,
  fundOpeningBalanceSchema,
} from "@/lib/validations/fund";
import type { FundRepository } from "@/repositories/fund.repository";
import type { TeamRepository } from "@/repositories/team.repository";
import {
  createBrowserFundRepository,
  createBrowserTeamRepository,
} from "@/repositories";
import type { ProfileId } from "@/types/common";
import type {
  Expense,
  FundContributionAsk,
  FundTransaction,
  TeamFundAccount,
} from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";
import { broadcastTeamNotificationAction } from "@/services/notification.actions";

type Actor = ServiceActor | { actorId: ProfileId | string };

/**
 * Ranches Thunders fund tracker — balance, expenses, contribution asks.
 */
export class FundService extends BaseService {
  protected readonly serviceName = "fund.service";

  constructor(
    private readonly funds: FundRepository,
    private readonly teams: TeamRepository,
  ) {
    super();
  }

  async getBalance(actor: Actor): Promise<TeamFundAccount> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_VIEW);
      return this.funds.getAccountOrThrow(MVP_TEAM.id);
    });
  }

  async listTransactions(actor: Actor): Promise<FundTransaction[]> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_VIEW);
      const page = await this.funds.listTransactions(MVP_TEAM.id);
      return page.items;
    });
  }

  async addExpense(
    input: { amountInr: number; category?: string; note?: string | null },
    actor: Actor,
  ): Promise<Expense> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_EXPENSE_ADD);
      const parsed = addExpenseSchema.parse(input);
      const account = await this.funds.getAccountOrThrow(MVP_TEAM.id);
      const expense = await this.funds.createExpense({
        team_id: MVP_TEAM.id,
        amount_inr: parsed.amountInr,
        category: parsed.category ?? "other",
        note: parsed.note ?? null,
        created_by: actor.actorId,
      });
      await this.funds.createTransaction({
        team_id: MVP_TEAM.id,
        account_id: String(account.id),
        direction: "debit",
        amount_inr: parsed.amountInr,
        note: parsed.note ?? parsed.category,
        expense_id: String(expense.id),
        created_by: actor.actorId,
      });
      await this.funds.updateBalance(
        account.id,
        Math.round((account.balanceInr - parsed.amountInr) * 100) / 100,
      );
      return expense;
    });
  }

  async setOpeningBalance(
    input: { amountInr: number; note?: string },
    actor: Actor,
  ): Promise<TeamFundAccount> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_EXPENSE_ADD);
      const parsed = fundOpeningBalanceSchema.parse(input);
      const account = await this.funds.getAccountOrThrow(MVP_TEAM.id);
      const delta = parsed.amountInr - account.balanceInr;
      if (delta !== 0) {
        await this.funds.createTransaction({
          team_id: MVP_TEAM.id,
          account_id: String(account.id),
          direction: delta > 0 ? "credit" : "debit",
          amount_inr: Math.abs(delta),
          note: parsed.note ?? "Opening / adjustment",
          created_by: actor.actorId,
        });
      }
      return this.funds.updateBalance(account.id, parsed.amountInr);
    });
  }

  async createAndSendContributionAsk(
    input: { amountPerPlayerInr?: number; note?: string | null },
    actor: Actor,
  ): Promise<FundContributionAsk> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_CONTRIBUTION_ASK);
      const parsed = createContributionAskSchema.parse(input);
      const amount = parsed.amountPerPlayerInr ?? FUND_CONTRIBUTION_ASK_INR;
      const ask = await this.funds.createContributionAsk({
        team_id: MVP_TEAM.id,
        amount_per_player_inr: amount,
        note: parsed.note ?? null,
        status: "sent",
        sent_at: new Date().toISOString(),
        created_by: actor.actorId,
      });

      await broadcastTeamNotificationAction({
        type: "fund",
        title: `Contribute ₹${amount}`,
        body:
          parsed.note?.trim() ||
          "Admin asked for a team fund contribution. Pay offline and confirm with Admin.",
        data: { askId: ask.id },
        adminOnly: true,
      });

      const team = await this.teams.getMvpTeam();
      if (team.whatsappNotifyUrl) {
        try {
          await fetch(team.whatsappNotifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `Ranches Thunders fund ask: ₹${amount} per player.`,
              askId: ask.id,
            }),
          });
        } catch {
          // Non-blocking
        }
      }

      return ask;
    });
  }
}

export function createBrowserFundService(): FundService {
  return new FundService(
    createBrowserFundRepository(),
    createBrowserTeamRepository(),
  );
}
