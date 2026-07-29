import { CARPOOL_FEE_INR, MVP_TEAM } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  confirmSettlementSchema,
  generateSettlementSchema,
  markOfflinePaidSchema,
  submitPaymentProofSchema,
  submitReimbursementProofSchema,
} from "@/lib/validations/payment";
import type { MatchRepository } from "@/repositories/match.repository";
import type { PaymentRepository } from "@/repositories/payment.repository";
import type { TeamRepository } from "@/repositories/team.repository";
import {
  createBrowserMatchRepository,
  createBrowserPaymentRepository,
  createBrowserTeamRepository,
} from "@/repositories";
import type { ProfileId } from "@/types/common";
import type {
  SettlementCharge,
  SettlementReimbursement,
  WeekendSettlement,
} from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";
import { toLocalIsoDate, weekendContainingDate } from "@/utils";

type Actor = ServiceActor | { actorId: ProfileId | string };

export type MatchSettlementReport = {
  matchId: string;
  weekStartDate: string;
  settlement: WeekendSettlement | null;
  /** Admin: all match charges. Player: only own charge (0–1 rows). */
  charges: SettlementCharge[];
  viewerCharge: SettlementCharge | null;
  canViewAllCharges: boolean;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Weekend fee settlement — generate charges, Player pay proof, Admin offline.
 */
export class PaymentService extends BaseService {
  protected readonly serviceName = "payment.service";

  constructor(
    private readonly payments: PaymentRepository,
    private readonly matches: MatchRepository,
    private readonly teams: TeamRepository,
  ) {
    super();
  }

  async listMyCharges(actor: Actor): Promise<SettlementCharge[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.payments.listChargesForUser(MVP_TEAM.id, actor.actorId);
    });
  }

  async listTeamCharges(actor: Actor): Promise<SettlementCharge[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      return this.payments.listTeamCharges(MVP_TEAM.id);
    });
  }

  async listTeamReimbursements(
    actor: Actor,
  ): Promise<SettlementReimbursement[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      return this.payments.listTeamReimbursements(MVP_TEAM.id);
    });
  }

  async listOpenSettlements(actor: Actor): Promise<WeekendSettlement[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const page = await this.payments.listOpenSettlements(MVP_TEAM.id);
      return page.items;
    });
  }

  /**
   * Past-match fee report — charges for this fixture + weekend settlement row.
   * Players receive only their own charge amounts; Admins receive the full set.
   */
  async getMatchSettlementReport(
    matchId: string,
    actor: Actor,
  ): Promise<MatchSettlementReport> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.teamId !== MVP_TEAM.id) {
        throw this.notFound("Match not found");
      }

      const weekStart = weekendContainingDate(match.matchDate).saturday;
      const settlement = await this.payments.findSettlementByWeek(
        MVP_TEAM.id,
        weekStart,
      );
      const allCharges = await this.payments.listChargesByMatch(matchId);
      const isAdmin = membership.role === "admin";
      const charges = isAdmin
        ? allCharges
        : allCharges.filter((charge) => charge.userId === actor.actorId);

      return {
        matchId: match.id,
        weekStartDate: weekStart,
        settlement,
        charges,
        viewerCharge:
          allCharges.find((charge) => charge.userId === actor.actorId) ?? null,
        canViewAllCharges: isAdmin,
      };
    });
  }

  async generateWeekendSettlement(
    weekStartDate: string,
    actor: Actor,
  ): Promise<WeekendSettlement> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      generateSettlementSchema.parse({ weekStartDate });
      return this.generateWeekendSettlementInternal(weekStartDate);
    });
  }

  /** Shared by Admin UI and Sunday Cron. weekStartDate = Saturday YYYY-MM-DD */
  async generateWeekendSettlementInternal(
    weekStartDate: string,
  ): Promise<WeekendSettlement> {
    const saturday = weekStartDate;
    const sundayDate = new Date(
      Number(saturday.slice(0, 4)),
      Number(saturday.slice(5, 7)) - 1,
      Number(saturday.slice(8, 10)) + 1,
    );
    const sunday = toLocalIsoDate(sundayDate);

    let settlement = await this.payments.findSettlementByWeek(
      MVP_TEAM.id,
      saturday,
    );
    if (!settlement) {
      settlement = await this.payments.createSettlement({
        team_id: MVP_TEAM.id,
        week_start_date: saturday,
        status: "collecting",
        // Only the Sunday Cron sends the single weekend payment notification.
        notified_at: null,
      });
    } else if (settlement.status === "settled") {
      throw this.conflict("Settlement already settled for this weekend");
    } else {
      settlement = await this.payments.updateSettlement(settlement.id, {
        status: "collecting",
      });
    }

    const weekendMatches = await this.matches.listMatches({
      teamId: MVP_TEAM.id,
      fromDate: saturday,
      toDate: sunday,
      limit: 10,
      sortBy: "match_date",
      sortDirection: "asc",
    });

    const completed = weekendMatches.items.filter(
      (m) =>
        m.status === "completed" && m.squadFinalizedAt && m.carpoolAssignedAt,
    );

    for (const match of completed) {
      const squad = await this.matches.listSquadMembers(match.id);
      if (squad.length === 0) continue;

      const rides = await this.matches.listCarpoolRides(match.id);
      const passengerFees = new Map<string, number>();
      const driverCredits = new Map<string, number>();
      for (const ride of rides) {
        const credit = ride.passengerUserIds.length * CARPOOL_FEE_INR;
        driverCredits.set(
          String(ride.driverUserId),
          (driverCredits.get(String(ride.driverUserId)) ?? 0) + credit,
        );
        for (const passengerId of ride.passengerUserIds) {
          passengerFees.set(String(passengerId), CARPOOL_FEE_INR);
        }
      }

      const squadUserIds = squad.map((m) => String(m.userId));
      const totalFees = match.matchFeesInr ?? 0;
      const share = totalFees > 0 ? round2(totalFees / squadUserIds.length) : 0;

      for (const member of squad) {
        const userId = String(member.userId);
        const carpoolFee = passengerFees.get(userId) ?? 0;
        const carpoolCredit = driverCredits.get(userId) ?? 0;
        const provisional = round2(share + carpoolFee - carpoolCredit);
        await this.payments.upsertCharge({
          settlement_id: String(settlement.id),
          match_id: String(match.id),
          team_id: MVP_TEAM.id,
          user_id: userId,
          match_fee_share_inr: share,
          carpool_fee_inr: carpoolFee,
          carpool_credit_inr: carpoolCredit,
          total_inr: Math.max(0, provisional),
          status: "pending",
        });
      }

      await this.payments.deletePendingOrphanCharges(
        String(match.id),
        squadUserIds,
      );
    }

    await this.applyWeekendNetting(String(settlement.id));
    return settlement;
  }

  /**
   * After per-match lines exist, net each user's weekend owed vs credit.
   * Leftover credit becomes a driver reimbursement for Admin to settle offline.
   */
  private async applyWeekendNetting(settlementId: string): Promise<void> {
    const charges = await this.payments.listChargesForSettlement(settlementId);
    const byUser = new Map<string, SettlementCharge[]>();
    for (const charge of charges) {
      const key = String(charge.userId);
      const list = byUser.get(key) ?? [];
      list.push(charge);
      byUser.set(key, list);
    }

    const reimbursementUserIds: string[] = [];

    for (const [userId, userCharges] of byUser) {
      const pending = userCharges.filter((c) => c.status === "pending");
      if (pending.length === 0) continue;

      const owed = pending.reduce(
        (sum, c) => sum + c.matchFeeShareInr + c.carpoolFeeInr,
        0,
      );
      const credit = pending.reduce((sum, c) => sum + c.carpoolCreditInr, 0);
      const net = round2(owed - credit);

      if (net > 0) {
        let remaining = net;
        for (let i = 0; i < pending.length; i += 1) {
          const charge = pending[i]!;
          const isLast = i === pending.length - 1;
          const amount = isLast
            ? remaining
            : Math.min(
                remaining,
                round2(charge.matchFeeShareInr + charge.carpoolFeeInr),
              );
          remaining = round2(remaining - amount);
          await this.payments.updateCharge(charge.id, {
            total_inr: Math.max(0, amount),
          });
        }
      } else {
        for (const charge of pending) {
          await this.payments.updateCharge(charge.id, { total_inr: 0 });
        }
        if (net < 0) {
          reimbursementUserIds.push(userId);
          await this.payments.upsertReimbursement({
            settlement_id: settlementId,
            team_id: MVP_TEAM.id,
            user_id: userId,
            amount_inr: Math.abs(net),
            status: "pending",
          });
        }
      }
    }

    await this.payments.deletePendingOrphanReimbursements(
      settlementId,
      reimbursementUserIds,
    );
  }

  async submitPaymentProof(
    input: { chargeId: string; utr: string; screenshotPath: string },
    actor: Actor,
  ): Promise<SettlementCharge> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.PAYMENT_SUBMIT);
      const parsed = submitPaymentProofSchema.parse(input);
      const charge = await this.payments.findChargeByIdOrThrow(parsed.chargeId);
      if (String(charge.userId) !== actor.actorId) {
        throw this.forbidden("You can only pay your own charges");
      }
      if (charge.status !== "pending") {
        throw this.conflict("Charge is already paid");
      }
      if (charge.totalInr <= 0) {
        throw this.conflict("Nothing due on this charge");
      }
      return this.payments.updateCharge(charge.id, {
        status: "paid",
        utr: parsed.utr,
        screenshot_path: parsed.screenshotPath,
        paid_at: new Date().toISOString(),
      });
    });
  }

  async markOfflinePaid(
    chargeIds: string[],
    actor: Actor,
  ): Promise<SettlementCharge[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.PAYMENT_MARK_OFFLINE);
      const parsed = markOfflinePaidSchema.parse({ chargeIds });
      const now = new Date().toISOString();
      const updated: SettlementCharge[] = [];
      for (const id of parsed.chargeIds) {
        const charge = await this.payments.findChargeByIdOrThrow(id);
        if (charge.status !== "pending") continue;
        updated.push(
          await this.payments.updateCharge(id, {
            status: "offline_paid",
            paid_at: now,
            marked_paid_by: actor.actorId,
          }),
        );
      }
      return updated;
    });
  }

  async submitReimbursementProof(
    input: {
      reimbursementId: string;
      utr: string;
      screenshotPath: string;
    },
    actor: Actor,
  ): Promise<SettlementReimbursement> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.PAYMENT_MARK_OFFLINE);
      const parsed = submitReimbursementProofSchema.parse(input);
      const row = await this.payments.findReimbursementByIdOrThrow(
        parsed.reimbursementId,
      );
      if (row.status !== "pending") {
        throw this.conflict("Reimbursement is already settled");
      }
      return this.payments.updateReimbursement(row.id, {
        status: "offline_paid",
        utr: parsed.utr,
        screenshot_path: parsed.screenshotPath,
        paid_at: new Date().toISOString(),
        marked_paid_by: actor.actorId,
      });
    });
  }

  async confirmSettlementSettled(
    settlementId: string,
    actor: Actor,
  ): Promise<WeekendSettlement> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      confirmSettlementSchema.parse({ settlementId });
      const settlement =
        await this.payments.findSettlementByIdOrThrow(settlementId);
      const charges = await this.payments.listChargesForSettlement(
        settlement.id,
      );
      const pending = charges.filter(
        (c) => c.status === "pending" && c.totalInr > 0,
      );
      if (pending.length > 0) {
        throw this.conflict(
          `${pending.length} charge(s) still pending — mark offline or wait for pay`,
        );
      }
      const reimbursements =
        await this.payments.listReimbursementsForSettlement(settlement.id);
      const pendingReimburse = reimbursements.filter(
        (r) => r.status === "pending",
      );
      if (pendingReimburse.length > 0) {
        throw this.conflict(
          `${pendingReimburse.length} driver reimbursement(s) still pending`,
        );
      }
      return this.payments.updateSettlement(settlement.id, {
        status: "settled",
        settled_at: new Date().toISOString(),
      });
    });
  }

  async unpaidSummary(actor: Actor): Promise<{
    count: number;
    totalInr: number;
  }> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const pending = await this.payments.listTeamCharges(
        MVP_TEAM.id,
        "pending",
      );
      const due = pending.filter((c) => c.totalInr > 0);
      return {
        count: due.length,
        totalInr: due.reduce((sum, c) => sum + c.totalInr, 0),
      };
    });
  }
}

export function createBrowserPaymentService(): PaymentService {
  return new PaymentService(
    createBrowserPaymentRepository(),
    createBrowserMatchRepository(),
    createBrowserTeamRepository(),
  );
}
