import {
  carpoolFeeInr,
  COLLECTOR_AUTO_SETTLE_NOTE,
  DEMO_PAYMENT_PROOF_PATH,
  MVP_TEAM,
} from "@/constants/domain/enums";
import type { ChargeStatus } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  confirmSettlementSchema,
  generateSettlementSchema,
  markOfflinePaidSchema,
  nudgeUnpaidWeekendSchema,
  setOrganizerPayoutModeSchema,
  submitOrganizerPayoutProofSchema,
  submitReimbursementProofSchema,
  submitSharedOrganizerPayoutProofSchema,
  submitWeekendPaymentProofSchema,
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
  SettlementOrganizerPayout,
  SettlementReimbursement,
  WeekendSettlement,
} from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import { broadcastTeamNotificationAction } from "@/services/notification.actions";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";
import {
  toLocalIsoDate,
  squadFeeShareInr,
  tournamentMatchFeePoolInr,
  weekendContainingDate,
} from "@/utils";

type Actor = ServiceActor | { actorId: ProfileId | string };

function displayFirstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "Player";
  return trimmed.split(/\s+/)[0]!;
}

export type MatchSettlementReport = {
  matchId: string;
  weekStartDate: string;
  settlement: WeekendSettlement | null;
  /** Admin: all match charges. Player: only own charge (0–1 rows). */
  charges: SettlementCharge[];
  viewerCharge: SettlementCharge | null;
  canViewAllCharges: boolean;
};

/** One match line inside a player's weekend dues card. */
type MyDuesLine = {
  charge: SettlementCharge;
  matchDate: string;
  opposition: string | null;
};

/** Pending dues rolled up to one weekend settlement. */
export type MyWeekendDues = {
  settlementId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalDueInr: number;
  lines: MyDuesLine[];
  /**
   * True when this actor is the team fee collector — billed total is shown,
   * but UPI pay is blocked and lines are auto-closed.
   */
  collectorAutoSettled: boolean;
};

/** Admin view — one player's weekend, with match lines and what is still due. */
export type AdminPlayerDues = {
  userId: string;
  fullName: string | null;
  settlementId: string;
  weekStartDate: string;
  weekEndDate: string;
  /** Billed across the weekend, paid lines included. */
  billedInr: number;
  totalDueInr: number;
  paidInr: number;
  /** Pending line ids — the offline-paid action targets these only. */
  chargeIds: string[];
  /** Fee collector — cannot pay themselves; lines auto-waive. */
  isCollector: boolean;
  matches: Array<{
    chargeId: string;
    matchDate: string;
    opposition: string | null;
    totalInr: number;
    status: ChargeStatus;
    note: string | null;
  }>;
};

/** Admin reimbursement row with display name. */
export type AdminReimbursementRow = {
  reimbursement: SettlementReimbursement;
  fullName: string | null;
};

/** Matches list — whether this fixture still has unpaid team fees. */
export type MatchCollectionStatus = {
  matchId: string;
  settlementId: string;
  hasCharges: boolean;
  /** True if any charge is still pending (even one player). */
  feesPending: boolean;
};

/** Admin Generate / Refresh weekend fees control for one Sat–Sun window. */
export type WeekendFeeGenerateStatus = {
  weekStartDate: string;
  /** Primary button label. */
  label: "Generate weekend fees" | "Refresh weekend fees";
  disabled: boolean;
  /** Short helper under / beside the control. */
  hint: string;
  eligibleMatchCount: number;
  unbilledEligibleCount: number;
  hasCharges: boolean;
};

