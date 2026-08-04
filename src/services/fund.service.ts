import { FUND_CONTRIBUTION_ASK_INR, MVP_TEAM } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  addExpenseSchema,
  createContributionAskSchema,
  recordContributionSchema,
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
  ExpenseHub,
  FundContribution,
  FundContributionAsk,
} from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import { requireAdmin } from "@/services/shared/membership";
import { broadcastTeamNotificationAction } from "@/services/notification.actions";

type Actor = ServiceActor | { actorId: ProfileId | string };

/**
 * Ranches Thunders fund tracker — expenses, contributions, and asks.
 */
export class FundService extends BaseService {
  protected readonly serviceName = "fund.service";

  constructor(
    private readonly funds: FundRepository,
    private readonly teams: TeamRepository,
  ) {
    super();
  }

  async getExpenseHub(actor: Actor): Promise<ExpenseHub> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_VIEW);

      const [account, expensesPage, contributionsPage, membersPage] =
        await Promise.all([
          this.funds.getAccount(MVP_TEAM.id),
          this.funds.listExpenses(MVP_TEAM.id),
          this.funds.listContributions(MVP_TEAM.id),
          this.teams.listMembershipsWithProfiles({
            teamId: MVP_TEAM.id,
            status: "active",
            limit: 100,
          }),
        ]);

      const totalsByUser = new Map<
        string,
        { totalInr: number; count: number }
      >();
      for (const row of contributionsPage.items) {
        const key = String(row.userId);
        const prev = totalsByUser.get(key) ?? { totalInr: 0, count: 0 };
        totalsByUser.set(key, {
          totalInr: Math.round((prev.totalInr + row.amountInr) * 100) / 100,
          count: prev.count + 1,
        });
      }

      const playerContributions = membersPage.items
        .map((member) => {
          const totals = totalsByUser.get(String(member.userId)) ?? {
            totalInr: 0,
            count: 0,
          };
          return {
            userId: member.userId,
            fullName: member.profile.fullName,
            avatarUrl: member.profile.avatarUrl,
            totalInr: totals.totalInr,
            paymentCount: totals.count,
          };
        })
        .sort((a, b) => {
          if (b.totalInr !== a.totalInr) return b.totalInr - a.totalInr;
          return (a.fullName ?? "").localeCompare(b.fullName ?? "");
        });

      const totalContributedInr = playerContributions.reduce(
        (sum, row) => sum + row.totalInr,
        0,
      );
      const totalExpensesInr = expensesPage.items.reduce(
        (sum, row) => sum + row.amountInr,
        0,
      );

      return {
        balanceInr: account?.balanceInr ?? 0,
        totalContributedInr: Math.round(totalContributedInr * 100) / 100,
        totalExpensesInr: Math.round(totalExpensesInr * 100) / 100,
        playerContributions,
        expenses: expensesPage.items,
      };
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

  async recordContribution(
    input: {
      userId: string;
      amountInr: number;
      note?: string | null;
      askId?: string | null;
    },
    actor: Actor,
  ): Promise<FundContribution> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.FUND_EXPENSE_ADD);
      const parsed = recordContributionSchema.parse(input);

      const playerMembership = await this.teams.findMembership(
        MVP_TEAM.id,
        parsed.userId,
      );
      if (!playerMembership || playerMembership.status !== "active") {
        throw new AppError(
          "VALIDATION",
          "Player must be an active team member",
          400,
        );
      }

      const account = await this.funds.getAccountOrThrow(MVP_TEAM.id);
      const contribution = await this.funds.createContribution({
        team_id: MVP_TEAM.id,
        user_id: parsed.userId,
        amount_inr: parsed.amountInr,
        ask_id: parsed.askId ?? null,
        note: parsed.note ?? null,
        created_by: actor.actorId,
      });
      await this.funds.createTransaction({
        team_id: MVP_TEAM.id,
        account_id: String(account.id),
        direction: "credit",
        amount_inr: parsed.amountInr,
        note: parsed.note ?? "Player contribution",
        contribution_id: String(contribution.id),
        created_by: actor.actorId,
      });
      await this.funds.updateBalance(
        account.id,
        Math.round((account.balanceInr + parsed.amountInr) * 100) / 100,
      );
      return contribution;
    });
  }

  /**
   * Saves a fund ask and notifies the WhatsApp group (plus in-app for all members).
   */
  async createAndSendContributionAsk(
    input: { amountPerPlayerInr: number; note?: string | null },
    actor: Actor,
  ): Promise<FundContributionAsk & { whatsappSent: boolean }> {
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

      const body =
        parsed.note?.trim() ||
        `Admin asked for ₹${amount} per player toward the team fund. Pay offline and confirm with Admin.`;

      await broadcastTeamNotificationAction({
        type: "fund",
        title: `Contribute ₹${amount}`,
        body,
        data: { askId: ask.id },
        adminOnly: true,
      });

      const team = await this.teams.getMvpTeam();
      let whatsappSent = false;
      if (team.whatsappNotifyUrl) {
        try {
          const response = await fetch(team.whatsappNotifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: [
                `*Ranches Thunders — fund ask*`,
                `Please contribute *₹${amount}* each to the team fund.`,
                parsed.note?.trim() ? parsed.note.trim() : null,
                `Pay offline and confirm with Admin.`,
              ]
                .filter(Boolean)
                .join("\n"),
            }),
          });
          whatsappSent = response.ok;
        } catch {
          whatsappSent = false;
        }
      }

      return { ...ask, whatsappSent };
    });
  }
}

export function createBrowserFundService(): FundService {
  return new FundService(
    createBrowserFundRepository(),
    createBrowserTeamRepository(),
  );
}