/** Admin dedicated weekend payment board — Sat/Sun/both rolled into one settlement. */
export type AdminWeekendPaymentSummary = {
  settlement: WeekendSettlement;
  weekStartDate: string;
  weekEndDate: string;
  matches: Array<{
    matchId: string;
    matchDate: string;
    opposition: string | null;
    classification: "warmup" | "tournament";
    /** Ground / day fees on the fixture (₹0 if unset). */
    matchFeesInr: number;
    /**
     * Prepaid tournament entry allocated to this fixture only
     * (`totalFees ÷ plannedMatchCount`). Zero for warmup.
     */
    tournamentFeeForMatchInr: number;
  }>;
  players: AdminPlayerDues[];
  unpaid: AdminPlayerDues[];
  paid: AdminPlayerDues[];
  unpaidTotalInr: number;
  paidTotalInr: number;
  billedTotalInr: number;
  /** Match-fee payouts Admin must prove to organizers before Confirm settled. */
  organizerPayouts: SettlementOrganizerPayout[];
  /** True when every player charge is clear (dues + reimbursements still separate). */
  playersCollected: boolean;
  organizerPayoutPendingInr: number;
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

  /**
   * Player dues grouped by weekend — pending match lines summed under one card.
   * Fee collectors see their billed total with collectorAutoSettled (no UPI pay).
   */
  async listMyWeekendDues(actor: Actor): Promise<MyWeekendDues[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const team = await this.teams.getMvpTeam();
      const isCollector =
        Boolean(team.collectorUserId) &&
        String(team.collectorUserId) === String(actor.actorId);

      const charges = await this.payments.listChargesForUser(
        MVP_TEAM.id,
        actor.actorId,
      );
      const relevant = charges.filter((c) => {
        if (c.status === "pending" && c.totalInr > 0) return true;
        return (
          isCollector &&
          c.status === "waived" &&
          c.note === COLLECTOR_AUTO_SETTLE_NOTE &&
          c.totalInr > 0
        );
      });
      if (relevant.length === 0) return [];

      const settlementIds = [
        ...new Set(relevant.map((c) => String(c.settlementId))),
      ];
      const settlements = new Map<string, WeekendSettlement>();
      for (const id of settlementIds) {
        const row = await this.payments.findSettlementById(id);
        if (row && row.status !== "settled") settlements.set(id, row);
      }

      const scoped = relevant.filter((c) =>
        settlements.has(String(c.settlementId)),
      );
      if (scoped.length === 0) return [];

      const matches = await this.matches.listMatchesByIds(
        scoped.map((c) => String(c.matchId)),
      );
      const matchById = new Map(matches.map((m) => [String(m.id), m]));

      const bySettlement = new Map<string, SettlementCharge[]>();
      for (const charge of scoped) {
        const key = String(charge.settlementId);
        const list = bySettlement.get(key) ?? [];
        list.push(charge);
        bySettlement.set(key, list);
      }

      const weekends: MyWeekendDues[] = [];
      for (const [settlementId, lines] of bySettlement) {
        const settlement = settlements.get(settlementId);
        if (!settlement) continue;
        const week = weekendContainingDate(settlement.weekStartDate);
        const duesLines = lines
          .map((charge) => {
            const match = matchById.get(String(charge.matchId));
            return {
              charge,
              matchDate: match?.matchDate ?? settlement.weekStartDate,
              opposition: match?.opposition ?? null,
            };
          })
          .sort((a, b) => a.matchDate.localeCompare(b.matchDate));

        const collectorAutoSettled =
          isCollector &&
          duesLines.every(
            (line) =>
              line.charge.status === "waived" &&
              line.charge.note === COLLECTOR_AUTO_SETTLE_NOTE,
          );

        weekends.push({
          settlementId,
          weekStartDate: week.saturday,
          weekEndDate: week.sunday,
          totalDueInr: round2(
            duesLines.reduce((sum, line) => sum + line.charge.totalInr, 0),
          ),
          lines: duesLines,
          collectorAutoSettled,
        });
      }

      return weekends.sort((a, b) =>
        b.weekStartDate.localeCompare(a.weekStartDate),
      );
    });
  }

  /**
   * Lightweight fee status for Matches list — flags only, no player amounts.
   * Any pending line (even one) means the fixture is still collecting.
   */
  async listMatchCollectionStatuses(
    actor: Actor,
  ): Promise<MatchCollectionStatus[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const charges = await this.payments.listTeamCharges(MVP_TEAM.id);
      const byMatch = new Map<string, SettlementCharge[]>();
      for (const charge of charges) {
        const key = String(charge.matchId);
        const list = byMatch.get(key) ?? [];
        list.push(charge);
        byMatch.set(key, list);
      }

      const rows: MatchCollectionStatus[] = [];
      for (const [matchId, lines] of byMatch) {
        const pending = lines.some(
          (c) => c.status === "pending" && c.totalInr > 0,
        );
        const settlementId = String(lines[0]!.settlementId);
        rows.push({
          matchId,
          settlementId,
          hasCharges: true,
          feesPending: pending,
        });
      }
      return rows;
    });
  }

  /**
   * Admin settlement roster — every charged player per open weekend.
   * Settled players stay listed (with a zero balance) so Admin can see the
   * whole weekend, not just who still owes.
   */
  async listAdminWeekendDues(actor: Actor): Promise<AdminPlayerDues[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);

      const charges = await this.payments.listTeamCharges(MVP_TEAM.id);
      if (charges.length === 0) return [];

      const team = await this.teams.getMvpTeam();
      const collectorId = team.collectorUserId
        ? String(team.collectorUserId)
        : null;

      const members = await this.teams.listMembershipsWithProfiles({
        teamId: MVP_TEAM.id,
        status: "active",
        limit: 100,
      });
      const nameByUser = new Map(
        members.items.map((m) => [
          String(m.userId),
          m.profile.fullName ?? null,
        ]),
      );

      const settlementIds = [
        ...new Set(charges.map((c) => String(c.settlementId))),
      ];
      const settlements = new Map<string, WeekendSettlement>();
      for (const id of settlementIds) {
        const row = await this.payments.findSettlementById(id);
        if (row && row.status !== "settled") settlements.set(id, row);
      }

      const scoped = charges.filter((c) =>
        settlements.has(String(c.settlementId)),
      );
      if (scoped.length === 0) return [];

      const matches = await this.matches.listMatchesByIds(
        scoped.map((c) => String(c.matchId)),
      );
      const matchById = new Map(matches.map((m) => [String(m.id), m]));

      const byPlayerWeekend = new Map<string, SettlementCharge[]>();
      for (const charge of scoped) {
        const key = `${charge.settlementId}:${charge.userId}`;
        const list = byPlayerWeekend.get(key) ?? [];
        list.push(charge);
        byPlayerWeekend.set(key, list);
      }

      const rows: AdminPlayerDues[] = [];
      for (const [, lines] of byPlayerWeekend) {
        const first = lines[0]!;
        const settlement = settlements.get(String(first.settlementId))!;
        const week = weekendContainingDate(settlement.weekStartDate);
        const userId = String(first.userId);
        const isCollector = collectorId === userId;
        const matchLines = lines
          .map((charge) => {
            const match = matchById.get(String(charge.matchId));
            return {
              chargeId: String(charge.id),
              matchDate: match?.matchDate ?? settlement.weekStartDate,
              opposition: match?.opposition ?? null,
              totalInr: charge.totalInr,
              status: charge.status,
              note: charge.note,
            };
          })
          .sort((a, b) => a.matchDate.localeCompare(b.matchDate));

        const pending = lines.filter(
          (c) => c.status === "pending" && c.totalInr > 0,
        );
        const settled = lines.filter(
          (c) =>
            c.status === "paid" ||
            c.status === "offline_paid" ||
            c.status === "waived",
        );

        rows.push({
          userId,
          fullName: nameByUser.get(userId) ?? null,
          settlementId: String(settlement.id),
          weekStartDate: week.saturday,
          weekEndDate: week.sunday,
          billedInr: round2(
            matchLines.reduce((sum, line) => sum + line.totalInr, 0),
          ),
          totalDueInr: round2(
            pending.reduce((sum, charge) => sum + charge.totalInr, 0),
          ),
          paidInr: round2(
            settled.reduce((sum, charge) => sum + charge.totalInr, 0),
          ),
          chargeIds: pending.map((c) => String(c.id)),
          isCollector,
          matches: matchLines,
        });
      }

      return rows.sort((a, b) => {
        const weekCmp = b.weekStartDate.localeCompare(a.weekStartDate);
        if (weekCmp !== 0) return weekCmp;
        // Outstanding players first, then alphabetical.
        if (a.totalDueInr > 0 !== b.totalDueInr > 0) {
          return a.totalDueInr > 0 ? -1 : 1;
        }
        return (a.fullName ?? "").localeCompare(b.fullName ?? "");
      });
    });
  }

  async listAdminReimbursements(
    actor: Actor,
  ): Promise<AdminReimbursementRow[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      const rows = await this.payments.listTeamReimbursements(MVP_TEAM.id);
      const pending = rows.filter((r) => r.status === "pending");
      if (pending.length === 0) return [];

      const members = await this.teams.listMembershipsWithProfiles({
        teamId: MVP_TEAM.id,
        status: "active",
        limit: 100,
      });
      const nameByUser = new Map(
        members.items.map((m) => [
          String(m.userId),
          m.profile.fullName ?? null,
        ]),
      );

      return pending.map((reimbursement) => ({
        reimbursement,
        fullName: nameByUser.get(String(reimbursement.userId)) ?? null,
      }));
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
   * Whether Admin can Generate / Refresh fees for this weekend.
   * Refresh stays available while collecting so Sunday can be added after
   * Saturday-only billing (and pending lines can be recalculated).
   */
  async getWeekendFeeGenerateStatus(
    weekStartDate: string,
    actor: Actor,
  ): Promise<WeekendFeeGenerateStatus> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      generateSettlementSchema.parse({ weekStartDate });

      const saturday = weekStartDate;
      const sundayDate = new Date(
        Number(saturday.slice(0, 4)),
        Number(saturday.slice(5, 7)) - 1,
        Number(saturday.slice(8, 10)) + 1,
      );
      const sunday = toLocalIsoDate(sundayDate);

      const settlement = await this.payments.findSettlementByWeek(
        MVP_TEAM.id,
        saturday,
      );
      const weekendMatches = await this.matches.listMatches({
        teamId: MVP_TEAM.id,
        fromDate: saturday,
        toDate: sunday,
        limit: 10,
        sortBy: "match_date",
        sortDirection: "asc",
      });
      const eligible = weekendMatches.items.filter(
        (match) =>
          match.status === "completed" &&
          match.squadFinalizedAt &&
          match.carpoolAssignedAt,
      );

      const charges = settlement
        ? await this.payments.listChargesForSettlement(String(settlement.id))
        : [];
      const billedMatchIds = new Set(charges.map((c) => String(c.matchId)));
      const hasCharges = charges.length > 0;
      const unbilledEligibleCount = eligible.filter(
        (match) => !billedMatchIds.has(String(match.id)),
      ).length;

      if (settlement?.status === "settled") {
        return {
          weekStartDate: saturday,
          label: "Generate weekend fees",
          disabled: true,
          hint: "This weekend is already settled.",
          eligibleMatchCount: eligible.length,
          unbilledEligibleCount,
          hasCharges,
        };
      }

      if (eligible.length === 0) {
        return {
          weekStartDate: saturday,
          label: "Generate weekend fees",
          disabled: true,
          hint: "Complete match and assign carpool first.",
          eligibleMatchCount: 0,
          unbilledEligibleCount: 0,
          hasCharges,
        };
      }

      if (hasCharges) {
        return {
          weekStartDate: saturday,
          label: "Refresh weekend fees",
          disabled: false,
          hint:
            unbilledEligibleCount > 0
              ? "Adds newly completed matches. Paid amounts stay."
              : "Safe to re-run after fee edits. Paid amounts stay.",
          eligibleMatchCount: eligible.length,
          unbilledEligibleCount,
          hasCharges,
        };
      }

      return {
        weekStartDate: saturday,
        label: "Generate weekend fees",
        disabled: false,
        hint: "Creates charges for completed weekend matches.",
        eligibleMatchCount: eligible.length,
        unbilledEligibleCount,
        hasCharges: false,
      };
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

    const team = await this.teams.getMvpTeam();
    const feePerPassenger = carpoolFeeInr(Boolean(team.demoMode));

    for (const match of completed) {
      const squad = await this.matches.listSquadMembers(match.id);
      if (squad.length === 0) continue;

      const rides = await this.matches.listCarpoolRides(match.id);
      const passengerFees = new Map<string, number>();
      const driverCredits = new Map<string, number>();
      const rideParticipantIds = new Set<string>();
      for (const ride of rides) {
        const driverId = String(ride.driverUserId);
        rideParticipantIds.add(driverId);
        const credit = ride.passengerUserIds.length * feePerPassenger;
        driverCredits.set(
          driverId,
          (driverCredits.get(driverId) ?? 0) + credit,
        );
        for (const passengerId of ride.passengerUserIds) {
          const pid = String(passengerId);
          rideParticipantIds.add(pid);
          passengerFees.set(pid, feePerPassenger);
        }
      }

      const squadUserIds = squad.map((m) => String(m.userId));
      const squadIdSet = new Set(squadUserIds);
      const tournament =
        match.classification === "tournament" && match.tournamentId
          ? await this.matches.findTournamentById(String(match.tournamentId))
          : null;
      const tournamentPool = tournament
        ? tournamentMatchFeePoolInr(tournament)
        : 0;
      const prepaidByUserId = tournament?.feesPaidByUserId
        ? String(tournament.feesPaidByUserId)
        : null;
      // Match fee → squad only; carpool fee/credit → any assigned rider/driver;
      // tournament prepaid Admin always gets a line so credit can reimburse.
      const billedUserIds = [
        ...new Set([
          ...squadUserIds,
          ...rideParticipantIds,
          ...(prepaidByUserId ? [prepaidByUserId] : []),
        ]),
      ];
      const totalFees = await this.resolvePlayerFeePoolInr(match);
      const share = squadFeeShareInr(totalFees, squadUserIds.length);

      for (const userId of billedUserIds) {
        const matchFeeShare = squadIdSet.has(userId) ? share : 0;
        const carpoolFee = passengerFees.get(userId) ?? 0;
        const carpoolCredit = driverCredits.get(userId) ?? 0;
        const tournamentCredit =
          prepaidByUserId && userId === prepaidByUserId ? tournamentPool : 0;
        const provisional = round2(
          matchFeeShare + carpoolFee - carpoolCredit - tournamentCredit,
        );
        await this.payments.upsertCharge({
          settlement_id: String(settlement.id),
          match_id: String(match.id),
          team_id: MVP_TEAM.id,
          user_id: userId,
          match_fee_share_inr: matchFeeShare,
          carpool_fee_inr: carpoolFee,
          carpool_credit_inr: carpoolCredit,
          tournament_credit_inr: tournamentCredit,
          total_inr: Math.max(0, provisional),
          status: "pending",
        });
      }

      await this.payments.deletePendingOrphanCharges(
        String(match.id),
        billedUserIds,
      );
    }

    await this.applyWeekendNetting(String(settlement.id));
    await this.autoSettleCollectorCharges(String(settlement.id));
    await this.ensureOrganizerPayouts(String(settlement.id));
    return settlement;
  }

  /**
   * Close the fee collector's pending dues across every open weekend.
   * Call after assignPaymentCollector so they never owe themselves.
   */
  async autoSettleCollectorDues(actor: Actor): Promise<number> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TEAM_SETTINGS_EDIT);
      const team = await this.teams.getMvpTeam();
      if (!team.collectorUserId) return 0;

      const charges = await this.payments.listTeamCharges(MVP_TEAM.id);
      const settlementIds = [
        ...new Set(charges.map((c) => String(c.settlementId))),
      ];
      let closed = 0;
      for (const id of settlementIds) {
        const settlement = await this.payments.findSettlementById(id);
        if (!settlement || settlement.status === "settled") continue;
        closed += await this.autoSettleCollectorCharges(id);
      }
      return closed;
    });
  }

  /**
   * Fee collector cannot UPI to themselves — waive their pending lines with
   * the standard note so billed totals stay visible in Admin/player views.
   */
  private async autoSettleCollectorCharges(
    settlementId: string,
  ): Promise<number> {
    const team = await this.teams.getMvpTeam();
    if (!team.collectorUserId) return 0;

    const charges = await this.payments.listChargesForSettlement(settlementId);
    const pending = charges.filter(
      (c) =>
        String(c.userId) === String(team.collectorUserId) &&
        c.status === "pending" &&
        c.totalInr > 0,
    );
    if (pending.length === 0) return 0;

    const updated = await this.payments.updatePendingCharges(
      pending.map((c) => String(c.id)),
      {
        status: "waived",
        note: COLLECTOR_AUTO_SETTLE_NOTE,
        paid_at: new Date().toISOString(),
        marked_paid_by: String(team.collectorUserId),
      },
    );
    return updated.length;
  }

  /**
   * After per-match lines exist, net each user's weekend owed vs credit.
   * Leftover credit (carpool and/or tournament prepaid) becomes a reimbursement
   * for Admin to settle offline with UTR + screenshot.
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

      /*
       * Each line absorbs its own match credits first, so a row always reads as
       * share + carpool fee − carpool credit − tournament credit. Pooling the
       * whole weekend up front made a driver's credit land on the other day's
       * row and looked like a mischarge.
       */
      const lines = pending.map((charge) => {
        const due = round2(charge.matchFeeShareInr + charge.carpoolFeeInr);
        const credit = round2(
          charge.carpoolCreditInr + charge.tournamentCreditInr,
        );
        const absorbed = Math.min(due, credit);
        return {
          charge,
          total: round2(due - absorbed),
          surplus: round2(credit - absorbed),
        };
      });

      // Credit a match cannot absorb offsets this user's other weekend dues.
      let surplus = round2(lines.reduce((sum, line) => sum + line.surplus, 0));
      for (const line of lines) {
        if (surplus <= 0) break;
        const applied = Math.min(surplus, line.total);
        line.total = round2(line.total - applied);
        surplus = round2(surplus - applied);
      }

      for (const line of lines) {
        if (line.total === line.charge.totalInr) continue;
        await this.payments.updateCharge(line.charge.id, {
          total_inr: Math.max(0, line.total),
        });
      }

      if (surplus > 0) {
        reimbursementUserIds.push(userId);
        await this.payments.upsertReimbursement({
          settlement_id: settlementId,
          team_id: MVP_TEAM.id,
          user_id: userId,
          amount_inr: surplus,
          status: "pending",
        });
      }
    }

    await this.payments.deletePendingOrphanReimbursements(
      settlementId,
      reimbursementUserIds,
    );
  }

  /**
   * One UPI payment for the weekend total — same UTR/screenshot on every
   * pending line for this player in the settlement.
   */
  async submitWeekendPaymentProof(
    input: { settlementId: string; utr: string; screenshotPath: string },
    actor: Actor,
  ): Promise<SettlementCharge[]> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.PAYMENT_SUBMIT);
      const parsed = submitWeekendPaymentProofSchema.parse(input);
      const team = await this.teams.getMvpTeam();
      if (parsed.screenshotPath === DEMO_PAYMENT_PROOF_PATH && !team.demoMode) {
        throw this.forbidden("Demo payment proofs require demo mode");
      }
      if (
        team.collectorUserId &&
        String(team.collectorUserId) === String(actor.actorId)
      ) {
        throw this.conflict(
          "Fee collector cannot pay themselves — dues auto-settle",
        );
      }

      const settlement = await this.payments.findSettlementByIdOrThrow(
        parsed.settlementId,
      );
      if (String(settlement.teamId) !== MVP_TEAM.id) {
        throw this.notFound("Settlement not found");
      }

      const charges = await this.payments.listChargesForUser(
        MVP_TEAM.id,
        actor.actorId,
      );
      const due = charges.filter(
        (c) =>
          String(c.settlementId) === parsed.settlementId &&
          c.status === "pending" &&
          c.totalInr > 0,
      );
      if (due.length === 0) {
        throw this.conflict("Nothing due for this weekend");
      }

      const updated = await this.payments.updatePendingCharges(
        due.map((charge) => String(charge.id)),
        {
          status: "paid",
          utr: parsed.utr,
          screenshot_path: parsed.screenshotPath,
          paid_at: new Date().toISOString(),
        },
      );
      await this.maybeRemindOrganizerPayout(parsed.settlementId);
      return updated;
    });
  }

  async markOfflinePaid(
    input: {
      chargeIds: string[];
      utr: string;
      screenshotPath: string;
    },
    actor: Actor,
  ): Promise<SettlementCharge[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.PAYMENT_MARK_OFFLINE);
      const parsed = markOfflinePaidSchema.parse(input);
      const team = await this.teams.getMvpTeam();
      if (parsed.screenshotPath === DEMO_PAYMENT_PROOF_PATH && !team.demoMode) {
        throw this.forbidden("Demo payment proofs require demo mode");
      }
      if (team.collectorUserId) {
        const charges = await this.payments.listTeamCharges(MVP_TEAM.id);
        const touchingCollector = parsed.chargeIds.some((id) => {
          const row = charges.find((c) => String(c.id) === id);
          return row && String(row.userId) === String(team.collectorUserId);
        });
        if (touchingCollector) {
          throw this.conflict(
            "Collector dues auto-settle — no offline payment needed",
          );
        }
      }
      const updated = await this.payments.updatePendingCharges(
        parsed.chargeIds,
        {
          status: "offline_paid",
          utr: parsed.utr,
          screenshot_path: parsed.screenshotPath,
          paid_at: new Date().toISOString(),
          marked_paid_by: actor.actorId,
        },
      );
      if (updated.length === 0) {
        throw this.conflict("No pending charges to mark offline paid");
      }
      const settlementId = updated[0] ? String(updated[0].settlementId) : null;
      if (settlementId) {
        await this.maybeRemindOrganizerPayout(settlementId);
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
      const team = await this.teams.getMvpTeam();
      if (parsed.screenshotPath === DEMO_PAYMENT_PROOF_PATH && !team.demoMode) {
        throw this.forbidden("Demo payment proofs require demo mode");
      }
      const row = await this.payments.findReimbursementByIdOrThrow(
        parsed.reimbursementId,
      );
      if (row.status !== "pending") {
        throw this.conflict("Reimbursement is already settled");
      }
      const updated = await this.payments.updateReimbursement(row.id, {
        status: "offline_paid",
        utr: parsed.utr,
        screenshot_path: parsed.screenshotPath,
        paid_at: new Date().toISOString(),
        marked_paid_by: actor.actorId,
      });
      await this.maybeRemindOrganizerPayout(String(row.settlementId));
      return updated;
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
      await this.ensureOrganizerPayouts(String(settlement.id));
      const organizerPayouts =
        await this.payments.listOrganizerPayoutsForSettlement(
          String(settlement.id),
        );
      const pendingOrganizer = organizerPayouts.filter(
        (row) => row.status === "pending",
      );
      if (pendingOrganizer.length > 0) {
        throw this.conflict(
          `${pendingOrganizer.length} organizer payout(s) still pending — upload proof of payment to the organizer`,
        );
      }
      const settledAt = new Date().toISOString();
      const updated = await this.payments.updateSettlement(settlement.id, {
        status: "settled",
        settled_at: settledAt,
      });

      // Stamp match fees settled + archive tournaments with no remaining matches.
      const matchIds = [...new Set(charges.map((c) => String(c.matchId)))];
      await this.matches.markMatchesFeesSettled(matchIds, settledAt);
      await this.archiveTournamentsIfFullySettled(matchIds);

      return updated;
    });
  }

  /**
   * Admin weekend payment board — who paid / who remains for one settlement
   * (Saturday, Sunday, or both matches rolled together).
   */
  async getAdminWeekendPaymentSummary(
    settlementId: string,
    actor: Actor,
  ): Promise<AdminWeekendPaymentSummary> {
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
      if (String(settlement.teamId) !== MVP_TEAM.id) {
        throw this.notFound("Settlement not found");
      }

      const week = weekendContainingDate(settlement.weekStartDate);
      const players = (await this.listAdminWeekendDues(actor)).filter(
        (row) => row.settlementId === String(settlement.id),
      );
      const unpaid = players.filter((row) => row.totalDueInr > 0);
      const paid = players.filter((row) => row.totalDueInr <= 0);

      const fixtures = await this.matches.listMatches({
        teamId: MVP_TEAM.id,
        fromDate: week.saturday,
        toDate: week.sunday,
        limit: 10,
        sortBy: "match_date",
        sortDirection: "asc",
      });

      const organizerPayouts = await this.ensureOrganizerPayouts(
        String(settlement.id),
      );
      const organizerPending = organizerPayouts.filter(
        (row) => row.status === "pending",
      );
      const reimbursements =
        await this.payments.listReimbursementsForSettlement(
          String(settlement.id),
        );
      const playersCollected =
        unpaid.length === 0 &&
        reimbursements.every((row) => row.status !== "pending");

      let settlementOut = settlement;
      if (playersCollected && organizerPending.length > 0) {
        await this.maybeRemindOrganizerPayout(String(settlement.id));
        settlementOut = await this.payments.findSettlementByIdOrThrow(
          String(settlement.id),
        );
      }

      const billedMatchIds = new Set(
        (
          await this.payments.listChargesForSettlement(String(settlement.id))
        ).map((c) => String(c.matchId)),
      );
      const billedFixtures = fixtures.items.filter((match) =>
        billedMatchIds.has(String(match.id)),
      );
      const matchRows = [];
      for (const match of billedFixtures.length > 0
        ? billedFixtures
        : fixtures.items) {
        let tournamentFeeForMatchInr = 0;
        if (match.classification === "tournament" && match.tournamentId) {
          const tournament = await this.matches.findTournamentById(
            String(match.tournamentId),
          );
          if (tournament) {
            tournamentFeeForMatchInr = tournamentMatchFeePoolInr(tournament);
          }
        }
        matchRows.push({
          matchId: String(match.id),
          matchDate: match.matchDate,
          opposition: match.opposition,
          classification: match.classification,
          matchFeesInr: match.matchFeesInr ?? 0,
          tournamentFeeForMatchInr,
        });
      }

      return {
        settlement: settlementOut,
        weekStartDate: week.saturday,
        weekEndDate: week.sunday,
        matches: matchRows,
        players,
        unpaid,
        paid,
        unpaidTotalInr: round2(
          unpaid.reduce((sum, row) => sum + row.totalDueInr, 0),
        ),
        paidTotalInr: round2(paid.reduce((sum, row) => sum + row.paidInr, 0)),
        billedTotalInr: round2(
          players.reduce((sum, row) => sum + row.billedInr, 0),
        ),
        organizerPayouts,
        playersCollected,
        organizerPayoutPendingInr: round2(
          organizerPending.reduce((sum, row) => sum + row.amountInr, 0),
        ),
      };
    });
  }

  /**
   * Admin group nudge — WhatsApp lists unpaid names; in-app goes to unpaid only.
   */
  async nudgeUnpaidWeekendPlayers(
    settlementId: string,
    actor: Actor,
  ): Promise<{ nudged: number }> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.NOTIFICATION_SEND);
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      nudgeUnpaidWeekendSchema.parse({ settlementId });

      const summary = await this.getAdminWeekendPaymentSummary(
        settlementId,
        actor,
      );
      const unpaid = summary.unpaid.filter((row) => !row.isCollector);
      if (unpaid.length === 0) {
        throw this.conflict("Everyone has paid for this weekend");
      }

      const range = `${summary.weekStartDate} – ${summary.weekEndDate}`;
      const names = unpaid
        .map((row) => displayFirstName(row.fullName))
        .filter(Boolean);
      const nameList = names.join(", ");
      const title = "Weekend fees unpaid";
      const body = `Still owed for ${range}: ${nameList}. Open Payments in Crease.`;

      const nudged = await broadcastTeamNotificationAction({
        type: "payment",
        title,
        body,
        data: { settlementId: String(summary.settlement.id) },
        adminOnly: true,
        userIds: unpaid.map((row) => row.userId),
      });

      const team = await this.teams.getMvpTeam();
      if (team.whatsappNotifyUrl) {
        try {
          await fetch(team.whatsappNotifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `Crease: weekend fees still unpaid (${range}). Still owed: ${nameList}. Open Payments.`,
            }),
          });
        } catch {
          // Non-blocking — never fail the Admin action on WhatsApp.
        }
      }

      return { nudged };
    });
  }

  async listPendingOrganizerPayouts(
    actor: Actor,
  ): Promise<SettlementOrganizerPayout[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      const open = await this.payments.listOpenSettlements(MVP_TEAM.id);
      const rows: SettlementOrganizerPayout[] = [];
      for (const settlement of open.items) {
        const payouts = await this.ensureOrganizerPayouts(
          String(settlement.id),
        );
        rows.push(...payouts.filter((row) => row.status === "pending"));
      }
      return rows;
    });
  }

  /**
   * Switch between one shared organizer for the weekend vs one per match.
   * Only rewrites pending rows — paid proofs are kept.
   */
  async setOrganizerPayoutMode(
    input: { settlementId: string; mode: "per_match" | "shared" },
    actor: Actor,
  ): Promise<SettlementOrganizerPayout[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      const parsed = setOrganizerPayoutModeSchema.parse(input);
      const settlement = await this.payments.findSettlementByIdOrThrow(
        parsed.settlementId,
      );
      if (settlement.status === "settled") {
        throw this.conflict("Settlement is already settled");
      }

      const existing = await this.payments.listOrganizerPayoutsForSettlement(
        parsed.settlementId,
      );
      if (existing.some((row) => row.status !== "pending")) {
        throw this.conflict(
          "Cannot change organizer mode after a payout proof is uploaded",
        );
      }

      await this.payments.deletePendingOrganizerPayouts(parsed.settlementId);
      return this.ensureOrganizerPayouts(parsed.settlementId, parsed.mode);
    });
  }

  async submitOrganizerPayoutProof(
    input: {
      payoutId: string;
      payeeName: string;
      utr: string;
      screenshotPath: string;
    },
    actor: Actor,
  ): Promise<SettlementOrganizerPayout> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      const parsed = submitOrganizerPayoutProofSchema.parse(input);
      const team = await this.teams.getMvpTeam();
      if (parsed.screenshotPath === DEMO_PAYMENT_PROOF_PATH && !team.demoMode) {
        throw this.forbidden("Demo payment proofs require demo mode");
      }
      const row = await this.payments.findOrganizerPayoutByIdOrThrow(
        parsed.payoutId,
      );
      if (row.status !== "pending") {
        throw this.conflict("Organizer payout is already recorded");
      }
      return this.payments.updateOrganizerPayout(row.id, {
        payee_name: parsed.payeeName,
        status: "offline_paid",
        utr: parsed.utr,
        screenshot_path: parsed.screenshotPath,
        paid_at: new Date().toISOString(),
        marked_paid_by: actor.actorId,
      });
    });
  }

  /**
   * Singular organizer for Sat + Sun — one UTR/screenshot covers every pending
   * payout row (or consolidates into a shared row first).
   */
  async submitSharedOrganizerPayoutProof(
    input: {
      settlementId: string;
      payeeName: string;
      utr: string;
      screenshotPath: string;
    },
    actor: Actor,
  ): Promise<SettlementOrganizerPayout[]> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.SETTLEMENT_MANAGE);
      const parsed = submitSharedOrganizerPayoutProofSchema.parse(input);
      const team = await this.teams.getMvpTeam();
      if (parsed.screenshotPath === DEMO_PAYMENT_PROOF_PATH && !team.demoMode) {
        throw this.forbidden("Demo payment proofs require demo mode");
      }

      const payouts = await this.ensureOrganizerPayouts(
        parsed.settlementId,
        "shared",
      );
      const pending = payouts.filter((row) => row.status === "pending");
      if (pending.length === 0) {
        throw this.conflict("No pending organizer payouts for this weekend");
      }

      const updated: SettlementOrganizerPayout[] = [];
      for (const row of pending) {
        updated.push(
          await this.payments.updateOrganizerPayout(row.id, {
            payee_name: parsed.payeeName,
            status: "offline_paid",
            utr: parsed.utr,
            screenshot_path: parsed.screenshotPath,
            paid_at: new Date().toISOString(),
            marked_paid_by: actor.actorId,
          }),
        );
      }
      return updated;
    });
  }

  /**
   * Create pending organizer payout stubs from billed **match (ground) fees**.
   * Tournament entry is prepaid by an Admin (credited on charges) — only
   * `matchFeesInr` (warmup full fee, or tournament ground fee) goes to
   * organizer payouts.
   */
  private async ensureOrganizerPayouts(
    settlementId: string,
    mode?: "per_match" | "shared",
  ): Promise<SettlementOrganizerPayout[]> {
    const existing =
      await this.payments.listOrganizerPayoutsForSettlement(settlementId);
    if (existing.some((row) => row.status !== "pending")) {
      return existing;
    }

    const charges = await this.payments.listChargesForSettlement(settlementId);
    const matchIds = [
      ...new Set(charges.map((charge) => String(charge.matchId))),
    ];
    const feeByMatch = new Map<string, number>();
    for (const matchId of matchIds) {
      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.classification === "tournament") {
        // Prepaid tournament pool is not paid onward; only separate match fees.
        const ground = match.matchFeesInr ?? 0;
        if (ground > 0) feeByMatch.set(matchId, round2(ground));
        continue;
      }
      let sum = 0;
      for (const charge of charges) {
        if (String(charge.matchId) !== matchId) continue;
        sum = round2(sum + charge.matchFeeShareInr);
      }
      if (sum > 0) feeByMatch.set(matchId, sum);
    }
    const matchAmounts = [...feeByMatch.entries()].filter(
      ([, amount]) => amount > 0,
    );
    if (matchAmounts.length === 0) {
      if (
        existing.length > 0 &&
        !existing.some((row) => row.status !== "pending")
      ) {
        await this.payments.deletePendingOrganizerPayouts(settlementId);
      }
      return this.payments.listOrganizerPayoutsForSettlement(settlementId);
    }

    const resolvedMode =
      mode ??
      (existing.some((row) => row.matchId == null)
        ? "shared"
        : existing.length > 0
          ? "per_match"
          : "per_match");

    if (existing.length > 0 && !mode) {
      return existing;
    }

    if (existing.length > 0) {
      await this.payments.deletePendingOrganizerPayouts(settlementId);
    }

    if (resolvedMode === "shared" || matchAmounts.length === 1) {
      const total = round2(
        matchAmounts.reduce((sum, [, amount]) => sum + amount, 0),
      );
      const matchId =
        matchAmounts.length === 1 && resolvedMode !== "shared"
          ? matchAmounts[0]![0]
          : null;
      await this.payments.createOrganizerPayout({
        settlement_id: settlementId,
        team_id: MVP_TEAM.id,
        match_id: matchId,
        amount_inr: total,
        status: "pending",
      });
    } else {
      for (const [matchId, amount] of matchAmounts) {
        await this.payments.createOrganizerPayout({
          settlement_id: settlementId,
          team_id: MVP_TEAM.id,
          match_id: matchId,
          amount_inr: amount,
          status: "pending",
        });
      }
    }

    return this.payments.listOrganizerPayoutsForSettlement(settlementId);
  }

  /**
   * Warmup: matchFees only.
   * Tournament: prepaid tournament pool + separate match (ground) fees.
   */
  private async resolvePlayerFeePoolInr(match: {
    classification: string;
    tournamentId: unknown;
    matchFeesInr: number | null;
  }): Promise<number> {
    const matchFees = match.matchFeesInr ?? 0;
    if (match.classification !== "tournament" || !match.tournamentId) {
      return matchFees;
    }
    const tournament = await this.matches.findTournamentById(
      String(match.tournamentId),
    );
    if (!tournament) {
      throw this.notFound("Tournament not found for fee calculation");
    }
    return round2(matchFees + tournamentMatchFeePoolInr(tournament));
  }

  /** When every planned tournament match has fees settled, move it to Past. */
  private async archiveTournamentsIfFullySettled(
    matchIds: string[],
  ): Promise<void> {
    const matches = await this.matches.listMatchesByIds(matchIds);
    const tournamentIds = [
      ...new Set(
        matches
          .filter((m) => m.classification === "tournament" && m.tournamentId)
          .map((m) => String(m.tournamentId)),
      ),
    ];
    for (const tournamentId of tournamentIds) {
      const tournament = await this.matches.findTournamentById(tournamentId);
      if (
        !tournament ||
        tournament.status === "cancelled" ||
        tournament.status === "completed"
      ) {
        continue;
      }
      const fixtures =
        await this.matches.listMatchesForTournament(tournamentId);
      const settledCount = fixtures.filter(
        (m) => m.status !== "cancelled" && m.feesSettledAt,
      ).length;
      if (
        tournament.plannedMatchCount > 0 &&
        settledCount >= tournament.plannedMatchCount
      ) {
        await this.matches.updateTournament(tournamentId, {
          status: "completed",
        });
      }
    }
  }

  /**
   * When players (and driver reimbursements) are clear but organizer payouts
   * remain, remind Admins once to upload organizer payment screenshots.
   */
  private async maybeRemindOrganizerPayout(
    settlementId: string,
  ): Promise<void> {
    const settlement =
      await this.payments.findSettlementByIdOrThrow(settlementId);
    if (settlement.status === "settled") return;
    if (settlement.organizerPayoutRemindedAt) return;

    const charges = await this.payments.listChargesForSettlement(settlementId);
    if (charges.some((c) => c.status === "pending" && c.totalInr > 0)) return;

    const reimbursements =
      await this.payments.listReimbursementsForSettlement(settlementId);
    if (reimbursements.some((r) => r.status === "pending")) return;

    const payouts = await this.ensureOrganizerPayouts(settlementId);
    const pending = payouts.filter((row) => row.status === "pending");
    if (pending.length === 0) return;

    const claimed = await this.payments.updateSettlement(settlement.id, {
      organizer_payout_reminded_at: new Date().toISOString(),
    });
    if (!claimed.organizerPayoutRemindedAt) return;

    const total = round2(pending.reduce((sum, row) => sum + row.amountInr, 0));
    const range = `${settlement.weekStartDate}`;

    await broadcastTeamNotificationAction({
      type: "payment",
      title: "Upload organizer payment proof",
      body: `Player fees for ${range} are collected. Upload UTR + screenshot of the ₹${total} payout to the organizer(s) in Payments.`,
      data: { settlementId, event: "organizer_payout_reminder" },
      adminOnly: true,
      recipients: "admins",
    });

    const team = await this.teams.getMvpTeam();
    if (team.whatsappNotifyUrl) {
      try {
        await fetch(team.whatsappNotifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `Crease Admin: player fees collected for ${range}. Upload organizer payment proof (₹${total}) in Crease Payments.`,
          }),
        });
      } catch {
        // Non-blocking
      }
    }
  }
}

export function createBrowserPaymentService(): PaymentService {
  return new PaymentService(
    createBrowserPaymentRepository(),
    createBrowserMatchRepository(),
    createBrowserTeamRepository(),
  );
}
